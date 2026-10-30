import { useState } from "react";
import type { Locale } from "../../shared/contracts";

/** Insangle's three proof cases, resources/texts/102–208. */
export default function InscribedProof({ locale }: { locale: Locale }) {
  const ru = locale === "ru";
  const tr = (en: string, russian: string) => ru ? russian : en;
  const [step, setStep] = useState<number | null>(null);
  const position = step === 0 ? 280 : step === 1 ? 250 : 340;
  const point = (degrees: number) => ({
    x: 280 + 150 * Math.cos(degrees * Math.PI / 180),
    y: 200 - 150 * Math.sin(degrees * Math.PI / 180),
  });
  const a = point(position), b = point(0), c = point(100), d = point(position - 180);
  const title = step === 0 ? tr("Part 1: AC is a diameter", "Часть 1: AC — диаметр") :
    step === 1 ? tr("Part 2: O is inside ∠BAC", "Часть 2: O внутри угла BAC") :
      tr("Part 3: O is outside ∠BAC", "Часть 3: O вне угла BAC");
  return <section className="explanation">
    <h3>{tr("Proof", "Доказательство")}</h3>
    {step === null ? <button className="button" onClick={() => setStep(0)}>{tr("Show proof", "Показать доказательство")}</button> : <>
      <h4>{title}</h4>
      <svg className="tri-proof-diagram" viewBox="0 0 560 410" role="img" aria-label={title}>
        <circle cx="280" cy="200" r="150" className="tri-side" />
        <polygon points={[a, b, c].map(p => `${p.x},${p.y}`).join(" ")} className="tri-side" />
        <path d={`M${b.x} ${b.y}L280 200L${c.x} ${c.y}`} className="tri-construction" />
        <line x1={a.x} y1={a.y} x2={d.x} y2={d.y} className="tri-construction" />
        {[a, b, c, { x: 280, y: 200 }, ...(step === 0 ? [] : [d])].map((p, i) =>
          <text key={i} x={p.x + 10} y={p.y + (i === 0 ? 22 : -10)}>{["A", "B", "C", "O", "D"][i]}</text>)}
      </svg>
      <p>{step === 0 ?
        tr("OA = OB, so ∠BAO = ∠OBA. The exterior angle BOC is their sum: ∠BOC = 2∠BAC.", "OA = OB, поэтому ∠BAO = ∠OBA. Внешний угол BOC равен их сумме: ∠BOC = 2∠BAC.") :
        step === 1 ?
          tr("Draw diameter AD. Apply Part 1 to BAD and DAC, then add the two equalities.", "Проведём диаметр AD. Применим часть 1 к углам BAD и DAC и сложим равенства.") :
          tr("Draw diameter AD. Apply Part 1 to BAD and CAD, then subtract the second equality from the first.", "Проведём диаметр AD. Применим часть 1 к углам BAD и CAD и вычтем второе равенство из первого.")}</p>
      <p className="tri-formula">{step === 0 ? "∠BAC = ½∠BOC" :
        step === 1 ? "∠BAC = ∠BAD + ∠DAC = ½(∠BOD + ∠DOC) = ½∠BOC" :
          "∠BAC = ∠BAD − ∠CAD = ½(∠BOD − ∠COD) = ½∠BOC"}</p>
      <div className="controls">
        <button className="button-secondary" disabled={step === 0} onClick={() => setStep(step - 1)}>{tr("Previous", "Назад")}</button>
        <button className="button" disabled={step === 2} onClick={() => setStep(step + 1)}>{tr("Next", "Дальше")}</button>
        <button className="button-secondary" onClick={() => setStep(null)}>{tr("Close proof", "Закрыть доказательство")}</button>
      </div>
    </>}
  </section>;
}
