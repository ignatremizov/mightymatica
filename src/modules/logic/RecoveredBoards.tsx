import { useEffect, useRef, useState, type ReactNode, type PointerEvent } from "react";
import type { ActivityProps } from "../../shared/contracts";
import { mediaUrl, t } from "../../shared/contracts";
import { useAnimation } from "../../shared/useAnimation";
import recovered from "./recovered.json";
import { canMatchBead } from "./rules";
import { useLogicAudio, type LogicClip } from "./useLogicAudio";

interface Point { name: string; x: number; y: number }
interface Named { name: string; matrix: string; symbol: string | null }
interface Stage { frame: number; image: string; starts: Point[]; ends: Point[]; named: Named[]; required?: number; choices?: { name: string; value: number }[]; answer?: number; level?: number }
const boards = recovered as Record<string, Stage[] | string[]>;
const families: Record<string, string> = {
  "logic-complete-chain": "Completechain", "logic-necklace": "Necklace",
  "logic-ripped-necklace": "Rippednecklace", "logic-count-stones": "Stones",
};
const stageSizes: Record<string, [number, number]> = { Completechain: [800, 480], Necklace: [550, 400], Rippednecklace: [800, 480], Stones: [550, 400] };
function pointOf(item: Named): [number, number] {
  const values = item.matrix.match(/-?\d+(?:\.\d+)?/g)?.map(Number);
  return values?.length === 6 ? [values[4]!, values[5]!] : [0, 0];
}

function BoardChoice({ label, disabled, selected, onChoose, children, piece }: {
  label: string; disabled: boolean; selected?: boolean; onChoose: () => void; children: ReactNode; piece?: string;
}) {
  function activate() { if (!disabled) onChoose(); }
  return <g className="logic-board-choice" role="button" tabIndex={disabled ? -1 : 0}
    aria-label={label} aria-disabled={disabled} aria-pressed={selected} data-piece={disabled ? undefined : piece}
    onClick={activate} onKeyDown={(event) => {
      if (event.key === "Enter" || event.key === " ") { event.preventDefault(); activate(); }
    }}>{children}</g>;
}

