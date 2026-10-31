import test from "node:test";
import assert from "node:assert/strict";
import { patchAlgebraColoringPlaybackControl } from "./algebra-coloring-magic-playback-control.mjs";

const variants = [
  ["algebra", "transform", 41], ["algebra", "quadratic", 63],
  ...["two-plane", "segment", "equilateral", "three-plane"].flatMap(id =>
    ["en", "ru"].map(locale => ["coloring", `coloring-${id}:${locale}`, id === "three-plane" ? 23 : 22])),
];
function fixture(sprite, compact) {
  const source = `export async function createTimeline(canvas) {
    function sprite${sprite}(context, color, frame, ratio, time) { frame %= 2; return frame; }
    return { draw(frame) { return [sprite${sprite}(null,null,frame,0,0),frame % 3]; },
      dispose() { canvas.disposed = true; } };
  }`;
  return compact ? source.replace(/\s+/g, " ") : source;
}
for (const compact of [false, true]) {
  test(`algebra and localized coloring ${compact ? "compact" : "readable"} source Play/Pause follows the player, not frame parity`, async () => {
    for (const [family, key, sprite] of variants) {
      const source = patchAlgebraColoringPlaybackControl(fixture(sprite, compact), family, key);
      assert.equal(patchAlgebraColoringPlaybackControl(source, family, key), source);
      const module = await import(`data:text/javascript;base64,${Buffer.from(source).toString("base64")}`);
      const canvas = {}, renderer = await module.createTimeline(canvas), other = await module.createTimeline({});
      assert.deepEqual(renderer.draw(17), [0, 2]);
      renderer.setPlaybackState(true);
      assert.deepEqual(renderer.draw(18), [1, 0]);
      assert.deepEqual(renderer.draw(19), [1, 1]);
      assert.deepEqual(other.draw(19), [0, 1]);
      renderer.setPlaybackState(false);
      assert.deepEqual(renderer.draw(20), [0, 2]);
      renderer.dispose();
      assert.equal(canvas.disposed, true);
    }
  });
}
test("unreviewed magic transports, unknown sources and incomplete playback patches fail closed", () => {
  assert.throws(() => patchAlgebraColoringPlaybackControl(fixture(22), "magic", "hourglasses:en"), /reviewed/);
  assert.throws(() => patchAlgebraColoringPlaybackControl(fixture(41), "algebra", "quadratic"), /ownership/);
  assert.throws(() => patchAlgebraColoringPlaybackControl(fixture(41), "__proto__", "transform"), /reviewed/);
  assert.throws(() => patchAlgebraColoringPlaybackControl(
    fixture(41).replace("frame %= 2;", "let familyPlaybackPlaying; frame %= 2;"), "algebra", "transform"), /Partial/);
});
