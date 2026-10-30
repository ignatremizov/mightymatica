import { test } from "node:test";
import assert from "node:assert/strict";
import { answerReasoningQuestion, reasoningQuestions } from "../src/modules/reasoning/questionGate.ts";

test("each recovered quiz requires its source correct answer and permits retry after every wrong answer", () => {
  const sourceAnswers = {
    grandma: "10 min", hunter: "White", snail: "9", staruhi: "6",
    tram: "13", bacteria: "in 59 sec", hand: "index",
  };
  for (const [key, answer] of Object.entries(sourceAnswers)) {
    const question = reasoningQuestions[key];
    for (let index = 0; index < question.choices.length; index++) {
      assert.equal(answerReasoningQuestion(question, index),
        question.choices[index][0] === answer ? "correct" : "retry", `${key}: ${index}`);
    }
    assert.equal(answerReasoningQuestion(question, question.correct), "correct", `${key} retry succeeds`);
  }
});

test("invalid answer positions cannot unlock a reasoning solution", () => {
  for (const question of Object.values(reasoningQuestions)) {
    for (const choice of [-1, 0.5, NaN, Infinity, question.choices.length]) {
      assert.equal(answerReasoningQuestion(question, choice), "retry");
    }
  }
});

test("a correct answer enters the source solution branch rather than replaying wrong-answer feedback", () => {
  const sourceBranches = {
    grandma: [501, 502], hunter: [940, 941], snail: [1159, 1160],
    staruhi: [1197, 1198], tram: [903, 904], bacteria: [523, 524], hand: [693, 694],
  };
  for (const [key, [wrongStop, correctStart]] of Object.entries(sourceBranches)) {
    const question = reasoningQuestions[key];
    assert.equal(question.solutionFrame, correctStart, key);
    assert.ok(question.solutionFrame > wrongStop, `${key}: wrong feedback is excluded`);
    assert.ok(question.frame < wrongStop, `${key}: question precedes both branches`);
  }
});
