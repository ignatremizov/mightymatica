import test from "node:test";
import assert from "node:assert/strict";
import { differencePieces, integerSum, oddLayers, quadratic, resistance } from "../src/modules/algebra/rules.ts";

test("two equal staircases fill n by n+1 and odd borders fill n squared", () => {
  for (let n = 1; n <= 100; n++) {
    assert.equal(integerSum(n), Array.from({ length: n }, (_, i) => i + 1).reduce((a, b) => a + b, 0));
    assert.equal(oddLayers(n).reduce((a, b) => a + b, 0), n * n);
  }
  assert.throws(() => integerSum(1.5), RangeError);
  assert.throws(() => oddLayers(0), RangeError);
});

test("difference-of-squares dissection conserves the area of both pieces", () => {
  for (let a = 2; a <= 10; a++) for (let b = 1; b < a; b++) {
    const p = differencePieces(a, b);
    assert.equal(p.first + p.second, p.area);
    assert.equal(p.width * p.height, a * a - b * b);
  }
  assert.throws(() => differencePieces(3, 3), RangeError);
});

test("solved R satisfies the original rational equation without a zero denominator", () => {
  for (let v = 1; v < 12; v++) for (let r = 1; r <= 10; r++) {
    const R = resistance(v, r);
    assert.ok(Math.abs(12 * R / (r + R) - v) < 1e-12);
    assert.ok(r + R > 0);
  }
  assert.throws(() => resistance(12, 1), RangeError);
  assert.throws(() => resistance(1, 0), RangeError);
});

test("quadratics distinguish two, repeated, and absent real roots", () => {
  assert.deepEqual(quadratic(1, -4, 3), { discriminant: 4, roots: [1, 3] });
  assert.deepEqual(quadratic(1, -4, 4), { discriminant: 0, roots: [2] });
  assert.deepEqual(quadratic(1, 0, 1), { discriminant: -4, roots: [] });
  assert.deepEqual(quadratic(1, 0, -4).roots, [-2, 2]);
  assert.deepEqual(quadratic(1, 2, 0).roots, [-2, 0]);
  assert.throws(() => quadratic(0, 1, 2), RangeError);
  assert.throws(() => quadratic(1, NaN, 2), RangeError);
  for (let a = 1; a <= 3; a++) for (let b = -6; b <= 6; b++) for (let c = -6; c <= 6; c++) {
    for (const x of quadratic(a, b, c).roots) assert.ok(Math.abs(a * x * x + b * x + c) < 1e-10);
  }
});
