import { useEffect, useState } from "react";
import type { ActivityProps } from "../../shared/contracts";
import { t } from "../../shared/contracts";
import { coinStart, coinTargets, movableCoins, placeCoin, washingAtStop } from "./rules";
import "./logic.css";
import { RecoveredBoards } from "./RecoveredBoards";
import WisemenLesson from "./WisemenLesson";
import { useLogicAudio } from "./useLogicAudio";

export default function LogicActivity(props: ActivityProps) {
  return <div className="activity-layout logic-activity">
    {props.activityId === "logic-coins-to-move" ? <Coins key={props.activityId} {...props} /> :
      ["logic-three-wisemen", "logic-eight-wisemen"].includes(props.activityId) ? <Wisemen key={props.activityId} {...props} /> :
        <RecoveredBoards key={props.activityId} {...props} />}
  </div>;
}

function Coins({ locale }: ActivityProps) {
  const say = (en: string, ru: string) => t(locale, en, ru);
  const audio = useLogicAudio(locale);
  const [placements, setPlacements] = useState<(number | null)[]>(Array(10).fill(null));
  const [selected, setSelected] = useState<number | null>(null);
  const [message, setMessage] = useState("");
  const [hint, setHint] = useState(false);
  const [drag, setDrag] = useState<{ pointerId: number; coin: number; x: number; y: number } | null>(null);
  useEffect(() => {
    const cancel = () => { setDrag(null); setSelected(null); };
    const visibility = () => { if (document.hidden) cancel(); };
    window.addEventListener("blur", cancel);
    document.addEventListener("visibilitychange", visibility);
    return () => { window.removeEventListener("blur", cancel); document.removeEventListener("visibilitychange", visibility); };
  }, []);
  const moved = placements.filter((p) => p !== null).length;
  function choose(coin: number) {
    if (placements[coin] !== null || moved === 3) return;
    setSelected(coin);
    setMessage(say(`Coin ${coin + 1} selected. Choose a destination below.`, `Выбрана монета ${coin + 1}. Выберите место внизу.`));
  }
  function move(target: number, coin = selected) {
    if (placements.includes(target) || moved === 3) return;
    if (coin === null) {
      setMessage(say("Select a coin first.", "Сначала выберите монету."));
      return;
    }
    const next = placeCoin(placements, coin, target);
    if (!next) {
      audio.play("AngryMob.mp3");
      setMessage(say("That move does not complete the inverted triangle. Try a different coin or empty destination.", "Этот ход не достраивает перевёрнутый треугольник. Выберите другую монету или свободное место."));
      return;
    }
    setPlacements(next);
    setSelected(null);
    setMessage(say("Coin placed.", "Монета на месте."));
    audio.play(next.filter(value => value !== null).length === 3 ? "salut.MP3" : "Shortbang.mp3");
  }
  const x = (value: number) => 250 + value * 47;
  const y = (value: number) => 52 + value * 65;
  return <>
    {audio.control}
    <p className="explanation">{say("Drag coins to turn the triangle upside down in just three moves. You can also select a numbered coin, then an empty destination A, B, or C.", "Перетаскивайте монеты, чтобы перевернуть треугольник всего за три хода. Можно также выбрать монету по номеру, затем свободное место A, B или C.")}</p>
    <svg className="diagram logic-coins" viewBox="0 0 500 370" role="group" aria-label={say("Ten coins in a triangle, with three empty destination circles.", "Десять монет в треугольнике и три свободных места.")}
      onPointerMove={(event) => {
        if (!drag || drag.pointerId !== event.pointerId) return;
        const matrix = event.currentTarget.getScreenCTM();
        if (!matrix) return;
        const point = new DOMPoint(event.clientX, event.clientY).matrixTransform(matrix.inverse());
        setDrag({ ...drag, x: point.x, y: point.y });
      }}
      onPointerUp={(event) => {
        if (!drag || drag.pointerId !== event.pointerId) return;
        const matrix = event.currentTarget.getScreenCTM();
        if (matrix) {
          const point = new DOMPoint(event.clientX, event.clientY).matrixTransform(matrix.inverse());
          const target = coinTargets.findIndex(([cx, cy]) => Math.hypot(point.x - x(cx), point.y - y(cy)) < 35);
          if (target >= 0) move(target, drag.coin);
        }
        setDrag(null);
      }}
      onPointerCancel={() => setDrag(null)} onLostPointerCapture={() => setDrag(null)}
      onKeyDown={(event) => {
        if (event.key === "Escape") { setSelected(null); setMessage(""); setDrag(null); }
      }}>
      <path d="M109 117 L391 117 L250 312 Z" fill="none" stroke="currentColor" strokeDasharray="7 7" opacity=".35" />
      {coinTargets.map(([cx, cy], i) => <g key={`target-${i}`}
        className="logic-board-choice" role="button" tabIndex={placements.includes(i) || moved === 3 ? -1 : 0}
        aria-label={`${say("Place at", "На место")} ${["A", "B", "C"][i]}`}
        aria-disabled={placements.includes(i) || moved === 3}
        onClick={() => move(i)}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") { event.preventDefault(); move(i); }
        }}>
        <circle cx={x(cx)} cy={y(cy)} r="25" fill="transparent" stroke="currentColor" strokeDasharray="4 4" />
        <text x={x(cx)} y={y(cy) + 6} textAnchor="middle" fill="currentColor">{["A", "B", "C"][i]}</text>
      </g>)}
      {coinStart.map((start, i) => {
        const target = placements[i];
        const point = target === null || target === undefined ? start : coinTargets[target]!;
        return <g key={i} className="logic-board-choice" role="button"
          onPointerDown={(event) => {
            if (event.button !== 0 || drag || placements[i] !== null || moved === 3) return;
            const svg = event.currentTarget.ownerSVGElement;
            const matrix = svg?.getScreenCTM();
            if (!svg || !matrix) return;
            const pointer = new DOMPoint(event.clientX, event.clientY).matrixTransform(matrix.inverse());
            svg.setPointerCapture(event.pointerId);
            setDrag({ pointerId: event.pointerId, coin: i, x: pointer.x, y: pointer.y });
            setSelected(i);
          }}
          tabIndex={placements[i] !== null || moved === 3 ? -1 : 0}
          aria-label={`${say("Coin", "Монета")} ${i + 1}`} aria-pressed={selected === i}
          aria-disabled={placements[i] !== null || moved === 3}
          onClick={() => choose(i)}
          onKeyDown={(event) => {
            if (event.key === "Enter" || event.key === " ") { event.preventDefault(); choose(i); }
          }}><circle cx={drag?.coin === i ? drag.x : x(point[0])} cy={drag?.coin === i ? drag.y : y(point[1])} r="24" fill={selected === i ? "#f2b65a" : "#dec47b"} stroke="#4c3a1f" strokeWidth={selected === i ? 4 : 2} />
          <text x={drag?.coin === i ? drag.x : x(point[0])} y={(drag?.coin === i ? drag.y : y(point[1])) + 6} textAnchor="middle" fill="#302716">{i + 1}</text></g>;
      })}
    </svg>
    <div className="controls" aria-label={say("Choose a coin", "Выберите монету")}>
      {coinStart.map((_, i) => <button className="button button-secondary" key={i} disabled={placements[i] !== null || moved === 3} aria-pressed={selected === i} onClick={() => choose(i)}>{say("Coin", "Монета")} {i + 1}</button>)}
    </div>
    <div className="controls" aria-label={say("Destinations", "Места")}>
      {coinTargets.map((_, i) => <button className="button" key={i} disabled={placements.includes(i) || moved === 3} onClick={() => move(i)}>{say("Place at", "На место")} {["A", "B", "C"][i]}</button>)}
    </div>
    <p className="activity-status" role="status">{moved === 3 ? say("Good job! Three moves turned the pyramid upside down.", "Отлично! Три хода перевернули пирамиду.") : `${moved}/3 · ${message || say("Choose your first coin.", "Выберите первую монету.")}`}</p>
    <div className="controls">
      <button className="button button-secondary" onClick={() => { audio.stop(); setPlacements(Array(10).fill(null)); setSelected(null); setDrag(null); setMessage(""); setHint(false); }}>{say("Reset", "Сначала")}</button>
      <button className="button button-secondary" onClick={() => setHint(!hint)} aria-expanded={hint}>{say("Hint", "Подсказка")}</button>
    </div>
    {hint && <p className="explanation">{say(`Keep the central seven. Move the three corners: ${movableCoins.map((i) => i + 1).join(", ")}.`, `Оставьте семь центральных монет. Переместите три угловые: ${movableCoins.map((i) => i + 1).join(", ")}.`)}</p>}
  </>;
}

