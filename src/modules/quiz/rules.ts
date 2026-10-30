export interface Question {
  question: string;
  originalAnswer: number;
  choices: string[];
}

export const prizes = [0, 100, 200, 300, 500, 1000, 2000, 4000, 8000, 16000, 32000, 64000, 125000, 250000, 500000, 1000000] as const;

/** Zero-based question index: the fifth and tenth correct answers secure a floor. */
export function lossPrize(questionIndex: number): number {
  return questionIndex < 5 ? 0 : questionIndex < 10 ? 1000 : 32000;
}

/** Keep the correct choice and one other choice; selection is supplied by the UI. */
export function fiftyFiftyChoices(question: Question, otherIndex: number): number[] {
  const wrong = question.choices.map((_, index) => index).filter(index => index !== question.originalAnswer);
  if (!Number.isInteger(otherIndex) || otherIndex < 0 || otherIndex >= wrong.length)
    throw new RangeError("Choose an available distractor");
  return [question.originalAnswer, wrong[otherIndex]].sort((a, b) => a - b);
}

/** Source audience allocation: the keyed answer gets 30–70%, not a guarantee. */
export function audiencePoll(question: Question, random: () => number): number[] {
  const votes = question.choices.map(() => 0);
  votes[question.originalAnswer] = 30 + Math.floor(random() * 41);
  let remaining = 100 - votes[question.originalAnswer];
  const wrong = votes.map((_, index) => index).filter(index => index !== question.originalAnswer);
  wrong.forEach((index, position) => {
    votes[index] = position === wrong.length - 1 ? remaining : Math.floor(random() * (remaining + 1));
    remaining -= votes[index];
  });
  return votes;
}

export function phoneAdvice(question: Question, friend: "galileo" | "benjamin", random: () => number): { choice: number | null; confidence: number } {
  const chances = friend === "galileo" ? [0, 80, 85, 90] : [65, 70, 75];
  const confidence = chances[Math.floor(random() * chances.length)];
  if (confidence === 0) return { choice: null, confidence };
  const correct = Math.floor(random() * 100) + 1 <= confidence;
  const wrong = question.choices.map((_, index) => index).filter(index => index !== question.originalAnswer);
  return { choice: correct ? question.originalAnswer : wrong[Math.floor(random() * wrong.length)], confidence };
}

/** Notes are editorial annotations, never changes to the preserved source data. */
export function questionNote(activityId: string, index: number): string | undefined {
  if (index === 11) return activityId === "quiz-permutations"
    ? "Source error: ordered samples with replacement give 8 × 8 × 8 = 512. None of the original choices is correct; the archive marks 544. This question is not scored."
    : "Source error: ordered samples without replacement give 8 × 7 × 6 = 336. None of the original choices is correct; the archive marks “All abover”. This question is not scored.";
  return undefined;
}

export function gradeAnswer(activityId: string, index: number, question: Question, choice: number): boolean | null {
  if (!Number.isInteger(choice) || choice < 0 || choice >= question.choices.length)
    throw new RangeError("Choose one of the available answers");
  return questionNote(activityId, index) ? null : choice === question.originalAnswer;
}
