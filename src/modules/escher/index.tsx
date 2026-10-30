import { useEffect, useRef, useState } from "react";
import { mediaUrl, t, type ActivityProps } from "../../shared/contracts";
import { artworks } from "./manifest";
import { neighbors, originalDeal, shuffle, slide, solvedBoard } from "./rules";
import "./style.css";
import TimelinePlayer from "./TimelinePlayer";
import { timelines } from "./timelines";
import GameTimeline from "./GameTimeline";
import {
  createJigsawState,
  isJigsawComplete,
  jigsawGroup,
  moveJigsawGroup,
  snapJigsawGroup,
  type JigsawState,
} from "../../shared/JigsawGroups";
import type { PointerEvent } from "react";

export default function Escher(props: ActivityProps) {
  const timeline = timelines.find((item) => item.id === props.activityId);
  if (timeline)
    return (
      <TimelinePlayer key={props.activityId} {...props} timeline={timeline} />
    );
  return props.activityId === "escher-sliding-4" ? (
    <Activity key={props.activityId} {...props} />
  ) : (
    <Picture key={props.activityId} {...props} />
  );
}

// Original ActionScript registrations; XFL symbols use (-59.5,-52), except stairs.
const commonStarts = [
  [62, 363],
  [63, 71],
  [63, 220],
  [115, 100],
  [99, 331],
  [180, 88],
  [121, 214],
  [165, 353],
  [180, 244],
];
const stages: Record<
  string,
  {
    width: number;
    height: number;
    originX?: number;
    originY?: number;
    scale?: number;
    starts: number[][];
    homes: number[][];
  }
> = {
  BandF: {
    width: 134,
    height: 133,
    starts: [
      [62, 337],
      [63, 55],
      [63, 198],
      [88, 73],
      [83, 322],
      [125, 64],
      [91, 233],
      [125, 214],
      [117, 322],
    ],
    homes: [
      [262, 67],
      [393, 67],
      [525, 67],
      [262, 199],
      [394, 199],
      [526, 198],
      [262, 331],
      [394, 332],
      [526, 331],
    ],
  },
  faces: {
    width: 120,
    height: 89,
    starts: commonStarts,
    homes: [
      [299, 177],
      [414, 177],
      [529, 177],
      [300, 260],
      [416, 260],
      [530, 260],
      [300, 343],
      [416, 343],
      [531, 343],
    ],
  },
  hands: {
    width: 118,
    height: 95,
    starts: commonStarts,
    homes: [
      [301, 146],
      [418, 147],
      [532, 147],
      [300, 240],
      [416, 241],
      [532, 241],
      [300, 336],
      [416, 336],
      [532, 336],
    ],
  },
  lizards: {
    width: 119,
    height: 104,
    starts: [
      [62, 363],
      [63, 71],
      [63, 220],
      [115, 100],
      [99, 331],
      [175, 78],
      [121, 214],
      [165, 353],
      [167, 237],
    ],
    homes: [
      [301, 133],
      [419, 133],
      [535, 133],
      [302, 235],
      [418, 235],
      [534, 235],
      [302, 338],
      [418, 338],
      [535, 338],
    ],
  },
  stairbig: {
    width: 118,
    height: 110,
    starts: [
      [62, 363],
      [63, 71],
      [63, 220],
      [115, 100],
      [99, 331],
      [175, 78],
      [121, 214],
      [165, 353],
      [167, 237],
    ],
    homes: [
      [298, 134],
      [415, 134],
      [532, 134],
      [299, 243],
      [416, 243],
      [532, 243],
      [299, 351],
      [416, 351],
      [533, 351],
    ],
  },
  stairs: {
    width: 94,
    height: 114,
    originX: 46.5,
    originY: 57,
    starts: [
      [46, 343],
      [142, 225],
      [48, 95],
      [142, 109],
      [142, 343],
      [237, 111],
      [47, 225],
      [237, 226],
      [239, 343],
    ],
    homes: [
      [353, 113],
      [444, 113],
      [536, 113],
      [353, 225],
      [444, 225],
      [537, 225],
      [353, 334],
      [445, 334],
      [536, 334],
    ],
  },
  waterfall: {
    width: 131,
    height: 171,
    scale: 0.8258209228515625,
    starts: [
      [54, 66],
      [52, 385],
      [54, 224],
      [101, 214],
      [110, 55],
      [176, 203],
      [99, 371],
      [195, 47],
      [174, 357],
    ],
    homes: [
      [318, 54],
      [425, 55],
      [531, 55],
      [318, 195],
      [424, 195],
      [530, 195],
      [318, 335],
      [424, 334],
      [530, 333],
    ],
  },
};

