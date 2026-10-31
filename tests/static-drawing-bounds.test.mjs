import test from "node:test";
import assert from "node:assert/strict";
import { deflateSync } from "node:zlib";
import { recoverStaticDrawingBounds } from "../scripts/recover-static-drawing-bounds.mjs";

function rect([xmin, ymin, xmax, ymax]) {
  const values = [xmin, xmax, ymin, ymax];
  const width = Math.max(1, ...values.map(value => Math.ceil(Math.log2(Math.abs(value) + 1)) + 1));
  const bits = width.toString(2).padStart(5, "0")
    + values.map(value => (value < 0 ? 2 ** width + value : value).toString(2).padStart(width, "0")).join("");
  return Buffer.from(bits.padEnd(Math.ceil(bits.length / 8) * 8, "0").match(/.{8}/g).map(value => parseInt(value, 2)));
}
function tag(type, data = Buffer.alloc(0)) {
  const header = Buffer.alloc(data.length < 63 ? 2 : 6);
  header.writeUInt16LE(type * 64 + Math.min(data.length, 63));
  if (data.length >= 63) header.writeUInt32LE(data.length, 2);
  return Buffer.concat([header, data]);
}
function definition(id, bounds, tail = Buffer.alloc(0)) {
  const header = Buffer.alloc(2); header.writeUInt16LE(id);
  return Buffer.concat([header, rect(bounds), tail]);
}
function movie(tags, compressed = false) {
  const body = Buffer.concat([rect([0, 0, 11000, 8000]), Buffer.from([0, 24, 1, 0]), ...tags, tag(0)]);
  const header = Buffer.alloc(8);
  header.write(compressed ? "CWS" : "FWS"); header[3] = 10; header.writeUInt32LE(body.length + 8, 4);
  return Buffer.concat([header, compressed ? deflateSync(body) : body]);
}

test("binary recovery uses stroke-inclusive ShapeBounds for all static shape versions and excludes morph/edit text", () => {
  const tags = [2, 22, 32].map((type, i) => tag(type, definition(i + 1, [-10, -20, 30, 40])));
  tags.push(tag(83, definition(4, [-50, -60, 70, 80], Buffer.concat([rect([0, 0, 1, 1]), Buffer.from([1])]))));
  tags.push(tag(11, definition(5, [-2, -3, 4, 5])), tag(33, definition(6, [1, 2, 3, 4])));
  for (const type of [37, 46, 84]) tags.push(tag(type, definition(type, [0, 0, 100, 100])));
  const expected = {
    shape1: [-10, -20, 30, 40], shape2: [-10, -20, 30, 40], shape3: [-10, -20, 30, 40],
    shape4: [-50, -60, 70, 80], text5: [-2, -3, 4, 5], text6: [1, 2, 3, 4],
  };
  for (const compressed of [false, true]) assert.deepEqual(recoverStaticDrawingBounds(movie(tags, compressed)), expected);
});

test("recovery traverses sprite definitions but excludes non-scaling Shape4 strokes", () => {
  const sprite = Buffer.concat([Buffer.from([20, 0, 1, 0]), tag(32, definition(7, [-1, -2, 3, 4])), tag(0)]);
  const nonScaling = tag(83, definition(8, [-5, -6, 7, 8], Buffer.concat([rect([0, 0, 1, 1]), Buffer.from([2])])));
  assert.deepEqual(recoverStaticDrawingBounds(movie([tag(39, sprite), nonScaling])), { shape7: [-1, -2, 3, 4] });
});

test("invalid binary boundaries fail closed rather than creating guessed bounds", () => {
  const good = movie([tag(2, definition(1, [-1, -2, 3, 4]))]);
  assert.throws(() => recoverStaticDrawingBounds(good.subarray(0, -1)), /size mismatch/);
  assert.throws(() => recoverStaticDrawingBounds(movie([tag(2, definition(1, [5, 0, 1, 4]))])), /Inverted/);
  assert.throws(() => recoverStaticDrawingBounds(movie([tag(2, definition(1, [0, 0, 1, 1])), tag(11, definition(1, [0, 0, 1, 1]))])), /Duplicate/);
  assert.throws(() => recoverStaticDrawingBounds(movie([tag(83, definition(1, [0, 0, 1, 1]))])), /Truncated/);
});
