#!/usr/bin/env node
// No browser/GPU: actual reviewed drawing/filter JS, inert vector/image I/O,
// real bounded pixel arrays. This is not a browser FPS or pixel-parity test.
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { performance } from "node:perf_hooks";

const root = resolve(import.meta.dirname, "..");
const baseline = process.argv.includes("--baseline");
const smokeAll = process.argv.includes("--smoke-all");
const transitions = process.argv.includes("--transitions");
if (process.argv.slice(2).some(arg => !["--baseline", "--smoke-all", "--transitions"].includes(arg))
  || [baseline, smokeAll, transitions].filter(Boolean).length > 1) {
  throw new Error("Usage: node scripts/profile-calculus-filters.mjs [--baseline | --smoke-all | --transitions]");
}
const frames = [368, 369, 370, 371, 372, 373, 374, 375, 720];
let stats;
const counts = () => ({ canvases: 0, calls: 0, reads: 0, readPixels: 0, fullCanvasReads: 0 });
const identity = () => [1, 0, 0, 1, 0, 0];
function multiply(a, b) {
  return [a[0] * b[0] + a[2] * b[1], a[1] * b[0] + a[3] * b[1],
    a[0] * b[2] + a[2] * b[3], a[1] * b[2] + a[3] * b[3],
    a[0] * b[4] + a[2] * b[5] + a[4], a[1] * b[4] + a[3] * b[5] + a[5]];
}
function canvas(width = 1, height = 1) {
  stats.canvases++;
  const canvas = { width, height, style: {} };
  const context = { canvas };
  let matrix = identity();
  const saved = [];
  const noop = () => {};
  for (const key of ["clearRect", "fillRect", "drawImage", "beginPath", "moveTo", "lineTo",
    "quadraticCurveTo", "bezierCurveTo", "closePath", "fill", "stroke", "clip", "putImageData"]) {
    context[key] = () => { stats.calls++; };
  }
  // Keep actual CTM separate from the exporter's _matrix bookkeeping,
  // reproducing the native scale()/getTransform() distinction.
  context.save = () => { saved.push([...matrix]); };
  context.restore = () => { matrix = saved.pop() ?? identity(); };
  const nativeTransform = (...values) => { matrix = multiply(matrix, values); };
  context.transform = nativeTransform;
  context.setTransform = (...values) => { matrix = values; };
  context.resetTransform = () => { matrix = identity(); };
  context.scale = (x, y) => nativeTransform(x, 0, 0, y, 0, 0);
  context.translate = (x, y) => nativeTransform(1, 0, 0, 1, x, y);
  context.rotate = angle => nativeTransform(Math.cos(angle), Math.sin(angle), -Math.sin(angle), Math.cos(angle), 0, 0);
  context.getTransform = () => Object.fromEntries(["a", "b", "c", "d", "e", "f"].map((key, index) => [key, matrix[index]]));
  context.getImageData = (_x, _y, width, height) => {
    const pixels = Math.max(1, Math.ceil(width) * Math.ceil(height));
    stats.reads++;
    stats.readPixels += pixels;
    if (width >= 550 && height >= 400) stats.fullCanvasReads++;
    if (stats.readPixels > 64_000_000) throw new Error("Diagnostic per-frame pixel budget exceeded.");
    return { width, height, data: new Uint8ClampedArray(pixels * 4) };
  };
  context.createImageData = (width, height) =>
    ({ width, height, data: new Uint8ClampedArray(Math.max(1, width * height) * 4) });
  context.createPattern = () => ({ setTransform: noop });
  context.createLinearGradient = () => ({ addColorStop: noop });
  context.createRadialGradient = context.createLinearGradient;
  canvas.getContext = () => context;
  return canvas;
}
const previous = Object.getOwnPropertyDescriptor(globalThis, "document");
Object.defineProperty(globalThis, "document", { configurable: true, value: {
  createElement: tag => tag === "canvas" ? canvas() : {
    width: 1, height: 1, decode: async () => {}, removeAttribute() {},
  },
} });
try {
  if (smokeAll) {
    for (const locale of ["en", "ru"]) for (const chapter of [1, 2, 3]) {
      const module = await import(pathToFileURL(resolve(root, `public/media/calculus/native/${locale}/chapter-${chapter}.mjs`)));
      stats = counts();
      const renderer = await module.createTimeline(canvas(11, 8));
      const start = performance.now();
      try {
        for (const frame of module.metadata.frames) {
          stats = counts();
          renderer.draw(frame, frame - 1);
        }
      } finally { renderer.dispose(); }
      console.log(JSON.stringify({ locale, chapter, frames: module.metadata.frames.length,
        milliseconds: Math.round(performance.now() - start), mode: "execution-only, tiny inert Canvas" }));
    }
  } else if (transitions) {
    // Include the animated lead-in, the actual answer gate, and a second
    // identical draw: full-stage button effects must not recur at a question.
    for (const [locale, chapter, gate] of [
      ["en", 1, 1568], ["en", 2, 5550], ["en", 3, 9749],
      ["ru", 1, 700], ["ru", 2, 4688], ["ru", 3, 8887],
      // Later Integral/Derivative titles reported during Parts 4 and 5.
      ["en", 3, 8838], ["en", 3, 10761],
      ["ru", 2, 7976], ["ru", 3, 9899],
    ]) {
      const module = await import(pathToFileURL(resolve(root,
        `public/media/calculus/native/${locale}/chapter-${chapter}.mjs`)));
      stats = counts();
      const renderer = await module.createTimeline(canvas(1520, 1105));
      const samples = [];
      try {
        for (let frame = gate - 120; frame <= gate; frame++) {
          stats = counts();
          const start = performance.now();
          renderer.draw(frame, frame - 1);
          samples.push({ frame, milliseconds: +(performance.now() - start).toFixed(2), ...stats });
        }
      } finally { renderer.dispose(); }
      const warm = samples.slice(1);
      console.log(JSON.stringify({ locale, chapter, width: 1520, height: 1105,
        cold: samples[0],
        warmAverageMs: +(warm.reduce((total, sample) => total + sample.milliseconds, 0) / warm.length).toFixed(2),
        fullCanvasReads: warm.reduce((total, sample) => total + sample.fullCanvasReads, 0),
        worst: warm.toSorted((a, b) => b.milliseconds - a.milliseconds).slice(0, 8),
      }));
    }
  } else {
  const paths = baseline
    ? [["before", ".cache/calculus-filter-originals/en/chapter-1.mjs"], ["after", "public/media/calculus/native/en/chapter-1.mjs"]]
    : [["after", "public/media/calculus/native/en/chapter-1.mjs"]];
  for (const [edition, path] of paths) {
    const module = await import(pathToFileURL(resolve(root, path)));
    for (const [width, height] of [[550, 400], [1520, 1105]]) {
      stats = counts();
      const renderer = await module.createTimeline(canvas(width, height));
      const samples = [];
      try {
        for (const frame of frames) {
          stats = counts();
          const start = performance.now();
          renderer.draw(frame, frame - 1);
          samples.push({ frame, milliseconds: +(performance.now() - start).toFixed(2), ...stats });
        }
      } finally { renderer.dispose(); }
      const warm = samples.slice(1, -1).map(sample => sample.milliseconds).sort((a, b) => a - b);
      console.log(JSON.stringify({ edition, width, height, warmMedianMs: warm[Math.floor(warm.length / 2)], samples }));
    }
  }
  }
} finally {
  if (previous) Object.defineProperty(globalThis, "document", previous);
  else delete globalThis.document;
}
