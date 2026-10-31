import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { patchMotionFractalPlaybackControl as patch } from "./motion-fractal-playback-control.mjs";

const configurations = [
  ["motion", "caterpillar", "en", 43], ["motion", "caterpillar", "ru", 43],
  ["motion", "cyclists", "en", 63], ["motion", "cyclists", "ru", 63], ["motion", "cyclists", "zh", 63],
  ["fractals", "buffon", "en", 44], ["fractals", "buffon", "ru", 41],
];
function fixture(sprite, compact) {
  const source = `export async function createTimeline(canvas) {
    function sprite${sprite}(ctx,color,frame,ratio,time) { frame %= 2; return frame; }
    function sprite999(ctx,color,frame,ratio,time) { return frame % 7; }
    return {
      draw(frame) { return [sprite${sprite}(null,null,frame,0,0),sprite999(null,null,frame,0,0)]; },
      dispose() { canvas.disposed = true; }
    };
  }`;
  return compact ? source.replace(/\s+/g, " ") : source;
}
for (const compact of [false, true]) {
  test(`motion/fractal ${compact ? "compact" : "readable"} transport follows Play/Pause without freezing other animation`, async () => {
    for (const [family, id, locale, sprite] of configurations) {
      const source = patch(fixture(sprite, compact), family, id, locale);
      assert.equal(patch(source, family, id, locale), source);
      const module = await import(`data:text/javascript;base64,${Buffer.from(source).toString("base64")}`);
      const canvas = {}, renderer = await module.createTimeline(canvas), independent = await module.createTimeline({});
      assert.deepEqual(renderer.draw(17), [0, 3]);
      renderer.setPlaybackState(true);
      assert.deepEqual(renderer.draw(18), [1, 4]);
      assert.deepEqual(renderer.draw(19), [1, 5]);
      assert.deepEqual(independent.draw(19), [0, 5]);
      renderer.setPlaybackState(false);
      assert.deepEqual(renderer.draw(19), [0, 5]);
      renderer.dispose();
      assert.equal(canvas.disposed, true);
    }
  });
}
test("unreviewed sources and incomplete transport patches are rejected", () => {
  assert.throws(() => patch(fixture(43), "motion", "coin-cluster", "en"), /reviewed/);
  assert.throws(() => patch(fixture(43), "motion", "caterpillar", "zh"), /reviewed/);
  assert.throws(() => patch(fixture(43), "fractals", "carpet", "en"), /reviewed/);
  assert.throws(() => patch(fixture(43), "__proto__", "constructor", "en"), /reviewed/);
  assert.throws(() => patch(fixture(63), "motion", "caterpillar", "en"), /ownership/);
  assert.throws(() => patch(fixture(43).replace("return {", "let motionFractalPlaybackPlaying = false; return {"),
    "motion", "caterpillar", "en"), /Partial/);
});

test("recovered transport spans follow source placements, not entire drawing chapters or answer gates", async () => {
  for (const family of ["motion", "fractals"]) {
    const controls = JSON.parse(await readFile(new URL(`../src/modules/${family}/source-controls.json`, import.meta.url), "utf8"));
    const lessons = JSON.parse(await readFile(new URL(`../src/modules/${family}/native-lessons.json`, import.meta.url), "utf8"));
    for (const [id, variants] of Object.entries(controls)) for (const [locale, source] of Object.entries(variants)) {
      const lesson = lessons[id][locale];
      assert.equal(source.source, lesson.source);
      assert.equal(source.sourceSha256, lesson.sourceSha256);
      assert.deepEqual(source.playbackHotspots.map(hit => [hit.firstFrame, hit.lastFrame]),
        source.evidence.placements.filter(placement => placement.id === "pp").map(placement => [placement.startFrame, placement.endFrame]));
      if (lesson.gate) {
        assert.ok(source.playbackHotspots.every(hit => hit.lastFrame < lesson.gate[0]),
          "A transport hit area must not cover the source question or wrong-answer branch.");
      }
      if (family === "fractals") for (const stop of lesson.lesson.stops) {
        assert.ok(source.playbackHotspots.some(hit => stop.frame >= hit.firstFrame && stop.frame <= hit.lastFrame),
          "Every Buffon demonstration resumes from its painted source Play.");
      }
    }
  }
});
