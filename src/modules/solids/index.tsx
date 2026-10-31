import { useRef, useState } from "react";
import type { ActivityProps, Locale } from "../../shared/contracts";
import { t, mediaUrl } from "../../shared/contracts";
import OriginalCompanion from "../../shared/OriginalCompanion";
import CubeSectionsLesson from "./CubeSectionsLesson";
import SphereLesson from "./SphereLesson";
import TetrahedronView from "./TetrahedronView";
import SourceSoundtrack from "./SourceSoundtrack";
import { cubeEdges, cubeSection, cubeVertices, displayPairs, sphereMeasures, sphereSlice } from "./rules";
import type { Vec3 } from "./rules";
import "./solids.css";

const num = (x: number) => x >= 1e7 || (x > 0 && x < .001) ? x.toExponential(4) : Number(x.toFixed(4)).toString();
function Range({ label, value, min, max, step = 1, onChange }: { label: string; value: number; min: number; max: number; step?: number; onChange: (n: number) => void }) {
  return <label className="control">{label}: {num(value)}<input type="range" min={min} max={max} step={step} value={value} onChange={e => onChange(Number(e.target.value))} /></label>;
}

function Sections({ locale }: { locale: Locale }) {
  const [azimuth, setAzimuth] = useState(45);
  const [elevation, setElevation] = useState(35.264);
  const [offset, setOffset] = useState(0);
  const [view, setView] = useState(25);
  const [construction, setConstruction] = useState(false);
  const viewDrag = useRef<{ pointer: number; x: number; angle: number } | null>(null);
  const radians = Math.PI / 180;
  const normal: Vec3 = [Math.cos(elevation * radians) * Math.cos(azimuth * radians), Math.cos(elevation * radians) * Math.sin(azimuth * radians), Math.sin(elevation * radians)];
  const section = cubeSection(normal, offset);
  const project = (p: Vec3) => {
    const x = p[0] * Math.cos(view * radians) - p[1] * Math.sin(view * radians);
    const depth = p[0] * Math.sin(view * radians) + p[1] * Math.cos(view * radians);
    return [220 + x * 90, 200 + depth * 40 - p[2] * 85];
  };
  const points = section.map(p => project(p).join(",")).join(" ");
  const presets = [
    { en: "Triangle", ru: "Треугольник", az: 45, el: 35.264, d: 1.3 },
    { en: "Square", ru: "Квадрат", az: 0, el: 90, d: 0 },
    { en: "Pentagon", ru: "Пятиугольник", az: 35, el: 18, d: .4 },
    { en: "Regular hexagon", ru: "Правильный шестиугольник", az: 45, el: 35.264389682754654, d: 0 },
  ];
  return <div className="activity-layout solids">
    <p className="explanation">{t(locale, "What polygons can a plane cut out of a cube? Move and tilt the plane, then rotate your view. The highlighted polygon is calculated from intersections with the twelve edges.", "Какие многоугольники получаются при сечении куба? Сдвигайте и наклоняйте плоскость, поворачивайте вид. Выделенный многоугольник вычислен по пересечениям с двенадцатью рёбрами.")}</p>
    <div className="controls">{presets.map(p => <button className="button button-secondary" key={p.en} onClick={() => { setAzimuth(p.az); setElevation(p.el); setOffset(p.d); }}>{t(locale, p.en, p.ru)}</button>)}</div>
    <div className="controls">
      <Range label={t(locale, "Plane azimuth", "Азимут плоскости")} value={azimuth} min={0} max={180} onChange={setAzimuth} />
      <Range label={t(locale, "Plane elevation", "Наклон плоскости")} value={elevation} min={0} max={90} onChange={setElevation} />
      <Range label={t(locale, "Plane offset", "Сдвиг плоскости")} value={offset} min={-1.8} max={1.8} step={.01} onChange={setOffset} />
      <Range label={t(locale, "View angle", "Поворот вида")} value={view} min={0} max={360} onChange={setView} />
      <label><input type="checkbox" checked={construction} onChange={e => setConstruction(e.target.checked)} />{t(locale, "Show construction points", "Показать точки построения")}</label>
      <button className="button button-secondary" onClick={() => { setAzimuth(45); setElevation(35.264); setOffset(0); setView(25); setConstruction(false); }}>{t(locale, "Reset", "Сначала")}</button>
    </div>
    <p className="activity-note">{t(locale, "Drag the cube to rotate your view, or use the View angle slider.", "Перетаскивайте куб, чтобы повернуть вид, или используйте ползунок «Поворот вида».")}</p>
    <svg viewBox="0 0 440 410" className="diagram solids-rotate" role="img" aria-label={t(locale, `Cube section with ${section.length} vertices`, `Сечение куба: ${section.length} вершин`)}
      onPointerDown={event => {
        if (event.button !== 0) return;
        event.currentTarget.setPointerCapture(event.pointerId);
        viewDrag.current = { pointer: event.pointerId, x: event.clientX, angle: view };
      }}
      onPointerMove={event => {
        const start = viewDrag.current;
        if (start?.pointer === event.pointerId) setView(((start.angle + event.clientX - start.x) % 360 + 360) % 360);
      }}
      onPointerUp={() => { viewDrag.current = null; }}
      onPointerCancel={() => { viewDrag.current = null; }}
      onLostPointerCapture={() => { viewDrag.current = null; }}>
      {cubeEdges.map(([a, b]) => { const p = project(cubeVertices[a]!), q = project(cubeVertices[b]!); return <line key={`${a}-${b}`} x1={p[0]} y1={p[1]} x2={q[0]} y2={q[1]} stroke="#000000" strokeWidth="2" />; })}
      {section.length >= 3 && <polygon points={points} fill="#ff00cc" fillOpacity=".65" stroke="#000000" strokeWidth="3" />}
      {section.map((p, i) => { const [x, y] = project(p); return <g key={i}><circle cx={x} cy={y} r="4" fill="#792838" />{construction && <text x={x! + 7} y={y! - 7} fontSize="14">{String.fromCharCode(65 + i)}</text>}</g>; })}
    </svg>
    <p className="activity-status" aria-live="polite">{section.length >= 3 ? t(locale, `${section.length}-sided section`, `Сечение: ${section.length} сторон`) : section.length === 0 ? t(locale, "The plane misses the cube.", "Плоскость не пересекает куб.") : t(locale, "Degenerate section: a point or an edge.", "Вырожденное сечение: точка или ребро.")}</p>
    {construction && <p className="explanation">{t(locale, "1. Mark where the plane meets cube edges. 2. Join successive points lying on the same face. 3. Close the polygon. A convex cube has six faces, so a nondegenerate section has at most six sides: never seven.", "1. Отметьте пересечения с рёбрами. 2. Соедините соседние точки на одной грани. 3. Замкните многоугольник. У выпуклого куба шесть граней, поэтому невырожденное сечение имеет не более шести сторон: семи быть не может.")}</p>}
    <p className="activity-note">{t(locale, "Wireframe projection: all cube edges remain visible, including those behind the section.", "Каркасная проекция: видны все рёбра, включая находящиеся за сечением.")} n·(x,y,z) = {num(offset)}</p>
  </div>;
}

