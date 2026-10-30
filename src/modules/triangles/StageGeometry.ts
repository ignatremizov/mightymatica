import { cross, distance } from "./geometry.ts";
import type { Point, Triangle } from "./geometry";

export interface StageBounds { left: number; top: number; right: number; bottom: number }

/** Preserve the point grabbed on a handle, not just the handle's center. */
export function capturedVertexPosition(vertex: Point, grabbedAt: Point, pointer: Point): Point {
  return { x: vertex.x + pointer.x - grabbedAt.x, y: vertex.y + pointer.y - grabbedAt.y };
}

export function moveStageVertex(points: Triangle, index: number, proposed: Point, bounds: StageBounds): Triangle {
  const point = {
    x: Math.max(bounds.left, Math.min(bounds.right, proposed.x)),
    y: Math.max(bounds.top, Math.min(bounds.bottom, proposed.y)),
  };
  const next = points.map((old, i) => i === index ? point : old) as Triangle;
  // Near-collinear triangles have no useful finite intersection to inspect.
  // Reject the move rather than falsifying the altitude or its intersection.
  return Math.abs(cross(...next)) > 100 && next.every((p, i) => distance(p, next[(i + 1) % 3]!) > 16) ? next : points;
}

/** Clip an infinite construction line before handing coordinates to SVG. */
export function stageLine(a: Point, b: Point, bounds: StageBounds): [Point, Point] | null {
  const dx = b.x - a.x, dy = b.y - a.y;
  if (![a.x, a.y, dx, dy].every(Number.isFinite) || Math.hypot(dx, dy) < 1e-9) return null;
  let from = -Infinity, to = Infinity;
  for (const [origin, direction, low, high] of [
    [a.x, dx, bounds.left, bounds.right], [a.y, dy, bounds.top, bounds.bottom],
  ] as const) {
    if (Math.abs(direction) < 1e-12) {
      if (origin < low || origin > high) return null;
    } else {
      const first = (low - origin) / direction, last = (high - origin) / direction;
      from = Math.max(from, Math.min(first, last));
      to = Math.min(to, Math.max(first, last));
    }
  }
  return from <= to ? [{ x: a.x + from * dx, y: a.y + from * dy }, { x: a.x + to * dx, y: a.y + to * dy }] : null;
}
