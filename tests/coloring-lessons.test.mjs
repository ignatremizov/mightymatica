import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import { cubeLessonStops, coloringHintFrame, coloringHintSound } from "../src/modules/coloring/lessonRules.ts";
import { createLessonClock, enterLessonFrame, advanceLessonClock, validateOriginalLesson } from "../src/shared/OriginalLesson.ts";

const root = new URL("../", import.meta.url);
async function recovery(file) {
  return JSON.parse(await readFile(new URL(`src/modules/coloring/${file}.json`, root), "utf8"));
}
function cubeDefinition(data, locale) {
  return { ...data, initialFrame: 1, endFrame: 167,
    chapters: [{ id: "cube", startFrame: 1, endFrame: 194, module: "cube.mjs" }],
    stops: cubeLessonStops(locale) };
}

test("cube playback cannot leave the source question until the correct branch is selected", async () => {
  const data = await recovery("cube-audio-en");
  const lesson = cubeDefinition(data, "en");
  validateOriginalLesson(lesson);
  const clock = createLessonClock(lesson);
  for (let i = 0; i < 200; i++) advanceLessonClock(clock, .25, lesson, 194, () => {});
  assert.equal(clock.frame, 1);
  assert.equal(clock.waiting.frame, 1);
  const visited = [];
  clock.waiting = null;
  enterLessonFrame(clock, 3, lesson, frame => visited.push(frame));
  while (clock.frame < 91) advanceLessonClock(clock, 1 / 24, lesson, 194, frame => visited.push(frame));
  assert.ok(!visited.includes(2), "the correct-answer branch skips the unselected root cue");
  assert.equal(clock.hold, 2.5);
  assert.equal(visited.at(-1), 91);
});

test("cube quarter-turn narration retains the complete chained Timer hold", async () => {
  for (const locale of ["en", "ru"]) {
    const lesson = cubeDefinition(await recovery(`cube-audio-${locale}`), locale);
    validateOriginalLesson(lesson);
    const clock = createLessonClock(lesson);
    clock.waiting = null;
    enterLessonFrame(clock, 164, lesson, () => {});
    for (let i = 0; i < 103; i++) advanceLessonClock(clock, .25, lesson, 194, () => {});
    assert.equal(clock.frame, 164, "do not advance after only the first 4.5-second turn");
    assert.ok(clock.hold > 0);
    for (let i = 0; i < 2; i++) advanceLessonClock(clock, .25, lesson, 194, () => {});
    assert.equal(clock.frame, 165);
    assert.ok(clock.hold <= (locale === "ru" ? 3 : 6));
  }
});

test("every coloring soundtrack is the exact recovered payload and every button cue has an asset", async () => {
  const sources = [
    ["cube-audio-en", 36], ["cube-audio-ru", 36],
    ...["Recthexprizm-colorproblem", "Tetra-colorproblem", "brick-colorproblem", "paralele-colorproblem"]
      .flatMap(name => [[`audio-${name}`, null], [`audio-${name}-ru`, null]]),
    ...[
      ["coloring-two-plane", "Twocolorplane-eng", "Twocolorplane"],
      ["coloring-segment", "Twocolorplaneseg-en", "Twocolorplaneseg-ru"],
      ["coloring-equilateral", "Twocoloreqtri-eng", "Twocoloreqtri-ru"],
      ["coloring-three-plane", "Threecolorplane-eng", "Threecolorplane-ru"],
    ].flatMap(([id, en, ru]) => [
      [`audio-${en}`, coloringHintSound(id, "en")],
      [`audio-${ru}`, coloringHintSound(id, "ru")],
    ]),
  ];
  for (const [file, buttonSound] of sources) {
    const data = await recovery(file);
    assert.equal(data.inventoryOnly, false);
    assert.ok(data.audioCues.length > 0);
    assert.ok(data.nestedTimelines.every(timeline => timeline.audioCues.length === 0));
    if (buttonSound) assert.ok(data.audioAssets.some(asset => asset.soundId === buttonSound), file);
    for (const asset of data.audioAssets) {
      const bytes = await readFile(new URL(`public/media/${asset.src}`, root));
      assert.equal(createHash("sha256").update(bytes).digest("hex"), asset.embeddedMp3Sha256, asset.src);
    }
  }
  assert.equal(coloringHintFrame("coloring-three-plane"), 347);
  assert.equal(coloringHintFrame("coloring-segment"), 321);
});
