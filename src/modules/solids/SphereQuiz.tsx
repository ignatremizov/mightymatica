import { useState } from "react";
import { t } from "../../shared/contracts";
import type { Locale } from "../../shared/contracts";
import { sphereQuiz, sphereQuizNext } from "./sphereQuiz";

export default function SphereQuiz({ locale }: { locale: Locale }) {
  const [stage, setStage] = useState(0);
  const [answer, setAnswer] = useState<number | null>(null);
  const q = sphereQuiz[stage];
  const reset = () => { setStage(0); setAnswer(null); };
  return <section aria-label={t(locale, "Sphere quiz", "Проверка знаний о шаре")}>
    <h2>{t(locale, "Sphere quiz", "Проверка знаний о шаре")}{q ? ` ${stage + 1}/8` : ""}</h2>
    <p className="activity-note">{t(locale, "From the Russian lesson; English is a new translation.", "Из русского урока; английский текст — новый перевод.")}</p>
    {q ? <>
      <p>{t(locale, q.en, q.ru)}</p>
      <div className="choice-grid">{q.enChoices.map((choice, i) => <button className="button button-secondary" key={`${stage}-${i}`} aria-pressed={answer === i} onClick={() => setAnswer(i)}>{locale === "ru" ? q.ruChoices[i] : choice}</button>)}</div>
      <p className="activity-status" aria-live="polite">{answer === null ? t(locale, "Choose an answer.", "Выберите ответ.") : answer === q.correct ? t(locale, q.whyEn, q.whyRu) : t(locale, "Not yet. Try again.", "Неправильно. Подумайте ещё.")}</p>
      {answer === q.correct && "noteEn" in q && <p className="activity-note">{t(locale, q.noteEn, q.noteRu)}</p>}
      <button className="button" disabled={answer !== q.correct} onClick={() => { setStage(sphereQuizNext(stage, answer!)); setAnswer(null); }}>{t(locale, "Next", "Далее")}</button>
    </> : <p className="activity-status" role="status">{t(locale, "Congratulations! You did it!", "Поздравляем! Всё получилось!")}</p>}
    <button className="button button-secondary" onClick={reset}>{t(locale, "Restart quiz", "Начать проверку сначала")}</button>
  </section>;
}