function Tetrahedra({ locale }: { locale: Locale }) {
  const [digits, setDigits] = useState([0, 1, 2, 3, 4, 5, 6, 7]);
  const [selected, setSelected] = useState<number | null>(null);
  const [faces, setFaces] = useState([0, 0]);
  const [padded, setPadded] = useState(true);
  const [showReason, setShowReason] = useState(false);
  const [resetVersion, setResetVersion] = useState(0);
  const pairs = displayPairs(digits.slice(0, 4), digits.slice(4));
  const shown = `${digits[faces[0]!]}${digits[4 + faces[1]!]}`;
  const swap = (index: number) => {
    if (selected === null) setSelected(index);
    else {
      const next = [...digits];
      [next[selected], next[index]] = [next[index]!, next[selected]!];
      setDigits(next); setSelected(null);
    }
  };
  return <div className="activity-layout solids">
    <p className="explanation">{t(locale, "Can digits 0–7 be placed on two tetrahedra to show every weekday from 01 to 07? Click two face labels to swap their digits; every digit is used once. You can also compare the easier single-digit version.", "Можно ли расставить цифры 0–7 на двух тетраэдрах, чтобы показать номер любого дня недели от 01 до 07? Нажмите две подписи граней, чтобы обменять цифры; каждая используется один раз. Можно также сравнить с простым однозначным вариантом.")}</p>
    <div className="solids-tetra-grid">{[0, 1].map(solid => <section key={solid}>
      <h2>{t(locale, "Tetrahedron", "Тетраэдр")} {solid + 1}</h2>
      <TetrahedronView key={`${solid}-${resetVersion}`} locale={locale} digits={digits.slice(solid * 4, solid * 4 + 4)} selectedFace={faces[solid]!} />
      <label className="control">{t(locale, "Inspect face", "Посмотреть грань")}<select value={faces[solid]} onChange={e => setFaces(faces.map((value, i) => i === solid ? Number(e.target.value) : value))}>{[0, 1, 2, 3].map(i => <option key={i} value={i}>{i + 1}: {digits[solid * 4 + i]}</option>)}</select></label>
      <div className="controls">{digits.slice(solid * 4, solid * 4 + 4).map((digit, face) => <button key={face} className="button button-secondary" aria-pressed={selected === solid * 4 + face} onClick={() => swap(solid * 4 + face)} aria-label={t(locale, `Swap face ${face + 1}, digit ${digit}`, `Обменять грань ${face + 1}, цифра ${digit}`)}>{digit}</button>)}</div>
    </section>)}</div>
    <p className="activity-status" aria-live="polite">{t(locale, "Displayed pair", "Показанная пара")}: <strong>{shown}</strong>. {selected !== null ? t(locale, "Now choose the second face to swap.", "Выберите вторую грань для обмена.") : t(locale, "Choose any two labels to swap.", "Выберите две подписи для обмена.")}</p>
    <label><input type="checkbox" checked={padded} onChange={e => setPadded(e.target.checked)} />{t(locale, "Require two faces: 01–07 (either solid may go first)", "Требовать две грани: 01–07 (порядок тетраэдров любой)")}</label>
    <div className="stat-grid">{Array.from({ length: 7 }, (_, i) => {
      const day = i + 1;
      const possible = !padded || pairs.has(`0${day}`);
      return <span className="stat" key={day}>{padded ? `0${day}` : day}: {possible ? "✓" : "—"}</span>;
    })}</div>
    <div className="controls"><button className="button" aria-expanded={showReason} onClick={() => setShowReason(!showReason)}>{t(locale, "Explain the distinction", "Объяснить различие")}</button><button className="button button-secondary" onClick={() => { setDigits([0, 1, 2, 3, 4, 5, 6, 7]); setFaces([0, 0]); setSelected(null); setPadded(true); setShowReason(false); setResetVersion(value => value + 1); }}>{t(locale, "Reset", "Сначала")}</button></div>
    {showReason && <p className="explanation">{t(locale, "Single-digit days are all available by choosing a face of either solid. But 01–07 is impossible with each digit used once: the only 0 sits on one solid; its partner can show only four distinct digits.", "Однозначные номера доступны: выберите грань любого тетраэдра. Но показать все 01–07 невозможно при однократном использовании цифр: единственный 0 находится на одном тетраэдре, а другой может показать только четыре разные цифры.")}</p>}
  </div>;
}

