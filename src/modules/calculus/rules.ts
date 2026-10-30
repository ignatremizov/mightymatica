export type GraphKind = "linear" | "square" | "cubic" | "power" | "sine" | "cosine" | "tan" | "gaussian" | "sinecosine";
export type Parameters = { a: number; b: number; c: number; d: number; e: number; f: number };
export const defaults: Parameters = { a: 1, b: 1, c: 0, d: 1, e: 1, f: 0 };

/** Recovered slider positions; singular zero sigma remains excluded. */
export function initialParameters(kind: GraphKind): Parameters {
  switch (kind) {
    case "linear": return { ...defaults, a: 2, b: 2 };
    case "square": return { ...defaults, a: 0.2, b: 2, c: 2 };
    case "cubic": return { ...defaults, a: 0.2, b: 2, c: 2, d: 2 };
    case "power": return { ...defaults, a: 2, b: 0 };
    case "tan": return { ...defaults, a: 0.3 };
    case "gaussian": return { ...defaults, a: 2 };
    default: return { ...defaults };
  }
}

export function parameterRange(kind: GraphKind, key: keyof Parameters): [number, number] {
  if (kind === "gaussian" && key === "a") return [0.1, 5];
  if (kind === "power") return key === "a" ? [0.2, 5] : [-10, 10];
  if (kind === "linear" && key === "b") return [-200, 200];
  if (kind === "square") {
    if (key === "a") return [-1, 1];
    if (key === "c") return [-100, 100];
  }
  if (kind === "cubic") {
    if (key === "a") return [-0.5, 0.5];
    if (key === "d") return [-200, 200];
  }
  if (kind === "tan") {
    if (key === "a") return [0.2, 1];
    if (key === "b") return [-1.5, 1.5];
  }
  if (["sine", "cosine", "tan", "sinecosine"].includes(kind) && (key === "c" || key === "f")) return [-3, 3];
  return [-5, 5];
}

export function evaluate(kind: GraphKind, x: number, p: Parameters): number {
  switch (kind) {
    case "linear": return p.a * x + p.b;
    case "square": return p.a * x * x + p.b * x + p.c;
    case "cubic": return p.a * x ** 3 + p.b * x * x + p.c * x + p.d;
    case "power": return p.a > 0 ? p.a ** x + p.b : NaN;
    case "sine": return p.a * Math.sin(p.b * x + p.c);
    case "cosine": return p.a * Math.cos(p.b * x + p.c);
    case "tan": return Math.abs(Math.cos(p.b * x + p.c)) < 1e-10 ? NaN : p.a * Math.tan(p.b * x + p.c);
    case "gaussian": return p.a > 0 ? Math.exp(-x * x / (2 * p.a * p.a)) / (Math.sqrt(2 * Math.PI) * p.a) : NaN;
    case "sinecosine": return p.a * Math.sin(p.b * x + p.c) + p.d * Math.cos(p.e * x + p.f);
  }
}

/** Never connect samples across a tangent pole, including when amplitude is zero. */
export function crossesPole(x1: number, x2: number, p: Parameters): boolean {
  const u = (p.b * x1 + p.c - Math.PI / 2) / Math.PI;
  const v = (p.b * x2 + p.c - Math.PI / 2) / Math.PI;
  return Math.ceil(Math.min(u, v)) <= Math.floor(Math.max(u, v));
}

export function graphSegments(kind: GraphKind, p: Parameters, extent = 5, yExtent = 5): number[][][] {
  const segments: number[][][] = [];
  let segment: number[][] = [];
  const count = 800;
  for (let i = 0; i <= count; i++) {
    const x = -extent + 2 * extent * i / count;
    const y = evaluate(kind, x, p);
    const pole = kind === "tan" && i > 0 && crossesPole(x - 2 * extent / count, x, p);
    if (pole || !Number.isFinite(y) || Math.abs(y) > yExtent * 2) {
      if (segment.length > 1) segments.push(segment);
      segment = [];
    }
    if (Number.isFinite(y) && Math.abs(y) <= yExtent * 2) segment.push([x, y]);
  }
  if (segment.length > 1) segments.push(segment);
  return segments;
}

export type MotionKind = "constant" | "accelerating" | "sine";
export function motion(kind: MotionKind, t: number) {
  if (kind === "constant") return { position: 20 * t, velocity: 20 };
  if (kind === "accelerating") return { position: 5 * t * t, velocity: 10 * t };
  return { position: 60 * Math.sin(t), velocity: 60 * Math.cos(t) };
}
export function secant(kind: MotionKind, t: number, dt: number): number {
  return dt > 0 ? (motion(kind, t + dt).position - motion(kind, t).position) / dt : NaN;
}
