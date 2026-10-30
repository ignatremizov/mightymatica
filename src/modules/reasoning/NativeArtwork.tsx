import { useMemo } from "react";
import type { ActivityProps } from "../../shared/contracts";
import OriginalLessonPlayer from "../../shared/OriginalLessonPlayer";
import timelines from "./native-timelines.json";
import { reasoningQuestions } from "./questionGate";
import audio from "./lesson-audio.json";
import { reasoningSegment } from "./lessonFlow";

// MainTimeline's explicit bHint stop and final stop, not sampled checkpoints.
const hintStops: Record<string, number> = { burninghouse: 515, turtles: 722, wine: 940 };
export function NativeArtwork({ family, locale, reducedMotion, label, phase = "solution", onComplete, onRestart }: {
  family: string; locale: ActivityProps["locale"]; reducedMotion: boolean; label: string;
  phase?: "intro" | "question" | "wrong" | "solution";
  onComplete?: () => void; onRestart?: () => void;
}) {
  const lesson = useMemo(() => {
    const data = timelines[family as keyof typeof timelines][locale];
    const source = audio[family as keyof typeof audio][locale];
    const question = reasoningQuestions[family];
    const end = family === "snail" ? 1160 : family === "bacteria" && locale === "ru" ? 1052 : data.frames;
    // Burninghouse/Turtles paint their initial Play control at source stop 2.
    // Native explicit Play resumes there rather than first advancing past it.
    const initialFrame = family === "burninghouse" || family === "turtles" ? 2 : 1;
    const startFrame = !question || phase === "intro" ? initialFrame
      : phase === "question" ? question.frame
        : phase === "wrong" ? question.wrongFrame : question.solutionFrame;
    const endFrame = !question ? end : phase === "intro" || phase === "question" ? question.frame
      : phase === "wrong" ? question.solutionFrame - 1 : end;
    const hint = hintStops[family];
    return reasoningSegment(source, data.module, startFrame, endFrame, data.fps,
      hint ? [{ frame: hint, kind: "manual" }] : []);
  }, [family, locale, phase]);
  const hint = hintStops[family];
  return <OriginalLessonPlayer lesson={lesson} locale={locale} reducedMotion={reducedMotion}
    label={label} onComplete={onComplete} onRestart={onRestart}
    stopLabels={hint ? { [hint]: locale === "ru" ? "Показать подсказку" : "Show hint" } : {}} />;
}
