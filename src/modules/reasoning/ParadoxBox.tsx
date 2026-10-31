import { useMemo, useState } from "react";
import type { ActivityProps } from "../../shared/contracts";
import paradoxScenes from "./paradox-scenes.json";
import OriginalLessonPlayer from "../../shared/OriginalLessonPlayer";
import { reasoningSourceControls } from "./sourceControls";
import timelines from "./native-timelines.json";
import audio from "./lesson-audio.json";
import { reasoningSegment } from "./lessonFlow";

const explanations: Record<string, [string, string]> = {
  triangle: ["The two apparent large triangles do not have one straight hypotenuse. Follow the join between the small triangles: the tiny change in slope distributes a unit of area along the long edge, rather than creating it.",
    "У двух кажущихся больших треугольников гипотенуза не является одной прямой. Проследите стык малых треугольников: небольшое изменение наклона распределяет единицу площади вдоль длинного края, а не создаёт её."],
  "egg-eight": ["Follow the slanted cuts rather than trying to identify one whole missing egg. The rearranged fragments redistribute small parts of the egg outlines. Count at each stop and compare their sizes.",
    "Следите за наклонными разрезами, а не ищите одно целиком исчезнувшее яйцо. Переставленные фрагменты перераспределяют небольшие части контуров. Считайте яйца на каждом шаге и сравнивайте их размеры."],
  "area-two": ["Compare the colored strips and the small pink piece along the cut. Matching outer outlines do not prove that all the pieces cover exactly the same area without gaps or overlap.",
    "Сравните цветные полосы и маленькую розовую часть вдоль разреза. Одинаковые внешние контуры не доказывают, что части покрывают одну и ту же площадь без зазоров и наложений."],
  "area-four": ["Track the four corner markers through the rearrangement. Examine the small squares at the joins and compare the outlines before accepting the displayed equality.",
    "Следите за четырьмя угловыми метками при перестановке. Исследуйте маленькие квадраты на стыках и сравните контуры, прежде чем принять показанное равенство."],
  chocolate: ["An extra chocolate piece cannot appear while every other piece and the outer dimensions remain unchanged. Track the diagonal seams and compare the height of the reconstructed rows; the apparent free piece is paid for by small geometric differences.",
    "Лишняя долька не может появиться при неизменных остальных частях и внешних размерах. Проследите диагональные швы и сравните высоту восстановленных рядов: кажущаяся бесплатная долька компенсируется небольшими геометрическими различиями."],
  gnomes: ["The picture changes between seven and eight gnomes by exchanging sliced sections. Compare the heights and body fragments: the change is shared across the figures, not the disappearance of one intact character.",
    "Изображение меняется между семью и восемью гномами при обмене разрезанными частями. Сравните рост и фрагменты тел: изменение распределено между фигурами, а не является исчезновением одного целого персонажа."],
  "eggs-nine-ten": ["Count the eggs before and after the picture strips move. Compare individual egg outlines and the image seams; a whole object's identity cannot be followed through a rearrangement that changes how fragments join.",
    "Посчитайте яйца до и после перемещения полос изображения. Сравните контуры яиц и швы: нельзя проследить одно целое яйцо в перестановке, меняющей соединение фрагментов."],
  people: ["The original asks which figure vanishes when the count changes between fourteen and fifteen. Track each cut line: small portions of many figures are redistributed, so there is no one whole person that walks out of the picture.",
    "Исходный вопрос: кто исчезает при изменении числа фигур между четырнадцатью и пятнадцатью? Следите за линиями разреза: перераспределяются небольшие части многих фигур, а не один целый персонаж, выходящий из картинки."],
  equality: ["8 × 8 = 64, whereas 13 × 5 = 65. The rearranged four pieces cannot form a perfect rectangle of area 65. Inspect the long diagonal seam for the thin discrepancy; the displayed equality is the paradox, not valid arithmetic.",
    "8 × 8 = 64, а 13 × 5 = 65. Четыре переставленные части не могут образовать идеальный прямоугольник площади 65. Исследуйте длинный диагональный шов: в нём скрыто тонкое расхождение. Показанное равенство — парадокс, а не верная арифметика."],
};
export default function ParadoxBox(props: ActivityProps) {
  const scene = paradoxScenes.find(item => `reasoning-paradox-${item.key}` === props.activityId);
  const [revealed, setRevealed] = useState(false);
  const [zoom, setZoom] = useState(false);
  const [complete, setComplete] = useState(false);
  const lesson = useMemo(() => scene ? reasoningSegment(audio.paradox[props.locale],
    timelines.paradox[props.locale].module, scene.first, scene.last,
    scene.key === "triangle" ? 10 : 24) : null, [scene, props.locale]);
  if (!scene || !lesson) return <p>Unknown paradox.</p>;
  const local = props.locale === "ru" ? 1 : 0;
  const controls = reasoningSourceControls("paradox", props.locale);
  return <section className="activity-layout reasoning-family">
    <p>{local ? "Проследите исходные части через всю перестановку. Меняется ли число фигур или площадь? Исследуйте швы и разрезы, затем откройте объяснение."
      : "Follow the original pieces through the rearrangement. Does the count or area change? Inspect seams and cuts, then request the explanation."}</p>
    <button className="button button-secondary" aria-pressed={zoom} onClick={() => setZoom(value => !value)}>
      {local ? "Увеличить разрезы" : "Magnify cuts"}</button>
    <div className={zoom ? "reasoning-timeline reasoning-timeline-zoom" : "reasoning-timeline"}>
      <OriginalLessonPlayer lesson={lesson} reducedMotion={props.reducedMotion} locale={props.locale}
        playbackHotspots={controls.playbackHotspots}
        label={scene.title[local]} onComplete={() => setComplete(true)}
        onRestart={() => { setComplete(false); setRevealed(false); }} />
    </div>
    <p className="activity-note">{local
      ? "Используйте управление под изображением, чтобы остановиться на разрезах и сравнить части."
      : "Use the controls below the picture to pause at the cuts and compare the pieces."}</p>
    <button className="button" disabled={!complete} aria-expanded={revealed} onClick={() => setRevealed(value => !value)}>
      {local ? revealed ? "Скрыть объяснение" : "Показать объяснение" : revealed ? "Hide explanation" : "Reveal explanation"}</button>
    {revealed && <div className="explanation" aria-live="polite"><p>{explanations[scene.key][local]}</p></div>}
  </section>;
}
