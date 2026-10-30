import { useMemo, useState } from "react";
import type { ActivityProps } from "../../shared/contracts";
import { t } from "../../shared/contracts";
import OriginalLessonPlayer from "../../shared/OriginalLessonPlayer";
import type { OriginalLessonDefinition } from "../../shared/OriginalLesson";
import audio from "./lesson-audio.json";

export default function Dissections(props: ActivityProps) {
  return <Bills key={props.locale} {...props} />;
}

function Bills({ locale, reducedMotion }: ActivityProps) {
  const [explain, setExplain] = useState(false);
  const [complete, setComplete] = useState(false);
  const lesson = useMemo<OriginalLessonDefinition>(() => {
    const source = audio.bills[locale];
    return {
      width: source.width, height: source.height, fps: source.fps,
      initialFrame: 1, endFrame: 988,
      chapters: [{ id: "bills", startFrame: 1, endFrame: 988, module: `dissections/bills-${locale}.mjs` }],
      stops: [{ frame: 988, kind: "complete" }],
      audioAssets: source.audioAssets, audioCues: source.audioCues,
    };
  }, [locale]);
  return <section className="activity-layout">
    <p>{t(locale,
      "Watch nine £20 notes being cut and rearranged into ten apparent notes. Pause to follow each original piece. Compare the row of nine at the top with the rearranged row of ten below.",
      "Наблюдайте, как девять банкнот по 20 фунтов разрезают и переставляют, получая десять кажущихся банкнот. Останавливайте просмотр, чтобы проследить каждую часть. Сравните девять банкнот в верхнем ряду с десятью в нижнем.")}</p>
    <OriginalLessonPlayer
      lesson={lesson}
      locale={locale}
      reducedMotion={reducedMotion}
      label={t(locale, "Original nine-to-ten banknote dissection", "Исходная перестановка девяти банкнот в десять")}
      onComplete={() => setComplete(true)}
      onRestart={() => { setComplete(false); setExplain(false); }}
    />
    <div className="explanation">
      <h3>{t(locale, "Can rearranging paper create money?", "Можно ли получить деньги перестановкой бумаги?")}</h3>
      <p>{t(locale,
        "Before revealing the explanation, compare the outlines and portrait positions. Are all ten results truly identical to the nine originals?",
        "Прежде чем открыть объяснение, сравните контуры и положение портретов. Действительно ли все десять результатов совпадают с девятью исходными банкнотами?")}</p>
      <button type="button" className="button button-secondary" disabled={!complete} aria-expanded={explain} onClick={() => setExplain(!explain)}>
        {explain ? t(locale, "Hide explanation", "Скрыть объяснение") : t(locale, "Show explanation", "Показать объяснение")}
      </button>
      {explain && <p className="activity-status">{t(locale,
        "Counting note-shaped arrangements is not the same as counting complete notes. The cuts are at different heights, and the pieces are matched with different partners. Inspect the joins: the reconstructed notes do not all reproduce the complete original image. Rearranging pieces cannot increase their total paper area or create an additional complete banknote.",
        "Считать фигуры, похожие на банкноты, — не то же самое, что считать целые банкноты. Разрезы проходят на разной высоте, а части соединяются с другими частями. Рассмотрите стыки: восстановленные фигуры не все воспроизводят полное исходное изображение. Перестановка частей не увеличивает площадь бумаги и не создаёт дополнительную целую банкноту.")}</p>}
    </div>
  </section>;
}
