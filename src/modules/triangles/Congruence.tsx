import { useEffect, useRef, useState } from "react";
import type { ActivityProps } from "../../shared/contracts";
import { useAnimation } from "../../shared/useAnimation";
import { distance, mix, triangleData } from "./geometry";
import type { Point, Triangle } from "./geometry";
import OriginalDrawings from "./OriginalDrawings";
import OriginalCompanion from "../../shared/OriginalCompanion";

export default function Congruence({ locale, reducedMotion }: ActivityProps) {
  const tr = (en: string, ru: string) => locale === "ru" ? ru : en;
  const [method, setMethod] = useState<"SSS" | "SAS" | "ASA">("SAS");
  const [sideAB, setSideAB] = useState(4);
  const [sideAC, setSideAC] = useState(3);
  const [included, setIncluded] = useState(60);
  const [overlay, setOverlay] = useState(0);
  const [mirror, setMirror] = useState(false);
  const [playing, setPlaying] = useState(false);
  useEffect(() => { if (reducedMotion) setPlaying(false); }, [reducedMotion]);
  const [quiz, setQuiz] = useState<"square" | "circle" | "done">("square");
  const [accepted, setAccepted] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [companionPlaying, setCompanionPlaying] = useState(true);
  const progress = useRef(0);
  const throttle = useRef(0);
  useAnimation(delta => {
    progress.current = Math.min(1, progress.current + delta / 2);
    throttle.current += delta;
    if (throttle.current >= 1 / 30 || progress.current === 1) {
      throttle.current = 0; setOverlay(progress.current);
    }
    if (progress.current === 1) setPlaying(false);
  }, playing);
  const points: Triangle = [{ x: 110, y: 310 }, { x: 110 + sideAB * 40, y: 310 }, { x: 110 + sideAC * 40 * Math.cos(included * Math.PI / 180), y: 310 - sideAC * 40 * Math.sin(included * Math.PI / 180) }];
  const data = triangleData(points);
  const [a, b, c] = points;
  function twin(p: Point): Point {
    const x = (p.x - a.x) * (mirror ? -1 : 1), y = p.y - a.y;
    const angle = (1 - overlay) * -.4;
    return { x: a.x + (1 - overlay) * 340 + x * Math.cos(angle) - y * Math.sin(angle),
      y: a.y - (1 - overlay) * 20 + x * Math.sin(angle) + y * Math.cos(angle) };
  }
  function markSide(p: Point, q: Point, count: number) {
    const mid = mix(p, q, .5), dx = q.x - p.x, dy = q.y - p.y, length = distance(p, q);
    return Array.from({ length: count }, (_, i) => {
      const shift = (i - (count - 1) / 2) * 8;
      return <line key={i} x1={mid.x + dx / length * shift - dy / length * 6} y1={mid.y + dy / length * shift + dx / length * 6}
        x2={mid.x + dx / length * shift + dy / length * 6} y2={mid.y + dy / length * shift - dx / length * 6} className="tri-construction" />;
    });
  }
  const explanation = method === "SSS" ?
    tr("SSS: AB = A₁B₁, AC = A₁C₁, BC = B₁C₁. Three corresponding sides determine the same shape and size, provided they satisfy the triangle inequalities.", "Три стороны: AB = A₁B₁, AC = A₁C₁, BC = B₁C₁. Соответствующие стороны определяют одинаковую форму и размер при выполнении неравенства треугольника.") :
    method === "SAS" ? tr("SAS: AB = A₁B₁, AC = A₁C₁, and ∠BAC = ∠B₁A₁C₁. The equal angle must lie between the two given sides.", "Две стороны и угол между ними: AB = A₁B₁, AC = A₁C₁ и ∠BAC = ∠B₁A₁C₁. Равный угол должен лежать между данными сторонами.") :
      tr("ASA: AC = A₁C₁, ∠BAC = ∠B₁A₁C₁, ∠ACB = ∠A₁C₁B₁. The equal side lies between the two given angles.", "Сторона и прилежащие углы: AC = A₁C₁, ∠BAC = ∠B₁A₁C₁, ∠ACB = ∠A₁C₁B₁. Равная сторона лежит между данными углами.");
  const drawTriangle = (vertices: Triangle, suffix: string) => <g>
    <polygon points={vertices.map(p => `${p.x},${p.y}`).join(" ")} className="tri-side" />
    {vertices.map((p, i) => <text key={i} x={p.x + 8} y={p.y + (i === 2 ? -12 : 22)}>{["A", "B", "C"][i]}{suffix}</text>)}
    {markSide(vertices[0], vertices[2], 2)}
    {method !== "ASA" && markSide(vertices[0], vertices[1], 1)}
    {method === "SSS" && markSide(vertices[1], vertices[2], 3)}
    {method !== "SSS" && <text x={vertices[0].x + (mirror && suffix ? -22 : 24)} y={vertices[0].y - 12}>α</text>}
    {method === "ASA" && <text x={vertices[2].x + 8} y={vertices[2].y + 30}>γ</text>}
  </g>;
  const slider = (label: string, value: number, min: number, max: number, change: (n: number) => void, step = 1) =>
    <label>{label}: {value}<input type="range" min={min} max={max} step={step} value={value} onChange={e => { setPlaying(false); change(Number(e.target.value)); }} /></label>;
  return <section className="activity-layout triangles-lab">
    <aside className="tri-companion">
      <OriginalCompanion playing={companionPlaying} reducedMotion={reducedMotion} label={tr("Original Pythagoras companion", "Оригинальный спутник Пифагор")} />
      <button className="button-secondary" onClick={() => setCompanionPlaying(!companionPlaying)}>{companionPlaying ? tr("Pause companion", "Остановить спутника") : tr("Animate companion", "Оживить спутника")}</button>
    </aside>
    <p>{tr("Congruent figures have the same shape and size, even after translation, rotation, or reflection. Choose the original lesson's three triangle criteria, then superpose the copies.", "Конгруэнтные фигуры имеют одинаковую форму и размер после переноса, поворота или отражения. Выберите один из трёх признаков и совместите копии.")}</p>
    {quiz !== "done" ? <section className="explanation">
      <h3>{tr("When are these figures congruent?", "Когда эти фигуры равны?")}</h3>
      <p>{quiz === "square" ? tr("Two squares are congruent when… Choose the most complete answer.", "Два квадрата конгруэнтны, когда… Выберите наиболее полный ответ.") : tr("Two circles are congruent when… Choose the most complete answer.", "Два круга конгруэнтны, когда… Выберите наиболее полный ответ.")}</p>
      <div className="choice-grid">{(quiz === "square" ?
        [tr("Their sides are equal", "Их стороны равны"), tr("Their diagonals are equal", "Их диагонали равны"), tr("Their areas are equal", "Их площади равны"), tr("Any of these three", "Любой из этих трёх ответов")] :
        [tr("Their radii are equal", "Их радиусы равны"), tr("Their circumferences are equal", "Их длины окружностей равны"), tr("Their areas are equal", "Их площади равны"), tr("Any of these three", "Любой из этих трёх ответов")]).map((text, i) =>
        <button key={text} className="button-secondary" disabled={accepted} onClick={() => {
          setAccepted(i === 3);
          setFeedback(i === 3 ? tr("Correct. Each of the three measurements determines the size of this particular shape.", "Верно. Каждая из трёх величин определяет размер фигуры этого типа.") : tr("That condition is sufficient, but the other two are sufficient too. Which answer includes all three?", "Этого условия достаточно, но двух других тоже достаточно. Какой ответ включает все три?"));
        }}>{text}</button>)}</div>
      <p role="status">{feedback}</p>
      {accepted && <button className="button" onClick={() => { setQuiz(quiz === "square" ? "circle" : "done"); setFeedback(""); setAccepted(false); }}>{tr("Next", "Дальше")}</button>}
    </section> : <>
    <div className="controls">{(["SAS", "ASA", "SSS"] as const).map((value, i) => <button className="button-secondary" key={value} aria-pressed={method === value} onClick={() => setMethod(value)}>{i + 1}. {value}</button>)}</div>
    <div className="tri-controls controls">
      {slider("AB", sideAB, 2, 4.5, setSideAB, .1)}
      {slider("AC", sideAC, 2, 4.5, setSideAC, .1)}
      {slider("∠A (°)", included, 35, 115, setIncluded)}
    </div>
    <svg viewBox="0 0 760 420" role="img" aria-label={tr("Corresponding marked triangles ABC and A₁B₁C₁", "Треугольники ABC и A₁B₁C₁ с отмеченными равными элементами")}>
      {drawTriangle(points, "")}{drawTriangle(points.map(twin) as Triangle, "₁")}
      <text x="25" y="40">{method}</text>
      <text x="25" y="72">AB = {sideAB.toFixed(2)} · AC = {sideAC.toFixed(2)} · BC = {(data.sides[0]! / 40).toFixed(2)}</text>
      <text x="25" y="100">α = {included}° · γ = {(data.angles[2]! * 180 / Math.PI).toFixed(2)}°</text>
    </svg>
    <p className="explanation">{explanation}</p>
    <div className="tri-controls controls">
      {slider(tr("Superpose (%)", "Совмещение (%)"), Math.round(overlay * 100), 0, 100, n => { setOverlay(n / 100); progress.current = n / 100; })}
      <label><input type="checkbox" checked={mirror} onChange={e => { setPlaying(false); setMirror(e.target.checked); }} /> {tr("Reflect the second copy", "Отразить вторую копию")}</label>
      <button className="button" onClick={() => {
        if (playing) { setPlaying(false); return; }
        setMirror(false);
        if (overlay === 1) { progress.current = 0; setOverlay(0); } else progress.current = overlay;
        setPlaying(true);
      }}>{playing ? tr("Pause", "Пауза") : tr("Align and superpose", "Совместить")}</button>
      <button className="button-secondary" onClick={() => { setPlaying(false); setOverlay(0); progress.current = 0; setMirror(false); }}>{tr("Separate copies", "Разделить копии")}</button>
    </div>
    <p className="activity-status">{mirror ? tr("The reflected copy is still congruent. Reflect it back before superposition; the Align button performs that reflection explicitly.", "Отражённая копия также конгруэнтна. Для совмещения отразите её обратно; кнопка «Совместить» выполняет это отражение.") :
      overlay === 1 ? tr("All corresponding vertices coincide. The triangles are congruent.", "Соответствующие вершины совпали. Треугольники конгруэнтны.") : tr("The marked corresponding sides/angles stay equal throughout the rigid motion.", "Отмеченные соответствующие стороны и углы сохраняются при движении.")}</p>
    <OriginalDrawings family="congruence" frames={[2200, 3200, 4200]} locale={locale} />
    <button className="button-secondary" onClick={() => {
      setPlaying(false); setQuiz("square"); setAccepted(false); setFeedback("");
      setMethod("SAS"); setSideAB(4); setSideAC(3); setIncluded(60);
      setOverlay(0); progress.current = 0; setMirror(false);
    }}>{tr("Start over", "Начать заново")}</button>
    </>}
  </section>;
}
