export type Point = readonly [number, number];
/** Orientation-preserving signed-axis permutations of a rectangular box. */
export function boxRotationCount(dimensions: readonly [number, number, number]): number {
  if (dimensions.some(n => !Number.isFinite(n) || n <= 0)) throw new RangeError("Positive finite dimensions required");
  const permutations = [[0, 1, 2], [0, 2, 1], [1, 0, 2], [1, 2, 0], [2, 0, 1], [2, 1, 0]];
  // For each admissible axis permutation, four of eight sign choices have determinant +1.
  return 4 * permutations.filter(p => p.every((axis, i) => dimensions[axis] === dimensions[i])).length;
}

export function distinctFaceColorings(faceCount: number, rotations: number): number {
  if (!Number.isInteger(faceCount) || faceCount < 1 || faceCount > 10 ||
    !Number.isInteger(rotations) || rotations < 1) throw new RangeError("Invalid coloring parameters");
  let assignments = 1;
  for (let i = 2; i <= faceCount; i++) assignments *= i;
  if (assignments % rotations !== 0) throw new RangeError("Rotation group must divide the distinct-color assignments");
  return assignments / rotations;
}
export const equilateralPoints: readonly Point[] = [[0, 0], [1, 0], [2, 0], [.5, Math.sqrt(3) / 2], [1.5, Math.sqrt(3) / 2], [1, Math.sqrt(3)]];

/** Returns every monochromatic equilateral triple, never a merely collinear triple. */
export function monochromaticTriangles(points: readonly Point[], colors: readonly number[]): number[][] {
  const found: number[][] = [];
  const distance = (a: Point, b: Point) => (a[0] - b[0]) ** 2 + (a[1] - b[1]) ** 2;
  for (let a = 0; a < points.length; a++) for (let b = a + 1; b < points.length; b++) for (let c = b + 1; c < points.length; c++) {
    const d = distance(points[a]!, points[b]!);
    if (d > 1e-8 && colors[a] === colors[b] && colors[b] === colors[c] &&
      Math.abs(d - distance(points[a]!, points[c]!)) < 1e-8 &&
      Math.abs(d - distance(points[b]!, points[c]!)) < 1e-8) found.push([a, b, c]);
  }
  return found;
}

export function monochromaticProgressions(colors: readonly number[], coordinates: readonly number[] = colors.map((_, i) => i)): number[][] {
  const found: number[][] = [];
  for (let a = 0; a < colors.length; a++) for (let b = a + 1; b < colors.length; b++) for (let c = b + 1; c < colors.length; c++)
    if (Math.abs(coordinates[a]! + coordinates[c]! - 2 * coordinates[b]!) < 1e-8 &&
      colors[a] === colors[b] && colors[b] === colors[c]) found.push([a, b, c]);
  return found;
}
