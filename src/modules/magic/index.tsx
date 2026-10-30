import { useState } from "react";
import { t } from "../../shared/contracts";
import type { ActivityProps } from "../../shared/contracts";
import { flipGlass, mindSymbol, nextEmpty, subtraction } from "./rules";
import type { GlassState } from "./rules";
import "./magic.css";
import MouseMaze from "./MouseMaze";
import MagicLesson from "./MagicLesson";
import { useMindreadSound } from "./useMindreadSound";

function Mindread({ locale }: ActivityProps) {
  const [round, setRound] = useState(0);
  const [stage, setStage] = useState(0);
  const [proof, setProof] = useState(false);
  const sound = useMindreadSound();
  const tr = (en: string, ru: string) => t(locale, en, ru);
  return <div className="activity-layout magic magic-mindread">
    <label className="control"><input type="checkbox" checked={sound.enabled}
      onChange={event => sound.toggle(event.currentTarget.checked)} /> {tr("Reveal sound", "Звук предсказания")}</label>
    <ol>
      <li>{tr("Secretly choose a two-digit number, from 10 to 99. Do not enter it here.", "Задумайте двузначное число от 10 до 99. Не вводите его здесь.")}</li>
      <li>{tr("Add its two digits, then subtract that sum from your number. For example: 23 − (2 + 3) = 18.", "Сложите его цифры и вычтите сумму из числа. Например: 23 − (2 + 3) = 18.")}</li>
      <li>{tr("Find the symbol beside your result. Keep that symbol in mind.", "Найдите символ рядом с результатом. Запомните его.")}</li>
    </ol>
    {stage === 0 ? <button className="button" onClick={() => setStage(1)}>{tr("Show the symbol chart", "Показать таблицу символов")}</button> : <>
      <div className="magic-chart" aria-label={tr("Number and symbol chart", "Таблица чисел и символов")}>
        {Array.from({ length: 100 }, (_, n) => <div key={n}><span>{n}</span><strong>{mindSymbol(n, round)}</strong></div>)}
      </div>
      <button className="magic-ball" disabled={stage === 2} onClick={() => { setStage(2); sound.reveal(round); }}
        aria-label={tr("Reveal the ball's prediction", "Открыть предсказание шара")}>{stage === 2 ? mindSymbol(9, round) : "?"}</button>
      <p className="activity-status" aria-live="polite">{stage === 2
        ? tr("Is this your symbol?", "Это ваш символ?")
        : tr("Concentrate on your symbol, then touch the ball.", "Сосредоточьтесь на символе и нажмите на шар.")}</p>
    </>}
    {stage === 2 && <div className="controls">
      <button className="button" onClick={() => { sound.stop(); setRound(round + 1); setStage(0); setProof(false); }}>{tr("Try again", "Ещё раз")}</button>
      <button className="button button-secondary" onClick={() => setProof(!proof)}>{tr("Explain the secret", "Объяснить секрет")}</button>
    </div>}
    {sound.status === "loading" && <p role="status">{tr("Loading sound…", "Загрузка звука…")}</p>}
    {sound.status === "error" && <p role="status">{tr("The sound could not be played.", "Не удалось воспроизвести звук.")}{" "}
      <button className="button-secondary" onClick={() => sound.reveal(round)}>{tr("Retry sound", "Повторить звук")}</button>
    </p>}
    {proof && <p className="explanation">{tr("Write your number as 10a + b. Subtracting a + b leaves 9a: always 9, 18, …, 81. Those entries all share the same symbol. A new round changes that symbol, not the arithmetic.", "Запишем число как 10a + b. После вычитания a + b остаётся 9a: всегда 9, 18, …, 81. У этих чисел одинаковый символ. В новом раунде меняется символ, но не арифметика.")}</p>}
  </div>;
}

function SubtractionExamples({ locale }: ActivityProps) {
  const [input, setInput] = useState("741");
  const [step, setStep] = useState(0);
  const result = subtraction(Number(input));
  const tr = (en: string, ru: string) => t(locale, en, ru);
  return <div className="activity-layout magic magic-subtraction">
    <p>{tr("Choose a three-digit number whose first digit exceeds its last by at least two.", "Выберите трёхзначное число: первая цифра должна быть больше последней минимум на два.")}</p>
    <label className="control">{tr("Your number", "Ваше число")} <input type="number" min="100" max="999" step="1" value={input} onChange={e => { setInput(e.target.value); setStep(0); }} /></label>
    {!result && <p role="status">{tr("Use 100–999, with first digit − last digit ≥ 2.", "Введите число 100–999, у которого первая цифра − последняя цифра ≥ 2.")}</p>}
    {result && <>
      <p>{tr("First reverse the digits and subtract. Then reverse the result and add it back.", "Сначала переверните цифры и вычтите. Затем переверните результат и прибавьте его.")}</p>
      <div className="magic-equations" aria-live="polite">
        {step >= 1 && <p>{input} − {String(result.reverse).padStart(3, "0")} = {result.difference}</p>}
        {step >= 2 && <p>{result.difference} + {result.reversedDifference} = <strong>{result.sum}</strong></p>}
      </div>
      {step < 3 && <button className="button" onClick={() => setStep(step + 1)}>{step === 0 ? tr("Reverse and subtract", "Перевернуть и вычесть") : step === 1 ? tr("Reverse and add", "Перевернуть и сложить") : tr("Why does this happen?", "Почему так получается?")}</button>}
      {step === 3 && <p className="explanation">{tr("Let d be the difference between the first and last digits (2–9). The subtraction is 99d. Its digits are (d−1), 9, (10−d). Adding its reverse gives 100×9 + 10×18 + 9 = 1089, regardless of the middle digit. Try another starting number.", "Пусть d — разность первой и последней цифр (2–9). Разность чисел равна 99d. Её цифры: (d−1), 9, (10−d). При сложении с перевёрнутым числом получаем 100×9 + 10×18 + 9 = 1089 независимо от средней цифры. Попробуйте другое исходное число.")}</p>}
    </>}
  </div>;
}

