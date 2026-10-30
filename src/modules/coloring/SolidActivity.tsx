import { useRef, useState } from "react";
import type { PointerEvent } from "react";
import type { ActivityProps } from "../../shared/contracts";
import { mediaUrl } from "../../shared/contracts";
import { boxRotationCount, distinctFaceColorings } from "./rules";
import SourceSoundtrack from "./SourceSoundtrack";

type Vertex = readonly [number, number, number];
interface Face { points: Vertex[]; color: string }
const boxColors = ["#00cc00", "#ffffff", "#0033ff", "#ff0099", "#ff66ff", "#ffff66"];
function colorText(color: string) {
  const channels = [1, 3, 5].map(offset => {
    const value = parseInt(color.slice(offset, offset + 2), 16) / 255;
    return value <= .04045 ? value / 12.92 : ((value + .055) / 1.055) ** 2.4;
  });
  return channels[0]! * .2126 + channels[1]! * .7152 + channels[2]! * .0722 > .179 ? "#000" : "#fff";
}
function boxFaces(x: number, y: number, z: number): Face[] {
  const a: Vertex = [-x, -y, -z], b: Vertex = [x, -y, -z], c: Vertex = [x, y, -z], d: Vertex = [-x, y, -z];
  const e: Vertex = [-x, -y, z], f: Vertex = [x, -y, z], g: Vertex = [x, y, z], h: Vertex = [-x, y, z];
  return [[b, f, g, c], [a, d, h, e], [a, e, f, b], [d, c, g, h], [e, h, g, f], [a, b, c, d]].map((points, i) => ({ points, color: boxColors[i]! }));
}
function tetraFaces(): Face[] {
  // Ideal equilateral faces of side 150; tiny hand-drawn export deviations are normalized.
  const r = 150 / Math.sqrt(3), height = 150 * Math.sqrt(2 / 3);
  const base: Vertex[] = Array.from({ length: 3 }, (_, i): Vertex => [r * Math.cos(i * 2 * Math.PI / 3), height / 4, r * Math.sin(i * 2 * Math.PI / 3)]);
  const top: Vertex = [0, -height * 3 / 4, 0];
  return [[base[0]!, base[1]!, top], [...base], [base[1]!, base[2]!, top], [base[2]!, base[0]!, top]].map((points, i) => ({ points, color: ["#ff33cc", "#ffff00", "#0000ff", "#00ff33"][i]! }));
}
function hexFaces(): Face[] {
  const ring = (y: number): Vertex[] => Array.from({ length: 6 }, (_, i): Vertex => [50 * Math.cos(i * Math.PI / 3), y, 50 * Math.sin(i * Math.PI / 3)]);
  const top = ring(-75), bottom = ring(75);
  const colors = ["#ffff66", "#6633ff", "#ff66ff", "#ffffff", "#3399ff", "#ff0099", "#00cc00", "#6600cc"];
  const points = [top, bottom, ...top.map((p, i) => [p, top[(i + 1) % 6]!, bottom[(i + 1) % 6]!, bottom[i]!])];
  return points.map((p, i) => ({ points: p, color: colors[i]! }));
}
const solids = {
  "coloring-cube": { faces: boxFaces(75, 75, 75), rotations: boxRotationCount([150, 150, 150]), size: "150 × 150 × 150", asset: "cube-face.svg" },
  "coloring-brick": { faces: boxFaces(75, 125, 75), rotations: boxRotationCount([150, 250, 150]), size: "150 × 250 × 150", asset: "brick-face.svg" },
  "coloring-right-prism": { faces: boxFaces(50, 90, 50), rotations: boxRotationCount([100, 180, 100]), size: "100 × 180 × 100", asset: "right-prism-face.svg" },
  "coloring-tetrahedron": { faces: tetraFaces(), rotations: 12, size: "150", asset: "tetrahedron-face.svg" },
  "coloring-hexagonal-prism": { faces: hexFaces(), rotations: 12, size: "50 × 150", asset: "hexagonal-face.svg" },
};
export function isSolidActivity(id: string): id is keyof typeof solids { return Object.hasOwn(solids, id); }

