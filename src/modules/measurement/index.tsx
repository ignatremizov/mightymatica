import { useState, type PointerEvent } from "react";
import type { ActivityProps, Locale } from "../../shared/contracts";
import { t } from "../../shared/contracts";
import { areaMeasures, polygonMeasures, polygonVertices } from "./rules";
import MeasurementLesson from "./MeasurementLesson";
import "./measurement.css";

const f = (value: number) => Number(value.toFixed(3)).toString();

function Slider({ label, value, min = 1, max, onChange }: { label: string; value: number; min?: number; max: number; onChange: (value: number) => void }) {
  return <label className="control">{label}: <strong>{value}</strong>
    <input type="range" min={min} max={max} value={value} onChange={event => onChange(Number(event.target.value))} />
  </label>;
}

function Area({ locale }: { locale: Locale }) {
  const [base, setBase] = useState(8);
  const [height, setHeight] = useState(4);
  const [upper, setUpper] = useState(4);
  const [shear, setShear] = useState(2);
  const [shape, setShape] = useState<"rectangle" | "parallelogram" | "trapezoid" | "triangle">("rectangle");
  const [grid, setGrid] = useState(true);
  const [derivation, setDerivation] = useState(false);
  const values = areaMeasures(base, height, upper);
  const left = 2;
  const shift = shape === "parallelogram" ? shear : 0;
  const topWidth = shape === "trapezoid" ? upper : base;
  const topLeft = shape === "trapezoid" ? left + (base - upper) / 2 : left + shift;
  const moveShear = (event: PointerEvent<SVGCircleElement>) => {
    const matrix = event.currentTarget.ownerSVGElement?.getScreenCTM();
    if (!matrix) return;
    const point = new DOMPoint(event.clientX, event.clientY).matrixTransform(matrix.inverse());
    setShear(Math.max(0, Math.min(3, Math.round(point.x - left))));
  };
  const points = shape === "triangle" ? `${left},10 ${left + base},10 ${left},${10 - height}` : `${left},10 ${left + base},10 ${topLeft + topWidth},${10 - height} ${topLeft},${10 - height}`;
  const name = (key: typeof shape) => key === "triangle" ? t(locale, "Triangle", "Треугольник") : key === "rectangle" ? t(locale, "Rectangle", "Прямоугольник") : key === "parallelogram" ? t(locale, "Parallelogram", "Параллелограмм") : t(locale, "Trapezoid", "Трапеция");
  return <div className="activity-layout measurement">
    <p className="explanation">{t(locale, "One grid square is one square unit. Change the lengths; slide the top of the parallelogram without changing its area. Height is perpendicular to the base, not the slanted side.", "Клетка — одна квадратная единица. Меняйте размеры; сдвигайте верхнюю сторону параллелограмма без изменения площади. Высота перпендикулярна основанию, это не наклонная сторона.")}</p>
    <div className="controls">
      <label className="control">{t(locale, "Figure", "Фигура")}<select value={shape} onChange={e => setShape(e.target.value as typeof shape)}>{(["rectangle", "parallelogram", "trapezoid", "triangle"] as const).map(key => <option key={key} value={key}>{name(key)}</option>)}</select></label>
      <Slider label={t(locale, "Base B", "Основание B")} value={base} max={10} onChange={setBase} />
      <Slider label={t(locale, "Height H", "Высота H")} value={height} max={8} onChange={setHeight} />
      {shape === "trapezoid" && <Slider label={t(locale, "Upper base b", "Верхнее основание b")} value={upper} max={10} onChange={setUpper} />}
      {shape === "parallelogram" && <Slider label={t(locale, "Shear", "Сдвиг")} value={shear} min={0} max={3} onChange={setShear} />}
      <label><input type="checkbox" checked={grid} onChange={e => setGrid(e.target.checked)} /> {t(locale, "Unit grid", "Сетка")}</label>
      {shape === "trapezoid" && <label><input type="checkbox" checked={derivation} onChange={e => setDerivation(e.target.checked)} /> {t(locale, "Show the rectangle and triangles", "Показать прямоугольник и треугольники")}</label>}
      <button className="button button-secondary" onClick={() => { setBase(8); setHeight(4); setUpper(4); setShear(2); setShape("rectangle"); setGrid(true); setDerivation(false); }}>{t(locale, "Reset", "Сначала")}</button>
    </div>
    {shape === "parallelogram" && <p className="measurement-drag-hint">{t(locale, "Drag the top-left dot, or use the Shear slider.", "Перетаскивайте верхнюю левую точку или используйте ползунок «Сдвиг».")}</p>}
    <svg className="diagram" viewBox="-4 0 22 12" role="img" aria-label={`${name(shape)}: B=${base}, H=${height}, ${t(locale, "area", "площадь")}=${values[shape]}`}>
      {grid && <g stroke="#9aaabe" strokeWidth=".018">
        {Array.from({ length: 23 }, (_, i) => <path key={`v${i}`} d={`M${i - 4} 0V12`} />)}
        {Array.from({ length: 13 }, (_, i) => <path key={`h${i}`} d={`M-4 ${i}H18`} />)}
      </g>}
      <polygon points={points} fill="#00ccff" stroke="#000000" strokeWidth=".07" />
      {shape === "trapezoid" && derivation && <>
        <rect x={Math.max(left, topLeft)} y={10 - height} width={Math.min(base, upper)} height={height} fill="#ffcc99" stroke="#000000" strokeWidth=".04" strokeDasharray=".15 .12" />
      </>}
      {shape === "triangle" && <polygon points={`${left + base},10 ${left + base},${10 - height} ${left},${10 - height}`} fill="#f0bc69" fillOpacity=".25" stroke="#176d86" strokeWidth=".04" strokeDasharray=".15 .12" />}
      <path d={`M${topLeft} ${10 - height}V10`} stroke="#a93655" strokeWidth=".055" strokeDasharray=".15 .12" />
      <g className="measurement-svg-label"><text x={left + base / 2} y={11}>B = {base}</text><text x={topLeft + .2} y={10 - height / 2}>H = {height}</text>{shape === "trapezoid" && <text x={topLeft + upper / 2} y={9.6 - height}>b = {upper}</text>}</g>
      {shape === "parallelogram" && <><circle cx={topLeft} cy={10 - height} r=".3" fill="#000099" stroke="white" strokeWidth=".07" aria-hidden="true" />
      <circle className="measurement-shear-handle" cx={topLeft} cy={10 - height} r="1.3" fill="transparent" aria-hidden="true"
        onPointerDown={event => { if (event.button !== 0) return; event.currentTarget.setPointerCapture(event.pointerId); moveShear(event); }}
        onPointerMove={event => { if (event.currentTarget.hasPointerCapture(event.pointerId)) moveShear(event); }}
      /></>}
    </svg>
    <p className="activity-status" aria-live="polite">{shape === "triangle" ? `A = B × H/2 = ${base} × ${height}/2` : shape === "trapezoid" ? `A = (B + b)H/2 = (${base} + ${upper}) × ${height}/2` : `A = B × H = ${base} × ${height}`} = <strong>{values[shape]}</strong> {t(locale, "square units", "кв. ед.")}</p>
    {shape === "triangle" && <p className="explanation">{t(locale, "The dashed half is a second congruent triangle. Together they form a parallelogram (here a rectangle) of area B × H. Each triangle has half that area: B × H/2.", "Пунктирная половина — второй равный треугольник. Вместе они составляют параллелограмм (здесь прямоугольник) площадью B × H. Площадь каждого треугольника вдвое меньше: B × H/2.")}</p>}
    {shape === "trapezoid" && derivation && <p className="explanation">{t(locale, "The central rectangle has the shorter base. The two remaining triangles together have base equal to the difference of the bases and the same height.", "Основание центрального прямоугольника — меньшее из оснований трапеции. Сумма оснований двух оставшихся треугольников равна разности оснований трапеции; высота та же.")}<br />
      A = {Math.min(base, upper)} × {height} + ½ × ({Math.max(base, upper)} − {Math.min(base, upper)}) × {height} = {values.trapezoid}
    </p>}
  </div>;
}

