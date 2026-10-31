import { useState, type ReactNode } from "react";
import OriginalLessonPlayer from "../../shared/OriginalLessonPlayer";
import type { LessonClock } from "../../shared/OriginalLesson";
import { t } from "../../shared/contracts";
import type { ActivityProps } from "../../shared/contracts";
import lessons from "./native-lessons.json";
import sourceControls from "./source-controls.json";
import { subtraction, subtractionExampleIndex } from "./rules";

const eligibleNumbers = Array.from({ length: 900 }, (_, index) => index + 100)
  .filter(number => subtraction(number) !== null);

/** Recovered device-text fields at the final source timer's authored positions. */
function drawExample(context: CanvasRenderingContext2D, number: number, russian: boolean) {
  const result = subtraction(number)!;
  context.save();
  context.font = `bold ${russian ? 65 : 67}px "Times New Roman", Times, serif`;
  context.textAlign = "center";
  context.textBaseline = "top";
  context.fillStyle = "#ff0099";
  const fields = [
    [131.675, 65.65, number],
    [129.9, 138.45, result.reverse],
    [133.9, 219.45, result.difference],
    [383.9, 58.45, result.difference],
    [383.15, 135.45, result.reversedDifference],
  ];
  for (const [x, y, value] of fields) context.fillText(String(value), x, y);
  context.restore();
}

export default function MagicLesson({ kind, explorer, locale, reducedMotion }: ActivityProps & {
  kind: "subtraction" | "hourglasses";
  explorer: ReactNode;
}) {
  const [complete, setComplete] = useState(false);
  const hint = kind === "hourglasses"
    ? sourceControls.find(row => row.key === `${kind}:${locale}`)?.actionHotspots.bHint
    : undefined;
  const [open, setOpen] = useState(false);
  const [examples, setExamples] = useState(() => Array.from({ length: 20 }, () =>
    eligibleNumbers[Math.floor(Math.random() * eligibleNumbers.length)]!));
  const drawOverlay = kind === "subtraction" ? (context: CanvasRenderingContext2D, state: Readonly<LessonClock>) => {
    if (state.frame < 895) return;
    // First timer event occurs after 500 ms, not on entry. Twenty updates,
    // held by the same pause/visibility/audio clock as the source film.
    const index = subtractionExampleIndex(state.frame === 895 ? state.frameElapsed : 10);
    if (index !== null) drawExample(context, examples[index]!, locale === "ru");
  } : undefined;
  return <section className={`magic magic-${kind}-lesson`}>
    <OriginalLessonPlayer
      key={`${kind}-${locale}`}
      lesson={lessons[kind][locale]}
      locale={locale}
      reducedMotion={reducedMotion}
      label={kind === "subtraction"
        ? t(locale, "Mysterious subtraction", "Удивительное вычитание")
        : t(locale, "Two hourglasses", "Двое песочных часов")}
      stopLabels={kind === "hourglasses" ? { 765: t(locale, "HINT", "ПОДСКАЗКА") } : undefined}
      stopHotspots={hint ? { 765: hint } : undefined}
      drawOverlay={drawOverlay}
      onComplete={() => setComplete(true)}
      onRestart={() => {
        setComplete(false); setOpen(false);
        setExamples(Array.from({ length: 20 }, () =>
          eligibleNumbers[Math.floor(Math.random() * eligibleNumbers.length)]!));
      }}
    />
    {complete && <details open={open} onToggle={event => setOpen(event.currentTarget.open)}>
      <summary>{kind === "subtraction"
        ? t(locale, "Try examples and explore the secret", "Проверить примеры и узнать секрет")
        : t(locale, "Try the hourglasses yourself", "Попробовать самостоятельно")}</summary>
      {open && explorer}
    </details>}
  </section>;
}