export function RecoveredBoards({ activityId, locale }: ActivityProps) {
  const family = families[activityId]!;
  const intro: Record<string, LogicClip> = {
    Completechain: "Completechain-18.mp3", Necklace: "Necklace-75.mp3",
    Rippednecklace: "Rippednecklace-56.mp3", Stones: "Howmany.mp3",
  };
  const audio = useLogicAudio(locale, intro[family], true);
  const stages = boards[family] as Stage[];
  const say = (en: string, ru: string) => t(locale, en, ru);
  const [stageIndex, setStageIndex] = useState(0);
  const [completed, setCompleted] = useState(false);
  const [placed, setPlaced] = useState<Record<string, string>>({});
  const [selected, setSelected] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [memory, setMemory] = useState<"ready" | "look" | "covered" | "reveal">("ready");
  const [practice, setPractice] = useState(false);
  const [loadedImage, setLoadedImage] = useState("");
  const memoryClock = useRef(0);
  const gestureStart = useRef<{ x: number; y: number } | null>(null);
  const suppressClick = useRef(false);
  const [gesture, setGesture] = useState<{ pointerId: number; name: string; x: number; y: number; path: string } | null>(null);
  const stage = stages[stageIndex]!;
  const [width, height] = stageSizes[family]!;
  const count = Object.keys(placed).length;
  const needed = family === "Completechain" ? stage.required! : family === "Stones" ? 1 : 6;
  const success = count === needed;
  function reset() { audio.stop(); setPlaced({}); setSelected(null); setMessage(""); setCompleted(false); setGesture(null); setMemory("ready"); memoryClock.current = 0; }
  function changeStage(index: number) {
    setStageIndex(index); reset();
    if (family === "Necklace") audio.play("Necklace-80.mp3");
    else if (family !== "Stones" && intro[family]) audio.play(intro[family]);
  }
  function advanceStage() {
    const next = stages[stageIndex + 1];
    if (next && (family !== "Stones" || next.level === stage.level)) changeStage(stageIndex + 1);
    else setCompleted(true);
  }
  function reject() {
    if (family === "Stones" || family === "Completechain") audio.play("AngryMob.mp3");
    setMessage(family === "Stones"
      ? say("Not yet. Try another number.", "Пока неверно. Попробуйте другое число.")
      : say("Not a match. Look at the pattern and try again.", "Не совпадает. Посмотрите на узор и попробуйте ещё."));
  }
  const beadPrefix = ["t", "c", "s", "tu", "t", "c", "s", "tu"][stageIndex]!;
  const legalNecklace = new RegExp(`^${beadPrefix}\\d+$`);
  const shapeNames: Record<string, [string, string]> = { t: ["triangle", "треугольник"], c: ["circle", "круг"], s: ["square", "квадрат"], tu: ["inverted triangle", "перевёрнутый треугольник"] };
  const targetShape = shapeNames[beadPrefix]!;
  const chainEnds = stage.ends.filter((point, i, all) => all.findIndex((other) => point.x === other.x && point.y === other.y) === i);
  const leftEnds = stage.starts;
  const rightEnds = (family === "Rippednecklace" ? (stages[0]!.ends) : []).slice().sort((a, b) => a.y - b.y);
  useEffect(() => {
    const cancel = () => { setGesture(null); setSelected(null); };
    const visibility = () => { if (document.hidden) cancel(); };
    window.addEventListener("blur", cancel);
    document.addEventListener("visibilitychange", visibility);
    return () => { window.removeEventListener("blur", cancel); document.removeEventListener("visibilitychange", visibility); };
  }, []);
  useAnimation((delta) => {
    memoryClock.current += delta;
    // The cover's source span is 119 frames at 24 fps; the correct-answer
    // reveal is startnext's 45 ticks of 100 ms. Hidden time never counts.
    if (memory === "look" && memoryClock.current >= 119 / 24) {
      setMemory("covered");
      audio.play("Stones-79.mp3");
    }
    if (memory === "reveal" && memoryClock.current >= 4.5) {
      advanceStage();
    }
  }, family === "Stones" && !practice && (memory === "look" || (memory === "reveal" && !completed)));
  function placeAt(destination: Point, source = selected) {
    if (!source) { setMessage(say("Choose a bead first.", "Сначала выберите бусину.")); return; }
    if (success || placed[source] || Object.values(placed).includes(destination.name)) return;
    if ((family === "Completechain" || family === "Rippednecklace") &&
      !canMatchBead(family, source, destination.name, placed)) { reject(); return; }
    setPlaced({ ...placed, [source]: destination.name });
    setSelected(null);
    setMessage(say("Matched!", "Совпало!"));
    audio.play("Shortbang.mp3");
    if (count + 1 === needed) {
      audio.play(family === "Completechain" ? "Completechain-80.mp3" : "Rippednecklace-62.mp3");
      if (family === "Rippednecklace") audio.play("Rippednecklace-63.mp3");
      if (stageIndex + 1 === stages.length) audio.play("salut.MP3");
    }
  }
  function necklacePick(name: string) {
    if (success || placed[name]) return;
    if (!legalNecklace.test(name)) { reject(); return; }
    setPlaced({ ...placed, [name]: String(count) });
    setMessage(say("Bead added to the rope.", "Бусина добавлена на нитку."));
    audio.play("Shortbang.mp3");
    if (count + 1 === needed) audio.play(stageIndex + 1 === stages.length ? "Necklace-87.mp3" : "Necklace-79.mp3");
  }
  function coordinates(event: PointerEvent<SVGSVGElement>) {
    const matrix = event.currentTarget.getScreenCTM();
    return matrix ? new DOMPoint(event.clientX, event.clientY).matrixTransform(matrix.inverse()) : null;
  }
  function startGesture(event: PointerEvent<SVGSVGElement>) {
    if (event.button !== 0 || success || gesture) return;
    const name = (event.target as Element).closest("[data-piece]")?.getAttribute("data-piece");
    const point = coordinates(event);
    if (!name || !point) return;
    suppressClick.current = false;
    gestureStart.current = { x: point.x, y: point.y };
    event.currentTarget.setPointerCapture(event.pointerId);
    setSelected(name);
    setGesture({ pointerId: event.pointerId, name, x: point.x, y: point.y, path: `M${point.x} ${point.y}` });
  }
  function finishGesture(event: PointerEvent<SVGSVGElement>) {
    if (!gesture || gesture.pointerId !== event.pointerId) return;
    const point = coordinates(event);
    setGesture(null);
    if (!point) return;
    if (family === "Necklace") {
      // Source rope is the horizontal segment at y=128.
      if (suppressClick.current && point.y >= 72 && point.y <= 196 && point.x >= -29 && point.x <= 339) necklacePick(gesture.name);
      return;
    }
    const destination = (family === "Completechain" ? chainEnds : rightEnds).find((end) =>
      Math.abs(point.x - (end.x + (family === "Completechain" ? 23 : 0))) <= (family === "Completechain" ? 30 : 65) &&
      Math.abs(point.y - (end.y + (family === "Completechain" ? 23 : 0))) <= (family === "Completechain" ? 30 : 40));
    if (destination) placeAt(destination, gesture.name);
  }
  const instruction = family === "Completechain"
    ? say("Drag a blue or pink bead into a gap to continue the pattern. You can also select a bead, then a numbered place. Correct placements lock in place.", "Перетащите синюю или розовую бусину в пробел, продолжая узор. Можно также выбрать бусину, затем место по номеру. Верные ходы закрепляются.")
    : family === "Necklace"
      ? say(`Drag six matching beads onto the rope: ${targetShape[0]}. You can also tap shapes or use the controls below.`, `Перетащите на нитку шесть одинаковых бусин: ${targetShape[1]}. Можно также нажимать на фигуры или пользоваться кнопками внизу.`)
      : family === "Rippednecklace"
        ? say("Draw from a left broken end to its matching right half. Read the shapes and colors from each broken end. You can also select the halves in turn.", "Проведите линию от левого разрыва к подходящей правой половинке. Читайте формы и цвета от места разрыва. Можно также выбрать половинки по очереди.")
        : say("Start, remember the stones inside the large frame, then answer after the cover closes. Do not count the sample at upper left.", "Начните, запомните камни в большой рамке и ответьте, когда она закроется. Не считайте образец слева вверху.");
  let status = `${count}/${needed} · ${message || say("Ready.", "Можно начинать.")}`;
  if (family === "Stones" && !practice) {
    const prompt = memory === "ready"
      ? say("Press Start when you are ready.", "Нажмите «Начать», когда будете готовы.")
      : memory === "look" ? say("Remember the stones.", "Запомните камни.")
        : say("How many stones did you see?", "Сколько камней вы увидели?");
    status = message || prompt;
  }
  if (success) {
    status = say("Good job! This stage is complete.", "Отлично! Этап пройден.");
    if (completed) status = family === "Stones"
      ? say("Level complete. Choose another level or play again.", "Уровень пройден. Выберите другой уровень или сыграйте снова.")
      : say("All stages complete. Good job!", "Все этапы пройдены. Отлично!");
  }
  return <>
    {audio.control}
    <p className="explanation">{instruction}</p>
    <p>{say("Stage", "Этап")} {stageIndex + 1}/{stages.length}</p>
    {family === "Stones" && <label className="control">{say("Level", "Уровень")} <select value={stage.level} onChange={(event) => {
      const index = stages.findIndex((candidate) => candidate.level === Number(event.target.value));
      if (index >= 0) changeStage(index);
    }}>{[1, 2, 3].map((level) => <option key={level} value={level}>{level}</option>)}</select></label>}
    {family === "Stones" && <div className="controls">
      {!practice && memory === "ready" && <button className="button" disabled={loadedImage !== stage.image} onClick={() => {
        audio.play("Howmany.mp3"); audio.play("Stones-78.mp3"); audio.play("Stones-79.mp3");
        memoryClock.current = 0; setMemory("look");
      }}>{say("Start", "Начать")}</button>}
      <label><input type="checkbox" checked={practice} onChange={(event) => { setPractice(event.target.checked); reset(); }} /> {say("Untimed practice", "Тренировка без таймера")}</label>
    </div>}
    <svg className="diagram logic-recovered-board" viewBox={`0 0 ${width} ${height}`} role={family === "Stones" ? "img" : "group"} aria-label={instruction}
      onPointerDown={startGesture}
      onClickCapture={(event) => {
        if (suppressClick.current) { event.preventDefault(); event.stopPropagation(); suppressClick.current = false; }
      }}
      onPointerMove={(event) => {
        if (!gesture || gesture.pointerId !== event.pointerId) return;
        const point = coordinates(event);
        if (point) {
          if (gestureStart.current && Math.hypot(point.x - gestureStart.current.x, point.y - gestureStart.current.y) > 6) suppressClick.current = true;
          setGesture({ ...gesture, x: point.x, y: point.y,
          path: gesture.path.length < 12000 ? `${gesture.path} L${point.x.toFixed(1)} ${point.y.toFixed(1)}` : gesture.path });
        }
      }}
      onPointerUp={finishGesture} onPointerCancel={() => setGesture(null)} onLostPointerCapture={() => setGesture(null)}
      onKeyDown={(event) => {
        if (event.key === "Escape") { setSelected(null); setMessage(""); setGesture(null); }
      }}>
      <image href={mediaUrl(stage.image)} width={width} height={height} onLoad={() => setLoadedImage(stage.image)} />
      {family === "Stones" && !practice && (memory === "ready" || memory === "covered") &&
        <g><rect x="126" y="102" width="300" height="200" fill="#ff00cc" stroke="#000066" strokeWidth="2" />
          <text x="276" y="192" textAnchor="middle" fill="#0000ff" fontSize="32">{say("Count the stones", "Сосчитайте камни")}</text></g>}
      {family === "Completechain" && <>
        {stage.starts.filter((p) => placed[p.name]).map((point) => <circle key={point.name} cx={point.x + 23} cy={point.y + 23} r="28" fill="#66ffff" />)}
        {stage.starts.map((point) => <BoardChoice key={point.name}
          label={`${say(point.name[0] === "b" ? "Blue" : "Pink", point.name[0] === "b" ? "Синяя" : "Розовая")} ${point.name.slice(1)}`}
          disabled={Boolean(placed[point.name]) || success} selected={selected === point.name} piece={point.name}
          onChoose={() => setSelected(point.name)}>
          <circle className="logic-hit-region" cx={point.x + 23} cy={point.y + 23} r="26" fill="transparent" />
        </BoardChoice>)}
        {chainEnds.map((point, i) => {
          const filled = Object.values(placed).includes(point.name);
          return <BoardChoice key={point.name} label={`${say("Place", "Место")} ${i + 1}`}
            disabled={filled || success} onChoose={() => placeAt(point)}>
            <circle cx={point.x + 23} cy={point.y + 23} r="24" fill={filled ? point.name[0] === "b" ? "#0099ff" : "#ff00cc" : "transparent"} stroke={filled ? "#000033" : "#353535"} strokeWidth={filled ? 1 : 2} strokeDasharray={filled ? undefined : "3 3"} />
            {!filled && <text x={point.x + 23} y={point.y + 29} textAnchor="middle" fill="#172431" fontSize="18">{i + 1}</text>}
          </BoardChoice>;
        })}
      </>}
      {family === "Necklace" && <>
        {stage.named.filter((p) => /^(t|c|s|tu)\d+$/.test(p.name)).map((item) => {
          const [x, y] = pointOf(item);
          const shape = shapeNames[item.name.replace(/\d+$/, "")]!;
          return <BoardChoice key={item.name}
            label={`${say(shape[0], shape[1])} ${item.name.match(/\d+/)?.[0]}`}
            disabled={Boolean(placed[item.name]) || success} piece={item.name} onChoose={() => necklacePick(item.name)}>
            <rect x={x - 2} y={y - 2} width="47" height="46" fill={placed[item.name] ? "#66ffff" : "transparent"} />
          </BoardChoice>;
        })}
        {Object.keys(placed).map((name, i) => <g key={name} transform={`translate(${25 + i * 43},128)`}>
          {beadPrefix === "c" ? <circle r="16" fill="#0000cc" stroke="#000" /> : beadPrefix === "s" ? <rect x="-16" y="-16" width="32" height="32" fill="#0000cc" stroke="#000" /> : <path d={beadPrefix === "tu" ? "M-18 -15 L18 -15 L0 17Z" : "M-18 17 L18 17 L0 -15Z"} fill="#0000cc" stroke="#000" />}
        </g>)}
      </>}
      {family === "Rippednecklace" && <>
        {leftEnds.map((point, i) => {
          const destination = stages[0]!.ends.find((p) => p.name === point.name)!;
          const matched = Boolean(placed[point.name]);
          return <BoardChoice key={point.name} label={`${say("Left", "Слева")} ${i + 1}`}
            disabled={matched || success} selected={selected === point.name} piece={point.name} onChoose={() => setSelected(point.name)}>
            {matched && <rect x="65" y={point.y - 38} width="230" height="76" fill="#66ffff" />}
            <text x="70" y={point.y + 7} fontSize="22" fill="#142b33">{i + 1}{matched ? " ✓" : ""}</text>
            <rect className="logic-hit-region" x="65" y={point.y - 26} width={point.x + 5} height="52" fill="transparent" />
            {matched && <rect x={destination.x - 145} y={destination.y - 40} width="250" height="88" fill="#66ffff" />}
          </BoardChoice>;
        })}
        {rightEnds.map((point, i) => <BoardChoice key={point.name}
          label={`${say("Right", "Справа")} ${String.fromCharCode(65 + i)}`}
          disabled={Object.values(placed).includes(point.name) || success} onChoose={() => placeAt(point)}>
          <text x="737" y={point.y + 7} fontSize="22" fill="#142b33">{String.fromCharCode(65 + i)}</text>
          <rect x={point.x - 70} y={point.y - 26} width={830 - point.x} height="52" fill="transparent" />
        </BoardChoice>)}
      </>}
      {gesture && <g pointerEvents="none">
        {family === "Rippednecklace" ? <path d={gesture.path} fill="none" stroke="#ff00cc" strokeWidth="12" /> : (() => {
          const origin = family === "Completechain"
            ? stage.starts.find((item) => item.name === gesture.name)
            : undefined;
          const item = stage.named.find((entry) => entry.name === gesture.name);
          const [sx, sy] = origin ? [origin.x, origin.y] : item ? pointOf(item) : [0, 0];
          return <>
            <rect x={sx - 2} y={sy - 2} width="50" height="50" fill="#66ffff" />
            <svg x={gesture.x - 23} y={gesture.y - 23} width="48" height="48" viewBox={`${sx} ${sy} 48 48`}>
              <image href={mediaUrl(stage.image)} width={width} height={height} />
            </svg>
          </>;
        })()}
      </g>}
    </svg>
    {family === "Completechain" && <>
      <div className="controls">{stage.starts.map((point) => <button key={point.name} className="button button-secondary" disabled={Boolean(placed[point.name]) || success} aria-pressed={selected === point.name} onClick={() => setSelected(point.name)}>{say(point.name[0] === "b" ? "Blue" : "Pink", point.name[0] === "b" ? "Синяя" : "Розовая")} {point.name.slice(1)}</button>)}</div>
      <div className="controls">{chainEnds.map((point, i) => <button key={point.name} className="button" disabled={Object.values(placed).includes(point.name) || success} onClick={() => placeAt(point)}>{say("Place", "Место")} {i + 1}</button>)}</div>
    </>}
    {family === "Necklace" && <div className="controls">{stage.named.filter((p) => /^(t|c|s|tu)\d+$/.test(p.name)).map((point) => {
      const prefix = point.name.replace(/\d+$/, "");
      const shape = shapeNames[prefix]!;
      return <button key={point.name} className="button button-secondary" disabled={Boolean(placed[point.name]) || success} onClick={() => necklacePick(point.name)}>{say(shape[0], shape[1])} {point.name.match(/\d+/)?.[0]}</button>;
    })}</div>}
    {family === "Rippednecklace" && <>
      <div className="controls">{leftEnds.map((point, i) => <button key={point.name} className="button button-secondary" disabled={Boolean(placed[point.name]) || success} aria-pressed={selected === point.name} onClick={() => setSelected(point.name)}>{say("Left", "Слева")} {i + 1}</button>)}</div>
      <div className="controls">{rightEnds.map((point, i) => <button key={point.name} className="button" disabled={Object.values(placed).includes(point.name) || success} onClick={() => placeAt(point)}>{say("Right", "Справа")} {String.fromCharCode(65 + i)}</button>)}</div>
    </>}
    {family === "Stones" && <div className="controls">{stage.choices?.map((choice) => <button key={choice.name} className="button" disabled={success || (!practice && memory !== "covered")} onClick={() => {
      if (choice.value === stage.answer) {
        setPlaced({ answer: String(choice.value) }); setMessage(say("Correct!", "Верно!"));
        audio.play("Shortbang.mp3"); audio.play("Mystery.mp3");
        if (stages[stageIndex + 1]?.level !== stage.level) audio.play("Stones-185.mp3");
        memoryClock.current = 0; setMemory("reveal");
      } else reject();
    }}>{choice.value}</button>)}</div>}
    <p className="activity-status" role="status">{status}</p>
    <div className="controls">
      <button className="button button-secondary" onClick={reset}>{say("Reset this stage", "Начать этап сначала")}</button>
      {completed && <button className="button" onClick={() => changeStage(family === "Stones" ? stages.findIndex((candidate) => candidate.level === stage.level) : 0)}>{say("Play again", "Играть снова")}</button>}
      {success && !completed && (family !== "Stones" || practice) && <button className="button" onClick={advanceStage}>{say(stageIndex + 1 < stages.length ? "Next stage" : "Finish", stageIndex + 1 < stages.length ? "Следующий этап" : "Завершить")}</button>}
    </div>
  </>;
}

