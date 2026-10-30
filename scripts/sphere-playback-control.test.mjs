import test from "node:test";
import assert from "node:assert/strict";
import { patchSpherePlaybackControl } from "./sphere-playback-control.mjs";

// Synthetic drawing code only: no recovered exporter JavaScript is executed.
function fixture(locale, compact) {
  const name = locale === "en" ? "sprite32" : "sprite40";
  const source = `
export async function createTimeline(canvas) {
  function ${name}(ctx, color, frame, ratio, time) { frame %= 2; return frame; }
  function unrelated(ctx, color, frame) { return frame % 7; }
  return {
    draw(frame) { return [${name}(null, null, frame, 0, 0), unrelated(null, null, frame)]; },
    dispose() { canvas.disposed = true; }
  };
}`;
  return compact ? source.replace(/\s+/g, " ") : source;
}

for (const locale of ["en", "ru"]) for (const compact of [false, true]) {
  test(`${locale} ${compact ? "compact" : "readable"}: transport selection is stable across root frames and isolated per renderer`, async () => {
    const source = fixture(locale, compact);
    const patched = patchSpherePlaybackControl(source, locale);
    assert.equal(patchSpherePlaybackControl(patched, locale), patched);
    const renamed = patched.replaceAll("spherePlaybackPlaying", "selected");
    assert.equal(patchSpherePlaybackControl(renamed, locale), renamed);
    const module = await import(`data:text/javascript;base64,${Buffer.from(patched).toString("base64")}`);
    const canvas = {}, renderer = await module.createTimeline(canvas);
    const other = await module.createTimeline({});
    assert.deepEqual(renderer.draw(1441), [0, 6]);
    assert.deepEqual(renderer.draw(1442), [0, 0]);
    renderer.setPlaybackState(true);
    assert.deepEqual(renderer.draw(1441), [1, 6]);
    assert.deepEqual(renderer.draw(1442), [1, 0]);
    assert.deepEqual(other.draw(1441), [0, 6]);
    renderer.setPlaybackState(false);
    assert.deepEqual(renderer.draw(1442), [0, 0]);
    renderer.dispose();
    assert.equal(canvas.disposed, true);
  });
}

test("an unexpected source or partial playback patch fails closed", () => {
  assert.throws(() => patchSpherePlaybackControl(fixture("en", false), "ru"), /ownership/);
  assert.throws(() => patchSpherePlaybackControl(fixture("en", false), "other"), /reviewed/);
  assert.throws(() => patchSpherePlaybackControl(fixture("en", false).replace("frame %= 2;", "let spherePlaybackPlaying; frame %= 2;"), "en"), /Partial/);
});
