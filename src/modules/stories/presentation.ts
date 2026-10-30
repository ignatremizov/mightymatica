import type { LessonSound, LessonSoundCue, OriginalLessonDefinition } from "../../shared/OriginalLesson";

interface RecoveredAudio {
  width: number;
  height: number;
  fps: number;
  audioAssets: readonly (Omit<LessonSound, "durationSeconds"> & { durationSeconds: number | null })[];
  audioCues: readonly LessonSoundCue[];
}

/** Child-film intervals are excluded: their native videos own their soundtrack. */
export function storyPresentation(
  source: string,
  victory: boolean,
  recovered: RecoveredAudio,
): OriginalLessonDefinition {
  const snow = source === "Snowhite-game";
  const initialFrame = victory ? (snow ? 173 : 157) : (snow ? 106 : 1);
  const endFrame = victory ? (snow ? 196 : 180) : (snow ? 169 : 153);
  const audioCues = recovered.audioCues.filter(cue => cue.frame >= initialFrame && cue.frame <= endFrame);
  const used = new Set(audioCues.map(cue => cue.soundId));
  return {
    width: recovered.width, height: recovered.height, fps: recovered.fps,
    initialFrame, endFrame,
    chapters: [{ id: victory ? "victory" : "introduction", startFrame: initialFrame, endFrame,
      module: `stories/canvas/${source}.mjs` }],
    stops: [{ frame: endFrame, kind: "complete" }],
    audioAssets: recovered.audioAssets.filter(sound => used.has(sound.soundId)).map(sound => ({
      ...sound, durationSeconds: sound.durationSeconds ?? sound.sampleCount / sound.sampleRate,
    })),
    audioCues,
  };
}
