#!/usr/bin/env node
// Offline Area/Polygon optimization; Circle is owned by optimize-circle.mjs.
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
for (const [id, title] of [["area", "Area"], ["polygon", "Area of polygon"]]) {
  const bounds = JSON.parse(await readFile(resolve(import.meta.dirname, `${id}-text-bounds.json`), "utf8"));
  const drawings = JSON.parse(await readFile(resolve(import.meta.dirname, `${id}-drawing-bounds.json`), "utf8"));
  for (const locale of ["en", "ru"]) {
    const name = title + (locale === "ru" ? "-ru" : "");
    const evidence = bounds.languages[locale];
    const drawing = drawings.languages[locale];
    const source = `/home/ignat/code/mightymatica-source-recovery/objects/Movies/${name}/original/${name}.swf`;
    if (evidence.source !== `Movies/${name}.swf` || sha(await readFile(source)) !== evidence.sourceSha256) throw new Error("Source evidence mismatch");
    if (drawing.source !== evidence.source || drawing.sourceSha256 !== evidence.sourceSha256
      || Object.entries(evidence.textBounds).some(([symbol, rect]) => !isDeepStrictEqual(rect, drawing.drawingBounds[symbol]))) throw new Error("Drawing/text evidence mismatch");
    const target = resolve(root, `public/media/measurement/native/${id}/${locale}/timeline.mjs`);
    const original = await readFile(target, "utf8");
    const patched = patchCalculusFilters(original, drawing.drawingBounds, 550, 400);
    if (!patched.groups && !patched.refreshed) { console.log(`${id}/${locale}: already optimized`); continue; }
    const cache = resolve(root, ".cache/measurement-lessons-filter-originals");
    await mkdir(cache, { recursive: true });
    const backup = resolve(cache, `${id}-${locale}-${sha(original)}.mjs`);
    try { await writeFile(backup, original, { flag: "wx" }); }
    catch (error) { if (error.code !== "EEXIST" || sha(await readFile(backup)) !== sha(original)) throw error; }
    const candidate = resolve(cache, `${id}-${locale}-${sha(patched.source)}.candidate.mjs`);
    await writeFile(candidate, patched.source);
    if (spawnSync(process.execPath, ["--check", candidate], { stdio: "inherit" }).status !== 0) throw new Error("Candidate syntax failed");
    const [before, after] = await Promise.all([import(pathToFileURL(backup)), import(pathToFileURL(candidate))]);
    if (!isDeepStrictEqual(before.metadata, after.metadata) || !isDeepStrictEqual(Object.keys(before), Object.keys(after))) throw new Error("Renderer contract changed");
    if (sha(await readFile(target)) !== sha(original)) throw new Error("Concurrent renderer edit");
    await rename(candidate, target);
    console.log(JSON.stringify({ id, locale, groups: patched.groups, refreshed: patched.refreshed, backup, sourceSha256: sha(original), resultSha256: sha(patched.source) }));
  }
}
