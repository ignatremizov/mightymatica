import { useMemo, useState, type ReactNode } from "react";
import type { ActivityProps } from "../../shared/contracts";
import { t } from "../../shared/contracts";
import OriginalLessonPlayer from "../../shared/OriginalLessonPlayer";
import type { OriginalLessonDefinition } from "../../shared/OriginalLesson";
import square from "./square-audio.json";
import difference from "./difference-audio.json";
import transform from "./transform-audio.json";
import quadratic from "./quadratic-audio.json";
import sourceControls from "./source-controls.json";

const sources = {
  "algebra-square-of-sum": { audio: square, directory: "square", end: 855, stops: [] },
  "algebra-difference-of-squares": { audio: difference, directory: "difference", end: 890, stops: [] },
  "algebra-transformations": { audio: transform, directory: "transform", end: 1710, stops: [481] },
  "algebra-quadratic": { audio: quadratic, directory: "quadratic", end: 4030, stops: [36] },
};
export type NativeAlgebraId = keyof typeof sources;
const quadraticChapters = [37, 851, 1058, 1312, 1646, 2646];

export function hasNativeLesson(id: string): id is NativeAlgebraId {
  return Object.hasOwn(sources, id);
}

export default function NativeLesson({ activityId, locale, reducedMotion, children }: ActivityProps & { activityId: NativeAlgebraId; children: ReactNode }) {
  const [entry, setEntry] = useState({ frame: 1, revision: 0 });
  const [sound, setSound] = useState(true);
  const [complete, setComplete] = useState(false);
  const initialFrame = entry.frame;
  const source = sources[activityId];
  const controls = sourceControls.find(row => row.key === source.directory);
  const navigate = (frame: number) => {
    if (!quadraticChapters.includes(frame)) return;
    setComplete(false);
    setEntry(previous => ({ frame, revision: previous.revision + 1 }));
  };
  const lesson = useMemo<OriginalLessonDefinition>(() => ({
    width: source.audio.width, height: source.audio.height, fps: source.audio.fps,
    initialFrame, endFrame: source.end,
    chapters: [{ id: source.directory, startFrame: 1, endFrame: source.end, module: `algebra/native/${source.directory}/timeline.mjs` }],
    stops: [...source.stops.map(frame => ({ frame, kind: "manual" })), { frame: source.end, kind: "complete" }],
    audioCues: source.audio.audioCues.filter(cue => cue.frame <= source.end),
    audioAssets: source.audio.audioAssets.map(sound => ({
      ...sound, durationSeconds: sound.durationSeconds ?? sound.sampleCount / sound.sampleRate,
    })),
  }), [source, initialFrame]);
  return <>
    <OriginalLessonPlayer key={`${activityId}:${entry.revision}`} lesson={lesson} locale={locale} reducedMotion={reducedMotion}
      label={t(locale, "Animated algebra lesson with original sound", "Анимированный урок алгебры с оригинальным звуком")}
      stopLabels={{ 36: t(locale, "Begin", "Начать"), 481: t(locale, "Make R the subject", "Выразить R") }}
      playbackHotspots={controls?.playbackHotspots}
      navigationMenus={controls?.navigationMenus.map(menu => ({
        ...menu, items: menu.items.map(item => ({
          ...item, label: `${t(locale, "Chapter", "Глава")} ${item.chapter}`,
        })),
      }))}
      onNavigate={activityId === "algebra-quadratic" ? navigate : undefined}
      initialSound={sound} onSoundChange={setSound}
      autoPlay={initialFrame !== 1}
      onComplete={() => setComplete(true)} onRestart={() => setComplete(false)} />
    {activityId === "algebra-quadratic" && <nav className="controls" aria-label={t(locale, "Original chapters", "Главы оригинала")}>
      {quadraticChapters.map((frame, index) => <button key={frame} className="button button-secondary" onClick={() => navigate(frame)}>
        {t(locale, "Chapter", "Глава")} {index + 1}</button>)}
    </nav>}
    {locale === "ru" && <p>{t(locale, "", "Оригинальные надписи и звук — на английском.")}</p>}
    {complete && <details><summary>{t(locale, "Explore the mathematics", "Исследуйте математику")}</summary>{children}</details>}
  </>;
}
