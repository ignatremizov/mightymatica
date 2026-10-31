#!/usr/bin/env node
// Explicit reviewed target set. No discovery, exports, services or browser work.
import { readFile, writeFile, mkdir, rename, realpath } from "node:fs/promises";
import { resolve, dirname, basename } from "node:path";
import { createHash } from "node:crypto";
import { pathToFileURL } from "node:url";
import { spawnSync } from "node:child_process";
import assert from "node:assert/strict";
import { patchNestedTextFilters } from "./optimize-nested-text-filters.mjs";
import { recoverStaticDrawingBounds } from "./recover-static-drawing-bounds.mjs";

const root = resolve(import.meta.dirname, "..");
const sha = value => createHash("sha256").update(value).digest("hex");
const targets = [];
for (const [key, wrapper] of [["snail", "sprite31"], ["tram", "sprite79"], ["paradox", "sprite240"]]) {
  for (const locale of ["en", "ru"]) targets.push({
    family: "reasoning", module: `reasoning/native/${key}-${locale}.mjs`,
    boundsFile: `src/modules/reasoning/text-bounds-${key}.json`, locale,
    wrappers: [key === "tram" && locale === "ru" ? "sprite71" : wrapper],
  });
}
targets.push({
  family: "dissections", module: "dissections/bills-ru.mjs",
  boundsFile: "src/modules/dissections/text-bounds-bills.json", locale: "ru", wrappers: ["sprite69"],
});
for (const part of ["story", "hint"]) targets.push({
  family: "logic", module: `logic/native/wisemen-eight-ru-${part}.mjs`,
  boundsFile: "src/modules/logic/wisemen-eight-text-bounds.json", locale: "ru",
  wrappers: ["sprite79", "sprite83"],
});
targets.push({
  family: "solids", module: "solids/sphere-lesson/en/examples.mjs",
  boundsFile: "src/modules/solids/sphere-text-bounds.json", locale: "en", wrappers: ["sprite241"],
});
for (const locale of ["en", "ru"]) targets.push({
  family: "motion", module: `motion/native/earth-belt/${locale}/frames-1-580.mjs`,
  boundsFile: "src/modules/motion/text-bounds.json",
  source: `Movies/Earthandbelt${locale === "ru" ? "-ru" : ""}.swf`, wrappers: ["sprite29"],
});
targets.push({
  family: "triangles", module: "triangles/native/inscribed-angle/ru/chapter-1.mjs",
  boundsFile: "src/modules/triangles/inscribed-angle-text-bounds.json", locale: "ru", wrappers: ["sprite80"],
});

