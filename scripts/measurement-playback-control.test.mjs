import test from "node:test";
import assert from "node:assert/strict";
import { patchMeasurementPlaybackControl } from "./measurement-playback-control.mjs";

const configurations = [
  ["area", "en", [15]], ["area", "ru", [15, 114]],
  ["polygon", "en", [16]], ["polygon", "ru", [16]],
  ["circle", "en", [21, 195]], ["circle", "ru", [21, 176]],
];
function fixture(sprites, compact) {
  const source = `export async function createTimeline(canvas) {
    ${sprites.map(id => `function sprite${id}(ctx,color,frame,ratio,time) { frame %= 2; return frame; }`).join("\n")}
    function other(frame) { return frame % 3; }
    return {
      draw(frame) { return [${sprites.map(id => `sprite${id}(null,null,frame,0,0)`).join(",")},other(frame)]; },
      dispose() { canvas.disposed = true; }
    };
  }`;
  return compact ? source.replace(/\s+/g, " ") : source;
}
for (const compact of [false, true]) {
  test(`measurement ${compact ? "compact" : "readable"}: every source transport follows selection without stopping other animation`, async () => {
    for (const [id, locale, sprites] of configurations) {
      const source = patchMeasurementPlaybackControl(fixture(sprites, compact), id, locale);
      assert.equal(patchMeasurementPlaybackControl(source, id, locale), source);
      const module = await import(`data:text/javascript;base64,${Buffer.from(source).toString("base64")}`);
      const canvas = {}, renderer = await module.createTimeline(canvas), other = await module.createTimeline({});
      assert.deepEqual(renderer.draw(17), [...sprites.map(() => 0), 2]);
      renderer.setPlaybackState(true);
      assert.deepEqual(renderer.draw(18), [...sprites.map(() => 1), 0]);
      assert.deepEqual(renderer.draw(19), [...sprites.map(() => 1), 1]);
      assert.deepEqual(other.draw(19), [...sprites.map(() => 0), 1]);
      renderer.setPlaybackState(false);
      assert.deepEqual(renderer.draw(19), [...sprites.map(() => 0), 1]);
      renderer.dispose();
      assert.equal(canvas.disposed, true);
    }
  });
}
test("measurement source patch refuses incomplete sprite coverage and unknown source variants", () => {
  assert.throws(() => patchMeasurementPlaybackControl(fixture([15], false), "area", "ru"), /ownership/);
  assert.throws(() => patchMeasurementPlaybackControl(fixture([15], false), "area", "constructor"), /reviewed/);
  assert.throws(() => patchMeasurementPlaybackControl(fixture([15], false), "__proto__", "en"), /reviewed/);
});