function Subtraction(props: ActivityProps) {
  return <MagicLesson key={props.locale} {...props} kind="subtraction" explorer={<SubtractionExamples {...props} />} />;
}

function HourglassSimulator({ locale }: ActivityProps) {
  const [state, setState] = useState<GlassState>({ time: 0, remaining: [0, 0] });
  const [mark, setMark] = useState<number | null>(null);
  const [hint, setHint] = useState(0);
  const tr = (en: string, ru: string) => t(locale, en, ru);
  const elapsed = mark === null ? null : state.time - mark;
  const hints = [
    tr("Start both hourglasses together. Wait until the seven-minute glass empties.", "Запустите оба прибора одновременно. Дождитесь окончания семиминутных часов."),
    tr("At that moment, start measuring your interval. The eleven-minute glass has four minutes left.", "В этот момент начните отсчёт интервала. В одиннадцатиминутных часах осталось четыре минуты."),
    tr("When those four minutes end, flip the eleven-minute glass. Let all eleven minutes run: 4 + 11 = 15.", "Когда эти четыре минуты пройдут, переверните одиннадцатиминутные часы. Дождитесь окончания: 4 + 11 = 15."),
  ];
  return <div className="activity-layout magic magic-hourglasses">
    <p>{tr("Measure exactly 15 minutes using only these two glasses. You may prepare them before starting your measured interval. Advance only to the next empty glass; the numbers below make the simulation visible, not an extra stopwatch.", "Отмерьте ровно 15 минут только этими часами. Подготовка до начала отсчёта разрешена. Переходите только к опустошению следующих часов; числа поясняют модель, а не дают дополнительный секундомер.")}</p>
    <div className="magic-glasses">{([11, 7] as const).map((capacity, index) => <div key={capacity}>
      <svg viewBox="0 0 140 180" role="img" aria-label={`${capacity}: ${state.remaining[index]} ${tr("minutes remaining", "минут осталось")}`}>
        <path d="M25 15H115L105 50 78 90 105 130 115 165H25L35 130 62 90 35 50Z" fill="none" stroke="currentColor" strokeWidth="4"/>
        <path d={`M35 155H105L70 ${155 - 50 * (1 - state.remaining[index] / capacity)}Z`} fill="#d8a843"/>
        <path d={`M35 25H105L70 ${25 + 50 * state.remaining[index] / capacity}Z`} fill="#d8a843"/>
        <text x="70" y="100" textAnchor="middle" fill="currentColor" fontSize="18">{state.remaining[index]}</text>
      </svg>
      <button className="button" onClick={() => setState(flipGlass(state, index as 0 | 1))}>{tr("Flip", "Перевернуть")} {capacity} {tr("min", "мин")}</button>
    </div>)}</div>
    <div className="controls">
      <button className="button" disabled={!state.remaining.some(n => n > 0)} onClick={() => setState(nextEmpty(state))}>{tr("Wait until a glass empties", "Ждать опустошения часов")}</button>
      <button className="button button-secondary" disabled={mark !== null} onClick={() => setMark(state.time)}>{tr("Start my measured interval now", "Начать мой отсчёт сейчас")}</button>
      <button className="button button-secondary" onClick={() => { setState({ time: 0, remaining: [0, 0] }); setMark(null); setHint(0); }}>{tr("Reset", "Сначала")}</button>
    </div>
    <p className="activity-status" aria-live="polite">{tr("Simulation time", "Время модели")}: {state.time} {tr("min", "мин")}. {elapsed === null ? tr("Interval not started.", "Отсчёт не начат.") : `${tr("Your interval", "Ваш интервал")}: ${elapsed} ${tr("min", "мин")}.`}
      {elapsed === 15 && ` ${tr("Exactly fifteen minutes — solved!", "Ровно пятнадцать минут — решено!")}`}
      {elapsed !== null && elapsed > 15 && ` ${tr("Past fifteen. Reset and try again.", "Больше пятнадцати. Попробуйте сначала.")}`}</p>
    {hint < 3 && <button className="button button-secondary" onClick={() => setHint(hint + 1)}>{tr("Show next hint", "Следующая подсказка")}</button>}
    {hints.slice(0, hint).map((text, index) => <p className="explanation" key={index}>{text}</p>)}
  </div>;
}

function Hourglasses(props: ActivityProps) {
  return <MagicLesson key={props.locale} {...props} kind="hourglasses" explorer={<HourglassSimulator {...props} />} />;
}

export default function Magic(props: ActivityProps) {
  if (props.activityId.startsWith("magic-mouse-")) return <MouseMaze key={props.activityId} {...props} />;
  if (props.activityId === "magic-mindread") return <Mindread {...props} />;
  if (props.activityId === "magic-mistic-subtraction") return <Subtraction {...props} />;
  return <Hourglasses {...props} />;
}
