import { useId, useLayoutEffect, useRef } from "react";
import { mediaUrl } from "../../shared/contracts";
import { useAnimation } from "../../shared/useAnimation";
import { projectOctahedron } from "./OctahedronProjection";

// Shape and glyph sequence from the recovered Octa-8 face symbols.
const artwork = [3, 7, 11, 15, 18, 22, 24, 26];
const glyphs = ["−1", "e", "π", "i", "π", "i", "e", "−1"];
const colors = ["#0033ff", "#ff0099", "#66ff33", "#6633ff", "#ff33ff", "#33cccc", "#9933cc", "#ffff66"];

interface OctahedronProps {
  playing: boolean;
  turn: number;
  tilt: number;
  label: string;
  onViewAngles?: (turn: number, tilt: number) => void;
}

export function Octahedron({ playing, turn, tilt, label, onViewAngles }: OctahedronProps) {
  const root = useRef<SVGGElement>(null);
  const groups = useRef<(SVGGElement | null)[]>([]);
  const phase = useRef(0);
  const clipId = useId();
  const initialFaces = projectOctahedron(turn, tilt);
  const draw = () => {
    onViewAngles?.(turn-phase.current,tilt-phase.current);
    for (const face of projectOctahedron(turn - phase.current, tilt - phase.current)) {
      const group = groups.current[face.id];
      if (!group) continue;
      group.setAttribute("transform", `matrix(${face.matrix.join(" ")})`);
      // A convex solid has no interpenetrating faces; far-to-near painting
      // completely covers its rear faces, including their text.
      root.current?.appendChild(group);
    }
  };
  useLayoutEffect(() => { phase.current = 0; draw(); }, [turn, tilt]);
  useAnimation(delta => {
    // Octa-8's original loop decrements both X and Y rotation each frame.
    phase.current = (phase.current + delta * 24) % 360;
    draw();
  }, playing);
  return <svg className="spatial-octahedron" viewBox="0 0 400 360" role="img" aria-label={label}>
    <defs><clipPath id={clipId} clipPathUnits="userSpaceOnUse"><path d="M .5 0 L 0 1 L 1 1 Z"/></clipPath></defs>
    <g ref={root}>
      {initialFaces.map(face => <g key={face.id} ref={node => { groups.current[face.id] = node; }} transform={`matrix(${face.matrix.join(" ")})`}>
        <path d="M .5 0 L 0 1 L 1 1 Z" fill={colors[face.id]} stroke="#172634" strokeWidth=".008" strokeLinejoin="round"/>
        <g clipPath={`url(#${clipId})`}>
          <image href={mediaUrl(`spatial/octahedron/${artwork[face.id]}.svg`)} width="1" height="1" preserveAspectRatio="none"/>
          <text x=".5" y=".68" textAnchor="middle" fill="#fff" fontFamily="'Times New Roman', serif" fontStyle={glyphs[face.id] === "−1" ? "normal" : "italic"} fontSize=".3">{glyphs[face.id]}</text>
        </g>
      </g>)}
    </g>
  </svg>;
}
