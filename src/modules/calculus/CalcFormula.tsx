import { createElement } from "react";
import type { ReactNode } from "react";

// Keep MathML local: React's HTML JSX vocabulary need not be extended globally.
type MathTag = "mrow" | "mi" | "mn" | "mo" | "mfrac" | "msup" | "msubsup";
const m = (tag: MathTag, ...children: ReactNode[]) => createElement(tag, null, ...children);
const variable = (name: string) => m("mi", name);
const operator = (name: string) => m("mo", name);
const at = (name: string, argument: ReactNode) => m("mrow", variable(name), operator("("), argument, operator(")"));

export default function CalcFormula({ kind, value, label }: {
  kind: "secant" | "velocity" | "integral";
  value: number;
  label: string;
}) {
  const time = variable("t");
  const delta = m("mrow", variable("Δ"), time);
  let expression: ReactNode;
  if (kind === "secant") {
    expression = m("mfrac",
      m("mrow", at("S", m("mrow", time, operator("+"), delta)), operator("−"), at("S", time)),
      delta);
  } else if (kind === "velocity") {
    expression = m("mrow", m("msup", variable("S"), operator("′")), operator("("), time, operator(")"),
      operator("="), at("V", time));
  } else {
    expression = m("mrow",
      m("msubsup", operator("∫"), m("mn", "0"), time),
      at("V", variable("u")), variable("d"), variable("u"),
      operator("="), at("S", time), operator("−"), at("S", m("mn", "0")));
  }
  return createElement("math", { className: "calculus-formula", displaystyle: "true", "aria-label": label },
    m("mrow", expression, operator("="), m("mn", value.toFixed(3))));
}
