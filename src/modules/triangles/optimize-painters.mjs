// Offline family-wide rewrite; never execute preserved ActionScript or SWF.
import { readFile, readdir, writeFile, mkdir, rename } from "node:fs/promises";
import { resolve } from "node:path";
import { createHash } from "node:crypto";
import { spawnSync } from "node:child_process";
import { pathToFileURL } from "node:url";
import { isDeepStrictEqual } from "node:util";
import { parse } from "acorn";
import { patchCalculusFilters } from "../../../scripts/optimize-calculus-filters.mjs";

// NORMAL strokes use a screen-space isotropic width. Until their transformed
// coverage is proven, leave shapes reached through rotation/shear/anisotropy
// in the original painter, even if the shared static-grammar check accepts them.
function conservativeDrawingBounds(source, bounds) {
  const children = new Map(), unsafe = new Set();
  function walk(node, owner) {
    if (!node?.type) return;
    if (node.type === "FunctionDeclaration") owner = node.id?.name;
    if (node.type === "CallExpression" && node.callee?.name === "place") {
      const child = node.arguments[0]?.value;
      const matrix = node.arguments[3];
      if (typeof child === "string") {
        if (!children.has(owner)) children.set(owner, new Set());
        children.get(owner).add(child);
        const values = matrix?.type === "ArrayExpression" ? matrix.elements.map(entry =>
          entry?.type === "Literal" ? entry.value
            : entry?.type === "UnaryExpression" && entry.operator === "-" && entry.argument?.type === "Literal"
              ? -entry.argument.value : NaN) : [];
        if (values.length !== 6 || !values.every(Number.isFinite) || values[1] !== 0 || values[2] !== 0
          || Math.abs(values[0]) !== Math.abs(values[3])) unsafe.add(child);
      }
    }
    for (const value of Object.values(node)) {
      if (Array.isArray(value)) value.forEach(child => walk(child, owner));
      else if (value?.type) walk(value, owner);
    }
  }
  walk(parse(source, { ecmaVersion: "latest", sourceType: "module" }), null);
  const pending = [...unsafe];
  while (pending.length) for (const child of children.get(pending.pop()) ?? []) {
    if (!unsafe.has(child)) { unsafe.add(child); pending.push(child); }
  }
  return Object.fromEntries(Object.entries(bounds).filter(([symbol]) => !symbol.startsWith("shape") || !unsafe.has(symbol)));
}

const root = resolve(import.meta.dirname, "../../..");
const sha = value => createHash("sha256").update(value).digest("hex");
const mode = process.argv[2];
if (!["--recover", "--check", "--apply"].includes(mode)) throw new Error("Use --recover, --check or --apply.");
const definitions = (await readdir(import.meta.dirname)).filter(name => /^native-.*-(en|ru)\.json$/.test(name)).sort();
const titles = [...new Set(definitions.map(name => name.replace(/^native-/, "").replace(/-(en|ru)\.json$/, "")))];
if (mode === "--recover") {
  for (const title of titles) {
    const sources = [];
    for (const locale of ["en", "ru"]) {
      const definition = JSON.parse(await readFile(resolve(import.meta.dirname,
        `native-${title}-${title === "palm-trig" ? "en" : locale}.json`), "utf8"));
      const name = definition.source.slice("Movies/".length, -4);
      sources.push(`/home/ignat/code/mightymatica-source-recovery/objects/Movies/${name}/original/${name}.swf`);
    }
    const result = spawnSync(process.execPath, [resolve(root, "scripts/recover-calculus-text-bounds.mjs"),
      "--en", sources[0], "--ru", sources[1], "--output", resolve(import.meta.dirname, `${title}-text-bounds.json`)],
    { stdio: "inherit" });
    if (result.status !== 0) throw new Error(`${title}: bounds recovery failed.`);
    const drawings = spawnSync(process.execPath, [resolve(root, "scripts/recover-static-drawing-bounds.mjs"),
      "--en", sources[0], "--ru", sources[1], "--output", resolve(import.meta.dirname, `${title}-drawing-bounds.json`)],
    { stdio: "inherit" });
    if (drawings.status !== 0) throw new Error(`${title}: drawing bounds recovery failed.`);
  }
} else {
  for (const filename of definitions) {
    const definition = JSON.parse(await readFile(resolve(import.meta.dirname, filename), "utf8"));
    const [, title, locale] = filename.match(/^native-(.*)-(en|ru)\.json$/);
    const evidence = JSON.parse(await readFile(resolve(import.meta.dirname, `${title}-text-bounds.json`), "utf8")).languages[locale];
    const drawingEvidence = JSON.parse(await readFile(resolve(import.meta.dirname, `${title}-drawing-bounds.json`), "utf8")).languages[locale];
    const sourceName = definition.source.slice("Movies/".length, -4);
    const source = `/home/ignat/code/mightymatica-source-recovery/objects/Movies/${sourceName}/original/${sourceName}.swf`;
    if (evidence.source !== definition.source || evidence.sourceSha256 !== definition.sourceSha256
      || sha(await readFile(source)) !== evidence.sourceSha256) throw new Error(`${filename}: source/bounds mismatch.`);
    if (drawingEvidence.source !== evidence.source || drawingEvidence.sourceSha256 !== evidence.sourceSha256) throw new Error("Drawing source mismatch.");
    for (const chapter of definition.chapters) {
      const target = resolve(root, "public/media", chapter.module);
      if (!target.startsWith(resolve(root, `public/media/triangles/native/${title}/${locale}`) + "/")) throw new Error("Unexpected painter path.");
      const original = await readFile(target, "utf8");
      if (!original.includes("Canvas context transforms v1") || !original.includes("Triangle playback control v1")) throw new Error("Missing existing transport/transform correction.");
      const bounds = conservativeDrawingBounds(original, drawingEvidence.drawingBounds);
      const patched = patchCalculusFilters(original, bounds, definition.width, definition.height);
      if (patchCalculusFilters(patched.source, bounds, definition.width, definition.height).source !== patched.source) throw new Error("Non-idempotent rewrite.");
      // Generated filter-owner identifiers are minified, not always "Filters".
      // Count assignment call sites only, excluding filter method definitions.
      const remaining = (patched.source.match(/=\s*[A-Za-z_$][\w$]*\.(?:glow|dropShadow)\(/g) ?? []).length;
      console.log(JSON.stringify({ title, locale, chapter: chapter.id, groups: patched.groups, refreshed: patched.refreshed, remaining }));
      if (mode !== "--apply" || patched.source === original) continue;
      const cache = resolve(root, ".cache/triangle-filter-originals");
      await mkdir(cache, { recursive: true });
      const backup = resolve(cache, `${title}-${locale}-${chapter.id}-${sha(original)}.mjs`);
      try { await writeFile(backup, original, { flag: "wx" }); }
      catch (error) { if (error.code !== "EEXIST" || sha(await readFile(backup)) !== sha(original)) throw error; }
      const candidate = `${backup}.candidate.mjs`;
      await writeFile(candidate, patched.source);
      if (spawnSync(process.execPath, ["--check", candidate], { stdio: "inherit" }).status !== 0) throw new Error("Candidate syntax failed.");
      const [before, after] = await Promise.all([import(pathToFileURL(backup)), import(pathToFileURL(candidate))]);
      if (!isDeepStrictEqual(before.metadata, after.metadata)
        || !isDeepStrictEqual(Object.keys(before), Object.keys(after))) throw new Error("Painter contract changed.");
      if (sha(await readFile(target)) !== sha(original)) throw new Error("Concurrent painter edit.");
      await rename(candidate, target);
    }
  }
}
