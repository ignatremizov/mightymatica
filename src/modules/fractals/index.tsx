import { useEffect, useMemo, useRef, useState } from "react";
import type { ActivityProps } from "../../shared/contracts";
import { t } from "../../shared/contracts";
import { useAnimation } from "../../shared/useAnimation";
import { carpetHoles, estimatePi, mobiusPoint, needleCrosses } from "./rules";
import "./styles.css";
import NativeFractalLesson from "./NativeFractalLesson";

function Carpet({ locale, reducedMotion, initialDepth = 0 }: ActivityProps & { initialDepth?: number }) {
  const [depth, setDepth] = useState(initialDepth);
  const [playing, setPlaying] = useState(false);
  const [zoom, setZoom] = useState(1);
  const constructionTime = useRef(0);
  useEffect(() => { if (reducedMotion) setPlaying(false); }, [reducedMotion]);
  useAnimation(delta => {
    if (depth < 5) {
      constructionTime.current += delta;
      if (constructionTime.current >= 1.5) {
        constructionTime.current = 0;
        setDepth(d => Math.min(5, d + 1));
      }
    } else {
      // A retained corner is a scaled copy of the carpet. Rebase at ×3
      // rather than growing coordinates or recursion without bound.
      setZoom(z => { const next = z + delta * .3; return next >= 3 ? next / 3 : next; });
    }
  }, playing);
  const holes = useMemo(() => carpetHoles(depth), [depth]);
  const cutouts = useMemo(() => holes.map((h, i) =>
    <rect key={i} x={h.x} y={h.y} width={h.size} height={h.size} fill="#fff"/>), [holes]);
  return <div className="activity-layout fractals">
    <p>{t(locale, "Divide each square into nine equal squares, remove its centre, and repeat on the eight survivors.", "Разделите каждый квадрат на девять равных квадратов, удалите центр и повторите для восьми оставшихся.")}</p>
    <div className="controls">
      <button className="button" onClick={() => setPlaying(p => !p)}>{t(locale, playing ? "Pause" : depth === 5 ? "Play zoom" : "Play construction and zoom", playing ? "Пауза" : depth === 5 ? "Показать увеличение" : "Показать построение и увеличение")}</button>
      <label className="control">{t(locale, "Iteration", "Шаг")}: {depth}<input type="range" min="0" max="5" value={depth} onChange={e => { setPlaying(false); setDepth(Number(e.target.value)); setZoom(1); constructionTime.current = 0; }}/></label>
      <button className="button-secondary" onClick={() => { setPlaying(false); setDepth(0); setZoom(1); constructionTime.current = 0; }}>{t(locale, "Reset", "Сначала")}</button></div>
    <svg className="diagram fractals-carpet" viewBox="-0.02 -0.02 1.04 1.04" role="img" aria-label={t(locale, `Carpet after ${depth} iterations`, `Ковёр после ${depth} шагов`)}>
      <svg viewBox="0 0 1 1" width="1" height="1" overflow="hidden">
        <g transform={`scale(${zoom})`}><rect width="1" height="1" fill="#0000ff"/>{cutouts}</g>
      </svg>
    </svg>
    <p className="activity-status" aria-live="polite">{t(locale, "Remaining squares", "Оставшиеся квадраты")}: {8 ** depth}. {t(locale, "Remaining area", "Оставшаяся площадь")}: (8/9)<sup>{depth}</sup> = {((8 / 9) ** depth * 100).toFixed(2)}%.</p>
    <p className="explanation">{t(locale, "Every finite stage still has positive area. In the infinite limit, (8/9)ⁿ tends to zero—even though the carpet contains infinitely many points.", "На каждом конечном шаге площадь положительна. В бесконечном пределе (8/9)ⁿ стремится к нулю, хотя ковёр содержит бесконечно много точек.")}</p>
  </div>;
}

