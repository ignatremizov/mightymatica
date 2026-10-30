export type Mode = "color" | "size" | "shape" | "all";
export type Shape = "circle" | "triangle" | "square";
export type Color = "pink" | "green" | "blue";
export interface Figure {
  id: number; shape: Shape; color: Color; width: number;
  x: number; y: number; speed: number; initialSpeed: number;
}
export interface Bucket { color: Color; shape: Shape }
export const shapes: Shape[] = ["circle", "triangle", "square"];
export const colors: Color[] = ["pink", "green", "blue"];
const colorRegions = [
    { x: 112, y: 330, halfWidth: 63, halfHeight: 63 },
    { x: 444, y: 330, halfWidth: 63, halfHeight: 63 },
];
const sizeRegions = [
    { x: 113, y: 292, halfWidth: 30, halfHeight: 30 },
    { x: 433, y: 201, halfWidth: 30, halfHeight: 30 },
];
// Each front is 90 stage units wide plus its 3-unit stroke.
const shapeRegions = [105.35, 246.55, 389.05].map((x, index) => ({
    x, y: index === 2 ? 284.65 : 284.75, halfWidth: 46.5, halfHeight: 20,
}));
/** Published old timeline's registration-point acceptance regions. */
export function targetRegions(mode: Mode) {
  return mode === "color" ? colorRegions : mode === "size" ? sizeRegions : shapeRegions;
}
export function targetAt(mode: Mode, x: number, y: number): number {
  return targetRegions(mode).findIndex(region =>
    Math.abs(x - region.x) < region.halfWidth && Math.abs(y - region.y) < region.halfHeight);
}
export function goal(mode: Mode): number { return mode === "all" ? 10 : 9; }
export function buckets(random = Math.random): Bucket[] {
  return colors.map(color => ({ color, shape: shapes[Math.floor(random() * 3)]! }));
}
export function accepts(mode: Mode, figure: Figure, index: number, targets: Bucket[]): boolean {
  if (index < 0 || index >= (mode === "color" || mode === "size" ? 2 : 3)) return false;
  if (mode === "color") return index === (figure.color === "pink" ? 0 : 1);
  if (mode === "size") return index === (figure.width <= 85 ? 0 : 1);
  if (mode === "shape") return figure.shape === shapes[index];
  return figure.shape === targets[index]?.shape && figure.color === targets[index]?.color;
}
export function generate(mode: Mode, id: number, random = Math.random): Figure {
  const shape = shapes[Math.floor(random() * 3)]!;
  const color = mode === "color" ? (random() < .5 ? "pink" : "blue") : colors[Math.floor(random() * 3)]!;
  const speed = (random() + .2) * 4 * 24;
  return { id, shape, color, width: (Math.floor(random() * 5) + 2) * 20,
    x: random() * 450 + 50, y: -20, speed, initialSpeed: speed };
}
