import type { ActivityProps } from "../../shared/contracts";
import { t } from "../../shared/contracts";
import OriginalLessonPlayer from "../../shared/OriginalLessonPlayer";
import type { OriginalLessonDefinition } from "../../shared/OriginalLesson";
import audio from "./audio.json";
import type { Mode } from "./rules";

const source = audio["falling-figure"];
const ranges: Record<Mode, readonly [number, number]> = {
  color: [55, 109], size: [150, 204], shape: [244, 329], all: [338, 423],
};
function completionLesson(mode: Mode): OriginalLessonDefinition {
  const [start, end] = ranges[mode];
  return {
    width: source.width, height: source.height, fps: source.fps,
    initialFrame: start, endFrame: end,
    chapters: [{ id: mode, startFrame: start, endFrame: end, module: "falling/audio/falling-figure/completion.mjs" }],
    stops: [{ frame: end, kind: "complete" }],
    audioAssets: source.audioAssets,
    audioCues: source.audioCues.filter(cue => cue.frame >= start && cue.frame <= end),
  };
}
const lessons: Record<Mode, OriginalLessonDefinition> = {
  color: completionLesson("color"), size: completionLesson("size"),
  shape: completionLesson("shape"), all: completionLesson("all"),
};

export default function CompletionLesson({ mode, locale, reducedMotion, sound }: Pick<ActivityProps, "locale" | "reducedMotion"> & { mode: Mode; sound: boolean }) {
  return <OriginalLessonPlayer lesson={lessons[mode]} locale={locale} reducedMotion={reducedMotion}
    initialSound={sound} autoPlay={!reducedMotion}
    label={t(locale, "Original round completion", "Оригинальное завершение раунда")} />;
}
