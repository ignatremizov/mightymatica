import { useEffect, useRef, useState } from "react";
import type { ActivityProps } from "../../shared/contracts";
import { mediaUrl, t } from "../../shared/contracts";
import { useAnimation } from "../../shared/useAnimation";
import data from "./mouse-data.json";
import { advanceMouse, catPosition, startMouse } from "./mouseRules";
import type { MouseLevel, MouseMode, MouseState, Point } from "./mouseRules";

export default function MouseMaze({ activityId, locale, reducedMotion }: ActivityProps) {
  const mode: MouseMode = activityId === "magic-mouse-cheese" ? "cheese" : activityId === "magic-mouse-cherry" ? "collect" : "distribute";
  const levels: MouseLevel[] = data[mode === "cheese" ? "Mouse-cheese" : mode === "collect" ? "Mouse-cherry" : "Mouse-cherry-oppo"];
  const [levelIndex, setLevelIndex] = useState(0);
  const level = levels[levelIndex];
  const [snapshot, setSnapshot] = useState(() => startMouse(level, mode));
  const state = useRef<MouseState>(snapshot);
  const [paused, setPaused] = useState(true);
  const direction = useRef<Point>({ x: 0, y: 0 });
  const target = useRef<Point | null>(null);
  const keys = useRef(new Set<string>());
  const mouse = useRef<SVGGElement>(null);
  const cats = useRef<(SVGGElement | null)[]>([]);
  const tr = (en: string, ru: string) => t(locale, en, ru);
  useEffect(() => {
    const release = () => {
      keys.current.clear();
      direction.current = { x: 0, y: 0 };
      target.current = null;
    };
    window.addEventListener("blur", release);
    document.addEventListener("visibilitychange", release);
    return () => {
      window.removeEventListener("blur", release);
      document.removeEventListener("visibilitychange", release);
    };
  }, []);

  function reset(index = levelIndex) {
    setLevelIndex(index);
    state.current = startMouse(levels[index], mode);
    setSnapshot(state.current);
    direction.current = { x: 0, y: 0 };
    keys.current.clear();
    target.current = null;
    setPaused(true);
    mouse.current?.setAttribute("transform", "translate(36 90)");
    levels[index].cats.forEach((cat, i) => {
      const p = catPosition(cat, 0);
      cats.current[i]?.setAttribute("transform", `translate(${p.x} ${p.y})`);
    });
  }
  useAnimation(dt => {
    if (state.current.status !== "playing") return;
    let movement = direction.current;
    if (keys.current.size) movement = {
      x: Number(keys.current.has("ArrowRight") || keys.current.has("d")) - Number(keys.current.has("ArrowLeft") || keys.current.has("a")),
      y: Number(keys.current.has("ArrowDown") || keys.current.has("s")) - Number(keys.current.has("ArrowUp") || keys.current.has("w")),
    };
    else if (target.current) {
      const dx = target.current.x-state.current.x, dy = target.current.y-state.current.y;
      if (Math.hypot(dx, dy) < 3) target.current = null;
      movement = target.current ? { x: dx, y: dy } : { x: 0, y: 0 };
    }
    const previous = state.current;
    const next = advanceMouse(level, mode, previous, dt, movement);
    state.current = next;
    mouse.current?.setAttribute("transform", `translate(${next.x} ${next.y})`);
    level.cats.forEach((cat, i) => {
      const p = catPosition(cat, next.time);
      cats.current[i]?.setAttribute("transform", `translate(${p.x} ${p.y})`);
    });
    if (previous.count !== next.count || previous.status !== next.status || previous.used.length !== next.used.length) setSnapshot(next);
  }, !paused && snapshot.status === "playing");

  const messages = {
    playing: paused ? tr("Paused. Press Play to begin.", "Пауза. Нажмите «Играть».") : tr("Avoid the cats. Walls block your path.", "Избегайте котов. Стены преграждают путь."),
    caught: tr("A cat caught you! Restart this level.", "Кот поймал мышку! Начните уровень сначала."),
    hungry: tr("Not enough cherries for that group. Restart and choose another route.", "Для этой группы не хватает вишен. Начните сначала и выберите другой маршрут."),
    wrong: mode === "collect" ? tr("Wrong cherry count at the exit. Restart and collect exactly the target.", "У выхода неверное число вишен. Соберите ровно нужное количество.") : tr("You still have cherries at the exit. Distribute them first.", "У выхода остались вишни. Сначала раздайте их."),
    won: levelIndex === levels.length-1 ? tr("You completed every level!", "Все уровни пройдены!") : tr("Level complete! Continue to the next maze.", "Уровень пройден! Переходите к следующему лабиринту."),
  };
  return <div className="activity-layout magic">
    <p>{mode === "cheese" ? tr("Help the mouse reach the cheese.", "Помогите мышке добраться до сыра.") : mode === "collect"
      ? tr(`Collect exactly ${level.target} cherries, then reach the cheese. Each bunch is collected once; its numeral shows how many cherries it contains.`, `Соберите ровно ${level.target} вишен и доберитесь до сыра. Каждая гроздь собирается один раз; число показывает количество вишен.`)
      : tr(`Carry ${level.target} cherries. Feed groups of one, two or three mousekins, then reach the cheese with none left. Each group is fed once; you need not visit every group.`, `У вас ${level.target} вишен. Накормите группы из одной, двух или трёх мышек и доберитесь до сыра без остатка. Каждую группу можно накормить один раз; посещать все группы не обязательно.`)}</p>
    <p id="magic-maze-help">{tr("Use arrow keys or WASD while the maze is focused, hold the direction buttons, or tap a destination inside the maze. Movement is straight, not automatic pathfinding. Pause whenever you need to plan.", "Когда лабиринт в фокусе, используйте стрелки или WASD, удерживайте кнопки направлений либо коснитесь точки назначения. Мышка идёт прямо, а не ищет путь автоматически. Для обдумывания можно включить паузу.")}</p>
    <div className="controls">
      <label className="control">{tr("Level", "Уровень")} <select value={levelIndex} onChange={e => reset(Number(e.target.value))}>
        {levels.map((entry, index) => <option value={index} key={index}>{index+1}{mode !== "cheese" ? ` · ${entry.target}` : ""}</option>)}
      </select></label>
      <button className="button" disabled={snapshot.status !== "playing"} onClick={() => { keys.current.clear(); direction.current = { x: 0, y: 0 }; target.current = null; setPaused(!paused); }}>{paused ? tr("Play", "Играть") : tr("Pause", "Пауза")}</button>
      <button className="button button-secondary" onClick={() => reset()}>{tr("Restart level", "Начать уровень сначала")}</button>
      {snapshot.status === "won" && levelIndex < levels.length-1 && <button className="button" onClick={() => reset(levelIndex+1)}>{tr("Next level", "Следующий уровень")}</button>}
    </div>
    <p className="activity-status" aria-live="polite">{tr("Level", "Уровень")} {levelIndex+1}/{levels.length}. {mode !== "cheese" && `${tr(mode === "collect" ? "Collected" : "Cherries left", mode === "collect" ? "Собрано" : "Осталось вишен")}: ${snapshot.count}. `}{messages[snapshot.status]}</p>
    <svg className="magic-maze" viewBox="0 0 640 480" role="group" tabIndex={0} aria-label={tr("Mouse maze game board", "Игровое поле лабиринта")} aria-describedby="magic-maze-help"
      onKeyDown={e => {
        const key = e.key.length === 1 ? e.key.toLowerCase() : e.key;
        if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "w", "a", "s", "d"].includes(key)) {
          e.preventDefault(); keys.current.add(key); target.current = null;
        }
      }}
      onKeyUp={e => { keys.current.delete(e.key.length === 1 ? e.key.toLowerCase() : e.key); }}
      onBlur={() => { keys.current.clear(); direction.current = { x: 0, y: 0 }; target.current = null; }}
      onPointerDown={e => {
        if (paused || snapshot.status !== "playing") return;
        e.currentTarget.focus();
        const matrix = e.currentTarget.getScreenCTM();
        if (matrix) {
          const p = new DOMPoint(e.clientX, e.clientY).matrixTransform(matrix.inverse());
          target.current = { x: p.x, y: p.y };
        }
      }}>
      <rect width="640" height="480" fill="#66ffff" />
      <text x="36" y="52" fontSize="15" fill="#000">{tr("START", "СТАРТ")}</text>
      <g stroke="#000" strokeWidth="4">
        {level.walls.map((wall, index) => <line key={index} x1={wall[0]} y1={wall[1]} x2={wall[2]} y2={wall[3]} />)}
      </g>
      <image href={mediaUrl("magic/cheese.png")} x={level.goal[0]-30} y={level.goal[1]-20} width="60" height="40" />
      {level.targets.map(item => <g key={item.id} transform={`translate(${item.x} ${item.y})`} opacity={snapshot.used.includes(item.id) ? .25 : 1}>
        <circle r="15" fill={mode === "collect" ? "#fff1db" : "#e9ddf6"} stroke="#47324c" />
        <text textAnchor="middle" y="5" fontSize="15" fill="#351d35">{mode === "collect" ? "🍒" : "🐭"}</text>
        <text x="11" y="-9" textAnchor="middle" fontSize="14" fontWeight="bold" fill="#502038" stroke="#fff" strokeWidth="3" paintOrder="stroke">{snapshot.used.includes(item.id) ? "✓" : item.value}</text>
      </g>)}
      {level.cats.map((cat, index) => {
        const p = catPosition(cat, 0);
        return <g ref={node => { cats.current[index] = node; }} transform={`translate(${p.x} ${p.y})`} key={`${levelIndex}-${index}`}>
          <image href={mediaUrl("magic/cat.png")} x="-21" y="-24" width="42" height="48" />
        </g>;
      })}
      <g ref={mouse} transform="translate(36 90)">
        <ellipse rx="11" ry="12" fill="white" />
        <image href={mediaUrl("magic/mouse.png")} x="-14" y="-14" width="28" height="28" />
        <circle cx="2" cy="-3" r=".9" fill="#16231d" /><circle cx="5" cy="-3" r=".9" fill="#16231d" />
      </g>
      {paused && <g pointerEvents="none"><rect x="230" y="420" width="180" height="36" fill="#0000cc"/><text x="320" y="444" textAnchor="middle" fill="white" fontSize="18">{tr("PAUSED", "ПАУЗА")}</text></g>}
    </svg>
    <div className="magic-dpad" aria-label={tr("Touch movement controls", "Кнопки движения")}>
      {([{ label: "↑", x: 0, y: -1, en: "Up", ru: "Вверх" }, { label: "←", x: -1, y: 0, en: "Left", ru: "Влево" }, { label: "↓", x: 0, y: 1, en: "Down", ru: "Вниз" }, { label: "→", x: 1, y: 0, en: "Right", ru: "Вправо" }]).map(button =>
        <button className="button button-secondary" key={button.label} aria-label={tr(button.en, button.ru)} disabled={paused || snapshot.status !== "playing"}
          onPointerDown={e => { e.currentTarget.setPointerCapture(e.pointerId); target.current = null; direction.current = button; }}
          onPointerUp={() => { direction.current = { x: 0, y: 0 }; }}
          onPointerCancel={() => { direction.current = { x: 0, y: 0 }; }}
          onLostPointerCapture={() => { direction.current = { x: 0, y: 0 }; }}
          onKeyDown={e => { if (e.key === " " || e.key === "Enter") { e.preventDefault(); direction.current = button; target.current = null; } }}
          onKeyUp={() => { direction.current = { x: 0, y: 0 }; }}
          onBlur={() => { direction.current = { x: 0, y: 0 }; }}>{button.label}</button>)}
    </div>
    {reducedMotion && <p className="activity-note">{tr("Only essential gameplay movement is shown. Pause freezes the mouse and cats.", "Показано только необходимое игровое движение. Пауза останавливает мышку и котов.")}</p>}
  </div>;
}
