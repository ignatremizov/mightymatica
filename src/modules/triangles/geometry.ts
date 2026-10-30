export interface Point { x: number; y: number }
export type Triangle = [Point, Point, Point];
export const distance = (a: Point, b: Point) => Math.hypot(a.x - b.x, a.y - b.y);
export const mix = (a: Point, b: Point, t: number): Point => ({ x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t });
export const cross = (a: Point, b: Point, c: Point) => (b.x - a.x) * (c.y - a.y) - (b.y - a.y) * (c.x - a.x);
/** Constrain a circular drag to an allowed arc without jumping across 0°. */
export function constrainedCircleAngle(point: Point, center: Point, min: number, max: number): number | null {
  if (distance(point, center) < 1) return null;
  const angle = Math.atan2(center.y - point.y, point.x - center.x) * 180 / Math.PI;
  const midpoint = (min + max) / 2;
  const nearest = angle + 360 * Math.round((midpoint - angle) / 360);
  return Math.round(Math.max(min, Math.min(max, nearest)));
}
export function projection(p: Point, a: Point, b: Point): Point {
  const d = (b.x - a.x) ** 2 + (b.y - a.y) ** 2;
  return d < 1e-12 ? a : mix(a, b, ((p.x - a.x) * (b.x - a.x) + (p.y - a.y) * (b.y - a.y)) / d);
}
export function intersection(a: Point, b: Point, c: Point, d: Point): Point | null {
  const denominator = (b.x - a.x) * (d.y - c.y) - (b.y - a.y) * (d.x - c.x);
  if (Math.abs(denominator) < 1e-10) return null;
  return mix(a, b, ((c.x - a.x) * (d.y - c.y) - (c.y - a.y) * (d.x - c.x)) / denominator);
}
export function triangleData(points: Triangle) {
  const sides = points.map((_, i) => distance(points[(i + 1) % 3]!, points[(i + 2) % 3]!));
  const angles = sides.map((a, i) => {
    const b = sides[(i + 1) % 3]!, c = sides[(i + 2) % 3]!;
    return Math.acos(Math.max(-1, Math.min(1, (b * b + c * c - a * a) / (2 * b * c))));
  });
  return { sides, angles, area: Math.abs(cross(...points)) / 2 };
}
export function construction(points: Triangle, kind: "medians" | "altitudes" | "bisectors") {
  const { sides, area } = triangleData(points);
  const feet = points.map((p, i) => {
    const b = points[(i + 1) % 3]!, c = points[(i + 2) % 3]!;
    return kind === "altitudes" ? projection(p, b, c) : mix(b, c, kind === "medians" ? .5 : distance(p, b) / (distance(p, b) + distance(p, c)));
  });
  const center = kind === "altitudes" ? intersection(points[0], feet[0]!, points[1], feet[1]!) :
    kind === "medians" ? { x: (points[0].x + points[1].x + points[2].x) / 3, y: (points[0].y + points[1].y + points[2].y) / 3 } :
      { x: points.reduce((s, p, i) => s + p.x * sides[i]!, 0) / sides.reduce((s, v) => s + v, 0),
        y: points.reduce((s, p, i) => s + p.y * sides[i]!, 0) / sides.reduce((s, v) => s + v, 0) };
  return { feet, center, radius: 2 * area / sides.reduce((s, v) => s + v, 0) };
}

/** The source's false proof intersects an internal angle bisector with the
 * perpendicular bisector of BC. One side foot is on an extension: unsigned
 * segment subtraction on both sides is the invalid step. */
export function falseProofConstruction(points: Triangle) {
  const [a, b, c] = points;
  const midpoint = mix(b, c, .5);
  const perpendicular = { x: midpoint.x - (c.y - b.y), y: midpoint.y + c.x - b.x };
  const bisectorFoot = mix(b, c, distance(a, b) / (distance(a, b) + distance(a, c)));
  const x = intersection(a, bisectorFoot, midpoint, perpendicular);
  if (!x) return null;
  const footB = projection(x, a, b), footC = projection(x, a, c);
  const parameter = (foot: Point, end: Point) =>
    ((foot.x - a.x) * (end.x - a.x) + (foot.y - a.y) * (end.y - a.y)) / distance(a, end) ** 2;
  return { x, midpoint, bisectorFoot, footB, footC, parameterB: parameter(footB, b), parameterC: parameter(footC, c) };
}
