// Remove only reviewed transparent leaf isolation/effects; retain leaf evaluation.
import { parse } from "acorn";
import { readFile, writeFile, mkdir, rename } from "node:fs/promises";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { createHash } from "node:crypto";
import { spawnSync } from "node:child_process";
import { isDeepStrictEqual } from "node:util";

const name = n => n?.type === "Identifier" ? n.name : null;
const expr = n => n?.type === "ExpressionStatement" ? n.expression : null;
const decl = n => n?.type === "VariableDeclaration" && n.kind === "var" && n.declarations.length === 1 ? n.declarations[0] : null;
const member = (n, owner, key) => n?.type === "MemberExpression" && !n.computed && name(n.object) === owner && name(n.property) === key;
const call = (n, owner, key) => n?.type === "CallExpression" && !n.optional && member(n.callee, owner, key);
function value(n) {
  if (n?.type === "Literal") return n.value;
  if (n?.type === "TemplateLiteral" && !n.expressions.length) return n.quasis[0].value.cooked;
  if (n?.type === "ArrayExpression") return n.elements.map(value);
  if (n?.type === "UnaryExpression" && n.operator === "-") return -value(n.argument);
  throw new Error("Not literal");
}
const equal = (nodes, values) => {
  try { return isDeepStrictEqual(nodes.map(value), values); } catch { return false; }
};
function walk(n, visit) {
  if (!n?.type) return;
  visit(n);
  for (const v of Object.values(n)) {
    if (Array.isArray(v)) v.forEach(c => walk(c, visit));
    else if (v?.type) walk(v, visit);
  }
}
function emptyLeaf(fn) {
  if (fn.params.length !== 5 || !fn.params.every(name) || new Set(fn.params.map(name)).size !== 5) return false;
  // The only nonempty permitted body is the observed color conversion local.
  // No context access or arbitrary calls are accepted. Keep its original place
  // call after rewriting, so even color evaluation/throws are not discarded.
  return fn.body.body.every(statement => {
    const d = decl(statement), convert = d?.init, apply = convert?.arguments?.[0];
    if (!d || fn.params.some(p => name(p) === name(d.id)) || !name(d.id)
      || name(convert?.callee) !== "tocolor" || convert.arguments.length !== 1
      || !call(apply, name(fn.params[1]), "apply") || apply.arguments.length !== 1) return false;
    try {
      const rgba = value(apply.arguments[0]);
      return Array.isArray(rgba) && rgba.length === 4 && rgba.every(Number.isFinite);
    } catch { return false; }
  });
}

