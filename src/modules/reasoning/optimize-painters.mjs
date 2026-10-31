#!/usr/bin/env node
// Bounded text-only rewrite of the existing reasoning and banknote painters.
import { readFile, writeFile, mkdir, rename, readdir } from "node:fs/promises";
import { resolve } from "node:path";
import { createHash } from "node:crypto";
import { spawnSync } from "node:child_process";
import { pathToFileURL } from "node:url";
import assert from "node:assert/strict";
import { patchCalculusFilters } from "../../../scripts/optimize-calculus-filters.mjs";

if (process.argv.length !== 3 || !["--apply", "--verify"].includes(process.argv[2])) {
  throw new Error("Usage: node src/modules/reasoning/optimize-painters.mjs --apply|--verify");
}
const apply = process.argv[2] === "--apply";
const root = resolve(import.meta.dirname, "../../..");
const recovery = "/home/ignat/code/mightymatica-source-recovery/objects/Movies";
const reasoning = JSON.parse(await readFile(new URL("./native-timelines.json", import.meta.url), "utf8"));
const sha = value => createHash("sha256").update(value).digest("hex");
const report = [];
for (const [family, entries] of Object.entries({
  reasoning,
  dissections: { bills: {
    en: { module: "dissections/bills-en.mjs", source: "Movies/Bills-transform.swf" },
    ru: { module: "dissections/bills-ru.mjs", source: "Movies/Bills-transform-ru.swf" },
  } },
})) {
  for (const [key, locales] of Object.entries(entries)) {
    const bounds = JSON.parse(await readFile(resolve(root, `src/modules/${family}/text-bounds-${key}.json`), "utf8"));
    for (const locale of ["en", "ru"]) {
      const evidence = bounds.languages[locale];
      const name = locales[locale].source.slice("Movies/".length, -".swf".length);
      assert.equal(evidence.source, locales[locale].source);
      assert.equal(sha(await readFile(resolve(recovery, name, "original", `${name}.swf`))), evidence.sourceSha256);
      const target = resolve(root, "public/media", locales[locale].module);
      const original = await readFile(target, "utf8");
      const before = await import(pathToFileURL(target));
      // Both Turtles painters contain only the eight filter-library calls;
      // there are no filtered placements in either original timeline.
      if (key === "turtles") {
        assert.equal((original.match(/\.(?:glow|dropShadow|blur)\(/g) ?? []).length, 8);
        console.log(`${family}/${key}/${locale}: no authored filter placements; unchanged`);
        continue;
      }
      const patched = patchCalculusFilters(original, evidence.textBounds, before.metadata.width, before.metadata.height);
      if (!patched.groups && !patched.refreshed) {
        console.log(`${family}/${key}/${locale}: already optimized; idempotent`);
        // Recover provenance after an interrupted family run, without writing
        // any painter again or relying on an unverified old drawing export.
        if (apply) {
          const cache = resolve(root, `.cache/${family}-filter-originals`);
          for (const file of await readdir(cache)) {
            if (!file.startsWith(`${key}-${locale}-`) || !/[a-f0-9]{64}\.mjs$/.test(file)) continue;
            const saved = await readFile(resolve(cache, file), "utf8");
            const recovered = patchCalculusFilters(saved, evidence.textBounds, before.metadata.width, before.metadata.height);
            if (recovered.source !== original) continue;
            report.push({
              module: locales[locale].module, source: evidence.source, sourceSha256: evidence.sourceSha256,
              groups: recovered.groups, backup: resolve(cache, file).slice(root.length + 1),
              beforeSha256: sha(saved), afterSha256: sha(original),
            });
            break;
          }
        }
        continue;
      }
      if (!apply) throw new Error(`${family}/${key}/${locale}: optimization is not applied or current`);
      const cache = resolve(root, `.cache/${family}-filter-originals`);
      await mkdir(cache, { recursive: true });
      const backup = resolve(cache, `${key}-${locale}-${sha(original)}.mjs`);
      try { await writeFile(backup, original, { flag: "wx" }); }
      catch (error) {
        if (error.code !== "EEXIST" || sha(await readFile(backup)) !== sha(original)) throw error;
      }
      const candidate = resolve(cache, `${key}-${locale}-${sha(patched.source)}.candidate.mjs`);
      await writeFile(candidate, patched.source);
      assert.equal(spawnSync(process.execPath, ["--check", candidate], { stdio: "inherit" }).status, 0);
      const after = await import(pathToFileURL(candidate));
      assert.deepEqual(after.metadata, before.metadata);
      assert.deepEqual(Object.keys(after), Object.keys(before));
      const repeat = patchCalculusFilters(patched.source, evidence.textBounds, before.metadata.width, before.metadata.height);
      assert.equal(repeat.source, patched.source, "Text rewrite must be idempotent");
      assert.equal(repeat.groups, 0);
      assert.equal(sha(await readFile(target)), sha(original), "Concurrent painter edit");
      await rename(candidate, target);
      const entry = {
        module: locales[locale].module, source: evidence.source, sourceSha256: evidence.sourceSha256,
        groups: patched.groups, backup: backup.slice(root.length + 1),
        beforeSha256: sha(original), afterSha256: sha(patched.source),
      };
      report.push(entry);
      console.log(`${family}/${key}/${locale}: ${patched.groups} source-text filter groups cached`);
    }
  }
}
// Keep the original provenance report on an idempotent repeat.
for (const family of ["reasoning", "dissections"]) {
  const entries = report.filter(item => item.module.startsWith(`${family}/`));
  if (entries.length) {
    await writeFile(resolve(root, `src/modules/${family}/filter-optimization.json`), JSON.stringify(entries, null, 2) + "\n");
  }
}
