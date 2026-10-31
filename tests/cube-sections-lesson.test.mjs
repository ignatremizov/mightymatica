import test from "node:test";
import assert from "node:assert/strict";
import { cubeDemonstrationState, projectCubePoint } from "../src/modules/solids/cubeSectionsLessonRules.ts";

test("native section movement preserves source reversal order through repeated sweeps", () => {
  for (const scene of [1, 2, 3, 4]) {
    let control = 0, step = 1, offset = 0;
    for (let tick = 1; tick <= 4000; tick++) {
      control += scene === 4 ? step : -step;
      if (scene === 3 ? control === -45 || control === 45
        : scene === 4 ? control > 75 || control < 0 : control < -75 || control > 75) step = -step;
      offset += scene === 4 ? step : -step;
      const native = cubeDemonstrationState(scene, tick);
      assert.equal(native.control, control, `scene ${scene}, tick ${tick}`);
      assert.equal(native.offset, offset, `scene ${scene}, tick ${tick}`);
    }
  }
});

test("tilt keeps rotating while its width compensation oscillates", () => {
  assert.equal(cubeDemonstrationState(3, 45).sectionRotationX, -45);
  assert.equal(cubeDemonstrationState(3, 90).sectionRotationX, -90);
  assert.ok(Math.abs(cubeDemonstrationState(3, 45).sectionScaleY - Math.SQRT2) < 1e-12);
  assert.equal(cubeDemonstrationState(3, 90).sectionScaleY, 1);
});

test("long background playback remains bounded and returns the source cycle", () => {
  for (const [scene, period] of [[1, 304], [2, 304], [3, 180], [4, 154]]) {
    const state = cubeDemonstrationState(scene, period * 1000000);
    assert.equal(state.control, 0);
    assert.equal(state.offset, 0);
    assert.equal(state.coverAlpha, 0);
    assert.ok(Number.isFinite(state.sectionScaleY));
  }
  assert.deepEqual(projectCubePoint([0, 0, 0]), [260.95, 194]);
});
