#!/usr/bin/env node
// Source-bound static drawings, including reviewed immutable embedded bitmap
// fills. No nested-filter rewrite, dynamic artwork or arbitrary patterns.
import { readFile, writeFile, mkdir, rename } from "node:fs/promises";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { createHash } from "node:crypto";
import { spawnSync } from "node:child_process";
import assert from "node:assert/strict";
import { parse } from "acorn";
import { recoverStaticDrawingBounds } from "../../../scripts/recover-static-drawing-bounds.mjs";
import { patchCalculusFilters } from "../../../scripts/optimize-calculus-filters.mjs";

const mode = process.argv[2];
if (process.argv.length !== 3 || !["--recover", "--apply", "--verify"].includes(mode)) {
  throw new Error("Use --recover (binary evidence only), --apply or --verify");
}
const root = resolve(import.meta.dirname, "../../..");
const recovery = "/home/ignat/code/mightymatica-source-recovery/objects/Movies";
const sha = value => createHash("sha256").update(value).digest("hex");
const families = {
  reasoning: JSON.parse(await readFile(resolve(import.meta.dirname, "native-timelines.json"), "utf8")),
  dissections: { bills: {
    en: { module: "dissections/bills-en.mjs", source: "Movies/Bills-transform.swf" },
    ru: { module: "dissections/bills-ru.mjs", source: "Movies/Bills-transform-ru.swf" },
  } },
};
function walk(node, visit, owner = null) {
  if (!node || typeof node.type !== "string") return;
  if (node.type === "FunctionDeclaration") owner = node.id.name;
  visit(node, owner);
  for (const value of Object.values(node)) {
    if (Array.isArray(value)) value.forEach(child => walk(child, visit, owner));
    else if (value?.type) walk(value, visit, owner);
  }
}
for (const [family, entries] of Object.entries(families)) {
  const report = [];
  const reportFile = resolve(root, `src/modules/${family}/static-filter-optimization.json`);
  let previous = [];
  try { previous = JSON.parse(await readFile(reportFile, "utf8")); }
  catch (error) { if (error.code !== "ENOENT") throw error; }
  for (const [key, locales] of Object.entries(entries)) {
    const text = JSON.parse(await readFile(resolve(root, `src/modules/${family}/text-bounds-${key}.json`), "utf8"));
    const evidenceFile = resolve(root, `src/modules/${family}/drawing-bounds-${key}.json`);
    const languages = {};
    let saved;
    if (mode !== "--recover") saved = JSON.parse(await readFile(evidenceFile, "utf8"));
    for (const [locale, config] of Object.entries(locales)) {
      const name = config.source.slice("Movies/".length, -".swf".length);
      assert.equal(config.source, `Movies/${name}.swf`);
      assert.ok(!name.includes("/") && !name.includes("\\"));
      const binary = await readFile(resolve(recovery, name, "original", `${name}.swf`));
      const evidence = mode === "--recover" ? {
        source: config.source, sourceSha256: sha(binary), drawingBounds: recoverStaticDrawingBounds(binary),
      } : saved.languages[locale];
      assert.equal(evidence.source, config.source);
      assert.equal(evidence.sourceSha256, sha(binary));
      if (config.sha256) assert.equal(config.sha256, evidence.sourceSha256);
      assert.equal(text.languages[locale].source, evidence.source);
      assert.equal(text.languages[locale].sourceSha256, evidence.sourceSha256);
      for (const [symbol, rect] of Object.entries(text.languages[locale].textBounds)) {
        assert.deepEqual(evidence.drawingBounds[symbol], rect, "Text/drawing evidence must agree");
      }
      languages[locale] = evidence;
      if (mode === "--recover") continue;
      const target = resolve(root, "public/media", config.module);
      const original = await readFile(target, "utf8");
      const ast = parse(original, { ecmaVersion: "latest", sourceType: "module" });
      const excludedStrokes = new Set();
      // Conservative family guard: ShapeBounds under arbitrary affine strokes
      // needs additional proof. This pass simply excludes every stroked leaf.
      walk(ast, (node, owner) => {
        if (!/^shape\d+$/.test(owner)) return;
        if (node.type === "AssignmentExpression"
          && ["strokeStyle", "lineWidth", "lineCap", "lineJoin", "miterLimit"].includes(node.left?.property?.name)) excludedStrokes.add(owner);
        if (node.type === "CallExpression" && (node.callee?.property?.name === "stroke"
          || node.callee?.name === "drawPath" && node.arguments[2]?.value === true)) excludedStrokes.add(owner);
      });
      const bounds = Object.fromEntries(Object.entries(evidence.drawingBounds)
        .filter(([symbol]) => !excludedStrokes.has(symbol)));
      const before = await import(pathToFileURL(target));
      let patched;
      try { patched = patchCalculusFilters(original, bounds, before.metadata.width, before.metadata.height); }
      catch (error) {
        if (error.message !== "No verified static-text filter groups or ambiguous filter ownership.") throw error;
        // Empty-filter painters such as Turtles have no patch marker.
        // Ambiguous filter ownership must not silently pass as unchanged.
        const owners = new Set();
        walk(ast, (node, owner) => {
          if (node.type === "CallExpression" && ["glow", "dropShadow"].includes(node.callee?.property?.name)
            && /^(?:main|sprite\d+)$/.test(owner)) owners.add(node.callee.object?.name);
        });
        if (owners.size > 1) throw error;
        patched = { source: original, groups: 0, refreshed: false };
      }
      const oldRecord = previous.find(item => item.module === config.module && item.afterSha256 === sha(original));
      let record = oldRecord ?? {
        module: config.module, source: evidence.source, sourceSha256: evidence.sourceSha256,
        groups: 0, beforeSha256: sha(original), afterSha256: sha(original),
      };
      if (patched.source !== original) {
        assert.equal(mode, "--apply", `${config.module}: static pass not applied`);
        const cache = resolve(root, `.cache/${family}-static-filter-originals`);
        await mkdir(cache, { recursive: true });
        const backup = resolve(cache, `${key}-${locale}-${sha(original)}.mjs`);
        try { await writeFile(backup, original, { flag: "wx" }); }
        catch (error) { if (error.code !== "EEXIST" || sha(await readFile(backup)) !== sha(original)) throw error; }
        const candidate = resolve(cache, `${key}-${locale}-${sha(patched.source)}.candidate.mjs`);
        await writeFile(candidate, patched.source);
        assert.equal(spawnSync(process.execPath, ["--check", candidate], { stdio: "inherit" }).status, 0);
        const after = await import(pathToFileURL(candidate));
        assert.deepEqual(after.metadata, before.metadata);
        assert.deepEqual(Object.keys(after), Object.keys(before));
        assert.equal(patchCalculusFilters(patched.source, bounds, before.metadata.width, before.metadata.height).source, patched.source);
        assert.equal(sha(await readFile(target)), sha(original), "Concurrent painter edit");
        await rename(candidate, target);
        record = {
          module: config.module, source: evidence.source, sourceSha256: evidence.sourceSha256,
          groups: patched.groups, backup: backup.slice(root.length + 1),
          beforeSha256: sha(original), afterSha256: sha(patched.source),
        };
      }
      record = { ...record, excludedStrokedShapes: [...excludedStrokes].sort() };
      report.push(record);
      console.log(JSON.stringify({ module: config.module, added: patched.groups, changed: patched.source !== original, excludedStrokes: excludedStrokes.size }));
    }
    if (mode === "--recover") await writeFile(evidenceFile, JSON.stringify({ version: 1, languages }, null, 2) + "\n");
  }
  if (mode === "--apply") await writeFile(reportFile, JSON.stringify(report, null, 2) + "\n");
}
