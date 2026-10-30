#!/usr/bin/env node
// Scoped offline rewrite of reviewed static-text filter blocks, never SWF/AS.
import { readFile, writeFile, mkdir, rename } from "node:fs/promises";
import { resolve, dirname, relative } from "node:path";
import { pathToFileURL } from "node:url";
import { createHash } from "node:crypto";
import { parse } from "acorn";
import { createCachedTextFilters } from "../src/shared/CachedTextFilters.mjs";

const marker = "// Calculus static-text filters v1: cropped, source-density, bounded cache.";
const sha = value => createHash("sha256").update(value).digest("hex");
const name = node => node?.type === "Identifier" ? node.name : null;
const expression = statement => statement?.type === "ExpressionStatement" ? statement.expression : null;
const declaration = statement => statement?.type === "VariableDeclaration" && statement.declarations.length === 1
  ? statement.declarations[0] : null;
const member = (node, owner, key) => node?.type === "MemberExpression" && !node.computed
  && name(node.object) === owner && name(node.property) === key;
const call = (node, owner, key) => node?.type === "CallExpression" && member(node.callee, owner, key);
function literal(node) {
  if (node?.type === "Literal") return node.value;
  if (node?.type === "TemplateLiteral" && !node.expressions.length) return node.quasis[0].value.cooked;
  if (node?.type === "ArrayExpression") return node.elements.map(literal);
  if (node?.type === "UnaryExpression" && node.operator === "-") return -literal(node.argument);
  throw new Error("Expected literal reviewed filter arguments.");
}
function walk(node, visit, owner = null) {
  if (!node || typeof node.type !== "string") return;
  if (["FunctionDeclaration", "FunctionExpression", "ArrowFunctionExpression"].includes(node.type)) owner = node;
  visit(node, owner);
  for (const value of Object.values(node)) {
    if (Array.isArray(value)) value.forEach(child => walk(child, visit, owner));
    else if (value?.type) walk(value, visit, owner);
  }
}
function matchesValues(nodes, values) {
  try { return JSON.stringify(nodes.map(literal)) === JSON.stringify(values); } catch { return false; }
}

