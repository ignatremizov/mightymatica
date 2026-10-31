import { useMemo, useState, type ReactNode } from "react";
import type { ActivityProps } from "../../shared/contracts";
import { t } from "../../shared/contracts";
import OriginalLessonPlayer from "../../shared/OriginalLessonPlayer";
import type { OriginalLessonDefinition } from "../../shared/OriginalLesson";
import definitions from "./native-lessons.json";
import { motionSourceFlow } from "./lessonRules";
import sourceControls from "./source-controls.json";
import type { OriginalLessonPlayerProps } from "../../shared/OriginalLessonPlayer";

interface SourceLesson {
  source: string;
  lesson: OriginalLessonDefinition;
  gate?: number[];
}
const lessons: Record<string, Record<string, SourceLesson>> = definitions;
const controls: Record<string, Record<string, Pick<OriginalLessonPlayerProps, "playbackHotspots" | "stopHotspots">>> = sourceControls;

// Both bHint placements use (418, 353.15); these bounds include the original
// Hit-state artwork (EN Symbol 70 / RU Symbol 69), not a replacement button.
const earthBeltHint = {
  580: { x: 408.6, y: 347.2, width: 129.95, height: 44.85, sourceArtwork: true },
};

export default function NativeMotionLesson(props: ActivityProps & { explorer: ReactNode }) {
  const id = props.activityId.replace(/^motion-/, "");
  const sources = lessons[id];
  const [language, setLanguage] = useState<string>(props.locale);
  if (!sources) return props.explorer;
  const sourceLanguage = sources[language] ? language : "en";
  return <section className="motion-activity">
    {id === "cyclists" && <label className="control">{t(props.locale, "Lesson language", "Язык урока")}
      <select value={language} onChange={event => setLanguage(event.target.value)}>
        <option value="en">English</option><option value="ru">Русский</option><option value="zh">中文</option>
      </select>
    </label>}
    <Lesson key={`${id}:${language}:${props.locale}`} {...props} id={id}
      source={sources[sourceLanguage]!} sourceLanguage={sourceLanguage} />
  </section>;
}

function Lesson({ source, sourceLanguage, id, locale, reducedMotion, explorer }: ActivityProps & {
  source: SourceLesson; sourceLanguage: string; id: string; explorer: ReactNode;
}) {
  const [complete, setComplete] = useState(false);
  const [explore, setExplore] = useState(false);
  const flow = useMemo(() => motionSourceFlow(id, source.lesson, source.gate,
    t(locale, "Try again", "Попробовать ещё раз")), [id, source, locale]);
  const sourceHits = controls[id]?.[sourceLanguage];
  const stopLabels: Record<number, string> = {
    1257: t(locale, "Hint", "Подсказка"),
    580: t(locale, "Hint", "Подсказка"),
    518: t(locale, "Hint", "Подсказка"),
    519: t(locale, "Play the unfolding", "Показать развёртку"),
  };
  return <>
    <OriginalLessonPlayer lesson={flow.lesson} locale={locale} reducedMotion={reducedMotion}
      label={t(locale, "Original animated lesson", "Оригинальный анимационный урок")}
      stopLabels={stopLabels}
      stopHotspots={id === "earth-belt" ? earthBeltHint : sourceHits?.stopHotspots}
      playbackHotspots={sourceHits?.playbackHotspots}
      stopActions={flow.actions} onComplete={() => setComplete(true)}
      onRestart={() => { setComplete(false); setExplore(false); }}/>
    {complete && <details open={explore} onToggle={event => setExplore(event.currentTarget.open)}>
      <summary>{t(locale, "Explore the mathematics", "Исследовать математику")}</summary>
      {explore && explorer}
    </details>}
  </>;
}
