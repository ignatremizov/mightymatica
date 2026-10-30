import test from "node:test";
import assert from "node:assert/strict";
import { groupsFor, placeFigure, roundFigures } from "../src/modules/kids/rules.ts";

test("sorting follows the original five, six and eight figure progression", () => {
  assert.deepEqual([0, 1, 2].map((round) => roundFigures(round).length), [5, 6, 8]);
  assert.deepEqual(groupsFor("shape", 1), ["square", "circle"]);
  assert.deepEqual(groupsFor("shape", 2), ["square", "triangle", "circle"]);
});

test("a child's wrong drop or repeated correct drop never advances the round", () => {
  const wrong = placeFigure("color", 0, [], "ballsml", "blue");
  assert.equal(wrong.accepted, false);
  assert.deepEqual(wrong.placed, []);
  const right = placeFigure("color", 0, [], "ballsml", "pink");
  assert.equal(right.accepted, true);
  assert.equal(placeFigure("color", 0, right.placed, "ballsml", "pink").accepted, false);
  assert.equal(placeFigure("color", 0, [], "trian1", "pink").accepted, false);
});

test("the same figure must change destinations when the sorting property changes", () => {
  assert.equal(placeFigure("color", 2, [], "trian1", "pink").accepted, true);
  assert.equal(placeFigure("shape", 2, [], "trian1", "triangle").accepted, true);
  assert.equal(placeFigure("size", 2, [], "trian1", "large").accepted, true);
  assert.equal(placeFigure("size", 2, [], "trian2", "large").accepted, false);
  assert.equal(placeFigure("size", 2, [], "trian2", "small").accepted, true);
});

test("every original figure has exactly one valid group in every available round", () => {
  for (const rule of ["color", "shape", "size"]) {
    for (let round = 0; round < 3; round++) {
      let placed = [];
      for (const figure of roundFigures(round)) {
        const valid = groupsFor(rule, round).filter((group) =>
          placeFigure(rule, round, placed, figure.id, group).accepted);
        assert.equal(valid.length, 1);
        placed = placeFigure(rule, round, placed, figure.id, valid[0]).placed;
      }
      assert.equal(placed.length, roundFigures(round).length);
    }
  }
});
