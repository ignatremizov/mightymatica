import test from "node:test";
import assert from "node:assert/strict";
import { circleQuiz, circleQuizNext } from "../src/modules/measurement/circleQuiz.ts";
import { sphereQuiz, sphereQuizNext } from "../src/modules/solids/sphereQuiz.ts";

for (const [name, questions, advance, sourceKeys] of [
  ["circle", circleQuiz, circleQuizNext, [2, 3, 2, 4, 3, 4, 2, 3]],
  ["sphere", sphereQuiz, sphereQuizNext, [4, 3, 3, 2, 3, 1, 1, 3]],
]) {
  test(`${name}: wrong source choices retry, all eight correct branches reach congratulations`, () => {
    let stage = 0;
    for (const key of sourceKeys) {
      for (let answer = 0; answer < 4; answer++) {
        assert.equal(advance(stage, answer), answer === key - 1 ? stage + 1 : stage);
      }
      stage = advance(stage, key - 1);
    }
    assert.equal(stage, 8);
    assert.equal(questions[stage], undefined);
    assert.equal(advance(stage, 0), 8);
  });
}

test("circle's shaded and triangle source choices agree with diagram geometry and original π approximation", () => {
  assert.equal(8 * 12 - 3.14 * 4 ** 2, Number(circleQuiz[3].choices[circleQuiz[3].correct]));
  const triangleArea = (100 / 3.14) * (1 + Math.sqrt(3) / 2) / 2;
  assert.equal(triangleArea.toFixed(2), circleQuiz[5].choices[circleQuiz[5].correct]);
});

test("sphere diameter lengths and cube scaling preserve the recovered answer branches", () => {
  assert.equal(sphereQuiz[1].enChoices[sphereQuiz[1].correct], "1");
  assert.equal(Number(sphereQuiz[4].enChoices[sphereQuiz[4].correct]), 2 ** 3);
  assert.equal(Number(sphereQuiz[7].enChoices[sphereQuiz[7].correct]), Math.cbrt(27));
});
