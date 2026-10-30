// Software-only diagnostic, not browser FPS, image parity or GPU verification.
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { performance } from "node:perf_hooks";

const root = resolve(import.meta.dirname, "../../..");
let stats;
const identity = () => [1, 0, 0, 1, 0, 0];
function multiply(a, b) {
  return [a[0]*b[0]+a[2]*b[1], a[1]*b[0]+a[3]*b[1], a[0]*b[2]+a[2]*b[3], a[1]*b[2]+a[3]*b[3],
    a[0]*b[4]+a[2]*b[5]+a[4], a[1]*b[4]+a[3]*b[5]+a[5]];
}
function canvas(width = 1, height = 1) {
  const result = { width, height, style: {} };
  const context = { canvas: result };
  let matrix = identity();
  const saved = [], noop = () => {};
  for (const key of ["clearRect", "fillRect", "drawImage", "beginPath", "moveTo", "lineTo", "quadraticCurveTo",
    "bezierCurveTo", "closePath", "fill", "stroke", "clip", "putImageData"]) context[key] = noop;
  context.save = () => saved.push([...matrix]);
  context.restore = () => { matrix = saved.pop() ?? identity(); };
  context.transform = (...values) => { matrix = multiply(matrix, values); };
  context.setTransform = (...values) => { matrix = values; };
  context.resetTransform = () => { matrix = identity(); };
  context.scale = (x, y) => context.transform(x, 0, 0, y, 0, 0);
  context.translate = (x, y) => context.transform(1, 0, 0, 1, x, y);
  context.rotate = angle => context.transform(Math.cos(angle), Math.sin(angle), -Math.sin(angle), Math.cos(angle), 0, 0);
  context.getTransform = () => Object.fromEntries(["a", "b", "c", "d", "e", "f"].map((key, i) => [key, matrix[i]]));
  context.getImageData = (_x, _y, w, h) => {
    const pixels = Math.max(1, Math.ceil(w)*Math.ceil(h));
    stats.readPixels += pixels; stats.reads++;
    if (w >= 550 && h >= 400) stats.fullCanvasReads++;
    if (stats.readPixels > 64_000_000) throw new Error("Diagnostic per-frame pixel budget exceeded.");
    return { width: w, height: h, data: new Uint8ClampedArray(pixels*4) };
  };
  context.createImageData = (w, h) => ({ width: w, height: h, data: new Uint8ClampedArray(Math.max(1, w*h)*4) });
  context.createPattern = () => ({ setTransform: noop });
  context.createLinearGradient = () => ({ addColorStop: noop });
  context.createRadialGradient = context.createLinearGradient;
  result.getContext = () => context;
  return result;
}
const previous = Object.getOwnPropertyDescriptor(globalThis, "document");
Object.defineProperty(globalThis, "document", { configurable: true, value: {
  createElement: tag => tag === "canvas" ? canvas() : { width: 1, height: 1, decode: async () => {}, removeAttribute() {} },
} });
try {
  for (const locale of ["en", "ru"]) for (const edition of ["before", "after"]) {
    const filename = edition === "before" ? `.cache/triangle-filter-originals/${locale}/chapter-1.mjs`
      : `public/media/triangles/native/altitudes/${locale}/chapter-1.mjs`;
    const module = await import(pathToFileURL(resolve(root, filename)));
    stats = { reads: 0, readPixels: 0, fullCanvasReads: 0 };
    const renderer = await module.createTimeline(canvas(1520, 1105));
    const samples = [];
    try {
      for (const frame of [790, 791, 792, 793, 794, 795, 796, 804]) {
        stats = { reads: 0, readPixels: 0, fullCanvasReads: 0 };
        const start = performance.now();
        renderer.draw(frame, frame-1);
        samples.push({ frame, milliseconds: +(performance.now()-start).toFixed(2), ...stats });
      }
    } finally { renderer.dispose(); }
    const warm = samples.slice(1);
    console.log(JSON.stringify({ locale, edition, width: 1520, height: 1105, cold: samples[0],
      warmAverageMs: +(warm.reduce((sum, sample) => sum+sample.milliseconds, 0)/warm.length).toFixed(2),
      warmFullCanvasReads: warm.reduce((sum, sample) => sum+sample.fullCanvasReads, 0) }));
  }
} finally {
  if (previous) Object.defineProperty(globalThis, "document", previous);
  else delete globalThis.document;
}
