import test from "node:test";
import assert from "node:assert/strict";
import { equilateralPoints, monochromaticTriangles, monochromaticProgressions, boxRotationCount, distinctFaceColorings } from "../src/modules/coloring/rules.ts";

test("every choice of the three constructed vertices yields a monochromatic equilateral triangle", () => {
  for (let bits = 0; bits < 8; bits++) {
    const colors = [1, 1, 1, bits & 1, (bits >> 1) & 1, (bits >> 2) & 1];
    assert.ok(monochromaticTriangles(equilateralPoints, colors).length > 0, `choice ${bits}`);
  }
});
test("collinear same-colored points are not reported as equilateral", () => {
  assert.deepEqual(monochromaticTriangles([[0, 0], [1, 0], [2, 0]], [1, 1, 1]), []);
});
test("the common midpoint forces either AB or CD to be monochromatic", () => {
  // CA = AB = BD, with E the common midpoint of AB/CD.
  const coordinates = [0, 1, 1.5, 2, 3];
  assert.ok(monochromaticProgressions([1, 0, 0, 0, 1], coordinates).some(t => t.join() === "1,2,3"));
  assert.ok(monochromaticProgressions([1, 0, 1, 0, 1], coordinates).some(t => t.join() === "0,2,4"));
  assert.deepEqual(monochromaticProgressions([0, 0, 1, 1, 0], coordinates), []);
  assert.ok(!monochromaticProgressions([0, 0, 0, 1, 1], coordinates).some(t => t.join() === "0,1,2"), "A is not the midpoint of CE");
});
test("the archived square-based bricks have eight rotations, not the generic box's four", () => {
  assert.equal(boxRotationCount([150, 250, 150]), 8);
  assert.equal(boxRotationCount([100, 180, 100]), 8);
  assert.equal(boxRotationCount([150, 150, 150]), 24);
  assert.equal(boxRotationCount([100, 150, 180]), 4);
  assert.equal(distinctFaceColorings(6, boxRotationCount([150, 250, 150])), 90);
});
test("distinct-color orbit counts retain mirrors as separate colorings", () => {
  assert.equal(distinctFaceColorings(4, 12), 2);
  assert.equal(distinctFaceColorings(8, 12), 3360);
  assert.equal(distinctFaceColorings(6, 24), 30);
  assert.throws(() => distinctFaceColorings(4, 7), RangeError);
  assert.throws(() => boxRotationCount([0, 1, 1]), RangeError);
});
