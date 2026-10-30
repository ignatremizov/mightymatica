import test from "node:test";
import assert from "node:assert/strict";
import { polygonMeasures, areaMeasures } from "../src/modules/measurement/rules.ts";

test("equal central triangles recover the regular hexagon's area", () => {
  const m = polygonMeasures(6, 4);
  assert.ok(Math.abs(m.side - 4) < 1e-12);
  assert.ok(Math.abs(m.area - 12 * Math.sqrt(12)) < 1e-10);
  assert.equal(m.area, m.perimeter * m.height / 2);
});

test("inscribed polygons approach circle area from below as sides increase", () => {
  let previous = 0;
  for (const sides of [3, 5, 6, 12, 30, 60, 120, 360]) {
    const m = polygonMeasures(sides, 5);
    assert.ok(m.area > previous && m.area < Math.PI * 25);
    assert.ok(m.height < 5);
    previous = m.area;
  }
  assert.ok(Math.PI * 25 - previous < .005);
});

test("quadrupling radius multiplies polygon area by sixteen", () => {
  assert.equal(polygonMeasures(6, 8).area / polygonMeasures(6, 2).area, 16);
});

test("equal parallel bases recover rectangle area and unequal bases average", () => {
  assert.deepEqual(areaMeasures(8, 4, 8), { rectangle: 32, parallelogram: 32, triangle: 16, trapezoid: 32 });
  assert.equal(areaMeasures(8, 4, 4).trapezoid, 24);
});

test("a triangle is half its matching parallelogram", () => {
  for (const [base, height] of [[8, 4], [3, 7], [1, 1]]) {
    const areas = areaMeasures(base, height, base);
    assert.equal(areas.triangle * 2, areas.parallelogram);
  }
});
