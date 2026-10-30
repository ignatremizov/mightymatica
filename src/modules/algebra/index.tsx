import { useState } from "react";
import type { ActivityProps } from "../../shared/contracts";
import { t } from "../../shared/contracts";
import { differencePieces, integerSum, oddLayers, quadratic, resistance } from "./rules";
import NativeLesson, { hasNativeLesson } from "./NativeLesson";
import "./style.css";

type LessonProps = { locale: ActivityProps["locale"] };
const palette = ["#ffff99", "#ff6633", "#ff99cc", "#99ccff", "#cc99ff", "#ffcc99"];
const fmt = (n: number) => Number(n.toFixed(4)).toString();

function Slider({ label, value, min = 1, max = 10, onChange }: { label: string; value: number; min?: number; max?: number; onChange: (n: number) => void }) {
  return <label className="control">{label}: <strong>{value}</strong><input type="range" min={min} max={max} step="1" value={value} onChange={event => onChange(Number(event.target.value))} /></label>;
}

function Steps({ locale, steps, step, setStep }: LessonProps & { steps: string[]; step: number; setStep: (n: number) => void }) {
  return <section className="explanation">
    <p className="activity-status" aria-live="polite">{t(locale, "Step", "Шаг")} {step + 1}/{steps.length}: {steps[step]}</p>
    <div className="controls">
      <button className="button button-secondary" disabled={step === 0} onClick={() => setStep(step - 1)}>{t(locale, "Previous", "Назад")}</button>
      <button className="button" disabled={step === steps.length - 1} onClick={() => setStep(step + 1)}>{t(locale, "Next", "Далее")}</button>
      <button className="button button-secondary" onClick={() => setStep(0)}>{t(locale, "Restart proof", "Начать заново")}</button>
    </div>
  </section>;
}

function SquareSum({ locale }: LessonProps) {
  const [a, setA] = useState(5), [b, setB] = useState(3), [step, setStep] = useState(0);
  const unit = 240 / (a + b), x = a * unit, y = b * unit;
  return <>
    <p>{t(locale, "Change the side lengths, then reveal the four areas. Every piece stays inside the same square.", "Изменяйте длины сторон и раскрывайте четыре площади. Все части остаются внутри одного квадрата.")}</p>
    <div className="controls"><Slider label="a" value={a} onChange={setA} /><Slider label="b" value={b} onChange={setB} /></div>
    <svg className="diagram algebra-diagram" viewBox="0 0 420 330" role="img" aria-label={step === 0 ? t(locale, "Square of side a + b", "Квадрат со стороной a + b") : `(a+b)² = a² + 2ab + b²`}>
      <g transform="translate(80 45)">
        <rect width="240" height="240" fill={palette[0]} stroke="currentColor" />
        {step > 0 && <>
          <rect width={x} height={x} fill={palette[0]} stroke="white" /><rect x={x} width={y} height={x} fill={palette[1]} stroke="white" />
          <rect y={x} width={x} height={y} fill={palette[1]} stroke="white" /><rect x={x} y={x} width={y} height={y} fill={palette[2]} stroke="white" />
          <text x={x / 2} y={x / 2}>a²</text><text x={x + y / 2} y={x / 2}>ab</text><text x={x / 2} y={x + y / 2}>ab</text><text x={x + y / 2} y={x + y / 2}>b²</text>
        </>}
        <text className="algebra-dimension" x={x / 2} y="-15">a = {a}</text><text className="algebra-dimension" x={x + y / 2} y="-15">b = {b}</text>
        <text className="algebra-dimension" x="120" y="270">a + b = {a + b}</text>
      </g>
    </svg>
    <Steps locale={locale} step={step} setStep={setStep} steps={[
      t(locale, "A square of side a + b has area (a + b)².", "Площадь квадрата со стороной a + b равна (a + b)²."),
      t(locale, "Cut at a in both directions: a², ab, ab, b².", "Разрежьте по отметке a: a², ab, ab, b²."),
      `(a + b)² = a² + 2ab + b² → ${a * a} + ${2 * a * b} + ${b * b} = ${(a + b) ** 2}`,
    ]} />
  </>;
}

