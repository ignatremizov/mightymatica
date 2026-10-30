import { useState, type ReactNode } from "react";
import type { ActivityProps } from "../../shared/contracts";
import { t } from "../../shared/contracts";
import OriginalLessonPlayer from "../../shared/OriginalLessonPlayer";
import { coloringLessons, isColoringLesson } from "./lessons";
import { coloringHintFrame, coloringHintSound } from "./lessonRules";

// Cube geometry/alpha animation lives in its owned native drawing adapter.
// An overlay callback asks the shared transport to redraw during Timer holds.
const redrawHeldCube = () => {};

export default function ColoringLesson({ activityId, locale, reducedMotion, explorer }: ActivityProps & { explorer: ReactNode }) {
  const [complete, setComplete] = useState(false);
  const [explore, setExplore] = useState(false);
  const [wrong, setWrong] = useState(false);
  if (!isColoringLesson(activityId)) return null;
  const cube = activityId === "coloring-cube";
  const question = cube
    ? t(locale, "A cube has six differently colored faces. How many different colorings are there, counting rotated copies as one?", "Все шесть граней куба окрашены в разные цвета. Сколько различных раскрасок, если повёрнутые копии считать одной?")
    : activityId === "coloring-segment"
      ? t(locale, "A plane is painted in two colors. Prove that a segment has both ends and its midpoint the same color.", "Плоскость раскрашена в два цвета. Докажите, что найдётся отрезок с одноцветными концами и серединой.")
      : activityId === "coloring-equilateral"
        ? t(locale, "A plane is painted in two colors. Prove that an equilateral triangle has vertices of the same color.", "Плоскость раскрашена в два цвета. Докажите, что найдётся правильный треугольник с одноцветными вершинами.")
        : t(locale,
          `A plane is painted in ${activityId === "coloring-three-plane" ? "three" : "two"} colors. Prove that two points of the same color are one unit apart.`,
          `Плоскость раскрашена в ${activityId === "coloring-three-plane" ? "три" : "два"} цвета. Докажите, что найдутся одноцветные точки на расстоянии 1.`);
  const actions = cube
    ? { 1: [6, 24, 30, 720].map(answer => ({
      label: String(answer), targetFrame: answer === 30 ? 3 : 1,
      soundId: answer === 30 ? 36 : 25,
    })) }
    : { 26: [{ label: t(locale, "Hint", "Подсказка"), targetFrame: coloringHintFrame(activityId),
      soundId: coloringHintSound(activityId, locale) }] };
  return <section className="coloring-family coloring-lesson">
    <p>{question}</p>
    <OriginalLessonPlayer
      lesson={coloringLessons[activityId][locale]}
      locale={locale} reducedMotion={reducedMotion} label={question}
      blockedStopFrames={cube ? [1] : [26]}
      stopActions={actions}
      onAction={(_frame, index) => { if (cube) setWrong(index !== 2); }}
      drawOverlay={cube ? redrawHeldCube : undefined}
      onComplete={() => setComplete(true)}
      onRestart={() => { setComplete(false); setExplore(false); setWrong(false); }}
    />
    {wrong && <p role="status">{t(locale, "Wrong answer! Try again.", "Неверный ответ! Попробуйте ещё раз.")}</p>}
    {complete && <details open={explore} onToggle={event => setExplore(event.currentTarget.open)}>
      <summary>{t(locale, "Explore the mathematics", "Исследовать математику")}</summary>
      {explore && explorer}
    </details>}
  </section>;
}
