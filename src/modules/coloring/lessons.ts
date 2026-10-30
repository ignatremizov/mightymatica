import type { OriginalLessonDefinition, LessonStop, LessonSound, LessonSoundCue } from "../../shared/OriginalLesson";
import cubeEn from "./cube-audio-en.json";
import cubeRu from "./cube-audio-ru.json";
import twoEn from "./audio-Twocolorplane-eng.json";
import twoRu from "./audio-Twocolorplane.json";
import segmentEn from "./audio-Twocolorplaneseg-en.json";
import segmentRu from "./audio-Twocolorplaneseg-ru.json";
import equilateralEn from "./audio-Twocoloreqtri-eng.json";
import equilateralRu from "./audio-Twocoloreqtri-ru.json";
import threeEn from "./audio-Threecolorplane-eng.json";
import threeRu from "./audio-Threecolorplane-ru.json";
import { cubeLessonStops } from "./lessonRules";

interface RecoveredAudio {
  width: number;
  height: number;
  fps: number;
  frameCount: number;
  audioCues: readonly LessonSoundCue[];
  audioAssets: readonly (Omit<LessonSound, "durationSeconds"> & { durationSeconds: number | null })[];
}
function definition(audio: RecoveredAudio, module: string, stops: readonly LessonStop[], endFrame = audio.frameCount): OriginalLessonDefinition {
  return {
    width: audio.width, height: audio.height, fps: audio.fps,
    initialFrame: 1, endFrame,
    chapters: [{ id: "lesson", startFrame: 1, endFrame: audio.frameCount, module }],
    stops,
    audioCues: audio.audioCues,
    audioAssets: audio.audioAssets.map(asset => {
      if (asset.durationSeconds === null) throw new Error("Missing recovered coloring sound duration");
      return { ...asset, durationSeconds: asset.durationSeconds };
    }),
  };
}
function plane(audio: RecoveredAudio, object: string) {
  return definition(audio, `coloring/native/${object}/timeline.mjs`, [
    { frame: 1, kind: "manual" },
    // Source bHint becomes available at frame 26. The question's decorative
    // loop must never let the generic transport advance into the proof.
    { frame: 26, kind: "manual" },
    { frame: audio.frameCount, kind: "complete" },
  ]);
}
export const coloringLessons = {
  "coloring-cube": {
    en: definition(cubeEn, "coloring/native/cube-en/timeline.mjs", cubeLessonStops("en"), 167),
    ru: definition(cubeRu, "coloring/native/cube-ru/timeline.mjs", cubeLessonStops("ru"), 167),
  },
  "coloring-two-plane": { en: plane(twoEn, "Twocolorplane-eng"), ru: plane(twoRu, "Twocolorplane") },
  "coloring-segment": { en: plane(segmentEn, "Twocolorplaneseg-en"), ru: plane(segmentRu, "Twocolorplaneseg-ru") },
  "coloring-equilateral": { en: plane(equilateralEn, "Twocoloreqtri-eng"), ru: plane(equilateralRu, "Twocoloreqtri-ru") },
  "coloring-three-plane": { en: plane(threeEn, "Threecolorplane-eng"), ru: plane(threeRu, "Threecolorplane-ru") },
};
export function isColoringLesson(id: string): id is keyof typeof coloringLessons {
  return Object.hasOwn(coloringLessons, id);
}
