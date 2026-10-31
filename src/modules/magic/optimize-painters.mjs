// Offline family-owned rewrite. No original scripts or drawing code execute.
import { readFile, writeFile, mkdir, rename } from "node:fs/promises";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { createHash } from "node:crypto";
import { spawnSync } from "node:child_process";
import { isDeepStrictEqual } from "node:util";
import { patchCalculusFilters } from "../../../scripts/optimize-calculus-filters.mjs";

if (!process.argv.includes("--apply")) throw new Error("Usage: node src/modules/magic/optimize-painters.mjs --apply [--recover]");
const root = resolve(import.meta.dirname, "../../..");
const cache = resolve(root, ".cache/magic-filter-originals");
const sha = value => createHash("sha256").update(value).digest("hex");
const reportFile = resolve(import.meta.dirname, "filter-optimization.json");
let report;
try { report = JSON.parse(await readFile(reportFile, "utf8")); }
catch (error) { if (error.code !== "ENOENT") throw error; report = []; }
for (const [key, sourceName] of [["subtraction", "Mistic substr"], ["hourglasses", "Twohourglasses"]]) {
  const source = locale => `/home/ignat/code/mightymatica-source-recovery/objects/Movies/${sourceName}${locale === "ru" ? "-ru" : ""}/original/${sourceName}${locale === "ru" ? "-ru" : ""}.swf`;
  const boundsFile = resolve(import.meta.dirname, `${key}-text-bounds.json`);
  if (process.argv.includes("--recover")) {
    const result = spawnSync(process.execPath, [resolve(root, "scripts/recover-calculus-text-bounds.mjs"),
      "--en", source("en"), "--ru", source("ru"), "--output", boundsFile], { stdio: "inherit" });
    if (result.status !== 0) throw new Error(`Bounds recovery failed: ${key}`);
  }
  const bounds = JSON.parse(await readFile(boundsFile, "utf8"));
  for (const locale of ["en", "ru"]) {
    const evidence = bounds.languages[locale];
    if (sha(await readFile(source(locale))) !== evidence.sourceSha256
      || evidence.source !== `Movies/${sourceName}${locale === "ru" ? "-ru" : ""}.swf`) throw new Error("Source evidence mismatch");
    for (const part of key === "subtraction" ? ["lesson"] : ["question", "hint"]) {
      const target = resolve(root, `public/media/magic/native/${key}/${locale}/${part}.mjs`);
      const original = await readFile(target, "utf8");
      // Both hint chapters contain only the generic FFDec filter library,
      // not authored filter placements. Leave these drawings byte-identical.
      if (key === "hourglasses" && part === "hint") {
        console.log(`${key}/${locale}/${part}: reviewed, no authored filter placements`);
        continue;
      }
      const patched = patchCalculusFilters(original, evidence.textBounds, 550, 400);
      if (!patched.groups && !patched.refreshed) { console.log(`${key}/${locale}/${part}: already optimized`); continue; }
      await mkdir(cache, { recursive: true });
      const backup = resolve(cache, `${sha(original)}.mjs`);
      try { await writeFile(backup, original, { flag: "wx" }); }
      catch (error) { if (error.code !== "EEXIST" || sha(await readFile(backup)) !== sha(original)) throw error; }
      const candidate = resolve(cache, `${sha(patched.source)}.candidate.mjs`);
      await writeFile(candidate, patched.source);
      if (spawnSync(process.execPath, ["--check", candidate], { stdio: "inherit" }).status !== 0) throw new Error("Candidate syntax failed");
      const [before, after] = await Promise.all([import(pathToFileURL(backup)), import(pathToFileURL(candidate))]);
      if (!isDeepStrictEqual(before.metadata, after.metadata)
        || !isDeepStrictEqual(Object.keys(before), Object.keys(after))) throw new Error("Painter contract changed");
      const again = patchCalculusFilters(patched.source, evidence.textBounds, 550, 400);
      if (again.source !== patched.source || again.groups || again.refreshed) throw new Error("Non-idempotent rewrite");
      if (sha(await readFile(target)) !== sha(original)) throw new Error("Concurrent painter edit");
      await rename(candidate, target);
      const entry = { key, locale, part, groups: patched.groups, sourceSha256: sha(original), resultSha256: sha(patched.source) };
      report = report.filter(item => !(item.key === key && item.locale === locale && item.part === part));
      report.push(entry);
      await writeFile(reportFile, JSON.stringify(report, null, 2) + "\n");
      console.log(JSON.stringify(entry));
    }
  }
}
