import { useRef, useState } from "react";
import type { PointerEvent, ReactNode } from "react";
import type { ActivityProps } from "../../shared/contracts";
import { t } from "../../shared/contracts";
import { initialParameters, parameterRange, evaluate, graphSegments, motion, secant } from "./rules";
import type { GraphKind, MotionKind, Parameters } from "./rules";
import { manifest } from "./manifest";
import NativeLesson from "./NativeLesson";
import CalcFormula from "./CalcFormula";
import "./style.css";

const kinds: GraphKind[] = ["linear", "square", "cubic", "power", "sine", "cosine", "tan", "gaussian", "sinecosine"];
const formulas: Record<GraphKind, string> = {
  linear: "y = ax + b", square: "y = ax² + bx + c", cubic: "y = ax³ + bx² + cx + d",
  power: "y = aˣ + b", sine: "y = A sin(ωx + φ)", cosine: "y = A cos(ωx + φ)",
  tan: "y = A tan(ωx + φ)", gaussian: "p(x) = exp(−x² / 2σ²) / (σ√(2π))",
  sinecosine: "y = A sin(ωx + φ) + B cos(νx + ψ)",
};
function Slider({ label, value, min, max, step = 0.1, change }: {label: string; value: number; min: number; max: number; step?: number; change: (value: number) => void}) {
  return <label className="control">{label}: <output>{value.toFixed(2)}</output><input type="range" min={min} max={max} step={step} value={value} onChange={e => change(Number(e.target.value))} /></label>;
}
function Plot({ lines, extent = 5, vertical = 5, label, axis = "x", cursor, inspect, children }: { lines: { points: number[][]; color: string; dashed?: boolean }[]; extent?: number; vertical?: number; label: string; axis?: string; cursor?: number; inspect?: (x: number) => void; children?: ReactNode }) {
  const px = (x: number) => 320 + x * 280 / extent;
  const py = (y: number) => 200 - y * 160 / vertical;
  const inspectPointer = (event: PointerEvent<SVGSVGElement>) => {
    if (!inspect) return;
    const matrix = event.currentTarget.getScreenCTM();
    if (!matrix) return;
    const point = event.currentTarget.createSVGPoint();
    point.x = event.clientX;
    point.y = event.clientY;
    const local = point.matrixTransform(matrix.inverse());
    inspect(Math.max(-extent, Math.min(extent, (local.x - 320) * extent / 280)));
  };
  return <svg className="diagram calculus-plot" viewBox="0 0 640 400" role="img" aria-label={label}>
    <rect x="40" y="40" width="560" height="320" fill="none" />
    {Array.from({ length: 11 }, (_, i) => <g key={i} stroke="#cccccc"><path d={`M${40 + i * 56} 40V360 M40 ${40 + i * 32}H600`} /></g>)}
    <path d="M40 200H600M320 40V360" stroke="#000000" />
    <svg x="40" y="40" width="560" height="320" viewBox="40 40 560 320" overflow="hidden">
      {lines.map((line, i) => <polyline key={i} points={line.points.map(([x, y]) => `${px(x)},${py(y)}`).join(" ")} fill="none" stroke={line.color} strokeWidth="3" strokeDasharray={line.dashed ? "8 5" : undefined} />)}
      {cursor !== undefined && <path d={`M${px(cursor)} 40V360`} stroke="#555" strokeDasharray="4 4" />}
      {children}
    </svg>
    <g fill="currentColor" fontSize="14"><text x="42" y="382">−{extent}</text><text x="580" y="382">{extent} {axis}</text><text x="325" y="30">{vertical} y</text><text x="325" y="382">−{vertical}</text><text x="305" y="220">0</text></g>
    {inspect && <svg x="40" y="40" width="560" height="320" viewBox="40 40 560 320"
      className="calculus-inspection"
      onPointerDown={event => { if (event.button !== 0 || !event.isPrimary) return; event.currentTarget.setPointerCapture(event.pointerId); inspectPointer(event); }}
      onPointerMove={event => { if (event.currentTarget.hasPointerCapture(event.pointerId)) inspectPointer(event); }}
      onPointerUp={event => { if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId); }}>
      <rect x="40" y="40" width="560" height="320" fill="transparent" />
    </svg>}
  </svg>;
}
function Explorer({ kind, locale }: { kind: GraphKind; locale: ActivityProps["locale"] }) {
  const [p, setP] = useState<Parameters>(() => initialParameters(kind));
  const [x, setX] = useState(0);
  const trig = ["sine", "cosine", "tan", "sinecosine"].includes(kind);
  const keys: (keyof Parameters)[] = kind === "gaussian" ? ["a"] : kind === "sinecosine" ? ["a", "b", "c", "d", "e", "f"] : kind === "cubic" ? ["a", "b", "c", "d"] : kind === "square" || trig ? ["a", "b", "c"] : ["a", "b"];
  const labels = trig ? { a: "A", b: "ω", c: "φ", d: "B", e: "ν", f: "ψ" } : { a: kind === "gaussian" ? "σ" : "a", b: "b", c: "c", d: "d", e: "e", f: "f" };
  const vertical = kind === "gaussian" ? 1 : 5;
  const lines = graphSegments(kind, p, 5, vertical).map(points => ({ points, color: "#0000cc" }));
  const value = evaluate(kind, x, p);
  return <div className="activity-layout calculus">
    <p className="explanation">{t(locale, "Change a parameter, then click or drag across the graph to inspect x, or use the x slider. Angles are in radians.", "Меняйте параметры, затем нажмите или проведите по графику для выбора x либо используйте ползунок x. Углы в радианах.")}</p>
    <h3>{formulas[kind]}</h3>
    <div className="controls">{keys.map(key => { const [min, max] = parameterRange(kind, key); return <Slider key={key} label={labels[key]} value={p[key]} min={min} max={max} change={value => setP(old => ({ ...old, [key]: value }))} />; })}</div>
    {kind === "sinecosine" && <>
      <h3>A sin(ωx + φ)</h3>
      <Plot lines={graphSegments("sine", p).map(points => ({ points, color: "#cc0000" }))} label={t(locale, "Sine component", "Слагаемое синуса")} cursor={x} inspect={setX} />
      <h3>B cos(νx + ψ)</h3>
      <Plot lines={graphSegments("cosine", { ...p, a: p.d, b: p.e, c: p.f }).map(points => ({ points, color: "#990099" }))} label={t(locale, "Cosine component", "Слагаемое косинуса")} cursor={x} inspect={setX} />
      <h3>{t(locale, "Sum", "Сумма")}</h3>
    </>}
    <Plot lines={lines} vertical={vertical} label={`${formulas[kind]}; x −5 … 5`} cursor={x} inspect={value => setX(Math.round(value * 100) / 100)}>
      {Number.isFinite(value) && Math.abs(value) <= vertical && <circle cx={320 + x * 56} cy={200 - value * 160 / vertical} r="5" fill="#0000cc" stroke="#fff" strokeWidth="2" />}
    </Plot>
    {kind === "sinecosine" && <p>{t(locale, "Blue: sum · Red: sine · Purple: cosine", "Синий: сумма · Красный: синус · Фиолетовый: косинус")}</p>}
    <Slider label="x" value={x} min={-5} max={5} step={0.01} change={setX} />
    <p className="activity-status" role="status">x = {x.toFixed(2)}; {kind === "gaussian" ? "p(x)" : "y"} = {Number.isFinite(value) ? value.toFixed(4) : t(locale, "undefined", "не определено")}
      {Number.isFinite(value) && Math.abs(value) > vertical && t(locale, " — outside the visible vertical range", " — за пределами видимого диапазона по вертикали")}
      {!Number.isFinite(value) && kind === "tan" && t(locale, " — tangent has a pole here", " — здесь полюс тангенса")}
    </p>
    {kind === "gaussian" && <p>{t(locale, "σ must be positive. The total area over the whole real line is 1; this viewport shows only part of it.", "σ должна быть положительной. Площадь на всей числовой прямой равна 1; здесь видна только её часть.")}</p>}
    <button className="button button-secondary" onClick={() => { setP(initialParameters(kind)); setX(0); }}>{t(locale, "Reset", "Сбросить")}</button>
  </div>;
}

