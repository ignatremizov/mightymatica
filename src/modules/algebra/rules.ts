function positiveInteger(value: number): void {
  if (!Number.isSafeInteger(value) || value < 1 || value > 1000) throw new RangeError("Expected an integer from 1 to 1000");
}

export function integerSum(n: number): number {
  positiveInteger(n);
  return n * (n + 1) / 2;
}

export function oddLayers(n: number): number[] {
  positiveInteger(n);
  return Array.from({ length: n }, (_, index) => 2 * index + 1);
}

/** Two disjoint rectangles tile a² minus the top-right b² square. */
export function differencePieces(a: number, b: number) {
  if (!Number.isFinite(a) || !Number.isFinite(b) || b < 0 || a <= b) throw new RangeError("Require a > b ≥ 0");
  return { first: a * (a - b), second: b * (a - b), width: a + b, height: a - b, area: a * a - b * b };
}

/** The positive-domain experiment used by the lesson, not all singular cases. */
export function resistance(v: number, r: number): number {
  if (!Number.isFinite(v) || !Number.isFinite(r) || v <= 0 || v >= 12 || r <= 0) throw new RangeError("Require 0 < V < 12 and r > 0");
  return v * r / (12 - v);
}

export function quadratic(a: number, b: number, c: number) {
  if (![a, b, c].every(Number.isFinite) || a === 0) throw new RangeError("Require finite coefficients and a ≠ 0");
  const discriminant = b * b - 4 * a * c;
  if (!Number.isFinite(discriminant)) throw new RangeError("Coefficients exceed supported range");
  if (discriminant < 0) return { discriminant, roots: [] as number[] };
  if (discriminant === 0) return { discriminant, roots: [b === 0 ? 0 : -b / (2 * a)] };
  // Avoid cancellation when one root is much smaller than the other.
  const q = -0.5 * (b + (b >= 0 ? 1 : -1) * Math.sqrt(discriminant));
  return { discriminant, roots: [q / a, c === 0 ? 0 : c / q].sort((x, y) => x - y) };
}
