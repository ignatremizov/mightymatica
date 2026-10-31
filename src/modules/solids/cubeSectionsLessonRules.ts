/** Timer-driven source scenes; frame numbers are global, not gotoAndPlay's scene-local argument. */
export type CubeDemonstration = 1 | 2 | 3 | 4;
export type Point3 = readonly [number, number, number];
const periods = [304, 304, 180, 154] as const;

// Record the source's order of operations: the direction flips BEFORE child
// translation, so the visible offset is not quite the timer's control variable.
const cycles = periods.map((period, index) => {
  let control = 0, direction = 1, offset = 0;
  const values = [{ control, offset }];
  for (let tick = 1; tick < period; tick++) {
    control += index === 3 ? direction : -direction;
    if (index === 2 ? control === -45 || control === 45
      : index === 3 ? control > 75 || control < 0 : control < -75 || control > 75) direction = -direction;
    offset += index === 3 ? direction : -direction;
    values.push({ control, offset });
  }
  return values;
});

export function cubeDemonstrationState(scene: CubeDemonstration, ticks: number) {
  const tick = Math.max(0, Math.floor(Number.isFinite(ticks) ? ticks : 0));
  const { control, offset } = cycles[scene - 1]![tick % periods[scene - 1]!]!;
  return {
    tick, control, offset,
    rotation: -(tick % 1800) * .2,
    sectionRotationX: scene === 3 ? -(tick % 360) : scene === 2 ? 45 : scene === 4 ? 35 : 0,
    sectionRotationY: scene === 1 ? 90 : scene === 4 ? -45 : 0,
    sectionScaleY: scene === 2 || scene === 4 ? 1 - Math.abs(control) / 75
      : scene === 3 ? 1 / Math.cos(control * Math.PI / 180) : 1,
    coverAlpha: Math.max(0, 1 - tick * .008),
  };
}

/** Flash's display-object Euler rotation, applied before parent projection. */
export function rotateCubePoint(point: Point3, x: number, y: number, z: number): Point3 {
  const rad = Math.PI / 180;
  const cx = Math.cos(x * rad), sx = Math.sin(x * rad);
  const cy = Math.cos(y * rad), sy = Math.sin(y * rad);
  const cz = Math.cos(z * rad), sz = Math.sin(z * rad);
  const a = point[1] * cx - point[2] * sx, b = point[1] * sx + point[2] * cx;
  const c = point[0] * cy + b * sy, d = -point[0] * sy + b * cy;
  return [c * cz - a * sz, c * sz + a * cz, d];
}

export function projectCubePoint(point: Point3): readonly [number, number] {
  const focal = 275 / Math.tan(55 * Math.PI / 360);
  const scale = focal / (focal + point[2]);
  return [275 + (260.95 + point[0] - 275) * scale, 200 + (194 + point[1] - 200) * scale];
}