export default function SolidActivity({ activityId, locale }: ActivityProps) {
  const solid = solids[isSolidActivity(activityId) ? activityId : "coloring-cube"];
  const ru = locale === "ru";
  const t = (en: string, russian: string) => ru ? russian : en;
  const [yaw, setYaw] = useState(32);
  const [pitch, setPitch] = useState(-20);
  const [assignment, setAssignment] = useState(solid.faces.map((_, i) => i));
  const [answer, setAnswer] = useState("");
  const [checked, setChecked] = useState(false);
  const [solved, setSolved] = useState(false);
  const [hint, setHint] = useState(false);
  const drag = useRef<{ id: number; x: number; y: number } | null>(null);
  const endDrag = (event: PointerEvent<SVGSVGElement>) => {
    if (drag.current?.id !== event.pointerId) return;
    drag.current = null;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
  };
  const target = distinctFaceColorings(solid.faces.length, solid.rotations);
  const canExplain = activityId !== "coloring-cube" || solved;
  const rotate = ([x, y, z]: Vertex): Vertex => {
    const a = yaw * Math.PI / 180, b = pitch * Math.PI / 180;
    const xx = x * Math.cos(a) + z * Math.sin(a), zz = -x * Math.sin(a) + z * Math.cos(a);
    return [xx, y * Math.cos(b) - zz * Math.sin(b), y * Math.sin(b) + zz * Math.cos(b)];
  };
  // A fixed bounding sphere keeps every orientation inside the same frame.
  const radius = Math.max(...solid.faces.flatMap(face => face.points.map(([x, y, z]) => Math.hypot(x, y, z))));
  const scale = 170 / radius;
  const rendered = solid.faces.map((face, i) => {
    const vertices = face.points.map(rotate);
    const center = vertices.reduce((sum, p) => [sum[0] + p[0], sum[1] + p[1], sum[2] + p[2]] as [number, number, number], [0, 0, 0] as [number, number, number]).map(v => v / vertices.length);
    return { i, vertices, center };
  }).sort((a, b) => a.center[2]! - b.center[2]!);
  const reasoning = activityId === "coloring-cube" ?
    t("Choose any of 6 faces as the bottom, then any of 4 quarter-turn positions: 24 rotations.", "Выберите любую из 6 нижних граней и одно из 4 положений вокруг неё: 24 вращения.") :
    activityId === "coloring-tetrahedron" ?
      t("Choose any of 4 faces as the bottom, then any of 3 positions around that face: 12 rotations. The two resulting colorings are mirror partners, not rotational matches.", "Выберите любую из 4 нижних граней и одно из 3 положений вокруг неё: 12 вращений. Две полученные раскраски зеркальны, но вращением не совмещаются.") :
      activityId === "coloring-hexagonal-prism" ?
        t("Choose which of the 2 hexagonal bases faces down, then any of 6 turns around its axis: 12 rotations. A rectangular side cannot replace a hexagonal base.", "Выберите одно из 2 шестиугольных оснований снизу и одно из 6 положений вокруг оси: 12 вращений. Прямоугольная боковая грань не может заменить шестиугольное основание.") :
        t("Two short dimensions are equal, giving a square base. Choose either square base as bottom and one of 4 quarter-turn positions: 8 rotations.", "Два коротких размера равны, поэтому основание квадратное. Выберите одно из 2 квадратных оснований снизу и одно из 4 положений вокруг оси: 8 вращений.");
  return <div className="activity-layout coloring-family coloring-solid">
    <SourceSoundtrack activityId={activityId} locale={locale} />
    <p>{t(`Give all ${solid.faces.length} faces different colors. Count colorings up to rotations; reflections do not count as rotations.`, `Раскрасьте все ${solid.faces.length} граней разными цветами. Посчитайте раскраски с точностью до вращения; отражения вращениями не считаются.`)}</p>
    <div className="solid-workbench">
    <div className="solid-view">
    <svg className="diagram" viewBox="0 0 400 400" role="img" aria-label={t("Rotatable colored solid with numbered faces", "Вращаемое цветное тело с номерами граней")}
      aria-describedby="solid-rotation-help"
      onPointerDown={event => {
        if (!event.isPrimary || event.button !== 0 || drag.current) return;
        event.currentTarget.setPointerCapture(event.pointerId);
        drag.current = { id: event.pointerId, x: event.clientX, y: event.clientY };
      }}
      onPointerMove={event => {
        const previous = drag.current;
        if (!previous || previous.id !== event.pointerId) return;
        const dx = Math.max(-40, Math.min(40, event.clientX - previous.x));
        const dy = Math.max(-40, Math.min(40, event.clientY - previous.y));
        previous.x = event.clientX;
        previous.y = event.clientY;
        setYaw(old => Math.round(((old + dx * .6) % 360 + 360) % 360));
        setPitch(old => Math.max(-180, Math.min(180, Math.round(old - dy * .6))));
      }}
      onPointerUp={endDrag} onPointerCancel={endDrag}
      onLostPointerCapture={() => { drag.current = null; }}>
      {rendered.map(({ i, vertices, center }) => <g key={i}>
        <polygon points={vertices.map(p => `${200 + p[0] * scale},${200 + p[1] * scale}`).join(" ")} fill={solid.faces[assignment[i]!]!.color} stroke="#152333" strokeWidth="2" />
        <text style={{ fill: colorText(solid.faces[assignment[i]!]!.color) }} x={200 + center[0]! * scale} y={206 + center[1]! * scale} textAnchor="middle">{i + 1}</text>
      </g>)}
    </svg>
    <p id="solid-rotation-help" className="solid-rotation-help">{t("Click and drag to turn the solid, or use the sliders.", "Нажмите и перетащите фигуру для поворота или используйте ползунки.")}</p>
    <div className="controls solid-rotation">
      <label className="control">{t("Turn", "Поворот")}: {yaw}°<input type="range" min="0" max="360" value={yaw} onChange={e => setYaw(Number(e.target.value))} /></label>
      <label className="control">{t("Tilt", "Наклон")}: {pitch}°<input type="range" min="-180" max="180" value={pitch} onChange={e => setPitch(Number(e.target.value))} /></label>
    </div>
    </div>
    <div className="solid-colors">
    <p>{t("Choose a color number for any face; the two colors swap so every face stays different. Turning the view never changes the coloring.", "Выберите номер цвета грани: два цвета поменяются местами, сохраняя разные цвета всех граней. Поворот вида не меняет раскраску.")}</p>
    <div className="controls solid-face-controls">{assignment.map((color, i) => <label className="control" key={i}><span className="solid-face-label" style={{ background: solid.faces[color]!.color, color: colorText(solid.faces[color]!.color) }}>{t("Face", "Грань")} {i + 1}</span><span className="solid-color-choice"><span className="solid-swatch" aria-hidden="true" style={{ background: solid.faces[color]!.color }} /><select style={{ background: solid.faces[color]!.color, color: colorText(solid.faces[color]!.color) }} value={color} onChange={e => {
      const next = Number(e.target.value);
      setAssignment(old => old.map((c, j) => j === i ? next : c === next ? old[i]! : c));
    }}>{solid.faces.map((face, j) => <option style={{ background: face.color, color: colorText(face.color) }} key={j} value={j}>{t("Color", "Цвет")} {j + 1}</option>)}</select></span></label>)}</div>
    </div>
    </div>
    <div className="solid-actions">
    <form className="controls solid-answer" onSubmit={e => {
      e.preventDefault();
      setChecked(true);
      if (Number(answer) === target) setSolved(true);
    }}>
      <label className="control">{t("Number of different colorings", "Число различных раскрасок")}<input type="number" min="1" step="1" required value={answer} onChange={e => { setAnswer(e.target.value); setChecked(false); }} /></label>
      <button className="button" type="submit">{t("Check", "Проверить")}</button>
    </form>
    {canExplain && <button className="button button-secondary" aria-expanded={hint} onClick={() => setHint(!hint)}>{t("Show / hide reasoning", "Показать / скрыть рассуждение")}</button>}
    <button className="button button-secondary" onClick={() => { setYaw(32); setPitch(-20); setAssignment(solid.faces.map((_, i) => i)); setAnswer(""); setChecked(false); setSolved(false); setHint(false); }}>{t("Reset", "Сбросить")}</button>
    </div>
    {checked && <p className="activity-status" role="status">{Number(answer) === target ? t(`Correct: ${target} colorings!`, `Верно: ${target} раскрасок!`) : activityId === "coloring-cube"
      ? t("Not quite. Turn the cube and compare the colorings, then try again.", "Пока неверно. Поворачивайте куб, сравнивайте раскраски и попробуйте ещё раз.")
      : t("Not yet. Count fixed-face assignments, then divide by the solid’s rotational symmetries.", "Пока неверно. Посчитайте раскраски неподвижных граней, затем разделите на число вращательных симметрий.")}</p>}
    {canExplain && hint && <div className="explanation"><p>{reasoning}</p><p>{solid.faces.length}! ÷ {solid.rotations} = {target}.</p><p>{t("All colors differ, so no non-identity rotation fixes a coloring. Every orbit has the full number of rotations.", "Все цвета различны, поэтому нет нетождественного вращения, сохраняющего раскраску. Каждая орбита содержит полное число вращений.")}</p></div>}
    <details><summary>{t("Original face drawing and dimensions", "Исходный рисунок грани и размеры")}</summary><figure>
      <img style={{ maxWidth: "100%", maxHeight: "12rem", background: "#fff" }} src={mediaUrl(`coloring/${solid.asset}`)} alt={t("Preserved face vector from the original Flash solid", "Сохранённый вектор грани исходной Flash-фигуры")} />
      <figcaption>{t("Dimensions", "Размеры")}: {solid.size}.</figcaption>
    </figure></details>
  </div>;
}
