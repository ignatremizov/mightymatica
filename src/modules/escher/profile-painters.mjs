// No browser/GPU: real reviewed filter JS and pixel arrays, inert drawing I/O.
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { performance } from "node:perf_hooks";

const root = resolve(import.meta.dirname, "../../..");
const changes = JSON.parse(await readFile(resolve(import.meta.dirname, "filter-optimization.json"), "utf8"));
let reads = 0, pixels = 0, fullReads = 0;
const identity = () => [1, 0, 0, 1, 0, 0];
function multiply(a, b) {
  return [a[0] * b[0] + a[2] * b[1], a[1] * b[0] + a[3] * b[1],
    a[0] * b[2] + a[2] * b[3], a[1] * b[2] + a[3] * b[3],
    a[0] * b[4] + a[2] * b[5] + a[4], a[1] * b[4] + a[3] * b[5] + a[5]];
}
function canvas(width = 1, height = 1) {
  const target = { width, height, style: {} };
  const context = { canvas: target };
  let matrix = identity();
  const stack = [];
  const noop = () => {};
  for (const name of ["clearRect", "fillRect", "drawImage", "beginPath", "moveTo", "lineTo",
    "quadraticCurveTo", "bezierCurveTo", "closePath", "fill", "stroke", "clip", "putImageData"]) context[name] = noop;
  context.save = () => stack.push([...matrix]);
  context.restore = () => { matrix = stack.pop() ?? identity(); };
  context.transform = (...values) => { matrix = multiply(matrix, values); };
  context.setTransform = (...values) => { matrix = values; };
  context.resetTransform = () => { matrix = identity(); };
  context.scale = (x, y) => context.transform(x, 0, 0, y, 0, 0);
  context.translate = (x, y) => context.transform(1, 0, 0, 1, x, y);
  context.rotate = angle => context.transform(Math.cos(angle), Math.sin(angle), -Math.sin(angle), Math.cos(angle), 0, 0);
  context.getTransform = () => Object.fromEntries(["a", "b", "c", "d", "e", "f"].map((name, i) => [name, matrix[i]]));
  context.getImageData = (_x, _y, w, h) => {
    const count = Math.max(1, Math.ceil(w) * Math.ceil(h));
    reads++; pixels += count;
    if (w >= 600 && h >= 420) fullReads++;
    if (pixels > 64_000_000) throw new Error("Per-frame diagnostic pixel budget exceeded");
    return { width: w, height: h, data: new Uint8ClampedArray(count * 4) };
  };
  context.createImageData = (w, h) => ({ width: w, height: h, data: new Uint8ClampedArray(Math.max(1, w * h) * 4) });
  context.createPattern = () => ({ setTransform: noop });
  context.createLinearGradient = () => ({ addColorStop: noop });
  context.createRadialGradient = context.createLinearGradient;
  target.getContext = () => context;
  return target;
}
const previous = Object.getOwnPropertyDescriptor(globalThis, "document");
Object.defineProperty(globalThis, "document", { configurable: true, value: {
  createElement: name => name === "canvas" ? canvas() : { width: 1, height: 1, decode: async () => {}, removeAttribute() {} },
} });
try {
  for (const { key, sourceSha256 } of changes) for (const edition of ["before", "after"]) {
    const path = edition === "before"
      ? `.cache/escher-filter-originals/${sourceSha256}.mjs`
      : `public/media/escher/canvas/Escher-${key}-game.mjs`;
    const module = await import(pathToFileURL(resolve(root, path)));
    reads = pixels = fullReads = 0;
    const renderer = await module.createTimeline(canvas(module.metadata.width, module.metadata.height));
    const samples = [];
    try {
      for (const frame of [157, 181, 182, 183]) {
        reads = pixels = fullReads = 0;
        const start = performance.now();
        renderer.draw(frame, frame - 1);
        samples.push({ frame, ms: +(performance.now() - start).toFixed(2), reads, pixels, fullReads });
      }
    } finally { renderer.dispose(); }
    console.log(JSON.stringify({ key, edition, mode: "inert vector/image I/O; real pixel/filter arithmetic; not browser FPS", samples }));
  }
} finally {
  if (previous) Object.defineProperty(globalThis, "document", previous);
  else delete globalThis.document;
}