function Polygon({ locale, circle }: { locale: Locale; circle: boolean }) {
  const [sides, setSides] = useState(circle ? 5 : 6);
  const [radius, setRadius] = useState(5);
  const [dissect, setDissect] = useState(false);
  const measures = polygonMeasures(sides, radius);
  const vertices = polygonVertices(sides, 100);
  const circleArea = Math.PI * radius * radius;
  return <div className="activity-layout measurement">
    <p className="explanation">{circle
      ? t(locale, "Inscribe a regular polygon. Increase its number of sides: the perimeter approaches 2πr, the apothem h approaches r, and Ph/2 approaches πr².", "Впишите правильный многоугольник. Увеличивайте число сторон: периметр стремится к 2πr, апофема h — к r, а Ph/2 — к πr².")
      : t(locale, "Join the centre to every vertex. Each triangle has base a and perpendicular height h (the apothem). Separate the equal pieces and add their areas.", "Соедините центр со всеми вершинами. У каждого треугольника основание a и высота h — апофема. Раздвиньте равные части и сложите их площади.")}</p>
    <div className="controls">
      <Slider label={t(locale, "Sides n", "Стороны n")} value={sides} min={3} max={circle ? 120 : 12} onChange={setSides} />
      <Slider label={t(locale, "Radius r", "Радиус r")} value={radius} max={10} onChange={setRadius} />
      {!circle && <label><input type="checkbox" checked={dissect} onChange={e => setDissect(e.target.checked)} /> {t(locale, "Separate triangles", "Раздвинуть треугольники")}</label>}
      <button className="button button-secondary" onClick={() => { setSides(circle ? 5 : 6); setRadius(5); setDissect(false); }}>{t(locale, "Reset", "Сначала")}</button>
    </div>
    <svg className="diagram measurement-polygon" viewBox="-155 -155 310 310" role="img" aria-label={t(locale, `${sides} equal triangles; apothem ${f(measures.height)}; area ${f(measures.area)}`, `${sides} равных треугольников; апофема ${f(measures.height)}; площадь ${f(measures.area)}`)}>
      {circle && <circle r="100" fill="none" stroke="#8b527b" strokeWidth="2" strokeDasharray="4 3" />}
      {vertices.map((point, i) => {
        const next = vertices[(i + 1) % sides]!;
        const dx = dissect ? (point.x + next.x) * .13 : 0;
        const dy = dissect ? (point.y + next.y) * .13 : 0;
        return <polygon key={i} transform={`translate(${dx} ${dy})`} points={`0,0 ${point.x},${point.y} ${next.x},${next.y}`} fill={i % 2 ? "#33ffcc" : "#ffcc99"} stroke="#000000" strokeWidth={sides > 30 ? ".5" : "1.2"} />;
      })}
      {!dissect && <><path d={`M0 0L${vertices[0]!.x} ${vertices[0]!.y}`} stroke="#8b3155" strokeWidth="2" /><path d={`M0 0V${-100 * Math.cos(Math.PI / sides)}`} stroke="#152d49" strokeWidth="2" strokeDasharray="3 3" /><text x="5" y="-40" fontSize="12">h</text><text x={vertices[0]!.x / 2 - 12} y={vertices[0]!.y / 2} fontSize="12">r</text><text x="0" y={-100 * Math.cos(Math.PI / sides) - 8} textAnchor="middle" fontSize="12">a</text></>}
    </svg>
    <div className="stat-grid">
      <p className="stat">a = {f(measures.side)}</p><p className="stat">h = {f(measures.height)}</p><p className="stat">P = n × a = {f(measures.perimeter)}</p>
    </div>
    <p className="activity-status" aria-live="polite">A = {sides} × (a × h/2) = P × h/2 = <strong>{f(measures.area)}</strong></p>
    {circle && <p className="explanation">C = 2πr = {f(2 * Math.PI * radius)}; A = πr² = {f(circleArea)}<br />{t(locale, "Polygon covers", "Многоугольник покрывает")} {f(100 * measures.area / circleArea)}% {t(locale, "of the circle's area.", "площади круга.")}</p>}
  </div>;
}

export default function Measurement({ activityId, locale, reducedMotion }: ActivityProps) {
  const id = activityId === "measurement-area" ? "area" : activityId === "measurement-circle" ? "circle" : "polygon";
  return <div className="measurement"><MeasurementLesson key={`${id}-${locale}`} id={id} locale={locale} reducedMotion={reducedMotion}
    explorer={id === "area" ? <Area locale={locale} /> : <Polygon key={activityId} locale={locale} circle={id === "circle"} />} /></div>;
}
