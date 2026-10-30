import { useEffect, useState } from "react";
import type { PointerEvent, ReactNode } from "react";
import type { ActivityProps } from "../../shared/contracts";
import { mediaUrl, t } from "../../shared/contracts";
import { useAnimation } from "../../shared/useAnimation";
import { beltGap, circleRoll, clusterRoll, cubeSurfaceRoute, cyclistState, headExtraDistance, ladderPoint, squareRoll } from "./rules";
import "./motion.css";
import Circles from "./Circles";
import NativeMotionLesson from "./NativeMotionLesson";

type Labels = (en: string, ru: string) => string;
function Slider({ label, value, min = 0, max = 1, step = .01, onChange }: {
  label: string; value: number; min?: number; max?: number; step?: number; onChange: (n: number) => void;
}) {
  return <label className="control">{label}<input type="range" min={min} max={max} step={step} value={value}
    onChange={e => onChange(Number(e.target.value))} /></label>;
}
function Diagram({ label, children }: { label: string; children: ReactNode }) {
  return <svg className="diagram motion-diagram" viewBox="0 0 640 420" role="img" aria-label={label}>{children}</svg>;
}
function Quiz({ question, choices, answer, l, onCorrect }: { question: string; choices: string[]; answer: string; l: Labels; onCorrect: () => void }) {
  const [selected, setSelected] = useState("");
  return <section className="motion-quiz"><p>{question}</p><div className="choice-grid">
    {choices.map(c => <button className="button button-secondary" key={c} aria-pressed={selected === c} disabled={selected === answer}
      onClick={() => { setSelected(c); if (c === answer) onCorrect(); }}>{c}</button>)}</div>
    <p className="activity-status" role="status">{selected ? selected === answer ? l("Correct — explore the model below.", "Верно — исследуйте модель ниже.") : l("Not quite. Think it through and try again.", "Не совсем. Подумайте и попробуйте ещё.") : l("Make a prediction first.", "Сначала предположите ответ.")}</p></section>;
}
function Timeline({ progress, setProgress, playing, setPlaying, reducedMotion, l }: {
  progress: number; setProgress: (n: number) => void; playing: boolean; setPlaying: (v: boolean) => void;
  reducedMotion: boolean; l: Labels;
}) {
  return <div className="controls"><button className="button"
    onClick={() => { if (progress === 1) setProgress(0); setPlaying(!playing); }}>
    {playing ? l("Pause", "Пауза") : l("Play", "Пуск")}</button>
    <button className="button button-secondary" onClick={() => { setPlaying(false); setProgress(0); }}>{l("Reset", "Сначала")}</button>
    <Slider label={`${l("Progress", "Ход")} ${Math.round(progress * 100)}%`} value={progress} onChange={v => { setPlaying(false); setProgress(v); }} />
    {reducedMotion && <p className="activity-note">{l("Playback starts paused. Use Play or inspect each step with the progress slider.", "Воспроизведение начинается с паузы. Нажмите «Пуск» или исследуйте этапы ползунком.")}</p>}
  </div>;
}

export default function MotionActivity(props: ActivityProps) {
  const [attempt, setAttempt] = useState(0);
  if (props.activityId === "motion-circle-in-circle") return <Circles {...props} />;
  const explorer = <MotionModel key={`${props.activityId}:${attempt}`} {...props} restart={() => setAttempt(n => n + 1)} />;
  if (props.activityId.includes("ladder")) return explorer;
  return <NativeMotionLesson key={`${props.activityId}:${props.locale}`} {...props} explorer={explorer}/>;
}

