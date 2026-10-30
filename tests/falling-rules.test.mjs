import test from "node:test";
import assert from "node:assert/strict";
import { accepts, buckets, generate, goal, targetAt } from "../src/modules/falling/rules.ts";
const figure = { id: 1, shape: "triangle", color: "blue", width: 85, x: 0, y: 0, speed: 1, initialSpeed: 1 };
test("a figure must enter the authored target, not an arbitrary bottom strip", () => {
  assert.equal(targetAt("size", 433, 201), 1);
  assert.equal(targetAt("size", 433, 350), -1);
  assert.equal(targetAt("size", 143, 292), -1);
  assert.equal(targetAt("color", 444, 330), 1);
  assert.equal(targetAt("shape", 246.55, 284.75), 1);
  assert.equal(targetAt("all", 246.55, 305), -1);
});
test("size boundary sends width 85 to small and larger figures to large", () => {
  assert.equal(accepts("size", figure, 0, []), true);
  assert.equal(accepts("size", {...figure,width:86}, 0, []), false);
  assert.equal(accepts("size", {...figure,width:86}, 1, []), true);
});
test("shape sorting ignores color; all requires both shape and bucket color", () => {
  const targets = buckets(() => .4);
  assert.equal(accepts("shape", figure, 1, targets), true);
  assert.equal(accepts("all", figure, 1, targets), false);
  assert.equal(accepts("all", figure, 2, targets), true);
  assert.equal(accepts("all", {...figure,shape:"circle"}, 2, targets), false);
});
test("published color mode generates only pink and blue, with independent shapes", () => {
  for (const random of [() => .01, () => .5, () => .99]) {
    const generated = generate("color", 1, random);
    assert.ok(["pink", "blue"].includes(generated.color));
    assert.equal(accepts("color", generated, generated.color === "pink" ? 0 : 1, []), true);
  }
});
test("single-category rounds need nine placements and all needs ten", () => {
  assert.equal(goal("color"),9); assert.equal(goal("size"),9); assert.equal(goal("shape"),9); assert.equal(goal("all"),10);
});
