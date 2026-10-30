import { useEffect, useMemo, useState } from "react";
import type { ActivityProps } from "../../shared/contracts";
import { t } from "../../shared/contracts";
import { useAnimation } from "../../shared/useAnimation";
import { roulettePoint } from "./rules";

/** Native port of Circincirc's signed-radius equations and controls. */
export default function Circles({ locale, reducedMotion, embedded = false }: ActivityProps) {
  const l = (en: string, ru: string) => t(locale, en, ru);
  const [ratio, setRatio] = useState(20);
  const [orbits, setOrbits] = useState(1);
  const [degrees, setDegrees] = useState(0);
  const [playing, setPlaying] = useState(false);
  useEffect(() => { if (reducedMotion) setPlaying(false); }, [reducedMotion]);
  const effectiveRatio = ratio === 0 ? 50 : ratio;
  const total = Math.round(orbits * 360);
  const point = roulettePoint(degrees / 360, effectiveRatio);
  const points = useMemo(() => Array.from({ length: total + 1 }, (_, i) => {
    const p = roulettePoint(i / 360, effectiveRatio);
    return `${p.x.toFixed(3)},${p.y.toFixed(3)}`;
  }), [total, effectiveRatio]);
  const extent = Math.max(220, point.R + 2 * Math.max(0, -point.r) + 20);
  useAnimation(delta => {
    setDegrees(d => Math.min(total, d + delta * 90));
  }, playing && degrees < total);
  const stopAndReset = () => { setPlaying(false); setDegrees(0); };
  const trace = points.slice(0, Math.floor(degrees) + 1).join(" ");
  return <div className="activity-layout motion-activity motion-circles-activity">
    {!embedded && <p>{l("Draw different cycloids! Choose the signed radius ratio and number of trips around the fixed circle. The red point sits on the rolling circle's rim. Negative ratios roll outside; positive ratios roll inside.",
      "Рисуем разные циклоиды! Выберите отношение радиусов со знаком и число обходов неподвижной окружности. Красная точка находится на ободе катящейся окружности. Отрицательные значения — снаружи, положительные — внутри.")}</p>}
    <div className="controls">
      <label className="control">{l("Radius ratio", "Отношение радиусов")}: {ratio}%
        <input type="range" min="-300" max="100" step="1" value={ratio} onChange={e => { setRatio(Number(e.target.value)); stopAndReset(); }} />
      </label>
      <label className="control">{l("Number of orbits", "Число обходов")}
        <input type="number" min="1" max="20" step="1" value={orbits} onChange={e => {
          const n = e.target.valueAsNumber;
          if (Number.isFinite(n)) { setOrbits(Math.max(1, Math.min(20, Math.round(n)))); stopAndReset(); }
        }} />
      </label>
      <button className="button" onClick={() => {
        if (degrees >= total) setDegrees(0);
        setPlaying(!(playing && degrees < total));
      }}>{playing && degrees < total ? l("Pause", "Пауза") : l("Start", "Старт")}</button>
      <button className="button button-secondary" onClick={stopAndReset}>{l("Clear and reset", "Очистить и начать заново")}</button>
      <button className="button button-secondary" onClick={() => { setPlaying(false); setDegrees(total); }}>{l("Draw complete trace", "Показать всю траекторию")}</button>
    </div>
    <p className="activity-note">{l("A 0% setting uses a 50% rolling radius.", "При 0% используется радиус 50%.")}</p>
    {reducedMotion && <p className="activity-note">{l("Playback starts paused. Use Start, the position slider, or draw the complete trace.", "Воспроизведение начинается с паузы. Нажмите «Старт», используйте ползунок положения или покажите всю траекторию.")}</p>}
    <svg className="diagram motion-diagram" width="520" height="460" viewBox={`${-extent} ${-extent} ${extent * 2} ${extent * 2}`}
      role="img" aria-label={l("Fixed circle, rolling circle, red tracing point and its blue trajectory", "Неподвижная и катящаяся окружности, красная точка и её синяя траектория")}>
      <polyline points={trace} fill="none" stroke="#00f" strokeWidth="1" vectorEffect="non-scaling-stroke" />
      <circle r={point.R} fill="none" stroke="#000" strokeWidth="1" vectorEffect="non-scaling-stroke" />
      <circle cx={point.centerX} cy={point.centerY} r={Math.abs(point.r)} fill="none" stroke="#000" strokeWidth="1" vectorEffect="non-scaling-stroke" />
      <line x1={point.centerX} y1={point.centerY} x2={point.x} y2={point.y} stroke="#000" strokeWidth="1" vectorEffect="non-scaling-stroke" />
      <circle cx={point.x} cy={point.y} r={extent / 110} fill="#f00" stroke="#000" strokeWidth=".2" vectorEffect="non-scaling-stroke" />
    </svg>
    <label className="control">{l("Position along orbit", "Положение на орбите")}: {(degrees / 360).toFixed(2)}
      <input type="range" min="0" max={total} step="1" value={degrees} onChange={e => { setPlaying(false); setDegrees(Number(e.target.value)); }} />
    </label>
    <p className="activity-status">{l("Completed center orbits", "Полных обходов центра")}: {Math.floor((degrees + 1e-8) / 360)} / {orbits} · {effectiveRatio < 0 ? l("Outside — epicycloid", "Снаружи — эпициклоида") : l("Inside — hypocycloid", "Внутри — гипоциклоида")}</p>
    {!embedded && <p className="explanation">{l("Try 50%: the point travels along a diameter. At 100%, it stays in one place. At 25%, it draws a four-cusped curve. Negative ratios draw exterior curves. A fractional ratio may need several center orbits before its trace closes.",
      "Попробуйте 50%: точка движется по диаметру. При 100% она неподвижна. При 25% получается кривая с четырьмя вершинами. Отрицательные значения рисуют внешние кривые. Для замыкания траектории иногда нужно несколько обходов центра.")}</p>}
  </div>;
}