function Picture({ activityId, locale, reducedMotion }: ActivityProps) {
  const artwork =
    artworks.find(([key]) => activityId === `escher-${key.toLowerCase()}`) ??
    artworks[0];
  const source = stages[artwork[0]]!;
  const scale = source.scale ?? 1;
  const width = source.width * scale,
    height = source.height * scale;
  const originX = (source.originX ?? 59.5) * scale,
    originY = (source.originY ?? 52) * scale;
  const stageHeight = artwork[0] === "waterfall" ? 550 : 420;
  const layout = source.homes.map(([x, y], piece) => ({
    row: Math.floor(piece / 3),
    column: piece % 3,
    homeX: x!,
    homeY: y!,
  }));
  const [puzzle, setPuzzle] = useState(() =>
    createJigsawState(source.starts.map(([x, y]) => ({ x: x!, y: y! }))),
  );
  const [moving, setMoving] = useState<{
    piece: number;
    state: JigsawState;
  } | null>(null);
  const [selected, setSelected] = useState<number | null>(null);
  const [preview, setPreview] = useState(false);
  const [completeArtReady, setCompleteArtReady] = useState(false);
  const [celebrationHost, setCelebrationHost] = useState<HTMLDivElement | null>(null);
  const [sound, setSound] = useState(true);
  const audio = useRef<HTMLAudioElement | null>(null);
  const stage = useRef<HTMLDivElement>(null);
  const suppressClick = useRef(false);
  const drag = useRef<{
    piece: number;
    pointer: number;
    x: number;
    y: number;
    moved: boolean;
    state: JigsawState;
    element: HTMLButtonElement;
  } | null>(null);
  const tr = (en: string, ru: string) => t(locale, en, ru);
  const display = moving?.state ?? puzzle;
  const complete = isJigsawComplete(puzzle);
  function cancelDrag() {
    const active = drag.current;
    drag.current = null;
    suppressClick.current = false;
    setMoving(null);
    if (active?.element.hasPointerCapture(active.pointer))
      active.element.releasePointerCapture(active.pointer);
  }
  useEffect(() => {
    const hidden = () => {
      if (document.hidden) {
        cancelDrag();
      }
    };
    const escape = (event: KeyboardEvent) => {
      if (event.key === "Escape") cancelDrag();
    };
    document.addEventListener("visibilitychange", hidden);
    document.addEventListener("keydown", escape);
    window.addEventListener("blur", cancelDrag);
    return () => {
      audio.current?.pause();
      const active = drag.current;
      drag.current = null;
      if (active?.element.hasPointerCapture(active.pointer))
        active.element.releasePointerCapture(active.pointer);
      document.removeEventListener("visibilitychange", hidden);
      document.removeEventListener("keydown", escape);
      window.removeEventListener("blur", cancelDrag);
    };
  }, []);
  function translate(
    state: JigsawState,
    piece: number,
    dx: number,
    dy: number,
  ) {
    const members = jigsawGroup(state, piece);
    const left = Math.min(
      ...members.map((index) => state.positions[index]!.x - originX),
    );
    const top = Math.min(
      ...members.map((index) => state.positions[index]!.y - originY),
    );
    const right = Math.max(
      ...members.map((index) => state.positions[index]!.x - originX + width),
    );
    const bottom = Math.max(
      ...members.map((index) => state.positions[index]!.y - originY + height),
    );
    return moveJigsawGroup(
      state,
      piece,
      Math.max(-left, Math.min(600 - right, dx)),
      Math.max(-top, Math.min(stageHeight - bottom, dy)),
    );
  }
  function finish(piece: number, state: JigsawState) {
    const next = translate(
      snapJigsawGroup(state, layout, piece, 20),
      piece,
      0,
      0,
    );
    setPuzzle(next);
    setSelected(piece);
    if (
      sound &&
      !isJigsawComplete(next) &&
      next.groups.some((group, index) => group !== puzzle.groups[index])
    ) {
      audio.current?.pause();
      audio.current = new Audio(mediaUrl("escher/Shortbang.mp3"));
      void audio.current.play().catch(() => {});
    }
  }
  function point(event: PointerEvent<HTMLButtonElement>) {
    const bounds = stage.current!.getBoundingClientRect();
    return {
      x: ((event.clientX - bounds.left) * 600) / bounds.width,
      y: ((event.clientY - bounds.top) * stageHeight) / bounds.height,
    };
  }
  function end(event: PointerEvent<HTMLButtonElement>, cancelled = false) {
    const active = drag.current;
    if (!active || active.pointer !== event.pointerId) return;
    const pointer = point(event);
    cancelDrag();
    suppressClick.current = !cancelled && active.moved;
    if (!cancelled && active.moved)
      finish(
        active.piece,
        translate(
          active.state,
          active.piece,
          pointer.x - active.x,
          pointer.y - active.y,
        ),
      );
  }
  const image = (piece: number) => (
    <img
      src={mediaUrl(`escher/${artwork[0]}/${piece}.jpg`)}
      alt=""
      draggable={false}
    />
  );
  const movingMembers = moving ? jigsawGroup(display, moving.piece) : [];
  const selectedMembers =
    selected === null ? [] : jigsawGroup(display, selected);
  const pictureLeft = Math.min(...display.positions.map(position => position.x - originX));
  const pictureTop = Math.min(...display.positions.map(position => position.y - originY));
  const pictureRight = Math.max(...display.positions.map(position => position.x - originX + width));
  const pictureBottom = Math.max(...display.positions.map(position => position.y - originY + height));
  return (
    <div className={`activity-layout escher-activity escher-art-${artwork[0]}`}>
      <p>
        {tr(
          "Drag pieces freely. Matching neighbours snap together and move as a group. Use arrow keys to move a focused piece or group; Shift makes smaller steps.",
          "Перетаскивайте фрагменты свободно. Подходящие соседи соединяются и двигаются вместе. Стрелки двигают выбранный фрагмент или группу; Shift уменьшает шаг.",
        )}
      </p>
      <div className="controls">
        {!complete && <label className="control">
          <input
            type="checkbox"
            checked={sound}
            onChange={(event) => {
              setSound(event.target.checked);
              if (!event.target.checked) audio.current?.pause();
            }}
          />
          {tr("Original move sound", "Оригинальный звук хода")}
        </label>}
        <button
          className="button button-secondary"
          onClick={() => {
            cancelDrag();
            suppressClick.current = false;
            setSelected(null);
            setPuzzle(
              createJigsawState(
                source.starts.map(([x, y]) => ({ x: x!, y: y! })),
              ),
            );
          }}
        >
          {tr("Reset", "Сначала")}
        </button>
        <label className="control">
          <input
            type="checkbox"
            checked={preview}
            onChange={(event) => setPreview(event.target.checked)}
          />
          {tr("Show reference", "Показать образец")}
        </label>
      </div>
      <div
        ref={stage}
        className={`escher-stage${complete && completeArtReady ? " escher-stage-complete" : ""}`}
        style={{ aspectRatio: `600 / ${stageHeight}` }}
        role="group"
        aria-label={tr("Picture puzzle", "Собери картину")}
      >
        {layout.map((home, index) => (
          <button
            key={`target-${index}`}
            className="escher-target"
            style={{
              left: `${(home.homeX - originX) / 6}%`,
              top: `${((home.homeY - originY) / stageHeight) * 100}%`,
              width: `${width / 6}%`,
              height: `${(height / stageHeight) * 100}%`,
            }}
            aria-label={tr(
              `Place selected piece: row ${home.row + 1}, column ${home.column + 1}`,
              `Поставить выбранный фрагмент: ряд ${home.row + 1}, столбец ${home.column + 1}`,
            )}
            onClick={() => {
              if (selected !== null)
                finish(
                  selected,
                  translate(
                    puzzle,
                    selected,
                    home.homeX - puzzle.positions[selected]!.x,
                    home.homeY - puzzle.positions[selected]!.y,
                  ),
                );
            }}
          />
        ))}
        {complete && <img
          className="escher-complete-picture"
          src={mediaUrl(`escher/${artwork[0]}/complete.jpg`)}
          alt=""
          draggable={false}
          onLoad={() => setCompleteArtReady(true)}
          onError={() => setCompleteArtReady(false)}
          style={{
            left: `${pictureLeft / 6}%`,
            top: `${pictureTop / stageHeight * 100}%`,
            width: `${(pictureRight - pictureLeft) / 6}%`,
            height: `${(pictureBottom - pictureTop) / stageHeight * 100}%`,
            visibility: completeArtReady ? "visible" : "hidden",
          }}
        />}
        {complete && <div ref={setCelebrationHost} className="escher-celebration-host"
          style={{
            left: `${pictureLeft / 6}%`, top: `${pictureTop / stageHeight * 100}%`,
            width: `${(pictureRight - pictureLeft) / 6}%`, height: `${(pictureBottom - pictureTop) / stageHeight * 100}%`,
          }} />}
        {source.starts.map((_, piece) => {
          const position = display.positions[piece]!;
          return (
            <button
              key={piece}
              className={`escher-stage-piece${movingMembers.includes(piece) ? " escher-stage-moving" : ""}`}
              style={{
                left: `${(position.x - originX) / 6}%`,
                top: `${((position.y - originY) / stageHeight) * 100}%`,
                width: `${width / 6}%`,
                height: `${(height / stageHeight) * 100}%`,
                zIndex: movingMembers.includes(piece)
                  ? 30
                  : selectedMembers.includes(piece)
                    ? 20
                    : 10,
              }}
              aria-pressed={selected === piece}
              aria-label={tr(
                `Piece ${piece + 1}, ${jigsawGroup(display, piece).length} pieces in group`,
                `Фрагмент ${piece + 1}, частей в группе: ${jigsawGroup(display, piece).length}`,
              )}
              onClick={(event) => {
                if (suppressClick.current && event.detail !== 0) {
                  suppressClick.current = false;
                  return;
                }
                suppressClick.current = false;
                setSelected(piece);
              }}
              onPointerDown={(event) => {
                if (!event.isPrimary || event.button !== 0 || drag.current)
                  return;
                const pointer = point(event);
                drag.current = {
                  piece,
                  pointer: event.pointerId,
                  x: pointer.x,
                  y: pointer.y,
                  moved: false,
                  state: puzzle,
                  element: event.currentTarget,
                };
                suppressClick.current = false;
                setSelected(piece);
                event.currentTarget.setPointerCapture(event.pointerId);
              }}
              onPointerMove={(event) => {
                const active = drag.current;
                if (!active || active.pointer !== event.pointerId) return;
                const pointer = point(event);
                active.moved ||=
                  Math.hypot(pointer.x - active.x, pointer.y - active.y) > 3;
                if (active.moved)
                  setMoving({
                    piece: active.piece,
                    state: translate(
                      active.state,
                      active.piece,
                      pointer.x - active.x,
                      pointer.y - active.y,
                    ),
                  });
              }}
              onPointerUp={(event) => end(event)}
              onPointerCancel={(event) => end(event, true)}
              onLostPointerCapture={(event) => end(event, true)}
              onKeyDown={(event) => {
                const offsets: Record<string, number[]> = {
                  ArrowLeft: [-1, 0],
                  ArrowRight: [1, 0],
                  ArrowUp: [0, -1],
                  ArrowDown: [0, 1],
                };
                const offset = offsets[event.key];
                if (!offset || drag.current) return;
                event.preventDefault();
                const step = event.shiftKey ? 1 : 5;
                finish(
                  piece,
                  translate(
                    puzzle,
                    piece,
                    offset[0]! * step,
                    offset[1]! * step,
                  ),
                );
              }}
            >
              {image(piece)}
            </button>
          );
        })}
      </div>
      {preview && (
        <div
          className="escher-board escher-reference"
          aria-label={tr("Complete reference picture", "Образец картины")}
        >
          {source.starts.map((_, index) => (
            <div key={index}>{image(index)}</div>
          ))}
        </div>
      )}
      <p className="activity-note">
        {tr("Artwork: M. C. Escher", "Картина: М. К. Эшер")}
      </p>
      <p className="activity-status" role="status">
        {complete
          ? tr(
              "Complete! You can still move the whole picture.",
              "Готово! Собранную картину можно двигать.",
            )
          : tr(
              "Join matching pieces anywhere on the stage.",
              "Соединяйте подходящие части в любом месте поля.",
            )}
      </p>
      <GameTimeline
        artwork={artwork[0]}
        locale={locale}
        complete={complete}
        reducedMotion={reducedMotion}
        stageTarget={celebrationHost}
        sound={sound}
        onSoundChange={setSound}
      />
    </div>
  );
}

