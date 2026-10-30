import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { parseQuestionXml } from "../src/modules/quiz/import-questions.mjs";
import { audiencePoll, fiftyFiftyChoices, gradeAnswer, lossPrize, phoneAdvice, prizes } from "../src/modules/quiz/rules.ts";

test("wrong answers pay only the last secured source milestone", () => {
  assert.deepEqual([0, 4, 5, 9, 10, 14].map(lossPrize), [0, 0, 1000, 1000, 32000, 32000]);
  assert.equal(prizes[5], 1000);
  assert.equal(prizes[10], 32000);
  assert.equal(prizes[15], 1000000);
});

test("fifty-fifty keeps exactly the correct answer and one distractor", () => {
  for (const quiz of Object.values(data)) for (const question of quiz.questions) {
    for (let other = 0; other < 3; other++) {
      const kept = fiftyFiftyChoices(question, other);
      assert.equal(kept.length, 2);
      assert.equal(new Set(kept).size, 2);
      assert.ok(kept.includes(question.originalAnswer));
    }
  }
});

test("source lifelines may mislead but audience percentages conserve one hundred", () => {
  const question = data["quiz-permutations"].questions[0];
  for (const value of [0, .25, .5, .999999]) {
    const votes = audiencePoll(question, () => value);
    assert.equal(votes.reduce((sum, vote) => sum + vote, 0), 100);
    assert.ok(votes[question.originalAnswer] >= 30 && votes[question.originalAnswer] <= 70);
  }
  assert.deepEqual(phoneAdvice(question, "galileo", () => 0), { choice: null, confidence: 0 });
  assert.equal(phoneAdvice(question, "benjamin", () => 0).choice, question.originalAnswer);
  assert.notEqual(phoneAdvice(question, "benjamin", () => .999999).choice, question.originalAnswer);
});

const data = JSON.parse(readFileSync(new URL("../src/modules/quiz/questions.json", import.meta.url), "utf8"));

test("original one-based answer keys map to the displayed zero-based choice", () => {
  const xml = "<Title>Example</Title><Random>no</Random><AllQuestions><Q><question>A &amp; B?</question><answer>4</answer><choice_1>1</choice_1><choice_2>2</choice_2><choice_3>3</choice_3><choice_4>4</choice_4></Q></AllQuestions>";
  const question = parseQuestionXml(xml).questions[0];
  assert.equal(question.question, "A & B?");
  assert.equal(gradeAnswer("quiz-permutations", 0, question, 3), true);
  assert.equal(gradeAnswer("quiz-permutations", 0, question, 0), false);
  assert.throws(() => parseQuestionXml(xml.replace("<answer>4", "<answer>5")));
  assert.throws(() => parseQuestionXml(`<!DOCTYPE x>${xml}`));
});

test("both preserved sequences have fifteen questions and retain the original flawed urn choices", () => {
  for (const [id, quiz] of Object.entries(data)) {
    assert.equal(quiz.questions.length, 15);
    assert.equal(quiz.questions[11].originalAnswer, 3);
    for (let choice = 0; choice < 4; choice++)
      assert.equal(gradeAnswer(id, 11, quiz.questions[11], choice), null);
  }
  assert.equal(data["quiz-permutations"].questions[11].choices[3], "544");
  assert.equal(data["quiz-permutations-more"].questions[11].choices[3], "All abover");
});

test("original trivia retains its source scoring alongside mathematical questions", () => {
  assert.equal(gradeAnswer("quiz-permutations", 7, data["quiz-permutations"].questions[7], 1), true);
  assert.equal(gradeAnswer("quiz-permutations", 7, data["quiz-permutations"].questions[7], 0), false);
  assert.equal(gradeAnswer("quiz-permutations-more", 13, data["quiz-permutations-more"].questions[13], 3), true);
  assert.equal(gradeAnswer("quiz-permutations-more", 13, data["quiz-permutations-more"].questions[13], 0), false);
  for (const [id, quiz] of Object.entries(data)) {
    assert.equal(quiz.questions.filter((question, index) =>
      gradeAnswer(id, index, question, question.originalAnswer) !== null).length, 14);
  }
  assert.equal(gradeAnswer("quiz-permutations-more", 0, data["quiz-permutations-more"].questions[0], 2), true);
  assert.throws(() => gradeAnswer("quiz-permutations", 0, data["quiz-permutations"].questions[0], -1), RangeError);
});
