import { test } from "node:test";
import assert from "node:assert/strict";
import { localizeFontFill } from "./canvas-font-locals.mjs";

test("reviewed exporter font fill becomes local without relaxing drawing audits", () => {
  const original = "function font21(ctx,ch,textColor){\r\n\tdefaultFill = textColor;\r\n}";
  const converted = localizeFontFill(original);
  assert.match(converted, /var defaultFill = textColor;/);
  assert.equal(localizeFontFill(converted), converted);
  assert.equal(localizeFontFill("defaultFill = textColor;"), "defaultFill = textColor;");
});

// Execute the real reviewed generated renderer, not a reimplementation. Only
// platform drawing/image boundaries are inert: this detects JavaScript errors,
// not rendering fidelity, decoding failures, or browser Canvas behavior.
function canvasFixture() {
  const canvas = { width: 1, height: 1, style: {} };
  const noop = () => {};
  const context = { canvas };
  for (const key of ["save", "restore", "scale", "rotate", "translate", "transform",
    "setTransform", "resetTransform", "clearRect", "fillRect", "drawImage",
    "beginPath", "moveTo", "lineTo", "quadraticCurveTo", "bezierCurveTo",
    "closePath", "fill", "stroke", "clip", "putImageData"]) context[key] = noop;
  context.getImageData = () => ({ data: new Uint8ClampedArray(4) });
  context.createImageData = context.getImageData;
  context.createPattern = () => ({ setTransform: noop });
  context.createLinearGradient = () => ({ addColorStop: noop });
  context.createRadialGradient = context.createLinearGradient;
  canvas.getContext = () => context;
  return canvas;
}

test("paradox arrangements and bills playback draw through original font calls without leaking globals", async () => {
  const previousDocument = Object.getOwnPropertyDescriptor(globalThis, "document");
  const previousFill = Object.getOwnPropertyDescriptor(globalThis, "defaultFill");
  globalThis.document = { createElement(tag) {
    assert.ok(tag === "canvas" || tag === "img");
    return tag === "canvas" ? canvasFixture() : {
      width: 1, height: 1, decode: async () => {}, removeAttribute() {},
    };
  } };
  try {
    for (const locale of ["en", "ru"]) {
      for (const [path, frames] of [
        [`reasoning/native/paradox-${locale}.mjs`,
          [61, 281, 502, 504, 720, 936, 938, 1147, 1356, 1358, 1564, 1771,
            1773, 2075, 2378, 2380, 2532, 2684, 2686, 2930, 3174,
            3176, 3328, 3481, 3483, 3802, 4121]],
        [`dissections/bills-${locale}.mjs`, [1, 6, 9, 100, 250, 494, 750, 988]],
      ]) {
        const module = await import(new URL(`../public/media/${path}`, import.meta.url));
        const renderer = await module.createTimeline(canvasFixture());
        try {
          for (const frame of frames) {
            assert.doesNotThrow(() => renderer.draw(frame), `${path}, frame ${frame}`);
          }
        } finally { renderer.dispose(); }
      }
    }
    assert.deepEqual(Object.getOwnPropertyDescriptor(globalThis, "defaultFill"), previousFill);
  } finally {
    if (previousDocument) Object.defineProperty(globalThis, "document", previousDocument);
    else delete globalThis.document;
  }
});
