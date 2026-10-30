import test from "node:test";
import assert from "node:assert/strict";
import { constrainedCircleAngle, construction, distance, falseProofConstruction, projection, triangleData } from "../src/modules/triangles/geometry.ts";

test("inscribed-angle dragging keeps A on the opposite arc and C on the minor arc", () => {
  const center = { x: 300, y: 225 };
  const point = angle => ({ x: center.x + 155 * Math.cos(angle * Math.PI / 180), y: center.y - 155 * Math.sin(angle * Math.PI / 180) });
  for (const angle of [190, 230, 270, 310, 350]) assert.equal(constrainedCircleAngle(point(angle), center, 190, 350), angle);
  assert.equal(constrainedCircleAngle(point(359), center, 190, 350), 350);
  assert.equal(constrainedCircleAngle(point(180), center, 190, 350), 190);
  assert.equal(constrainedCircleAngle(point(0), center, 20, 170), 20);
  assert.equal(constrainedCircleAngle(point(180), center, 20, 170), 170);
  assert.equal(constrainedCircleAngle(center, center, 20, 170), null);
});

const close = (a, b) => assert.ok(Math.abs(a - b) < 1e-8, `${a} != ${b}`);
test("dragged medians still meet at a point dividing each median two to one", () => {
  const points = [{ x: 2, y: 7 }, { x: -3, y: 0 }, { x: 8, y: 1 }];
  const { center, feet } = construction(points, "medians");
  points.forEach((p, i) => close(distance(p, center) / distance(center, feet[i]), 2));
});
test("incenter remains equidistant from all three side lines", () => {
  const points = [{ x: 2, y: 7 }, { x: -3, y: 0 }, { x: 8, y: 1 }];
  const { center, radius, feet } = construction(points, "bisectors");
  points.forEach((p, i) => {
    const b = points[(i + 1) % 3], c = points[(i + 2) % 3];
    close(distance(center, projection(center, b, c)), radius);
    close(distance(b, feet[i]) / distance(feet[i], c), distance(p, b) / distance(p, c));
  });
});
test("obtuse triangle altitudes intersect outside rather than being clamped to side segments", () => {
  const points = [{ x: 1, y: 1 }, { x: 0, y: 0 }, { x: 5, y: 0 }];
  const { center } = construction(points, "altitudes");
  close(center.x, 1); close(center.y, 4);
  const { angles, sides } = triangleData(points);
  close(angles.reduce((a, b) => a + b), Math.PI);
  sides.forEach((side, i) => close(side / Math.sin(angles[i]), sides[0] / Math.sin(angles[0])));
});
test("parallel construction lines have no finite intersection", async () => {
  const { intersection } = await import("../src/modules/triangles/geometry.ts");
  assert.equal(intersection({ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 0, y: 1 }, { x: 1, y: 1 }), null);
});
test("the false isosceles proof preserves its true equalities but exposes opposite foot order", () => {
  for (const apexX of [180, 235, 365, 420]) {
    const points = [{ x: apexX, y: 100 }, { x: 130, y: 330 }, { x: 470, y: 330 }];
    const result = falseProofConstruction(points);
    assert.ok(result);
    const [a, b, c] = points;
    close(distance(result.x, b), distance(result.x, c));
    close(distance(result.x, result.footB), distance(result.x, result.footC));
    close(distance(a, result.footB), distance(a, result.footC));
    close(distance(b, result.footB), distance(c, result.footC));
    assert.notEqual(result.parameterB > 1, result.parameterC > 1);
    assert.ok(Math.abs(distance(a, b) - distance(a, c)) > 1);
    const realAB = distance(a, result.footB) + (result.parameterB > 1 ? -1 : 1) * distance(b, result.footB);
    const realAC = distance(a, result.footC) + (result.parameterC > 1 ? -1 : 1) * distance(c, result.footC);
    close(realAB, distance(a, b));
    close(realAC, distance(a, c));
  }
});
test("the false proof handles the isosceles limit without inventing a unique intersection", () => {
  assert.equal(falseProofConstruction([{ x: 300, y: 100 }, { x: 130, y: 330 }, { x: 470, y: 330 }]), null);
});
test("moving B and C does not turn the false proof's perpendicular bisector into a vertical line", () => {
  const points = [{ x: 235, y: 100 }, { x: 130, y: 280 }, { x: 470, y: 350 }];
  const result = falseProofConstruction(points);
  assert.ok(result);
  const [a, b, c] = points;
  close(distance(result.x, b), distance(result.x, c));
  close((result.x.x - result.midpoint.x) * (c.x - b.x) + (result.x.y - result.midpoint.y) * (c.y - b.y), 0);
  close(distance(a, result.footB), distance(a, result.footC));
  assert.notEqual(result.parameterB > 1, result.parameterC > 1);
  const rotate = p => ({ x: -p.y + 500, y: p.x });
  const rotated = falseProofConstruction(points.map(rotate));
  assert.ok(rotated);
  const expected = rotate(result.x);
  close(rotated.x.x, expected.x);
  close(rotated.x.y, expected.y);
  close(rotated.parameterB, result.parameterB);
  close(rotated.parameterC, result.parameterC);
});
