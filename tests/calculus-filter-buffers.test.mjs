import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { parse } from "acorn";
import { patchCalculusFilterBuffers } from "../scripts/calculus-filter-buffers.mjs";

const source = readFileSync(new URL("../public/media/calculus/native/en/chapter-2.mjs", import.meta.url), "utf8");
const names = new Set(["_premultiply", "_unpremultiply", "_boxBlurHorizontal", "_boxBlurVertical",
  "blur", "_setRGB", "_moveRGB", "dropShadow", "glow"]);
const assignments = new Map();
function walk(node) {
  if (!node?.type) return;
  if (node.type === "AssignmentExpression" && names.has(node.left?.property?.name)) {
    assignments.set(node.left.property.name, source.slice(node.start, node.end));
  }
  for (const value of Object.values(node)) {
    if (Array.isArray(value)) value.forEach(walk);
    else if (value?.type) walk(value);
  }
}
walk(parse(source, { ecmaVersion: "latest", sourceType: "module" }));
assert.equal(assignments.size, names.size);
// Reconstruct only the reviewed pre-optimization numeric storage, so this
// regression also works after the public modules have been refreshed.
const original = "// Mechanically converted FFDec 26.2.1 drawing code. Review before importing.\n"
  + [...assignments.values()].join(";\n").replace(/new Float64Array\((?:m\.length|n\*4|r\*4)\)/g, "[]");
const optimized = patchCalculusFilterBuffers(original).source;
const load = async code => {
  const module = await import(`data:text/javascript;base64,${Buffer.from(
    `export function factory(createCanvas){const o={};${code};return o;}`).toString("base64")}`);
  return module.factory;
};
const factories = await Promise.all([load(original), load(optimized)]);

// Deterministic pixel boundary, not a browser rasterization substitute.
// Both versions execute the real original alpha/blur/composition arithmetic.
function canvas(width, height) {
  const image = { width, height, pixels: new Uint8ClampedArray(width * height * 4) };
  const context = {
    fillStyle: "rgba(0,0,0,0)", globalCompositeOperation: "source-over",
    createImageData: (w, h) => ({ width: w, height: h, data: new Uint8ClampedArray(w * h * 4) }),
    getImageData: () => ({ width, height, data: image.pixels.slice() }),
    putImageData: data => { image.pixels.set(data.data); },
    fillRect() {
      image.pixels.fill(0);
      if (this.fillStyle === "#000000") {
        for (let i = 3; i < image.pixels.length; i += 4) image.pixels[i] = 255;
      }
    },
    drawImage(from, dx, dy) {
      for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) {
        const sx = x - Math.round(dx), sy = y - Math.round(dy), to = (y * width + x) * 4;
        const inside = sx >= 0 && sy >= 0 && sx < from.width && sy < from.height;
        const at = (sy * from.width + sx) * 4;
        const a = inside ? from.pixels[at + 3] / 255 : 0, b = image.pixels[to + 3] / 255;
        const behind = this.globalCompositeOperation === "destination-over";
        const factor = this.globalCompositeOperation === "copy" ? 0 : behind ? 1 : 1 - a;
        const input = behind ? a * (1 - b) : a;
        const alpha = input + b * factor;
        for (let channel = 0; channel < 3; channel++) {
          image.pixels[to + channel] = alpha
            ? ((inside ? from.pixels[at + channel] : 0) * input + image.pixels[to + channel] * b * factor) / alpha : 0;
        }
        image.pixels[to + 3] = alpha * 255;
      }
    },
  };
  image.getContext = () => context;
  return image;
}

test("fixed-size filter buffers preserve actual blur rounding and masked edge arithmetic", () => {
  const [before, after] = factories.map(factory => factory(canvas));
  for (const [width, height] of [[1, 1], [7, 5], [23, 17]]) {
    for (const radius of [0, 1, 3, 8]) for (const mode of [0, 1, 2]) {
      const seed = Uint8ClampedArray.from({ length: width * height * 4 }, (_, i) => (i * 73 + i % 5 * 31) % 256);
      for (const name of ["_boxBlurHorizontal", "_boxBlurVertical"]) {
        const a = seed.slice(), b = seed.slice();
        before[name](a, seed, width, height, radius, mode);
        after[name](b, seed, width, height, radius, mode);
        assert.deepEqual(b, a, `${name}, ${width}×${height}, radius ${radius}, mask ${mode}`);
      }
    }
  }
});

test("scratch storage keeps chained shadow alpha, strength, inner and knockout results unchanged", () => {
  for (const inner of [false, true]) for (const knockout of [false, true]) {
    for (const strength of [0.3, 1, 2]) {
      const images = factories.map(factory => {
        const filters = factory(canvas), source = canvas(23, 17);
        for (let y = 5; y < 11; y++) for (let x = 8; x < 14; x++) {
          const offset = (y * source.width + x) * 4;
          source.pixels.set([120, 40, 230, (x * y * 23) % 256], offset);
        }
        const glow = filters.glow(source, source.getContext("2d"), 7, 7, strength,
          [0, 51, 204, 0.7], inner, knockout, 1);
        return filters.dropShadow(glow, glow.getContext("2d"), 5, 5, 44, 5,
          [0, 0, 0, 1], inner, 1, strength, knockout).pixels;
      });
      assert.deepEqual(images[1], images[0]);
      if (!inner) assert.equal(images[1][3], 0, "an untouched transparent corner must not acquire a rectangular fill");
    }
  }
});

test("filter patch is idempotent across headers and fails closed for altered arithmetic", () => {
  assert.equal(patchCalculusFilterBuffers(optimized).source, optimized);
  const reordered = optimized.replace("\n", "\n// A subsequent reviewed transport patch.\n");
  assert.equal(patchCalculusFilterBuffers(reordered).source, reordered);
  assert.throws(() => patchCalculusFilterBuffers(original.replace("Math.round(v)", "Math.floor(v)")), /Unreviewed/);
  assert.throws(() => patchCalculusFilterBuffers(optimized.replace("new Float64Array(m.length)", "new Float64Array(1)")), /Corrupted/);
  assert.throws(() => patchCalculusFilterBuffers(original.slice(80)), /provenance/);
});