function Difference({ locale }: LessonProps) {
  const [a, setA] = useState(7), [b, setB] = useState(3), [step, setStep] = useState(0);
  const pieces = differencePieces(a, b), u = 300 / (a + b), h = (a - b) * u;
  return <>
    <p>{t(locale, "Remove the small square, cut the L-shape, and turn its upper strip to make a rectangle. The two remaining pieces never change area.", "Уберите малый квадрат, разрежьте оставшуюся фигуру и поверните верхнюю полосу. Площадь каждой части сохраняется.")}</p>
    <div className="controls"><Slider label="a" min={2} value={a} onChange={n => { setA(n); setB(Math.min(b, n - 1)); }} /><Slider label="b" max={a - 1} value={b} onChange={setB} /></div>
    <svg className="diagram algebra-diagram" viewBox="0 0 440 360" role="img" aria-label={step < 2 ? t(locale, "Square with a smaller square removed", "Квадрат без меньшего квадрата") : `a² − b² = (a − b)(a + b) = ${pieces.area}`}>
      <g transform="translate(65 45)">
        {step < 2 ? <>
          <rect x="0" y={b * u} width={a * u} height={h} fill={palette[0]} stroke="white" />
          <rect width={h} height={b * u} fill={palette[1]} stroke="white" />
          <rect x={h} width={b * u} height={b * u} fill="none" stroke="currentColor" strokeDasharray="5 4" />
          <text className="algebra-dimension" x={h + b * u / 2} y={b * u / 2}>−b²</text>
          <text className="algebra-dimension" x={a * u / 2} y={a * u + 25}>a = {a}</text>
        </> : <>
          <rect width={a * u} height={h} fill={palette[0]} stroke="white" /><rect x={a * u} width={b * u} height={h} fill={palette[1]} stroke="white" />
          <text x={a * u / 2} y={h / 2}>a</text><text x={a * u + b * u / 2} y={h / 2}>b</text>
          <text className="algebra-dimension" x="150" y={h + 30}>a + b = {a + b}</text><text className="algebra-dimension" x="150" y="-18">a − b = {a - b}</text>
        </>}
      </g>
    </svg>
    <Steps locale={locale} step={step} setStep={setStep} steps={[
      `a² − b² = ${a * a} − ${b * b} = ${pieces.area}`,
      t(locale, "Cut the remaining L into a × (a−b) and b × (a−b) pieces.", "Разделите остаток на части a × (a−b) и b × (a−b)."),
      `a(a−b) + b(a−b) = (a+b)(a−b) = ${pieces.width} × ${pieces.height} = ${pieces.area}`,
    ]} />
  </>;
}

function Sums({ locale, odd }: LessonProps & { odd: boolean }) {
  const [n, setN] = useState(5), [step, setStep] = useState(0);
  const unit = 280 / (n + (odd ? 0 : 1));
  const cells = [];
  for (let row = 0; row < n; row++) for (let col = 0; col < (odd ? n : n + 1); col++) {
    const original = col <= row;
    if (!odd && !original && step === 0) continue;
    const layer = Math.max(row, col);
    cells.push(<rect key={`${row}-${col}`} x={col * unit} y={row * unit} width={unit - 1} height={unit - 1} fill={odd ? palette[layer % palette.length] : palette[original ? 0 : 1]} opacity={odd && step === 0 && layer === n - 1 ? 0.35 : 1} />);
  }
  const total = odd ? n * n : integerSum(n);
  return <>
    <p>{odd ? t(locale, "Each new L-shaped border contains the next odd number of squares. Change n and count its two arms, sharing one corner.", "Каждая новая Г-образная рамка содержит следующее нечётное число клеток. Изменяйте n и считайте две стороны с одним общим углом.") : t(locale, "The first staircase has 1 + 2 + … + n cells. Add a turned copy to fill an n by n+1 rectangle.", "Первая лестница содержит 1 + 2 + … + n клеток. Добавьте перевёрнутую копию, чтобы получить прямоугольник n на n+1.")}</p>
    <Slider label="n" value={n} max={10} onChange={setN} />
    <svg className="diagram algebra-diagram" viewBox="0 0 400 370" role="img" aria-label={step === 0 ? t(locale, odd ? "Odd-numbered borders" : "A staircase of cells", odd ? "Рамки из нечётного числа клеток" : "Лестница из клеток") : odd ? `1 + 3 + … + ${2 * n - 1} = ${total}` : `Two staircases: 2 × ${total} = ${n} × ${n + 1}`}>
      <g transform="translate(60 35)">{cells}<text className="algebra-dimension" x="140" y={n * unit + 28}>{odd ? `${n} × ${n}` : `${n} × ${n + 1}`}</text></g>
    </svg>
    <Steps locale={locale} step={step} setStep={setStep} steps={odd ? [
      `${oddLayers(n).join(" + ")} = ?`,
      t(locale, `The newest border has n + (n−1) = ${2 * n - 1} cells.`, `Новая рамка содержит n + (n−1) = ${2 * n - 1} клеток.`),
      `1 + 3 + … + (2n−1) = n² = ${total}`,
    ] : [
      `${Array.from({ length: n }, (_, i) => i + 1).join(" + ")} = ?`,
      `2S = n(n+1) = ${n} × ${n + 1} = ${2 * total}`,
      `S = n(n+1)/2 = ${total}`,
    ]} />
  </>;
}

