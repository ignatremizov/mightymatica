import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { createLessonClock, advanceLessonClock, enterLessonFrame, validateOriginalLesson } from "../src/shared/OriginalLesson.ts";
import { motionSourceFlow } from "../src/modules/motion/lessonRules.ts";

const sources = JSON.parse(await readFile(new URL("../src/modules/motion/native-lessons.json", import.meta.url), "utf8"));
const controls = JSON.parse(await readFile(new URL("../src/modules/motion/source-controls.json", import.meta.url), "utf8"));

test("motion questions cannot continue or play narration into an answer branch", () => {
  for (const [id, variants] of Object.entries(sources)) for (const { lesson, gate } of Object.values(variants)) {
    if (!gate) continue;
    const flow = motionSourceFlow(id, lesson, gate, "Retry");
    validateOriginalLesson(flow.lesson);
    const clock = createLessonClock(flow.lesson);
    const visited = [];
    for (let tick = 0; tick < 250; tick++) advanceLessonClock(clock, .25, flow.lesson, lesson.endFrame,
      frame => visited.push(frame));
    assert.equal(clock.frame, gate[0]);
    assert.equal(clock.waiting.frame, gate[0]);
    assert.ok(visited.every(frame => frame <= gate[0]));
    assert.equal(flow.actions[gate[0]].length, 4);
  }
});

test("retry and correct motion branches retain their distinct source frames and sounds", () => {
  for (const [id, variants] of Object.entries(sources)) for (const { lesson, gate } of Object.values(variants)) {
    if (!gate) continue;
    const flow = motionSourceFlow(id, lesson, gate, "Retry");
    const choices = flow.actions[gate[0]];
    assert.equal(choices.filter(choice => choice.targetFrame === gate[3]).length, 1);
    assert.equal(choices.filter(choice => choice.targetFrame === gate[1]).length, 3);
    const clock = createLessonClock(flow.lesson);
    enterLessonFrame(clock, gate[1], flow.lesson, () => {});
    for (let tick = 0; tick < 50; tick++) advanceLessonClock(clock, .25, flow.lesson, lesson.endFrame, () => {});
    assert.equal(clock.frame, gate[2]);
    assert.equal(clock.waiting.frame, gate[2]);
    assert.equal(flow.actions[gate[2]][0].targetFrame, gate[0]);
  }
  assert.deepEqual(sources["two-coins"].en.gate, [183, 203, 205, 206]);
  assert.deepEqual(sources["square-coin"].ru.gate, [261, 281, 283, 284]);
});

test("motion source Hint stops remain optional and do not invent answer gates", () => {
  for (const [id, frames] of [["coin-cluster", [1257]], ["earth-belt", [580]], ["caterpillar", [518, 519]]]) {
    for (const { lesson, gate } of Object.values(sources[id])) {
      validateOriginalLesson(lesson);
      assert.equal(gate, undefined);
      assert.deepEqual(lesson.stops.map(stop => stop.frame), frames);
    }
  }
  assert.equal(sources.cyclists.zh.source, "Movies/Byciclist-chi.swf");
  assert.equal(sources.cyclists.zh.lesson.endFrame, 843);
  assert.equal(sources.ladder, undefined);
  assert.equal(sources["circle-in-circle"], undefined);
});

test("painted motion Hint resumes the current source stop without skipping the Caterpillar Play gate", () => {
  for (const id of ["coin-cluster", "caterpillar"]) for (const [locale, source] of Object.entries(controls[id])) {
    const { lesson, gate } = sources[id][locale];
    assert.equal(gate, undefined);
    for (const [frameText, hotspot] of Object.entries(source.stopHotspots)) {
      const frame = Number(frameText);
      assert.equal(hotspot.sourceArtwork, true);
      assert.ok(source.evidence.placements.some(placement => placement.id === "bHint"
        && placement.resumeFrames.includes(frame)), "Only a proven root.play Hint gets a simple continue hit area.");
      const clock = createLessonClock(lesson);
      enterLessonFrame(clock, frame, lesson, () => {});
      advanceLessonClock(clock, .25, lesson, lesson.endFrame, () => {});
      assert.equal(clock.waiting.frame, frame);
      // The existing player's continue action releases this stop; it never seeks.
      clock.waiting = null;
      advanceLessonClock(clock, .25, lesson, lesson.endFrame, () => {});
      assert.ok(clock.frame > frame);
      if (id === "caterpillar") {
        assert.equal(clock.frame, frame + 1);
        assert.equal(clock.waiting.frame, frame + 1);
      }
    }
  }
});