function Wisemen({ activityId, locale, reducedMotion }: ActivityProps) {
  const say = (en: string, ru: string) => t(locale, en, ru);
  const eight = activityId === "logic-eight-wisemen";
  const [dirty, setDirty] = useState(8);
  const [stop, setStop] = useState(0);
  const [guess, setGuess] = useState(1);
  const [checked, setChecked] = useState(false);
  const [hint, setHint] = useState(false);
  const [answer, setAnswer] = useState<number | null>(null);
  const washed = eight && stop >= dirty;
  return <WisemenLesson key={`${activityId}-${locale}`} eight={eight} locale={locale} reducedMotion={reducedMotion}
    onHint={() => setHint(true)}
    onRestart={() => { setDirty(8); setStop(0); setChecked(false); setAnswer(null); setHint(false); setGuess(1); }}>
    <p className="explanation">{eight
      ? say("Eight silent, perfectly logical travelers can see everyone else's face, but not their own. After a tunnel, an announcement says: “At least one of you has a dirty face.” They may wash only at train stops. Everyone reasons at the same speed and sees who washes at each stop.", "Восемь молчаливых, безупречно логичных мудрецов видят чужие лица, но не своё. После туннеля объявляют: «Хотя бы у одного из вас грязное лицо». Умыться можно только на станции. Все рассуждают одинаково быстро и видят, кто умывается.")
      : say("Three wisemen emerge from a tunnel, all with soot on their faces. Each laughs at the others. One stops laughing after realizing that his own face must be dirty. He cannot see his own face. Why?", "Три мудреца выходят из туннеля с лицами в саже. Каждый смеётся над другими. Один перестаёт смеяться, поняв, что его лицо тоже грязное. Своего лица он не видит. Как он догадался?")}</p>
    {hint && <p className="explanation">{eight ? say("Consider just two wisemen. If only one were dirty, what would that person learn from the announcement? If both were dirty, what would they learn when nobody washes at the first stop?", "Рассмотрите двух мудрецов. Если испачкан только один, что он узнает из объявления? Если испачканы оба, что они узнают, когда на первой станции никто не умоется?") : say("With just two travelers and one dirty face, the dirty traveler sees a clean face and has nothing to laugh at. What changes when both are dirty?", "Если из двух мудрецов испачкан только один, он видит чистое лицо и ему не над чем смеяться. Что изменится, если испачканы оба?")}</p>}
    <details>
      <summary>{say("Explore the reasoning", "Исследовать рассуждение")}</summary>
    {eight && <label className="control">{say("Dirty faces (explore 1–8)", "Грязных лиц (от 1 до 8)")} <input type="range" min="1" max="8" value={dirty} onChange={(event) => { setDirty(Number(event.target.value)); setStop(0); setChecked(false); }} /> <output>{dirty}</output></label>}
    <div className="logic-train" role="img" aria-label={say(`${eight ? 8 : 3} travelers; ${eight ? dirty : 3} initially have dirty faces. ${washed ? "They have washed." : ""}`, `${eight ? 8 : 3} мудрецов; изначально грязных лиц: ${eight ? dirty : 3}. ${washed ? "Они умылись." : ""}`)}>
      {Array.from({ length: eight ? 8 : 3 }, (_, i) => <div className="logic-passenger" key={i}><span aria-hidden="true">{i < (eight ? dirty : 3) && !washed ? "◉" : "○"}</span><strong>{i + 1}</strong><small>{say(i < (eight ? dirty : 3) && !washed ? "Soot" : "Clean", i < (eight ? dirty : 3) && !washed ? "Сажа" : "Чисто")}</small></div>)}
    </div>
    {eight ? <>
      <label className="control">{say("Predict the washing stop", "На какой станции умоются")} <select value={guess} onChange={(e) => { setGuess(Number(e.target.value)); setChecked(false); }}>{Array.from({ length: 8 }, (_, i) => <option value={i + 1} key={i}>{i + 1}</option>)}</select></label>
      <div className="controls"><button className="button" onClick={() => setChecked(true)}>{say("Check prediction", "Проверить")}</button><button className="button button-secondary" disabled={washed} onClick={() => setStop((s) => s + 1)}>{say("Next train stop", "Следующая станция")}</button></div>
      <p role="status" className="activity-status">{checked && (washingAtStop(dirty, guess) ? say("Correct! ", "Верно! ") : say("Not yet: try the two-person hint. ", "Пока неверно: рассмотрите двух мудрецов. "))}{stop === 0 ? say("The announcement has just been made.", "Объявление только что прозвучало.") : washed ? say(`Stop ${stop}: all ${dirty} dirty travelers wash together.`, `Станция ${stop}: все ${dirty} испачканных мудрецов умываются вместе.`) : say(`Stop ${stop}: nobody washes. Every traveler can rule out ${stop} dirty ${stop === 1 ? "face" : "faces"}.`, `Станция ${stop}: никто не умывается. Все могут исключить случай, когда грязных лиц ${stop}.`)}</p>
    </> : <>
      <p>{say("Which observation matters?", "Какое наблюдение важно?")}</p>
      <div className="choice-grid">{[
        [say("The tunnel was long.", "Туннель был длинным."), false],
        [say("Each of the other two also sees someone worth laughing at.", "Каждый из двух других тоже видит кого-то, над кем можно смеяться."), true],
        [say("Laughing always makes your face dirty.", "От смеха лицо всегда пачкается."), false],
      ].map(([label], i) => <button className="button button-secondary" key={i} onClick={() => setAnswer(i)}>{label}</button>)}</div>
      <p className="activity-status" role="status">{answer === null ? say("Consider what each traveler can see.", "Подумайте, что видит каждый.") : answer === 1 ? say("Good reasoning! Now examine the hidden assumption below.", "Хорошее рассуждение! Теперь проверьте скрытое предположение внизу.") : say("That does not tell him anything about his own face. Try again.", "Это ничего не говорит о его собственном лице. Попробуйте ещё.")}</p>
      {answer === 1 && <p className="explanation">{say("The intended argument compares the two-person case: if only one face were dirty, that person would see no dirty face and would not laugh. With three travelers, the conclusion also assumes that logical people stop laughing once they know their own face is dirty, and that the others notice this. Laughter alone is not a rigorous public announcement; without such behavioral assumptions, the conclusion does not follow.", "Подсказка предлагает случай двух людей: если грязное лицо только у одного, он не увидит другого грязного лица и не станет смеяться. Для трёх мудрецов дополнительно предполагается, что они прекращают смеяться, узнав о своём лице, и замечают поведение других. Сам по себе смех не является строгим общим объявлением: без этих предположений вывод не следует.")}</p>}
    </>}
    </details>
  </WisemenLesson>;
}
