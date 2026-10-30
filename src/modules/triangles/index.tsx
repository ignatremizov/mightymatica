import { useRef, useState } from "react";
import type { PointerEvent as ReactPointerEvent } from "react";
import type { ActivityProps } from "../../shared/contracts";
import OriginalCompanion from "../../shared/OriginalCompanion";
import { constrainedCircleAngle, construction, cross, distance, mix, projection, triangleData } from "./geometry";
import type { Point, Triangle } from "./geometry";
import FalseProof from "./FalseProof";
import Congruence from "./Congruence";
import PythagorasProof from "./PythagorasProof";
import PythagorasQuiz from "./PythagorasQuiz";
import InscribedProof from "./InscribedProof";
import NativeTriangleLesson from "./NativeTriangleLesson";
import { capturedVertexPosition } from "./StageGeometry";
import OriginalDrawings from "./OriginalDrawings";
import "./triangles.css";

const initial: Triangle = [{ x: 255, y: 100 }, { x: 130, y: 330 }, { x: 470, y: 330 }];
const f = (n: number) => n.toFixed(2);
const degrees = (n: number) => n * 180 / Math.PI;
const radians = (n: number) => n * Math.PI / 180;
function Segment({ a, b, extension = false }: { a: Point; b: Point; extension?: boolean }) {
  return <line x1={a.x} y1={a.y} x2={b.x} y2={b.y} className={extension ? "tri-extension" : "tri-construction"} />;
}
function Square({ a, b, label }: { a: Point; b: Point; label: string }) {
  const dx = b.x - a.x, dy = b.y - a.y;
  const c = { x: b.x + dy, y: b.y - dx }, d = { x: a.x + dy, y: a.y - dx };
  return <g><polygon points={[a, b, c, d].map(p => `${p.x},${p.y}`).join(" ")} className="tri-side" />
    <text x={(a.x + c.x) / 2} y={(a.y + c.y) / 2} textAnchor="middle">{label}</text></g>;
}
export default function TrianglesActivity(props: ActivityProps) {
  const explorer = props.activityId === "triangles-false-proof" ? <FalseProof {...props} startAtHint /> :
    props.activityId === "triangles-congruence" ? <Congruence {...props} /> : <TriangleLab {...props} />;
  return <NativeTriangleLesson key={`${props.activityId}:${props.locale}`} {...props}>{explorer}</NativeTriangleLesson>;
}
function TriangleLab({ activityId, locale, reducedMotion, geometryOnly = false }: ActivityProps & { geometryOnly?: boolean }) {
  const ru = locale === "ru";
  const tr = (en: string, russian: string) => ru ? russian : en;
  const mode = activityId.replace("triangles-", "");
  const [points, setPoints] = useState<Triangle>(initial);
  const [legA, setLegA] = useState(3);
  const [legB, setLegB] = useState(4);
  const [alpha, setAlpha] = useState(30);
  const [beta, setBeta] = useState(45);
  const [finger, setFinger] = useState(2);
  const [arc, setArc] = useState(100);
  const [position, setPosition] = useState(250);
  const [show, setShow] = useState(true);
  const svg = useRef<SVGSVGElement>(null);
  const drag = useRef<number | null>(null);
  const captured = useRef<{ inverse: DOMMatrix; vertex: Point; pointer: Point } | null>(null);
  const [dragViewBox, setDragViewBox] = useState<string | null>(null);
  const [companionPlaying, setCompanionPlaying] = useState(true);
  const data = triangleData(points);
  const isCenter = mode === "medians" || mode === "altitudes" || mode === "bisectors";
  const centerData = isCenter ? construction(points, mode) : null;
  function moveVertex(index: number, p: Point) {
    const next = points.map((old, i) => i === index ? { x: Math.max(65, Math.min(535, p.x)), y: Math.max(55, Math.min(375, p.y)) } : old) as Triangle;
    if (Math.abs(cross(...next)) > 3500 && triangleData(next).sides.every(side => side > 45)) setPoints(next);
  }
  function pointerMove(event: ReactPointerEvent<SVGSVGElement>) {
    if (drag.current === null || !svg.current) return;
    const state = captured.current;
    if (!state) return;
    const local = new DOMPoint(event.clientX, event.clientY).matrixTransform(state.inverse);
    if (mode === "inscribed-angle") {
      const angle = constrainedCircleAngle(local, { x: 300, y: 225 }, drag.current === 0 ? 190 : 20, drag.current === 0 ? 350 : 170);
      if (angle !== null) (drag.current === 0 ? setPosition : setArc)(angle);
    } else moveVertex(drag.current, capturedVertexPosition(state.vertex, state.pointer, local));
  }
  const slider = (label: string, value: number, min: number, max: number, change: (value: number) => void, step = 1) =>
    <label className="control">{label}: {value}<input type="range" min={min} max={max} step={step} value={value} onChange={e => change(Number(e.target.value))} /></label>;
  const A = points[0], B = points[1], C = points[2];
  const [a, b, c] = data.sides as [number, number, number];
  const angleA = data.angles[0]!;
  const unit = 40;
  const centerPoint = { x: 300, y: 225 };
  const circlePoint = (angle: number, radius = 155): Point => ({ x: centerPoint.x + radius * Math.cos(radians(angle)), y: centerPoint.y - radius * Math.sin(radians(angle)) });
  const pyth = mode === "pythagoras";
  const circular = mode === "inscribed-angle" || mode === "trig-addition" || mode === "palm-trig";
  const chosenAngle = [0, 30, 45, 60, 90][finger]!;
  const circleAngle = mode === "palm-trig" ? chosenAngle : alpha + beta;
  const foot = projection(A, B, C);
  const notes: Record<string, [string, string]> = {
    medians: ["A median joins a vertex to the midpoint of the opposite side. The centroid divides each median in a 2:1 ratio, and the six small triangles have equal area.", "Медиана соединяет вершину с серединой противоположной стороны. Центр тяжести делит каждую медиану в отношении 2:1. Шесть маленьких треугольников равновелики."],
    altitudes: ["Each altitude is perpendicular to the opposite side or its extension. The orthocenter can lie outside an obtuse triangle. Dashed lines extend the sides; the viewport expands to keep the intersection visible.", "Высота перпендикулярна противоположной стороне или её продолжению. В тупоугольном треугольнике ортоцентр находится снаружи. Пунктир продолжает стороны; масштаб сохраняет точку пересечения в поле зрения."],
    bisectors: ["The bisectors meet at the incenter, equally distant from all three sides. For AD meeting BC: BD/DC = AB/AC.", "Биссектрисы пересекаются в центре вписанной окружности, равноудалённом от сторон. Если AD пересекает BC, то BD/DC = AB/AC."],
    "sine-law": ["The same altitude can be written using either of two right triangles. Dividing gives a/sin A = b/sin B = c/sin C. Lengths below use 40 diagram units per unit.", "Одну высоту можно выразить через два прямоугольных треугольника. Отсюда a/sin A = b/sin B = c/sin C. Единица длины равна 40 единицам рисунка."],
    "cosine-law": ["Project C onto AB. Its components from A are b cos A and b sin A. Pythagoras gives a² = (c − b cos A)² + (b sin A)² = b² + c² − 2bc cos A.", "Проекция C на AB имеет координаты b cos A и b sin A относительно A. По теореме Пифагора a² = (c − b cos A)² + (b sin A)² = b² + c² − 2bc cos A."],
  };
  let viewBox = "0 0 600 440";
  if (mode === "altitudes" && centerData?.center) {
    const all = [...points, ...centerData.feet, centerData.center];
    const left = Math.min(0, ...all.map(p => p.x - 35)), top = Math.min(0, ...all.map(p => p.y - 35));
    viewBox = `${left} ${top} ${Math.max(600, ...all.map(p => p.x + 35)) - left} ${Math.max(440, ...all.map(p => p.y + 35)) - top}`;
  }
  function beginDrag(event: ReactPointerEvent<SVGCircleElement>, index: number, point: Point) {
    if (event.button !== 0 || drag.current !== null) return;
    const matrix = svg.current?.getScreenCTM();
    if (!matrix) return;
    const inverse = matrix.inverse();
    captured.current = { inverse, vertex: point, pointer: new DOMPoint(event.clientX, event.clientY).matrixTransform(inverse) };
    drag.current = index;
    setDragViewBox(viewBox);
    event.currentTarget.setPointerCapture(event.pointerId);
    event.currentTarget.focus();
  }
  function releaseDrag() { drag.current = null; captured.current = null; setDragViewBox(null); }
  const triangleControls = !pyth && !circular;
  return <section className="activity-layout triangles-lab">
    {!geometryOnly && (pyth || isCenter || mode === "inscribed-angle") && <aside className="tri-companion">
      <OriginalCompanion playing={companionPlaying} reducedMotion={reducedMotion} label={tr("Original Pythagoras companion", "Оригинальный спутник Пифагор")} />
      <button className="button-secondary" onClick={() => setCompanionPlaying(!companionPlaying)}>{companionPlaying ? tr("Pause companion", "Остановить спутника") : tr("Animate companion", "Оживить спутника")}</button>
    </aside>}
    <p>{pyth ? tr("Change the two legs. Each square is built on one side of the right triangle.", "Изменяйте катеты. На каждой стороне прямоугольного треугольника построен квадрат.") :
      mode === "inscribed-angle" ? tr("Drag A or C around the circle, or use the sliders. Focus a point and use arrow keys; Shift takes larger steps.", "Двигайте A или C по окружности или используйте ползунки. Выберите точку клавишей Tab и двигайте стрелками; Shift увеличивает шаг.") :
      circular ? tr("Use the controls to explore the relationship. Values update immediately.", "Изменяйте параметры и наблюдайте за соотношениями.") :
        tr("Drag A, B or C. Keyboard: Tab to a vertex, then use arrow keys (Shift for larger steps).", "Перетаскивайте A, B или C. Клавиатура: Tab к вершине, затем стрелки (Shift — больший шаг).")}</p>
    <div className="tri-controls controls">
      {pyth && <>{slider(tr("Leg a", "Катет a"), legA, 1, 5, setLegA, .1)}{slider(tr("Leg b", "Катет b"), legB, 1, 5, setLegB, .1)}</>}
      {mode === "trig-addition" && <>{slider("α (°)", alpha, 0, 90, setAlpha)}{slider("β (°)", beta, 0, 90, setBeta)}</>}
      {mode === "inscribed-angle" && <>{slider(tr("Central angle (°)", "Центральный угол (°)"), arc, 20, 170, setArc)}
        {slider(tr("Point A on the other arc (°)", "Точка A на другой дуге (°)"), position, 190, 350, setPosition)}</>}
      {triangleControls && <><button className="button-secondary" onClick={() => setPoints(initial)}>{tr("Reset triangle", "Сбросить")}</button>
        <button className="button-secondary" onClick={() => setPoints([{ x: 180, y: 260 }, B, C])}>{tr("Obtuse example", "Тупоугольный пример")}</button>
        <label className="tri-construction-toggle"><input type="checkbox" checked={show} onChange={e => setShow(e.target.checked)} /> {tr("Construction", "Построение")}</label></>}
    </div>
    {mode === "palm-trig" && <div className="tri-fingers">{[tr("Pinkie", "Мизинец"), tr("Ring", "Безымянный"), tr("Middle", "Средний"), tr("Index", "Указательный"), tr("Thumb", "Большой")].map((label, i) =>
      <button className="button-secondary" key={label} aria-pressed={finger === i} onClick={() => setFinger(i)}>{label} · {[0, 30, 45, 60, 90][i]}°</button>)}</div>}
    <svg ref={svg} className="diagram" viewBox={pyth ? "30 -140 650 650" : dragViewBox ?? viewBox} role="group" aria-label={tr("Interactive mathematical construction", "Интерактивное математическое построение")}
      onPointerMove={pointerMove} onPointerUp={releaseDrag} onPointerCancel={releaseDrag} onLostPointerCapture={releaseDrag}>
      {pyth ? (() => {
        const scale = 38, p = { x: 260, y: 270 }, q = { x: 260 + legB * scale, y: 270 }, r = { x: 260, y: 270 - legA * scale };
        return <><Square a={p} b={r} label={`a² = ${f(legA ** 2)}`} /><Square a={q} b={p} label={`b² = ${f(legB ** 2)}`} /><Square a={r} b={q} label={`c² = ${f(legA ** 2 + legB ** 2)}`} />
          <polygon points={[p, q, r].map(v => `${v.x},${v.y}`).join(" ")} className="tri-side" /><path d="M260 254h16v16" className="tri-construction" /></>;
      })() : circular ? <>
        <circle cx="300" cy="225" r="155" className="tri-side" />
        <path d="M120 225H480 M300 45V405" className="tri-extension" />
        {mode === "inscribed-angle" ? (() => {
          const p = circlePoint(position), q = circlePoint(0), r = circlePoint(arc);
          return <><polygon points={[p, q, r].map(v => `${v.x},${v.y}`).join(" ")} className="tri-side" />
            <Segment a={q} b={centerPoint} /><Segment a={centerPoint} b={r} />
            {[p, r].map((v, i) => <circle key={i} cx={v.x} cy={v.y} r="11" className="tri-handle" tabIndex={0}
              role="slider" aria-label={i === 0 ? tr("Point A on the other arc", "Точка A на другой дуге") : tr("Central angle", "Центральный угол")}
              aria-valuemin={i === 0 ? 190 : 20} aria-valuemax={i === 0 ? 350 : 170} aria-valuenow={i === 0 ? position : arc}
              aria-valuetext={`${i === 0 ? position : arc}°`}
              onPointerDown={e => beginDrag(e, i, v)}
              onKeyDown={e => {
                const delta = e.shiftKey ? 10 : 1, min = i === 0 ? 190 : 20, max = i === 0 ? 350 : 170;
                const value = i === 0 ? position : arc;
                const next = e.key === "Home" ? min : e.key === "End" ? max :
                  e.key === "ArrowLeft" || e.key === "ArrowDown" ? value - delta :
                  e.key === "ArrowRight" || e.key === "ArrowUp" ? value + delta : null;
                if (next !== null) { e.preventDefault(); (i === 0 ? setPosition : setArc)(Math.max(min, Math.min(max, next))); }
              }} />)}
            {[p, q, r, centerPoint].map((v, i) => <text key={i} x={v.x + 10} y={v.y - 10}>{["A", "B", "C", "O"][i]}</text>)}
            <text x="50" y="420">∠BAC = {f(arc / 2)}° · ∠BOC = {arc}°</text></>;
        })() : (() => {
          const p = circlePoint(circleAngle), q = { x: p.x, y: 225 };
          return <><Segment a={centerPoint} b={p} /><Segment a={p} b={q} /><Segment a={centerPoint} b={q} />
            {mode === "trig-addition" && <Segment a={centerPoint} b={circlePoint(alpha)} extension />}
            <circle cx={p.x} cy={p.y} r="6" fill="#0000ff" /><text x={p.x + 10} y={p.y - 10}>{circleAngle}°</text>
            <text x="30" y="420">(cos θ, sin θ) = ({f(Math.cos(radians(circleAngle)))}, {f(Math.sin(radians(circleAngle)))})</text></>;
        })()}
      </> : <>
        {show && mode === "medians" && centerData?.center && points.map((p, i) =>
          <polygon key={i} points={[p, centerData.feet[i]!, centerData.center!].map(v => `${v.x},${v.y}`).join(" ")} fill={["#0099ff", "#ffff00", "#ff00cc"][i]} fillOpacity=".3" />)}
        <polygon points={points.map(p => `${p.x},${p.y}`).join(" ")} className="tri-side" />
        {show && centerData && <>
          {centerData.feet.map((p, i) => <g key={i}><Segment a={points[i]!} b={p} />
            {mode === "altitudes" && <Segment a={points[(i + 1) % 3]!} b={p} extension />}
            <text x={p.x + 8} y={p.y + 18}>{["D", "E", "F"][i]}</text></g>)}
          {centerData.center && <><circle cx={centerData.center.x} cy={centerData.center.y} r="6" fill="#ff00cc" /><text x={centerData.center.x + 10} y={centerData.center.y - 10}>{mode === "medians" ? "G" : mode === "altitudes" ? "H" : "I"}</text>
            {mode === "bisectors" && <circle cx={centerData.center.x} cy={centerData.center.y} r={centerData.radius} className="tri-construction" />}</>}
        </>}
        {show && mode === "sine-law" && <><Segment a={A} b={foot} /><Segment a={B} b={foot} extension /><text x={foot.x + 5} y={foot.y - 10}>h</text></>}
        {show && mode === "cosine-law" && <><Segment a={C} b={projection(C, A, B)} /><Segment a={A} b={projection(C, A, B)} extension /></>}
        {points.map((p, i) => <g key={i}><text x={p.x + 14} y={p.y - 14}>{["A", "B", "C"][i]} · {f(degrees(data.angles[i]!))}°</text>
          <circle cx={p.x} cy={p.y} r="11" className="tri-handle" tabIndex={0} role="button" aria-label={`${tr("Move vertex", "Переместить вершину")} ${["A", "B", "C"][i]}`}
            onPointerDown={e => beginDrag(e, i, p)}
            onKeyDown={e => {
              const d = e.shiftKey ? 15 : 4;
              if (["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"].includes(e.key)) {
                e.preventDefault(); moveVertex(i, { x: p.x + (e.key === "ArrowLeft" ? -d : e.key === "ArrowRight" ? d : 0), y: p.y + (e.key === "ArrowUp" ? -d : e.key === "ArrowDown" ? d : 0) });
              }
            }} /></g>)}
        {points.map((p, i) => { const mid = mix(points[(i + 1) % 3]!, points[(i + 2) % 3]!, .5); return <text key={i} x={mid.x + 12} y={mid.y + 22}>{["a", "b", "c"][i]} = {f(data.sides[i]! / unit)}</text>; })}
      </>}
    </svg>
    {!geometryOnly && <><div className="activity-status tri-formula">
      {pyth && `${f(legA ** 2)} + ${f(legB ** 2)} = ${f(legA ** 2 + legB ** 2)} · c = ${f(Math.hypot(legA, legB))}`}
      {mode === "sine-law" && `a/sin A = ${f(a / unit / Math.sin(angleA))} · b/sin B = ${f(b / unit / Math.sin(data.angles[1]!))} · c/sin C = ${f(c / unit / Math.sin(data.angles[2]!))}`}
      {mode === "cosine-law" && `a² = ${f((a / unit) ** 2)} = b² + c² − 2bc cos A = ${f((b * b + c * c - 2 * b * c * Math.cos(angleA)) / unit ** 2)}`}
      {mode === "bisectors" && centerData && `BD/DC = ${f(distance(B, centerData.feet[0]!) / distance(centerData.feet[0]!, C))} = AB/AC = ${f(c / b)}`}
      {mode === "medians" && `AG/GD = 2 · S₁ = … = S₆ = ${f(data.area / unit ** 2 / 6)}`}
      {mode === "altitudes" && tr("AH ⟂ BC · BH ⟂ AC · CH ⟂ AB", "AH ⟂ BC · BH ⟂ AC · CH ⟂ AB")}
      {mode === "inscribed-angle" && `∠BAC = ½ ∠BOC = ${arc / 2}°`}
      {mode === "trig-addition" && <><p>cos(α + β) = cos α cos β − sin α sin β = {f(Math.cos(radians(alpha + beta)))}</p><p>sin(α + β) = sin α cos β + cos α sin β = {f(Math.sin(radians(alpha + beta)))}</p></>}
      {mode === "palm-trig" && <><p>sin {chosenAngle}° = √{finger}/2 · cos {chosenAngle}° = √{4 - finger}/2</p>
        <p>{tr("Count fingers toward the pinkie for sine, toward the thumb for cosine. The bent finger is not counted.", "Для синуса считайте пальцы в сторону мизинца, для косинуса — в сторону большого. Согнутый палец не считается.")}</p></>}
    </div>
    {notes[mode] && <p className="explanation">{notes[mode]![ru ? 1 : 0]}</p>}
    {mode === "inscribed-angle" && <InscribedProof locale={locale} />}
    {pyth && <PythagorasProof a={legA} b={legB} locale={locale} reducedMotion={reducedMotion} />}
    {pyth && <div className="explanation"><p>{tr("The square on the hypotenuse has the combined area of the other two squares. Converse: positive lengths satisfying this equality form a right triangle.", "Площадь квадрата на гипотенузе равна сумме площадей квадратов на катетах. Обратно: положительные длины, удовлетворяющие равенству, образуют прямоугольный треугольник.")}</p>
      </div>}
    {pyth && <PythagorasQuiz locale={locale} />}
    {pyth && <OriginalDrawings family="pythagoras" frames={[42, 1000, 1200, 1291]} locale={locale} />}
    </>}
  </section>;
}
