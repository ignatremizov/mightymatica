import { useEffect, useRef, useState } from "react";
import type { ActivityProps } from "../../shared/contracts";
import data from "./questions.json";
import { audiencePoll, fiftyFiftyChoices, gradeAnswer, lossPrize, phoneAdvice, prizes, questionNote } from "./rules";
import { useQuizMusic } from "./useQuizMusic";
import "./quiz.css";

type QuizId = keyof typeof data;

export default function Quiz({ activityId, locale }: ActivityProps) {
  if (!(activityId in data)) return <p>Unknown quiz.</p>;
  return <QuizSession key={activityId} id={activityId as QuizId} russian={locale === "ru"} />;
}

function QuizSession({ id, russian }: { id: QuizId; russian: boolean }) {
  const quiz = data[id];
  const music = useQuizMusic();
  const [started, setStarted] = useState(false);
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<(number | undefined)[]>([]);
  const [selected, setSelected] = useState<number | undefined>();
  const [walkedAway, setWalkedAway] = useState(false);
  const [fiftyUsed, setFiftyUsed] = useState(false);
  const [visibleChoices, setVisibleChoices] = useState<number[] | null>(null);
  const [audienceUsed, setAudienceUsed] = useState(false);
  const [phoneUsed, setPhoneUsed] = useState(false);
  const [help, setHelp] = useState("");
  const complete = index === quiz.questions.length;
  const question = quiz.questions[Math.min(index, quiz.questions.length - 1)];
  const submitted = answers[index] !== undefined;
  const questionHeading = useRef<HTMLLegendElement>(null);
  const completion = useRef<HTMLParagraphElement>(null);
  const focusRequested = useRef(false);
  useEffect(() => {
    if (!focusRequested.current) return;
    focusRequested.current = false;
    // Keep the keyboard path at the current step when its old control disappears.
    if (complete || walkedAway) completion.current?.focus();
    else questionHeading.current?.focus();
  }, [index, answers, complete, walkedAway, started]);
  const note = questionNote(id, index);
  const score = answers.reduce<number>((sum, choice, position) =>
    sum + (choice !== undefined && gradeAnswer(id, position, quiz.questions[position], choice) === true ? 1 : 0), 0);
  const scored = answers.filter((choice, position) => choice !== undefined && !questionNote(id, position)).length;
  const reset = () => {
    setStarted(true); music.play("question");
    focusRequested.current = true;
    setIndex(0); setAnswers([]); setSelected(undefined); setWalkedAway(false);
    setFiftyUsed(false); setVisibleChoices(null);
    setAudienceUsed(false); setPhoneUsed(false); setHelp("");
  };
  const result = submitted ? gradeAnswer(id, index, question, answers[index]!) : undefined;
  const lost = result === false;
  const finished = complete || lost || walkedAway;
  const prize = lost ? lossPrize(index) : prizes[complete ? 15 : index + Number(result === true)];

  return <section className="activity-layout permutations-quiz" aria-label={russian ? "Викторина о перестановках" : "Permutations quiz"}>
    <p>{russian
      ? "Выберите и подтвердите ответ. Ошибка завершает игру. После верного ответа можно забрать выигрыш. Суммы условные. Вопросы — на английском."
      : "Choose and confirm an answer. A wrong answer ends the game. After a correct answer, continue or walk away. Prizes are imaginary."}</p>
    <label className="control"><input type="checkbox" checked={music.enabled} onChange={event =>
      music.toggle(event.currentTarget.checked, finished ? null : started ? "question" : "theme")} />
      {russian ? "Музыка" : "Music"}</label>
    {music.status === "loading" && <p role="status">{russian ? "Загрузка музыки…" : "Loading music…"}</p>}
    {music.status === "error" && <p role="status">{russian ? "Не удалось воспроизвести музыку." : "The music could not be played."}{" "}
      {!finished && <button className="button-secondary" onClick={() => music.play(started ? "question" : "theme")}>{russian ? "Повторить" : "Retry music"}</button>}
    </p>}
    <div className="activity-status" role="status" aria-live="polite">
      {!started ? (russian ? "Готовы начать?" : "Ready to begin?") : finished ? (russian ? "Игра завершена." : "Game over.") : `${russian ? "Вопрос" : "Question"} ${index + 1} / ${quiz.questions.length}`}
      {" · "}{russian ? "Верных ответов" : "Correct answers"}: {score} / {scored}
      {" · "}{russian ? "Выигрыш" : "Prize"}: ${prize}
    </div>
    <progress max={quiz.questions.length} value={complete ? quiz.questions.length : index}
      aria-label={russian ? "Прогресс викторины" : "Quiz progress"} />
    {!started ? <button className="button" onClick={() => {
      focusRequested.current = true; setStarted(true); music.play("question");
    }}>{russian ? "Начать игру" : "Start quiz"}</button> : !complete && !walkedAway ? <>
      <fieldset disabled={submitted}>
        <legend ref={questionHeading} tabIndex={-1} lang="en">{question.question}</legend>
        {id === "quiz-permutations" && index === 6 && <p lang="en">As in the previous question, there are 3 boys and 2 girls.</p>}
        <div className="choice-grid">
          {question.choices.map((choice, position) => (!visibleChoices || visibleChoices.includes(position)) && <label className={`control quiz-choice${selected === position ? " is-selected" : ""}`} key={position}>
            <input type="radio" name={`answer-${index}`} checked={selected === position}
              onChange={() => setSelected(position)} />
            <span lang="en">{String.fromCharCode(65 + position)}. {choice}</span>
          </label>)}
        </div>
      </fieldset>
      {!submitted && <div className="controls"><button className="button-secondary" disabled={fiftyUsed || !!note} onClick={() => {
        setVisibleChoices(fiftyFiftyChoices(question, Math.floor(Math.random() * 3)));
        setSelected(undefined); setFiftyUsed(true);
      }}>{russian ? "50:50 — один раз за игру" : "50:50 — once per game"}</button>
        <button className="button-secondary" disabled={audienceUsed || !!note} onClick={() => {
          const votes = audiencePoll(question, Math.random);
          setAudienceUsed(true);
          setHelp(`${russian ? "Голосование зрителей" : "Audience poll"}: ${votes.map((vote, position) => `${String.fromCharCode(65 + position)} ${vote}%`).join(" · ")}`);
        }}>{russian ? "Помощь зала" : "Ask the audience"}</button>
        {(["galileo", "benjamin"] as const).map(friend => <button key={friend} className="button-secondary" disabled={phoneUsed || !!note} onClick={() => {
          const advice = phoneAdvice(question, friend, Math.random);
          setPhoneUsed(true);
          setHelp(advice.choice === null ? (russian ? "Я не знаю ответа." : "I don’t know the answer.") :
            `${russian ? "Я думаю, ответ" : "I think the answer is"} ${String.fromCharCode(65 + advice.choice)}. ${russian ? "Уверенность" : "Confidence"}: ${advice.confidence}%.`);
        }}>{russian ? "Позвонить" : "Phone"} {friend === "galileo" ? "Galileo" : "Benjamin"}</button>)}
      </div>}
      {!submitted && note && <p>{russian ? "В этом вопросе оригинала нет верного варианта. Он не оценивается; подсказки отключены." :
        "This original question has no correct choice. It is unscored; lifelines are unavailable."}</p>}
      {!submitted && help && <p role="status">{help}</p>}
      {submitted && <div className="explanation" role="status">
        <p>{result === null ? (russian ? "Не оценивается." : "Not scored.") :
          result ? (russian ? "Верно!" : "Correct!") : (russian ? "Неверно." : "Not quite.")}
          {" "}{russian ? "Ключ оригинала" : "Original answer key"}: {String.fromCharCode(65 + question.originalAnswer)}. {question.choices[question.originalAnswer]}</p>
        {note && <p lang="en">{note}</p>}
        {id === "quiz-permutations" && index === 6 && <p lang="en">“They” refers to the preceding question’s 3 boys and 2 girls. Treat the girls as one block: 4! × 2! = 48.</p>}
        {id === "quiz-permutations" && index === 12 && <p lang="en">The original key assumes five distinct balls and four distinct tins: each ball has four choices, giving 4⁵ arrangements.</p>}
      </div>}
      <div className="controls">
        {!submitted ? <button className="button" disabled={selected === undefined} onClick={() => {
          if (selected !== undefined) {
            if (gradeAnswer(id, index, question, selected) === false) music.stop();
            setAnswers((previous) => previous[index] === undefined ? [...previous, selected] : previous);
          }
        }}>{russian ? "Подтвердить ответ" : "Confirm answer"}</button> :
          !lost && <button className="button" onClick={() => {
            if (index === quiz.questions.length - 1) music.stop();
            else music.play("question");
            focusRequested.current = true; setIndex(index + 1); setSelected(undefined); setVisibleChoices(null); setHelp("");
          }}>
            {index === quiz.questions.length - 1 ? (russian ? "Итоги" : "See results") : (russian ? "Следующий вопрос" : "Next question")}
          </button>}
        {submitted && result === true && index < quiz.questions.length - 1 && <button className="button-secondary" onClick={() => { music.stop(); focusRequested.current = true; setWalkedAway(true); }}>
          {russian ? "Забрать выигрыш" : "Walk away"} (${prizes[index + 1]})
        </button>}
      </div>
    </> : <p ref={completion} tabIndex={-1}>{russian ? "Игра завершена. Начните заново, чтобы сыграть ещё раз. Вопрос без правильного варианта не оценивается." :
      "The game has ended. Restart to play again. The question with no correct choice is excluded from scoring."}</p>}
    {lost && <p role="status">{russian ? "Неверный ответ завершает игру. Начните заново." : "A wrong answer ends the game. Restart to try again."}</p>}
    <details><summary>{russian ? "Лестница призов" : "Prize ladder"}</summary>
      <ol>{prizes.slice(1).map((amount, position) => <li key={amount} aria-current={!finished && position === index ? "step" : undefined}>
        ${amount}{position === 4 || position === 9 ? (russian ? " — несгораемая сумма" : " — guaranteed checkpoint") : ""}
      </li>)}</ol>
    </details>
    <button className="button-secondary" onClick={reset}>{russian ? "Начать заново" : "Restart quiz"}</button>
  </section>;
}
