import { useEffect, useMemo, useState, type ReactNode } from "react";
import type { ActivityProps } from "../../shared/contracts";
import OriginalLessonPlayer from "../../shared/OriginalLessonPlayer";
import { validateOriginalLesson } from "../../shared/OriginalLesson";
import { sourceTriangleOptions } from "./SourceTriangleQuiz";
import { triangleCorrectChoice, triangleLessonTransport } from "./TriangleLessonRules";
import type { TriangleLessonDefinition } from "./TriangleLessonRules";
import { triangleSourceControls } from "./sourceControls";
import sourceInteractions from "./source-interactions.json";
import SourceDragStage from "./SourceDragStage";

// Only the selected source's metadata loads. Original drawings and sound remain
// separate, lazy local media; neither manifests nor the eager shell import them.
const lessons: Record<string, () => Promise<{ default: unknown }>> = {
  "false-proof:en": () => import("./native-false-proof-en.json"),
  "false-proof:ru": () => import("./native-false-proof-ru.json"),
  "congruence:en": () => import("./native-congruence-en.json"),
  "congruence:ru": () => import("./native-congruence-ru.json"),
  "pythagoras:en": () => import("./native-pythagoras-en.json"),
  "pythagoras:ru": () => import("./native-pythagoras-ru.json"),
  "medians:en": () => import("./native-medians-en.json"),
  "medians:ru": () => import("./native-medians-ru.json"),
  "altitudes:en": () => import("./native-altitudes-en.json"),
  "altitudes:ru": () => import("./native-altitudes-ru.json"),
  "bisectors:en": () => import("./native-bisectors-en.json"),
  "bisectors:ru": () => import("./native-bisectors-ru.json"),
  "cosine-law:en": () => import("./native-cosine-law-en.json"),
  "cosine-law:ru": () => import("./native-cosine-law-ru.json"),
  "sine-law:en": () => import("./native-sine-law-en.json"),
  "sine-law:ru": () => import("./native-sine-law-ru.json"),
  "inscribed-angle:en": () => import("./native-inscribed-angle-en.json"),
  "inscribed-angle:ru": () => import("./native-inscribed-angle-ru.json"),
  "trig-addition:en": () => import("./native-trig-addition-en.json"),
  "trig-addition:ru": () => import("./native-trig-addition-ru.json"),
  "palm-trig:en": () => import("./native-palm-trig-en.json"),
};

