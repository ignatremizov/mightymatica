import { useRef, useState } from "react";
import type { PointerEvent } from "react";
import type { ActivityProps } from "../../shared/contracts";
import { cross, distance, falseProofConstruction, mix } from "./geometry";
import type { Point, Triangle } from "./geometry";
import OriginalDrawings from "./OriginalDrawings";

export default function FalseProof({ locale, startAtHint = false }: ActivityProps & { startAtHint?: boolean }) {
  const tr = (en: string, ru: string) => locale === "ru" ? ru : en;
  const initial: Triangle = [{ x: 235, y: 100 }, { x: 130, y: 330 }, { x: 470, y: 330 }];
  const [points, setPoints] = useState<Triangle>(initial);
  const [step, setStep] = useState(startAtHint ? 5 : 0);
  const [choice, setChoice] = useState<number | null>(null);
  const [reveal, setReveal] = useState(false);
  const svg = useRef<SVGSVGElement>(null);
  const dragging = useRef<number | null>(null);
  const [a, b, c] = points;
  const construction = falseProofConstruction(points);
  function move(index: number, x: number, y: number) {
    const next = points.map((point, i) => i === index
      ? { x: Math.min(535, Math.max(65, x)), y: Math.min(375, Math.max(55, y)) } : point) as Triangle;
    if (Math.abs(cross(...next)) > 3500 && next.every((point, i) => distance(point, next[(i + 1) % 3]!) > 45)) setPoints(next);
  }
  function pointerMove(event: PointerEvent<SVGSVGElement>) {
    const matrix = svg.current?.getScreenCTM();
    if (dragging.current === null || !matrix) return;
    const p = new DOMPoint(event.clientX, event.clientY).matrixTransform(matrix.inverse());
    move(dragging.current, p.x, p.y);
  }
  const all = construction ? [...points, construction.x, construction.footB, construction.footC] : points;
  const minX = Math.min(50, ...all.map(p => p.x - 45)), minY = Math.min(20, ...all.map(p => p.y - 45));
  const width = Math.max(570, ...all.map(p => p.x + 45)) - minX, height = Math.max(480, ...all.map(p => p.y + 45)) - minY;
  const segment = (p: Point, q: Point, dashed = false) => <line x1={p.x} y1={p.y} x2={q.x} y2={q.y} className={dashed ? "tri-extension" : "tri-construction"} />;
  const label = (p: Point, text: string) => <text x={p.x + 10} y={p.y - 10}>{text}</text>;
  const baseLength = distance(b, c);
  const normal = { x: -(c.y - b.y) / baseLength, y: (c.x - b.x) / baseLength };
  const bisectorExtent = Math.hypot(width, height);
  const descriptions = [
    tr("Claim: every triangle is isosceles. Start with any scalene triangle ABC. Follow the argument and look for the hidden mistake.", "Утверждение: каждый треугольник равнобедренный. Возьмём произвольный разносторонний ABC. Найдите скрытую ошибку."),
    tr("Draw the internal bisector b of ∠A. Every point on b is equally distant from the lines AB and AC.", "Построим внутреннюю биссектрису b угла A. Каждая её точка равноудалена от прямых AB и AC."),
    tr("Draw m perpendicular to BC at its midpoint M. Let X be its intersection with b. Thus XB = XC.", "Построим серединный перпендикуляр m к BC. Его пересечение с b обозначим X. Тогда XB = XC."),
    tr("Drop perpendiculars from X to the lines AB and AC. Call their feet B* and C*. Then XB* = XC*.", "Опустим из X перпендикуляры на прямые AB и AC. Основания — B* и C*. Тогда XB* = XC*."),
    tr("Right triangles AXB* and AXC* are congruent, so AB* = AC*. Right triangles XBB* and XCC* are also congruent, so BB* = CC*.", "Прямоугольные треугольники AXB* и AXC* равны, поэтому AB* = AC*. Треугольники XBB* и XCC* также равны, поэтому BB* = CC*."),
    tr("Subtract equal lengths: AB* − BB* = AC* − CC*. The supposed conclusion is AB = AC. But the drawing contains a trap. Which step fails?", "Вычтем равные отрезки: AB* − BB* = AC* − CC*. Мнимый вывод: AB = AC. Но в чертеже скрыта ловушка. Где ошибка?"),
  ];
  return <section className="activity-layout triangles-lab">
    <p>{tr("This is an intentionally false proof, not a theorem. Drag A, B or C, or focus a vertex and press the arrow keys. Sliders also move A.", "Это намеренно ложное доказательство, а не теорема. Двигайте A, B или C мышью или стрелками клавиатуры. Ползунки также перемещают A.")}</p>
    <div className="tri-controls controls">
      <label>{tr("A horizontal position", "Положение A по горизонтали")}<input type="range" min="65" max="535" value={a.x} onChange={e => move(0, Number(e.target.value), a.y)} /></label>
      <label>{tr("A vertical position", "Положение A по вертикали")}<input type="range" min="55" max="375" value={a.y} onChange={e => move(0, a.x, Number(e.target.value))} /></label>
    </div>
    <svg ref={svg} viewBox={`${minX} ${minY} ${width} ${height}`} role="group" aria-label={tr("False isosceles proof construction", "Построение для ложного доказательства")}
      onPointerMove={pointerMove} onPointerUp={() => { dragging.current = null; }} onPointerCancel={() => { dragging.current = null; }} onLostPointerCapture={() => { dragging.current = null; }}>
      <polygon points={points.map(p => `${p.x},${p.y}`).join(" ")} className="tri-side" />
      {construction && <>
        {step >= 1 && <>{segment(a, step >= 2 ? construction.x : construction.bisectorFoot)}{label(mix(a, construction.bisectorFoot, .45), "b")}</>}
        {step >= 2 && <>{segment({ x: construction.midpoint.x - normal.x * bisectorExtent, y: construction.midpoint.y - normal.y * bisectorExtent }, { x: construction.midpoint.x + normal.x * bisectorExtent, y: construction.midpoint.y + normal.y * bisectorExtent }, true)}
          {label(construction.midpoint, "M")}{label(construction.x, "X")}{label({ x: construction.midpoint.x - normal.x * 70, y: construction.midpoint.y - normal.y * 70 }, "m")}
          {segment(construction.x, b, true)}{segment(construction.x, c, true)}<circle cx={construction.x.x} cy={construction.x.y} r="5" fill="#ff00cc" /></>}
        {step >= 3 && <>{segment(a, construction.footB, true)}{segment(a, construction.footC, true)}
          {segment(construction.x, construction.footB)}{segment(construction.x, construction.footC)}
          {label(construction.footB, "B*")}{label(construction.footC, "C*")}
          {reveal && <><line x1={b.x} y1={b.y} x2={construction.footB.x} y2={construction.footB.y} stroke="#cc0000" strokeWidth="5" />
            <line x1={c.x} y1={c.y} x2={construction.footC.x} y2={construction.footC.y} stroke="#cc0000" strokeWidth="5" /></>}</>}
      </>}
      {label(a, "A")}{label(b, "B")}{label(c, "C")}
      {points.map((point, index) => <circle key={index} cx={point.x} cy={point.y} r="12" tabIndex={0} role="button" className="tri-handle" aria-label={`${tr("Move vertex", "Переместить вершину")} ${["A", "B", "C"][index]}`}
        onPointerDown={e => { if (e.button !== 0 || dragging.current !== null) return; dragging.current = index; e.currentTarget.setPointerCapture(e.pointerId); e.currentTarget.focus(); }}
        onKeyDown={e => {
          const offsets: Record<string, [number, number]> = { ArrowLeft: [-5, 0], ArrowRight: [5, 0], ArrowUp: [0, -5], ArrowDown: [0, 5] };
          const offset = offsets[e.key]; if (offset) { e.preventDefault(); const scale = e.shiftKey ? 3 : 1; move(index, point.x + offset[0] * scale, point.y + offset[1] * scale); }
        }} />)}
    </svg>
    <nav className="controls" aria-label={tr("Proof steps", "Шаги доказательства")}>
      <button className="button-secondary" disabled={step === 0} onClick={() => setStep(step - 1)}>{tr("Previous", "Назад")}</button>
      <span>{step + 1} / {descriptions.length}</span>
      <button className="button" disabled={step === descriptions.length - 1} onClick={() => setStep(step + 1)}>{tr("Next", "Дальше")}</button>
      <button className="button-secondary" onClick={() => { setStep(startAtHint ? 5 : 0); setReveal(false); setChoice(null); setPoints(initial); }}>{tr("Start over", "Начать заново")}</button>
    </nav>
    <p className="explanation" aria-live="polite">{descriptions[step]}</p>
    {!construction && <p role="status">{tr("For this isosceles triangle b and m coincide: no unique X exists. Move a vertex to make the sides unequal and investigate the false general proof.", "В этом равнобедренном треугольнике b и m совпадают: единственной точки X нет. Переместите вершину, чтобы стороны стали неравными.")}</p>}
    <p className="activity-status">AB = {distance(a, b).toFixed(2)} · AC = {distance(a, c).toFixed(2)}</p>
    {step === 5 && <><div className="choice-grid">{[
      tr("XB = XC on the perpendicular bisector", "XB = XC на серединном перпендикуляре"),
      tr("Congruence of the right triangles", "Равенство прямоугольных треугольников"),
      tr("Replacing both differences by whole side lengths", "Замена обеих разностей длинами сторон"),
    ].map((text, i) => <button key={text} className="button-secondary" onClick={() => { setChoice(i); if (i === 2) setReveal(true); }}>{text}</button>)}</div>
      {choice !== null && <p role="status">{choice === 2 ? tr("Exactly. Equal differences are true, but one difference is not the side length.", "Верно. Разности равны, но одна из разностей не равна стороне.") : tr("That part is valid. Inspect the order of A, B, B* and A, C, C*.", "Этот шаг верен. Проверьте порядок точек A, B, B* и A, C, C*.")}</p>}
      <button className="button-secondary" onClick={() => setReveal(!reveal)}>{tr("Hint / reveal segment order", "Подсказка: порядок точек")}</button></>}
    {reveal && construction && <div className="explanation">
      <p>{tr("One perpendicular foot lies on a side extension, the other on the side itself. The proof subtracts where it must add.", "Одно основание перпендикуляра лежит на продолжении стороны, другое — на самой стороне. В доказательстве вычитают там, где нужно складывать.")}</p>
      <p className="tri-formula">{construction.parameterB > 1 ? "AB = AB* − BB*; AC = AC* + CC*" : "AB = AB* + BB*; AC = AC* − CC*"}</p>
      <p>{tr("Dragging exposes the original lesson's trap: a misleading placement of the feet hides the incorrect segment arithmetic. The true equalities never imply that a scalene triangle is isosceles.", "Перетаскивание раскрывает ловушку оригинального урока: неверное расположение оснований маскирует ошибку в сложении отрезков. Верные равенства не делают разносторонний треугольник равнобедренным.")}</p>
    </div>}
    <OriginalDrawings family="false-proof" frames={[600, 1000, 1500, 1900, 2015]} locale={locale}
      warning={tr("These original drawings deliberately misplace the perpendicular feet to disguise the false proof. Their conclusion is false; compare the accurate live construction above. Stills do not reproduce the complete movie.", "В оригинальных рисунках основания перпендикуляров намеренно расположены неверно, маскируя ошибку. Их вывод ложен: сравните с точным построением выше. Иллюстрации не заменяют полный фильм.")} />
  </section>;
}
