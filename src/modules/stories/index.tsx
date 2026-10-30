import { useCallback, useEffect, useRef, useState } from "react";
import type { PointerEvent } from "react";
import type { ActivityProps } from "../../shared/contracts";
import { mediaUrl, t } from "../../shared/contracts";
import films from "../../content/films.json";
import { createJigsawState, isJigsawComplete, jigsawGroup, moveJigsawGroup, snapJigsawGroup } from "../../shared/JigsawGroups";
import type { JigsawState } from "../../shared/JigsawGroups";
import { StoryFilm } from "./StoryFilm";
import StoryPresentation from "./StoryPresentation";
import "./stories.css";

const order = [7, 2, 5, 0, 8, 3, 6, 1, 4];
const letters = "ABCDEFGHI";
const starts = [[62, 363], [63, 71], [63, 220], [115, 100], [99, 331], [180, 88], [121, 214], [165, 353], [180, 244]];
const snowStarts = [[26, 330], [27, 38], [27, 187], [79, 67], [63, 298], [139, 45], [85, 181], [129, 320], [131, 204]];
const pictures: Record<string, { folder: string; first: number; alt: string; altRu: string; intro?: string; reward: string }> = {
  "stories-pinocchio": {
    folder: "Pinoc-game", first: 2, reward: "Pinoc1",
    alt: "Pinocchio and a black-and-white kitten in a workshop",
    altRu: "Пиноккио и чёрно-белый котёнок в мастерской",
  },
  "stories-prostokvashino": {
    folder: "Prosto-game", first: 2, reward: "Prosto5",
    alt: "A woman with glasses, a dog, a cat, and a man beside a car",
    altRu: "Женщина в очках, пёс, кот и мужчина возле машины",
  },
  "stories-snow-white": {
    folder: "Snowhite-game", first: 1, intro: "Snowpart-0", reward: "Snowpart-2",
    alt: "The seven dwarfs looking over a wooden staircase",
    altRu: "Семь гномов выглядывают из-за деревянной лестницы",
  },
};

export default function Stories(props: ActivityProps) {
  return <PicturePuzzle key={props.activityId} {...props} />;
}

