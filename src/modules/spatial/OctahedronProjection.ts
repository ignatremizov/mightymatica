type Point3 = readonly [number, number, number];
type Point2 = readonly [number, number];

// Every face refers to the same six vertices: adjacent faces cannot drift apart.
const vertices: readonly Point3[] = [
  [0, 1, 0], [0, -1, 0],
  [1, 0, 0], [0, 0, 1], [-1, 0, 0], [0, 0, -1],
];
const faces = Array.from({ length: 8 }, (_, index) => {
  // Octa-8 places each hemisphere's faces front, back, left, right.
  // In particular consecutive source faces 0/1 and 2/3 are not edge-neighbors.
  const side = [0,2,1,3][index % 4], a = 2 + side, b = 2 + (side + 1) % 4;
  return index < 4 ? [0, b, a] : [1, a, b];
});

export interface ProjectedOctahedronFace {
  id: number;
  depth: number;
  points: readonly Point2[];
  /** Maps the artwork's (0.5,0), (0,1), (1,1) to the face vertices. */
  matrix: readonly number[];
}

/** Orthographic projection preserves affine face artwork and convex depth order. */
export function projectOctahedron(turn: number, tilt: number): ProjectedOctahedronFace[] {
  const xAngle = tilt * Math.PI / 180, yAngle = turn * Math.PI / 180;
  const cx = Math.cos(xAngle), sx = Math.sin(xAngle);
  const cy = Math.cos(yAngle), sy = Math.sin(yAngle);
  const rotated = vertices.map(([x, y, z]): Point3 => {
    const yy = y * cx - z * sx, zz = y * sx + z * cx;
    return [x * cy + zz * sy, yy, -x * sy + zz * cy];
  });
  const projected = rotated.map(([x, y]): Point2 => [200 + x * 155, 180 - y * 155]);
  return faces.map((indices, id) => {
    const [top, left, right] = indices.map(index => projected[index]);
    const a = right[0] - left[0], b = right[1] - left[1];
    const e = top[0] - a / 2, f = top[1] - b / 2;
    return {
      id,
      depth: indices.reduce((sum, index) => sum + rotated[index][2], 0) / 3,
      points: [top, left, right],
      matrix: [a, b, left[0] - e, left[1] - f, e, f],
    };
  }).sort((a, b) => a.depth - b.depth);
}
