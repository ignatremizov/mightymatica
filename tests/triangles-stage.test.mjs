import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { construction, distance, falseProofConstruction } from "../src/modules/triangles/geometry.ts";
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

test("the false-proof hint uses its original circle centers and keeps the construction in the same fixed stage while dragging", () => {
  const sources = JSON.parse(readFileSync(new URL("../src/modules/triangles/source-interactions.json", import.meta.url), "utf8"));
  const viewport = { left: 0, top: 0, right: 550, bottom: 400 };
  for (const locale of ["en", "ru"]) {
    const { vertices } = sources[`false-proof:${locale}`];
    assert.equal(vertices.length, 3);
    const points = vertices.map(({ x, y, sourceFootprint }) => {
      assert.ok(Math.abs(x - (sourceFootprint.x + sourceFootprint.width / 2)) < .001,
        "the drag handle must coincide with the centered source circle");
      assert.ok(Math.abs(y - (sourceFootprint.y + sourceFootprint.height / 2)) < .001);
      return { x, y };
    });
    const playground = {
      left: Math.min(...points.map(p => p.x)), right: Math.max(...points.map(p => p.x)),
      top: Math.min(...points.map(p => p.y)), bottom: Math.max(...points.map(p => p.y)),
    };
    const grabbedAt = { x: points[2].x + 3, y: points[2].y + 2 };
    for (const dx of [-90, -20, 0, 30, 90]) {
      const moved = moveStageVertex(points, 2, capturedVertexPosition(points[2], grabbedAt,
        { x: grabbedAt.x + dx, y: grabbedAt.y + 20 }), playground);
      const proof = falseProofConstruction([moved[2], moved[0], moved[1]]);
      assert.ok(proof);
      assert.ok(Math.abs(distance(proof.x, moved[0]) - distance(proof.x, moved[1])) < 1e-8,
        "the perpendicular bisector belongs to source side AB, with C as the angle-bisector vertex");
      for (const pair of [[moved[2], proof.bisectorFoot], [proof.x, proof.footB], [proof.x, proof.footC]]) {
        const clipped = stageLine(...pair, viewport);
        if (!clipped) continue;
        assert.ok(clipped.every(p => p.x >= -.0001 && p.x <= 550.0001 && p.y >= -.0001 && p.y <= 400.0001),
          "remote intersections cannot expand the original stage or shift the grabbed vertex");
      }
    }
  }
});
