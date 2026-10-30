import type { OriginalLessonDefinition } from "../../shared/OriginalLesson";

export interface TriangleQuestionGate {
  frame: number;
  correctChoice: number;
  wrongEnd: number;
  correctStart: number;
  text: string;
}
export interface TriangleLessonDefinition extends OriginalLessonDefinition {
  source: string;
  gates: readonly TriangleQuestionGate[];
  interactionFrame?: number;
  hintFrame?: number;
}

/** The source median-area answer key confuses 1/3 and 2/3 of the triangle. */
export function triangleCorrectChoice(title: string, question: number, sourceChoice: number): number {
  return title === "medians" && question === 3 ? 3 : sourceChoice;
}

/** Stop actions, rather than arbitrary seeks, authorize each source branch. */
export function triangleLessonTransport(source: TriangleLessonDefinition): OriginalLessonDefinition {
  const stops = [...source.stops];
  for (const gate of source.gates) {
    if (gate.frame <= source.initialFrame || gate.correctStart > source.endFrame || gate.wrongEnd + 1 !== gate.correctStart) {
      throw new Error("Invalid triangle question branch.");
    }
    for (const frame of [gate.frame, gate.wrongEnd, gate.correctStart]) {
      if (!stops.some(stop => stop.frame === frame)) stops.push({ frame, kind: "manual" });
    }
  }
  return {
    ...source,
    stops: stops.filter(stop => stop.frame < source.endFrame).sort((a, b) => a.frame - b.frame),
  };
}
