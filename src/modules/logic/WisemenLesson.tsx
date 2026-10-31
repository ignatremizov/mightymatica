import { useMemo, useState, type ReactNode } from "react";
import type { Locale } from "../../shared/contracts";
import { t } from "../../shared/contracts";
import OriginalLessonPlayer from "../../shared/OriginalLessonPlayer";
import definitions from "./wisemen-lessons.json";
import sourceControls from "./source-controls.json";
import { createWisemenLesson } from "./wisemenSequence";

/** The source Hint continues the same player after the authored question stop. */
export default function WisemenLesson({ eight, locale, reducedMotion, children, onRestart, onHint }: {
  eight: boolean; locale: Locale; reducedMotion: boolean;
  children: ReactNode; onRestart: () => void; onHint: () => void;
}) {
  const [question, setQuestion] = useState(false);
  const key = `${eight ? "wisemen-eight" : "wisemen"}-${locale}` as keyof typeof definitions;
  const parts = definitions[key];
  const lesson = useMemo(() => createWisemenLesson(parts), [parts]);
  const initial = lesson.initialFrame;
  const questionFrame = parts.story.endFrame;
  return <section aria-label={t(locale, "Wisemen", "Мудрецы")}>
    <OriginalLessonPlayer lesson={lesson} locale={locale} reducedMotion={reducedMotion}
      stopLabels={{ [initial]: t(locale, "Play", "Воспроизвести"),
        [questionFrame]: t(locale, "Hint", "Подсказка") }}
      playbackHotspots={sourceControls[key].playbackHotspots}
      stopHotspots={sourceControls[key].stopHotspots}
      label={t(locale, eight ? "Wisemen at the train stops" : "Three wisemen", eight ? "Мудрецы на станциях" : "Три мудреца")}
      onStop={frame => { if (frame === questionFrame) setQuestion(true); }}
      onLeaveStop={() => { if (question) onHint(); }}
      onRestart={() => { setQuestion(false); onRestart(); }} />
    {question && children}
  </section>;
}
