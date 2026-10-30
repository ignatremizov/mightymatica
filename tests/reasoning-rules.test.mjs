import { test } from "node:test";
import assert from "node:assert/strict";
import { fingerAt, snailHeight, ageTriples, waterRoute, mixedTransfer } from "../src/modules/reasoning/rules.ts";

test("counting reverses without counting the endpoint twice and the thousandth finger is index", () => {
  assert.deepEqual(Array.from({ length: 10 }, (_, i) => fingerAt(i + 1)), [0,1,2,3,4,3,2,1,0,1]);
  assert.equal(fingerAt(1000), 1);
  assert.equal(fingerAt(1001), 0);
});
test("snail reaches the top on day nine and does not slide after arrival", () => {
  assert.deepEqual([0,1,2,3,4].map(snailHeight), [0,2,1,3,2]);
  assert.equal(snailHeight(16), 8);
  assert.equal(snailHeight(17), 10);
  assert.equal(snailHeight(18), 10);
});
test("only tram sum thirteen is ambiguous and the oldest-son clue resolves it", () => {
  const triples = ageTriples(36);
  assert.equal(triples.length, 8);
  const groups = Map.groupBy(triples, ages => ages.reduce((a,b) => a+b, 0));
  assert.deepEqual([...groups].filter(([, rows]) => rows.length > 1).map(([sum]) => sum), [13]);
  assert.deepEqual(groups.get(13).filter(ages => ages[1] < ages[2]), [[2,2,9]]);
});
test("reflecting the house produces the shortest river route", () => {
  const crossing = 5.8; // A=(1,3), reflected B=(9,-2).
  assert.ok(Math.abs(waterRoute(crossing) - Math.hypot(8,5)) < 1e-10);
  for (let stop = 0; stop <= 10; stop += .1) assert.ok(waterRoute(stop) >= waterRoute(crossing) - 1e-10);
});
test("equal transfers conserve equal foreign-liquid volumes across different vessel sizes", () => {
  for (const [wine, milk, transfer] of [[10,4,1], [100,2,1], [8,12,3]]) {
    const result = mixedTransfer(wine, milk, transfer);
    assert.ok(Math.abs(result.wineInGlass - result.milkInBarrel) < 1e-12);
    assert.ok(result.wineInGlass <= transfer);
  }
});
