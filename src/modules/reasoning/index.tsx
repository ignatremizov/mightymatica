import { useState } from "react";
import type { PointerEvent, ReactNode } from "react";
import type { ActivityProps, Locale } from "../../shared/contracts";
import { lessons } from "./content";
import { ageTriples, fingerAt, mixedTransfer, snailHeight, waterRoute } from "./rules";
import "./reasoning.css";
import ParadoxBox from "./ParadoxBox";
import { NativeArtwork } from "./NativeArtwork";
import { answerReasoningQuestion, reasoningQuestions } from "./questionGate";
import type { QuestionAttempt } from "./questionGate";

const fingers = [
  ["Thumb", "Большой"], ["Index", "Указательный"], ["Middle", "Средний"],
  ["Ring", "Безымянный"], ["Pinkie", "Мизинец"],
];
function localized(locale: Locale, pair: readonly string[]) { return pair[locale === "ru" ? 1 : 0] ?? pair[0]; }
function Diagram({ children, label }: { children: ReactNode; label: string }) {
  return <svg className="diagram reasoning-diagram" viewBox="0 0 600 300" role="img" aria-label={label}>
    <title>{label}</title>{children}
  </svg>;
}
function Explorer({ kind, locale, revealed }: { kind: string; locale: Locale; revealed: boolean }) {
  const [value, setValue] = useState(kind === "bacteria" ? 55 : kind === "staruhi" ? 4 : kind === "grandma" ? 5 : 1);
  const [step, setStep] = useState(0);
  const tr = (en: string, ru: string) => locale === "ru" ? ru : en;
  const range = (label: string, min: number, max: number, increment = 1) => <label className="control reasoning-range">
    <span>{label}: {value}</span><input type="range" min={min} max={max} step={increment} value={value}
      onChange={event => setValue(Number(event.target.value))} />
  </label>;
  const steps = (labels: string[]) => <div className="controls" aria-label={tr("Diagram steps", "Шаги схемы")}>
    {labels.map((label, i) => <button className="button button-secondary" key={label}
      aria-pressed={step === i} onClick={() => setStep(i)}>{label}</button>)}
  </div>;
  if (kind === "burninghouse") {
    const x = 50 + value * 50;
    const reflect = revealed || step === 1;
    const moveStop = (event: PointerEvent<SVGGElement>) => {
      const svg = event.currentTarget.ownerSVGElement;
      const matrix = svg?.getScreenCTM();
      if (!svg || !matrix) return;
      const point = svg.createSVGPoint();
      point.x = event.clientX;
      point.y = event.clientY;
      const local = point.matrixTransform(matrix.inverse());
      setValue(Math.round(Math.max(0, Math.min(10, (local.x - 50) / 50)) * 10) / 10);
    };
    return <>
      {range(tr("Water stop", "Точка забора воды"), 0, 10, 0.1)}
      <p className="activity-note">{tr("Tap or drag along the river to move the water stop.", "Нажмите на реку или проведите вдоль неё, чтобы переместить точку забора воды.")}</p>
      {steps([tr("Route", "Маршрут"), tr("Reflect B", "Отразить B")])}
      <Diagram label={tr("Route from engine A through a river stop to house B", "Маршрут от машины A через реку к дому B")}>
        <path d="M30 170H570" stroke="#49b8cb" strokeWidth="20" />
        <text x="30" y="205">{tr("River", "Река")}</text>
        <path d={`M100 50L${x} 170L500 90`} fill="none" stroke="#f7c36c" strokeWidth="4" />
        <circle cx="100" cy="50" r="9" fill="#f7c36c" /><text x="80" y="30">A</text>
        <circle cx="500" cy="90" r="9" fill="#f7c36c" /><text x="515" y="88">B</text>
        <circle cx={x} cy="170" r="8" fill="white" />
        {reflect && <><path d={`M500 90V250M100 50L500 250M${x} 170L500 250`} stroke="#ac97e8" strokeDasharray="6 5" fill="none" strokeWidth="3" />
          <circle cx="500" cy="250" r="8" fill="#ac97e8" /><text x="515" y="255">B′</text></>}
        <g className="reasoning-river-input"
          onPointerDown={event => {
            if (!event.isPrimary || event.button !== 0) return;
            event.currentTarget.setPointerCapture(event.pointerId);
            moveStop(event);
          }}
          onPointerMove={event => { if (event.currentTarget.hasPointerCapture(event.pointerId)) moveStop(event); }}
          onPointerUp={event => {
            if (!event.currentTarget.hasPointerCapture(event.pointerId)) return;
            moveStop(event);
            event.currentTarget.releasePointerCapture(event.pointerId);
          }}>
          <rect x="30" y="148" width="540" height="44" fill="transparent" />
        </g>
      </Diagram>
      <p className="activity-status">{tr("Route length in diagram units", "Длина в единицах схемы")}: {waterRoute(value).toFixed(3)}</p>
    </>;
  }
  if (kind === "grandma") return <>
    {range(tr("Destination floor", "Этаж назначения"), 2, 9)}
    <Diagram label={tr("Floors and the flights between them", "Этажи и пролёты между ними")}>
      {Array.from({ length: 9 }, (_, i) => <g key={i}>
        <path d={`M${45 + i * 56} ${260 - i * 26}h40v-26`} fill="none" stroke={i < value - 1 ? "#f7c36c" : "#6a7898"} strokeWidth="5" />
        <text x={45 + i * 56} y={285 - i * 26}>{i + 1}</text>
      </g>)}
      <circle cx={45 + (value - 1) * 56} cy={244 - (value - 1) * 26} r="10" fill="#ac97e8" />
    </Diagram>
    <p className="activity-status">{tr("Flights climbed", "Пройдено пролётов")}: {value - 1}. {tr("Time", "Время")}: {((value - 1) * 1.25).toFixed(2)} {tr("minutes", "минут")}.</p>
  </>;
  if (kind === "snail") return <>
    <div className="controls">
      <button className="button" disabled={step >= 17} onClick={() => setStep(s => Math.min(17, s + 1))}>
        {step % 2 === 0 ? tr("Climb through the day", "Дневной подъём") : tr("Slide through the night", "Ночной спуск")}</button>
      <button className="button button-secondary" onClick={() => setStep(0)}>{tr("Restart", "Сначала")}</button>
    </div>
    <Diagram label={tr("Snail height on a ten-metre wall", "Высота улитки на десятиметровой стене")}>
      <rect x="220" y="30" width="140" height="230" rx="8" fill="#26374e" />
      {Array.from({ length: 11 }, (_, i) => <g key={i}><path d={`M205 ${260 - i * 22}h165`} stroke="#63738e" />
        <text x="165" y={266 - i * 22}>{i} m</text></g>)}
      <circle cx="285" cy={260 - snailHeight(step) * 22} r="15" fill="#f7c36c" />
      <path d={`M286 ${260 - snailHeight(step) * 22}q-14 -12 -14 3t17 1`} fill="none" stroke="#26374e" strokeWidth="3" />
    </Diagram>
    <p className="activity-status" aria-live="polite">{tr("Day", "День")} {Math.max(1, Math.ceil(step / 2))} · {snailHeight(step)} m
      {step >= 17 ? tr(" · Top reached—no further slide.", " · Вершина достигнута — спуска больше нет.") : step === 0 ? tr(" · Before starting", " · До начала") : step % 2 ? tr(" · After climbing", " · После подъёма") : tr(" · After sliding", " · После спуска")}</p>
  </>;
  if (kind === "hand") return <>
    {range(tr("Count", "Число"), 1, 1001)}
    <div className="controls"><button className="button" disabled={value >= 1001} onClick={() => setValue(n => Math.min(1001, n + 1))}>{tr("Next count", "Следующее число")}</button>
      {[1, 9, 17, 1000].map(n => <button className="button button-secondary" key={n} onClick={() => setValue(n)}>{n}</button>)}</div>
    <Diagram label={tr("Five fingers counted back and forth", "Пять пальцев: счёт туда и обратно")}>
      {fingers.map((finger, i) => <g key={finger[0]}>
        <rect x={35 + i * 111} y={80 - (i === 2 ? 25 : 0)} width="70" height={140 + (i === 2 ? 25 : 0)} rx="35"
          fill={fingerAt(value) === i ? "#f7c36c" : "#394b66"} />
        <text className="reasoning-finger-label" x={70 + i * 111} y="250" textAnchor="middle">{localized(locale, finger)}</text>
        {fingerAt(value) === i && <text x={70 + i * 111} y="190" fill="#111c30" textAnchor="middle">{value}</text>}
      </g>)}
    </Diagram>
    <p className="activity-status">{value}: {localized(locale, fingers[fingerAt(value)])}</p>
  </>;
  if (kind === "bacteria") {
    const fraction = 2 ** (value - 60);
    return <>{range(tr("Seconds elapsed", "Прошло секунд"), 0, 60)}
      <Diagram label={tr("Proportion of the glass occupied by bacteria", "Доля стакана, занятая бактериями")}>
        <rect x="210" y="30" width="180" height="230" fill="#26374e" />
        <rect x="215" y={255 - 220 * fraction} width="170" height={220 * fraction} fill="#8accb3" />
        <path d="M210 30V260H390V30" stroke="#dce5ee" strokeWidth="5" fill="none" />
        <path d="M200 145H400" stroke="#f7c36c" strokeDasharray="5 5" />
        <text x="410" y="150">½</text>
      </Diagram>
      <p className="activity-status">{value} s · {fraction < 0.0001 ? fraction.toExponential(2) : (fraction * 100).toFixed(4) + "%"} {tr("of capacity", "вместимости")}</p>
      <p className="activity-note">{tr("The model shows volume proportion, not individual organisms.", "Модель показывает долю объёма, а не отдельных бактерий.")}</p></>;
  }
  if (kind === "turtles") return <>
    {steps([tr("First turtle", "Первая"), tr("Second turtle", "Вторая"), tr("Last turtle", "Последняя")])}
    <Diagram label={tr("Three turtles moving left in a straight line", "Три черепахи идут налево по прямой")}>
      <path d="M50 230H550M75 215L50 230L75 245" stroke="#8accb3" fill="none" strokeWidth="4" />
      {[0, 1, 2].map(i => <g key={i}>
        <ellipse cx={130 + i * 170} cy="150" rx="50" ry="32" fill={i === step ? "#f7c36c" : "#8accb3"} />
        <circle cx={72 + i * 170} cy="150" r="16" fill="#8accb3" />
        <text x={130 + i * 170} y="110" textAnchor="middle">{i + 1}</text>
      </g>)}
    </Diagram>
    <p className="activity-status">{[
      tr("First says: none ahead, two behind.", "Первая говорит: впереди никого, позади две."),
      tr("Second says: one ahead, one behind.", "Вторая говорит: одна впереди, одна позади."),
      tr("Last says: two ahead, one behind.", "Последняя говорит: две впереди, одна позади."),
    ][step]}</p>
    <p>{tr("Count for yourself: does this statement match the diagram?", "Посчитайте: соответствует ли высказывание схеме?")}</p>
  </>;
  if (kind === "wine") {
    const result = mixedTransfer(10, 4, 1);
    const wineInGlass = step === 0 ? 0 : step === 1 ? 1 : result.wineInGlass;
    const milkInBarrel = step < 2 ? 0 : result.milkInBarrel;
    return <>
      {steps([tr("Before transfer", "До переливания"), tr("Wine → milk, mix", "Вино → молоко, смешать"), tr("Return equal volume", "Вернуть равный объём")])}
      <Diagram label={tr("Wine barrel and milk glass with transferred portions", "Бочка вина и стакан молока с перелитыми долями")}>
        <rect x="65" y="55" width="200" height="200" fill="#9c526e" />
        <rect x="65" y={255 - milkInBarrel * 20} width="200" height={milkInBarrel * 20} fill="#e8e0ce" />
        {step === 1 && <rect x="65" y="55" width="200" height="20" fill="#172438" />}
        <rect x="365" y={255 - (step === 1 ? 5 : 4) * 20} width="140" height={(step === 1 ? 5 : 4) * 20} fill="#e8e0ce" />
        <rect x="365" y={255 - wineInGlass * 20} width="140" height={wineInGlass * 20} fill="#9c526e" />
        <path d="M365 130V255H505V130" fill="none" stroke="#dce5ee" strokeWidth="4" />
        <text x="160" y="30" textAnchor="middle">{tr("Wine barrel", "Бочка вина")}</text>
        <text x="435" y="105" textAnchor="middle">{tr("Milk glass", "Стакан молока")}</text>
      </Diagram>
      <p className="activity-status">{tr("Wine in glass", "Вино в стакане")}: {wineInGlass.toFixed(2)} · {tr("Milk in barrel", "Молоко в бочке")}: {milkInBarrel.toFixed(2)}</p>
      <p className="activity-note">{tr("Same vertical volume scale; the mixed components are drawn separately to make them visible.", "Единый вертикальный масштаб объёма; смешанные компоненты показаны раздельно для наглядности.")}</p>
      <p className="activity-note">{tr("Illustrative units: wine 10, milk 4, transfer 1. Final proportions assume uniform mixing; the equality does not require it.", "Условные единицы: вина 10, молока 4, переливание 1. Численные доли предполагают перемешивание; равенство объёмов от этого не зависит.")}</p>
    </>;
  }
  if (kind === "tram") {
    const triples = ageTriples(36);
    const candidates = step === 0 ? triples : triples.filter(ages => ages.reduce((a, b) => a + b, 0) === 13);
    return <>
      {steps([tr("Product clue", "Произведение"), tr("Ambiguous sum", "Неоднозначная сумма"), tr("Unique oldest", "Единственный старший")])}
      <p>{tr("Each row is one possible family. Product = 36.", "Каждая строка — возможная семья. Произведение = 36.")}</p>
      <div className="reasoning-table-wrap"><table className="reasoning-table"><thead><tr>
        <th>{tr("Ages", "Возраст")}</th><th>{tr("Sum / tram", "Сумма / трамвай")}</th><th>{tr("Unique oldest?", "Единственный старший?")}</th>
      </tr></thead><tbody>{candidates.map(ages => <tr key={ages.join("-")}>
        <td>{ages.join(" × ")}</td><td>{ages.reduce((a, b) => a + b, 0)}</td>
        <td>{step < 2 ? "—" : ages[1] < ages[2] ? tr("Yes", "Да") : tr("No", "Нет")}</td>
      </tr>)}</tbody></table></div>
    </>;
  }
  if (kind === "staruhi") {
    const meetingX = 70 + 460 * 0.6;
    return <>{range(tr("Try hours before noon (T)", "Пробуйте время до полудня (T)"), 1, 9)}
      <Diagram label={tr("Two towns, meeting point, and walking distances", "Два города, место встречи и пройденные пути")}>
        <path d="M70 140H530" stroke="#6a7898" strokeWidth="8" />
        <circle cx="70" cy="140" r="12" fill="#f7c36c" /><text x="60" y="110">A</text>
        <circle cx="530" cy="140" r="12" fill="#ac97e8" /><text x="520" y="110">B</text>
        <path d={`M70 180H${meetingX}M${meetingX} 210H530`} stroke="#f7c36c" strokeWidth="4" />
        <text x="180" y="205">v₁T = 9v₂</text><text x="385" y="245">v₂T = 4v₁</text>
        <circle cx={meetingX} cy="140" r="10" fill="#8accb3" /><text x={meetingX} y="80" textAnchor="middle">{tr("Noon", "Полдень")}</text>
      </Diagram>
      <p className="activity-status">{tr("From the 4-hour arrival, v₁/v₂ = T/4", "Из прибытия через 4 часа: v₁/v₂ = T/4")}: {(value / 4).toFixed(3)}.
        {" "}{tr("From the 9-hour arrival, v₁/v₂ = 9/T", "Из прибытия через 9 часов: v₁/v₂ = 9/T")}: {(9 / value).toFixed(3)}.</p>
      <p>{tr("Find a T where both speed ratios agree. The diagram is schematic.", "Найдите T, при котором отношения скоростей совпадают. Рисунок схематический.")}</p>
    </>;
  }
  // The hunter's three route legs are explicitly stepped, not autoplayed.
  const points = [[300, 135], [300, 230], [205, 135], [300, 135]];
  return <>
    {steps([tr("Start", "Начало"), tr("South", "Юг"), tr("West", "Запад"), tr("North / return", "Север / возврат")])}
    <Diagram label={tr("Schematic polar view of the hunter route", "Схематический полярный вид маршрута охотника")}>
      <circle cx="300" cy="135" r="110" fill="#26374e" stroke="#6a7898" strokeWidth="3" />
      <circle cx="300" cy="135" r="95" fill="none" stroke="#6a7898" strokeDasharray="4 5" />
      {step >= 1 && <path d="M300 135V230" stroke="#f7c36c" strokeWidth="4" />}
      {step >= 2 && <path d="M300 230A95 95 0 0 1 205 135" fill="none" stroke="#f7c36c" strokeWidth="4" />}
      {step >= 3 && <path d="M205 135H300" stroke="#f7c36c" strokeWidth="4" />}
      <circle cx={points[step][0]} cy={points[step][1]} r="9" fill="#8accb3" />
      {(revealed || step > 0) && <text x="300" y="120" textAnchor="middle">{tr("North Pole", "Северный полюс")}</text>}
    </Diagram>
    <p className="activity-note">{tr("Polar projection; angles are schematic, not to scale. Choose a leg to explore the intended polar route. English source distances are miles; Russian source distances are kilometres.", "Полярная проекция; углы условные, не в масштабе. Выберите участок пути для исследования полярного маршрута. В английском источнике мили, в русском километры.")}</p>
  </>;
}
function LessonView({ activityId, locale, reducedMotion }: ActivityProps) {
  const lesson = lessons.find(item => `reasoning-${item.key}` === activityId);
  const [hint, setHint] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [reset, setReset] = useState(0);
  const [attempt, setAttempt] = useState<QuestionAttempt>("unanswered");
  const [phase, setPhase] = useState<"intro" | "question" | "wrong" | "solution">("intro");
  const [questionReady, setQuestionReady] = useState(false);
  const [branchComplete, setBranchComplete] = useState(false);
  if (!lesson) return <p>Unknown reasoning activity.</p>;
  const text = (pair: readonly string[]) => localized(locale, pair);
  const question = reasoningQuestions[lesson.key];
  const unlocked = branchComplete && (!question || attempt === "correct");
  const restart = () => {
    setAttempt("unanswered"); setHint(0); setRevealed(false); setPhase("intro");
    setQuestionReady(false); setBranchComplete(false); setReset(n => n + 1);
  };
  return <section className={`activity-layout reasoning-family reasoning-kind-${lesson.key}`}>
    <p className="reasoning-question">{text(lesson.question)}</p>
    <NativeArtwork key={`${reset}-${phase}`} family={lesson.key} locale={locale}
      reducedMotion={reducedMotion} label={text(lesson.title)} phase={phase}
      onComplete={() => {
        setBranchComplete(true);
        if (phase === "intro" && question) setQuestionReady(true);
      }}
      onRestart={() => {
        setBranchComplete(false);
        if (phase === "intro") setQuestionReady(false);
      }} />
    {question && questionReady && phase !== "wrong" && phase !== "solution" && <>
      <fieldset>
        <legend>{text(question.prompt)}</legend>
        <p className="activity-note">{text(["Choose using the buttons below the illustration.", "Выберите ответ кнопками под иллюстрацией."])}</p>
        <div className="controls">{question.choices.map((choice, index) =>
          <button key={index} className="button button-secondary"
            onClick={() => {
              const result = answerReasoningQuestion(question, index);
              setAttempt(result); setQuestionReady(false); setBranchComplete(false);
              setPhase(result === "correct" ? "solution" : "wrong");
            }}>{text(choice)}</button>)}</div>
      </fieldset>
    </>}
    {question && (questionReady || attempt !== "unanswered") && <p className="activity-status" role="status">{attempt === "retry"
      ? text(["Not quite. Try again.", "Пока неверно. Попробуйте ещё раз."])
      : attempt === "correct" ? text(["Correct! Watch the solution.", "Правильно! Посмотрите решение."])
        : text(["Choose an answer to continue.", "Выберите ответ, чтобы продолжить."])}</p>}
    {phase === "wrong" && branchComplete && <button className="button" onClick={() => {
      setPhase("question"); setQuestionReady(true); setBranchComplete(false);
    }}>{text(["Try again", "Попробовать ещё раз"])}</button>}
    {unlocked && <details><summary>{text(["Explore a mathematical diagram", "Исследовать математическую схему"])}</summary>
      <Explorer key={reset} kind={lesson.key} locale={locale} revealed={revealed} />
      <div className="controls">
        <button className="button button-secondary" disabled={hint >= lesson.clues.length}
          onClick={() => setHint(n => n + 1)}>{text(["Next hint", "Следующая подсказка"])} ({hint}/{lesson.clues.length})</button>
        <button className="button" aria-expanded={revealed} onClick={() => setRevealed(v => !v)}>
          {revealed ? text(["Hide explanation", "Скрыть объяснение"]) : text(["Reveal explanation", "Показать объяснение"])}</button>
      </div>
      <div className="explanation" aria-live="polite">
        {lesson.clues.slice(0, hint).map((clue, i) => <p key={i}>{text(clue)}</p>)}
        {revealed && <p>{text(lesson.answer)}</p>}
      </div>
    </details>}
    <button className="button button-secondary" onClick={restart}>
      {text(["Start again", "Начать заново"])}</button>
  </section>;
}
export default function Reasoning(props: ActivityProps) {
  if (props.activityId.startsWith("reasoning-paradox-")) return <ParadoxBox key={`${props.activityId}-${props.locale}`} {...props} />;
  return <LessonView key={`${props.activityId}-${props.locale}`} {...props} />;
}
