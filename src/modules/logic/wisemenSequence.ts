import type { OriginalLessonDefinition } from "../../shared/OriginalLesson.ts";

/** One source movie: stop at the question, then continue only on explicit Hint. */
export function createWisemenLesson({ story, hint }: {
  story: OriginalLessonDefinition;
  hint: OriginalLessonDefinition;
}): OriginalLessonDefinition {
  if (hint.initialFrame !== story.endFrame + 1 || hint.chapters[0]?.startFrame !== hint.initialFrame
    || story.chapters.at(-1)?.endFrame !== story.endFrame
    || story.width !== hint.width || story.height !== hint.height || story.fps !== hint.fps) {
    throw new Error("Wisemen story and hint must be contiguous parts of the same lesson.");
  }
  return {
    ...story,
    endFrame: hint.endFrame,
    chapters: [...story.chapters, ...hint.chapters],
    stops: [
      ...story.stops.filter(stop => stop.frame < story.endFrame),
      { frame: story.endFrame, kind: "manual" },
      ...hint.stops,
    ],
    audioAssets: [...new Map([...story.audioAssets, ...hint.audioAssets].map(sound => [sound.soundId, sound])).values()],
    audioCues: [...story.audioCues, ...hint.audioCues],
  };
}
