#!/usr/bin/env node
// Reuse the reviewed text-only rewrite; never execute preserved SWF or AS.
import { readFile, writeFile, mkdir, rename } from "node:fs/promises";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { createHash } from "node:crypto";
import { spawnSync } from "node:child_process";
import { patchCalculusFilters } from "../../../scripts/optimize-calculus-filters.mjs";

if (process.argv.length !== 3 || process.argv[2] !== "--apply") {
  throw new Error("Usage: node src/modules/measurement/optimize-circle.mjs --apply");
}
const root = resolve(import.meta.dirname, "../../..");
const data = JSON.parse(await readFile(resolve(import.meta.dirname, "circle-text-bounds.json"), "utf8"));
const cache = resolve(root, ".cache/measurement-filter-originals");
const sha = value => createHash("sha256").update(value).digest("hex");
for (const locale of ["en", "ru"]) {
  const name = locale === "en" ? "Circle" : "Circle-ru";
  const evidence = data.languages[locale];
  const source = `/home/ignat/code/mightymatica-source-recovery/objects/Movies/${name}/original/${name}.swf`;
  if (evidence.source !== `Movies/${name}.swf` || sha(await readFile(source)) !== evidence.sourceSha256) {
    throw new Error(`Circle ${locale}: text bounds do not match the preserved source.`);
  }
  const target = resolve(root, `public/media/measurement/native/circle/${locale}/timeline.mjs`);
  const original = await readFile(target, "utf8");
  const patched = patchCalculusFilters(original, evidence.textBounds, 550, 400);
  if (!patched.groups && !patched.refreshed) {
    console.log(`Circle ${locale}: already optimized`);
    continue;
  }
  await mkdir(cache, { recursive: true });
  const backup = resolve(cache, `${locale}-${sha(original)}.mjs`);
  try { await writeFile(backup, original, { flag: "wx" }); }
  catch (error) {
    if (error.code !== "EEXIST" || sha(await readFile(backup)) !== sha(original)) throw error;
  }
  const candidate = resolve(cache, `${locale}-${sha(patched.source)}.candidate.mjs`);
  await writeFile(candidate, patched.source);
  const syntax = spawnSync(process.execPath, ["--check", candidate], { stdio: "inherit" });
  if (syntax.status !== 0) throw new Error(`Circle ${locale}: candidate syntax failed.`);
  // Import only metadata/factories. No drawing or original scripts run here.
  const [before, after] = await Promise.all([import(pathToFileURL(backup)), import(pathToFileURL(candidate))]);
  if (JSON.stringify(before.metadata) !== JSON.stringify(after.metadata)
    || JSON.stringify(Object.keys(before)) !== JSON.stringify(Object.keys(after))) {
    throw new Error(`Circle ${locale}: renderer contract changed.`);
  }
  if (sha(await readFile(target)) !== sha(original)) throw new Error(`Circle ${locale}: concurrent edit.`);
  await rename(candidate, target);
  console.log(JSON.stringify({
    locale, groups: patched.groups, refreshed: patched.refreshed,
    backup: backup.slice(root.length + 1), sha256: sha(patched.source),
  }));
}