const args = process.argv.slice(2);
if (args[0] !== "--apply" || ![1, 3].includes(args.length)
  || args.length === 3 && (args[1] !== "--family" || !targets.some(target => target.family === args[2]))) {
  throw new Error("Usage: node scripts/optimize-reviewed-nested-filters.mjs --apply [--family reasoning|dissections|logic|solids|motion|triangles]");
}
const selected = targets.filter(target => args.length === 1 || target.family === args[2]);
const reportFile = resolve(root, "docs/reviews/nested-filter-optimization.json");
let report;
try { report = JSON.parse(await readFile(reportFile, "utf8")); }
catch (error) {
  if (error.code !== "ENOENT") throw error;
  report = {
    version: 1,
    policy: "Fused nested static text at source density; not universal pixel equivalence to the prior mixed-density DPR>1 path.",
    validation: "Current source hashes and recovered DefineText bounds; candidate syntax, deep metadata/exports, concurrency hash and idempotence. Four focused proof tests passed; no browser/FPS/full-density benchmark claim.",
    targets: [],
  };
}
async function record(entry) {
  const existing = report.targets.findIndex(item => item.module === entry.module);
  if (existing < 0) report.targets.push(entry);
  else report.targets[existing] = entry;
  report.targets.sort((a, b) => a.module.localeCompare(b.module));
  await mkdir(dirname(reportFile), { recursive: true });
  await writeFile(reportFile, JSON.stringify(report, null, 2) + "\n");
  const rows = report.targets.map(item =>
    `| ${item.module} | ${item.status} | ${item.groups} | ${item.wrappers.map(wrapper => `${wrapper.wrapper} → ${wrapper.text} (${wrapper.groups})`).join(", ") || "—"} |`);
  const markdown = `# Reviewed nested static-text filters

Only explicit reviewed targets are considered. The rewrite preserves wrapper
functions and existing shape/static-composite caches. It directly paints the
verified text leaf with the composed matrix, then applies the original inner
chain followed by the outer chain at source density. It never calls the nested
wrapper inside a cropped context. Original shadow/glow parameters remain.

This is the approved source-density policy, not universal pixel equivalence to
the former mixed-density path at DPR greater than one. Timeline metadata,
exports, audio, question gates, hints and scene crops are unchanged.

Reproduce with \`node scripts/optimize-reviewed-nested-filters.mjs --apply\`,
optionally adding \`--family FAMILY\`. The JSON companion records exact source
hashes, original backups, before/after hashes and wrapper counts. A prepared
entry is not proof of replacement: the target must match its after hash.
Both bounds and source hashes are checked against the preserved SWF data.

| Painter | Status | Rewritten blocks | Qualified wrappers |
| --- | --- | ---: | --- |
${rows.join("\n")}

The additional Russian eight-wise-men \`sprite83\` is explicitly approved and
reported separately from \`sprite79\`. No dynamic wrapper is flattened.
Targets marked unchanged had no qualifying outer block.

Validation: \`node --test tests/nested-text-filters.test.mjs\` passed all four
tests, including rejection/idempotence and actual recovered filter arithmetic
on tiny 48×32 deterministic pixel fixtures. Those probes cover filter order,
transparent intermediate composition, stage-edge clipping and fractional
placement; they do not substitute for browser/font rasterization validation.
Every replacement also passes syntax, deep metadata/export comparison,
concurrent-edit protection and idempotence checks. No browser automation,
dense baseline profiling, server or integrated build was run by this batch.
`;
  await writeFile(reportFile.replace(/\.json$/, ".md"), markdown);
}
for (const target of selected) {
  const data = JSON.parse(await readFile(resolve(root, target.boundsFile), "utf8"));
  const evidence = target.source ? data.sources[target.source] : data.languages[target.locale];
  assert.ok(evidence && /^Movies\/[^/]+\.swf$/.test(evidence.source), "Unexpected source mapping");
  const name = evidence.source.slice(7, -4);
  const sourcePath = `/home/ignat/code/mightymatica-source-recovery/objects/Movies/${name}/original/${name}.swf`;
  const binary = await readFile(sourcePath);
  assert.equal(sha(binary), evidence.sourceSha256, "Preserved source hash mismatch");
  const recovered = Object.fromEntries(Object.entries(recoverStaticDrawingBounds(binary)).filter(([key]) => /^text\d+$/.test(key)));
  assert.deepEqual(evidence.textBounds, recovered, "DefineText bounds differ from the actual source");
  const filename = resolve(root, "public/media", target.module);
  assert.equal(await realpath(filename), filename, "Symlink media targets are not supported");
  const original = await readFile(filename, "utf8");
  const patched = patchNestedTextFilters(original, evidence.textBounds);
  assert.ok(patched.matches.every(match => target.wrappers.includes(match.wrapper)), "Unapproved additional wrapper");
  assert.equal(patchNestedTextFilters(patched.source, evidence.textBounds).source, patched.source, "Non-idempotent rewrite");
  const oldEntry = report.targets.find(item => item.module === target.module);
  if (!patched.groups) {
    if (oldEntry?.afterSha256 === sha(original) && ["prepared", "applied"].includes(oldEntry.status)) {
      if (oldEntry.status === "prepared") await record({ ...oldEntry, status: "applied" });
      console.log(`${target.module}: already optimized, idempotent`);
      continue;
    }
    await record({
      family: target.family, module: target.module, source: evidence.source, sourceSha256: evidence.sourceSha256,
      status: "unchanged", groups: 0, wrappers: [], beforeSha256: sha(original), afterSha256: sha(original),
    });
    console.log(`${target.module}: no qualifying outer blocks; unchanged`);
    continue;
  }
  const cache = resolve(root, `.cache/nested-filter-originals/${target.family}`);
  await mkdir(cache, { recursive: true });
  const backup = resolve(cache, `${basename(filename, ".mjs")}-${sha(original)}.mjs`);
  try { await writeFile(backup, original, { flag: "wx" }); }
  catch (error) {
    if (error.code !== "EEXIST" || sha(await readFile(backup)) !== sha(original)) throw error;
  }
  const candidate = resolve(cache, `${sha(patched.source)}.candidate.mjs`);
  await writeFile(candidate, patched.source);
  assert.equal(spawnSync(process.execPath, ["--check", candidate], { stdio: "inherit" }).status, 0);
  const [before, after] = await Promise.all([
    import(pathToFileURL(backup)), import(pathToFileURL(candidate)),
  ]);
  assert.deepEqual(Object.keys(after), Object.keys(before));
  assert.deepEqual(after.metadata, before.metadata);
  const wrappers = [];
  for (const match of patched.matches) {
    let entry = wrappers.find(item => item.wrapper === match.wrapper);
    if (!entry) {
      entry = { wrapper: match.wrapper, text: match.text, groups: 0, exampleMatrix: match.matrix, chain: match.chain };
      wrappers.push(entry);
    }
    entry.groups++;
  }
  const entry = {
    family: target.family, module: target.module, source: evidence.source, sourceSha256: evidence.sourceSha256,
    status: "prepared", groups: patched.groups, wrappers, backup: backup.slice(root.length + 1),
    beforeSha256: sha(original), afterSha256: sha(patched.source),
  };
  await record(entry);
  assert.equal(sha(await readFile(filename)), sha(original), "Concurrent media edit");
  await rename(candidate, filename);
  await record({ ...entry, status: "applied" });
  console.log(`${target.module}: ${patched.groups} nested filter blocks applied`);
}
