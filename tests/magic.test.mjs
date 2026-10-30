import test from "node:test";
import assert from "node:assert/strict";
import { mindSymbol, subtraction, flipGlass, nextEmpty } from "../src/modules/magic/rules.ts";

test("every secret two-digit choice matches the ball, including changed rounds", () => {
  for (let round = 0; round < 24; round++) {
    for (let n = 10; n <= 99; n++) {
      assert.equal(mindSymbol(n - Math.floor(n / 10) - n % 10, round), mindSymbol(9, round));
    }
  }
});
test("the original first/last digit constraint always produces 1089", () => {
  let count = 0;
  for (let n = 100; n <= 999; n++) {
    const result = subtraction(n);
    if (result) { assert.equal(result.sum, 1089); count++; }
  }
  assert.equal(count, 360);
  for (const n of [99, 1000, 121, 312, 741.1, NaN]) assert.equal(subtraction(n), null);
});
test("the source solution measures four remaining minutes plus eleven", () => {
  let state = { time: 0, remaining: [0, 0] };
  state = flipGlass(flipGlass(state, 0), 1);
  state = nextEmpty(state);
  assert.deepEqual(state, { time: 7, remaining: [4, 0] });
  const start = state.time;
  state = nextEmpty(state);
  state = nextEmpty(flipGlass(state, 0));
  assert.equal(state.time - start, 15);
});
test("flipping a partially full glass preserves sand and empty clocks do not advance time", () => {
  assert.deepEqual(flipGlass({ time: 7, remaining: [4, 0] }, 0).remaining, [7, 0]);
  assert.deepEqual(nextEmpty({ time: 3, remaining: [0, 0] }), { time: 3, remaining: [0, 0] });
});