export function patchCalculusFilters(source, bounds, width = 550, height = 400) {
  const existing = source.includes(marker);
  let refreshed = false;
  if (existing) {
    if (!source.includes("createCachedTextFilters") || !source.includes("_timelineTextFilters")) throw new Error("Partial filter patch.");
    const helper = createCachedTextFilters.toString();
    if (!source.includes(helper)) {
      const ast = parse(source, { ecmaVersion: "latest", sourceType: "module" });
      const helpers = [];
      walk(ast, node => {
        if (node.type === "FunctionDeclaration" && node.id?.name === "createCachedTextFilters") helpers.push(node);
      });
      if (helpers.length !== 1) throw new Error("Missing or ambiguous embedded filter helper.");
      const current = helpers[0];
      source = source.slice(0, current.start) + helper + source.slice(current.end);
      refreshed = true;
    }
  }
  if (!source.startsWith("// Mechanically converted FFDec 26.2.1 drawing code.")
    || !source.includes("Context lifecycle v2")) throw new Error("Expected reviewed drawing code.");
  const ast = parse(source, { ecmaVersion: "latest", sourceType: "module" });
  const factory = ast.body.find(node => node.type === "ExportNamedDeclaration"
    && node.declaration?.type === "FunctionDeclaration" && node.declaration.id?.name === "createTimeline")?.declaration;
  if (!factory) throw new Error("Missing reviewed renderer factory.");
  const texts = new Map(), sprites = new Map(), lists = [], releases = [], awaits = [], initializers = [];
  walk(factory, (node, owner) => {
    if (node.type === "FunctionDeclaration" && /^text\d+$/.test(node.id?.name)) texts.set(node.id.name, node);
    if (node.type === "FunctionDeclaration" && /^sprite\d+$/.test(node.id?.name)) sprites.set(node.id.name, node);
    if (node.type === "BlockStatement") lists.push(node.body);
    if (node.type === "SwitchCase") lists.push(node.consequent);
    if (node.type === "FunctionDeclaration" && node.id?.name === "_timelineRelease") releases.push(node);
    if (node.type === "ExpressionStatement" && node.expression.type === "AwaitExpression" && owner === factory) awaits.push(node);
    if (node.type === "AssignmentExpression" && name(node.left) === "_timelineTextFilters"
      && name(node.right?.callee) === "createCachedTextFilters") initializers.push(node.right);
    if (!existing && node.type === "Identifier" && ["_timelineTextFilters", "createCachedTextFilters"].includes(node.name)) {
      throw new Error("Unexpected existing filter helper.");
    }
  });
  if (releases.length !== 1 || awaits.length !== 1) throw new Error("Unknown renderer lifetime or decoding boundary.");
  const staticTexts = new Set();
  const staticBounds = { ...bounds };
  for (const [symbol, fn] of texts) {
    if (!bounds[symbol] || fn.params.length !== 5) continue;
    const unused = new Set(fn.params.slice(2).map(name));
    let safe = true;
    walk(fn.body, node => {
      if (node.type === "Identifier" && unused.has(node.name)) safe = false;
      if (node.type === "CallExpression" && name(node.callee) === "place") safe = false;
    });
    if (safe) staticTexts.add(symbol);
  }
  // Some captions are wrapped in a one-frame sprite. Only a verified plain
  // placement of static text qualifies: no nested filters, masks, clocks,
  // blends, images, or script-built artwork are flattened or cached.
  for (const [symbol, fn] of sprites) {
    if (fn.params.length !== 5 || fn.body.body.length !== 4) continue;
    const [scratch, count, normalize, dispatch] = fn.body.body;
    const scratchDecl = declaration(scratch), countDecl = declaration(count);
    const normalized = expression(normalize);
    const frameName = name(fn.params[2]), contextName = name(fn.params[0]), colorName = name(fn.params[1]);
    if (scratchDecl?.init?.type !== "ArrayExpression" || scratchDecl.init.elements.length
      || countDecl?.init?.type !== "Literal" || countDecl.init.value !== 1
      || !name(scratchDecl.id) || !name(countDecl.id) || name(scratchDecl.id) === name(countDecl.id)
      || fn.params.some(param => [name(scratchDecl.id), name(countDecl.id)].includes(name(param)))
      || normalized?.type !== "AssignmentExpression" || normalized.operator !== "="
      || name(normalized.left) !== frameName || normalized.right?.type !== "BinaryExpression"
      || normalized.right.operator !== "%" || name(normalized.right.left) !== frameName
      || name(normalized.right.right) !== name(countDecl.id)
      || dispatch?.type !== "SwitchStatement" || name(dispatch.discriminant) !== frameName
      || dispatch.cases.length !== 1 || dispatch.cases[0].test?.value !== 0) continue;
    const statements = dispatch.cases[0].consequent;
    if (statements.length !== 2 || statements[1].type !== "BreakStatement" || statements[1].label) continue;
    const placed = expression(statements[0]);
    if (name(placed?.callee) !== "place" || placed.arguments.length !== 9
      || !name(placed.arguments[1]) || name(placed.arguments[2]) !== contextName || name(placed.arguments[4]) !== colorName
      || name(placed.arguments[8]) !== name(fn.params[4])
      || !matchesValues(placed.arguments.slice(5, 8), [1, 0, 0])) continue;
    let child, matrix;
    try { child = literal(placed.arguments[0]); matrix = literal(placed.arguments[3]); } catch { continue; }
    if (!staticTexts.has(child) || !texts.has(child) || !Array.isArray(matrix)
      || matrix.length !== 6 || !matrix.every(Number.isFinite)) continue;
    const [x0, y0, x1, y1] = bounds[child];
    const corners = [[x0, y0], [x1, y0], [x0, y1], [x1, y1]].map(([x, y]) =>
      [matrix[0] * x + matrix[2] * y + matrix[4], matrix[1] * x + matrix[3] * y + matrix[5]]);
    staticBounds[symbol] = [
      Math.min(...corners.map(point => point[0])), Math.min(...corners.map(point => point[1])),
      Math.max(...corners.map(point => point[0])), Math.max(...corners.map(point => point[1])),
    ];
    staticTexts.add(symbol);
  }
  const pureNumber = node => node?.type === "Literal" && Number.isFinite(node.value)
    || node?.type === "Identifier"
    || node?.type === "BinaryExpression" && ["+", "%"].includes(node.operator)
      && pureNumber(node.left) && pureNumber(node.right);
  const pureColor = node => !!name(node)
    || !!name(node?.callee?.object) && call(node, name(node.callee.object), "merge")
      && node.arguments.length === 1 && node.arguments[0]?.type === "NewExpression"
      && name(node.arguments[0].callee) === "cxform"
      && node.arguments[0].arguments.length === 8
      && node.arguments[0].arguments.every(argument => {
        try { return Number.isFinite(literal(argument)); } catch { return false; }
      });
  const edits = [];
  const usedBounds = {};
  const filterOwners = new Set();
  for (const statements of lists) for (let i = 0; i < statements.length; i++) {
    const before = declaration(statements[i]), image = declaration(statements[i + 1]), target = declaration(statements[i + 2]);
    const context = name(before?.init), previous = name(before?.id), layer = name(image?.id), temp = name(target?.id);
    if (!context || !previous || !layer || !temp || image?.init?.type !== "CallExpression"
      || name(image.init.callee) !== "createCanvas" || image.init.arguments.length !== 2
      || !call(target?.init, layer, "getContext") || !matchesValues(target.init.arguments, ["2d"])) continue;
    const root = name(image.init.arguments[0]?.object);
    if (!root || !member(image.init.arguments[0], root, "width") || !member(image.init.arguments[1], root, "height")) continue;
    const enhance = expression(statements[i + 3]), transform = expression(statements[i + 4]), assign = expression(statements[i + 5]);
    if (name(enhance?.callee) !== "enhanceContext" || name(enhance.arguments?.[0]) !== temp
      || !call(transform, temp, "applyTransforms") || !member(transform.arguments[0], context, "_matrix")
      || assign?.type !== "AssignmentExpression" || name(assign.left) !== context || name(assign.right) !== temp) continue;
    const placed = expression(statements[i + 6]);
    if (name(placed?.callee) !== "place" || placed.arguments.length !== 9) continue;
    let symbol, matrix;
    try { symbol = literal(placed.arguments[0]); matrix = literal(placed.arguments[3]); } catch { continue; }
    if (!staticTexts.has(symbol) || name(placed.arguments[1]) !== root || name(placed.arguments[2]) !== context
      || !Array.isArray(matrix) || matrix.length !== 6 || !matrix.every(Number.isFinite)
      || !pureColor(placed.arguments[4]) || !matchesValues(placed.arguments.slice(5, 6), [1])
      || !placed.arguments.slice(6, 9).every(pureNumber)) continue;
    let end = i + 7;
    const chain = [];
    let owner = null;
    while (end < statements.length) {
      const assignment = expression(statements[end]), applied = assignment?.right;
      const kind = name(applied?.callee?.property);
      if (assignment?.type !== "AssignmentExpression" || name(assignment.left) !== layer
        || applied?.type !== "CallExpression" || !["glow", "dropShadow"].includes(kind)) break;
      const nextOwner = name(applied.callee.object);
      if (!nextOwner || (owner && nextOwner !== owner) || name(applied.arguments[0]) !== layer
        || !call(applied.arguments[1], layer, "getContext") || !matchesValues(applied.arguments[1].arguments, ["2d"])) break;
      let args;
      try { args = applied.arguments.slice(2).map(literal); } catch { break; }
      const inner = kind === "glow" ? args[4] : args[5];
      const knockout = kind === "glow" ? args[5] : args[8];
      if (inner !== false || knockout !== false || args.length !== (kind === "glow" ? 7 : 9)
        || !Number.isInteger(args[6]) || args[6] < 1 || args[6] > 3
        || !args.slice(0, 2).every(value => Number.isFinite(value) && value >= 0 && value <= 64)) break;
      owner = nextOwner;
      chain.push([kind, ...args]);
      end++;
    }
    if (!chain.length || chain.length > 4) continue;
    const restore = expression(statements[end]), saved = declaration(statements[end + 1]);
    const identity = expression(statements[end + 2]), draw = expression(statements[end + 3]), resume = expression(statements[end + 4]);
    if (restore?.type !== "AssignmentExpression" || name(restore.left) !== context || name(restore.right) !== previous
      || !member(saved?.init, context, "_matrix") || !call(identity, context, "setTransform")
      || !matchesValues(identity.arguments, [1, 0, 0, 1, 0, 0]) || !call(draw, context, "drawImage")
      || name(draw.arguments[0]) !== layer || !matchesValues(draw.arguments.slice(1), [0, 0])
      || !call(resume, context, "applyTransforms") || name(resume.arguments[0]) !== name(saved.id)) continue;
    const color = source.slice(placed.arguments[4].start, placed.arguments[4].end);
    edits.push({ start: statements[i].start, end: statements[end + 4].end,
      text: `_timelineTextFilters.draw(${JSON.stringify(symbol)},${root},${context},${JSON.stringify(matrix)},${color},${JSON.stringify(chain)});` });
    usedBounds[symbol] = staticBounds[symbol];
    filterOwners.add(owner);
    i = end + 4;
  }
  const groups = edits.length;
  if (!groups && existing) return { source, groups: 0, refreshed };
  if (!groups || filterOwners.size !== 1) throw new Error("No verified static-text filter groups or ambiguous filter ownership.");
  if (existing) {
    const options = initializers.length === 1 && initializers[0].arguments[0];
    const property = options?.type === "ObjectExpression" && options.properties.find(prop => name(prop.key) === "bounds");
    const filterProperty = options?.type === "ObjectExpression" && options.properties.find(prop => name(prop.key) === "filters");
    if (!property || property.value.type !== "ObjectExpression"
      || name(filterProperty?.value) !== [...filterOwners][0]) throw new Error("Unknown existing filter cache.");
    const previousBounds = Object.fromEntries(property.value.properties.map(prop =>
      [prop.key.type === "Literal" ? prop.key.value : name(prop.key), literal(prop.value)]));
    edits.push({ start: property.value.start, end: property.value.end,
      text: JSON.stringify({ ...previousBounds, ...usedBounds }) });
  } else {
    edits.push({ start: factory.body.start + 1, end: factory.body.start + 1,
      text: `\n${marker}\nlet _timelineTextFilters = null;\n${createCachedTextFilters.toString()}\n` });
    edits.push({ start: releases[0].body.start + 1, end: releases[0].body.start + 1,
      text: "_timelineTextFilters?.dispose();" });
    edits.push({ start: awaits[0].start, end: awaits[0].start,
      text: `_timelineTextFilters=createCachedTextFilters({place,filters:${[...filterOwners][0]},enhanceContext,createCanvas,bounds:${JSON.stringify(usedBounds)},width:${width},height:${height}});\n` });
  }
  const parts = [];
  let offset = 0;
  for (const edit of edits.sort((a, b) => a.start - b.start)) {
    if (edit.start < offset) throw new Error("Overlapping filter rewrite.");
    parts.push(source.slice(offset, edit.start), edit.text);
    offset = edit.end;
  }
  parts.push(source.slice(offset));
  const result = parts.join("");
  parse(result, { ecmaVersion: "latest", sourceType: "module" });
  return { source: result, groups, refreshed };
}

