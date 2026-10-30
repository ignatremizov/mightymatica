import { useEffect, useMemo, useRef, useState } from "react";
import { t, type Locale } from "../../shared/contracts";
import OriginalLessonPlayer from "../../shared/OriginalLessonPlayer";
import { escherPresentation } from "./presentation";
import bandf from "./audio-BandF.json";
import faces from "./audio-faces.json";
import hands from "./audio-hands.json";
import lizards from "./audio-lizards.json";
import stairbig from "./audio-stairbig.json";
import stairs from "./audio-stairs.json";
import waterfall from "./audio-waterfall.json";
import viewports from "./celebration-viewports.json";
import { celebrationViewport } from "./celebrationGeometry";
import { useFacesCelebration } from "./FacesCelebration";
import type { LessonClock } from "../../shared/OriginalLesson";

const recovered = { BandF: bandf, faces, hands, lizards, stairbig, stairs, waterfall };
export default function GameTimeline({ artwork, locale, complete, reducedMotion, stageTarget, sound, onSoundChange }: {
  artwork: string; locale: Locale; complete: boolean; reducedMotion: boolean;
  stageTarget: HTMLElement | null; sound: boolean; onSoundChange: (enabled: boolean) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const lesson = useMemo(() => escherPresentation(
    artwork, complete, recovered[artwork as keyof typeof recovered],
  ), [artwork, complete]);
  const scratch = useRef<HTMLCanvasElement | null>(null);
  const faces = useFacesCelebration(complete && artwork === "faces");
  useEffect(() => () => {
    if (scratch.current) { scratch.current.width = 0; scratch.current.height = 0; }
    scratch.current = null;
  }, [complete]);
  function drawCelebration(context: CanvasRenderingContext2D, clock: Readonly<LessonClock>) {
    if (artwork === "faces") faces.draw(context, clock);
    const target = context.canvas;
    const crop = celebrationViewport(clock.frame, viewports[artwork as keyof typeof viewports], lesson.width, lesson.height);
    const scaleX = target.width / lesson.width, scaleY = target.height / lesson.height;
    const copy = scratch.current ??= document.createElement("canvas");
    if (copy.width !== target.width) copy.width = target.width;
    if (copy.height !== target.height) copy.height = target.height;
    const copied = copy.getContext("2d");
    if (!copied || !crop.width || !crop.height) return;
    copied.clearRect(0, 0, copy.width, copy.height);
    copied.drawImage(target, crop.x * scaleX, crop.y * scaleY, crop.width * scaleX, crop.height * scaleY,
      0, 0, copy.width, copy.height);
    context.save();
    context.setTransform(1, 0, 0, 1, 0, 0);
    context.globalAlpha = 1;
    context.globalCompositeOperation = "source-over";
    context.clearRect(0, 0, target.width, target.height);
    context.drawImage(copy, 0, 0);
    context.restore();
  }
  const tr = (en: string, ru: string) => t(locale, en, ru);
  if (complete) return <section className="escher-celebration-controls" aria-label={tr("Puzzle celebration", "Анимация победы")}>
    {stageTarget && <OriginalLessonPlayer key={artwork}
      lesson={lesson} locale={locale} reducedMotion={reducedMotion}
      stageTarget={stageTarget} drawOverlay={drawCelebration}
      initialSound={sound} onSoundChange={onSoundChange} autoPlay={!reducedMotion}
      loopToFrame={artwork !== "faces" ? 181 : undefined}
      continueAfterComplete={artwork === "faces"}
      completionLabel={tr("Puzzle complete", "Головоломка собрана")}
      onRestart={faces.reset}
      label={tr("Animated completed picture", "Анимация собранной картины")} />}
    {faces.error && <p role="status">{tr("The sphere animation could not be loaded.", "Не удалось загрузить анимацию сфер.")}</p>}
  </section>;
  return <section className="escher-presentation">
    <h3>{tr("Original animated presentation", "Оригинальная анимированная заставка")}</h3>
    <button className="button button-secondary" aria-expanded={expanded} onClick={() => setExpanded(value => !value)}>
      {expanded ? tr("Close animation", "Закрыть анимацию") : tr("View original introduction", "Открыть оригинальную заставку")}
    </button>
    {expanded && <OriginalLessonPlayer key={`${artwork}-${complete}`}
      lesson={lesson} locale={locale} reducedMotion={reducedMotion}
      initialSound={false}
      label={tr("Original Escher introduction", "Оригинальная заставка Эшера")} />}
  </section>;
}
