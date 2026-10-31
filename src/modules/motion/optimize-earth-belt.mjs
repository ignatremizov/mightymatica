// Repeatable, source-verified application of the original cat-shadow fix.
import { readFile, writeFile, mkdir, rename } from "node:fs/promises";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { createHash } from "node:crypto";
import { spawnSync } from "node:child_process";
import { isDeepStrictEqual } from "node:util";
import { patchEarthBeltAnimation } from "../../../scripts/earth-belt-animated-filters.mjs";
import { recoverStaticDrawingBounds } from "../../../scripts/recover-static-drawing-bounds.mjs";

if (!["--apply", "--check"].includes(process.argv[2])) {
  throw new Error("Usage: node src/modules/motion/optimize-earth-belt.mjs --apply|--check");
}
const root = resolve(import.meta.dirname, "../../..");
const hash = source => createHash("sha256").update(source).digest("hex");
const lessons = JSON.parse(await readFile(resolve(import.meta.dirname, "native-lessons.json"), "utf8"))["earth-belt"];
const evidence = JSON.parse(await readFile(resolve(import.meta.dirname, "drawing-bounds.json"), "utf8")).sources;
const cache = resolve(root, ".cache/earth-belt-animated-originals");
const reportFile = resolve(import.meta.dirname, "earth-belt-animation-optimization.json");
let previous = {};
try { previous = JSON.parse(await readFile(reportFile, "utf8")).languages; }
catch (error) { if (error.code !== "ENOENT") throw error; }
const languages = {};
for (const [locale, name] of [["en", "Earthandbelt"], ["ru", "Earthandbelt-ru"]]) {
  const entry = lessons[locale], sourceName = `Movies/${name}.swf`;
  const input = await readFile(`/home/ignat/code/mightymatica-source-recovery/objects/Movies/${name}/original/${name}.swf`);
  if (entry.source !== sourceName || hash(input) !== entry.sourceSha256
    || evidence[sourceName]?.sourceSha256 !== entry.sourceSha256) throw new Error("Source artwork hash mismatch.");
  const bounds = recoverStaticDrawingBounds(input);
  if (!isDeepStrictEqual(bounds, evidence[sourceName].drawingBounds)) throw new Error("Source bounds changed.");
  const module = `motion/native/earth-belt/${locale}/frames-1-580.mjs`;
  const target = resolve(root, "public/media", module), original = await readFile(target, "utf8");
  const patched = patchEarthBeltAnimation(original, bounds);
  const record = { source: sourceName, sourceSha256: entry.sourceSha256, module,
    beforeSha256: hash(original), afterSha256: hash(patched.source),
    groups: patched.groups, bounds: patched.bounds, poseBounds: patched.poseBounds, symbols: patched.symbols };
  if (!patched.groups) {
    languages[locale] = previous[locale]?.afterSha256 === record.afterSha256 ? previous[locale] : record;
    console.log(`${locale}: already optimized; all 49 character poses revalidated.`);
    continue;
  }
  if (patched.groups !== 180) throw new Error(`Expected 180 original shadow placements, got ${patched.groups}.`);
  if (process.argv[2] === "--check") {
    console.log(`${locale}: ${patched.groups} original character shadows need optimization.`);
    process.exitCode = 1;
    continue;
  }
  await mkdir(cache, { recursive: true });
  const backup = resolve(cache, `${record.beforeSha256}.mjs`);
  try { await writeFile(backup, original, { flag: "wx" }); }
  catch (error) { if (error.code !== "EEXIST" || hash(await readFile(backup)) !== record.beforeSha256) throw error; }
  const candidate = resolve(cache, `${record.afterSha256}.candidate.mjs`);
  await writeFile(candidate, patched.source);
  if (spawnSync(process.execPath, ["--check", candidate], { stdio: "inherit" }).status !== 0) throw new Error("Invalid patched renderer.");
  const before = await import(pathToFileURL(backup)), after = await import(pathToFileURL(candidate));
  if (!isDeepStrictEqual(before.metadata, after.metadata)
    || !isDeepStrictEqual(Object.keys(before).sort(), Object.keys(after).sort())) throw new Error("Native lesson contract changed.");
  if (patchEarthBeltAnimation(patched.source, bounds).source !== patched.source) throw new Error("Non-idempotent animated-shadow patch.");
  if (hash(await readFile(target)) !== record.beforeSha256) throw new Error("Concurrent painter edit.");
  await rename(candidate, target);
  languages[locale] = record;
  console.log(`${locale}: optimized ${patched.groups} original character shadows; 49 poses preserved.`);
}
if (process.argv[2] === "--apply") {
  await writeFile(reportFile, JSON.stringify({ version: 1, policy: "bounded source-density animation, original clock",
    maxEntries: 4, maxPixels: 262144, languages }, null, 2) + "\n");
}
