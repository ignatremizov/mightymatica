export type SortRule = "color" | "shape" | "size";
export type Shape = "circle" | "square" | "triangle";
export interface Figure {
  id: string;
  color: "pink" | "blue";
  shape: Shape;
  size: "small" | "large";
}

// The original instances and their group membership at frames 409, 842, 1308.
const figures: readonly Figure[] = [
  { id: "ballsml", color: "pink", shape: "circle", size: "small" },
  { id: "balls2", color: "blue", shape: "circle", size: "small" },
  { id: "ballb", color: "blue", shape: "circle", size: "large" },
  { id: "squaresm", color: "blue", shape: "square", size: "small" },
  { id: "squarbl", color: "pink", shape: "square", size: "large" },
  { id: "sqsmred", color: "pink", shape: "square", size: "small" },
  { id: "trian1", color: "pink", shape: "triangle", size: "large" },
  { id: "trian2", color: "blue", shape: "triangle", size: "small" },
];

export function roundFigures(round: number): readonly Figure[] {
  return figures.slice(0, round <= 0 ? 5 : round === 1 ? 6 : 8);
}

export function groupsFor(rule: SortRule, round: number): readonly string[] {
  if (rule === "color") return ["pink", "blue"];
  if (rule === "size") return ["large", "small"];
  return round < 2 ? ["square", "circle"] : ["square", "triangle", "circle"];
}

/** Wrong destinations and repeated drops must not advance completion. */
export function placeFigure(
  rule: SortRule,
  round: number,
  placed: readonly string[],
  figureId: string,
  group: string,
): { accepted: boolean; placed: readonly string[] } {
  const figure = roundFigures(round).find((item) => item.id === figureId);
  if (!figure || placed.includes(figureId) || figure[rule] !== group) {
    return { accepted: false, placed };
  }
  return { accepted: true, placed: [...placed, figureId] };
}