const motionKinds: MotionKind[] = ["constant", "accelerating", "sine"];

function Calculus({ locale, reducedMotion }: ActivityProps) {
  const [kind, setKind] = useState<MotionKind>("accelerating");
  const [time, setTime] = useState(1);
  const [dt, setDt] = useState(0.5);
  const motionHeading = useRef<HTMLHeadingElement>(null);
  const exampleIndex = motionKinds.indexOf(kind);
  const changeExample = (offset: number, returnToMotion = false) => {
    const next = motionKinds[exampleIndex + offset];
    if (!next) return;
    setKind(next);
    if (returnToMotion) {
      motionHeading.current?.focus({ preventScroll: true });
      motionHeading.current?.scrollIntoView({ behavior: reducedMotion ? "instant" : "smooth", block: "start" });
    }
  };
  const exampleNavigation = (returnToMotion: boolean) => <div className="calculus-example-navigation">
    <button type="button" className="button button-secondary" disabled={exampleIndex === 0} onClick={() => changeExample(-1, returnToMotion)}>{t(locale, "Previous example", "Предыдущий пример")}</button>
    <span>{exampleIndex + 1} / {motionKinds.length}</span>
    <button type="button" className="button button-secondary" disabled={exampleIndex === motionKinds.length - 1} onClick={() => changeExample(1, returnToMotion)}>{t(locale, "Next example", "Следующий пример")}</button>
  </div>;
  const state = motion(kind, time);
  const slope = secant(kind, time, dt);
  const sample = (fn: (x: number) => number) => Array.from({ length: 401 }, (_, i) => { const x = -4 + i / 50; return [x, fn(x)]; });
  const area = Array.from({ length: 81 }, (_, i) => { const x = time * i / 80; return `${320 + x * 70},${200 - motion(kind, x).velocity * 160 / 120}`; });
  const names: Record<MotionKind, string> = { constant: "S(t) = 20t; V(t) = 20", accelerating: "S(t) = 5t²; V(t) = 10t", sine: "S(t) = 60 sin(t); V(t) = 60 cos(t)" };
  return <div className="activity-layout calculus calculus-lesson">
    <button className="button button-secondary" onClick={() => { setKind("accelerating"); setTime(1); setDt(0.5); }}>{t(locale, "Reset exploration", "Сбросить исследование")}</button>
    <p className="explanation">{t(locale, "A derivative measures instantaneous change. An integral accumulates signed change. Here S is signed position, not total distance travelled.", "Производная измеряет мгновенное изменение. Интеграл накапливает изменение со знаком. S — координата, а не полный пройденный путь.")}</p>
    <h3 ref={motionHeading} tabIndex={-1} className="calculus-motion-heading">{t(locale, "Motion examples", "Примеры движения")}</h3>
    <label className="control">{t(locale, "Motion", "Движение")}<select value={kind} onChange={e => setKind(e.target.value as MotionKind)}>{motionKinds.map(key => <option key={key} value={key}>{names[key]}</option>)}</select></label>
    {exampleNavigation(false)}
    <div className="controls"><Slider label="t" min={0} max={3} value={time} change={setTime} /><Slider label="Δt" min={0.01} max={1} step={0.01} value={dt} change={setDt} /></div>
    <p>{t(locale, "Click or drag either graph to choose t from 0 to 3, or use the t slider.", "Нажмите или проведите по любому графику для выбора t от 0 до 3 либо используйте ползунок t.")}</p>
    <h3>{t(locale, "1. Position and slope", "1. Координата и наклон")}</h3>
    <Plot extent={4} vertical={120} axis="t" cursor={time} inspect={value => setTime(Math.round(Math.max(0, Math.min(3, value)) * 10) / 10)} label={t(locale, "Position, tangent and secant", "Координата, касательная и секущая")} lines={[
      { points: sample(x => motion(kind, x).position), color: "#000099" },
      { points: sample(x => state.position + state.velocity * (x - time)), color: "#cc0000" },
      { points: sample(x => state.position + slope * (x - time)), color: "#990099", dashed: true },
    ]}>
      <circle cx={320 + time * 70} cy={200 - state.position * 160 / 120} r="5" fill="#cc0000" />
      <circle cx={320 + (time + dt) * 70} cy={200 - motion(kind, time + dt).position * 160 / 120} r="5" fill="#990099" />
    </Plot>
    <p>{t(locale, "Blue: S(t). Red: tangent. Dashed purple: secant through t and t + Δt. Shrink Δt to approach the tangent slope.", "Синий: S(t). Красный: касательная. Фиолетовый пунктир: секущая через t и t + Δt. Уменьшайте Δt, приближаясь к наклону касательной.")}</p>
    <div className="activity-status calculus-formula-readout">
      <CalcFormula kind="secant" value={slope} label={t(locale, `Secant slope: the change in position divided by Δt equals ${slope.toFixed(3)}`, `Наклон секущей: изменение координаты, делённое на Δt, равно ${slope.toFixed(3)}`)} />
      <CalcFormula kind="velocity" value={state.velocity} label={t(locale, `Derivative of S at t equals velocity V at t equals ${state.velocity.toFixed(3)}`, `Производная S в точке t равна скорости V в точке t и равна ${state.velocity.toFixed(3)}`)} />
    </div>
    <h3>{t(locale, "2. Velocity and accumulation", "2. Скорость и накопление")}</h3>
    <Plot extent={4} vertical={120} axis="t" cursor={time} inspect={value => setTime(Math.round(Math.max(0, Math.min(3, value)) * 10) / 10)} label={t(locale, "Velocity and signed accumulated area from zero to t", "Скорость и накопленная площадь со знаком от нуля до t")} lines={[{ points: sample(x => motion(kind, x).velocity), color: "#000099" }]}>
      <polygon points={`320,200 ${area.join(" ")} ${320 + time * 70},200`} fill="#ff0099" opacity=".3" />
    </Plot>
    <div className="activity-status calculus-formula-readout"><CalcFormula kind="integral" value={state.position} label={t(locale, `Integral of V(u) from zero to t equals S(t) minus S(0) equals ${state.position.toFixed(3)}`, `Интеграл V(u) от нуля до t равен S(t) минус S(0) и равен ${state.position.toFixed(3)}`)} /></div>
    <p>{t(locale, "Area below the horizontal axis counts negatively. All three examples have S(0) = 0. An indefinite integral also needs a constant + C.", "Площадь ниже горизонтальной оси считается отрицательной. Во всех трёх примерах S(0) = 0. Для неопределённого интеграла нужна постоянная + C.")}</p>
    {exampleNavigation(true)}
  </div>;
}
export default function CalculusActivities(props: ActivityProps) {
  const [selection, setSelection] = useState<GraphKind>("linear");
  if (props.activityId === "calculus-five-minutes") return <NativeLesson key={props.locale} {...props}><Calculus {...props} /></NativeLesson>;
  const chooser = props.activityId === "calculus-graphintro";
  const parsed = props.activityId.replace("calculus-graph-", "") as GraphKind;
  const kind = chooser ? selection : kinds.includes(parsed) ? parsed : "linear";
  return <>
    {chooser && <label className="control">{t(props.locale, "Function", "Функция")}<select value={selection} onChange={e => setSelection(e.target.value as GraphKind)}>{kinds.map(k => { const meta = manifest.find(item => item.id === `calculus-graph-${k}`)!; return <option key={k} value={k}>{t(props.locale, meta.title, meta.titleRu)}</option>; })}</select></label>}
    <Explorer key={kind} kind={kind} locale={props.locale} />
  </>;
}
