import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { registerHooks, stripTypeScriptTypes } from "node:module";

// Exercise the actual owned scheduling loop, replacing only React's effect
// installation and the browser clock boundary. No rendering or wall-clock wait.
const hooks = registerHooks({
  resolve(specifier, context, next) {
    if (specifier === "react" && context.parentURL?.endsWith("/shared/useAnimation.ts")) {
      return { url: "animation-test:react", shortCircuit: true };
    }
    return next(specifier, context);
  },
  load(url, context, next) {
    if (url === "animation-test:react") {
      return { format: "module", shortCircuit: true, source: `
        export const effects = [];
        export const useRef = value => ({ current: value });
        export const useLayoutEffect = run => run();
        export const useEffect = run => effects.push(run);
      ` };
    }
    if (url.endsWith("/shared/useAnimation.ts")) {
      return { format: "module", shortCircuit: true,
        source: stripTypeScriptTypes(readFileSync(new URL(url), "utf8"), { mode: "transform" }) };
    }
    return next(url, context);
  },
});
const { useAnimation } = await import("../src/shared/useAnimation.ts");
const boundary = await import("animation-test:react");
hooks.deregister();

function withClock(run) {
  const keys = ["document", "performance", "requestAnimationFrame", "cancelAnimationFrame", "setTimeout", "clearTimeout"];
  const saved = new Map(keys.map(key => [key, Object.getOwnPropertyDescriptor(globalThis, key)]));
  const frames = new Map();
  const timers = new Map();
  const listeners = new Map();
  let now = 1000;
  let next = 0;
  const document = {
    hidden: false,
    addEventListener: (name, listener) => listeners.set(name, listener),
    removeEventListener: (name, listener) => {
      if (listeners.get(name) === listener) listeners.delete(name);
    },
  };
  const install = (key, value) => Object.defineProperty(globalThis, key, { configurable: true, value });
  install("document", document);
  install("performance", { now: () => now });
  install("requestAnimationFrame", callback => { const id = ++next; frames.set(id, callback); return id; });
  install("cancelAnimationFrame", id => frames.delete(id));
  install("setTimeout", (callback, delay) => {
    assert.equal(delay, 250, "background polling must remain bounded");
    const id = ++next;
    timers.set(id, callback);
    return id;
  });
  install("clearTimeout", id => timers.delete(id));
  const fire = (pending, at) => {
    now = at;
    assert.equal(pending.size, 1, "only one scheduling lane may be live");
    const [id, callback] = pending.entries().next().value;
    pending.delete(id);
    callback(now);
  };
  try {
    run({
      frames, timers, listeners,
      frame: at => fire(frames, at),
      timer: at => fire(timers, at),
      visibility: (hidden, at) => {
        now = at;
        document.hidden = hidden;
        listeners.get("visibilitychange")();
      },
    });
  } finally {
    boundary.effects.length = 0;
    for (const [key, descriptor] of saved) {
      if (descriptor) Object.defineProperty(globalThis, key, descriptor);
      else delete globalThis[key];
    }
  }
}

test("a playing lesson keeps elapsed time across throttled hidden ticks and cancels both scheduling lanes", () => {
  withClock(clock => {
    const ticks = [];
    useAnimation((delta, elapsed, visible) => ticks.push({ delta, elapsed, visible }), true, { preserveElapsed: true });
    const dispose = boundary.effects.pop()();
    clock.frame(1016);
    clock.visibility(true, 1100);
    assert.equal(clock.frames.size, 0);
    clock.timer(2100); // Simulate browser throttling, not a real one-second wait.
    clock.visibility(false, 2500);
    assert.equal(clock.timers.size, 0);
    assert.deepEqual(ticks.map(tick => tick.visible), [true, true, false, false, true]);
    assert.ok(Math.abs(ticks.at(-1).elapsed - 1.5) < 1e-9, "background time cannot be thrown away");
    assert.equal(ticks[3].delta, 1);
    dispose();
    assert.equal(clock.frames.size + clock.timers.size + clock.listeners.size, 0);
  });
});

test("ordinary visible simulations keep their step cap without losing tab-transition time", () => {
  withClock(clock => {
    const ticks = [];
    useAnimation(delta => ticks.push(delta));
    const dispose = boundary.effects.pop()();
    clock.frame(1300);
    clock.visibility(true, 1600);
    clock.visibility(false, 1900);
    assert.deepEqual(ticks, [0, .05, .3, .3]);
    dispose();
    useAnimation(() => assert.fail("paused playback must not tick"), false);
    assert.equal(boundary.effects.pop()(), undefined);
    assert.equal(clock.frames.size + clock.timers.size + clock.listeners.size, 0);
  });
});
