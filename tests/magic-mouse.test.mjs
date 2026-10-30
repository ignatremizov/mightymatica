import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { advanceMouse, catPosition, mouseCanStand, resolveMouseContacts, startMouse } from "../src/modules/magic/mouseRules.ts";
const imported = JSON.parse(readFileSync(new URL("../src/modules/magic/mouse-data.json", import.meta.url)));
const empty = { sourceFrame: 1, scene: "test", walls: [], cats: [], targets: [], goal: [600, 400], target: 3 };

test("collecting a bunch counts it once and the exit requires exactly the target", () => {
  const level = { ...empty, targets: [{ id: "cher31", x: 100, y: 100, value: 3 }] };
  let state = { ...startMouse(level, "collect"), x: 100, y: 100 };
  state = resolveMouseContacts(level, "collect", state);
  state = resolveMouseContacts(level, "collect", state);
  assert.equal(state.count, 3);
  assert.deepEqual(state.used, ["cher31"]);
  assert.equal(resolveMouseContacts(level, "collect", { ...state, x: 600, y: 400 }).status, "won");
  assert.equal(resolveMouseContacts(level, "collect", { ...state, count: 4, x: 600, y: 400 }).status, "wrong");
});
test("feeding a group consumes its size once, and insufficient food fails", () => {
  const level = { ...empty, targets: [{ id: "mk21", x: 100, y: 100, value: 2 }] };
  let state = { ...startMouse(level, "distribute"), x: 100, y: 100 };
  state = resolveMouseContacts(level, "distribute", state);
  assert.equal(state.count, 1);
  assert.equal(resolveMouseContacts(level, "distribute", state).count, 1);
  assert.equal(resolveMouseContacts(level, "distribute", { ...state, count: 1, used: [] }).status, "hungry");
  assert.equal(resolveMouseContacts(level, "distribute", { ...state, x: 600, y: 400 }).status, "wrong");
  assert.equal(resolveMouseContacts(level, "distribute", { ...state, count: 0, x: 600, y: 400 }).status, "won");
});
test("bounded movement cannot cross a thin wall even with a large supplied delta", () => {
  const level = { ...empty, walls: [[50, 0, 50, 480]] };
  let state = startMouse(level, "cheese");
  for (let i=0; i<100; i++) state = advanceMouse(level, "cheese", state, 100, { x: 1, y: 0 });
  assert.ok(state.x <= 41);
  assert.ok(mouseCanStand(level, state.x, state.y));
});
test("cat patrols reverse at the source endpoints and catch a stationary mouse", () => {
  const cat = { x: 100, y: 100, axis: "y", start: 100, end: 300, seconds: 5 };
  assert.deepEqual(catPosition(cat, 0), { x: 121, y: 124 });
  assert.deepEqual(catPosition(cat, 5), { x: 121, y: 324 });
  assert.deepEqual(catPosition(cat, 10), { x: 121, y: 124 });
  const level = { ...empty, cats: [cat] };
  assert.equal(resolveMouseContacts(level, "cheese", { ...startMouse(level, "cheese"), x: 121, y: 124 }).status, "caught");
});
test("every imported maze exit and arithmetic group is reachable through its original walls", () => {
  // Flood only static geometry: timing past moving cats remains a gameplay task.
  for (const levels of Object.values(imported)) for (const level of levels) {
    const queue = [[36, 90]], seen = new Set(["36,90"]);
    for (let index=0; index<queue.length; index++) {
      const [x, y] = queue[index];
      for (const [dx, dy] of [[3, 0], [-3, 0], [0, 3], [0, -3]]) {
        const nx = x+dx, ny = y+dy, key = `${nx},${ny}`;
        if (!seen.has(key) && mouseCanStand(level, nx, ny)) {
          seen.add(key); queue.push([nx, ny]);
        }
      }
    }
    assert.ok(queue.some(([x, y]) => Math.hypot(x-level.goal[0], y-level.goal[1]) < 26), `${level.scene} exit`);
    for (const item of level.targets) assert.ok(queue.some(([x, y]) => Math.hypot(x-item.x, y-item.y) <= 20), `${level.scene} ${item.id}`);
  }
});
