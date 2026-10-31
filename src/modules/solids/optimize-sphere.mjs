#!/usr/bin/env node
// Offline optimization of the six existing reviewed Sphere chapter painters.
import { readFile, writeFile, mkdir, rename } from "node:fs/promises";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { createHash } from "node:crypto";
import { spawnSync } from "node:child_process";
import { isDeepStrictEqual } from "node:util";
import { patchCalculusFilters } from "../../../scripts/optimize-calculus-filters.mjs";

if (process.argv.length !== 3 || process.argv[2] !== "--apply") throw new Error("Use --apply");
const root = resolve(import.meta.dirname, "../../..");
const sha = value => createHash("sha256").update(value).digest("hex");
const bounds = JSON.parse(await readFile(resolve(import.meta.dirname, "sphere-text-bounds.json"), "utf8"));
const drawings = JSON.parse(await readFile(resolve(import.meta.dirname, "sphere-drawing-bounds.json"), "utf8"));
for (const locale of ["en", "ru"]) {
  const name = "Volumeofball-proof-examples" + (locale === "ru" ? " -ru" : "");
  const evidence = bounds.languages[locale];
  const drawing = drawings.languages[locale];
  const source = `/home/ignat/code/mightymatica-source-recovery/objects/Movies/${name}/original/${name}.swf`;
  if (evidence.source !== `Movies/${name}.swf` || sha(await readFile(source)) !== evidence.sourceSha256) throw new Error("Source evidence mismatch");
  if (drawing.source !== evidence.source || drawing.sourceSha256 !== evidence.sourceSha256
    || Object.entries(evidence.textBounds).some(([symbol, rect]) => !isDeepStrictEqual(rect, drawing.drawingBounds[symbol]))) throw new Error("Drawing/text evidence mismatch");
  for (const chapter of ["proof", "examples", "ending"]) {
    const target = resolve(root, `public/media/solids/sphere-lesson/${locale}/${chapter}.mjs`);
    const original = await readFile(target, "utf8");
    const patched = patchCalculusFilters(original, drawing.drawingBounds, 550, 400);
    if (!patched.groups && !patched.refreshed) { console.log(`${locale}/${chapter}: already optimized`); continue; }
    const cache = resolve(root, ".cache/solids-filter-originals");
    await mkdir(cache, { recursive: true });
    const backup = resolve(cache, `${locale}-${chapter}-${sha(original)}.mjs`);
    try { await writeFile(backup, original, { flag: "wx" }); }
    catch (error) { if (error.code !== "EEXIST" || sha(await readFile(backup)) !== sha(original)) throw error; }
    const candidate = resolve(cache, `${locale}-${chapter}-${sha(patched.source)}.candidate.mjs`);
    await writeFile(candidate, patched.source);
    if (spawnSync(process.execPath, ["--check", candidate], { stdio: "inherit" }).status !== 0) throw new Error("Candidate syntax failed");
    const [before, after] = await Promise.all([import(pathToFileURL(backup)), import(pathToFileURL(candidate))]);
    if (!isDeepStrictEqual(before.metadata, after.metadata) || !isDeepStrictEqual(Object.keys(before), Object.keys(after))) throw new Error("Renderer contract changed");
    if (sha(await readFile(target)) !== sha(original)) throw new Error("Concurrent renderer edit");
    await rename(candidate, target);
    console.log(JSON.stringify({ locale, chapter, groups: patched.groups, refreshed: patched.refreshed, backup, sourceSha256: sha(original), resultSha256: sha(patched.source) }));
  }
}
