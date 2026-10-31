import { useState, type ReactNode } from "react";
import { t, type ActivityProps } from "../../shared/contracts";
import OriginalLessonPlayer from "../../shared/OriginalLessonPlayer";
import type { OriginalLessonDefinition } from "../../shared/OriginalLesson";
import definitions from "./native-lessons.json";
import sourceControls from "./source-controls.json";

const lessons: Record<string, Record<string, { source: string; lesson: OriginalLessonDefinition }>> = definitions;

/** Source animation and its actual soundtrack precede the optional explorer. */
export default function NativeFractalLesson({ activityId, locale, reducedMotion, explorer }: ActivityProps & { explorer: ReactNode }) {
  const [complete, setComplete] = useState(false);
  const [explore, setExplore] = useState(false);
  const id = activityId.replace(/^fractals-/, "");
  const source = lessons[id]?.[locale] ?? lessons[id]?.en;
  if (!source) return explorer;
  const sourceHits = id === "buffon" ? sourceControls.buffon[locale] : undefined;
  const stops: Record<number, string> = {};
  for (const stop of source.lesson.stops) stops[stop.frame] = t(locale, "Play the next demonstration", "Следующая демонстрация");
  return <section className="fractals">
    {id !== "buffon" && locale === "ru" && <p className="activity-note">{t(locale,
      "Original lesson in English.", "Оригинальный урок на английском языке.")}</p>}
    <OriginalLessonPlayer lesson={source.lesson} locale={locale} reducedMotion={reducedMotion}
      label={t(locale, id === "carpet" ? "Construction of the Sierpiński carpet" : id === "buffon" ? "Buffon's needle" : "A face on a Möbius strip",
        id === "carpet" ? "Построение ковра Серпинского" : id === "buffon" ? "Игла Бюффона" : "Лицо на ленте Мёбиуса")}
      stopLabels={stops} playbackHotspots={sourceHits?.playbackHotspots}
      onComplete={() => setComplete(true)}
      onRestart={() => { setComplete(false); setExplore(false); }}/>
    {complete && id === "carpet" && explorer}
    {complete && id !== "carpet" && <details open={explore} onToggle={event => setExplore(event.currentTarget.open)}>
      <summary>{t(locale, id === "carpet" ? "Explore construction and continuous zoom" : id === "buffon" ? "Try the needle experiment" : "Explore the strip",
        id === "carpet" ? "Построение и непрерывное увеличение" : id === "buffon" ? "Провести опыт с иглами" : "Исследовать ленту")}</summary>
      {explore && explorer}
    </details>}
  </section>;
}
