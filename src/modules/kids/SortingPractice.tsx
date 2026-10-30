import { useRef, useState } from "react";
import type { ActivityProps } from "../../shared/contracts";
import { t } from "../../shared/contracts";
import { groupsFor, placeFigure, roundFigures } from "./rules";
import type { Figure, SortRule } from "./rules";
import "./kids.css";

const words: Record<string, [string, string]> = {
  pink: ["Pink", "Розовый"], blue: ["Blue", "Синий"],
  circle: ["Circle", "Круг"], square: ["Square", "Квадрат"],
  triangle: ["Triangle", "Треугольник"], small: ["Small", "Маленький"],
  large: ["Large", "Большой"],
};

function FigureIcon({ figure }: { figure: Figure }) {
  const radius = figure.size === "large" ? 32 : 16;
  const fill = figure.color === "pink" ? "#ff00cc" : "#0000ff";
  return <svg viewBox="0 0 84 84" aria-hidden="true" className="kids-figure">
    <g fill={fill} stroke="#182a47" strokeWidth="2">
      {figure.shape === "circle" ? <circle cx="42" cy="42" r={radius} />
        : figure.shape === "square" ? <rect x={42 - radius} y={42 - radius} width={radius * 2} height={radius * 2} rx="2" />
          : <path d={`M42 ${42 - radius} L${42 + radius} ${42 + radius} L${42 - radius} ${42 + radius} Z`} />}
    </g>
  </svg>;
}

export default function SortingPractice(props: ActivityProps) {
  return <Sorting key={props.activityId} {...props} />;
}

function Sorting({ activityId, locale }: ActivityProps) {
  const rule: SortRule = activityId === "kids-share-color" ? "color" : activityId === "kids-share-size" ? "size" : "shape";
  const [round, setRound] = useState(0);
  const [placed, setPlaced] = useState<readonly string[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [feedback, setFeedback] = useState("");
  const pointerFigure = useRef<string | null>(null);
  const droppedFigure = useRef<string | null>(null);
  const figures = roundFigures(round);
  const complete = placed.length === figures.length;
  const word = (value: string) => {
    const pair = words[value] ?? [value, value];
    return t(locale, pair[0], pair[1]);
  };
  const figureLabel = (figure: Figure) => [figure.size, figure.color, figure.shape].map(word).join(" · ");

  function place(id: string | null, group: string) {
    if (!id) {
      setFeedback(t(locale, "Choose a figure first.", "Сначала выбери фигуру."));
      return;
    }
    const result = placeFigure(rule, round, placed, id, group);
    if (result.accepted) {
      setPlaced(result.placed);
      setSelected(null);
      setFeedback(t(locale, "Yes! That figure belongs here.", "Верно! Эта фигура подходит."));
    } else {
      setFeedback(t(locale, "Not this group. Try again!", "Не эта группа. Попробуй ещё!"));
    }
  }

  function restart(nextRound = 0) {
    setRound(nextRound);
    setPlaced([]);
    setSelected(null);
    setFeedback("");
    pointerFigure.current = null;
    droppedFigure.current = null;
  }

  return <section className="activity-layout kids-sorting" aria-label={t(locale, "Figure sorting", "Сортировка фигур")}>
    <p className="explanation">{t(locale,
      "Choose a figure, then choose its group. You can also drag from a figure to a group. With a keyboard, use Tab and Enter.",
      "Выбери фигуру, затем её группу. Можно перетащить фигуру в группу. С клавиатуры используй Tab и Enter.")}</p>
    <div className="controls">
      <span>{t(locale, "Round", "Задание")} {round + 1} / 3</span>
      <button className="button button-secondary" onClick={() => restart()}>{t(locale, "Start again", "Начать заново")}</button>
    </div>
    <div className="kids-pieces" aria-label={t(locale, "Figures to sort", "Фигуры для сортировки")}
      onPointerUp={(event) => {
        const id = pointerFigure.current;
        pointerFigure.current = null;
        if (!id) return;
        const destination = document.elementFromPoint(event.clientX, event.clientY)?.closest<HTMLElement>("[data-kids-group]");
        if (destination?.dataset.kidsGroup) {
          droppedFigure.current = id;
          place(id, destination.dataset.kidsGroup);
        }
      }}
      onPointerCancel={() => { pointerFigure.current = null; }}>
      {figures.map((figure) => <button key={figure.id} type="button"
        className="kids-piece" disabled={placed.includes(figure.id)}
        aria-label={figureLabel(figure)} aria-pressed={selected === figure.id}
        onClick={() => {
          // Pointer capture retargets the post-drag click back to this button.
          if (droppedFigure.current === figure.id) {
            droppedFigure.current = null;
            return;
          }
          setSelected(figure.id);
          setFeedback("");
        }}
        onPointerDown={(event) => {
          if (event.button !== 0) return;
          droppedFigure.current = null;
          pointerFigure.current = figure.id;
          event.currentTarget.setPointerCapture(event.pointerId);
        }}>
        <FigureIcon figure={figure} />
        <span>{placed.includes(figure.id) ? t(locale, "Sorted ✓", "Готово ✓") : figureLabel(figure)}</span>
      </button>)}
    </div>
    <p className="kids-selection">{selected
      ? `${t(locale, "Selected", "Выбрано")}: ${figureLabel(figures.find((figure) => figure.id === selected)!)}`
      : t(locale, "Pick any unsorted figure.", "Выбери любую свободную фигуру.")}</p>
    <div className="kids-groups">
      {groupsFor(rule, round).map((group) => <button key={group} type="button"
        className="kids-group" data-kids-group={group} disabled={complete}
        onClick={() => place(selected, group)}>
        <strong>{word(group)}</strong>
        <span className="kids-sorted-icons">{figures.filter((figure) => placed.includes(figure.id) && figure[rule] === group).map((figure) =>
          <FigureIcon key={figure.id} figure={figure} />)}</span>
        <span>{figures.filter((figure) => placed.includes(figure.id) && figure[rule] === group).length} {t(locale, "sorted", "готово")}</span>
      </button>)}
    </div>
    <p role="status" className="activity-status">{complete
      ? t(locale, round === 2 ? "All three rounds complete. Good job!" : "Good job! Every figure is in its group.",
        round === 2 ? "Все три задания выполнены. Молодец!" : "Молодец! Все фигуры на своих местах.")
      : `${placed.length} / ${figures.length} · ${feedback || t(locale, "Ready to sort.", "Можно начинать.")}`}</p>
    {complete && <button className="button" onClick={() => restart(round === 2 ? 0 : round + 1)}>
      {t(locale, round === 2 ? "Play again" : "Next round", round === 2 ? "Ещё раз" : "Следующее задание")}
    </button>}
    <p className="activity-note">{t(locale, "The same figures can be grouped in different ways. Focus on just the property in this activity.",
      "Одни и те же фигуры можно разделить по-разному. Обращай внимание только на признак этого задания.")}</p>
  </section>;
}
