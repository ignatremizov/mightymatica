import { useEffect, useRef, useState, type PointerEvent } from "react";
import type { ActivityProps } from "../../shared/contracts";
import { mediaUrl } from "../../shared/contracts";
import { useAnimation } from "../../shared/useAnimation";
import { accepts, buckets, generate, goal, shapes, targetAt, targetRegions, type Figure, type Mode } from "./rules";
import { pifagorFrames } from "./art";
import CompletionLesson from "./CompletionLesson";
import "./style.css";

const paint = { pink: "#c52577", green: "#217448", blue: "#205ebd" };
export default function FallingFigure({ locale, reducedMotion }: ActivityProps) {
  const ru = locale === "ru";
  const text = (en: string, russian: string) => ru ? russian : en;
  const [mode, setMode] = useState<Mode>("color");
  const [running, setRunning] = useState(false);
  const [started, setStarted] = useState(false);
  const [score, setScore] = useState(0);
  const scoreValue = useRef(0);
  const [selected, setSelected] = useState(0);
  const [revision, refresh] = useState(0);
  const [message, setMessage] = useState("");
  const [sound, setSound] = useState(true);
  const canvas = useRef<HTMLCanvasElement>(null);
  const audio = useRef<HTMLAudioElement[]>([]);
  const hostCanvas = useRef<HTMLCanvasElement>(null);
  const art = useRef<Record<string, HTMLImageElement>>({});
  const animationTime = useRef(0);
  const reaction = useRef({ kind: "idle", remaining: 0 });
  const figures = useRef<Figure[]>([]);
  const targets = useRef(buckets());
  const nextId = useRef(0);
  const dragging = useRef<number | null>(null);
  function spawn(nextMode: Mode, id: number, slot = 0) {
    const figure = generate(nextMode, id);
    if (reducedMotion) {
      figure.x = nextMode === "all" ? 60 + slot * 105 : 275;
      figure.y = nextMode === "all" ? 115 + (slot % 2) * 100 : 155;
    }
    return figure;
  }
  const count = mode === "color" || mode === "size" ? 2 : 3;
  const label = (f: Pick<Figure, "shape" | "color" | "width">) => {
    const color = ru ? { pink: "розовая", blue: "синяя", green: "зелёная" }[f.color] : f.color;
    const shape = ru ? { circle: "круг", triangle: "треугольник", square: "квадрат" }[f.shape] : f.shape;
    return `${color} · ${shape} · ${f.width <= 85 ? text("small", "маленькая") : text("large", "большая")}`;
  };
  const bucketLabel = (i: number) => {
    if (mode === "color") return i === 0 ? text("Pink", "Розовые") : text("Blue", "Синие");
    if (mode === "size") return i === 0 ? text("Small (≤85)", "Маленькие (≤85)") : text("Large (>85)", "Большие (>85)");
    const shape = mode === "shape" ? shapes[i]! : targets.current[i]!.shape;
    const name = ru ? { circle: "Круг", triangle: "Треугольник", square: "Квадрат" }[shape] : shape;
    return mode === "shape" ? name : `${text(["Pink", "Green", "Blue"][i]!, ["Розовый", "Зелёный", "Синий"][i]!)} · ${name}`;
  };
  function start(nextMode = mode) {
    dragging.current = null;
    targets.current = buckets();
    figures.current = Array.from({ length: nextMode === "all" ? 5 : 1 }, (_, slot) => spawn(nextMode, nextId.current++, slot));
    setSelected(figures.current[0]!.id);
    reaction.current = { kind: "idle", remaining: 0 };
    scoreValue.current = 0;
    setScore(0); setStarted(true); setRunning(true); setMessage(""); refresh(v => v + 1);
  }
  function feedback(correct: boolean, y: number) {
    reaction.current = { kind: correct ? "correct" : "wrong", remaining: .8 };
    if (!sound || !correct && (mode !== "color" || y <= 400)) return;
    const clip = audio.current[correct ? 0 : 1];
    if (clip) { clip.currentTime = 0; void clip.play().catch(() => {}); }
  }
  function place(id: number, index: number) {
    if (!running || scoreValue.current >= goal(mode)) return;
    const figure = figures.current.find(f => f.id === id);
    if (!figure) return;
    dragging.current = null;
    const correct = accepts(mode, figure, index, targets.current);
    feedback(correct, figure.y);
    if (!correct) {
      figure.speed = 240;
      setMessage(text("Not that bucket. Try again!", "Не та корзина. Попробуйте ещё!"));
      return;
    }
    const value = ++scoreValue.current;
    setScore(value);
    setMessage(value === goal(mode) ? text("Round complete! Well done.", "Раунд завершён! Молодцы.") : text("Correct!", "Верно!"));
    if (value >= goal(mode)) { figures.current = []; setRunning(false); }
    else {
      const slot = figures.current.findIndex(f => f.id === id);
      figures.current[slot] = spawn(mode, nextId.current++, slot);
      if (mode === "all") targets.current = buckets();
      setSelected(figures.current[0]!.id);
    }
    refresh(v => v + 1);
  }
  function draw() {
    const context = canvas.current?.getContext("2d");
    // Completion has its own painter; keep the visible companion animated
    // without redrawing the now-hidden gameplay board.
    if (context && score < goal(mode)) {
    context.clearRect(0, 0, 550, 400);
    context.fillStyle = "#66ffff"; context.fillRect(0, 0, 550, 400);
    // Quiet deterministic grass in the original garden palette; authored flower
    // and butterfly bitmaps retain the scene's recognizable details.
    context.fillStyle = "#71af31"; context.fillRect(0, 365, 550, 35);
    for (let i = 0; i < 64; i++) {
      const x = i * 9;
      context.fillStyle = i % 2 ? "#93bb39" : "#408c39";
      context.beginPath(); context.moveTo(x, 400); context.quadraticCurveTo(x - 15, 350, x - 8, 340 + i % 17); context.quadraticCurveTo(x + 17, 370, x + 7, 400); context.fill();
    }
    if (art.current.flowers?.complete && art.current.flowers.naturalWidth) context.drawImage(art.current.flowers, 450, 245, 120, 95);
    if (art.current.butterfly?.complete && art.current.butterfly.naturalWidth) {
      const flutter = reducedMotion ? 0 : Math.sin(animationTime.current * 3) * 7;
      context.drawImage(art.current.butterfly, 12, 235 + flutter, 44, 39);
    }
    for (let i = 0; i < count; i++) {
      const { x, y } = targetRegions(mode)[i]!;
      const color = mode === "color" || mode === "size" ? (i === 0 ? "Pink" : "Blue") : ["Pink", "Green", "Blue"][i]!;
      const shape = mode === "all" ? targets.current[i]!.shape : mode === "shape" ? shapes[i]! : "circle";
      const image = art.current[`${color}-${shape}`];
      if (image?.complete && image.naturalWidth) context.drawImage(image, x - 46.5, y, 93, 75);
      else {
        context.fillStyle = "#425968";
        context.fillRect(x - 46.5, y, 93, 75);
      }
      context.fillStyle = "#102637"; context.font = "bold 12px system-ui"; context.textAlign = "center";
      const words = bucketLabel(i).split(" · ");
      words.forEach((word, j) => context.fillText(word, x, y - 22 + 13 * j, 140));
    }
    for (const figure of figures.current) {
      const r = figure.width / 2;
      context.fillStyle = paint[figure.color]; context.strokeStyle = figure.id === selected ? "#151d33" : "#fff";
      context.lineWidth = figure.id === selected ? 4 : 2; context.beginPath();
      if (figure.shape === "circle") context.arc(figure.x, figure.y, r, 0, Math.PI * 2);
      else if (figure.shape === "square") context.rect(figure.x - r, figure.y - r, r * 2, r * 2);
      else { context.moveTo(figure.x, figure.y - r); context.lineTo(figure.x + r, figure.y + r); context.lineTo(figure.x - r, figure.y + r); context.closePath(); }
      context.fill(); context.stroke();
      context.fillStyle = "#fff"; context.font = "bold 11px system-ui"; context.textAlign = "center";
      context.fillText(ru ? { pink: "Р", blue: "С", green: "З" }[figure.color] : figure.color[0]!.toUpperCase(), figure.x, figure.y + 4);
    }
    }
    const host = hostCanvas.current?.getContext("2d");
    const sheet = art.current.pifagor;
    if (host && sheet?.complete && sheet.naturalWidth) {
      host.clearRect(0, 0, 135, 150);
      const index = reducedMotion ? 0 : Math.min(49, Math.floor(animationTime.current * 24) % 70);
      const [sx, sy, width] = pifagorFrames[index]!;
      const bounce = !reducedMotion && reaction.current.remaining > 0
        ? Math.sin(reaction.current.remaining * 20) * (reaction.current.kind === "wrong" ? 3 : 6) : 0;
      // Source trim offset aligns each frame to its 115×132 source cell.
      const x = 10 + 115 - width;
      host.drawImage(sheet, sx, sy, width, 132,
        x + (reaction.current.kind === "wrong" ? bounce : 0),
        10 - (reaction.current.kind === "correct" ? Math.abs(bounce) : 0), width, 132);
    }
  }
  useAnimation(delta => {
    if (running || !started || score === goal(mode)) {
      animationTime.current += delta;
      reaction.current.remaining = Math.max(0, reaction.current.remaining - delta);
    }
    if (running) for (const figure of figures.current) {
      if (!reducedMotion && dragging.current !== figure.id) {
        figure.y += figure.speed * delta;
        if (figure.y > 420) {
          if (mode === "all") {
            Object.assign(figure, generate(mode, figure.id));
            refresh(v => v + 1);
          } else { figure.y = -10; figure.speed = figure.initialSpeed; }
        }
      }
      // The source checks every frame, including while a figure is held.
      // Score at most one per animation callback: All rerolls its buckets.
      if (!reducedMotion) {
        const index = targetAt(mode, figure.x, figure.y);
        if (index >= 0 && accepts(mode, figure, index, targets.current)) {
          place(figure.id, index);
          break;
        }
      }
    }
    draw();
  });
  useEffect(() => { draw(); }, [revision, selected, mode, running, locale, score]);
  useEffect(() => {
    const cancelHiddenDrag = () => {
      if (document.hidden) {
        dragging.current = null;
      }
    };
    document.addEventListener("visibilitychange", cancelHiddenDrag);
    return () => document.removeEventListener("visibilitychange", cancelHiddenDrag);
  }, []);
  useEffect(() => {
    if (reducedMotion) {
      figures.current.forEach((figure, slot) => {
        figure.x = mode === "all" ? 60 + slot * 105 : 275;
        figure.y = mode === "all" ? 115 + (slot % 2) * 100 : 155;
      });
      draw();
    }
  }, [reducedMotion]);
  useEffect(() => {
    let disposed = false;
    const load = (key: string, file: string) => {
      const image = new Image();
      image.onload = () => { if (!disposed) refresh(v => v + 1); };
      image.src = mediaUrl(`falling/${file}`);
      art.current[key] = image;
    };
    load("pifagor", "pifagor.png"); load("flowers", "flowers.png"); load("butterfly", "butterfly.png");
    for (const color of ["Pink", "Green", "Blue"]) for (const shape of shapes) {
      load(`${color}-${shape}`, `buckets/${color}FrontBucket${shape[0]!.toUpperCase()}${shape.slice(1)}.png`);
    }
    audio.current = ["Shortbang.mp3", "Boing.mp3"].map(file => {
      const clip = new Audio(mediaUrl(`falling/${file}`)); clip.preload = "none"; clip.volume = file === "Boing.mp3" ? .05 : 1; return clip;
    });
    return () => {
      disposed = true;
      Object.values(art.current).forEach(image => { image.onload = null; });
      audio.current.forEach(clip => { clip.pause(); clip.removeAttribute("src"); clip.load(); });
    };
  }, []);
  function point(event: PointerEvent<HTMLCanvasElement>) {
    const rect = event.currentTarget.getBoundingClientRect();
    return { x: (event.clientX - rect.left) * 550 / rect.width, y: (event.clientY - rect.top) * 400 / rect.height };
  }
  return <div className="activity-layout falling-activity">
    <div className="falling-host">
      <canvas ref={hostCanvas} width={135} height={150} role="img" aria-label={text("Original animated Pythagoras companion", "Оригинальный анимированный Пифагор")} />
      <p>{score >= goal(mode) ? text("Wonderful! You arranged the figures!", "Прекрасно! Все фигуры распределены!") : message || text("Arrange the figures! I’m here to help.", "Распределите фигуры! Я помогу.")}</p>
    </div>
    <p className="explanation">{text("Choose a figure, then a bucket. Drag on the board, or use the figure and bucket buttons below. Keyboard: Tab to controls, Enter to choose. Wrong drops fall faster; there is no lost-life penalty.", "Выберите фигуру, затем корзину. Перетаскивайте фигуры или используйте кнопки под полем. Клавиатура: Tab и Enter. После ошибки фигура падает быстрее; жизни не теряются.")}</p>
    <div className="controls">
      <label className="control">{text("Sort by", "Сортировка")} <select value={mode} onChange={e => { const next = e.target.value as Mode; setMode(next); setRunning(false); setStarted(false); setScore(0); setMessage(""); figures.current = []; dragging.current = null; reaction.current = { kind: "idle", remaining: 0 }; }}>
        {(["color", "size", "shape", "all"] as Mode[]).map((value, i) => <option key={value} value={value}>{text(["Color", "Size", "Shape", "All"][i]!, ["Цвет", "Размер", "Форма", "Всё"][i]!)}</option>)}
      </select></label>
      <button className="button" onClick={() => start()}>{started ? text("Restart", "Заново") : text("Start", "Начать")}</button>
      <button className="button button-secondary" disabled={!started || score >= goal(mode)} onClick={() => { dragging.current = null; setRunning(!running); }}>{running ? text("Pause", "Пауза") : text("Resume", "Продолжить")}</button>
      <label className="control"><input type="checkbox" checked={sound} disabled={score >= goal(mode)} onChange={e => {
        setSound(e.target.checked);
        if (!e.target.checked) audio.current.forEach(clip => clip.pause());
      }} />{text("Sound", "Звук")}</label>
    </div>
    <p className="activity-status" role="status">{score} / {goal(mode)} · {message || (running ? text("Sort the figures!", "Сортируйте фигуры!") : text("Ready / paused", "Готово / пауза"))}</p>
    {reducedMotion && <p className="activity-note">{text("Reduced motion: figures stay still. Use the labeled controls to sort them.", "Уменьшение движения: фигуры неподвижны. Сортируйте их кнопками.")}</p>}
    {mode === "all" && <p className="activity-note">{text("Match BOTH color and shape. Bucket shapes change after every correct answer. Some figures do not currently match any bucket: let them fall, or replace one below.", "Учитывайте И цвет, И форму. Формы корзин меняются после каждого верного ответа. Некоторые фигуры пока не подходят: дайте им упасть или замените выбранную.")}</p>}
    {score >= goal(mode) && <CompletionLesson mode={mode} locale={locale} reducedMotion={reducedMotion} sound={sound} />}
    <canvas ref={canvas} width={550} height={400} style={{ display: score >= goal(mode) ? "none" : undefined }} className="diagram falling-board" aria-label={text("Falling figures sorting board; equivalent controls below", "Игровое поле; доступные кнопки ниже")}
      onPointerDown={e => {
        if (!running) return;
        const p = point(e);
        const figure = [...figures.current].reverse().find(f => Math.abs(f.x - p.x) <= f.width / 2 + 8 && Math.abs(f.y - p.y) <= f.width / 2 + 8);
        if (figure) { dragging.current = figure.id; setSelected(figure.id); e.currentTarget.setPointerCapture(e.pointerId); }
      }}
      onPointerMove={e => { const figure = figures.current.find(f => f.id === dragging.current); if (figure && running) { Object.assign(figure, point(e)); draw(); } }}
      onPointerUp={e => {
        const id = dragging.current; dragging.current = null;
        if (id === null || !running) return;
        const p = point(e);
        const index = targetAt(mode, p.x, p.y);
        if (index >= 0) place(id, index);
        else {
          const figure = figures.current.find(f => f.id === id);
          if (figure) {
            Object.assign(figure, p);
            figure.speed = 240;
            feedback(false, figure.y);
            setMessage(text("Not that bucket. Try again!", "Не та корзина. Попробуйте ещё!"));
          }
        }
      }} onPointerCancel={() => { dragging.current = null; }}>
      {text("Use the figure buttons and bucket buttons below.", "Используйте кнопки фигур и корзин ниже.")}
    </canvas>
    <fieldset className="controls"><legend>{text("1. Select a figure", "1. Выберите фигуру")}</legend>
      {figures.current.map((figure, i) => <button className="button button-secondary" key={figure.id} aria-pressed={selected === figure.id} disabled={!running} onClick={() => setSelected(figure.id)}>{i + 1}. {label(figure)}</button>)}
    </fieldset>
    <fieldset className="controls"><legend>{text("2. Choose a bucket", "2. Выберите корзину")}</legend>
      {Array.from({ length: count }, (_, i) => <button className="button" key={i} disabled={!running} onClick={() => place(selected, i)}>{bucketLabel(i)}</button>)}
    </fieldset>
    {mode === "all" && <button className="button button-secondary" disabled={!running} onClick={() => {
      const figure = figures.current.find(f => f.id === selected);
      if (figure) { Object.assign(figure, spawn(mode, figure.id, figures.current.indexOf(figure))); refresh(v => v + 1); }
    }}>{text("Let selected figure pass", "Пропустить выбранную фигуру")}</button>}
  </div>;
}
