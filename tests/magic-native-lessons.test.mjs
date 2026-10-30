import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { advanceLessonClock, createLessonClock } from "../src/shared/OriginalLesson.ts";
import { subtractionExampleIndex } from "../src/modules/magic/rules.ts";

const lessons = JSON.parse(readFileSync(new URL("../src/modules/magic/native-lessons.json", import.meta.url), "utf8"));
const advance = (clock, lesson, seconds) => {
  for (let remaining = seconds; remaining > 1e-8; remaining -= .25)
    advanceLessonClock(clock, Math.min(.25, remaining), lesson, lesson.endFrame, () => {});
};

test("hourglass solution cannot run before the player requests the source hint", () => {
  for (const lesson of Object.values(lessons.hourglasses)) {
    const clock = createLessonClock(lesson);
    advance(clock, lesson, 90);
    assert.equal(clock.frame, 765);
    assert.equal(clock.waiting?.kind, "manual");
    assert.equal(clock.complete, false);
    clock.waiting = null;
    advance(clock, lesson, 40);
    assert.equal(clock.frame, 1530);
    assert.equal(clock.complete, true);
  }
});

test("subtraction freezes the source final artwork for twenty half-second examples", () => {
  for (const lesson of Object.values(lessons.subtraction)) {
    const clock = createLessonClock(lesson);
    advance(clock, lesson, 38);
    assert.equal(clock.frame, 895);
    assert.equal(clock.complete, false);
    advance(clock, lesson, 8);
    assert.equal(clock.frame, 895);
    advance(clock, lesson, 2);
    assert.equal(clock.frame, 896);
    assert.equal(clock.complete, true);
  }
  assert.equal(subtractionExampleIndex(0), null);
  assert.equal(subtractionExampleIndex(.49), null);
  for (let count = 1; count <= 20; count++)
    assert.equal(subtractionExampleIndex(count / 2), count - 1);
  assert.equal(subtractionExampleIndex(100), 19);
});