async function main() {
  if (process.argv.length !== 3 || process.argv[2] !== "--apply") {
    throw new Error("Usage: node scripts/optimize-calculus-filters.mjs --apply");
  }
  const root = resolve(import.meta.dirname, "..");
  const data = JSON.parse(await readFile(resolve(root, "src/modules/calculus/text-bounds.json"), "utf8"));
  const backup = resolve(root, ".cache/calculus-filter-originals");
  for (const locale of ["en", "ru"]) for (const part of [1, 2, 3]) {
    const target = resolve(root, `public/media/calculus/native/${locale}/chapter-${part}.mjs`);
    const original = await readFile(target, "utf8");
    const patched = patchCalculusFilters(original, data.languages[locale].textBounds);
    if (!patched.groups && !patched.refreshed) { console.log(`${locale}/${part}: already optimized`); continue; }
    const saved = original.includes(marker)
      ? resolve(root, `.cache/calculus-filter-updates/${sha(original)}.mjs`)
      : resolve(backup, `${locale}/chapter-${part}.mjs`);
    await mkdir(dirname(saved), { recursive: true });
    try { await writeFile(saved, original, { flag: "wx" }); } catch (error) {
      if (error.code !== "EEXIST" || (!patched.refreshed && sha(await readFile(saved)) !== sha(original))) throw error;
    }
    const candidate = saved + ".candidate.mjs";
    await writeFile(candidate, patched.source);
    const [old, next] = await Promise.all([import(pathToFileURL(saved)), import(pathToFileURL(candidate))]);
    if (JSON.stringify(old.metadata) !== JSON.stringify(next.metadata)
      || JSON.stringify(Object.keys(old)) !== JSON.stringify(Object.keys(next))) throw new Error("Renderer metadata/export changes are forbidden.");
    if (sha(await readFile(target)) !== sha(original)) throw new Error("Renderer changed while optimizing.");
    await rename(candidate, target);
    console.log(`${relative(root, target)}: ${patched.refreshed ? "helper refreshed" : `${patched.groups} cropped groups`}; ${original.length} → ${patched.source.length} bytes`);
  }
}
if (process.argv[1] && resolve(process.argv[1]) === resolve(import.meta.filename)) {
  main().catch(error => { console.error(error.message); process.exitCode = 1; });
}
