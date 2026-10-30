import type { OriginalLessonDefinition } from "../../shared/OriginalLesson";

export interface KidsSourceLesson extends Omit<OriginalLessonDefinition, "chapters" | "stops"> {
  introEnd: number;
}

export interface KidsStageGate { frame: number; successFrame: number }

/** Every question is a blocked stop; transport alone cannot enter its answer. */
export function interactiveLesson(
  source: KidsSourceLesson, activityId: string, gates: readonly KidsStageGate[],
): OriginalLessonDefinition {
  return {
    width: source.width, height: source.height, fps: source.fps,
    initialFrame: 1, endFrame: source.endFrame,
    chapters: [{
      id: "lesson", startFrame: 1, endFrame: source.endFrame,
      module: `kids/audio/${activityId}/lesson.mjs`,
    }],
    stops: [...gates.map(gate => ({ frame: gate.frame, kind: "manual" })),
      { frame: source.endFrame, kind: "complete" }],
    audioAssets: source.audioAssets,
    audioCues: source.audioCues,
  };
}
