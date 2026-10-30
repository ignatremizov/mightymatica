import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import type { ActivityProps } from "../../shared/contracts";
import { t } from "../../shared/contracts";
import OriginalLessonPlayer from "../../shared/OriginalLessonPlayer";
import type { OriginalLessonDefinition } from "../../shared/OriginalLesson";
import { sourceStopActions } from "./lessonRules";
import { calculusSourceControls } from "./sourceControls";
import sourceControls from "./source-controls.json";
import enAudio from "./en-audio.json";
import ruAudio from "./ru-audio.json";
import enFlow from "./en-flow.json";
import ruFlow from "./ru-flow.json";

export default function NativeLesson({ locale, reducedMotion, children }: ActivityProps & { children: ReactNode }) {
  const [entry, setEntry] = useState({ frame: 1, revision: 0, locale });
  const initialFrame = entry.locale === locale ? entry.frame : 1;
  const [complete, setComplete] = useState(false);
  const [exploring, setExploring] = useState(false);
  const explorationHeading = useRef<HTMLHeadingElement>(null);
  const [sound, setSound] = useState(true);
  useEffect(() => {
    if (!exploring) return;
    explorationHeading.current?.focus({ preventScroll: true });
    explorationHeading.current?.scrollIntoView({ block: "start", behavior: reducedMotion ? "auto" : "smooth" });
  }, [exploring, reducedMotion]);
  const audio = locale === "ru" ? ruAudio : enAudio;
  const flow = locale === "ru" ? ruFlow : enFlow;
  const lesson = useMemo<OriginalLessonDefinition>(() => ({
    width: audio.width, height: audio.height, fps: audio.fps,
    initialFrame, endFrame: audio.frameCount,
    chapters: [
      { id: "first", startFrame: 1, endFrame: 4000, module: `calculus/native/${locale}/chapter-1.mjs` },
      { id: "middle", startFrame: 4001, endFrame: 8000, module: `calculus/native/${locale}/chapter-2.mjs` },
      { id: "ending", startFrame: 8001, endFrame: audio.frameCount, module: `calculus/native/${locale}/chapter-3.mjs` },
    ],
    stops: flow.stops.map(stop => ({ frame: stop.frame, kind: stop.frame === audio.frameCount ? "complete" : "manual" })),
    audioCues: audio.audioCues,
    audioAssets: audio.audioAssets.map(sound => ({
      ...sound, durationSeconds: sound.durationSeconds ?? sound.sampleCount / sound.sampleRate,
    })),
  }), [audio, flow, initialFrame, locale]);
  const controls = useMemo(() => calculusSourceControls(sourceControls[locale].placements, flow.scenes, locale, flow.stops), [flow, locale]);
  const actions = useMemo(() => sourceStopActions(flow.stops, locale, controls.actionHotspots), [flow, locale, controls]);
  const parts = flow.scenes.filter(scene => scene.name !== "Scene 1");
  const navigate = (frame: number) => {
    if (!parts.some(part => part.startFrame === frame)) return;
    setComplete(false);
    setExploring(false);
    setEntry(previous => ({ frame, revision: previous.revision + 1, locale }));
  };
  return <div className="calculus-native-lesson">
    <OriginalLessonPlayer key={`${locale}:${entry.revision}`} lesson={lesson} locale={locale} reducedMotion={reducedMotion}
      label={t(locale, "Calculus in five minutes: original animated lesson and questions", "Математический анализ за пять минут: оригинальный анимированный урок и вопросы")}
      stopActions={actions}
      stopHotspots={controls.stopHotspots}
      stopLabels={controls.stopLabels}
      playbackHotspots={controls.playbackHotspots}
      navigationMenus={controls.navigationMenus}
      onNavigate={navigate}
      initialSound={sound}
      onSoundChange={setSound}
      autoPlay={entry.revision > 0 && entry.locale === locale}
      controlsBefore={<nav className="calculus-part-shortcuts" aria-label={t(locale, "Original lesson parts", "Части оригинального урока")}>
        {parts.map((part, index) => <button key={part.name} className="button button-secondary"
          onClick={() => navigate(part.startFrame)}>{part.name === "Scene 7" ? t(locale, "Quiz", "Тест") : `${t(locale, "Part", "Часть")} ${index + 1}`}</button>)}
      </nav>}
      completionAction={{
        label: t(locale, "Explore slope and accumulation", "Исследуйте наклон и накопление"),
        onClick: () => {
          if (exploring) {
            explorationHeading.current?.focus({ preventScroll: true });
            explorationHeading.current?.scrollIntoView({ block: "start", behavior: reducedMotion ? "auto" : "smooth" });
          } else setExploring(true);
        },
      }}
      onComplete={() => setComplete(true)} onRestart={() => { setComplete(false); setExploring(false); }} />
    <details className="calculus-ignat-note">
      <summary>{t(locale, "A small note from Ignat: + C", "Небольшое замечание от Игната: + C")}</summary>
      <p>{t(locale,
        "An indefinite integral gives a family of antiderivatives, so remember the arbitrary constant: ∫v(t) dt = S(t) + C. The lesson shows a particular antiderivative. If the starting position is known, it determines C.",
        "Неопределённый интеграл задаёт семейство первообразных, поэтому не забывайте о произвольной постоянной: ∫v(t) dt = S(t) + C. В уроке показана одна из первообразных. Если начальное положение известно, оно определяет C.")}</p>
    </details>
    {complete && exploring && <section className="calculus-exploration">
      <h3 ref={explorationHeading} tabIndex={-1}>{t(locale, "Explore slope and accumulation", "Исследуйте наклон и накопление")}</h3>
      {children}
    </section>}
  </div>;
}
