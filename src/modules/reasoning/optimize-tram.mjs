// Source-verified, guarded application of Tram's animated character shadows.
import { readFile, writeFile, mkdir, rename } from "node:fs/promises";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { createHash } from "node:crypto";
import { spawnSync } from "node:child_process";
import { isDeepStrictEqual } from "node:util";
import { patchTramAnimation } from "../../../scripts/tram-animated-filters.mjs";
import { recoverStaticDrawingBounds } from "../../../scripts/recover-static-drawing-bounds.mjs";

if (!["--apply", "--check"].includes(process.argv[2])) {
  throw new Error("Usage: node src/modules/reasoning/optimize-tram.mjs --apply|--check");
}
const root = resolve(import.meta.dirname, "../../..");
const hash = bytes => createHash("sha256").update(bytes).digest("hex");
const entries = JSON.parse(await readFile(resolve(import.meta.dirname, "native-timelines.json"), "utf8")).tram;
const cache = resolve(root, ".cache/tram-animated-originals");
const reportFile = resolve(import.meta.dirname, "tram-animation-optimization.json");
let previous = {};
try { previous = JSON.parse(await readFile(reportFile, "utf8")).languages; }
catch (error) { if (error.code !== "ENOENT") throw error; }
const languages = {};
for (const [locale, name] of [["en", "Tram"], ["ru", "Tram-ru"]]) {
  const entry = entries[locale], sourceName = `Movies/${name}.swf`;
  const input = await readFile(`/home/ignat/code/mightymatica-source-recovery/objects/Movies/${name}/original/${name}.swf`);
  if (entry.source !== sourceName || hash(input) !== entry.sha256
    || entry.module !== `reasoning/native/tram-${locale}.mjs`) throw new Error("Source artwork hash/path mismatch.");
  const bounds = recoverStaticDrawingBounds(input);
  const target = resolve(root, "public/media", entry.module), original = await readFile(target, "utf8");
  const patched = patchTramAnimation(original, bounds, locale);
  const record = { source: sourceName, sourceSha256: entry.sha256, module: entry.module,
    beforeSha256: hash(original), afterSha256: hash(patched.source),
    groups: patched.groups, bounds: patched.bounds, poseBounds: patched.poseBounds, symbols: patched.symbols };
  if (!patched.groups) {
    languages[locale] = previous[locale]?.afterSha256 === record.afterSha256 ? previous[locale] : record;
    console.log(`${locale}: already optimized; all five original character sequences revalidated.`);
    continue;
  }
  if (patched.groups !== 2742) throw new Error(`Expected 2742 source shadow placements, got ${patched.groups}.`);
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
    || !isDeepStrictEqual(Object.keys(before).sort(), Object.keys(after).sort())) throw new Error("Lesson contract changed.");
  if (patchTramAnimation(patched.source, bounds, locale).source !== patched.source) throw new Error("Non-idempotent animated-shadow patch.");
  if (hash(await readFile(target)) !== record.beforeSha256) throw new Error("Concurrent painter edit.");
  await rename(candidate, target);
  languages[locale] = record;
  console.log(`${locale}: optimized ${patched.groups} original character shadows.`);
}
if (process.argv[2] === "--apply") {
  await writeFile(reportFile, JSON.stringify({ version: 1, policy: "bounded source-density animation, original clocks",
    maxEntries: 4, maxPixels: 262144, languages }, null, 2) + "\n");
}
