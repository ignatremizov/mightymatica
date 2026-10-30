import test from "node:test";
import assert from "node:assert/strict";
import { patchCalculusPlaybackControl } from "./calculus-playback-control.mjs";

function fixture(locale, compact = false) {
  const sprite = locale === "en" ? "sprite190" : "sprite117";
  const source = `export async function createTimeline(canvas) {
    function ${sprite}(ctx, color, frame, ratio, time) { frame %= 2; return frame; }
    return { draw(frame) { return [${sprite}(null,null,frame,0,0), frame % 7]; },
      dispose() { canvas.disposed = true; } };
  }`;
  return compact ? source.replace(/\s+/g, " ") : source;
}
for (const locale of ["en", "ru"]) for (const compact of [false, true]) {
  test(`${locale} ${compact ? "compact" : "readable"} transport stays selected while lesson frames advance`, async () => {
    const source = patchCalculusPlaybackControl(fixture(locale, compact), locale);
    assert.equal(patchCalculusPlaybackControl(source, locale), source);
    const module = await import(`data:text/javascript;base64,${Buffer.from(source).toString("base64")}`);
    const canvas = {}, renderer = await module.createTimeline(canvas);
    const other = await module.createTimeline({});
    assert.deepEqual(renderer.draw(17), [0, 3]);
    renderer.setPlaybackState(true);
    assert.deepEqual(renderer.draw(18), [1, 4]);
    assert.deepEqual(renderer.draw(19), [1, 5]);
    assert.deepEqual(other.draw(19), [0, 5]);
    renderer.setPlaybackState(false);
    assert.deepEqual(renderer.draw(20), [0, 6]);
    renderer.dispose();
    assert.equal(canvas.disposed, true);
  });
}
test("unknown source and incomplete patches fail closed", () => {
  assert.throws(() => patchCalculusPlaybackControl(fixture("en"), "ru"), /ownership/);
  assert.throws(() => patchCalculusPlaybackControl(fixture("en"), "__proto__"), /reviewed/);
  assert.throws(() => patchCalculusPlaybackControl(
    fixture("en").replace("frame %= 2;", "let calculusPlaybackPlaying; frame %= 2;"), "en"), /Partial/);
});
