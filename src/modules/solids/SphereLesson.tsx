import { useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { t, type Locale } from "../../shared/contracts";
import OriginalLessonPlayer from "../../shared/OriginalLessonPlayer";
import manifest from "../../content/sphere-lesson.json";
import SphereQuiz from "./SphereQuiz";

const stopLabels: Record<Locale, Record<number, string>> = {
  en: { 3: "Play", 2878: "Go to Examples", 2901: "Play examples", 4147: "Continue" },
  ru: { 73: "Воспроизвести", 2879: "Посмотреть примеры" },
};
const playHit = { x: 13.6, y: 6.65, width: 105.9, height: 40.75 };
const examplesHit = { x: 21.5, y: 327.45, width: 203, height: 55, sourceArtwork: true };
const stopHotspots = {
  en: { 3: playHit, 2878: examplesHit, 2901: playHit,
    4147: { x: 0, y: 331.763, width: 91.254, height: 35.114 } },
  ru: { 73: playHit, 2879: examplesHit },
};
const playbackHotspots = {
  en: [
    { ...playHit, firstFrame: 3, lastFrame: 2875 },
    { ...playHit, firstFrame: 2901, lastFrame: 4124 },
    { x: -.653232, y: 331.763273, width: 91.255046, height: 35.114666,
      firstFrame: 4147, lastFrame: 5057 },
  ],
  ru: [{ ...playHit, firstFrame: 73, lastFrame: 2883 }],
};

/** The authored film is primary; exploration and the corrected quiz come later. */
export default function SphereLesson({ locale, reducedMotion, explorer }: {
  locale: Locale;
  reducedMotion: boolean;
  explorer: ReactNode;
}) {
  const [complete, setComplete] = useState(false);
  const [showQuiz, setShowQuiz] = useState(false);
  const [explore, setExplore] = useState(false);
  const [focusRequest, setFocusRequest] = useState(0);
  const explorerHeading = useRef<HTMLHeadingElement>(null);
  const focusedRequest = useRef(0);
  useLayoutEffect(() => {
    if (!complete || !explore || focusRequest === focusedRequest.current || !explorerHeading.current) return;
    focusedRequest.current = focusRequest;
    explorerHeading.current.scrollIntoView({ behavior: reducedMotion ? "auto" : "smooth", block: "start" });
    explorerHeading.current.focus({ preventScroll: true });
  }, [complete, explore, focusRequest, reducedMotion]);
  const restart = () => {
    setComplete(false);
    setShowQuiz(false);
    setExplore(false);
    setFocusRequest(0);
    focusedRequest.current = 0;
  };
  return <section className="sphere-lesson" aria-label={t(locale, "Volume of a sphere", "Объём шара")}>
    <OriginalLessonPlayer
      lesson={manifest.languages[locale]}
      locale={locale}
      reducedMotion={reducedMotion}
      label={t(locale, "Volume of a sphere", "Объём шара")}
      stopLabels={stopLabels[locale]}
      stopHotspots={stopHotspots[locale]}
      playbackHotspots={playbackHotspots[locale]}
      completionAction={{
        label: t(locale, "Try it yourself", "Попробовать самостоятельно"),
        onClick: () => { setExplore(true); setFocusRequest(value => value + 1); },
      }}
      onComplete={() => setComplete(true)}
      onRestart={restart}
    />
    {complete && <div className="sphere-lesson-followup">
      {!showQuiz && <button className="button" onClick={() => setShowQuiz(true)}>{t(locale, "Check your understanding", "Проверить знания")}</button>}
      {showQuiz && <SphereQuiz locale={locale} />}
      <details open={explore} onToggle={event => setExplore(event.currentTarget.open)}>
        <summary>{t(locale, "Explore the mathematics", "Исследовать математику")}</summary>
        {explore && <div><h2 ref={explorerHeading} tabIndex={-1}>{t(locale, "Try it yourself", "Попробовать самостоятельно")}</h2>{explorer}</div>}
      </details>
    </div>}
  </section>;
}
