import type { LessonSound, LessonSoundCue, OriginalLessonDefinition } from "../../shared/OriginalLesson";

interface RecoveredAudio {
  width: number;
  height: number;
  fps: number;
  audioAssets: readonly (Omit<LessonSound, "durationSeconds"> & { durationSeconds: number | null })[];
  audioCues: readonly LessonSoundCue[];
}

// Source stop()/gotoAndPlay handlers, not the declared trailing-frame count.
const celebrationEnds: Readonly<Record<string, number>> = {
  BandF: 261, faces: 181, hands: 240, lizards: 240,
  stairbig: 320, stairs: 259, waterfall: 279,
};

/** Keep the external freeform jigsaw as the only gate to the victory sequence. */
export function escherPresentation(
  artwork: string,
  complete: boolean,
  recovered: RecoveredAudio,
): OriginalLessonDefinition {
  const initialFrame = complete ? 157 : 1;
  const endFrame = complete ? celebrationEnds[artwork]! : 153;
  const audioCues = recovered.audioCues.filter(cue => cue.frame >= initialFrame && cue.frame <= endFrame);
  const usedSounds = new Set(audioCues.map(cue => cue.soundId));
  return {
    width: recovered.width,
    height: recovered.height,
    fps: recovered.fps,
    initialFrame,
    endFrame,
    chapters: [{
      id: complete ? "celebration" : "introduction",
      startFrame: initialFrame,
      endFrame,
      module: `escher/canvas/Escher-${artwork}-game.mjs`,
    }],
    stops: [{ frame: endFrame, kind: "complete" }],
    audioAssets: recovered.audioAssets.filter(sound => usedSounds.has(sound.soundId)).map(sound => ({
      ...sound,
      durationSeconds: sound.durationSeconds ?? sound.sampleCount / sound.sampleRate,
    })),
    audioCues,
  };
}