function Transform({ locale }: LessonProps) {
  const [prelude, setPrelude] = useState(0);
  const [v, setV] = useState(8), [r, setR] = useState(3), [step, setStep] = useState(0);
  const value = resistance(v, r);
  const equations = ["V = 12R / (r + R)", "V(r + R) = 12R", "Vr + VR = 12R", "VR − 12R = −Vr", "R(V − 12) = −Vr", "R = −Vr / (V − 12) = Vr / (12 − V)"];
  const instructions = [
    t(locale, "Find R in terms of V and r. The original denominator must not be zero.", "Выразите R через V и r. Исходный знаменатель не должен равняться нулю."),
    t(locale, "Multiply both sides by r + R.", "Умножьте обе части на r + R."),
    t(locale, "Distribute V across the parentheses.", "Раскройте скобки."),
    t(locale, "Subtract 12R and Vr from both sides.", "Вычтите 12R и Vr из обеих частей."),
    t(locale, "Factor out R.", "Вынесите R за скобки."),
    t(locale, "Divide by V − 12. This step requires V ≠ 12.", "Разделите на V − 12. Этот шаг требует V ≠ 12."),
  ];
  if (prelude < 2) return <>
    <h3>{t(locale, "Distributive property of multiplication", "Распределительное свойство умножения")}</h3>
    <p className="algebra-equation">{prelude === 0 ? "c(a + b) = ca + cb" : "ca + cb = c(a + b)"}</p>
    <p>{t(locale, "Multiply each term inside the parentheses, or factor the shared multiplier back out.", "Умножьте каждое слагаемое в скобках или вынесите общий множитель за скобки.")}</p>
    <button className="button" onClick={() => setPrelude(prelude + 1)}>{t(locale, "Next", "Далее")}</button>
  </>;
  return <>
    <button className="button button-secondary" onClick={() => { setPrelude(0); setStep(0); }}>{t(locale, "Restart lesson", "Начать заново")}</button>
    <p>{t(locale, "Explore the original equation with positive values: 0 < V < 12 and r > 0. Work through one legal transformation at a time.", "Исследуйте исходное уравнение при 0 < V < 12 и r > 0. Выполняйте по одному допустимому преобразованию.")}</p>
    <div className="controls"><Slider label="V" value={v} max={11} onChange={setV} /><Slider label="r" value={r} onChange={setR} /></div>
    <div className="algebra-equation">{equations[step]}</div>
    <Steps locale={locale} step={step} setStep={setStep} steps={instructions} />
    {step === equations.length - 1 && <p className="activity-status">R = {fmt(value)}; 12R / (r + R) = {fmt(12 * value / (r + value))} = V</p>}
    <p className="activity-note">{t(locale, "Domain matters: r + R ≠ 0. V = 12 cannot be handled by dividing by V − 12; for positive r it has no solution.", "Область допустимых значений: r + R ≠ 0. При V = 12 нельзя делить на V − 12; для положительного r решений нет.")}</p>
  </>;
}

