export interface BoardPoint {
  id: string;
  x: number;
  y: number;
  radius: number;
  label: string;
}
export interface BoardStage {
  frame: number;
  points: BoardPoint[];
  pairs: string[][];
  required: number;
}
export interface OriginalBoard {
  source: string;
  mode: "connect" | "odd" | "couple" | "proper" | "same" | "place" | "sort";
  width: number;
  height: number;
  folder: string;
  stages: BoardStage[];
}
export type Connection = readonly [string, string];

/** A piece may be consumed only once; place slots also have capacity one. */
export function connectPictures(
  mode: OriginalBoard["mode"], stage: BoardStage, previous: readonly Connection[],
  start: string, end: string,
): { accepted: boolean; connections: readonly Connection[] } {
  if (previous.length >= stage.required) return { accepted: false, connections: previous };
  const pair = stage.pairs.find(([a, b]) => a === start && b === end
    || (mode === "couple" || mode === "same") && a === end && b === start);
  if (!pair) return { accepted: false, connections: previous };
  const [source, target] = pair;
  if (previous.some(([a, b]) => a === source
    || mode !== "sort" && b === target
    || (mode === "same" || mode === "couple") && (a === target || b === source))) {
    return { accepted: false, connections: previous };
  }
  return { accepted: true, connections: [...previous, [source, target]] };
}

export function insidePoint(point: BoardPoint, x: number, y: number): boolean {
  return Math.abs(x - point.x) <= point.radius && Math.abs(y - point.y) <= point.radius;
}