function PicturePuzzle({ activityId, locale, reducedMotion }: ActivityProps) {
  const picture = pictures[activityId];
  const snow = activityId === "stories-snow-white";
  const [puzzle, setPuzzle] = useState(() => createJigsawState((snow ? snowStarts : starts).map(([x, y]) => ({ x, y }))));
  const [selected, setSelected] = useState<number | null>(null);
  const [preview, setPreview] = useState(false);
  const [completeArtReady, setCompleteArtReady] = useState(false);
  const [presentation, setPresentation] = useState(false);
  const [message, setMessage] = useState("");
  const stage = useRef<HTMLDivElement>(null);
  const drag = useRef<{ piece: number; pointer: number; owner: HTMLButtonElement; startX: number; startY: number; moved: boolean; state: JigsawState } | null>(null);
  const suppressClick = useRef(false);
  const [moving, setMoving] = useState<{ piece: number; state: JigsawState } | null>(null);
  const [phase, setPhase] = useState<"intro" | "puzzle" | "win" | "reward">(
    picture?.intro ? "intro" : "puzzle",
  );
  const cancelDrag = useCallback(() => {
    const active = drag.current;
    drag.current = null;
    suppressClick.current = false;
    setMoving(null);
    if (active?.owner.hasPointerCapture(active.pointer)) active.owner.releasePointerCapture(active.pointer);
  }, []);
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape" || !drag.current) return;
      event.preventDefault();
      cancelDrag();
    };
    const onVisibility = () => { if (document.hidden) cancelDrag(); };
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("blur", cancelDrag);
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("blur", cancelDrag);
      document.removeEventListener("visibilitychange", onVisibility);
      cancelDrag();
    };
  }, [cancelDrag]);
  if (!picture) return <p role="status">{t(locale, "This picture is not available.", "Эта картинка недоступна.")}</p>;
  const tileUrl = (piece: number) => mediaUrl(`stories/${picture.folder}/${picture.first + piece * 3}.jpg`);
  const label = (piece: number) => letters[order.indexOf(piece)];
  const position = (cell: number) => t(locale,
    `row ${Math.floor(cell / 3) + 1}, column ${cell % 3 + 1}`,
    `строка ${Math.floor(cell / 3) + 1}, столбец ${cell % 3 + 1}`);
  // XFL symbol registration differs: Snow White's larger bitmaps are scaled on stage.
  const origin = snow ? { x: 59.5 * .348968505859375, y: 52 * .34881591796875 } : { x: 59.5, y: 52 };
  const tileWidth = (piece: number) => snow ? (piece < 3 ? 344 : 345) * .348968505859375 : 119;
  const tileHeight = snow ? 257 * .34881591796875 : 89;
  const target = (piece: number) => ({
    x: (snow ? [262, 380, 496] : [298, 416, 531])[piece % 3] + (!snow && (piece === 5 || piece === 8) ? 1 : 0),
    y: (snow ? 137 : 170) + Math.floor(piece / 3) * 88,
  });
  const layout = Array.from({ length: 9 }, (_, piece) => ({
    row: Math.floor(piece / 3), column: piece % 3, homeX: target(piece).x, homeY: target(piece).y,
  }));
  const complete = isJigsawComplete(puzzle);
  const display = moving?.state ?? puzzle;
  const pictureLeft = Math.min(...display.positions.map(current => current.x - origin.x));
  const pictureTop = Math.min(...display.positions.map(current => current.y - origin.y));
  const pictureRight = Math.max(...display.positions.map((current, piece) => current.x - origin.x + tileWidth(piece)));
  const pictureBottom = Math.max(...display.positions.map(current => current.y - origin.y + tileHeight));

  function translate(state: JigsawState, piece: number, dx: number, dy: number) {
    const members = jigsawGroup(state, piece);
    const left = Math.min(...members.map(index => state.positions[index].x - origin.x));
    const top = Math.min(...members.map(index => state.positions[index].y - origin.y));
    const right = Math.max(...members.map(index => state.positions[index].x - origin.x + tileWidth(index)));
    const bottom = Math.max(...members.map(index => state.positions[index].y - origin.y + tileHeight));
    return moveJigsawGroup(state, piece, Math.max(-left, Math.min(600 - right, dx)), Math.max(-top, Math.min(420 - bottom, dy)));
  }

  function finishPiece(piece: number, state: JigsawState) {
    const next = translate(snapJigsawGroup(state, layout, piece, 20), piece, 0, 0);
    setPuzzle(next);
    setSelected(piece);
    setMessage(isJigsawComplete(next)
      ? t(locale, "Picture complete! Move it freely or watch your cartoon reward.", "Картинка собрана! Её можно двигать или посмотреть мультфильм.")
      : t(locale, "Matching neighbours join together. Move them as a group.", "Подходящие соседние части соединяются. Их можно двигать вместе."));
  }

  function pointerPosition(event: PointerEvent) {
    const bounds = stage.current!.getBoundingClientRect();
    return { x: (event.clientX - bounds.left) * 600 / bounds.width, y: (event.clientY - bounds.top) * 420 / bounds.height };
  }

  function startDrag(event: PointerEvent<HTMLButtonElement>, piece: number) {
    if (!event.isPrimary || event.button !== 0 || drag.current) return;
    const pointer = pointerPosition(event);
    drag.current = { piece, pointer: event.pointerId, owner: event.currentTarget, startX: pointer.x, startY: pointer.y, moved: false, state: puzzle };
    suppressClick.current = false;
    event.currentTarget.setPointerCapture(event.pointerId);
    setSelected(piece);
    setMoving({ piece, state: puzzle });
  }

  function moveDrag(event: PointerEvent<HTMLButtonElement>) {
    const active = drag.current;
    if (!active || active.pointer !== event.pointerId) return;
    const pointer = pointerPosition(event);
    active.moved ||= Math.hypot(pointer.x - active.startX, pointer.y - active.startY) > 3;
    setMoving({ piece: active.piece, state: translate(active.state, active.piece, pointer.x - active.startX, pointer.y - active.startY) });
  }

  function endDrag(event: PointerEvent<HTMLButtonElement>, cancelled = false) {
    const active = drag.current;
    if (!active || active.pointer !== event.pointerId) return;
    if (cancelled) { cancelDrag(); return; }
    drag.current = null;
    setMoving(null);
    suppressClick.current = active.moved;
    if (active.owner.hasPointerCapture(active.pointer)) active.owner.releasePointerCapture(active.pointer);
    if (!active.moved) return;
    const pointer = pointerPosition(event);
    finishPiece(active.piece, translate(active.state, active.piece, pointer.x - active.startX, pointer.y - active.startY));
  }

  function attempt(destination: number) {
    if (selected === null) {
      setMessage(t(locale, "Choose a piece first.", "Сначала выберите часть."));
      return;
    }
    finishPiece(selected, translate(puzzle, selected, target(destination).x - puzzle.positions[selected].x, target(destination).y - puzzle.positions[selected].y));
  }

  const filmKey = phase === "intro" ? picture.intro : phase === "reward" ? picture.reward : null;
  const film = films.find(entry => entry.key === filmKey);
  if (phase === "win" && complete) return <div className="activity-layout stories-puzzle">
    <StoryPresentation source={picture.folder} victory locale={locale} reducedMotion={reducedMotion} />
    <div className="controls">
      <button className="button" type="button" onClick={() => setPhase("reward")}>
        {t(locale, "Continue to cartoon", "Перейти к мультфильму")}
      </button>
      <button className="button button-secondary" type="button" onClick={() => setPhase("puzzle")}>
        {t(locale, "Return to picture", "Вернуться к картинке")}
      </button>
    </div>
  </div>;
  if (film) return <div className="activity-layout stories-puzzle">
    <StoryFilm key={film.key} src={mediaUrl(film.src)} locale={locale}
      title={phase === "intro" ? t(locale, "Before the picture", "Перед сборкой картинки") : t(locale, "Picture complete — your cartoon reward", "Картинка собрана — ваш мультфильм")}
      description={phase === "intro"
        ? t(locale, "Watch the original introduction, or skip ahead to assemble the picture.", "Посмотрите оригинальное вступление или сразу переходите к сборке картинки.")
        : t(locale, "All nine pieces are in place. Watch the original reward cartoon, or return to your completed picture.", "Все девять частей на месте. Посмотрите оригинальный мультфильм-награду или вернитесь к собранной картинке.")}
      audio={film.audio}
      onContinue={() => setPhase("puzzle")}
    />
  </div>;

  return <div className="activity-layout stories-puzzle">
    <p>{t(locale,
      "Drag pieces anywhere. Matching neighbours join and move together. You can also use Tab and Enter to choose a piece and a square, or arrow keys to move a piece or group.",
      "Перетаскивайте части свободно. Подходящие соседи соединяются и двигаются вместе. Можно выбрать часть и клетку с помощью Tab и Enter или двигать часть и группу стрелками.")}</p>
    <div className="controls">
      <button className="button button-secondary" type="button" aria-pressed={preview} onClick={() => setPreview(!preview)}>
        {preview ? t(locale, "Hide reference", "Скрыть образец") : t(locale, "Show reference", "Показать образец")}
      </button>
      <button className="button button-secondary" type="button" onClick={() => {
        cancelDrag();
        setPresentation(false);
        setPuzzle(createJigsawState((snow ? snowStarts : starts).map(([x, y]) => ({ x, y })))); setSelected(null); setPhase(picture.intro ? "intro" : "puzzle");
        setMessage(t(locale, "Puzzle restarted.", "Игра начата заново."));
      }}>{t(locale, "Start again", "Начать заново")}</button>
      {picture.intro && <button className="button button-secondary" type="button" onClick={() => setPhase("intro")}>
        {t(locale, "Watch introduction", "Посмотреть вступление")}
      </button>}
      {complete && <button className="button" type="button" onClick={() => setPhase("win")}>
        {t(locale, "Watch cartoon reward", "Посмотреть мультфильм-награду")}
      </button>}
    </div>
    <p className="activity-status" role="status" aria-live="polite">
      {complete ? t(locale, "Picture complete! All nine pieces fit.", "Картинка собрана! Все девять частей на месте.") :
        message || t(locale, "Join matching pieces anywhere on the stage.", "Соединяйте подходящие части в любом месте поля.")}
    </p>
    <div ref={stage} className={`stories-stage${complete && completeArtReady ? " stories-stage-complete" : ""}`} aria-label={t(locale, "Picture puzzle", "Собери картинку")}>
        {complete && <img
          className="stories-complete-picture"
          src={mediaUrl(`stories/${picture.folder}/36.jpg`)}
          alt="" draggable={false}
          onLoad={() => setCompleteArtReady(true)}
          onError={() => setCompleteArtReady(false)}
          style={{
            left: `${pictureLeft / 6}%`, top: `${pictureTop / 4.2}%`,
            width: `${(pictureRight - pictureLeft) / 6}%`, height: `${(pictureBottom - pictureTop) / 4.2}%`,
            visibility: completeArtReady ? "visible" : "hidden",
          }}
        />}
          {Array.from({ length: 9 }, (_, cell) => <button
            key={cell} type="button" className="stories-cell"
            style={{ left: `${(target(cell).x - origin.x) / 6}%`, top: `${(target(cell).y - origin.y) / 4.2}%`, width: `${tileWidth(cell) / 6}%`, height: `${tileHeight / 4.2}%` }}
            aria-label={t(locale, `Place selected piece: ${position(cell)}`, `Поставить выбранную часть: ${position(cell)}`)}
            onClick={() => attempt(cell)}
          >
          </button>)}
        {order.map(piece => {
          const current = display.positions[piece];
          return <button key={`piece-${piece}`} type="button"
          className="stories-piece"
          style={{ left: `${(current.x - origin.x) / 6}%`, top: `${(current.y - origin.y) / 4.2}%`, width: `${tileWidth(piece) / 6}%`, height: `${tileHeight / 4.2}%`, zIndex: moving && jigsawGroup(display, moving.piece).includes(piece) ? 30 : selected !== null && jigsawGroup(display, selected).includes(piece) ? 20 : 10 }}
          aria-pressed={selected === piece}
          aria-label={t(locale, `Piece ${label(piece)}, ${jigsawGroup(display, piece).length} pieces in group`, `Часть ${label(piece)}, частей в группе: ${jigsawGroup(display, piece).length}`)}
          onClick={event => {
            const suppress = suppressClick.current && event.detail !== 0;
            suppressClick.current = false;
            if (suppress) return;
            setSelected(piece);
            setMessage(t(locale, `Piece ${label(piece)} selected. Choose its square.`, `Выбрана часть ${label(piece)}. Выберите клетку.`));
          }}
          onPointerDown={event => startDrag(event, piece)}
          onPointerMove={moveDrag}
          onPointerUp={event => endDrag(event)}
          onPointerCancel={event => endDrag(event, true)}
          onLostPointerCapture={event => endDrag(event, true)}
          onKeyDown={event => {
            const offsets: Record<string, readonly number[]> = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] };
            const offset = offsets[event.key];
            if (!offset || drag.current) return;
            event.preventDefault();
            const step = event.shiftKey ? 1 : 5;
            finishPiece(piece, translate(puzzle, piece, offset[0] * step, offset[1] * step));
          }}
        >
          <img src={tileUrl(piece)} alt="" draggable={false} />
        </button>; })}
    </div>
    {preview && <figure className="stories-reference">
      <figcaption>{t(locale, "Reference picture", "Образец")}</figcaption>
      <img src={mediaUrl(`stories/${picture.folder}/36.jpg`)} alt={t(locale, picture.alt, picture.altRu)} />
    </figure>}
    <section>
      <button type="button" className="button button-secondary" aria-expanded={presentation} onClick={() => setPresentation(value => !value)}>
        {presentation ? t(locale, "Close animation", "Закрыть анимацию") : t(locale, "View original introduction", "Открыть оригинальную заставку")}
      </button>
      {presentation && <StoryPresentation source={picture.folder} victory={false} locale={locale} reducedMotion={reducedMotion} />}
    </section>
    <p className="activity-note">{t(locale,
      "Cartoon artwork belongs to its respective creators.",
      "Права на иллюстрации принадлежат их авторам.")}</p>
  </div>;
}
