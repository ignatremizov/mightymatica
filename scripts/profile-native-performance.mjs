#!/usr/bin/env node
// One child process at a time; no browser, GPU, audio decoding or server.
import { readFile, writeFile, mkdir } from "node:fs/promises";
import { resolve, relative } from "node:path";
import { createHash } from "node:crypto";
import { spawnSync } from "node:child_process";
import { isDeepStrictEqual } from "node:util";
import { pathToFileURL } from "node:url";

const root = resolve(import.meta.dirname, "..");
const sha = value => createHash("sha256").update(value).digest("hex");
const cases = [
  ["triangles", "Pythagoras EN", "triangles/native/pythagoras/en/chapter-1.mjs", [2194, 2218]],
  ["triangles", "Pythagoras RU", "triangles/native/pythagoras/ru/chapter-1.mjs", [2194, 2391]],
  ["calculus", "Calculus question", "calculus/native/en/chapter-1.mjs", [1568]],
  ["algebra", "Quadratic formula", "algebra/native/quadratic/timeline.mjs", [2421]],
  ["measurement", "Area", "measurement/native/area/en/timeline.mjs", [2361]],
  ["measurement", "Polygon", "measurement/native/polygon/en/timeline.mjs", [705]],
  ["measurement", "Circle", "measurement/native/circle/en/timeline.mjs", [1604]],
  ["solids", "Sphere proof", "solids/sphere-lesson/en/proof.mjs", [1383]],
  ["solids", "Sphere examples", "solids/sphere-lesson/en/examples.mjs", [3991]],
  ["solids", "Sphere ending", "solids/sphere-lesson/en/ending.mjs", [4888]],
  ["coloring", "Cube counting", "coloring/native/cube-en/timeline.mjs", [91]],
  ["coloring", "Plane proof", "coloring/native/Twocolorplaneseg-en/timeline.mjs", [321]],
  ["logic", "Eight wisemen RU", "logic/native/wisemen-eight-ru-story.mjs", [628]],
  ["magic", "1089", "magic/native/subtraction/en/lesson.mjs", [777]],
  ["kids", "Color sorting", "kids/audio/kids-share-color/lesson.mjs", [360]],
  ["kids", "Missing picture ending", "kids/audio/kids-find-proper/lesson.mjs", [2150]],
  ["falling", "Falling Figure completion", "falling/audio/falling-figure/completion.mjs", [170]],
  ["motion", "Earth belt", "motion/native/earth-belt/en/frames-1-580.mjs", [326]],
  ["fractals", "Buffon", "fractals/native/buffon/en/frames-1-986.mjs", [825]],
  ["fractals", "Carpet", "fractals/native/carpet/en/frames-1-1144.mjs", [742]],
  ["reasoning", "Tram question", "reasoning/native/tram-en.mjs", [904]],
  ["reasoning", "Hunter question", "reasoning/native/hunter-en.mjs", [941]],
  ["reasoning", "Cutting paradox", "reasoning/native/paradox-en.mjs", [3176]],
  ["dissections", "Banknotes RU", "dissections/bills-ru.mjs", [576]],
  ["stories", "Snow White completion", "stories/canvas/Snowhite-game.mjs", [185]],
  ["escher", "Faces completion", "escher/canvas/Escher-faces-game.mjs", [181]],
];
const args = process.argv.slice(2);
if (args.some(arg => arg !== "--only" && !cases.some(test => test[0] === arg))
  || args.length && (args.length !== 2 || args[0] !== "--only")) {
  throw new Error("Usage: node scripts/profile-native-performance.mjs [--only family]");
}
const selected = args.length ? cases.filter(test => test[0] === args[1]) : cases;
const cache = resolve(root, ".cache/native-performance-baselines");
await mkdir(cache, { recursive: true });
const git = parameters => {
  const result = spawnSync("git", parameters, { cwd: root, maxBuffer: 96 * 1024 * 1024 });
  if (result.status !== 0) throw new Error(`git ${parameters[0]} failed: ${result.stderr}`);
  return result.stdout;
};
const head = git(["rev-parse", "HEAD"]).toString().trim();
const probe = (module, frames, width = 1520, height = 1105) => {
  const result = spawnSync(process.execPath, [
    resolve(root, "scripts/profile-native-drawing.mjs"), "--module", module,
    "--frames", frames.join(","), "--repeat", "3", "--width", String(width), "--height", String(height),
  ], { cwd: root, encoding: "utf8", timeout: 30000, maxBuffer: 1024 * 1024 });
  if (result.status !== 0) throw new Error(`Probe failed for ${module}: ${result.stderr || result.error}`);
  return JSON.parse(result.stdout);
};
const suffix = args.length ? `-${args[1]}` : "";
const json = resolve(root, `docs/reviews/native-performance${suffix}.json`);
const probeSha256 = sha(await readFile(resolve(root, "scripts/profile-native-drawing.mjs")));
let saved;
try { saved = JSON.parse(await readFile(json, "utf8")); }
catch (error) { if (error.code !== "ENOENT") throw error; }
const report = {
  version: 1, baselineCommit: head,
  probeSha256, complete: false,
  method: "Serialized actual drawing/filter JavaScript, real transparent pixel arrays and inert Canvas vector/image boundaries. Not browser FPS, audio or pixel fidelity.",
  width: 1520, height: 1105, samples: [],
};
for (const [family, label, module, frames] of selected) {
  const filename = `public/media/${module}`;
  const original = git(["show", `HEAD:${filename}`]);
  const beforeSha256 = sha(original);
  const before = resolve(cache, `${beforeSha256}.mjs`);
  try { await writeFile(before, original, { flag: "wx" }); }
  catch (error) {
    if (error.code !== "EEXIST" || sha(await readFile(before)) !== beforeSha256) throw error;
  }
  const current = await readFile(resolve(root, filename));
  const afterSha256 = sha(current);
  const previous = saved?.baselineCommit === head && saved?.probeSha256 === probeSha256
    ? saved.samples.find(sample => sample.module === module && sample.beforeSha256 === beforeSha256
      && sample.afterSha256 === afterSha256 && isDeepStrictEqual(sample.frames, frames)) : undefined;
  if (previous) {
    report.samples.push(previous);
    console.log(`${label}: reused verified before/after diagnostic (input hashes unchanged)`);
    await writeFile(json, JSON.stringify(report, null, 2) + "\n");
    continue;
  }
  // Baselines are exact HEAD bytes, not remembered or reconstructed templates.
  let measured;
  try {
    measured = { before: probe(relative(root, before), frames), after: probe(filename, frames) };
  } catch (error) {
    if (!String(error.message).includes("per-frame pixel budget exceeded")) throw error;
    // Keep the fixed per-frame pixel budget. A particularly dense original is
    // compared at authored density on BOTH sides, not allowed unlimited work.
    measured = { sourceDensityFallback: true,
      before: probe(relative(root, before), frames, 550, 400),
      after: probe(filename, frames, 550, 400) };
  }
  const result = { family, label, module, frames, beforeSha256, afterSha256, ...measured };
  if (sha(await readFile(resolve(root, filename))) !== afterSha256) throw new Error("Painter changed during measurement.");
  if (beforeSha256 === afterSha256) {
    const imported = await import(pathToFileURL(resolve(root, filename)));
    if (!isDeepStrictEqual(imported.metadata.frames.filter(frame => frames.includes(frame)), frames)) {
      throw new Error("Invalid unchanged renderer sample.");
    }
  }
  report.samples.push(result);
  await writeFile(json, JSON.stringify(report, null, 2) + "\n");
  console.log(`${label}: ${result.before.warmMedianMilliseconds} → ${result.after.warmMedianMilliseconds} ms; `
    + `warm full-stage reads ${result.before.warmFullCanvasReads} → ${result.after.warmFullCanvasReads}`);
}
report.complete = true;
await writeFile(json, JSON.stringify(report, null, 2) + "\n");
const rows = report.samples.map(sample => `| ${sample.label} | ${sample.before.warmMedianMilliseconds} | `
  + `${sample.after.warmMedianMilliseconds} | ${sample.before.warmFullCanvasReads} → ${sample.after.warmFullCanvasReads} |`
  + ` ${sample.after.width} × ${sample.after.height} |`);
await writeFile(resolve(root, `docs/reviews/native-performance${suffix}.md`), [
  "# Native rendering diagnostic", "",
  report.method, "",
  `Baseline: \`${head}\`. Backing store: 1520 × 1105 unless the original exceeds the fixed pixel budget; `
    + "then BOTH versions use 550 × 400. Three draws of each listed source frame; "
    + "warm values exclude each frame's first draw. Each painter runs in a fresh child process. "
    + "Wall-clock/JIT/GC variance applies; these timings do not establish browser frame rates.", "",
  "| Sample | Before warm median (ms) | After warm median (ms) | Full-stage reads, before → after | Backing store |",
  "| --- | ---: | ---: | ---: | --- |", ...rows, "",
  "The JSON retains every cold and warm draw, exact input hashes and active source frames. "
    + "Transparent pixel arrays exercise the original filter loops, not glyph rasterization or image decoding. "
    + "Books/films use native images/video; silent SVG/CSS tools and spatial geometry were inspected separately. "
    + "Authored shadows and remaining animated/non-text effects are not removed to improve this diagnostic.", "",
].join("\n"));
console.log(`Saved ${relative(root, json)}`);
