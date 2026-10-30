import type { OriginalLessonDefinition } from "../../shared/OriginalLesson.ts";

const choices: Record<string, { labels: string[]; correct: string }> = {
  "two-coins": { labels: ["1", "2", "3", "4"], correct: "2" },
  "square-coin": { labels: ["5", "2", "3", "4"], correct: "5" },
  "earth-walk": { labels: ["1 ft", "2π ft", "6π ft", "12π ft"], correct: "12π ft" },
  cyclists: { labels: ["40", "100", "120", "160"], correct: "160" },
};

/** A question and wrong-feedback stop can only leave via their source actions. */
export function motionSourceFlow(
  id: string,
  lesson: OriginalLessonDefinition,
  gate: readonly number[] | undefined,
  retryLabel: string,
): {
  lesson: OriginalLessonDefinition;
  actions: Record<number, { label: string; targetFrame: number }[]>;
} {
  if (!gate) return { lesson, actions: {} };
  const question = choices[id];
  const [at, wrong, wrongEnd, correct] = gate;
  if (!question || gate.length !== 4 || !gate.every(Number.isSafeInteger)
    || !(lesson.initialFrame <= at! && at! < wrong! && wrong! <= wrongEnd!
      && wrongEnd! < correct! && correct! <= lesson.endFrame)) {
    throw new Error("Invalid source motion question.");
  }
  return {
    lesson: { ...lesson, stops: [
      ...lesson.stops, { frame: at!, kind: "manual" }, { frame: wrongEnd!, kind: "manual" },
    ].sort((a, b) => a.frame - b.frame) },
    actions: {
      [at!]: question.labels.map(label => ({ label, targetFrame: label === question.correct ? correct! : wrong! })),
      [wrongEnd!]: [{ label: retryLabel, targetFrame: at! }],
    },
  };
}
