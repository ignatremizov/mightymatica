import test from "node:test";
import assert from "node:assert/strict";
import { defaults, initialParameters, parameterRange, evaluate, graphSegments, crossesPole, motion, secant } from "../src/modules/calculus/rules.ts";

test("Each graph opens and resets with its own source controls in range", () => {
  for (const kind of ["linear", "square", "cubic", "power", "sine", "cosine", "tan", "gaussian", "sinecosine"]) {
    const p = initialParameters(kind);
    for (const key of Object.keys(p)) {
      const [min, max] = parameterRange(kind, key);
      assert.ok(p[key] >= min && p[key] <= max, `${kind}.${key}`);
    }
    p.a = 99;
    assert.notEqual(initialParameters(kind).a, 99);
  }
  assert.equal(evaluate("linear", 0, initialParameters("linear")), 2);
  assert.equal(evaluate("square", 0, initialParameters("square")), 2);
  assert.equal(evaluate("cubic", 0, initialParameters("cubic")), 2);
  assert.equal(initialParameters("gaussian").a, 2);
  assert.equal(initialParameters("tan").a, 0.3);
});

test("Graph-power preserves the recovered exponential, not a power polynomial", () => {
  assert.equal(evaluate("power", 3, { ...defaults, a: 2, b: -1 }), 7);
});
test("Gaussian uses normalized density and never permits zero sigma", () => {
  assert.ok(Math.abs(evaluate("gaussian", 0, defaults) - 1 / Math.sqrt(2 * Math.PI)) < 1e-12);
  assert.ok(Number.isNaN(evaluate("gaussian", 0, { ...defaults, a: 0 })));
});
test("Sine and cosine have independent controls before summation", () => {
  const p = { a: 2, b: 3, c: 0.2, d: -4, e: 0.5, f: 1 };
  assert.equal(evaluate("sinecosine", 1.2, p), 2 * Math.sin(3 * 1.2 + 0.2) - 4 * Math.cos(0.5 * 1.2 + 1));
});
test("Tangent segments never bridge a pole, including reversed frequency", () => {
  for (const b of [1, -3, 0, 5]) {
    const p = { ...defaults, b };
    for (const segment of graphSegments("tan", p)) {
      for (let i = 1; i < segment.length; i++) assert.equal(crossesPole(segment[i - 1][0], segment[i][0], p), false);
    }
  }
  assert.ok(Number.isNaN(evaluate("tan", Math.PI / 2, defaults)));
});
test("Secants converge to velocity and signed area agrees with position change", () => {
  for (const kind of ["constant", "accelerating", "sine"]) {
    const t = 2;
    assert.ok(Math.abs(secant(kind, t, 1e-5) - motion(kind, t).velocity) < 0.001);
    let integral = 0;
    for (let i = 0; i < 1000; i++) integral += motion(kind, (i + 0.5) * t / 1000).velocity * t / 1000;
    assert.ok(Math.abs(integral - motion(kind, t).position) < 0.001);
  }
});
