import { useCallback, useEffect, useId, useRef, useState } from "react";
import type { PointerEvent } from "react";
import type { Locale } from "../../shared/contracts";
import { construction, falseProofConstruction } from "./geometry";
import type { Point, Triangle } from "./geometry";
import { capturedVertexPosition, moveStageVertex, stageLine } from "./StageGeometry";
import type { StageBounds } from "./StageGeometry";

interface SourceVertex extends Point {
  label: string;
  color: string;
  labelOffset?: { x: number; y: number; size: number };
  sourceFootprint: { x: number; y: number; width: number; height: number };
}
const viewport: StageBounds = { left: 0, top: 0, right: 550, bottom: 400 };

/** Native equivalent of the source's root graphics + mc/mc2/mc3 dragging. */
export default function SourceDragStage({ vertices, mode, locale }: {
  vertices: readonly SourceVertex[]; mode: "medians" | "altitudes" | "bisectors" | "false-proof"; locale: Locale;
}) {
  const initial = vertices.map(({ x, y }) => ({ x, y })) as Triangle;
  const [points, setPoints] = useState<Triangle>(initial);
  const [rejected, setRejected] = useState(false);
  const svg = useRef<SVGSVGElement>(null);
  const captured = useRef<{
    index: number; pointerId: number; element: SVGGElement;
    inverse: DOMMatrix; vertex: Point; pointer: Point;
  } | null>(null);
  const cancel = useCallback(() => {
    const owner = captured.current;
    captured.current = null;
    if (!owner) return;
    try {
      if (owner.element.hasPointerCapture(owner.pointerId)) owner.element.releasePointerCapture(owner.pointerId);
    } catch { /* Capture can already be gone during removal or native cancel. */ }
  }, []);
  useEffect(() => {
    const visibility = () => { if (document.hidden) cancel(); };
    const escape = (event: KeyboardEvent) => {
      if (event.key === "Escape" && captured.current) { event.preventDefault(); cancel(); }
    };
    window.addEventListener("blur", cancel);
    window.addEventListener("keydown", escape);
    document.addEventListener("visibilitychange", visibility);
    return () => {
      window.removeEventListener("blur", cancel);
      window.removeEventListener("keydown", escape);
      document.removeEventListener("visibilitychange", visibility);
      cancel();
    };
  }, [cancel]);
  const clip = useId();
  // The source has no explicit startDrag rectangle. Use its authored initial
  // vertex envelope as a reachable playground, not a moving orthocenter extent.
  const playground: StageBounds = {
    left: Math.min(...initial.map(p => p.x)), right: Math.max(...initial.map(p => p.x)),
    top: Math.min(...initial.map(p => p.y)), bottom: Math.max(...initial.map(p => p.y)),
  };
  const data = mode === "false-proof" ? null : construction(points, mode);
  // In Alltriangles the source's angle-bisector vertex is mc3 (C), not A.
  const proof = mode === "false-proof" ? falseProofConstruction([points[2], points[0], points[1]]) : null;
  const centerVisible = !!data?.center && data.center.x >= 0 && data.center.x <= 550 && data.center.y >= 0 && data.center.y <= 400;
  const line = (from: Point, to: Point, color: string) => {
    const clipped = stageLine(from, to, viewport);
    return clipped && <line x1={clipped[0].x} y1={clipped[0].y} x2={clipped[1].x} y2={clipped[1].y}
      stroke={color} strokeWidth="1" />;
  };
  const move = (index: number, point: Point) => {
    const next = moveStageVertex(points, index, point, playground);
    setRejected(next === points);
    setPoints(next);
  };
  const release = (event: PointerEvent<SVGSVGElement>) => {
    if (captured.current?.pointerId === event.pointerId) cancel();
  };
  function begin(event: PointerEvent<SVGGElement>, index: number) {
    if (!event.isPrimary || event.button !== 0 || captured.current) return;
    const matrix = svg.current?.getScreenCTM();
    if (!matrix) return;
    const inverse = matrix.inverse();
    const pointer = new DOMPoint(event.clientX, event.clientY).matrixTransform(inverse);
    captured.current = { index, pointerId: event.pointerId, element: event.currentTarget, inverse, pointer, vertex: points[index]! };
    event.currentTarget.setPointerCapture(event.pointerId);
    event.currentTarget.focus();
  }
  return <svg ref={svg} className="tri-source-drag" viewBox="0 0 550 400" role="group"
    aria-label={locale === "ru" ? "Двигайте вершины треугольника мышью или стрелками клавиатуры" : "Move the triangle vertices by dragging or arrow keys"}
    onPointerMove={event => {
      const drag = captured.current;
      if (!drag || event.pointerId !== drag.pointerId) return;
      const pointer = new DOMPoint(event.clientX, event.clientY).matrixTransform(drag.inverse);
      move(drag.index, capturedVertexPosition(drag.vertex, drag.pointer, pointer));
    }}
    onPointerUp={release} onPointerCancel={release} onLostPointerCapture={release}
    onBlur={event => {
      if (!event.currentTarget.contains(event.relatedTarget)) cancel();
    }}>
    <defs><clipPath id={clip}><rect width="550" height="400" /></clipPath></defs>
    <g clipPath={`url(#${clip})`}>
      {vertices.map((vertex, index) => <rect key={index} x={vertex.sourceFootprint.x - 1} y={vertex.sourceFootprint.y - 1}
        width={vertex.sourceFootprint.width + 2} height={vertex.sourceFootprint.height + 2} fill="#66ffff" />)}
      <polygon points={points.map(point => `${point.x},${point.y}`).join(" ")} fill="none" stroke="#0000ff" strokeWidth="3" />
      {data?.feet.map((foot, index) => {
        const line = mode === "altitudes" ? stageLine(points[index]!, foot, viewport) : [points[index]!, foot];
        return line && <line key={index} x1={line[0]!.x} y1={line[0]!.y} x2={line[1]!.x} y2={line[1]!.y} stroke="#ff00cc" strokeWidth={mode === "medians" ? 3 : 1} />;
      })}
      {centerVisible && data?.center && <circle cx={data.center.x} cy={data.center.y} r="3" fill="#ff00cc" />}
      {proof && <>
        {line(points[2], points[0], "#0000ff")}
        {line(points[2], points[1], "#0000ff")}
        {line(points[2], proof.bisectorFoot, "#ff00cc")}
        {line(proof.midpoint, {
          x: proof.midpoint.x - (points[1].y - points[0].y),
          y: proof.midpoint.y + points[1].x - points[0].x,
        }, "#990099")}
        {line(proof.x, proof.footB, "#000000")}
        {line(proof.x, proof.footC, "#000000")}
        {proof.x.x >= 0 && proof.x.x <= 550 && proof.x.y >= 0 && proof.x.y <= 400
          && <circle cx={proof.x.x} cy={proof.x.y} r="3" fill="#000000" />}
      </>}
      {points.map((point, index) => <g key={index} role="button" tabIndex={0}
        aria-label={`${locale === "ru" ? "Переместить вершину" : "Move vertex"} ${vertices[index]!.label}`}
        onPointerDown={event => begin(event, index)}
        onKeyDown={event => {
          const delta = event.shiftKey ? 10 : 2;
          const directions: Record<string, [number, number]> = { ArrowLeft: [-delta, 0], ArrowRight: [delta, 0], ArrowUp: [0, -delta], ArrowDown: [0, delta] };
          const direction = directions[event.key];
          if (direction) { event.preventDefault(); move(index, { x: point.x + direction[0]!, y: point.y + direction[1]! }); }
        }}>
        <circle className="tri-source-hit" cx={point.x} cy={point.y} r="14" fill="transparent" />
        <circle className="tri-source-dot" cx={point.x} cy={point.y} r="8" fill={vertices[index]!.color} stroke="#000099" strokeWidth=".6" />
        <text x={point.x + (vertices[index]!.labelOffset?.x ?? (index === 0 ? -20 : 12))}
          y={point.y + (vertices[index]!.labelOffset?.y ?? (index === 2 ? -9 : 22))}
          style={vertices[index]!.labelOffset ? { fontSize: vertices[index]!.labelOffset!.size } : undefined}>{vertices[index]!.label}</text>
      </g>)}
      {((mode === "altitudes" && !centerVisible) || (mode === "false-proof" && !proof) || rejected) && <text x="12" y="393" className="tri-source-status" role="status">
        {rejected ? (locale === "ru" ? "Точки должны образовывать треугольник." : "Keep three distinct, non-collinear vertices.") :
          mode === "false-proof" ? (locale === "ru" ? "Биссектриса совпадает с серединным перпендикуляром. Двигайте вершину." :
            "The angle bisector and perpendicular bisector coincide. Move a vertex.") :
            locale === "ru" ? "Ортоцентр за пределами рисунка." : "The orthocenter is outside the diagram."}
      </text>}
    </g>
  </svg>;
}
