import test from "node:test";
import assert from "node:assert/strict";
import { circleLessonBranch, circleQuestionFrames } from "../src/modules/measurement/circleLessonRules.ts";
import { circleQuiz } from "../src/modules/measurement/circleQuiz.ts";

test("circle answers authorize only the source feedback route, ending at the next question gate", () => {
  for (const locale of ["en", "ru"]) {
    for (let question = 0; question < 8; question++) {
      const wrong = circleLessonBranch(locale, question, false);
      const right = circleLessonBranch(locale, question, true);
      assert.equal(wrong.start, circleQuestionFrames[locale][question] + 1);
      assert.ok(wrong.start <= wrong.end);
      assert.equal(right.start, wrong.end + 1);
      assert.equal(right.end, circleQuestionFrames[locale][question + 1] ?? (locale === "en" ? 2178 : 2229));
      assert.ok(right.start < right.end);
      assert.ok(wrong.end < right.end);
    }
  }
  assert.deepEqual(circleQuiz.map(q => q.correct + 1), [2, 3, 2, 4, 3, 4, 2, 3]);
});

test("unknown circle question cannot create an ungated playback segment", () => {
  for (const question of [-1, 8, 1.5, NaN]) {
    assert.throws(() => circleLessonBranch("en", question, true), RangeError);
  }
});
