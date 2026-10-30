import { useEffect, useRef, useState } from "react";
import { useAnimation } from "../../shared/useAnimation";
import type { Locale } from "../../shared/contracts";

/** The two (a+b)-squares and four right triangles shown in original root
 * frame 1000. Moving copies are rigidly rotated/translated, never morphed. */
export default function PythagorasProof({ a, b, locale, reducedMotion }: { a: number; b: number; locale: Locale; reducedMotion: boolean }) {
  const tr = (en: string, ru: string) => locale === "ru" ? ru : en;
  const [progress, setProgress] = useState(0);
  const [playing, setPlaying] = useState(false);
  useEffect(() => { if (reducedMotion) setPlaying(false); }, [reducedMotion]);
  const position = useRef(0);
  const throttle = useRef(0);
  useAnimation(delta => {
    position.current = Math.min(1, position.current + delta / 3);
    throttle.current += delta;
    if (throttle.current >= 1 / 30 || position.current === 1) {
      throttle.current = 0; setProgress(position.current);
    }
    if (position.current === 1) setPlaying(false);
  }, playing);
  const size = 220, aa = size * a / (a + b), bb = size - aa;
  const leftX = 35, rightX = 345, top = 65;
  const triangles = [
    { origin: [size, 0], target: [size, 0], angle: 0, points: [[-bb, 0], [0, 0], [0, aa]] },
    { origin: [aa, aa], target: [0, 0], angle: 90, points: [[0, -aa], [0, 0], [bb, 0]] },
    { origin: [0, aa], target: [size, size], angle: 180, points: [[0, 0], [aa, 0], [0, bb]] },
    { origin: [aa, size], target: [0, size], angle: 90, points: [[0, -bb], [0, 0], [-aa, 0]] },
  ];
  return <section className="explanation">
    <h3>{tr("The original four-triangle rearrangement", "Оригинальное доказательство перестановкой четырёх треугольников")}</h3>
    <p>{tr("Both outer squares have side a + b. Move the same four right triangles between the two arrangements. No triangle changes shape or area.", "Сторона обоих больших квадратов равна a + b. Переместите четыре одинаковых прямоугольных треугольника. Их форма и площадь не меняются.")}</p>
    <svg className="tri-proof-diagram" viewBox="0 0 610 490" role="img" aria-label={tr("Rearrangement proof: two small squares have the area of the hypotenuse square", "Перестановка треугольников: сумма площадей двух квадратов равна площади квадрата гипотенузы")}>
      <g transform={`translate(${leftX} ${top})`}>
        <rect width={size} height={size} className="tri-side" />
        <rect width={aa} height={aa} fill="#00ff99" stroke="#0099ff" />
        <rect x={aa} y={aa} width={bb} height={bb} fill="#00ff99" stroke="#0099ff" />
        <text x={aa / 2} y={aa / 2} textAnchor="middle">a²</text><text x={aa + bb / 2} y={aa + bb / 2} textAnchor="middle">b²</text>
        <text x={aa / 2} y="-12" textAnchor="middle">a</text><text x={aa + bb / 2} y="-12" textAnchor="middle">b</text>
      </g>
      <g transform={`translate(${rightX} ${top})`}>
        <rect width={size} height={size} className="tri-side" />
        <polygon points={`${aa},0 ${size},${aa} ${bb},${size} 0,${bb}`} fill="#00ff99" stroke="#0099ff" />
        <text x={size / 2} y={size / 2} textAnchor="middle">c²</text>
        <text x={aa / 2} y="-12" textAnchor="middle">a</text><text x={aa + bb / 2} y="-12" textAnchor="middle">b</text>
      </g>
      {triangles.map((triangle, i) => {
        const x = leftX + triangle.origin[0]! + progress * (rightX + triangle.target[0]! - leftX - triangle.origin[0]!);
        const y = top + triangle.origin[1]! + progress * (triangle.target[1]! - triangle.origin[1]!);
        return <g key={i} transform={`translate(${x} ${y}) rotate(${progress * triangle.angle})`}>
          <polygon points={triangle.points.map(p => p.join(",")).join(" ")} fill="#000099" stroke="#0099ff" strokeWidth="1.5" />
          <text x={triangle.points.reduce((sum, p) => sum + p[0]!, 0) / 3} y={triangle.points.reduce((sum, p) => sum + p[1]!, 0) / 3} textAnchor="middle" style={{ fill: "#ffffff" }}>{i + 1}</text>
        </g>;
      })}
      <text x="300" y="175" textAnchor="middle">→</text>
      <text x="305" y="475" textAnchor="middle">a² + b² = c²</text>
    </svg>
    <div className="tri-controls controls">
      <label>{tr("Move four triangles (%)", "Переместить четыре треугольника (%)")}: {Math.round(progress * 100)}
        <input type="range" min="0" max="100" value={Math.round(progress * 100)} onChange={e => { setPlaying(false); position.current = Number(e.target.value) / 100; setProgress(position.current); }} /></label>
      <button className="button" onClick={() => {
        if (playing) { setPlaying(false); return; }
        if (progress === 1) { position.current = 0; setProgress(0); } else position.current = progress;
        setPlaying(true);
      }}>{playing ? tr("Pause", "Пауза") : tr("Rearrange", "Переставить")}</button>
      <button className="button-secondary" onClick={() => { setPlaying(false); position.current = 0; setProgress(0); }}>{tr("Reset proof", "Сбросить доказательство")}</button>
    </div>
    <p className="activity-status">{tr("Equal outer areas minus the same four triangle areas leave equal green areas:", "Из равных площадей больших квадратов вычитаем площади четырёх одинаковых треугольников:")}</p>
    <p className="tri-formula">(a + b)² − 4 × ab/2 = a² + b² = c² = {(a * a + b * b).toFixed(2)}</p>
  </section>;
}
