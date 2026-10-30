import test from "node:test";
import assert from "node:assert/strict";
import { cubeSection, sphereSlice, sphereMeasures, displayPairs } from "../src/modules/solids/rules.ts";

test("a cutting plane produces triangle, square, pentagon and regular hexagon", () => {
  assert.equal(cubeSection([1, 1, 1], 2.3).length, 3);
  assert.equal(cubeSection([0, 0, 1], 0).length, 4);
  const a = 18 * Math.PI / 180, b = 35 * Math.PI / 180;
  assert.equal(cubeSection([Math.cos(a) * Math.cos(b), Math.cos(a) * Math.sin(b), Math.sin(a)], .4).length, 5);
  const hex = cubeSection([1, 1, 1], 0);
  assert.equal(hex.length, 6);
  const lengths = hex.map((p, i) => Math.hypot(...p.map((v, axis) => v - hex[(i + 1) % 6][axis])));
  assert.ok(lengths.every(length => Math.abs(length - Math.sqrt(2)) < 1e-10));
});

test("touching vertices and faces are deduplicated and an absent plane is empty", () => {
  assert.equal(cubeSection([1, 1, 1], 3).length, 1);
  assert.equal(cubeSection([0, 0, 1], 1).length, 4);
  assert.equal(cubeSection([0, 0, 1], 2).length, 0);
  assert.equal(cubeSection([1, 1, 0], 2).length, 2);
});

test("every ordered section point lies on the requested plane and cube boundary", () => {
  for (let i = 1; i <= 40; i++) {
    const n = [Math.sin(i), Math.cos(i * .7), .4];
    const points = cubeSection(n, .1);
    assert.ok(points.length >= 3 && points.length <= 6);
    for (const p of points) {
      assert.ok(Math.abs(p.reduce((sum, v, axis) => sum + v * n[axis], 0) - .1) < 1e-8);
      assert.ok(p.every(v => Math.abs(v) <= 1 + 1e-8));
      assert.ok(p.some(v => Math.abs(Math.abs(v) - 1) < 1e-8));
    }
  }
});

test("hemisphere disc and cylinder-minus-cone ring agree at every sampled height", () => {
  for (const r of [.2, 3.2, 6400]) for (let i = 0; i <= 20; i++) {
    const slice = sphereSlice(r, r * i / 20);
    assert.ok(Math.abs(slice.discArea - slice.ringArea) < 1e-7 * Math.max(1, slice.ringArea));
  }
  assert.equal(sphereSlice(3, 0).discArea, 0);
  assert.equal(sphereSlice(3, 3).discArea, Math.PI * 9);
});

test("sphere volume scales cubically and its derivative is surface area", () => {
  assert.equal(sphereMeasures(4).volume / sphereMeasures(2).volume, 8);
  const r = 3, delta = 1e-4;
  const derivative = (sphereMeasures(r + delta).volume - sphereMeasures(r - delta).volume) / (2 * delta);
  assert.ok(Math.abs(derivative - sphereMeasures(r).surface) < 1e-6);
});

test("unique zero permits at most four two-face weekday displays even when reordered", () => {
  const pairs = displayPairs([0, 1, 2, 3], [4, 5, 6, 7]);
  assert.equal(Array.from({ length: 7 }, (_, i) => `0${i + 1}`).filter(day => pairs.has(day)).length, 4);
  assert.ok(pairs.has("04") && pairs.has("40"));
  assert.ok(!pairs.has("01"));
});
