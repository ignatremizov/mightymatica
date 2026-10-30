import test from "node:test";
import assert from "node:assert/strict";
import { carpetHoles, needleCrosses, estimatePi, mobiusPoint } from "../src/modules/fractals/rules.ts";

test("carpet removes only the central ninth recursively and preserves the expected area", () => {
  for (let depth = 0; depth <= 5; depth++) {
    const holes = carpetHoles(depth);
    assert.equal(holes.length, (8 ** depth - 1) / 7);
    const removed = holes.reduce((sum, h) => sum + h.size ** 2, 0);
    assert.ok(Math.abs(1 - removed - (8 / 9) ** depth) < 1e-11);
    assert.ok(holes.every(h => h.x > 0 && h.y > 0 && h.x + h.size < 1 && h.y + h.size < 1));
  }
});
test("Buffon crossing uses projected length, and no-hit estimates remain undefined", () => {
  assert.equal(needleCrosses(.5, 0), false);
  assert.equal(needleCrosses(.5, Math.PI / 2), true);
  assert.equal(needleCrosses(.75, Math.PI / 6), false);
  assert.equal(estimatePi(10, 0), null);
  assert.equal(estimatePi(1000, 625), 3.2);
  let hits = 0, count = 0;
  for (let i = 0; i < 400; i++) for (let j = 0; j < 400; j++) {
    if (needleCrosses((i + .5) / 400, (j + .5) / 400 * Math.PI)) hits++;
    count++;
  }
  assert.ok(Math.abs(estimatePi(count, hits) - Math.PI) < .003);
});
test("Möbius seam reverses width after one lap and restores it after two", () => {
  const close = (a, b) => a.forEach((v, i) => assert.ok(Math.abs(v - b[i]) < 1e-10));
  close(mobiusPoint(2 * Math.PI, .4), mobiusPoint(0, -.4));
  close(mobiusPoint(4 * Math.PI, .4), mobiusPoint(0, .4));
});
