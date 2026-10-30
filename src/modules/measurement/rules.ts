export type Point = { x: number; y: number };

/** A regular polygon inscribed in a circle: h is the apothem, not radius. */
export function polygonMeasures(sides: number, radius: number) {
  if (!Number.isInteger(sides) || sides < 3 || sides > 360 || !Number.isFinite(radius) || radius <= 0) {
    throw new RangeError("Use 3–360 sides and a positive finite radius.");
  }
  const side = 2 * radius * Math.sin(Math.PI / sides);
  const height = radius * Math.cos(Math.PI / sides);
  const perimeter = sides * side;
  return { side, height, perimeter, area: perimeter * height / 2 };
}

export function polygonVertices(sides: number, radius: number): Point[] {
  polygonMeasures(sides, radius);
  return Array.from({ length: sides }, (_, i) => ({
    x: radius * Math.cos(2 * Math.PI * i / sides - Math.PI / 2 - Math.PI / sides),
    y: radius * Math.sin(2 * Math.PI * i / sides - Math.PI / 2 - Math.PI / sides),
  }));
}

export function areaMeasures(base: number, height: number, upperBase: number) {
  return { rectangle: base * height, parallelogram: base * height, triangle: base * height / 2, trapezoid: (base + upperBase) * height / 2 };
}