function QuadraticExplorer({ locale }: LessonProps) {
  const [a, setA] = useState(1), [b, setB] = useState(-4), [c, setC] = useState(3), [step, setStep] = useState(0);
  const result = quadratic(a, b, c);
  const point = (x: number) => `${200 + x * 24},${180 - (a * x * x + b * x + c) * 12}`;
  const curve = Array.from({ length: 161 }, (_, i) => point(-8 + i / 10)).join(" ");
  const equation = `${a}x² ${b >= 0 ? "+" : "−"} ${Math.abs(b)}x ${c >= 0 ? "+" : "−"} ${Math.abs(c)} = 0`;
  return <>
    <p>{t(locale, "Change the coefficients and follow the completion of the square. Where does the parabola meet the horizontal axis?", "Меняйте коэффициенты и следите за выделением полного квадрата. Где парабола пересекает горизонтальную ось?")}</p>
    <div className="controls"><Slider label="a" value={a} min={1} max={3} onChange={setA} /><Slider label="b" value={b} min={-6} max={6} onChange={setB} /><Slider label="c" value={c} min={-6} max={6} onChange={setC} /></div>
    <p className="algebra-equation">{equation}</p>
    <svg className="diagram algebra-diagram" viewBox="0 0 400 340" role="img" aria-label={t(locale, `Parabola. Discriminant ${result.discriminant}. ${result.roots.length} real roots.`, `Парабола. Дискриминант ${result.discriminant}. Действительных корней: ${result.roots.length}.`)}>
      <defs><clipPath id="algebra-plot-clip"><rect x="8" y="8" width="384" height="324" /></clipPath></defs>
      <path d="M8 180H392 M200 8V332" fill="none" stroke="currentColor" opacity=".5" />
      <g className="algebra-axis-label">{[-6, -4, -2, 2, 4, 6].map(x => <text key={x} x={200 + x * 24} y="200">{x}</text>)}<text x="385" y="170">x</text><text x="215" y="20">y</text></g>
      <g clipPath="url(#algebra-plot-clip)"><polyline points={curve} fill="none" stroke="#0000ff" strokeWidth="3" />
        {step === 3 && result.roots.map((root, i) => <circle key={i} cx={200 + root * 24} cy="180" r="6" fill="#cc0000" />)}</g>
    </svg>
    <Steps locale={locale} step={step} setStep={setStep} steps={[
      "ax² + bx + c = 0, a ≠ 0",
      `x² + (b/a)x = −c/a → x² + (${fmt(b / a)})x = ${fmt(-c / a)}`,
      `(x + b/(2a))² = (b² − 4ac)/(4a²) = ${fmt(result.discriminant / (4 * a * a))}`,
      result.discriminant < 0 ? t(locale, `D = ${result.discriminant} < 0: no real roots; a real square cannot be negative.`, `D = ${result.discriminant} < 0: действительных корней нет; квадрат не бывает отрицательным.`) : `x = (−b ± √D)/(2a); D = ${result.discriminant}; x = ${result.roots.map(fmt).join(", ")}`,
    ]} />
    <p className="activity-note">{t(locale, "Graph window: −8 ≤ x ≤ 8; roots outside this window still appear in the equation. Values are rounded to four decimal places.", "Окно графика: −8 ≤ x ≤ 8; корни за пределами окна указаны в уравнении. Значения округлены до четырёх знаков.")}</p>
  </>;
}

function Quadratic({ locale }: LessonProps) {
  const [chapter, setChapter] = useState(0);
  const [step, setStep] = useState(0);
  // The six source buttons target these chapters, not six coefficient presets.
  const chapters = [
    ["x² = 4", "x = ±2", "x² = 9", "x = ±3", "x² = 25", "x = ±5"],
    ["x² = c", t(locale, "c < 0: no real roots. c = 0: x = 0.", "c < 0: действительных корней нет. c = 0: x = 0."), "c > 0: x = ±√c"],
    ["x² + c = 0", "x² = −c", "c ≤ 0: x = ±√(−c)"],
    ["(x − d)² + c = 0", "(x − d)² = −c", "c ≤ 0: x = d ± √(−c)"],
    ["x² + bx + c = 0", "x² + bx = −c", "(x + b/2)² = b²/4 − c", "D = b² − 4c", "D ≥ 0: x = (−b ± √D)/2"],
    ["ax² + bx + c = 0; a ≠ 0", "x² + (b/a)x + c/a = 0", "(x + b/(2a))² = (b² − 4ac)/(4a²)", "D = b² − 4ac", "D ≥ 0: x = (−b ± √D)/(2a)"],
  ];
  return <>
    <nav className="controls" aria-label={t(locale, "Chapters", "Главы")}>
      {chapters.map((_, index) => <button key={index} className="button button-secondary" aria-pressed={chapter === index} onClick={() => { setChapter(index); setStep(0); }}>{index + 1}</button>)}
    </nav>
    <p className="algebra-equation">{chapters[chapter][step]}</p>
    <Steps locale={locale} step={step} setStep={setStep} steps={chapters[chapter]} />
    <details><summary>{t(locale, "Explore coefficients and graph", "Исследуйте коэффициенты и график")}</summary><QuadraticExplorer locale={locale} /></details>
  </>;
}

export default function AlgebraActivity(props: ActivityProps) {
  const { activityId, locale } = props;
  let content;
  switch (activityId) {
    case "algebra-square-of-sum": content = <SquareSum locale={locale} />; break;
    case "algebra-difference-of-squares": content = <Difference locale={locale} />; break;
    case "algebra-sum-integers": content = <Sums key="integers" locale={locale} odd={false} />; break;
    case "algebra-sum-odds": content = <Sums key="odds" locale={locale} odd />; break;
    case "algebra-transformations": content = <Transform locale={locale} />; break;
    case "algebra-quadratic": content = <Quadratic locale={locale} />; break;
    default: return <p>{t(locale, "This algebra activity is not available.", "Это занятие по алгебре недоступно.")}</p>;
  }
  return <div className="activity-layout algebra-activity">{hasNativeLesson(activityId)
    ? <NativeLesson key={`${activityId}:${locale}`} {...props} activityId={activityId}>{content}</NativeLesson>
    : content}</div>;
}
