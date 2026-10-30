export type Vec3 = readonly [number, number, number];
const dot = (a: Vec3, b: Vec3) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const cross = (a: Vec3, b: Vec3): Vec3 => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
export const cubeVertices: Vec3[] = [
  [-1, -1, -1], [1, -1, -1], [1, 1, -1], [-1, 1, -1],
  [-1, -1, 1], [1, -1, 1], [1, 1, 1], [-1, 1, 1],
];
export const cubeEdges = [[0, 1], [1, 2], [2, 3], [3, 0], [4, 5], [5, 6], [6, 7], [7, 4], [0, 4], [1, 5], [2, 6], [3, 7]] as const;

/** Convex ordered section of [-1,1]^3 with n·p=d. Includes touching points/edges. */
export function cubeSection(normal: Vec3, offset: number): Vec3[] {
  if (!normal.every(Number.isFinite) || !Number.isFinite(offset) || Math.hypot(...normal) < 1e-12) throw new RangeError("A nonzero finite normal is required.");
  const points: Vec3[] = [];
  const eps = 1e-8;
  const add = (p: Vec3) => {
    if (!points.some(q => Math.hypot(q[0] - p[0], q[1] - p[1], q[2] - p[2]) < eps)) points.push(p);
  };
  for (const [a, b] of cubeEdges) {
    const p = cubeVertices[a]!, q = cubeVertices[b]!;
    const dp = dot(normal, p) - offset, dq = dot(normal, q) - offset;
    if (Math.abs(dp) < eps) add(p);
    if (Math.abs(dq) < eps) add(q);
    if (dp * dq < 0 && Math.abs(dp) >= eps && Math.abs(dq) >= eps) {
      const ratio = dp / (dp - dq);
      add([p[0] + ratio * (q[0] - p[0]), p[1] + ratio * (q[1] - p[1]), p[2] + ratio * (q[2] - p[2])]);
    }
  }
  if (points.length < 3) return points;
  const centre: Vec3 = [0, 1, 2].map(axis => points.reduce((sum, p) => sum + p[axis]!, 0) / points.length) as unknown as Vec3;
  const u = cross(normal, Math.abs(normal[0]) < .8 * Math.hypot(...normal) ? [1, 0, 0] : [0, 1, 0]);
  const v = cross(normal, u);
  const ul = Math.hypot(...u), vl = Math.hypot(...v);
  const angle = (p: Vec3) => {
    const relative: Vec3 = [p[0] - centre[0], p[1] - centre[1], p[2] - centre[2]];
    return Math.atan2(dot(relative, v) / vl, dot(relative, u) / ul);
  };
  return points.sort((a, b) => angle(a) - angle(b));
}

export function sphereSlice(radius: number, height: number) {
  if (!Number.isFinite(radius) || radius <= 0 || !Number.isFinite(height) || height < 0 || height > radius) throw new RangeError("Height must lie in [0,r].");
  const coneRadius = radius - height;
  const discRadius = Math.sqrt(Math.max(0, radius * radius - coneRadius * coneRadius));
  return { coneRadius, discRadius, discArea: Math.PI * discRadius ** 2, ringArea: Math.PI * (radius ** 2 - coneRadius ** 2) };
}

export function sphereMeasures(radius: number) {
  return { volume: 4 / 3 * Math.PI * radius ** 3, surface: 4 * Math.PI * radius ** 2 };
}

export function displayPairs(first: readonly number[], second: readonly number[]): Set<string> {
  const pairs = new Set<string>();
  for (const a of first) for (const b of second) {
    pairs.add(`${a}${b}`);
    pairs.add(`${b}${a}`);
  }
  return pairs;
}
