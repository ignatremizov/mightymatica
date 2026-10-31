// Offline, source-verified text-filter optimization for motion/fractal chapters.
import { readFile, writeFile, mkdir, rename } from "node:fs/promises";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { createHash } from "node:crypto";
import { spawnSync } from "node:child_process";
import { isDeepStrictEqual } from "node:util";
import { patchCalculusFilters } from "../../../scripts/optimize-calculus-filters.mjs";
import { recoverStaticDrawingBounds } from "../../../scripts/recover-static-drawing-bounds.mjs";
import { parse } from "acorn";

const root = resolve(import.meta.dirname, "../../..");
const sha = value => createHash("sha256").update(value).digest("hex");
const family = process.argv[2];
if (!["motion", "fractals"].includes(family) || !["--recover-bounds", "--recover-drawing-bounds", "--apply"].includes(process.argv[3])) {
  throw new Error("Usage: node src/modules/motion/optimize-painters.mjs motion|fractals --recover-bounds|--recover-drawing-bounds|--apply");
}
const directory = resolve(root, `src/modules/${family}`);
const lessons = JSON.parse(await readFile(resolve(directory, "native-lessons.json"), "utf8"));
const cache = resolve(root, `.cache/${family}-filter-originals`);
await mkdir(cache, { recursive: true });
const boundsFile = resolve(directory, "text-bounds.json");
const sourcePath = source => {
  if (!/^Movies\/[^/]+\.swf$/.test(source)) throw new Error("Unexpected source path");
  const name = source.slice(7, -4);
  return `/home/ignat/code/mightymatica-source-recovery/objects/Movies/${name}/original/${name}.swf`;
};
if (process.argv[3] === "--recover-drawing-bounds") {
  const sources = {};
  for (const variants of Object.values(lessons)) for (const entry of Object.values(variants)) {
    if (sources[entry.source]) continue;
    const input = await readFile(sourcePath(entry.source));
    if (sha(input) !== entry.sourceSha256) throw new Error("Source/lesson hash mismatch");
    sources[entry.source] = {
      source: entry.source, sourceSha256: sha(input),
      drawingBounds: recoverStaticDrawingBounds(input),
    };
  }
  await writeFile(resolve(directory, "drawing-bounds.json"), JSON.stringify({ version: 1, sources }, null, 2) + "\n");
} else if (process.argv[3] === "--recover-bounds") {
  const sources = {};
  for (const variants of Object.values(lessons)) for (const entry of Object.values(variants)) {
    if (sources[entry.source]) continue;
    const source = sourcePath(entry.source);
    const temporary = resolve(cache, "recovered-bounds.json");
    // The recovery CLI accepts EN/RU slots; both deliberately point at the
    // actual chapter source, including Chinese and English-only lessons.
    const result = spawnSync(process.execPath, [resolve(root, "scripts/recover-calculus-text-bounds.mjs"),
      "--en", source, "--ru", source, "--output", temporary], { stdio: "inherit" });
    if (result.status !== 0) throw new Error(`Bounds recovery failed: ${entry.source}`);
    const recovered = JSON.parse(await readFile(temporary, "utf8")).languages.en;
    if (recovered.sourceSha256 !== entry.sourceSha256) throw new Error("Source/lesson hash mismatch");
    sources[entry.source] = recovered;
  }
  await writeFile(boundsFile, JSON.stringify({ version: 1, sources }, null, 2) + "\n");
} else {
  const { sources } = JSON.parse(await readFile(boundsFile, "utf8"));
  let drawings = {};
  try { drawings = JSON.parse(await readFile(resolve(directory, "drawing-bounds.json"), "utf8")).sources; }
  catch (error) { if (error.code !== "ENOENT") throw error; }
  const report = [];
  for (const [id, variants] of Object.entries(lessons)) for (const [locale, entry] of Object.entries(variants)) {
    const evidence = sources[entry.source];
    if (!evidence || evidence.source !== entry.source || evidence.sourceSha256 !== entry.sourceSha256
      || sha(await readFile(sourcePath(entry.source))) !== evidence.sourceSha256) throw new Error("Unverified source bounds");
    for (const chapter of entry.lesson.chapters) {
      const target = resolve(root, "public/media", chapter.module);
      if (!chapter.module.startsWith(`${family}/native/${id}/${locale}/`)) throw new Error("Unexpected chapter path");
      const original = await readFile(target, "utf8");
      const drawing = drawings[entry.source];
      if (drawing && (drawing.source !== entry.source || drawing.sourceSha256 !== evidence.sourceSha256)) throw new Error("Unverified drawing bounds");
      const bounds = { ...drawing?.drawingBounds, ...evidence.textBounds };
      // FFDec NORMAL strokes use max CTM diagonal, not an affine pen.
      // Exclude every stroked shape rather than assuming source ShapeBounds
      // stays conservative under nested rotations or anisotropic transforms.
      function inspect(node, shape = null) {
        if (!node?.type) return;
        if (node.type === "FunctionDeclaration") shape = /^shape\d+$/.test(node.id?.name) ? node.id.name : null;
        if (shape && node.type === "CallExpression" && node.callee?.name === "drawPath"
          && (node.arguments[2]?.value !== false || node.arguments.length > 3)) delete bounds[shape];
        for (const value of Object.values(node)) {
          if (Array.isArray(value)) value.forEach(child => inspect(child, shape));
          else if (value?.type) inspect(value, shape);
        }
      }
      inspect(parse(original, { ecmaVersion: "latest", sourceType: "module" }));
      const patched = patchCalculusFilters(original, bounds, entry.lesson.width, entry.lesson.height);
      const record = { module: chapter.module, groups: patched.groups, refreshed: patched.refreshed };
      report.push(record);
      if (!patched.groups && !patched.refreshed) continue;
      const backup = resolve(cache, `${sha(original)}.mjs`);
      try { await writeFile(backup, original, { flag: "wx" }); }
      catch (error) { if (error.code !== "EEXIST" || sha(await readFile(backup)) !== sha(original)) throw error; }
      const candidate = resolve(cache, `${sha(patched.source)}.candidate.mjs`);
      await writeFile(candidate, patched.source);
      if (spawnSync(process.execPath, ["--check", candidate], { stdio: "inherit" }).status !== 0) throw new Error("Invalid candidate");
      const before = await import(pathToFileURL(backup));
      const after = await import(pathToFileURL(candidate));
      if (!isDeepStrictEqual(before.metadata, after.metadata)
        || !isDeepStrictEqual(Object.keys(before).sort(), Object.keys(after).sort())) throw new Error("Painter contract changed");
      const repeat = patchCalculusFilters(patched.source, bounds, entry.lesson.width, entry.lesson.height);
      if (repeat.source !== patched.source || repeat.groups || repeat.refreshed) throw new Error("Non-idempotent rewrite");
      if (sha(await readFile(target)) !== sha(original)) throw new Error("Concurrent chapter edit");
      await rename(candidate, target);
      console.log(JSON.stringify(record));
    }
  }
  console.log(`${family}: reviewed ${report.length} chapters; ${report.reduce((sum, entry) => sum + entry.groups, 0)} newly cached static-filter groups`);
}
