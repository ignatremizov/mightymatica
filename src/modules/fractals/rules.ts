export interface Hole { x: number; y: number; size: number }

/** Each retained square loses its central ninth, never its corners. */
export function carpetHoles(depth: number): Hole[] {
  if (!Number.isInteger(depth) || depth < 0 || depth > 5) throw new RangeError("Depth must be 0–5");
  const holes: Hole[] = [];
  const visit = (x: number, y: number, size: number, level: number) => {
    if (!level) return;
    const third = size / 3;
    holes.push({ x: x + third, y: y + third, size: third });
    for (let row = 0; row < 3; row++) for (let col = 0; col < 3; col++) {
      if (row !== 1 || col !== 1) visit(x + col * third, y + row * third, third, level - 1);
    }
  };
  visit(0, 0, 1, depth);
  return holes;
}

/** Needle anchored at one end; angle to the parallel lines is uniform in [0, π). */
export function needleCrosses(distance: number, angle: number, length = 1, spacing = 1): boolean {
  return distance <= length * Math.sin(angle) && distance >= 0 && distance <= spacing;
}

export function estimatePi(throws: number, hits: number): number | null {
  return throws > 0 && hits > 0 && hits <= throws ? 2 * throws / hits : null;
}

/** True half-twist surface. u=2π,v equals u=0,-v, rather than u=0,v. */
export function mobiusPoint(u: number, v: number): [number, number, number] {
  return [(2 + v * Math.cos(u / 2)) * Math.cos(u), (2 + v * Math.cos(u / 2)) * Math.sin(u), v * Math.sin(u / 2)];
}
