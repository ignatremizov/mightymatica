import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { interactiveLesson } from "../src/modules/kids/lessonRules.ts";
import { validateOriginalLesson, createLessonClock, advanceLessonClock, enterLessonFrame } from "../src/shared/OriginalLesson.ts";

const read = name => JSON.parse(readFileSync(new URL(`../src/modules/kids/${name}.json`, import.meta.url), "utf8"));
const audio = read("audio");
const stages = read("lesson-stages");
const boards = read("recovered");

test("every original kids board gates its source film until an authorized success branch", () => {
  let count = 0;
  for (const [id, source] of Object.entries(audio)) {
    const gates = stages[id].stages;
    const lesson = interactiveLesson(source, id, gates);
    validateOriginalLesson(lesson);
    const clock = createLessonClock(lesson);
    const visit = () => {};
    const runToStop = () => {
      for (let ticks = 0; !clock.waiting && !clock.complete && ticks < 1000; ticks++) {
        advanceLessonClock(clock, .25, lesson, lesson.endFrame, visit);
      }
    };
    runToStop();
    for (let index = 0; index < gates.length; index++) {
      const gate = gates[index];
      assert.equal(clock.waiting?.frame, boards[id].stages[index].frame, `${id} stage ${index + 1}`);
      advanceLessonClock(clock, .25, lesson, lesson.endFrame, visit);
      assert.equal(clock.frame, gate.frame, "ordinary playback cannot reveal the source answer");
      assert.ok(gate.successFrame > gate.frame);
      assert.ok(gate.successFrame < (gates[index + 1]?.frame ?? lesson.endFrame));
      clock.waiting = null; // Only the native board's verified completion grants this action.
      enterLessonFrame(clock, gate.successFrame, lesson, visit);
      runToStop();
      count++;
    }
    assert.equal(clock.complete, true);
  }
  assert.equal(count, 98);
});

test("missing-picture button sounds retain source-specific feedback without flattening sprite clocks", () => {
  for (const stage of stages["kids-find-proper"].stages) {
    const buttons = stage.buttonCues;
    const correct = buttons.find(button => button.pictureId === "Correct");
    assert.equal(correct.soundId, 24);
    assert.ok(buttons.some(button => button.pictureId.startsWith("Wrong")));
    for (const button of buttons.filter(button => button.pictureId.startsWith("Wrong"))) {
      assert.equal(button.soundId, 5);
      assert.ok(button.envelope[0].left < 32768);
    }
  }
  for (const source of Object.values(audio)) assert.equal(source.nestedCueCount, 0);
});
