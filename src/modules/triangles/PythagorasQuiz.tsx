import { useState } from "react";
import type { Locale } from "../../shared/contracts";

// Pifagor-gl resources/texts/245–327; answers checked mathematically,
// not inferred from the recovered timeline's jump destinations.
const questions = [
  ["Which side lengths form a right triangle?", "Какие длины сторон образуют прямоугольный треугольник?", ["5, 11, 12", "9, 12, 15", "7, 12, 9", "4, 5, 6"], 1, "9² + 12² = 15²"],
  ["Which triangle is right-angled?", "Какой треугольник прямоугольный?", ["√3, 3, 2√6", "√3, 2, √8", "√2, 4, 3√2", "√3, √5, √7"], 2, "2 + 16 = 18"],
  ["The legs are √9 and √11. Find the hypotenuse.", "Катеты равны √9 и √11. Найдите гипотенузу.", ["√19", "√20", "√21", "√22"], 1, "c² = 9 + 11 = 20"],
  ["AB and BC are adjacent sides of parallelogram ABCD; AC is a diagonal. Which is a rectangle?", "AB и BC — соседние стороны параллелограмма ABCD, AC — диагональ. Какой из них прямоугольник?", ["34, 57, 66", "31, 54, 63", "32, 55, 64", "33, 56, 65"], 3, "33² + 56² = 65²"],
  ["A right triangle has hypotenuse 10 and leg 8. Find its perimeter.", "Гипотенуза равна 10, катет — 8. Найдите периметр прямоугольного треугольника.", ["22", "23", "24", "26"], 2, "6 + 8 + 10 = 24"],
  ["A rectangle has side 12 and diagonal 13. Find its perimeter.", "Сторона прямоугольника равна 12, диагональ — 13. Найдите периметр.", ["40", "30", "50", "34"], 3, "2 × (12 + 5) = 34"],
  ["A rectangle has side 12 and diagonal 15. Find its area.", "Сторона прямоугольника равна 12, диагональ — 15. Найдите площадь.", ["182", "108", "162", "56"], 1, "12 × 9 = 108"],
  ["A rhombus has diagonals 10 and 4. Find its side length.", "Диагонали ромба равны 10 и 4. Найдите сторону.", ["√27", "√28", "√29", "√30"], 2, "s² = 5² + 2² = 29"],
] as const;

export default function PythagorasQuiz({ locale }: { locale: Locale }) {
  const ru = locale === "ru";
  const [index, setIndex] = useState(0);
  const [choice, setChoice] = useState<number | null>(null);
  const [complete, setComplete] = useState(false);
  const question = questions[index]!;
  const correct = choice === question[3];
  return <section className="explanation">
    <h3>{ru ? "Викторина" : "Quiz"}</h3>
    {complete ? <p role="status">{ru ? "Поздравляем! Вы ответили на все восемь вопросов." : "Congratulations! You answered all eight questions."}</p> : <>
      <p>{ru ? "Вопрос" : "Question"} {index + 1} / {questions.length}</p>
      <p>{question[ru ? 1 : 0]}</p>
      <div className="choice-grid">{question[2].map((answer, i) =>
        <button key={answer} className="button-secondary" disabled={correct} aria-pressed={choice === i} onClick={() => setChoice(i)}>{answer}</button>)}</div>
      <p role="status">{choice === null ? "" : correct ? `${ru ? "Верно!" : "Correct!"} ${question[4]}` : ru ? "Неверно. Попробуйте ещё раз." : "Wrong answer. Try again."}</p>
      {correct && <button className="button" onClick={() => {
        if (index === questions.length - 1) setComplete(true);
        else { setIndex(index + 1); setChoice(null); }
      }}>{ru ? "Дальше" : "Next"}</button>}
    </>}
    <button className="button-secondary" onClick={() => { setIndex(0); setChoice(null); setComplete(false); }}>{ru ? "Начать викторину заново" : "Restart quiz"}</button>
  </section>;
}
