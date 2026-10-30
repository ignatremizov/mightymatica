import test from "node:test";
import assert from "node:assert/strict";
import { placeCoin, washingAtStop, coinStart, coinTargets, canMatchBead } from "../src/modules/logic/rules.ts";

test("only the three original corner coins can fill distinct destinations", () => {
  let placements = Array(10).fill(null);
  assert.equal(placeCoin(placements, 1, 0), null);
  assert.equal(placeCoin(placements, 0, -1), null);
  assert.equal(placeCoin(placements, 0, 0.5), null);
  placements = placeCoin(placements, 0, 2);
  assert.equal(placeCoin(placements, 6, 2), null);
  assert.equal(placeCoin(placements, 0, 0), null);
  placements = placeCoin(placements, 6, 0);
  placements = placeCoin(placements, 9, 1);
  assert.equal(placements.filter((p) => p !== null).length, 3);
  const final = coinStart.map((point, i) => placements[i] === null ? point : coinTargets[placements[i]]);
  assert.equal(new Set(final.map(String)).size, 10);
  assert.deepEqual([1, 2, 3, 4].map((row) => final.filter(([, y]) => y === row).length), [4, 3, 2, 1]);
});

test("public knowledge makes all dirty travelers wash at the matching stop", () => {
  for (let dirty = 1; dirty <= 8; dirty++) {
    for (let stop = 1; stop <= 8; stop++) {
      assert.equal(washingAtStop(dirty, stop), dirty === stop);
    }
  }
  assert.equal(washingAtStop(0, 0), false);
  assert.equal(washingAtStop(2.5, 2.5), false);
});

test("chain beads match by color, never reuse a bead or occupied hole", () => {
  assert.equal(canMatchBead("Completechain", "b1", "b4", {}), true);
  assert.equal(canMatchBead("Completechain", "b1", "r1", {}), false);
  assert.equal(canMatchBead("Completechain", "r4", "r2", { r4: "r1" }), false);
  assert.equal(canMatchBead("Completechain", "r4", "r2", { r3: "r2" }), false);
});

test("broken necklaces require the authored pair, not a same-row guess", () => {
  assert.equal(canMatchBead("Rippednecklace", "nlef1", "nlef1", {}), true);
  assert.equal(canMatchBead("Rippednecklace", "nlef1", "nlef3", {}), false);
  assert.equal(canMatchBead("Rippednecklace", "nlef1", "nlef1", { nlef1: "nlef1" }), false);
  assert.equal(canMatchBead("Rippednecklace", "nlef9", "nlef9", {}), false);
});
