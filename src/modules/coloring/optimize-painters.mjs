// Verified static-text filters only; preserves the handwritten cube adapter.
import { readFile, writeFile, mkdir } from "node:fs/promises";
import { resolve } from "node:path";
import { createHash } from "node:crypto";
import { spawnSync } from "node:child_process";
import { pathToFileURL } from "node:url";
import { isDeepStrictEqual } from "node:util";
import { patchCalculusFilters } from "../../../scripts/optimize-calculus-filters.mjs";

const root = resolve(import.meta.dirname, "../../..");
const recovery = "/home/ignat/code/mightymatica-source-recovery/objects/Movies";
const sha = value => createHash("sha256").update(value).digest("hex");
const families = [
  ["cube", "Cube-colorproblem", "Cube-colorproblem-ru", "cube-en", "cube-ru"],
  ["two-plane", "Twocolorplane-eng", "Twocolorplane", "Twocolorplane-eng", "Twocolorplane"],
  ["segment", "Twocolorplaneseg-en", "Twocolorplaneseg-ru", "Twocolorplaneseg-en", "Twocolorplaneseg-ru"],
  ["equilateral", "Twocoloreqtri-eng", "Twocoloreqtri-ru", "Twocoloreqtri-eng", "Twocoloreqtri-ru"],
  ["three-plane", "Threecolorplane-eng", "Threecolorplane-ru", "Threecolorplane-eng", "Threecolorplane-ru"],
];
const report = [];
for (const [key, en, ru, enPainter, ruPainter] of families) {
  const boundsPath = resolve(import.meta.dirname, `text-bounds-${key}.json`);
  if (process.argv.includes("--recover-bounds")) {
    const source = object => `${recovery}/${object}/original/${object}.swf`;
    const recovered = spawnSync(process.execPath, [
      resolve(root, "scripts/recover-calculus-text-bounds.mjs"),
      "--en", source(en), "--ru", source(ru), "--output", boundsPath,
    ], { stdio: "inherit" });
    if (recovered.status !== 0) throw new Error(`Bounds recovery failed: ${key}`);
  }
  const bounds = JSON.parse(await readFile(boundsPath, "utf8"));
  for (const [language, painter] of [["en", enPainter], ["ru", ruPainter]]) {
    const target = resolve(root, `public/media/coloring/native/${painter}/timeline.mjs`);
    const original = await readFile(target, "utf8");
    const before = await import(pathToFileURL(target));
    const patched = patchCalculusFilters(original, bounds.languages[language].textBounds, before.metadata.width, before.metadata.height);
    if (!patched.groups && !patched.refreshed) continue;
    const cache = resolve(root, ".cache/coloring-filter-originals");
    await mkdir(cache, { recursive: true });
    const backup = resolve(cache, `${sha(original)}.mjs`);
    try { await writeFile(backup, original, { flag: "wx" }); }
    catch (error) {
      if (error.code !== "EEXIST" || sha(await readFile(backup)) !== sha(original)) throw error;
    }
    // Preserve relative cube-stage imports for metadata-only candidate loading.
    const adapter = resolve(root, "public/media/coloring/native/cube-stage.mjs");
    const candidateSource = patched.source.replace('from "../cube-stage.mjs"', `from ${JSON.stringify(pathToFileURL(adapter).href)}`);
    const candidate = resolve(cache, `${sha(patched.source)}.candidate.mjs`);
    await writeFile(candidate, candidateSource);
    if (spawnSync(process.execPath, ["--check", candidate], { stdio: "inherit" }).status !== 0) throw new Error("Invalid candidate");
    const after = await import(pathToFileURL(candidate));
    if (!isDeepStrictEqual(before.metadata, after.metadata)
      || !isDeepStrictEqual(Object.keys(before).sort(), Object.keys(after).sort())) throw new Error("Painter contract changed");
    if (sha(await readFile(target)) !== sha(original)) throw new Error("Concurrent painter edit");
    await writeFile(target, patched.source);
    report.push({ key, language, painter, groups: patched.groups, sourceSha256: sha(original), resultSha256: sha(patched.source) });
    console.log(painter, patched.groups, "verified text-filter groups cached");
  }
}
if (report.length) await writeFile(resolve(import.meta.dirname, "filter-optimization.json"), JSON.stringify(report, null, 2) + "\n");
