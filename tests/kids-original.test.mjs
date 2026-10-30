import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { connectPictures, insidePoint } from "../src/modules/kids/boardRules.ts";

const boards = JSON.parse(fs.readFileSync(new URL("../src/modules/kids/recovered.json", import.meta.url), "utf8"));

test("original same-color picture pairs cannot be reused or matched to a different color", () => {
  const stage = boards["kids-find-couple"].stages[0];
  assert.equal(connectPictures("couple", stage, [], "lemon", "frog").accepted, false);
  const first = connectPictures("couple", stage, [], "chiken", "lemon");
  assert.equal(first.accepted, true);
  assert.equal(connectPictures("couple", stage, first.connections, "lemon", "chiken").accepted, false);
  assert.equal(connectPictures("couple", stage, first.connections, "tomato", "strawb").accepted, true);
});

test("one sorting basket accepts several figures, but one pattern space accepts only one counter", () => {
  const sorting = boards["kids-share-color"].stages[0];
  const first = connectPictures("sort", sorting, [], "balls2", "slot-balls2");
  assert.equal(first.accepted, true);
  assert.equal(connectPictures("sort", sorting, first.connections, "ballb", "slot-balls2").accepted, true);
  assert.equal(connectPictures("sort", sorting, first.connections, "balls2", "slot-balls2").accepted, false);
  const placing = boards["kids-put-place"].stages[0];
  const placed = connectPictures("place", placing, [], "b1", "slot-b1");
  assert.equal(placed.accepted, true);
  assert.equal(connectPictures("place", placing, placed.connections, "b2", "slot-b1").accepted, false);
  assert.equal(connectPictures("place", placing, placed.connections, "r1", "slot-b2").accepted, false);
});

test("every recovered original stage can reach its authored completion count", () => {
  for (const [id, board] of Object.entries(boards)) {
    for (const stage of board.stages) {
      if (board.mode === "odd") {
        assert.equal(stage.points.length, 1);
        assert.equal(insidePoint(stage.points[0], stage.points[0].x, stage.points[0].y), true);
        assert.equal(insidePoint(stage.points[0], -100, -100), false);
        continue;
      }
      let connections = [];
      for (const [a, b] of stage.pairs) {
        assert.ok(stage.points.some((p) => p.id === a), `${id} frame ${stage.frame}: source exists`);
        assert.ok(stage.points.some((p) => p.id === b), `${id} frame ${stage.frame}: destination exists`);
        const result = connectPictures(board.mode, stage, connections, a, b);
        if (result.accepted) connections = result.connections;
      }
      assert.equal(connections.length, stage.required, `${id} frame ${stage.frame} is completable`);
      assert.equal(connectPictures(board.mode, stage, connections, ...stage.pairs[0]).accepted, false);
    }
  }
});

test("identical-picture shelves include selectable distractors, not only the correct pair", () => {
  const board = boards["kids-find-same"];
  for (const stage of board.stages) {
    assert.ok(stage.points.length >= 12);
    assert.equal(connectPictures("same", stage, [], "s4", "s11").accepted, true);
    const decoy = stage.points.find((p) => !["s4", "s11"].includes(p.id));
    assert.equal(connectPictures("same", stage, [], "s4", decoy.id).accepted, false);
  }
});
