#!/usr/bin/env node
// Serialized, CPU-only diagnostic of reviewed local drawing modules. Canvas
// vectors/images are inert; filter loops use real, bounded pixel arrays.
// This measures neither browser FPS nor pixel equivalence.
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { performance } from "node:perf_hooks";

const root = resolve(import.meta.dirname, "..");
const identity = () => [1, 0, 0, 1, 0, 0];
const multiply = (a, b) => [
  a[0] * b[0] + a[2] * b[1], a[1] * b[0] + a[3] * b[1],
  a[0] * b[2] + a[2] * b[3], a[1] * b[2] + a[3] * b[3],
  a[0] * b[4] + a[2] * b[5] + a[4], a[1] * b[4] + a[3] * b[5] + a[5],
];

export async function profileNativeDrawing({ module: filename, frames, width = 1520,
  height = 1105, repeat = 3, smokeAll = false }) {
  if (typeof filename !== "string" || !filename.endsWith(".mjs")
    || ![width, height, repeat].every(Number.isInteger)
    || width < 1 || width > 2048 || height < 1 || height > 1600
    || repeat < 1 || repeat > 8
    || !smokeAll && (!Array.isArray(frames) || frames.length < 1 || frames.length > 128
      || !frames.every(frame => Number.isInteger(frame) && frame > 0))) {
    throw new Error("Invalid bounded drawing probe configuration.");
  }
  if (smokeAll && (width > 22 || height > 16)) throw new Error("All-frame execution requires a tiny Canvas.");
  let stats;
  const counts = () => ({ canvases: 0, calls: 0, reads: 0, readPixels: 0, fullCanvasReads: 0 });
  const dimensions = (w, h) => {
    if (!Number.isFinite(w) || !Number.isFinite(h) || w < 0 || h < 0
      || w > 8192 || h > 8192 || w * h > 8_000_000) {
      throw new Error(`Drawing probe Canvas budget exceeded: ${w}×${h}`);
    }
    return [Math.ceil(w), Math.ceil(h)];
  };
  const makeCanvas = (w = 1, h = 1) => {
    stats.canvases++;
    const canvas = { width: w, height: h, style: {} };
    const context = { canvas };
    let matrix = identity();
    const saved = [];
    const noop = () => {};
    for (const key of ["clearRect", "fillRect", "strokeRect", "drawImage", "beginPath",
      "moveTo", "lineTo", "quadraticCurveTo", "bezierCurveTo", "closePath", "fill",
      "stroke", "clip", "putImageData", "arc", "arcTo", "ellipse", "rect", "setLineDash"]) {
      context[key] = () => { stats.calls++; };
    }
    context.save = () => { saved.push([...matrix]); };
    context.restore = () => { matrix = saved.pop() ?? identity(); };
    const transform = (...values) => { matrix = multiply(matrix, values); };
    context.transform = transform;
    context.setTransform = (...values) => {
      matrix = values.length === 1
        ? ["a", "b", "c", "d", "e", "f"].map(key => values[0][key]) : values;
    };
    context.resetTransform = () => { matrix = identity(); };
    context.scale = (x, y) => transform(x, 0, 0, y, 0, 0);
    context.translate = (x, y) => transform(1, 0, 0, 1, x, y);
    context.rotate = angle => transform(Math.cos(angle), Math.sin(angle), -Math.sin(angle), Math.cos(angle), 0, 0);
    context.getTransform = () => Object.fromEntries(
      ["a", "b", "c", "d", "e", "f"].map((key, index) => [key, matrix[index]]));
    context.getImageData = (_x, _y, w, h) => {
      [w, h] = dimensions(w, h);
      const pixels = w * h;
      stats.reads++;
      stats.readPixels += pixels;
      if (w >= width && h >= height) stats.fullCanvasReads++;
      if (stats.readPixels > 64_000_000) throw new Error("Drawing probe per-frame pixel budget exceeded.");
      return { width: w, height: h, data: new Uint8ClampedArray(pixels * 4) };
    };
    context.createImageData = (w, h) => {
      [w, h] = dimensions(w, h);
      return { width: w, height: h, data: new Uint8ClampedArray(w * h * 4) };
    };
    context.createPattern = () => ({ setTransform: noop });
    context.createLinearGradient = () => ({ addColorStop: noop });
    context.createRadialGradient = context.createLinearGradient;
    canvas.getContext = () => context;
    return canvas;
  };
  stats = counts();
  const previous = Object.getOwnPropertyDescriptor(globalThis, "document");
  Object.defineProperty(globalThis, "document", { configurable: true, value: {
    createElement: tag => tag === "canvas" ? makeCanvas() : {
      width: 1, height: 1, decode: async () => {}, removeAttribute() {},
    },
  } });
  let renderer;
  try {
    const path = resolve(root, filename);
    let source = await readFile(path, "utf8");
    let url = pathToFileURL(path).href;
    // The reviewed cube baseline is kept in a hash-named cache directory.
    // Rebase only its unchanged, handwritten adapter import for this diagnostic.
    if (source.includes('from "../cube-stage.mjs"') || source.includes('from"../cube-stage.mjs"')) {
      const adapter = pathToFileURL(resolve(root, "public/media/coloring/native/cube-stage.mjs")).href;
      source = source.replace(/from\s*"(\.\.\/cube-stage\.mjs)"/g, `from ${JSON.stringify(adapter)}`);
      url = `data:text/javascript;base64,${Buffer.from(source).toString("base64")}`;
    }
    const module = await import(url);
    const available = module.metadata?.frames;
    if (!Array.isArray(available) || available.length > 5000) throw new Error("Unknown or excessive reviewed frame inventory.");
    if (smokeAll) frames = available;
    else if (frames.some(frame => !available.includes(frame))) throw new Error("Probe frame outside exported inventory.");
    renderer = await module.createTimeline(makeCanvas(width, height));
    renderer.setPlaybackState?.(true);
    const samples = [];
    const started = performance.now();
    for (const frame of frames) {
      for (let iteration = 0; iteration < (smokeAll ? 1 : repeat); iteration++) {
        stats = counts();
        const start = performance.now();
        renderer.draw(frame, frame - 1);
        if (!smokeAll) samples.push({
          frame, repeat: iteration, milliseconds: +(performance.now() - start).toFixed(3), ...stats,
        });
      }
    }
    const totalMilliseconds = +(performance.now() - started).toFixed(2);
    const warm = samples.filter(sample => sample.repeat > 0).map(sample => sample.milliseconds).sort((a, b) => a - b);
    return {
      module: filename, width, height,
      mode: smokeAll ? "all-frame execution, tiny inert Canvas" : "CPU/filter diagnostic, not browser FPS",
      frameCount: frames.length, totalMilliseconds,
      ...(smokeAll ? {} : {
        warmMedianMilliseconds: warm.length ? warm[Math.floor(warm.length / 2)] : null,
        warmMaxMilliseconds: warm.at(-1) ?? null,
        warmFullCanvasReads: samples.filter(sample => sample.repeat > 0).reduce((n, sample) => n + sample.fullCanvasReads, 0),
        warmReadPixels: samples.filter(sample => sample.repeat > 0).reduce((n, sample) => n + sample.readPixels, 0),
        samples,
      }),
    };
  } finally {
    renderer?.dispose();
    if (previous) Object.defineProperty(globalThis, "document", previous);
    else delete globalThis.document;
  }
}

if (process.argv[1] && pathToFileURL(resolve(process.argv[1])).href === import.meta.url) {
  const options = {};
  for (let i = 2; i < process.argv.length; i++) {
    const arg = process.argv[i];
    if (arg === "--smoke-all") options.smokeAll = true;
    else {
      const value = process.argv[++i];
      if (!value) throw new Error(`Missing value for ${arg}`);
      if (arg === "--module") options.module = value;
      else if (arg === "--frames") options.frames = value.split(",").map(Number);
      else if (arg === "--width") options.width = Number(value);
      else if (arg === "--height") options.height = Number(value);
      else if (arg === "--repeat") options.repeat = Number(value);
      else throw new Error(`Unknown option: ${arg}`);
    }
  }
  try {
    console.log(JSON.stringify(await profileNativeDrawing(options)));
  } catch (error) {
    console.error(String(error?.message ?? error).slice(0, 2000));
    process.exitCode = 1;
  }
}
