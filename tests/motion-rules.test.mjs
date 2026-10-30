import test from "node:test";
import assert from "node:assert/strict";
import { beltGap, headExtraDistance, ladderPoint, circleRoll, clusterRoll, squareRoll, cubeSurfaceRoute, cyclistState, roulettePoint } from "../src/modules/motion/rules.ts";
const close = (a, b) => assert.ok(Math.abs(a - b) < 1e-8, `${a} ≠ ${b}`);

test("Circincirc at half radius traces a diameter and at full radius stays still", () => {
  for (let i = 0; i <= 100; i++) {
    const half = roulettePoint(i / 100, 50);
    close(half.y, 0);
    assert.ok(Math.abs(half.x) <= half.R + 1e-8);
    const full = roulettePoint(i / 100, 100);
    close(full.x, full.R);
    close(full.y, 0);
  }
  close(roulettePoint(.5, 50).x, -180);
  close(roulettePoint(0, 0).r, 90);
});
test("Circincirc preserves signed radius exterior contact and multi-orbit closure", () => {
  for (const ratio of [-300, -100, -90, -1, 1, 20, 25, 50, 100]) {
    const p = roulettePoint(.173, ratio);
    close(Math.hypot(p.x - p.centerX, p.y - p.centerY), Math.abs(p.r));
    close(Math.hypot(p.centerX, p.centerY), Math.abs(p.R - p.r));
    assert.ok(Number.isFinite(p.x) && Number.isFinite(p.y));
  }
  const first = roulettePoint(0, 30);
  const notClosed = roulettePoint(1, 30);
  const closed = roulettePoint(3, 30);
  assert.ok(Math.hypot(first.x - notClosed.x, first.y - notClosed.y) > 1);
  close(first.x, closed.x);
  close(first.y, closed.y);
});
test("seven-penny cluster has continuous double-contact transitions and four turns", () => {
  const start = clusterRoll(0);
  const end = clusterRoll(1);
  close(start.x, end.x);
  close(start.y, end.y);
  close(end.turns, 4);
  for (let i = 1; i < 6; i++) {
    const before = clusterRoll(i / 6 - 1e-10);
    const after = clusterRoll(i / 6 + 1e-10);
    assert.ok(Math.hypot(before.x - after.x, before.y - after.y) < 1e-7);
    const join = clusterRoll(i / 6);
    for (const j of [i - 1, i]) close(Math.hypot(join.x - 2 * Math.cos(j * Math.PI / 3), join.y - 2 * Math.sin(j * Math.PI / 3)), 2);
  }
  for (let i = 0; i <= 600; i++) {
    const p = clusterRoll(i / 600);
    for (let j = 0; j < 6; j++) assert.ok(Math.hypot(p.x - 2 * Math.cos(j * Math.PI / 3), p.y - 2 * Math.sin(j * Math.PI / 3)) >= 2 - 1e-8);
  }
});
test("rolling around an equal penny adds a second turn", () => {
  close(circleRoll(1).turns, 2);
  close(circleRoll(.5).turns, 1);
  close(circleRoll(1, 3, 1).turns, 4);
});
test("square corners add one turn beyond the four sides", () => {
  const end = squareRoll(1);
  close(end.turns, 5);
  close(end.x, 0);
  close(end.y, -1);
  for (let i = 0; i <= 100; i++) {
    const p = squareRoll(i / 100);
    assert.ok(Number.isFinite(p.x) && Number.isFinite(p.y));
  }
});
test("the kitten at the midpoint traces a circle and remains on the ladder", () => {
  for (let i = 0; i <= 100; i++) {
    const p = ladderPoint(300, .5, i / 100);
    close(Math.hypot(p.x, p.y), 150);
    close(Math.hypot(p.footX, p.topY), 300);
  }
  close(ladderPoint(300, 0, .4).y, 0);
  close(ladderPoint(300, 1, .4).x, 0);
});
test("one extra metre creates a radius-independent gap and head path depends on height", () => {
  close(beltGap(1), 1 / (2 * Math.PI));
  close(headExtraDistance(6), 12 * Math.PI);
});
test("unfolding the cube gives the shortest route at the shared edge midpoint", () => {
  close(cubeSurfaceRoute(.5), Math.sqrt(5));
  for (let i = 0; i <= 100; i++) assert.ok(cubeSurfaceRoute(i / 100) >= Math.sqrt(5) - 1e-12);
});
test("the fly stays between the cyclists and flies 160 km by their meeting", () => {
  for (let i = 0; i <= 1000; i++) {
    const p = cyclistState(i / 1000);
    assert.ok(p.fly >= p.left - 1e-7 && p.fly <= p.right + 1e-7);
  }
  const end = cyclistState(1);
  close(end.time, 1.6);
  close(end.flyDistance, 160);
  close(end.left, end.right);
  close(end.fly, 24);
});
