import { useRef, useState, type PointerEvent } from "react";
import { t, type Locale } from "../../shared/contracts";

// Four equidistant vertices; face i is opposite vertex i.
const vertices = [[1, 1, 1], [1, -1, -1], [-1, 1, -1], [-1, -1, 1]] as const;
const faces = [[1, 2, 3], [0, 3, 2], [0, 1, 3], [0, 2, 1]] as const;
const wrap = (angle: number) => (angle % 360 + 360) % 360;

/** Direct, event-driven rotation supplements the source's mouse-driven spinning. */
export default function TetrahedronView({ locale, digits, selectedFace }: { locale: Locale; digits: number[]; selectedFace: number }) {
  const [yaw, setYaw] = useState(25);
  const [pitch, setPitch] = useState(15);
  const drag = useRef<{ pointer: number; x: number; y: number; yaw: number; pitch: number } | null>(null);
  const a = yaw * Math.PI / 180, b = pitch * Math.PI / 180;
  const projected = vertices.map(([x, y, z]) => {
    const rx = x * Math.cos(a) + z * Math.sin(a);
    const rz = z * Math.cos(a) - x * Math.sin(a);
    return { x: 120 + rx * 55, y: 110 + (y * Math.cos(b) - rz * Math.sin(b)) * 55, z: y * Math.sin(b) + rz * Math.cos(b) };
  });
  const ordered = faces.map((indices, index) => {
    const points = indices.map(i => projected[i]!);
    return {
      index, points,
      x: points.reduce((sum, p) => sum + p.x, 0) / 3,
      y: points.reduce((sum, p) => sum + p.y, 0) / 3,
      depth: points.reduce((sum, p) => sum + p.z, 0) / 3,
    };
  }).sort((left, right) => left.depth - right.depth);
  const release = (event: PointerEvent<SVGSVGElement>) => {
    if (drag.current?.pointer === event.pointerId) drag.current = null;
  };
  return <>
    <svg className="diagram solids-rotate" viewBox="0 0 240 220" role="img"
      aria-label={t(locale, "Drag to rotate the labelled tetrahedron. Rotation sliders are available below.", "Перетаскивайте тетраэдр, чтобы повернуть его. Ниже также доступны ползунки поворота.")}
      onPointerDown={event => {
        if (event.button !== 0) return;
        event.currentTarget.setPointerCapture(event.pointerId);
        drag.current = { pointer: event.pointerId, x: event.clientX, y: event.clientY, yaw, pitch };
      }}
      onPointerMove={event => {
        const start = drag.current;
        if (!start || start.pointer !== event.pointerId) return;
        setYaw(wrap(start.yaw + (event.clientX - start.x) * .7));
        setPitch(wrap(start.pitch - (event.clientY - start.y) * .7));
      }}
      onPointerUp={release} onPointerCancel={release} onLostPointerCapture={release}>
      {ordered.map(face => <g key={face.index}>
        <polygon points={face.points.map(p => `${p.x},${p.y}`).join(" ")} fill={face.index === selectedFace ? "#ffff99" : "#ffffff"} stroke="#000000" strokeWidth="2" />
        <text x={face.x} y={face.y} textAnchor="middle" dominantBaseline="middle" fontSize="22" fill="#000000">{digits[face.index]}</text>
      </g>)}
    </svg>
    <p className="activity-note">{t(locale, "Drag to turn the solid and inspect its faces.", "Перетаскивайте фигуру, чтобы повернуть её и рассмотреть грани.")}</p>
    <div className="controls">
      <label className="control">{t(locale, "Horizontal rotation", "Поворот по горизонтали")}<input type="range" min="0" max="360" value={yaw} onChange={event => setYaw(Number(event.target.value))} /></label>
      <label className="control">{t(locale, "Vertical rotation", "Поворот по вертикали")}<input type="range" min="0" max="360" value={pitch} onChange={event => setPitch(Number(event.target.value))} /></label>
    </div>
  </>;
}
