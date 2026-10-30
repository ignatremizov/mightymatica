import { useState, type ReactNode } from "react";
import type { Locale } from "../../shared/contracts";
import { t } from "../../shared/contracts";
import OriginalLessonPlayer from "../../shared/OriginalLessonPlayer";
import definitions from "./wisemen-lessons.json";

/** Each narrative ends at the authored question, before the optional hint. */
export default function WisemenLesson({ eight, locale, reducedMotion, hint, children, onRestart }: {
  eight: boolean; locale: Locale; reducedMotion: boolean; hint: boolean;
  children: ReactNode; onRestart: () => void;
}) {
  const [question, setQuestion] = useState(false);
  const lesson = definitions[`${eight ? "wisemen-eight" : "wisemen"}-${locale}` as keyof typeof definitions];
  const initial = lesson.story.initialFrame;
  return <section aria-label={t(locale, "Wisemen", "Мудрецы")}>
    <OriginalLessonPlayer lesson={lesson.story} locale={locale} reducedMotion={reducedMotion}
      stopLabels={{ [initial]: t(locale, "Play", "Воспроизвести") }}
      label={t(locale, eight ? "Wisemen at the train stops" : "Three wisemen", eight ? "Мудрецы на станциях" : "Три мудреца")}
      onComplete={() => setQuestion(true)} onRestart={() => { setQuestion(false); onRestart(); }} />
    {question && <>
      {children}
      {hint && <OriginalLessonPlayer lesson={lesson.hint} locale={locale} reducedMotion={reducedMotion}
        label={t(locale, "Two-wisemen hint", "Подсказка: два мудреца")} />}
    </>}
  </section>;
}