function Activity({ locale }: ActivityProps) {
  const [size, setSize] = useState(2);
  const [board, setBoard] = useState(() => originalDeal(2, true));
  const [initial, setInitial] = useState(board);
  const [moves, setMoves] = useState(0);
  const [sound, setSound] = useState(true);
  const [colors, setColors] = useState(true);
  const audio = useRef<HTMLAudioElement | null>(null);
  const tr = (en: string, ru: string) => t(locale, en, ru);
  useEffect(() => {
    return () => {
      audio.current?.pause();
    };
  }, []);
  function move(index: number) {
    const next = slide(board, index, size);
    if (!next) return;
    setBoard(next);
    setMoves((count) => count + 1);
    if (sound) {
      audio.current?.pause();
      const solved = next.every((tile, position) => tile === solvedBoard(size)[position]);
      audio.current = new Audio(mediaUrl(
        solved ? "escher/audio/Sliding-4/107.mp3" : "escher/Shortbang.mp3",
      ));
      void audio.current.play().catch(() => {});
    }
  }
  function start(nextSize = size) {
    const next = shuffle(nextSize, nextSize * nextSize * 12);
    setSize(nextSize);
    setInitial(next);
    setBoard(next);
    setMoves(0);
  }
  function startOriginal(nextSize = size, nextColors = colors) {
    const next = originalDeal(nextSize, nextColors);
    setSize(nextSize);
    setColors(nextColors);
    setInitial(next);
    setBoard(next);
    setMoves(0);
  }
  return (
    <div className="activity-layout escher-activity">
      <p>
        {tr(
          "Put the numbers in order, with the empty square at the bottom right. Tap an adjacent tile, or use arrow keys on the board to move the empty square.",
          "Расположите числа по порядку, оставив пустую клетку справа внизу. Нажимайте соседние плитки или перемещайте пустую клетку стрелками на поле.",
        )}
      </p>
      <div className="controls">
        <label className="control">
          <input
            type="checkbox"
            checked={sound}
            onChange={(event) => {
              setSound(event.target.checked);
              if (!event.target.checked) audio.current?.pause();
            }}
          />
          {tr("Original move sound", "Оригинальный звук хода")}
        </label>
        <label className="control">
          {tr("Board", "Поле")}{" "}
          <select
            value={size}
            onChange={(event) => startOriginal(Number(event.target.value))}
          >
            {[2, 3, 4, 5].map((value) => (
              <option key={value} value={value}>
                {value} × {value}
              </option>
            ))}
          </select>
        </label>
        <button className="button" onClick={() => start()}>
          {tr("New shuffle", "Перемешать")}
        </button>
        <button
          className="button button-secondary"
          onClick={() => startOriginal()}
        >
          {tr("Original starting arrangement", "Оригинальная расстановка")}
        </button>
        {size < 5 && (
          <label className="control">
            <input
              type="checkbox"
              checked={colors}
              onChange={(event) => startOriginal(size, event.target.checked)}
            />
            {tr("Original tile colors", "Оригинальные цвета плиток")}
          </label>
        )}
        <button
          className="button button-secondary"
          onClick={() => {
            setBoard([...initial]);
            setMoves(0);
          }}
        >
          {tr("Reset", "Сначала")}
        </button>
      </div>
      <div
        className="escher-board escher-number-board"
        style={{ gridTemplateColumns: `repeat(${size}, 1fr)` }}
        tabIndex={0}
        role="group"
        aria-label={tr("Sliding puzzle", "Пятнашки")}
        onKeyDown={(event) => {
          const blank = board.indexOf(0);
          const destination = {
            ArrowUp: blank - size,
            ArrowDown: blank + size,
            ArrowLeft: blank - 1,
            ArrowRight: blank + 1,
          }[event.key];
          if (destination !== undefined) {
            event.preventDefault();
            move(destination);
          }
        }}
      >
        {board.map((tile, index) => (
          <button
            key={index}
            className={tile === 0 ? "escher-empty" : ""}
            style={
              colors && size < 5 && tile
                ? {
                    background: (size === 2
                      ? ["#0000ff", "#00ff00", "#ffff00"]
                      : [
                          "#0000ff",
                          "#00ff00",
                          "#660000",
                          "#ff0000",
                          "#ffff00",
                          "#ff00ff",
                          "#ff6666",
                          "#666666",
                          "#0000ff",
                          "#00ff00",
                          "#ff6666",
                          "#ff00ff",
                          "#ff0000",
                          "#ffff00",
                          "#666666",
                        ])[tile - 1],
                    color: "#fff",
                    textShadow: "1px 1px 2px #000, -1px -1px 2px #000",
                  }
                : undefined
            }
            disabled={
              tile === 0 || !neighbors(board.indexOf(0), size).includes(index)
            }
            onClick={() => move(index)}
            aria-label={
              tile === 0
                ? tr("Empty", "Пусто")
                : `${tr("Tile", "Плитка")} ${tile}`
            }
          >
            {tile || ""}
          </button>
        ))}
      </div>
      <p className="activity-status" role="status">
        {board.every((tile, index) => tile === solvedBoard(size)[index])
          ? tr("Complete! Well done.", "Готово! Отлично.")
          : `${tr("Moves", "Ходов")}: ${moves}`}
      </p>
    </div>
  );
}
