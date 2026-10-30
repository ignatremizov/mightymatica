import { useLayoutEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { t, type Locale } from "../../shared/contracts";
import OriginalLessonPlayer from "../../shared/OriginalLessonPlayer";
import lessonData from "./lessonData.json";
import { circleQuiz } from "./circleQuiz";
import { circleLessonBranch, circleQuestionFrames } from "./circleLessonRules";
import { areaPlay, polygonPlay, circlePlay, circleFeedbackPlay, measurementPlaybackHotspots, type MeasurementLessonId, type SourceHotspot } from "./sourceControls";

type LessonId = MeasurementLessonId;
const titles: Record<LessonId, [string, string]> = {
  area: ["Measuring area", "Измеряем площадь"],
  polygon: ["Area of a regular polygon", "Площадь правильного многоугольника"],
  circle: ["Area of a circle", "Площадь круга"],
};
function useExplorerReveal() {
  const [open, setOpen] = useState(false);
  const [focusRequest, setFocusRequest] = useState(0);
  return {
    open, setOpen, focusRequest,
    reveal: () => { setOpen(true); setFocusRequest(value => value + 1); },
    reset: () => { setOpen(false); setFocusRequest(0); },
  };
}
function Followup({ locale, reducedMotion, reveal, children }: {
  locale: Locale; reducedMotion: boolean; reveal: ReturnType<typeof useExplorerReveal>; children: ReactNode;
}) {
  const heading = useRef<HTMLHeadingElement>(null);
  const focused = useRef(0);
  useLayoutEffect(() => {
    if (!reveal.open || reveal.focusRequest === focused.current || !heading.current) return;
    focused.current = reveal.focusRequest;
    heading.current.scrollIntoView({ behavior: reducedMotion ? "auto" : "smooth", block: "start" });
    heading.current.focus({ preventScroll: true });
  }, [reveal.open, reveal.focusRequest, reducedMotion]);
  return <details className="measurement-followup" open={reveal.open} onToggle={event => reveal.setOpen(event.currentTarget.open)}>
    <summary>{t(locale, "Explore the mathematics", "Исследовать математику")}</summary>
    {reveal.open && <div><h2 ref={heading} tabIndex={-1}>{t(locale, "Try it yourself", "Попробовать самостоятельно")}</h2>{children}</div>}
  </details>;
}

/** Question/retry stops expose source-authorized actions, never generic Continue. */
function CircleLesson({ locale, reducedMotion, explorer }: { locale: Locale; reducedMotion: boolean; explorer: ReactNode }) {
  const [frame, setFrame] = useState<number | null>(null);
  const [complete, setComplete] = useState(false);
  const reveal = useExplorerReveal();
  const original = lessonData.circle[locale];
  const controller = useMemo(() => {
    const actions: Record<number, { label: string; targetFrame: number }[]> = {};
    const hotspots: Record<number, SourceHotspot> = { 127: circlePlay };
    const blocked: number[] = [];
    const stops = new Set([original.initialFrame, original.endFrame]);
    circleQuiz.forEach((q, question) => {
      const at = circleQuestionFrames[locale][question]!;
      const wrong = circleLessonBranch(locale, question, false);
      const correct = circleLessonBranch(locale, question, true);
      stops.add(at); stops.add(wrong.end); stops.add(correct.start);
      hotspots[correct.start] = circleFeedbackPlay(correct.start);
      blocked.push(at, wrong.end);
      actions[at] = q.choices.map((choice, answer) => ({
        label: locale === "ru" ? choice.replaceAll("cm", "см") : choice,
        targetFrame: answer === q.correct ? correct.start : wrong.start,
      }));
      actions[wrong.end] = [{ label: t(locale, "Try again", "Попробовать ещё"), targetFrame: at }];
    });
    return {
      actions, blocked, hotspots,
      lesson: { ...original, stops: [...stops].sort((a, b) => a - b).map(at => ({ frame: at, kind: at === original.endFrame ? "complete" : "manual" })) },
    };
  }, [locale, original]);
  const question = frame === null ? -1 : circleQuestionFrames[locale].findIndex(at => at === frame);
  const q = circleQuiz[question];
  return <section className="measurement-lesson">
    <OriginalLessonPlayer lesson={controller.lesson} locale={locale} reducedMotion={reducedMotion}
      label={t(locale, ...titles.circle)}
      onComplete={() => { setComplete(true); setFrame(null); }}
      onRestart={() => { setComplete(false); setFrame(null); reveal.reset(); }}
      onStop={setFrame} onLeaveStop={() => setFrame(null)} blockedStopFrames={controller.blocked} stopActions={controller.actions}
      stopHotspots={controller.hotspots}
      playbackHotspots={measurementPlaybackHotspots.circle[locale]}
      completionAction={{ label: t(locale, "Try it yourself", "Попробовать самостоятельно"), onClick: reveal.reveal }}
      stopLabels={{ [original.initialFrame]: t(locale, "Play", "Воспроизвести") }}
    />
    {!complete && q && <section className="measurement-source-quiz" aria-label={t(locale, "Choose an answer", "Выберите ответ")}>
      <h2>{t(locale, `Question ${question + 1}`, `Вопрос ${question + 1}`)}</h2>
      <p>{t(locale, q.en, q.ru)}</p>
      <p className="activity-note">{t(locale, "Choose the closest listed value.", "Выберите ближайшее из предложенных значений.")}</p>
    </section>}
    {complete && <Followup locale={locale} reducedMotion={reducedMotion} reveal={reveal}>{explorer}</Followup>}
  </section>;
}

export default function MeasurementLesson({ id, locale, reducedMotion, explorer }: {
  id: LessonId; locale: Locale; reducedMotion: boolean; explorer: ReactNode;
}) {
  const [complete, setComplete] = useState(false);
  const reveal = useExplorerReveal();
  if (id === "circle") return <CircleLesson locale={locale} reducedMotion={reducedMotion} explorer={explorer} />;
  return <section className="measurement-lesson">
    <OriginalLessonPlayer lesson={lessonData[id][locale]} locale={locale} reducedMotion={reducedMotion}
      stopHotspots={Object.fromEntries(lessonData[id][locale].stops.filter(stop => stop.kind === "manual").map(stop => [stop.frame, id === "area" ? areaPlay : polygonPlay]))}
      playbackHotspots={measurementPlaybackHotspots[id][locale]}
      stopLabels={{ [lessonData[id][locale].initialFrame]: t(locale, "Play", "Воспроизвести") }}
      completionAction={{ label: t(locale, "Try it yourself", "Попробовать самостоятельно"), onClick: reveal.reveal }}
      label={t(locale, ...titles[id])} onComplete={() => setComplete(true)} onRestart={() => { setComplete(false); reveal.reset(); }} />
    {complete && <Followup locale={locale} reducedMotion={reducedMotion} reveal={reveal}>{explorer}</Followup>}
  </section>;
}