function SphereExplorer({ locale }: { locale: Locale }) {
  const [radius, setRadius] = useState(3.2);
  const [heightRatio, setHeightRatio] = useState(.5);
  const [slices, setSlices] = useState(12);
  const [increment, setIncrement] = useState(.2);
  const [unit, setUnit] = useState("cm");
  const h = radius * heightRatio;
  const slice = sphereSlice(radius, h);
  const m = sphereMeasures(radius);
  const approxHemisphere = Array.from({ length: slices }, (_, i) => sphereSlice(radius, (i + .5) * radius / slices).discArea * radius / slices).reduce((a, b) => a + b, 0);
  const quotient = (sphereMeasures(radius + increment).volume - m.volume) / increment;
  const examples = [
    { en: "Water drop", ru: "Капля воды", r: .2, unit: "cm" },
    { en: "Tennis ball", ru: "Теннисный мяч", r: 3.2, unit: "cm" },
    { en: "Basketball", ru: "Баскетбольный мяч", r: 12.5, unit: "cm" },
    { en: "Earth", ru: "Земля", r: 6400, unit: "km" },
    { en: "Sun", ru: "Солнце", r: 695500, unit: "km" },
  ];
  const y = 180 - heightRatio * 120, disc = slice.discRadius / radius * 100, cone = slice.coneRadius / radius * 100;
  return <div className="activity-layout solids">
    <p className="explanation">{t(locale, "At height h above the bottom of a hemisphere, the slice radius is √(r²−(r−h)²). A cylinder of radius r minus a cone of height r has an annular slice with exactly the same area, at every height.", "На высоте h от нижней точки полушара радиус сечения равен √(r²−(r−h)²). У цилиндра радиуса r без конуса высоты r площадь кольцевого сечения на любой высоте такая же.")}</p>
    <div className="controls">{examples.map(e => <button className="button button-secondary" key={e.en} onClick={() => { setRadius(e.r); setUnit(e.unit); }}>{t(locale, e.en, e.ru)}</button>)}</div>
    <div className="controls">
      <label className="control">{t(locale, "Radius r", "Радиус r")} ({unit})<input type="number" min=".01" max="1000000" step="any" value={radius} onChange={e => { const n = Number(e.target.value); if (Number.isFinite(n) && n >= .01 && n <= 1e6) setRadius(n); }} /></label>
      <Range label={t(locale, "Relative slice height h/r", "Относительная высота h/r")} value={heightRatio} min={0} max={1} step={.01} onChange={setHeightRatio} />
      <Range label={t(locale, "Approximation slices", "Слоёв для приближения")} value={slices} min={2} max={100} onChange={setSlices} />
    </div>
    <svg className="diagram" viewBox="0 0 600 260" role="img" aria-label={t(locale, "Hemisphere and cylinder minus cone, with equal-area slices highlighted", "Полушар и цилиндр без конуса; выделены равновеликие сечения")}>
      <path d="M40 60A100 120 0 0 0 240 60Z" fill="#0099ff" stroke="#000099" strokeWidth="2" />
      <path d={`M${140 - disc} ${y}H${140 + disc}`} stroke="#ff00cc" strokeWidth="5" />
      <path d="M360 60H560V180H360Z M360 180L460 60L560 180Z" fill="#0099ff" fillRule="evenodd" stroke="#000099" strokeWidth="2" />
      <path d={`M360 ${y}H${460 - cone} M${460 + cone} ${y}H560`} stroke="#ff00cc" strokeWidth="5" />
      <g fill="#000099" fontSize="14"><text x="80" y="215">{t(locale, "Hemisphere", "Полушар")}</text><text x="345" y="215">{t(locale, "Cylinder − cone", "Цилиндр − конус")}</text></g>
    </svg>
    <p className="activity-note">{t(locale, "Axial sections; pink lines represent circular/annular slices.", "Осевые разрезы; розовые линии — сечения диском / кольцом.")}</p>
    <div className="stat-grid"><p className="stat">h = {num(h)} {unit}</p><p className="stat">{t(locale, "Disc", "Диск")}: {num(slice.discArea)} {unit}²</p><p className="stat">{t(locale, "Annulus", "Кольцо")}: {num(slice.ringArea)} {unit}²</p></div>
    <p className="explanation">A(h) = π[r² − (r−h)²]<br />V<sub>{t(locale, "hemisphere", "полушар")}</sub> = πr³ − πr³/3 = 2πr³/3<br />V<sub>{t(locale, "sphere", "шар")}</sub> = 2 × 2πr³/3 = 4πr³/3 = <strong>{num(m.volume)} {unit}³</strong></p>
    <p className="activity-status" aria-live="polite">{t(locale, "Midpoint-disc approximation of the full sphere", "Приближение шара слоями по средним точкам")}: {num(2 * approxHemisphere)} {unit}³ ({slices} {t(locale, "slices per hemisphere", "слоёв на полушар")}).</p>
    <h2>{t(locale, "Volume growth reveals surface area", "Рост объёма и площадь поверхности")}</h2>
    <Range label={t(locale, "Radius increment Δr", "Приращение радиуса Δr")} value={increment} min={.001} max={1} step={.001} onChange={setIncrement} />
    <p className="activity-status">ΔV/Δr = {num(quotient)} {unit}²<br />Δr → 0: dV/dr = 4πr² = <strong>{num(m.surface)} {unit}²</strong></p>
    <p className="activity-note">{t(locale, "Examples use ideal spheres and the original lesson's stated radii, not precision astronomical or ball measurements. Diagrams are normalized to r and are not to a common real-world scale.", "Примеры используют идеальные шары и радиусы из исходного урока, а не точные астрономические или спортивные измерения. Размеры рисунков нормированы по r.")}</p>
  </div>;
}

