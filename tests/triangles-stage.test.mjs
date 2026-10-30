import test from "node:test";
import assert from "node:assert/strict";
import { construction } from "../src/modules/triangles/geometry.ts";
import { capturedVertexPosition, moveStageVertex, stageLine } from "../src/modules/triangles/StageGeometry.ts";

test("a distant orthocenter cannot move the grabbed vertex or send SVG construction coordinates out of bounds", () => {
  const triangle = [{ x: 0, y: 0 }, { x: 200, y: 0 }, { x: 100, y: 1 }];
  const bounds = { left: 0, top: 0, right: 550, bottom: 400 };
  const data = construction(triangle, "altitudes");
  assert.ok(data.center.y > bounds.bottom);
  const actualCenter = { ...data.center };
  for (const [index, foot] of data.feet.entries()) {
    const line = stageLine(triangle[index], foot, bounds);
    assert.ok(line);
    for (const point of line) {
      assert.ok(point.x >= bounds.left - 1e-8 && point.x <= bounds.right + 1e-8);
      assert.ok(point.y >= bounds.top - 1e-8 && point.y <= bounds.bottom + 1e-8);
    }
  }
  assert.deepEqual(data.center, actualCenter, "Clipping drawings must not clamp the mathematical orthocenter");
  assert.deepEqual(capturedVertexPosition({ x: 100, y: 200 }, { x: 102, y: 203 }, { x: 112, y: 183 }),
    { x: 110, y: 180 }, "The original grab offset stays attached to the pointer");
});

test("vertex movement stays reachable and rejects collinearity without changing the previous triangle", () => {
  const triangle = [{ x: 20, y: 100 }, { x: 180, y: 100 }, { x: 100, y: 20 }];
  const bounds = { left: 20, top: 20, right: 180, bottom: 100 };
  assert.equal(moveStageVertex(triangle, 2, { x: 100, y: 100 }, bounds), triangle);
  const moved = moveStageVertex(triangle, 0, { x: -1000, y: -1000 }, bounds);
  assert.deepEqual(moved[0], { x: 20, y: 20 });
  assert.deepEqual(moved.slice(1), triangle.slice(1));
  assert.equal(stageLine({ x: 600, y: 0 }, { x: 600, y: 200 }, bounds), null);
});
