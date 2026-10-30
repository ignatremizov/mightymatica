#!/usr/bin/env node
// Offline, syntax-only optimization of already reviewed native drawing modules.
// This does not review or sandbox arbitrary JavaScript.
import { readFile, writeFile, mkdir, readdir, realpath, rename, appendFile } from "node:fs/promises";
import { dirname, resolve, relative, isAbsolute } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { createHash } from "node:crypto";
import { spawn } from "node:child_process";
import assert from "node:assert/strict";
import { tokenizer } from "acorn";
import { minifySync } from "rolldown/utils";

const root = fileURLToPath(new URL("../", import.meta.url));
const media = resolve(root, "public/media");
const provenance = "// Mechanically converted FFDec 26.2.1 drawing code. Review before importing.";
const lifecycle = "// Context lifecycle v2: restore canvas ownership before reuse.";
const optimized = "// Native drawing minified v1: syntax-only Oxc; regenerate then reapply this tool.";
const forbidden = /\beval\s*\(|\bnew\s+Function\b|\b(?:fetch|XMLHttpRequest|WebSocket|setInterval|setTimeout)\s*\(/;

export function assertReviewed(source) {
  if (/^\s*import\s/m.test(source) || source.includes("createCubePlacement")) {
    throw new Error("Adapter-augmented/importing timelines are outside the generated-only schema.");
  }
  if (!source.startsWith(provenance) || !source.includes("Context lifecycle v2")
    || !/\bexport\s+(?:const|\{)[\s\S]*?\bmetadata\b/.test(source)
    || !source.includes("createTimeline")
    || !/Object\.freeze\(\s*(?:\{|Object\.assign\(Object\.create\(null\),\s*\{)/.test(source)) {
    throw new Error("Expected a reviewed native drawing module with metadata, symbol registry, and lifecycle v2.");
  }
  if (forbidden.test(source)) throw new Error("Drawing module fails the existing execution/network/timer gate.");
}

export function minifyReviewed(source, filename = "reviewed.mjs") {
  assertReviewed(source);
  const comments = [];
  const tokens = tokenizer(source, { ecmaVersion: "latest", sourceType: "module",
    onComment: (_block, value, start, end) => {
      const text = source.slice(start, end);
      if (text !== provenance && text !== lifecycle && text !== optimized
        && !/@license|@preserve/.test(value) && !value.startsWith("!")) comments.push(text);
    } });
  while (tokens.getToken().type.label !== "eof") { /* Preserve original comments, not string contents. */ }
  const result = minifySync(filename, source, {
    module: true,
    compress: false,
    mangle: { toplevel: false, keepNames: true },
    codegen: { removeWhitespace: true, legalComments: "inline" },
    sourcemap: false,
  });
  if (result.errors.length) throw new Error(result.errors.map(error => error.message).join("\n"));
  // Keep exact provenance/build markers and ordinary comments. Legal/license
  // comments remain inline through Oxc, not externalized.
  const code = `${provenance}\n${lifecycle}\n${optimized}\n${comments.join("\n")}\n${result.code}\n`;
  assertReviewed(code);
  return code;
}

function inside(parent, child) {
  const part = relative(parent, child);
  return part !== "" && !part.startsWith("..") && !isAbsolute(part);
}

async function reviewedFiles(directory) {
  const files = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const target = resolve(directory, entry.name);
    if (entry.isDirectory()) files.push(...await reviewedFiles(target));
    else if (entry.isFile() && entry.name.endsWith(".mjs")) files.push(target);
  }
  return files.sort();
}

const sha256 = value => createHash("sha256").update(value).digest("hex");

function tracedCanvas(record) {
  const canvas = { width: 1, height: 1, style: {} };
  const context = { canvas };
  const noop = () => {};
  for (const key of ["save", "restore", "scale", "rotate", "translate", "transform",
    "setTransform", "resetTransform", "clearRect", "fillRect", "drawImage",
    "beginPath", "moveTo", "lineTo", "quadraticCurveTo", "bezierCurveTo",
    "closePath", "fill", "stroke", "clip", "putImageData"]) {
    context[key] = (...args) => record(key, args);
  }
  context.getImageData = () => ({ data: new Uint8ClampedArray(4) });
  context.createImageData = context.getImageData;
  context.createPattern = () => ({ setTransform: noop });
  context.createLinearGradient = () => ({ addColorStop: noop });
  context.createRadialGradient = context.createLinearGradient;
  canvas.getContext = () => context;
  return canvas;
}

export async function compareModules(originalPath, candidatePath, draw = false) {
  assertReviewed(await readFile(originalPath, "utf8"));
  assertReviewed(await readFile(candidatePath, "utf8"));
  const original = await import(pathToFileURL(originalPath));
  const candidate = await import(pathToFileURL(candidatePath));
  assert.deepEqual(Object.keys(candidate), Object.keys(original));
  assert.deepEqual(candidate.metadata, original.metadata);
  assert.equal(typeof candidate.createTimeline, "function");
  const result = {
    exports: Object.keys(candidate),
    metadataSha256: sha256(JSON.stringify(candidate.metadata)),
  };
  if (!draw) return result;
  const previous = Object.getOwnPropertyDescriptor(globalThis, "document");
  let record = () => {};
  globalThis.document = { createElement(tag) {
    assert.ok(tag === "canvas" || tag === "img");
    return tag === "canvas" ? tracedCanvas((...args) => record(...args)) : {
      width: 1, height: 1, decode: async () => {}, removeAttribute() {},
    };
  } };
  try {
    const frames = original.metadata.frames;
    const selected = [frames[0], frames[Math.floor(frames.length / 2)], frames.at(-1)];
    const traces = [];
    for (const module of [original, candidate]) {
      const hashes = [];
      let hash;
      let calls = 0;
      record = (name, args) => {
        calls++;
        hash?.update(JSON.stringify([name, args.map(value =>
          typeof value === "object" && value !== null ? "[platform object]" : value)]) + "\n");
      };
      const canvas = tracedCanvas((...args) => record(...args));
      const save = canvas.getContext().save;
      const renderer = await module.createTimeline(canvas);
      try {
        for (const frame of selected) {
          hash = createHash("sha256");
          calls = 0;
          renderer.draw(frame);
          hashes.push({ frame, calls, sha256: hash.digest("hex") });
          hash = undefined;
        }
      } finally { renderer.dispose(); }
      assert.equal(canvas.getContext().save, save);
      renderer.dispose();
      const afterDispose = calls;
      renderer.draw(selected[0]);
      assert.equal(calls, afterDispose);
      traces.push(hashes);
    }
    assert.deepEqual(traces[1], traces[0], `Drawing commands changed: ${originalPath}`);
    result.traces = traces[0];
  } finally {
    if (previous) Object.defineProperty(globalThis, "document", previous);
    else delete globalThis.document;
  }
  return result;
}

async function applyOne(filename, backupRoot, draw) {
  const started = performance.now();
  const source = await readFile(filename, "utf8");
  assertReviewed(source);
  const code = minifyReviewed(source, filename);
  const suffix = relative(media, filename);
  const backup = resolve(backupRoot, "original", suffix);
  const candidate = resolve(backupRoot, "candidate", suffix);
  await mkdir(dirname(backup), { recursive: true });
  await mkdir(dirname(candidate), { recursive: true });
  // Originals and candidates are durable before any public replacement.
  await writeFile(backup, source, { flag: "wx" });
  await writeFile(candidate, code, { flag: "wx" });
  const proof = await compareModules(backup, candidate, draw);
  const entry = {
    input: relative(root, filename), backup: relative(root, backup),
    before: Buffer.byteLength(source), after: Buffer.byteLength(code),
    beforeSha256: sha256(source), afterSha256: sha256(code), ...proof,
  };
  // Record recovery mapping before replacing. In a failed run an entry may
  // describe a prepared but unapplied candidate; compare its hashes to public.
  await appendFile(resolve(backupRoot, "manifest.jsonl"), `${JSON.stringify(entry)}\n`);
  assert.equal(sha256(await readFile(filename)), entry.beforeSha256,
    "Input changed during optimization; refusing to overwrite another writer.");
  await rename(candidate, filename);
  entry.milliseconds = Math.round(performance.now() - started);
  return entry;
}

async function childApply(filename, backupRoot, draw) {
  return new Promise((resolveResult, reject) => {
    const child = spawn(process.execPath,
      [fileURLToPath(import.meta.url), "--apply-one", filename, backupRoot, draw ? "draw" : "metadata"],
      { cwd: root, env: process.env, stdio: ["ignore", "pipe", "inherit"] });
    let output = "";
    child.stdout.on("data", chunk => { output += chunk; });
    child.on("error", reject);
    child.on("close", code => {
      if (code !== 0) reject(new Error(`Drawing optimization failed (${code}): ${filename}`));
      else {
        try { resolveResult(JSON.parse(output)); } catch (error) { reject(error); }
      }
    });
  });
}

export async function run(args) {
  if (args[0] === "--apply-one") {
    const filename = await realpath(resolve(args[1]));
    const backupRoot = await realpath(resolve(args[2]));
    if (!inside(await realpath(media), filename)
      || !inside(resolve(root, ".cache/native-unminified"), backupRoot)) {
      throw new Error("In-place worker paths are outside reviewed media/recovery cache.");
    }
    console.log(JSON.stringify(await applyOne(filename, backupRoot, args[3] === "draw")));
    return;
  }
  if (args.includes("--in-place")) {
    const inputs = args.filter(arg => arg !== "--in-place");
    if (inputs.length !== 1) throw new Error("Usage: --in-place --all | --in-place REVIEWED_MEDIA.mjs");
    const mediaRoot = await realpath(media);
    const files = inputs[0] === "--all" ? await reviewedFiles(mediaRoot) : [await realpath(resolve(inputs[0]))];
    const backupRoot = resolve(root, ".cache/native-unminified", `${new Date().toISOString().replaceAll(":", "-")}-${process.pid}`);
    await mkdir(backupRoot, { recursive: true });
    const sampled = new Set();
    const summary = { files: 0, before: 0, after: 0, sampled: [], skipped: [], backupRoot };
    for (const filename of files) {
      if (!inside(mediaRoot, filename) || !filename.endsWith(".mjs")) {
        throw new Error("Input must be an existing reviewed public/media .mjs file.");
      }
      const source = await readFile(filename, "utf8");
      // Never apply the generated-code optimizer to handwritten companions.
      if (!source.startsWith(provenance) || source.includes(optimized)
        || /^\s*import\s/m.test(source) || source.includes("createCubePlacement")) {
        summary.skipped.push(relative(root, filename));
        continue;
      }
      assertReviewed(source);
      const local = relative(mediaRoot, filename);
      const family = `${local.split("/")[0]}/${local.includes("/audio/") ? "audio" : "drawing"}`;
      const draw = !sampled.has(family);
      const result = await childApply(filename, backupRoot, draw);
      summary.files++;
      summary.before += result.before;
      summary.after += result.after;
      if (draw) {
        sampled.add(family);
        summary.sampled.push({ family, input: result.input, traces: result.traces });
      }
      console.log(JSON.stringify({ progress: summary.files, ...result }));
    }
    await writeFile(resolve(backupRoot, "summary.json"), `${JSON.stringify(summary, null, 2)}\n`, { flag: "wx" });
    console.log(JSON.stringify({ summary }));
    return;
  }
  const [input, output] = args;
  if (args.length !== 2 || !input || !output) {
    throw new Error("Usage: node scripts/minify-native-drawings.mjs REVIEWED_MEDIA.mjs OUTPUT.mjs | --all OUTPUT_DIRECTORY");
  }
  const mediaRoot = await realpath(media);
  const inputs = input === "--all" ? await reviewedFiles(mediaRoot) : [await realpath(resolve(input))];
  for (const filename of inputs) {
    if (!inside(mediaRoot, filename) || !filename.endsWith(".mjs")) {
      throw new Error("Input must be an existing reviewed public/media .mjs file.");
    }
    const source = await readFile(filename, "utf8");
    if (input === "--all" && (!source.startsWith(provenance)
      || /^\s*import\s/m.test(source) || source.includes("createCubePlacement"))) continue;
    const destination = input === "--all"
      ? resolve(output, relative(mediaRoot, filename)) : resolve(output);
    await mkdir(dirname(destination), { recursive: true });
    const destinationParent = await realpath(dirname(destination));
    // Public replacements require the explicit --in-place backup/verification
    // workflow, never the unverified proof-output path.
    const publicRoot = resolve(root, "public");
    if (destinationParent === publicRoot || inside(publicRoot, destinationParent)) {
      throw new Error("Public media writes are disabled; use a temporary output directory.");
    }
    const started = performance.now();
    const code = minifyReviewed(source, filename);
    // Exclusive creation also refuses existing files and symlink destinations.
    await writeFile(destination, code, { flag: "wx" });
    console.log(JSON.stringify({
      input: relative(root, filename), output: destination,
      before: Buffer.byteLength(source), after: Buffer.byteLength(code),
      milliseconds: Math.round(performance.now() - started),
    }));
  }
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  run(process.argv.slice(2)).catch(error => { console.error(error.message); process.exitCode = 1; });
}
