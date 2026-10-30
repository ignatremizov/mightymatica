// Bounded rewrite of seven existing painters; never re-export or execute SWF/AS.
import { readFile, writeFile, mkdir } from "node:fs/promises";
import { resolve } from "node:path";
import { createHash } from "node:crypto";
import { spawnSync } from "node:child_process";
import { pathToFileURL } from "node:url";
import { patchCalculusFilters } from "../../../scripts/optimize-calculus-filters.mjs";

const root = resolve(import.meta.dirname, "../../..");
const sha = source => createHash("sha256").update(source).digest("hex");
const report = [];
for (const key of ["BandF", "faces", "hands", "lizards", "stairbig", "stairs", "waterfall"]) {
  const target = resolve(root, `public/media/escher/canvas/Escher-${key}-game.mjs`);
  const bounds = JSON.parse(await readFile(resolve(import.meta.dirname, `text-bounds-${key}.json`), "utf8"));
  const original = await readFile(target, "utf8");
  const patched = patchCalculusFilters(original, bounds.languages.en.textBounds, 600, key === "waterfall" ? 550 : 420);
  if (!patched.groups && !patched.refreshed) continue;
  const cache = resolve(root, ".cache/escher-filter-originals");
  await mkdir(cache, { recursive: true });
  const backup = resolve(cache, `${sha(original)}.mjs`);
  try { await writeFile(backup, original, { flag: "wx" }); }
  catch (error) { if (error.code !== "EEXIST" || sha(await readFile(backup, "utf8")) !== sha(original)) throw error; }
  const candidate = resolve(cache, `${sha(patched.source)}.candidate.mjs`);
  await writeFile(candidate, patched.source);
  const syntax = spawnSync(process.execPath, ["--check", candidate], { stdio: "inherit" });
  if (syntax.status !== 0) throw new Error("Invalid candidate syntax");
  // Import metadata only. createTimeline/drawing/filter code is not invoked.
  const [before, after] = await Promise.all([import(pathToFileURL(backup)), import(pathToFileURL(candidate))]);
  if (JSON.stringify(before.metadata) !== JSON.stringify(after.metadata)
    || JSON.stringify(Object.keys(before)) !== JSON.stringify(Object.keys(after))) throw new Error("Painter contract changed");
  if (sha(await readFile(target, "utf8")) !== sha(original)) throw new Error("Concurrent painter edit");
  await writeFile(target, patched.source);
  report.push({ key, groups: patched.groups, sourceSha256: sha(original), resultSha256: sha(patched.source) });
  console.log(key, patched.groups, "verified source-text filter blocks cropped/cached");
}
if (report.length) {
  await writeFile(resolve(import.meta.dirname, "filter-optimization.json"), JSON.stringify(report, null, 2) + "\n");
}