interface Drop { x: number; y: number; angle: number; hit: boolean }
function Buffon({ locale, reducedMotion }: ActivityProps) {
  const [target, setTarget] = useState(10);
  const [running, setRunning] = useState(false);
  useEffect(() => { if (reducedMotion) setRunning(false); }, [reducedMotion]);
  const [result, setResult] = useState({ throws: 0, hits: 0, drops: [] as Drop[] });
  const pending = useRef(0);
  const batch = (amount: number) => setResult(previous => {
    const count = Math.min(amount, target - previous.throws);
    let hits = previous.hits;
    const drops = previous.drops.slice();
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI;
      const y = Math.random() * 6;
      const hit = needleCrosses(y % 1, angle);
      if (hit) hits++;
      drops.push({ x: 1 + Math.random() * 8, y: y + 1, angle, hit });
    }
    return { throws: previous.throws + count, hits, drops: drops.slice(-300) };
  });
  useAnimation(delta => {
    pending.current += delta;
    if (pending.current >= 0.1) { pending.current = 0; batch(50); }
  }, running && result.throws < target);
  const pi = estimatePi(result.throws, result.hits);
  const complete = result.throws >= target;
  return <div className="activity-layout fractals">
    <p>{t(locale, "Needle length equals line spacing. Each drop has an independent random position and angle. Crossing needles are dashed.", "Длина иглы равна расстоянию между линиями. Положение и угол каждого броска случайны и независимы. Пересекающие иглы показаны пунктиром.")}</p>
    <div className="controls"><label className="control">{t(locale, "Throws", "Бросков")}: {target}<input type="range" min="10" max="1000" step="10" value={target} disabled={result.throws > 0 || running} onChange={e => setTarget(Number(e.target.value))}/></label>
      <button className="button" disabled={complete} onClick={() => setRunning(!running)}>{complete ? t(locale, "Complete", "Готово") : t(locale, running ? "Pause" : "Start / resume", running ? "Пауза" : "Старт / продолжить")}</button>
      <button className="button-secondary" disabled={complete} onClick={() => batch(100)}>{t(locale, "Drop", "Бросить")} {Math.min(100, Math.max(0, target - result.throws))}</button>
      <button className="button-secondary" onClick={() => { setRunning(false); pending.current = 0; setResult({ throws: 0, hits: 0, drops: [] }); }}>{t(locale, "Reset", "Сначала")}</button></div>
    <svg className="diagram" viewBox="0 0 600 480" role="img" aria-label={t(locale, "Needles dropped on parallel lines; most recent 300 shown", "Иглы на параллельных линиях; показаны последние 300")}>
      <rect width="600" height="480" fill="#fff"/>
      {Array.from({ length: 8 }, (_, i) => <path key={i} d={`M0 ${(i + 1) * 50}H600`} stroke="#0000cc"/>)}
      {result.drops.map((d, i) => <line key={i} x1={d.x * 50} y1={d.y * 50} x2={(d.x + Math.cos(d.angle)) * 50} y2={(d.y - Math.sin(d.angle)) * 50} stroke={d.hit ? "#cc0033" : "#000"} strokeWidth="2" strokeDasharray={d.hit ? "4 2" : undefined}/>)}
    </svg>
    <p className="activity-status" aria-live="polite">N = {result.throws} / {target}; K = {result.hits}; π ≈ 2N/K = {pi === null ? t(locale, "not yet defined", "пока не определено") : pi.toFixed(5)}{complete ? t(locale, " · Complete", " · Готово") : ""}</p>
    <p className="explanation">{t(locale, "For equal needle length and spacing, the crossing probability is 2/π: averaging sin(θ) over 0 ≤ θ < π gives 2/π. Hence π ≈ 2N/K. More throws usually help, but random estimates need not improve steadily. Zero crossings cannot give a finite estimate.", "При равенстве длины иглы и шага линий вероятность пересечения равна 2/π: среднее sin(θ) при 0 ≤ θ < π равно 2/π. Поэтому π ≈ 2N/K. Больше бросков обычно помогают, но случайная оценка не обязана улучшаться на каждом шаге. Без пересечений конечной оценки нет.")}</p>
  </div>;
}

