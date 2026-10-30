import { useState } from "react";
import { mediaUrl } from "../../shared/contracts";
import type { Locale } from "../../shared/contracts";

export default function OriginalDrawings({ family, frames, locale, warning }: { family: string; frames: readonly number[]; locale: Locale; warning?: string }) {
  const [index, setIndex] = useState(0);
  const ru = locale === "ru";
  return <details className="explanation">
    <summary>{ru ? "Оригинальные рисунки урока" : "Original lesson drawings"}</summary>
    {warning && <p>{warning}</p>}
    <div className="controls">{frames.map((frame, i) => <button key={frame} className="button-secondary" aria-pressed={index === i} onClick={() => setIndex(i)}>{ru ? "Рисунок" : "Drawing"} {i + 1}</button>)}</div>
    <img className="tri-original-frame" src={mediaUrl(`triangles/${family}-reference/${frames[index]}.png`)}
      alt={ru ? "Сохранённый оригинальный рисунок урока" : "Preserved original lesson drawing"} loading="lazy" />
  </details>;
}
