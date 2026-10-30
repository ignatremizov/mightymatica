import type { LessonSound, LessonSoundCue, LessonStop, OriginalLessonDefinition } from "../../shared/OriginalLesson";

interface RecoveredAudio {
  width: number;
  height: number;
  audioAssets: readonly LessonSound[];
  audioCues: readonly LessonSoundCue[];
}

/** A branch is a finite source timeline, never a seekable route past a quiz. */
export function reasoningSegment(
  source: RecoveredAudio, module: string, initialFrame: number, endFrame: number,
  fps: number, stops: readonly LessonStop[] = [],
): OriginalLessonDefinition {
  if (!Number.isSafeInteger(initialFrame) || !Number.isSafeInteger(endFrame)
    || initialFrame < 1 || endFrame < initialFrame) throw new Error("Invalid reasoning branch.");
  // Exclude other scenes/answer branches from initial audio reconstruction.
  const audioCues = source.audioCues.filter(cue => cue.frame >= initialFrame && cue.frame <= endFrame);
  const ids = new Set(audioCues.map(cue => cue.soundId));
  return {
    width: source.width, height: source.height, fps, initialFrame, endFrame,
    chapters: [{ id: "source-branch", startFrame: initialFrame, endFrame, module }],
    stops: [...stops.filter(stop => stop.frame >= initialFrame && stop.frame < endFrame),
      { frame: endFrame, kind: "complete" }],
    audioCues, audioAssets: source.audioAssets.filter(sound => ids.has(sound.soundId)),
  };
}
