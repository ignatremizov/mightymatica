import { useEffect, useRef, useState } from "react";
import type { ActivityProps } from "../../shared/contracts";
import { mediaUrl, t } from "../../shared/contracts";
import { OriginalCompanion } from "../../shared/OriginalCompanion";
import recovered from "./recovered.json";
import { connectPictures, insidePoint } from "./boardRules";
import type { BoardPoint, Connection, OriginalBoard } from "./boardRules";
import { useBoardAudio } from "./useBoardAudio";

const boards = recovered as Record<string, OriginalBoard>;

export interface RecoveredActivityProps extends ActivityProps {
  startStage?: number;
  initialScore?: number;
  onScoreChange?: (score: number) => void;
  onComplete?: () => void;
  onRestart?: () => void;
}

export default function RecoveredActivity(props: RecoveredActivityProps) {
  return <Board key={props.activityId} {...props} />;
}

function Board({ activityId, locale, reducedMotion, startStage = 0, initialScore = 0,
  onScoreChange, onComplete, onRestart }: RecoveredActivityProps) {
  const board = boards[activityId];
  const [stageIndex, setStageIndex] = useState(startStage);
  const [connections, setConnections] = useState<readonly Connection[]>([]);
  const [selection, setSelection] = useState<string | null>(null);
  const [feedback, setFeedback] = useState("");
  const [score, setScore] = useState(initialScore);
  const [cursor, setCursor] = useState({ x: board.width / 2, y: board.height / 2 });
  const [companionPlaying, setCompanionPlaying] = useState(false);
  const [dragEnd, setDragEnd] = useState<{ x: number; y: number } | null>(null);
  const pointerStart = useRef<string | null>(null);
  const swallowClick = useRef<string | null>(null);
  const stage = board.stages[stageIndex];
  const complete = connections.length >= stage.required;
  const sound = useBoardAudio(activityId, stageIndex);
  useEffect(() => { onScoreChange?.(score); }, [score, onScoreChange]);
  useEffect(() => { if (complete) onComplete?.(); }, [complete, onComplete]);
  const point = (id: string) => stage.points.find((item) => item.id === id)!;
  const single = board.mode === "proper" || board.mode === "odd";
  const piecesUsed = new Set(connections.flatMap(([a, b]) =>
    board.mode === "sort" || board.mode === "place" ? [a] : [a, b]));
  const targetsUsed = new Set(board.mode === "place" ? connections.map(([, b]) => b) : []);

  const instructions = board.mode === "odd"
    ? t(locale, "Find the picture that does not belong. Click it, or move the crosshair with arrow keys and press Enter.",
      "Найди лишнюю картинку. Нажми на неё или перемести прицел стрелками и нажми Enter.")
    : board.mode === "proper"
      ? t(locale, "Look at the question mark. Choose the picture that completes the original scene.",
        "Посмотри на знак вопроса. Выбери картинку, которая дополнит исходный рисунок.")
      : board.mode === "couple"
        ? t(locale, "Connect pictures of the same color: choose a picture on the left, then its partner on the right.",
          "Соедини картинки одного цвета: выбери картинку слева, затем её пару справа.")
        : board.mode === "same"
          ? t(locale, "Find the two identical pictures and connect them.",
            "Найди две одинаковые картинки и соедини их.")
          : board.mode === "place"
            ? t(locale, "Complete the illustrated patterns with pink and white counters. Choose a counter, then an empty space. Each space holds one counter.",
              "Дополни узоры розовыми и белыми кружками. Выбери кружок, затем свободное место. На каждом месте — один кружок.")
            : board.mode === "sort"
              ? t(locale, `Separate the figures by ${activityId.endsWith("color") ? "color" : activityId.endsWith("size") ? "size" : "shape"}. Choose a figure, then a basket.`,
                `Раздели фигуры по ${activityId.endsWith("color") ? "цвету" : activityId.endsWith("size") ? "размеру" : "форме"}. Выбери фигуру, затем корзину.`)
              : t(locale, "Connect the example to a figure of the same shape. Color and size may differ.",
                "Соедини образец с фигурой такой же формы. Цвет и размер могут отличаться.");

  function success() {
    setFeedback(t(locale, "Good job!", "Молодец!"));
    setScore((value) => value + 1);
    setSelection(null);
  }

  function choose(id: string) {
    if (complete || piecesUsed.has(id) || targetsUsed.has(id)) return;
    if (board.mode === "proper") {
      sound.play(id);
      if (id === "Correct") {
        setConnections([["Correct", "Correct"]]);
        success();
      } else {
        setScore((value) => value - 1);
        setFeedback(t(locale, "Not this picture. Look at the scene again.", "Не эта картинка. Посмотри на рисунок ещё раз."));
      }
      return;
    }
    if (!selection) {
      setSelection(id);
      setFeedback(t(locale, "Now choose its match.", "Теперь выбери пару."));
      return;
    }
    if (id === selection) {
      setSelection(null);
      return;
    }
    attempt(selection, id);
  }

  function attempt(start: string, end: string) {
    const result = connectPictures(board.mode, stage, connections, start, end);
    if (result.accepted) {
      sound.play("correct");
      setConnections(result.connections);
      success();
    } else {
      sound.play("wrong");
      setFeedback(t(locale, "These do not match, or that space is already filled. Try another picture.",
        "Не подходит или это место уже занято. Попробуй другую картинку."));
      setSelection(null);
    }
  }

  function chooseCoordinate(x: number, y: number) {
    if (complete || board.mode !== "odd") return;
    setCursor({ x, y });
    if (insidePoint(stage.points[0], x, y)) {
      sound.play("correct");
      setConnections([["answer", "answer"]]);
      success();
    } else {
      sound.play("wrong");
      setFeedback(t(locale, "This one belongs with the others. Keep looking!", "Эта картинка подходит к остальным. Поищи ещё!"));
    }
  }

  function next(index: number) {
    setStageIndex(index);
    setConnections([]);
    setSelection(null);
    setFeedback("");
    pointerStart.current = null;
    setDragEnd(null);
    swallowClick.current = null;
    setCursor({ x: board.width / 2, y: board.height / 2 });
  }

  function label(item: BoardPoint, index: number) {
    // Never expose recovered names such as "Correct" as an answer-revealing
    // accessible label. Labels identify pictures in stable spatial order.
    if (board.mode === "couple") return item.label;
    return `${t(locale, item.id.startsWith("slot-") ? "Destination" : item.id === "sample" ? "Example" : "Picture",
      item.id.startsWith("slot-") ? "Место" : item.id === "sample" ? "Образец" : "Картинка")} ${index + 1}`;
  }

  return <section className="activity-layout kids-original">
    <p className="explanation">{instructions}</p>
    {!single && <p className="activity-note">{t(locale,
      "Click two pictures, or drag between them. Tab and Enter also work.",
      "Нажми на две картинки или проведи между ними. Также работают Tab и Enter.")}</p>}
    <div className="controls">
      <span>{t(locale, "Stage", "Задание")} {stageIndex + 1} / {board.stages.length}</span>
      <span>{t(locale, "Score", "Счёт")}: {score}</span>
      {sound.available && <label><input type="checkbox" checked={sound.enabled}
        onChange={event => sound.toggle(event.currentTarget.checked)} />
        {t(locale, "Game sounds", "Звуки игры")}</label>}
      <button className="button button-secondary" onClick={() => {
        if (onRestart) onRestart();
        else { next(0); setScore(0); }
      }}>
        {t(locale, "Start again", "Начать заново")}
      </button>
      <button className="button button-secondary" onClick={() => setCompanionPlaying((value) => !value)}>
        {t(locale, companionPlaying ? "Pause companion" : "Animate companion", companionPlaying ? "Остановить спутника" : "Оживить спутника")}
      </button>
    </div>
    <div className="kids-board" style={{ aspectRatio: `${board.width} / ${board.height}` }}
      tabIndex={board.mode === "odd" ? 0 : undefined}
      role={board.mode === "odd" ? "group" : undefined}
      aria-label={t(locale, "Original illustrated activity. Arrow keys move the crosshair; Enter chooses.", "Исходное задание. Стрелки перемещают прицел, Enter выбирает.")}
      onKeyDown={(event) => {
        if (board.mode !== "odd") return;
        const step = event.shiftKey ? 5 : 20;
        if (["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"].includes(event.key)) {
          event.preventDefault();
          setCursor((position) => ({
            x: Math.max(0, Math.min(board.width, position.x + (event.key === "ArrowLeft" ? -step : event.key === "ArrowRight" ? step : 0))),
            y: Math.max(0, Math.min(board.height, position.y + (event.key === "ArrowUp" ? -step : event.key === "ArrowDown" ? step : 0))),
          }));
        } else if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          chooseCoordinate(cursor.x, cursor.y);
        }
      }}
      onPointerDown={board.mode === "odd" ? (event) => {
        const rect = event.currentTarget.getBoundingClientRect();
        chooseCoordinate((event.clientX - rect.left) / rect.width * board.width,
          (event.clientY - rect.top) / rect.height * board.height);
      } : undefined}
      onPointerCancel={() => { pointerStart.current = null; setDragEnd(null); }}
      onPointerMove={(event) => {
        if (!pointerStart.current) return;
        const rect = event.currentTarget.getBoundingClientRect();
        setDragEnd({
          x: (event.clientX - rect.left) / rect.width * board.width,
          y: (event.clientY - rect.top) / rect.height * board.height,
        });
      }}
      onPointerUp={(event) => {
        const start = pointerStart.current;
        pointerStart.current = null;
        setDragEnd(null);
        if (!start) return;
        const rect = event.currentTarget.getBoundingClientRect();
        const x = (event.clientX - rect.left) / rect.width * board.width;
        const y = (event.clientY - rect.top) / rect.height * board.height;
        const end = stage.points.find((item) => item.id !== start && insidePoint(item, x, y));
        if (end) {
          swallowClick.current = start;
          attempt(start, end.id);
        }
      }}>
      <img src={mediaUrl(`${board.folder}/${stage.frame}.png`)} alt={t(locale, "Original MightyMatica illustrated lesson", "Исходное иллюстрированное задание MightyMatica")} draggable={false} />
      <svg viewBox={`0 0 ${board.width} ${board.height}`} className="kids-board-lines" aria-hidden="true">
        {dragEnd && pointerStart.current && board.mode !== "sort" && board.mode !== "place" && <line
          x1={point(pointerStart.current).x} y1={point(pointerStart.current).y}
          x2={dragEnd.x} y2={dragEnd.y} stroke="#172857" strokeWidth="5" />}
        {dragEnd && pointerStart.current && (board.mode === "sort" || board.mode === "place") && (() => {
          const source = point(pointerStart.current);
          const size = source.radius * 2;
          return <svg x={dragEnd.x - source.radius} y={dragEnd.y - source.radius}
            width={size} height={size}
            viewBox={`${source.x - source.radius} ${source.y - source.radius} ${size} ${size}`}
            opacity=".85">
            <image href={mediaUrl(`${board.folder}/${stage.frame}.png`)}
              width={board.width} height={board.height} />
          </svg>;
        })()}
        {connections.map(([a, b]) => {
          const start = point(a), end = point(b);
          if (!start || !end) return null;
          return <g key={`${a}-${b}`}>
            {!single && <line x1={start.x} y1={start.y} x2={end.x} y2={end.y} stroke="#172857" strokeWidth="5" />}
            <circle cx={end.x} cy={end.y} r="14" fill="#fff" stroke="#173a30" strokeWidth="3" />
            <text x={end.x} y={end.y + 6} textAnchor="middle" fontSize="19" fill="#173a30">✓</text>
          </g>;
        })}
        {board.mode === "odd" && !complete && <g stroke="#15264b" strokeWidth="3">
          <circle cx={cursor.x} cy={cursor.y} r="16" fill="#fff" fillOpacity=".65" />
          <path d={`M${cursor.x - 22},${cursor.y}h44 M${cursor.x},${cursor.y - 22}v44`} />
        </g>}
      </svg>
      {board.mode !== "odd" && stage.points.map((item, index) => <button
        key={item.id} type="button" className="kids-hotspot"
        aria-label={label(item, index)} title={label(item, index)}
        aria-pressed={selection === item.id}
        disabled={complete || piecesUsed.has(item.id) || targetsUsed.has(item.id)}
        style={{ left: `${item.x / board.width * 100}%`, top: `${item.y / board.height * 100}%`,
          width: `${item.radius * 2 / board.width * 100}%`, height: `${item.radius * 2 / board.height * 100}%` }}
        onPointerDown={(event) => {
          if (single || event.button !== 0) return;
          swallowClick.current = null;
          pointerStart.current = item.id;
          event.currentTarget.setPointerCapture(event.pointerId);
        }}
        onClick={() => {
          if (swallowClick.current === item.id) { swallowClick.current = null; return; }
          choose(item.id);
        }}>
        <span className="kids-hotspot-number">{piecesUsed.has(item.id) ? "✓" : index + 1}</span>
      </button>)}
    </div>
    <p className="activity-status" role="status">
      {complete ? t(locale, "Good job! Stage complete.", "Молодец! Задание выполнено.") : feedback || t(locale, "Choose a picture to begin.", "Выбери картинку, чтобы начать.")}
      {" "}{connections.length} / {stage.required}
    </p>
    {sound.failed && <p role="status">{t(locale, "Some game sounds could not be played.", "Некоторые звуки игры не удалось воспроизвести.")}</p>}
    {complete && !onComplete && <button className="button" onClick={() => {
      const index = stageIndex === board.stages.length - 1 ? 0 : stageIndex + 1;
      next(index);
      if (!index) setScore(0);
    }}>{t(locale, stageIndex === board.stages.length - 1 ? "Play again" : "Next stage",
      stageIndex === board.stages.length - 1 ? "Ещё раз" : "Следующее задание")}</button>}
    <div className="kids-companion"><OriginalCompanion playing={companionPlaying} reducedMotion={reducedMotion}
      label={t(locale, "Original Pythagoras companion", "Исходный персонаж Пифагор")} /></div>
  </section>;
}