function MotionModel({ activityId, locale, reducedMotion, embedded = false, restart }: ActivityProps & { restart: () => void }) {
  const l: Labels = (en, ru) => t(locale, en, ru);
  const [revealed, setRevealed] = useState(false);
  const [hint, setHint] = useState(false);
  const reveal = () => setRevealed(true);
  const answerRequired = ["motion-two-coins", "motion-square-coin", "motion-earth-walk", "motion-cyclists"].includes(activityId);
  const [progress, setProgress] = useState(0);
  const [playing, setPlaying] = useState(false);
  useEffect(() => { if (reducedMotion) setPlaying(false); }, [reducedMotion]);
  const [parameter, setParameter] = useState(activityId === "motion-earth-walk" ? 6 : activityId.includes("ladder") ? .5 : 1);
  const [length, setLength] = useState(activityId === "motion-ladder" ? 275 : 300);
  const moveCrossing = (event: PointerEvent<SVGCircleElement>) => {
    const svg = event.currentTarget.ownerSVGElement;
    const matrix = svg?.getScreenCTM();
    if (!svg || !matrix) return;
    const point = svg.createSVGPoint();
    point.x = event.clientX;
    point.y = event.clientY;
    const local = point.matrixTransform(matrix.inverse());
    setParameter(Math.max(0, Math.min(1, (310 - local.y) / 220)));
    setPlaying(false);
  };
  useAnimation(delta => setProgress(p => {
    const next = Math.min(1, p + delta / 12);
    return next;
  }), playing && progress < 1);
  const timeline = (!answerRequired && activityId !== "motion-coin-cluster" || revealed) && <Timeline progress={progress} setProgress={setProgress} playing={playing && progress < 1}
    setPlaying={setPlaying} reducedMotion={reducedMotion} l={l} />;
  let content: ReactNode;

  if (activityId === "motion-coin-cluster") {
    const radius = 41;
    const coin = clusterRoll(progress, radius);
    content = <>
      <p>{l("A penny rolls without slipping around the six outer pennies of a seven-penny cluster. How many complete turns does it make?",
        "Монета без проскальзывания катится вокруг шести внешних монет группы из семи. Сколько полных оборотов она сделает?")}</p>
      {!revealed && <button className="button" onClick={reveal}>{l("Let's count the turns", "Посчитаем обороты")}</button>}
      <Diagram label={l("A penny rolls around six pennies surrounding a central penny", "Монета обходит шесть монет вокруг центральной")}>
        <image href={mediaUrl("motion/penny-head.png")} x={320 - radius} y={210 - radius} width={2 * radius} height={2 * radius} />
        {Array.from({ length: 6 }, (_, i) => {
          const angle = i * Math.PI / 3;
          const x = 320 + 2 * radius * Math.cos(angle);
          const y = 210 + 2 * radius * Math.sin(angle);
          return <g key={i}><image href={mediaUrl("motion/penny-head.png")} x={x - radius} y={y - radius} width={2 * radius} height={2 * radius} />
            <text x={x - 5} y={y + 6} className="motion-coin-number">{i + 1}</text>
            {coin.contact === i && <circle cx={x} cy={y} r={radius + 3} className="motion-trace" />}</g>;
        })}
        <g transform={`translate(${320 + coin.x} ${210 + coin.y}) rotate(${coin.turns * 360})`}>
          <image href={mediaUrl("motion/penny-tail.png")} x={-radius} y={-radius} width={2 * radius} height={2 * radius} />
          <path d={`M0 0 V${-radius * .85}`} className="motion-mark" />
        </g>
        {revealed && <text x="24" y="400">{l("Turns", "Обороты")}: {coin.turns.toFixed(2)} · {l("Contact penny", "Монета контакта")}: {coin.contact + 1}</text>}
      </Diagram>{timeline}
      {revealed && progress === 1 && !hint && <button className="button" onClick={() => setHint(true)}>{l("Hint", "Подсказка")}</button>}
      {hint && <p className="explanation">{l("The center of the rolling penny is 2r from each contacted penny's center. A 120° center arc therefore has length 2r × 2π/3. Divide by the rolling circumference 2πr: ⅔ of a turn per arc. Six arcs give 6 × ⅔ = 4 turns. At each inward notch, the penny touches two neighbors and switches contact continuously — there is no extra pivot or jump.",
        "Центр катящейся монеты находится в 2r от центра монеты контакта. Дуга центра 120° имеет длину 2r × 2π/3. Делим на окружность 2πr: получаем ⅔ оборота на дугу. Шесть дуг дают 6 × ⅔ = 4 оборота. В каждой впадине монета касается двух соседей и непрерывно меняет контакт — без скачка или дополнительного поворота.")}</p>}
    </>;
  } else if (activityId === "motion-two-coins" || activityId === "motion-square-coin") {
    const square = activityId === "motion-square-coin";
    const coin = square ? squareRoll(progress, 26) : circleRoll(progress, 65, 65);
    const cx = square ? 235 + coin.x : 320 + coin.x;
    const cy = square ? 120 + coin.y : 210 + coin.y;
    const radius = square ? 26 : 65;
    content = <>
      <p>{square ? l("A coin of radius r rolls without slipping around a square with side length 2πr.", "Монета радиуса r без проскальзывания катится вокруг квадрата со стороной 2πr.")
        : l("One penny rolls without slipping all the way around an equal, fixed penny.", "Монета без проскальзывания обходит вокруг такой же неподвижной монеты.")}</p>
      <Quiz l={l} onCorrect={reveal} question={l("How many full turns in one complete trip?", "Сколько полных оборотов за весь путь?")}
        choices={square ? ["3", "4", "5", "6"] : ["1", "2", "3", "4"]} answer={square ? "5" : "2"} />
      <Diagram label={l("A marked coin rolling without slipping", "Монета с меткой катится без проскальзывания")}>
        {square ? <rect x="235" y="120" width={Math.PI * 52} height={Math.PI * 52} className="motion-solid" />
          : <image href={mediaUrl("motion/penny-head.png")} x="255" y="145" width="130" height="130" />}
        <g transform={`translate(${cx} ${cy}) rotate(${coin.turns * 360})`}>
          <image href={mediaUrl("motion/penny-tail.png")} x={-radius} y={-radius} width={radius * 2} height={radius * 2} /><path d={`M0 0 V${-radius * .8} M-7 ${-radius * .6} L0 ${-radius * .8} L7 ${-radius * .6}`} className="motion-mark" />
          <circle r="3" fill="currentColor" />
        </g>
        {revealed && <text x="24" y="390">{l("Turns", "Обороты")}: {coin.turns.toFixed(2)}</text>}
      </Diagram>{timeline}
      {revealed && <p className="explanation">{square
        ? l("Each side is 2πr long: one turn per side. At each corner the coin pivots another quarter-turn. Total: 4 + 4 × ¼ = 5 turns.",
          "Каждая сторона равна 2πr: один оборот на сторону. На каждом углу добавляется четверть оборота. Всего: 4 + 4 × ¼ = 5.")
        : l("The center travels a circle of radius 2r. Its path is 4πr, so a circumference of 2πr rolls twice. One turn comes from rolling along the fixed coin, and one extra turn from going around it.",
          "Центр проходит окружность радиуса 2r длиной 4πr. Делим на 2πr — получаем два оборота. Один от качения вдоль монеты, ещё один от обхода вокруг неё.")}</p>}
    </>;
  } else if (activityId.includes("ladder")) {
    const point = ladderPoint(length, parameter, progress);
    // Keep a fixed viewport scale: normalizing by the chosen length makes
    // changing L invisible, including the cat's locus.
    const scale = activityId === "motion-ladder" ? 300 / 350 : 1;
    const path = Array.from({ length: 101 }, (_, i) => {
      const p = ladderPoint(length, parameter, i / 100);
      return `${60 + p.x * scale},${360 - p.y * scale}`;
    }).join(" ");
    content = <>
      {!embedded && <p>{l("Slide the ladder's foot along the floor. The top stays against the wall. Choose a fixed position for the cat and inspect its trace.",
        "Нижний конец лестницы скользит по полу, верхний — по стене. Выберите место кота на лестнице и исследуйте траекторию.")}</p>}
      <div className="controls"><Slider label={`${l("Cat position from foot", "Положение кота от нижнего конца")}: ${Math.round(parameter * 100)}%`}
        value={parameter} onChange={v => { setParameter(v); setPlaying(false); }} />
        {activityId === "motion-ladder" && <Slider label={`${l("Ladder length", "Длина лестницы")}: ${length}`} min={100} max={350} step={5} value={length} onChange={setLength} />}
      </div>
      <svg className="diagram motion-diagram motion-ladder-diagram" viewBox="25 25 390 365" role="img"
        aria-label={l("Sliding ladder and the cat's elliptical path", "Лестница и эллиптическая траектория кота")}>
        <path d="M60 35 V360 H390" className="motion-wall" />
        <polyline points={path} className="motion-trace" />
        <line x1="60" y1={360 - point.topY * scale} x2={60 + point.footX * scale} y2="360" className="motion-ladder" />
        <circle cx={60 + point.x * scale} cy={360 - point.y * scale} r="10" className="motion-cat-point" />
      </svg>{timeline}
      {!embedded && <p className="motion-ladder-coordinates">L = {length} · x = {point.x.toFixed(1)} · y = {point.y.toFixed(1)}</p>}
      {!embedded && <p className="explanation">{l("If f is the fraction from the foot, x = (1−f)L sin θ and y = fL cos θ. The trace is a quarter ellipse. At the midpoint (f = ½), it becomes a quarter circle of radius L/2. Endpoints trace straight lines.",
        "Если f — доля расстояния от нижнего конца, x = (1−f)L sin θ, y = fL cos θ. Траектория — четверть эллипса. Середина (f = ½) описывает четверть окружности радиуса L/2. Концы движутся по прямым.")}</p>}
    </>;
  } else if (activityId === "motion-cyclists") {
    const state = cyclistState(progress);
    const pos = (x: number) => 60 + x * 13;
    content = <>
      <p>{l("Two cyclists start 40 km apart, riding toward each other at 15 and 10 km/h. A fly shuttles between them at 100 km/h until they meet. Ignore turn-around time.",
        "Велосипедисты на расстоянии 40 км едут навстречу со скоростями 15 и 10 км/ч. Муха летает между ними со скоростью 100 км/ч до встречи. Временем разворота пренебрегаем.")}</p>
      <Quiz l={l} onCorrect={reveal} question={l("How far does the fly travel (km)?", "Какой путь пролетит муха (км)?")} choices={["40", "100", "120", "160"]} answer="160" />
      <Diagram label={l("Cyclists approach while the fly flies between them", "Велосипедисты сближаются, муха летает между ними")}>
        <path d="M60 290 H580" className="motion-wall" /><text x="50" y="330">A</text><text x="570" y="330">B</text>
        {[state.left, state.right].map((x, i) => <g key={i} transform={`translate(${pos(x)} 290) scale(${i === 0 ? -1 : 1} 1)`}>
          <image href={mediaUrl(`motion/cyclist-${i === 0 ? "blue" : "red"}.png`)} x="-35" y="-86" width="70" height="86" /></g>)}
        <g transform={`translate(${pos(state.fly)} 155)`}><image href={mediaUrl("motion/fly.png")} x="-15" y="-15" width="30" height="31" /><text x="-12" y="-25">{l("Fly", "Муха")}</text></g>
        {revealed && <text x="35" y="45">{state.time.toFixed(2)} h · {l("Fly distance", "Путь мухи")}: {state.flyDistance.toFixed(1)} km</text>}
      </Diagram>{timeline}
      {revealed && <p className="explanation">{l("The closing speed is 15 + 10 = 25 km/h. Meeting time: 40/25 = 1.6 h. The fly flies for the same time: 100 × 1.6 = 160 km. No need to add all its trips!",
        "Скорость сближения: 15 + 10 = 25 км/ч. До встречи: 40/25 = 1,6 ч. Муха летает столько же: 100 × 1,6 = 160 км. Складывать все перелёты не нужно!")}</p>}
    </>;
  } else if (activityId === "motion-caterpillar") {
    const c = Math.min(1, parameter);
    const routeX = progress <= .5 ? 100 + progress * 440 : 320 + (progress - .5) * 440;
    const routeY = progress <= .5 ? 310 - progress * 2 * c * 220 : 310 - c * 220 - (progress - .5) * 2 * (1 - c) * 220;
    content = <>
      <p>{l("A caterpillar must travel along the surface of a cubic room from one corner to the opposite corner. Here two adjacent faces are unfolded. Move the crossing point on their shared edge.",
        "Гусеница ползёт по поверхности кубической комнаты из одной вершины в противоположную. Две соседние грани развёрнуты. Меняйте точку пересечения общего ребра.")}</p>
      <Slider label={`${l("Crossing point", "Точка пересечения")}: ${(c * 100).toFixed(0)}%`} value={c} onChange={v => { setParameter(v); setPlaying(false); }} />
      <p className="activity-note">{l("Drag the marked crossing along the shared edge, or use the crossing-point slider.", "Перетащите отмеченную точку вдоль общего ребра или используйте ползунок точки пересечения.")}</p>
      <Diagram label={l("Two unfolded unit faces; route from A through the seam to B", "Две развёрнутые единичные грани; путь от A через ребро к B")}>
        <rect x="100" y="90" width="220" height="220" className="motion-solid" /><rect x="320" y="90" width="220" height="220" className="motion-solid" />
        <path d="M320 90 V310" className="motion-trace" />
        <path d={`M100 310 L320 ${310 - c * 220} L540 90`} className="motion-ladder" />
        <circle cx="320" cy={310 - c * 220} r="18" className="motion-crossing-handle"
          onPointerDown={event => {
            if (!event.isPrimary || event.button !== 0) return;
            event.currentTarget.setPointerCapture(event.pointerId);
            moveCrossing(event);
          }}
          onPointerMove={event => {
            if (event.currentTarget.hasPointerCapture(event.pointerId)) moveCrossing(event);
          }}
          onPointerUp={event => {
            if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
          }} />
        <circle cx="320" cy={310 - c * 220} r="9" className="motion-coin" pointerEvents="none" />
        <image href={mediaUrl("motion/caterpillar-head.png")} x={routeX - 15} y={routeY - 15} width="30" height="29" pointerEvents="none" />
        <text x="75" y="340">A</text><text x="550" y="85">B</text>
        <text x="170" y="365">{l("Length", "Длина")}: {cubeSurfaceRoute(c).toFixed(4)} a</text>
      </Diagram>{timeline}
      <button className="button" onClick={() => { setHint(true); setParameter(.5); setPlaying(false); }}>{l("Hint: show the shortest route", "Подсказка: кратчайший путь")}</button>
      {hint && <p className="explanation">{l("On the unfolded 2a × a rectangle, the shortest path is a straight line. It crosses the seam halfway: √((2a)² + a²) = a√5 ≈ 2.236a, shorter than following three edges (3a). Symmetry gives equivalent shortest routes on other pairs of faces.",
        "На развёртке 2a × a кратчайший путь — прямая. Она пересекает ребро посередине: √((2a)² + a²) = a√5 ≈ 2,236a, меньше трёх рёбер (3a). По симметрии на других парах граней есть такие же кратчайшие пути.")}</p>}
    </>;
  } else {
    const walk = activityId === "motion-earth-walk";
    const value = walk ? headExtraDistance(parameter) : beltGap(parameter);
    const angle = progress * Math.PI * 2;
    content = <>
      <p>{walk ? l("A six-foot traveler walks once around Earth. How much farther does the head travel than the feet? Assume a perfect sphere and an upright traveler.",
        "Путешественник ростом шесть футов обходит Землю. Насколько путь головы длиннее пути ног? Считаем Землю шаром, а путешественника — стоящим прямо.")
        : l("A belt fits tightly around Earth's equator. Add exactly one metre and lift it evenly all around. Could a cat fit beneath it? Assume a circular, concentric belt.",
          "Ремень плотно охватывает экватор. Добавьте ровно метр и равномерно поднимите ремень. Пролезет ли кошка? Ремень считаем окружностью с тем же центром.")}</p>
      {walk && <Quiz l={l} onCorrect={reveal} question={l("For a height of 6 ft, the extra distance is…", "При росте 6 футов разность путей равна…")}
        choices={["1 ft", "2π ft", "6π ft", "12π ft"]} answer="12π ft" />}
      {!walk && !revealed && <button className="button" onClick={reveal}>{l("Hint", "Подсказка")}</button>}
      {revealed && <Slider label={walk ? `${l("Height", "Рост")}: ${parameter.toFixed(1)} ft` : `${l("Added belt length", "Добавленная длина")}: ${parameter.toFixed(1)} m`}
        min={.1} max={walk ? 10 : 3} step={.1} value={parameter} onChange={setParameter} />}
      <Diagram label={l("Concentric circles comparing Earth and the outer path; separation exaggerated", "Земля и внешний путь — концентрические окружности; зазор увеличен")}>
        <circle cx="320" cy="210" r="120" className="motion-solid" />
        <circle cx="320" cy="210" r="153" className="motion-trace" />
        {walk ? <g transform={`translate(320 210) rotate(${angle * 180 / Math.PI})`}>
          <path d="M120 0 H153" className="motion-ladder" /><circle cx="153" r="8" className="motion-coin" /></g>
          : <><path d="M320 90 V57" className="motion-ladder" /><text x="335" y="75">Δr</text></>}
        <text x="260" y="215">{l("Earth", "Земля")}</text>
        <text x="24" y="400">{l("Separation exaggerated — not to scale", "Зазор увеличен — рисунок не в масштабе")}</text>
      </Diagram>
      {walk && timeline}
      {revealed && <p className="activity-status">{walk ? `${l("Extra distance", "Разность путей")}: ${value.toFixed(3)} ft`
        : `${l("Uniform gap", "Равномерный зазор")}: ${(value * 100).toFixed(2)} cm`}</p>}
      {revealed && <p className="explanation">{walk ? l("2π(R + h) − 2πR = 2πh. Earth's radius cancels. At 6 ft, the extra distance is 12π ft ≈ 37.699 ft.",
        "2π(R + h) − 2πR = 2πh. Радиус Земли сокращается. При 6 футах разность равна 12π ≈ 37,699 фута.")
        : l("2π(R + Δr) − 2πR = ΔL, so Δr = ΔL/(2π). One extra metre gives 15.92 cm, independent of Earth's radius. A cat can pass if it fits beneath that gap.",
          "2π(R + Δr) − 2πR = ΔL, значит Δr = ΔL/(2π). Один метр даёт зазор 15,92 см независимо от радиуса Земли. Кошка пролезет, если её размер позволяет пройти под таким зазором.")}</p>}
    </>;
  }
  return <div className={`activity-layout motion-activity${activityId.includes("ladder") ? " motion-ladder-activity" : ""}${embedded ? " motion-embedded" : ""}`}>{content}
    {(revealed || hint) && <button className="button button-secondary" onClick={restart}>{l("Start the question again", "Начать вопрос заново")}</button>}
  </div>;
}
