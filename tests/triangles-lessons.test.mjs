import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { advanceLessonClock, createLessonClock, enterLessonFrame, validateOriginalLesson } from "../src/shared/OriginalLesson.ts";
import { triangleCorrectChoice, triangleLessonTransport } from "../src/modules/triangles/TriangleLessonRules.ts";
import { sourceTriangleOptions } from "../src/modules/triangles/SourceTriangleQuiz.ts";
import { construction, mix, triangleData } from "../src/modules/triangles/geometry.ts";

const sources = readdirSync(new URL("../src/modules/triangles/", import.meta.url))
  .filter(name => /^native-.*\.json$/.test(name))
  .map(name => ({ name, source: JSON.parse(readFileSync(new URL(`../src/modules/triangles/${name}`, import.meta.url), "utf8")) }));

test("every source question holds until an answer authorizes its correct or retry branch", () => {
  let gates = 0;
  for (const { name, source } of sources) {
    const lesson = triangleLessonTransport(source);
    validateOriginalLesson(lesson);
    for (const gate of source.gates) {
      const clock = createLessonClock(lesson);
      clock.waiting = null;
      enterLessonFrame(clock, gate.frame - 1, lesson, () => {});
      advanceLessonClock(clock, .25, lesson, lesson.endFrame, () => {});
      assert.equal(clock.frame, gate.frame, name);
      assert.equal(clock.waiting?.frame, gate.frame, name);
      advanceLessonClock(clock, .25, lesson, lesson.endFrame, () => assert.fail("A held question must not visit answer frames"));
      assert.equal(clock.frame, gate.frame);
      clock.waiting = null;
      enterLessonFrame(clock, gate.frame + 1, lesson, () => {});
      while (!clock.waiting) advanceLessonClock(clock, .25, lesson, lesson.endFrame, () => {});
      assert.equal(clock.frame, gate.wrongEnd, name);
      clock.waiting = null;
      enterLessonFrame(clock, gate.frame, lesson, () => {});
      assert.equal(clock.waiting?.frame, gate.frame, "Retry returns to the question, not its solution");
      clock.waiting = null;
      enterLessonFrame(clock, gate.correctStart, lesson, () => {});
      assert.equal(clock.waiting?.frame, gate.correctStart, "A correct answer reaches the original result hold");
      gates++;
    }
  }
  assert.equal(gates, 84);
});

test("median quadrilateral question accepts one third of the triangle, not the source's incorrect two thirds", () => {
  const points = [{ x: 12, y: 0 }, { x: 0, y: 0 }, { x: -10 * Math.SQRT2, y: 10 * Math.SQRT2 }];
  const [a, b, c] = points;
  const d = mix(a, b, .5), e = mix(a, c, .5);
  const { center } = construction(points, "medians");
  const quadrilateral = triangleData([a, e, center]).area + triangleData([a, center, d]).area;
  assert.ok(Math.abs(quadrilateral - 20 * Math.SQRT2) < 1e-9);
  assert.equal(triangleCorrectChoice("medians", 3, 4), 3);
  assert.equal(sourceTriangleOptions("medians", 3, "en")[2], "20√2");
});

test("source vertex-drag interludes wait for the learner before resuming the proof", () => {
  const interludes = sources.filter(({ source }) => source.interactionFrame !== undefined);
  assert.equal(interludes.length, 6);
  for (const { name, source } of interludes) {
    const lesson = triangleLessonTransport(source);
    const clock = createLessonClock(lesson);
    clock.waiting = null;
    enterLessonFrame(clock, source.interactionFrame, lesson, () => {});
    assert.equal(clock.waiting?.frame, source.interactionFrame, name);
    advanceLessonClock(clock, .25, lesson, lesson.endFrame, () => assert.fail("Exploration must not advance into proof automatically"));
    assert.equal(clock.frame, source.interactionFrame);
  }
});

test("false-proof Hint keeps its question hold and plays the original hint audio before native dragging", () => {
  for (const { source } of sources.filter(({ source }) => source.hintFrame !== undefined)) {
    const lesson = triangleLessonTransport(source);
    const clock = createLessonClock(lesson);
    clock.waiting = null;
    enterLessonFrame(clock, source.hintFrame, lesson, () => {});
    assert.equal(clock.waiting?.frame, source.hintFrame);
    assert.ok(lesson.audioCues.some(cue => cue.frame === source.hintFrame + 1));
    clock.waiting = null;
    enterLessonFrame(clock, source.hintFrame + 1, lesson, () => {});
    advanceLessonClock(clock, .25, lesson, lesson.endFrame, () => {});
    assert.equal(clock.complete, true);
    assert.equal(clock.frame, source.hintFrame + 2);
  }
});

test("corrected source answer choices retain the right altitude and angle-bisector area", () => {
  const hypotenuse = Math.hypot(3, 4);
  assert.equal(Number(sourceTriangleOptions("altitudes", 1, "en")[2]), 3 * 4 / hypotenuse);
  const oppositeLeg = 4 + 5;
  const hypotenuseScale = oppositeLeg / Math.sqrt(5 ** 2 - 4 ** 2);
  const adjacentLeg = 4 * hypotenuseScale;
  assert.equal(Number(sourceTriangleOptions("bisectors", 5, "en")[3]), oppositeLeg * adjacentLeg / 2);
});
