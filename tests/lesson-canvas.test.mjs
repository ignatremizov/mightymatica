import test from "node:test";
import assert from "node:assert/strict";
import { lessonCanvasSize } from "../src/shared/LessonCanvas.ts";

test("enlarged and high-density lesson views get real drawing pixels instead of a stretched scan", () => {
  assert.deepEqual(lessonCanvasSize(550, 400, 760, 1), { width: 760, height: 552 });
  const retina = lessonCanvasSize(550, 400, 760, 2);
  assert.equal(retina.width, 1520);
  assert.ok(Math.abs(retina.height / retina.width - 400 / 550) < .001);
  assert.deepEqual(lessonCanvasSize(550, 400, 0, NaN), { width: 550, height: 400 });
});

test("large windows and zoom retain a bounded backing store for source filters", () => {
  for (const [width, height] of [[550, 400], [1080, 720], [2048, 2048]]) {
    const size = lessonCanvasSize(width, height, 6000, 4);
    assert.ok(size.width <= 2048 && size.height <= 2048);
    assert.ok(size.width * size.height <= 2_097_152);
    assert.ok(Math.abs(size.height / size.width - height / width) < .002);
  }
});
