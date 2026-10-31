#!/usr/bin/env node
// Drawing-only rewrite; both UI locales use the same English source lesson.
import { readFile, writeFile, mkdir, rename } from "node:fs/promises";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { createHash } from "node:crypto";
import { spawnSync } from "node:child_process";
import { isDeepStrictEqual } from "node:util";
import { patchCalculusFilters } from "../../../scripts/optimize-calculus-filters.mjs";

if (process.argv.length !== 3 || process.argv[2] !== "--apply") {
  throw new Error("Usage: node src/modules/algebra/optimize-quadratic.mjs --apply");
}
const root = resolve(import.meta.dirname, "../../..");
const sha = value => createHash("sha256").update(value).digest("hex");
const bounds = JSON.parse(await readFile(resolve(import.meta.dirname, "quadratic-text-bounds.json"), "utf8"));
const source = "/home/ignat/code/mightymatica-source-recovery/objects/Movies/Quadratic eq/original/Quadratic eq.swf";
const evidence = bounds.languages.en;
if (!isDeepStrictEqual(evidence, bounds.languages.ru)
  || evidence.source !== "Movies/Quadratic eq.swf"
  || sha(await readFile(source)) !== evidence.sourceSha256) {
  throw new Error("Quadratic text bounds do not match the shared preserved English source.");
}
const target = resolve(root, "public/media/algebra/native/quadratic/timeline.mjs");
const original = await readFile(target, "utf8");
const patched = patchCalculusFilters(original, evidence.textBounds, 550, 400);
if (!patched.groups && !patched.refreshed) {
  console.log("Quadratic: already optimized");
} else {
  const cache = resolve(root, ".cache/algebra-filter-originals");
  await mkdir(cache, { recursive: true });
  const backup = resolve(cache, `${sha(original)}.mjs`);
  try { await writeFile(backup, original, { flag: "wx" }); }
  catch (error) {
    if (error.code !== "EEXIST" || sha(await readFile(backup)) !== sha(original)) throw error;
  }
  const candidate = resolve(cache, `${sha(patched.source)}.candidate.mjs`);
  await writeFile(candidate, patched.source);
  if (spawnSync(process.execPath, ["--check", candidate], { stdio: "inherit" }).status !== 0) {
    throw new Error("Quadratic candidate syntax failed.");
  }
  // Import declarations only; no factory, drawing, or recovered script executes.
  const [before, after] = await Promise.all([import(pathToFileURL(backup)), import(pathToFileURL(candidate))]);
  if (!isDeepStrictEqual(before.metadata, after.metadata)
    || !isDeepStrictEqual(Object.keys(before), Object.keys(after))) {
    throw new Error("Quadratic renderer contract changed.");
  }
  const repeated = patchCalculusFilters(patched.source, evidence.textBounds, 550, 400);
  if (repeated.source !== patched.source || repeated.groups || repeated.refreshed) {
    throw new Error("Quadratic optimization is not idempotent.");
  }
  if (sha(await readFile(target)) !== sha(original)) throw new Error("Concurrent quadratic painter edit.");
  await rename(candidate, target);
  console.log(JSON.stringify({ groups: patched.groups, refreshed: patched.refreshed,
    backup: backup.slice(root.length + 1), sourceSha256: sha(original), resultSha256: sha(patched.source) }));
}