export default function Solids({ activityId, locale, reducedMotion }: ActivityProps) {
  if (activityId === "solids-sphere-volume") {
    return <div className="solids"><SphereLesson key={locale} locale={locale} reducedMotion={reducedMotion} explorer={<SphereExplorer locale={locale} />} /></div>;
  }
  if (activityId === "solids-cube-sections") {
    return <div className="solids"><CubeSectionsLesson key={locale} locale={locale} reducedMotion={reducedMotion} explorer={<Sections locale={locale} />} /></div>;
  }
  return <div className="solids">
    <details className="activity-note"><summary>{t(locale, "Original film illustration", "Иллюстрация исходного фильма")}</summary>
      <img className="solids-original" src={mediaUrl("solids/tetrahedron-reference/1.svg")} alt={t(locale, "Static frame exported from this activity's original English Flash film", "Статический кадр из исходного англоязычного Flash-фильма")} loading="lazy" />
      <p>{t(locale, "Illustration: Yuri Remizov / MightyMatica.", "Иллюстрация: Юрий Ремизов / MightyMatica.")}</p>
    </details>
    <details className="activity-note"><summary>{t(locale, "Original collection companion", "Персонаж исходной коллекции")}</summary>
      <OriginalCompanion playing={false} reducedMotion={reducedMotion} label={t(locale, "Original Pythagoras character, still pose", "Исходный персонаж Пифагор, неподвижная поза")} />
      <p>{t(locale, "Pythagoras — Yuri Remizov / MightyMatica.", "Пифагор — Юрий Ремизов / MightyMatica.")}</p>
    </details>
    <Tetrahedra locale={locale} />
    <SourceSoundtrack track="tetrahedron" locale={locale} />
  </div>;
}
