// Source-verified text-only rewrite. Never re-export artwork or execute SWF/AS.
import { readFile, writeFile, mkdir, rename } from "node:fs/promises";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { createHash } from "node:crypto";
import { spawnSync } from "node:child_process";
import { isDeepStrictEqual } from "node:util";
import { patchCalculusFilters } from "../../../scripts/optimize-calculus-filters.mjs";

if (process.argv.length !== 3 || process.argv[2] !== "--apply") {
  throw new Error("Usage: node src/modules/stories/optimize-painters.mjs --apply");
}
const root = resolve(import.meta.dirname, "../../..");
const cache = resolve(root, ".cache/stories-filter-originals");
const sha = value => createHash("sha256").update(value).digest("hex");
for (const name of ["Pinoc-game", "Prosto-game", "Snowhite-game"]) {
  const data = JSON.parse(await readFile(resolve(import.meta.dirname, `text-bounds-${name}.json`), "utf8"));
  const evidence = data.languages.en;
  // Both shell locales deliberately use this same original, not an invented translation.
  if (!isDeepStrictEqual(evidence, data.languages.ru)) throw new Error(`${name}: unexpected locale mapping.`);
  const source = `/home/ignat/code/mightymatica-source-recovery/objects/Movies/${name}/original/${name}.swf`;
  if (evidence.source !== `Movies/${name}.swf` || sha(await readFile(source)) !== evidence.sourceSha256) {
    throw new Error(`${name}: source bounds provenance mismatch.`);
  }
  const target = resolve(root, `public/media/stories/canvas/${name}.mjs`);
  const original = await readFile(target, "utf8");
  const patched = patchCalculusFilters(original, evidence.textBounds, 600, 420);
  const second = patchCalculusFilters(patched.source, evidence.textBounds, 600, 420);
  if (second.source !== patched.source || second.groups || second.refreshed) throw new Error(`${name}: non-idempotent rewrite.`);
  if (!patched.groups && !patched.refreshed) {
    console.log(`${name}: already optimized`);
    continue;
  }
  await mkdir(cache, { recursive: true });
  const backup = resolve(cache, `${name}-${sha(original)}.mjs`);
  try { await writeFile(backup, original, { flag: "wx" }); }
  catch (error) {
    if (error.code !== "EEXIST" || sha(await readFile(backup)) !== sha(original)) throw error;
  }
  const candidate = resolve(cache, `${name}-${sha(patched.source)}.candidate.mjs`);
  await writeFile(candidate, patched.source);
  const syntax = spawnSync(process.execPath, ["--check", candidate], { stdio: "inherit" });
  if (syntax.status !== 0) throw new Error(`${name}: invalid candidate syntax.`);
  // Import factories/metadata only; no renderer is constructed or drawn.
  const [before, after] = await Promise.all([import(pathToFileURL(backup)), import(pathToFileURL(candidate))]);
  if (!isDeepStrictEqual(before.metadata, after.metadata)
    || !isDeepStrictEqual(Object.keys(before), Object.keys(after))) throw new Error(`${name}: renderer contract changed.`);
  if (sha(await readFile(target)) !== sha(original)) throw new Error(`${name}: concurrent painter edit.`);
  await rename(candidate, target);
  console.log(JSON.stringify({ name, groups: patched.groups, refreshed: patched.refreshed,
    sourceSha256: sha(original), resultSha256: sha(patched.source), backup: backup.slice(root.length + 1) }));
}