function Mobius({ locale, reducedMotion }: ActivityProps) {
  const [turn, setTurn] = useState(0);
  const [view, setView] = useState(30);
  const [playing, setPlaying] = useState(false);
  const drag = useRef<{ pointer: number; x: number; view: number } | null>(null);
  useEffect(() => { if (reducedMotion) setPlaying(false); }, [reducedMotion]);
  useAnimation(delta => setTurn(value => Math.min(2, value + delta / 10)), playing && turn < 2);
  const project = (p: [number, number, number]) => {
    const a = view * Math.PI / 180;
    const x = p[0] * Math.cos(a) - p[1] * Math.sin(a);
    const y = p[0] * Math.sin(a) + p[1] * Math.cos(a);
    return `${300 + x * 90},${200 + y * 36 - p[2] * 90}`;
  };
  const tiles = [];
  for (let i = 0; i < 64; i++) {
    const u = i * Math.PI * 2 / 64, next = (i + 1) * Math.PI * 2 / 64;
    for (let across = 0; across < 6; across++) {
      const v = -.55 + across * 1.1 / 6, nextV = -.55 + (across + 1) * 1.1 / 6;
      tiles.push(<polygon key={`${i}-${across}`} points={[mobiusPoint(u, v), mobiusPoint(next, v), mobiusPoint(next, nextV), mobiusPoint(u, nextV)].map(project).join(" ")} fill={i < 32 ? "#a9b4ca" : "#b7adc8"} stroke="#45455b" strokeWidth=".6"/>);
    }
  }
  const angle = turn * Math.PI * 2;
  const facePosition = project(mobiusPoint(angle, 0)).split(",").map(Number);
  const flip = Math.cos(angle / 2);
  return <div className="activity-layout fractals">
    <p>{t(locale, "Move a face along the strip. One lap reverses its local left and right; two laps restore them. Rotate the view to inspect the half twist.", "Проведите лицо по ленте. Один круг меняет местами локальные левую и правую стороны; два круга восстанавливают их. Поверните вид, чтобы рассмотреть полуповорот.")}</p>
    <div className="controls">
      <button className="button" onClick={() => { if (turn >= 2) setTurn(0); setPlaying(!(playing && turn < 2)); }}>{t(locale, playing && turn < 2 ? "Pause" : "Play", playing && turn < 2 ? "Пауза" : "Пуск")}</button>
      <button className="button-secondary" onClick={() => { setPlaying(false); setTurn(0); setView(30); }}>{t(locale, "Reset", "Сначала")}</button>
      <label className="control">{t(locale, "Laps", "Круги")}: {turn.toFixed(2)}<input type="range" min="0" max="2" step=".01" value={turn} onChange={e => { setPlaying(false); setTurn(Number(e.target.value)); }}/></label><label className="control">{t(locale, "View angle", "Угол обзора")}<input type="range" min="0" max="360" value={view} onChange={e => setView(Number(e.target.value))}/></label>
      <button className="button-secondary" onClick={() => { setPlaying(false); setTurn(turn < 1 ? 1 : turn < 2 ? 2 : 0); }}>{t(locale, "Next full lap", "Следующий полный круг")}</button></div>
    <p className="activity-note">{t(locale, "Drag the strip left or right to rotate the view, or use the view-angle slider.", "Потяните ленту влево или вправо, чтобы повернуть вид, или используйте ползунок угла обзора.")}</p>
    <svg className="diagram" viewBox="0 0 600 400" role="img" aria-label={t(locale, "Projected Möbius strip and transported face marker", "Проекция ленты Мёбиуса с движущимся лицом")}
      style={{ touchAction: "pan-y", cursor: "grab" }}
      onPointerDown={event => {
        if (!event.isPrimary || event.button !== 0) return;
        event.currentTarget.setPointerCapture(event.pointerId);
        drag.current = { pointer: event.pointerId, x: event.clientX, view };
      }}
      onPointerMove={event => {
        const start = drag.current;
        if (!start || start.pointer !== event.pointerId) return;
        const width = event.currentTarget.getBoundingClientRect().width;
        if (width > 0) setView(((start.view + (event.clientX - start.x) * 360 / width) % 360 + 360) % 360);
      }}
      onPointerUp={event => {
        if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
        drag.current = null;
      }}
      onPointerCancel={() => { drag.current = null; }}
      onLostPointerCapture={() => { drag.current = null; }}>{tiles}
      <g transform={`translate(${facePosition[0]} ${facePosition[1]}) scale(${flip} 1)`}><circle r="21" fill="#fff1be" stroke="#493c27" strokeWidth="2"/><circle cx="-7" cy="-5" r="2" fill="#282b39"/><circle cx="7" cy="-5" r="2" fill="#282b39"/><path d="M-8 6Q0 14 8 6" fill="none" stroke="#282b39" strokeWidth="2"/><circle cx="12" cy="3" r="4" fill="#7d3588"/></g>
    </svg>
    <p className="activity-status">{t(locale, "Orientation relative to the start", "Ориентация относительно начала")}: {t(locale, flip >= 0 ? "original" : "reversed", flip >= 0 ? "исходная" : "обратная")}. {t(locale, "At one lap the marked cheek is on the opposite side.", "Через один круг отмеченная щека оказывается с другой стороны.")}</p>
    <p className="activity-note">{t(locale, "The strip has one continuous side and one boundary. Follow the marked cheek through two laps.", "У ленты одна непрерывная сторона и один край. Проследите за отмеченной щекой на протяжении двух кругов.")}</p>
  </div>;
}

export default function Fractals(props: ActivityProps) {
  if (props.activityId === "fractals-carpet") return <NativeFractalLesson key={`${props.activityId}:${props.locale}`} {...props} explorer={<Carpet {...props} initialDepth={5}/>}/>;
  if (props.activityId === "fractals-buffon") return <NativeFractalLesson key={`${props.activityId}:${props.locale}`} {...props} explorer={<Buffon {...props}/>}/>;
  return <NativeFractalLesson key={`${props.activityId}:${props.locale}`} {...props} explorer={<Mobius {...props}/>}/>;
}
