#!/usr/bin/env node
// Offline storage-only change to three reviewed FFDec numeric scratch arrays.
import { parse } from "acorn";
import { createHash } from "node:crypto";
import { readFile, writeFile, mkdir, rename } from "node:fs/promises";
import { dirname, resolve } from "node:path";

const marker = "// Calculus filter buffers v1: fixed-size numeric scratch storage.";
const provenance = "// Mechanically converted FFDec 26.2.1 drawing code.";
const specifications = {
  _boxBlurHorizontal: {
    hash: "56dec759f4764605ad888aae14af48217c0866b2b27f6c788dd3a079b6210321",
    variable: "s", length: "n*4",
  },
  _boxBlurVertical: {
    hash: "337e69af98ca5b77b9d641af281e7756ed835d59383bee3348295293995ccaf5",
    variable: "o", length: "r*4",
  },
  dropShadow: {
    hash: "625ea1cc89ec041eb025d2bb4db5d3fa26885ff922ba20f926de8be2222eee7c",
    variable: "h", length: "m.length",
  },
};
// Other exporter variants need review, not heuristic array substitutions.
const structural = node => JSON.stringify(node,
  (key, value) => ["start", "end", "raw"].includes(key) ? undefined : value);
const sha = value => createHash("sha256").update(value).digest("hex");
function walk(node, visit) {
  if (!node?.type) return;
  visit(node);
  for (const value of Object.values(node)) {
    if (Array.isArray(value)) value.forEach(child => walk(child, visit));
    else if (value?.type) walk(value, visit);
  }
}

export function patchCalculusFilterBuffers(source) {
  if (!source.startsWith(provenance)) throw new Error("Expected reviewed native drawing provenance.");
  const comments = [];
  const ast = parse(source, { ecmaVersion: "latest", sourceType: "module", onComment: comments });
  const patched = comments.some(comment => comment.value.trim() === marker.slice(2).trim());
  const found = new Set(), edits = [];
  walk(ast, node => {
    if (node.type !== "AssignmentExpression" || node.left?.type !== "MemberExpression"
      || !Object.hasOwn(specifications, node.left.property?.name)) return;
    const name = node.left.property.name, spec = specifications[name];
    if (found.has(name) || node.right.type !== "FunctionExpression") throw new Error(`Ambiguous ${name} filter.`);
    found.add(name);
    let scratch;
    walk(node.right.body, child => {
      if (child.type === "VariableDeclarator" && child.id.name === spec.variable
        && (child.init?.type === "ArrayExpression" || child.init?.type === "NewExpression")) {
        if (scratch) throw new Error(`Ambiguous ${name} scratch array.`);
        scratch = child.init;
      }
    });
    if (!scratch) throw new Error(`Missing ${name} scratch array.`);
    const original = source.slice(node.right.start, scratch.start) + "[]"
      + source.slice(scratch.end, node.right.end);
    const originalNode = parse(`(${original})`, { ecmaVersion: "latest" }).body[0].expression;
    if (sha(structural(originalNode)) !== spec.hash) throw new Error(`Unreviewed ${name} implementation.`);
    const replacement = `new Float64Array(${spec.length})`;
    if (patched) {
      const expected = parse(replacement, { ecmaVersion: "latest" }).body[0].expression;
      if (structural(scratch) !== structural(expected)) throw new Error(`Corrupted ${name} buffer patch.`);
    } else {
      if (scratch.type !== "ArrayExpression" || scratch.elements.length) throw new Error(`Unexpected ${name} storage.`);
      edits.push({ start: scratch.start, end: scratch.end, replacement });
    }
  });
  if (found.size !== Object.keys(specifications).length) throw new Error("Incomplete reviewed filter set.");
  if (patched) return { source, changed: false };
  for (const edit of edits.sort((a, b) => b.start - a.start)) {
    source = source.slice(0, edit.start) + edit.replacement + source.slice(edit.end);
  }
  const end = source.indexOf("\n");
  return { source: source.slice(0, end + 1) + marker + "\n" + source.slice(end + 1), changed: true };
}

async function main() {
  if (process.argv.length !== 3 || process.argv[2] !== "--apply") {
    throw new Error("Usage: node scripts/calculus-filter-buffers.mjs --apply");
  }
  const root = resolve(import.meta.dirname, "..");
  for (const locale of ["en", "ru"]) for (const part of [1, 2, 3]) {
    const target = resolve(root, `public/media/calculus/native/${locale}/chapter-${part}.mjs`);
    const original = await readFile(target, "utf8");
    const result = patchCalculusFilterBuffers(original);
    if (!result.changed) { console.log(`${locale}/${part}: already optimized`); continue; }
    const saved = resolve(root, `.cache/calculus-filter-buffers/${sha(original)}.mjs`);
    await mkdir(dirname(saved), { recursive: true });
    try { await writeFile(saved, original, { flag: "wx" }); } catch (error) {
      if (error.code !== "EEXIST" || sha(await readFile(saved)) !== sha(original)) throw error;
    }
    const candidate = saved + ".candidate";
    await writeFile(candidate, result.source);
    if (sha(await readFile(target)) !== sha(original)) throw new Error("Renderer changed while optimizing.");
    await rename(candidate, target);
    console.log(`${locale}/${part}: three numeric scratch arrays optimized`);
  }
}
if (process.argv[1] && resolve(process.argv[1]) === resolve(import.meta.filename)) {
  main().catch(error => { console.error(error.message); process.exitCode = 1; });
}
