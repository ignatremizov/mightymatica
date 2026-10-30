import { useState } from "react";
import type { ActivityProps } from "../../shared/contracts";
import { equilateralPoints, monochromaticProgressions, monochromaticTriangles } from "./rules";
import "./style.css";
import SolidActivity, { isSolidActivity } from "./SolidActivity";
import ColoringLesson from "./ColoringLesson";
import { isColoringLesson } from "./lessons";

const palette = ["#ff00cc", "#0000ff", "#00ff00"];
export default function Coloring(props: ActivityProps) {
  if (isColoringLesson(props.activityId)) return <ColoringLesson key={`${props.activityId}-${props.locale}`} {...props}
    explorer={isSolidActivity(props.activityId) ? <SolidActivity {...props} /> : <ColoringActivity {...props} />} />;
  if (isSolidActivity(props.activityId)) return <SolidActivity key={props.activityId} {...props} />;
  return <ColoringActivity key={props.activityId} {...props} />;
}
function ColoringActivity({ activityId, locale }: ActivityProps) {
  const ru = locale === "ru";
  const text = (en: string, russian: string) => ru ? russian : en;
  const initialColors = [0, 1, 0, 1, 0, 1];
  const [colors, setColors] = useState(initialColors);
  const [step, setStep] = useState(0);
  const [hint, setHint] = useState(false);
  const cycle = (i: number, count = 2) => setColors(previous => previous.map((v, j) => i === j ? (v + 1) % count : v));
  const reset = () => { setColors(initialColors); setStep(0); setHint(false); };
  const segment = activityId === "coloring-segment";
  const equilateral = activityId === "coloring-equilateral";
  const three = activityId === "coloring-three-plane";
  const question = three
    ? text("A plane is painted in three colors. Prove that two points of the same color are one unit apart.", "Плоскость раскрашена в три цвета. Докажите, что найдутся две одноцветные точки на расстоянии 1.")
    : segment
      ? text("A plane is painted in two colors. Prove that there is a segment whose ends and midpoint all have the same color.", "Плоскость раскрашена в два цвета. Докажите, что существует отрезок с одноцветными концами и серединой.")
      : equilateral
        ? text("A plane is painted in two colors. Prove that an equilateral triangle with vertices of the same color exists.", "Плоскость раскрашена в два цвета. Докажите, что найдётся правильный треугольник с одноцветными вершинами.")
        : text("A plane is painted in two colors. Prove that two points of the same color are one unit apart.", "Плоскость раскрашена в два цвета. Докажите, что найдутся две одноцветные точки на расстоянии 1.");
  const names = segment ? ["C", "A", "E", "B", "D"] : equilateral ? ["A", "B", "C", "E", "F", "D"] : ["A", "B", "C"];
  const triangles = equilateral ? monochromaticTriangles(equilateralPoints, [1, 1, 1, ...colors.slice(3)]) : [];
  const progressions = segment ? monochromaticProgressions(colors.slice(0, 5), [0, 1, 1.5, 2, 3]) : [];
  const equalPair = !segment && !equilateral && !three ? [[0, 1], [1, 2], [0, 2]].find(([a, b]) => colors[a!] === colors[b!]) : undefined;
  const positions = segment ? [[70, 210], [70 + 400 / 3, 210], [270, 210], [70 + 800 / 3, 210], [470, 210]] :
    equilateral ? equilateralPoints.map(([x, y]) => [100 + x * 170, 360 - y * 170]) : [[270, 75], [170, 248], [370, 248]];
  const proof = three ? [
    text("Assume that no two points one unit apart share a color. Every unit equilateral triangle must then use all three colors.", "Предположим, что одноцветных точек на расстоянии 1 нет. Тогда каждый единичный равносторонний треугольник имеет три цвета."),
    text("Reflect A across BC to A′. Since A′ is one unit from B and C, it must have A’s color. AA′ = √3.", "Отразим A относительно BC в A′. Точка A′ на расстоянии 1 от B и C, значит она имеет цвет A. AA′ = √3."),
    text("Turn this construction around A. Every point of the circle of radius √3 must have A’s color.", "Поворачивая конструкцию вокруг A, получаем: вся окружность радиуса √3 имеет цвет A."),
    text("That circle has a chord of length 1. Its endpoints share a color: a contradiction. The original assertion is proved.", "На этой окружности есть хорда длины 1. Её концы одного цвета — противоречие. Утверждение доказано."),
  ] : segment ? [
    text("First find two points A and B of the same color (the unit-triangle argument guarantees a pair). Suppose no monochromatic ends-and-midpoint triple exists.", "Сначала найдём одноцветные A и B (это гарантирует аргумент с единичным треугольником). Предположим, что одноцветной тройки «концы и середина» нет."),
    text("Extend the line to C and D with CA = AB = BD. C must have the other color because A is the midpoint of CB. Similarly D must have the other color.", "Продлим прямую: CA = AB = BD. Цвет C отличен от A, иначе C, A, B — нужная тройка. Аналогично цвет D отличен от B."),
    text("E is the common midpoint of AB and CD. If E has A’s color, AB works; otherwise CD works. Either way the desired segment exists.", "E — общая середина AB и CD. Если цвет E совпадает с A, подходит AB; иначе подходит CD. Искомый отрезок существует."),
  ] : equilateral ? [
    text("The ends-and-midpoint result supplies collinear blue A, B, C with AB = BC. These three points are fixed blue here.", "Предыдущий результат даёт синие A, B, C на одной прямой, AB = BC. Здесь их синий цвет фиксирован."),
    text("Let D be the third vertex of an equilateral triangle ACD.", "Пусть D — третья вершина правильного треугольника ACD."),
    text("Now build equilateral triangles ABE and BCF on the same side.", "Теперь построим правильные треугольники ABE и BCF по ту же сторону прямой."),
    text("If E, F or D is blue, one of those triangles is blue. Otherwise EFD is a magenta equilateral triangle. Try changing E, F and D: all eight choices work.", "Если E, F или D синяя, соответствующий треугольник синий. Иначе EFD — пурпурный правильный треугольник. Меняйте цвета E, F и D: подходят все восемь вариантов."),
  ] : [
    text("Choose three vertices of a unit equilateral triangle anywhere in the plane.", "Возьмём вершины единичного равностороннего треугольника в плоскости."),
    text("Three points, only two colors: at least two share a color. Every pair of these vertices is one unit apart.", "Три точки и лишь два цвета: хотя бы две точки одного цвета. Расстояние между любой парой вершин равно 1."),
  ];
  return <div className="activity-layout coloring-family">
      <p>{question}</p>
      {!hint && <button className="button" onClick={() => setHint(true)}>{text("Hint", "Подсказка")}</button>}
      {hint && <>
      <svg className="diagram" viewBox={three ? "0 0 540 540" : "0 0 540 410"} role="img" aria-label={text("Labeled geometric proof diagram", "Подписанная геометрическая схема доказательства")}>
        {three ? <>
          {step >= 2 && <><circle cx="270" cy="220" r={110 * Math.sqrt(3)} fill="none" stroke="#fff" strokeWidth="7" /><circle cx="270" cy="220" r={110 * Math.sqrt(3)} fill="none" stroke={palette[0]} strokeWidth="4" /></>}
          <path d="M270 220 L215 315.26 L325 315.26 Z" fill="none" stroke="#b1bfd3" strokeWidth="3" />
          {step >= 1 && <path d="M215 315.26 L270 410.52 L325 315.26" fill="none" stroke="#b1bfd3" strokeWidth="3" />}
          {[[270, 220, "A", 0], [215, 315.26, "B", 1], [325, 315.26, "C", 2], ...(step >= 1 ? [[270, 410.52, "A′", 0]] : [])].map(([x, y, name, c]) => <g key={String(name)}><circle cx={Number(x)} cy={Number(y)} r="13" fill={palette[Number(c)]} /><text x={Number(x) + 18} y={Number(y) - 12}>{name}</text></g>)}
          {step === 3 && <><path d={`M215 ${220 - Math.sqrt(33275)} L325 ${220 - Math.sqrt(33275)}`} stroke="#fff" strokeWidth="8" /><path d={`M215 ${220 - Math.sqrt(33275)} L325 ${220 - Math.sqrt(33275)}`} stroke={palette[0]} strokeWidth="5" /><circle cx="215" cy={220 - Math.sqrt(33275)} r="7" fill={palette[0]} /><circle cx="325" cy={220 - Math.sqrt(33275)} r="7" fill={palette[0]} /><text x="270" y="63" textAnchor="middle">1</text></>}
        </> : <>
          {segment ? <line x1={step >= 1 ? 70 : 70 + 400 / 3} y1="210" x2={step >= 1 ? 470 : 70 + 800 / 3} y2="210" stroke="#b1bfd3" strokeWidth="3" /> : equilateral ? <path d={step >= 2 ? "M100 360 L270 65.55 L440 360 Z M100 360 L185 212.78 L270 360 L355 212.78 L440 360 M185 212.78 L355 212.78" : step === 1 ? "M100 360 L270 65.55 L440 360 Z" : "M100 360 L440 360"} fill="none" stroke="#b1bfd3" strokeWidth="2" /> : <path d="M270 75 L170 248 L370 248 Z" fill="none" stroke="#b1bfd3" strokeWidth="3" />}
          {step === proof.length - 1 && triangles.map(triple => <polygon key={triple.join()} points={triple.map(i => positions[i]!.join(",")).join(" ")} fill="none" stroke="#fff" strokeWidth="6" />)}
          {step > 0 && equalPair && <line x1={positions[equalPair[0]!]![0]} y1={positions[equalPair[0]!]![1]} x2={positions[equalPair[1]!]![0]} y2={positions[equalPair[1]!]![1]} stroke="#fff" strokeWidth="6" />}
          {positions.map(([x, y], i) => {
            if (equilateral && (i === 5 && step < 1 || (i === 3 || i === 4) && step < 2) ||
              segment && (i === 2 && step < 2 || (i === 0 || i === 4) && step < 1)) return null;
            const color = equilateral && i < 3 ? 1 : colors[i]!;
            return <g key={i}><circle cx={x} cy={y} r="19" fill={palette[color]} stroke="#13253c" strokeWidth="3" /><text x={x} y={y! + 6} textAnchor="middle" style={{ fill: color === 1 ? "#fff" : "#000" }}>{color + 1}</text><text x={x} y={y! - 31} textAnchor="middle">{names[i]}</text></g>;
          })}
        </>}
      </svg>
      {!three && step === proof.length - 1 && <div className="controls">{names.map((name, i) => <button className="button button-secondary" key={name} disabled={equilateral && i < 3} onClick={() => cycle(i)} aria-label={`${name}: ${text("color", "цвет")} ${equilateral && i < 3 ? 2 : colors[i]! + 1}`}>{name}: {equilateral && i < 3 ? 2 : colors[i]! + 1} {equilateral && i < 3 ? "🔒" : "↻"}</button>)}</div>}
      {step === proof.length - 1 && <p className="activity-status" aria-live="polite">{segment ? progressions.length ? `${text("Monochromatic ends and midpoint", "Одноцветные концы и середина")}: ${progressions.map(p => p.map(i => names[i]).join("–")).join(", ")}` : text("No triple in these five sampled points. That does not contradict the theorem about the whole plane. Read the proof below.", "На этих пяти точках тройки нет. Это не опровергает теорему о всей плоскости. Прочтите доказательство ниже.") : equilateral ? `${text("Equilateral triangle found", "Найден равносторонний треугольник")}: ${triangles.map(p => p.map(i => names[i]).join("")).join(", ")}` : equalPair ? `${names[equalPair[0]!]}${names[equalPair[1]!]}: ${text("same color, distance 1", "один цвет, расстояние 1")}` : text("Explore the proof below.", "Исследуйте доказательство ниже.")}</p>}
      <div className="controls"><button className="button button-secondary" disabled={step === 0} onClick={() => setStep(step - 1)}>{text("Previous", "Назад")}</button><span>{step + 1} / {proof.length}</span><button className="button" disabled={step === proof.length - 1} onClick={() => setStep(step + 1)}>{text("Next proof step", "Далее")}</button><button className="button button-secondary" onClick={reset}>{text("Reset", "Сбросить")}</button></div>
      <p className="explanation" aria-live="polite">{proof[step]}</p>
      </>}
  </div>;
}