export function patchEmptyTextFilters(source, symbols) {
  const ast = parse(source, { ecmaVersion: "latest", sourceType: "module" });
  const leaves = new Map(), lists = [], edits = [], counts = {};
  walk(ast, n => {
    if (n.type === "FunctionDeclaration" && symbols.includes(n.id?.name)) {
      if (leaves.has(n.id.name)) throw new Error("Duplicate leaf");
      leaves.set(n.id.name, n);
    }
    if (n.type === "BlockStatement") lists.push(n.body);
    if (n.type === "SwitchCase") lists.push(n.consequent);
  });
  for (const symbol of symbols) {
    if (!/^text\d+$/.test(symbol) || !leaves.has(symbol) || !emptyLeaf(leaves.get(symbol))) {
      throw new Error(`Leaf is not proven paint-free: ${symbol}`);
    }
  }
  for (const list of lists) for (let i = 0; i < list.length; i++) {
    const saved = decl(list[i]), image = decl(list[i + 1]), ctx = decl(list[i + 2]);
    const previous = name(saved?.id), context = name(saved?.init), layer = name(image?.id), temp = name(ctx?.id);
    const create = image?.init, root = name(create?.arguments?.[0]?.object);
    if (!previous || !context || !layer || !temp || !root
      || new Set([previous, context, layer, temp, root]).size !== 5
      || name(create?.callee) !== "createCanvas" || create.arguments.length !== 2
      || !member(create.arguments[0], root, "width") || !member(create.arguments[1], root, "height")
      || !call(ctx.init, layer, "getContext") || !equal(ctx.init.arguments, ["2d"])) continue;
    const enhance = expr(list[i + 3]), transform = expr(list[i + 4]), swap = expr(list[i + 5]);
    if (name(enhance?.callee) !== "enhanceContext" || enhance.arguments.length !== 1 || name(enhance.arguments[0]) !== temp
      || !call(transform, temp, "applyTransforms") || transform.arguments.length !== 1 || !member(transform.arguments[0], context, "_matrix")
      || swap?.type !== "AssignmentExpression" || swap.operator !== "=" || name(swap.left) !== context || name(swap.right) !== temp) continue;
    const placed = expr(list[i + 6]);
    if (name(placed?.callee) !== "place" || placed.arguments.length !== 9) continue;
    let symbol, matrix;
    try { symbol = value(placed.arguments[0]); matrix = value(placed.arguments[3]); } catch { continue; }
    if (!symbols.includes(symbol) || name(placed.arguments[1]) !== root || name(placed.arguments[2]) !== context
      || !Array.isArray(matrix) || matrix.length !== 6 || !matrix.every(Number.isFinite)
      || !placed.arguments.slice(4).every(n => name(n) || (() => { try { return Number.isFinite(value(n)); } catch { return false; } })())) continue;
    let end = i + 7, owner = null, effects = 0;
    while (end < list.length) {
      const a = expr(list[end]), f = a?.right, kind = name(f?.callee?.property);
      if (a?.type !== "AssignmentExpression" || a.operator !== "=" || name(a.left) !== layer
        || !["dropShadow", "glow"].includes(kind) || f?.type !== "CallExpression") break;
      const nextOwner = name(f.callee.object);
      if (!nextOwner || (owner && owner !== nextOwner) || name(f.arguments[0]) !== layer
        || !call(f.arguments[1], layer, "getContext") || !equal(f.arguments[1].arguments, ["2d"])) break;
      let args;
      try { args = f.arguments.slice(2).map(value); } catch { break; }
      const rgba = args[kind === "glow" ? 3 : 4];
      // Only finite, bounded, outer, non-knockout effects can preserve zero alpha.
      if (args.length !== (kind === "glow" ? 7 : 9)
        || args[kind === "glow" ? 4 : 5] !== false || args[kind === "glow" ? 5 : 8] !== false
        || !Array.isArray(rgba) || rgba.length !== 4 || !rgba.every(Number.isFinite)
        || !rgba.slice(0, 3).every(v => v >= 0 && v <= 255) || rgba[3] < 0 || rgba[3] > 1
        || !args.every(v => Array.isArray(v) || typeof v === "boolean" || Number.isFinite(v))
        || !args.slice(0, 2).every(v => Number.isFinite(v) && v >= 0 && v <= 64)
        || !(kind === "glow" ? [args[2]] : [args[2], args[3], args[7]]).every(Number.isFinite)
        || !Number.isInteger(args[6]) || args[6] < 1 || args[6] > 3) break;
      owner = nextOwner; effects++; end++;
    }
    if (!effects || effects > 4) continue;
    const restore = expr(list[end]), matrixSaved = decl(list[end + 1]), identity = expr(list[end + 2]);
    const draw = expr(list[end + 3]), resume = expr(list[end + 4]);
    if (restore?.type !== "AssignmentExpression" || restore.operator !== "=" || name(restore.left) !== context || name(restore.right) !== previous
      || !member(matrixSaved?.init, context, "_matrix") || !name(matrixSaved?.id)
      || !call(identity, context, "setTransform") || !equal(identity.arguments, [1, 0, 0, 1, 0, 0])
      || !call(draw, context, "drawImage") || name(draw.arguments[0]) !== layer || !equal(draw.arguments.slice(1), [0, 0])
      || !call(resume, context, "applyTransforms") || resume.arguments.length !== 1 || name(resume.arguments[0]) !== name(matrixSaved.id)) continue;
    edits.push({ start: list[i].start, end: list[end + 4].end, text: source.slice(list[i + 6].start, list[i + 6].end) });
    counts[symbol] = (counts[symbol] ?? 0) + 1;
    i = end + 4;
  }
  for (const edit of edits.sort((a, b) => b.start - a.start)) source = source.slice(0, edit.start) + edit.text + source.slice(edit.end);
  return { source, groups: edits.length, counts };
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  if (!["--inspect", "--apply"].includes(process.argv[2])) throw new Error("Usage: node scripts/optimize-empty-text-filters.mjs --inspect|--apply");
  const root = resolve(import.meta.dirname, "..");
  const sha = v => createHash("sha256").update(v).digest("hex");
  const entries = [
    ["kids", "kids-find-proper", "lesson", ["text582", "text584"]],
    ["falling", "falling-figure", "completion", ["text95"]],
  ];
  if (process.argv[3] && !["kids", "falling"].includes(process.argv[3])) throw new Error("Unknown family");
  for (const [family, id, painter, symbols] of entries.filter(entry => !process.argv[3] || entry[0] === process.argv[3])) {
    const target = resolve(root, `public/media/${family}/audio/${id}/${painter}.mjs`);
    const original = await readFile(target, "utf8"), patched = patchEmptyTextFilters(original, symbols);
    console.log(JSON.stringify({ id, groups: patched.groups, counts: patched.counts, baselineSha256: sha(original) }));
    if (process.argv[2] !== "--apply" || !patched.groups) continue;
    const cache = resolve(root, `.cache/${family}-filter-originals`);
    await mkdir(cache, { recursive: true });
    const backup = resolve(cache, `${id}-empty-${sha(original)}.mjs`);
    try { await writeFile(backup, original, { flag: "wx" }); }
    catch (e) { if (e.code !== "EEXIST" || sha(await readFile(backup)) !== sha(original)) throw e; }
    const candidate = resolve(cache, `${id}-empty-${sha(patched.source)}.candidate.mjs`);
    await writeFile(candidate, patched.source);
    if (spawnSync(process.execPath, ["--check", candidate], { stdio: "inherit" }).status !== 0) throw new Error("Candidate syntax failed");
    const [before, after] = await Promise.all([import(pathToFileURL(backup)), import(pathToFileURL(candidate))]);
    if (!isDeepStrictEqual(before.metadata, after.metadata) || !isDeepStrictEqual(Object.keys(before).sort(), Object.keys(after).sort())) throw new Error("Renderer contract changed");
    if (sha(await readFile(target)) !== sha(original)) throw new Error("Concurrent painter edit");
    if (patchEmptyTextFilters(patched.source, symbols).source !== patched.source) throw new Error("Non-idempotent rewrite");
    await rename(candidate, target);
  }
}