export default function NativeTriangleLesson({ activityId, locale, reducedMotion, children }: ActivityProps & { children: ReactNode }) {
  const title = activityId.replace("triangles-", "");
  const language = title === "palm-trig" ? "en" : locale;
  const [source, setSource] = useState<TriangleLessonDefinition | null>(null);
  const [error, setError] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const [complete, setComplete] = useState(false);
  const [explore, setExplore] = useState(false);
  const [stoppedFrame, setStoppedFrame] = useState<number | null>(null);
  const ru = locale === "ru";
  useEffect(() => {
    let disposed = false;
    setSource(null); setError(false); setComplete(false); setExplore(false); setStoppedFrame(null);
    void lessons[`${title}:${language}`]!().then(module => {
      const definition = module.default as TriangleLessonDefinition;
      validateOriginalLesson(triangleLessonTransport(definition));
      if (!disposed) setSource(definition);
    }).catch(() => { if (!disposed) setError(true); });
    return () => { disposed = true; };
  }, [title, language, attempt]);
  const transport = useMemo(() => source ? triangleLessonTransport(source) : null, [source]);
  const sourceControlProps = useMemo(() => transport ? triangleSourceControls(title, language, transport) : null, [title, language, transport]);
  const interactions = sourceInteractions[`${title}:${language}` as keyof typeof sourceInteractions];
  const actions = useMemo(() => {
    const result: Record<number, { label: string; targetFrame: number }[]> = {};
    source?.gates.forEach((gate, index) => {
      const correctChoice = triangleCorrectChoice(title, index, gate.correctChoice);
      result[gate.frame] = sourceTriangleOptions(title, index, locale).map((label, choice) => ({
        label: `${choice + 1}. ${label}`,
        targetFrame: choice + 1 === correctChoice ? gate.correctStart : gate.frame + 1,
      }));
      result[gate.wrongEnd] = [{ label: ru ? "Попробовать ещё раз" : "Try again", targetFrame: gate.frame }];
    });
    if (source?.hintFrame) result[source.hintFrame] = [{
      label: ru ? "Подсказка" : "Hint", targetFrame: source.hintFrame + 1,
    }];
    return result;
  }, [source, title, locale, ru]);
  if (error) return <p role="alert">{ru ? "Не удалось загрузить урок." : "The lesson could not be loaded."}{" "}
    <button className="button" onClick={() => setAttempt(attempt + 1)}>{ru ? "Повторить" : "Try again"}</button></p>;
  if (!source || !transport || !sourceControlProps) return <p role="status">{ru ? "Загрузка урока…" : "Loading lesson…"}</p>;
  const gateIndex = source.gates.findIndex(gate => gate.correctStart === stoppedFrame);
  const question = source.gates.find(gate => gate.frame === stoppedFrame);
  const congruenceRetry = title === "congruence" && source.gates.some(gate => gate.wrongEnd === stoppedFrame);
  return <section className="triangles-native">
    {title === "false-proof" && <p>{ru ? "Это намеренно ложное доказательство. Найдите ошибку." : "This is an intentionally false proof. Find the mistake."}</p>}
    {title === "palm-trig" && ru && <p>Звук и оригинальные надписи этого урока — на английском.</p>}
    <OriginalLessonPlayer
      key={`${title}:${language}`}
      lesson={transport}
      locale={locale}
      reducedMotion={reducedMotion}
      {...sourceControlProps}
      label={ru ? "Интерактивный урок геометрии" : "Interactive geometry lesson"}
      stopActions={actions}
      onStop={setStoppedFrame}
      onLeaveStop={() => setStoppedFrame(null)}
      stageOverlay={source.interactionFrame === stoppedFrame && interactions?.vertices.length === 3
        ? <SourceDragStage vertices={interactions.vertices} mode={title as "medians" | "altitudes" | "bisectors"} locale={locale} />
        : undefined}
      onComplete={() => { setComplete(true); if (title === "false-proof") setExplore(true); }}
      onRestart={() => { setComplete(false); setExplore(false); setStoppedFrame(null); }}
    />
    {question && <details>
      <summary>{ru ? "Прочитать текст и обозначения вопроса" : "Read the question text and diagram labels"}</summary>
      <p>{question.text}</p>
    </details>}
    {congruenceRetry && <p role="status">{ru ?
      "Это условие достаточно, но два других тоже достаточны. Выберите полный ответ." :
      "That condition is sufficient, but the other two are sufficient too. Choose the complete answer."}</p>}
    {title === "medians" && gateIndex === 3 && <p role="status">{ru ?
      "Площадь треугольника равна 60√2. Медианы делят его на шесть равновеликих частей; EODA занимает две из них. Ответ: 20√2, а не 40√2." :
      "The triangle has area 60√2. Its medians form six equal-area pieces; EODA contains two of them. The answer is 20√2, not 40√2."}</p>}
    {title === "altitudes" && gateIndex === 1 && <p role="status">{ru ?
      "Гипотенуза равна 5, поэтому высота h = 3 × 4 / 5 = 2,4. В оригинальном варианте ответа 2,5 — опечатка." :
      "The hypotenuse is 5, so the altitude h = 3 × 4 / 5 = 2.4. The original answer 2.5 is a typo."}</p>}
    {title === "bisectors" && gateIndex === 5 && <p role="status">{ru ?
      "Биссектриса делит катет на 4 и 5, значит катет равен 9. Отношение соседнего катета к гипотенузе — 4:5; стороны равны 9, 12 и 15. Площадь: 9 × 12 / 2 = 54, а не 240." :
      "The bisector splits a leg into 4 and 5, so that leg is 9. The adjacent leg and hypotenuse have ratio 4:5; the sides are 9, 12 and 15. The area is 9 × 12 / 2 = 54, not 240."}</p>}
    {complete && <details open={explore} onToggle={event => setExplore(event.currentTarget.open)}>
      <summary>{title === "false-proof" ? (ru ? "Подсказка: двигайте вершины" : "Hint: move the vertices") :
        ru ? "Исследовать математику" : "Explore the mathematics"}</summary>
      {explore && children}
    </details>}
  </section>;
}
