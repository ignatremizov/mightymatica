#!/usr/bin/env node
// Offline proof/rewrite only. No CLI media writes; callers own backup/verification.
// Approved policy: the complete nested chain runs at authored source density.
// This is not pixel equivalence to the previous mixed-density path at DPR > 1.
import { parse } from "acorn";
import { createCachedTextFilters } from "../src/shared/CachedTextFilters.mjs";

const id = node => node?.type === "Identifier" ? node.name : null;
const expr = node => node?.type === "ExpressionStatement" ? node.expression : null;
const decl = node => node?.type === "VariableDeclaration" && node.kind === "var"
  && node.declarations.length === 1 ? node.declarations[0] : null;
const member = (node, owner, key) => node?.type === "MemberExpression"
  && !node.computed && id(node.object) === owner && id(node.property) === key;
const call = (node, owner, key) => node?.type === "CallExpression" && member(node.callee, owner, key);
function literal(node) {
  if (node?.type === "Literal") return node.value;
  if (node?.type === "TemplateLiteral" && !node.expressions.length) return node.quasis[0].value.cooked;
  if (node?.type === "ArrayExpression") return node.elements.map(literal);
  if (node?.type === "UnaryExpression" && node.operator === "-") return -literal(node.argument);
  throw new Error("Not a literal");
}
const values = (nodes, expected) => {
  try { return JSON.stringify(nodes.map(literal)) === JSON.stringify(expected); } catch { return false; }
};
const finite = value => typeof value === "number" && Number.isFinite(value);
const matrix = value => Array.isArray(value) && value.length === 6 && value.every(finite);
const bounds = value => Array.isArray(value) && value.length === 4 && value.every(finite)
  && value[0] < value[2] && value[1] < value[3];
function walk(node, visit, owner = null) {
  if (!node?.type) return;
  if (["FunctionDeclaration", "FunctionExpression", "ArrowFunctionExpression"].includes(node.type)) owner = node;
  visit(node, owner);
  for (const value of Object.values(node)) {
    if (Array.isArray(value)) value.forEach(child => walk(child, visit, owner));
    else if (value?.type) walk(value, visit, owner);
  }
}
function chainValid(chain) {
  return Array.isArray(chain) && chain.length >= 1 && chain.length <= 4 && chain.every(item => {
    if (!Array.isArray(item)) return false;
    const [kind, ...args] = item;
    if (!["glow", "dropShadow"].includes(kind) || args.length !== (kind === "glow" ? 7 : 9)
      || !args.slice(0, 2).every(value => finite(value) && value >= 0 && value <= 64)
      || !Number.isInteger(args[6]) || args[6] < 1 || args[6] > 3) return false;
    const color = args[kind === "glow" ? 3 : 4];
    if (!Array.isArray(color) || color.length !== 4
      || !color.slice(0, 3).every(value => finite(value) && value >= 0 && value <= 255)
      || !finite(color[3]) || color[3] < 0 || color[3] > 1) return false;
    if (kind === "glow") return finite(args[2]) && args[2] >= 0 && args[2] <= 16
      && args[4] === false && args[5] === false;
    return finite(args[2]) && finite(args[3]) && Math.abs(args[3]) <= 64
      && args[5] === false && finite(args[7]) && args[7] >= 0 && args[7] <= 16 && args[8] === false;
  });
}
const pureNumber = node => node?.type === "Literal" && finite(node.value)
  || !!id(node) || node?.type === "BinaryExpression" && ["+", "%"].includes(node.operator)
    && pureNumber(node.left) && pureNumber(node.right);
const pureColor = node => !!id(node)
  || !!id(node?.callee?.object) && call(node, id(node.callee.object), "merge")
    && node.arguments.length === 1 && node.arguments[0]?.type === "NewExpression"
    && id(node.arguments[0].callee) === "cxform" && node.arguments[0].arguments.length === 8
    && node.arguments[0].arguments.every(argument => {
      try { return finite(literal(argument)); } catch { return false; }
    });

// Strict plain-leaf grammar: no hidden filters, placement, state or clock reads.
function plainText(fn) {
  if (fn.params.length !== 5 || fn.params.some(param => !id(param))
    || new Set(fn.params.map(id)).size !== 5) return false;
  const [context, color] = fn.params.map(id), inks = new Set();
  let depth = 0;
  for (const statement of fn.body.body) {
    if (statement.type === "VariableDeclaration" && statement.kind === "var") {
      for (const entry of statement.declarations) {
        const value = entry.init;
        if (!id(entry.id) || fn.params.some(param => id(param) === id(entry.id))
          || id(entry.id) === "tocolor" || /^font\d+$/.test(id(entry.id))
          || id(value?.callee) !== "tocolor" || value.arguments.length !== 1
          || !call(value.arguments[0], color, "apply") || value.arguments[0].arguments.length !== 1) return false;
        try {
          const rgba = literal(value.arguments[0].arguments[0]);
          if (!Array.isArray(rgba) || rgba.length !== 4 || !rgba.every(finite)) return false;
        } catch { return false; }
        inks.add(id(entry.id));
      }
      continue;
    }
    const value = expr(statement);
    if (value?.type !== "CallExpression") return false;
    if (call(value, context, "save") && !value.arguments.length) { depth++; continue; }
    if (call(value, context, "restore") && !value.arguments.length && depth > 0) { depth--; continue; }
    if (call(value, context, "transform") && value.arguments.length === 6 && depth > 0) {
      try { if (value.arguments.every(argument => finite(literal(argument)))) continue; } catch { /* reject */ }
    }
    if (/^font\d+$/.test(id(value.callee)) && value.arguments.length === 3
      && id(value.arguments[0]) === context && inks.has(id(value.arguments[2])) && depth > 0) {
      try { if (typeof literal(value.arguments[1]) === "string") continue; } catch { /* reject */ }
    }
    return false;
  }
  return depth === 0 && inks.size > 0;
}

// All actual candidates have empty scale-nine maps. Refuse a renderer whose
// place() could introduce source clipping/repartitioning for either symbol.
function ordinaryPlacement(factory) {
  const declarations = new Map(), places = [];
  walk(factory, (node, owner) => {
    if (owner === factory && node.type === "VariableDeclarator" && id(node.id)) declarations.set(id(node.id), node);
    if (owner === factory && node.type === "VariableDeclarator" && id(node.id) === "place"
      && node.init?.type === "FunctionExpression") places.push(node.init);
  });
  if (places.length !== 1) return false;
  const maps = new Set(), first = id(places[0].params[0]);
  walk(places[0].body, node => {
    if (node.type === "MemberExpression" && node.computed && id(node.property) === first
      && id(node.object)) maps.add(id(node.object));
  });
  if (!maps.size) return false;
  for (const name of maps) {
    const init = declarations.get(name)?.init;
    if (init?.type !== "ObjectExpression" || init.properties.length) return false;
  }
  const locals = new Map();
  walk(factory, (node, owner) => {
    if (owner === factory || !owner) return;
    if (!locals.has(owner)) locals.set(owner, new Set(owner.params.map(id)));
    if (node.type === "VariableDeclarator") locals.get(owner).add(id(node.id));
  });
  let safe = true;
  walk(factory, (node, owner) => {
    const target = node.left ?? node.argument;
    const name = id(target) ?? id(target?.object);
    if ((node.type === "AssignmentExpression" || node.type === "UpdateExpression")
      && maps.has(name) && !locals.get(owner)?.has(name)) safe = false;
  });
  return safe;
}

/**
 * exactTextBounds must come from verified SWF DefineText records, not guessed
 * artwork bounds. This pure function does not recover or authenticate files.
 * Unrecognized wrappers/blocks are left byte-for-byte unchanged.
 */
export function patchNestedTextFilters(source, exactTextBounds) {
  if (!source.startsWith("// Mechanically converted FFDec 26.2.1 drawing code.")
    || !source.includes("Context lifecycle v2")
    || !source.includes(createCachedTextFilters.toString())) {
    throw new Error("Expected reviewed drawing with the current embedded source-density cache");
  }
  const ast = parse(source, { ecmaVersion: "latest", sourceType: "module" });
  const factory = ast.body.find(node => node.type === "ExportNamedDeclaration"
    && node.declaration?.type === "FunctionDeclaration" && id(node.declaration.id) === "createTimeline")?.declaration;
  if (!factory || !ordinaryPlacement(factory)) throw new Error("Unreviewed placement or scale-nine maps");
  const functions = new Map(), lists = [], initializers = [];
  walk(factory, (node, owner) => {
    if (node.type === "FunctionDeclaration" && /^text\d+$|^sprite\d+$/.test(id(node.id))) {
      if (functions.has(id(node.id))) throw new Error("Duplicate text/sprite function");
      functions.set(id(node.id), node);
    }
    // Only source timeline statement lists, never a helper's internal branches.
    if (owner && /^main$|^sprite\d+$/.test(id(owner.id))) {
      if (node.type === "BlockStatement") lists.push(node.body);
      if (node.type === "SwitchCase") lists.push(node.consequent);
    }
    if (node.type === "AssignmentExpression" && id(node.left) === "_timelineTextFilters"
      && id(node.right?.callee) === "createCachedTextFilters") initializers.push(node.right);
  });
  if (initializers.length !== 1 || initializers[0].arguments.length !== 1) throw new Error("Ambiguous text cache");
  const options = initializers[0].arguments[0];
  if (options.type !== "ObjectExpression" || options.properties.some(prop => prop.type !== "Property"
    || prop.computed || prop.kind !== "init" || prop.method)) throw new Error("Unknown text cache options");
  const property = key => options.properties.filter(prop => id(prop.key) === key);
  if (["place", "filters", "bounds", "enhanceContext", "createCanvas"].some(key => property(key).length !== 1)
    || ["place", "enhanceContext", "createCanvas"].some(key => id(property(key)[0].value) !== key)) {
    throw new Error("Unknown text cache bindings");
  }
  const filterOwner = id(property("filters")[0].value), cachedBounds = property("bounds")[0].value;
  if (!filterOwner || cachedBounds.type !== "ObjectExpression") throw new Error("Unknown text cache bounds");
  const leafBounds = new Map();
  for (const prop of cachedBounds.properties) {
    if (prop.type !== "Property" || prop.computed || prop.kind !== "init" || prop.method) continue;
    let key, value;
    try { key = id(prop.key) ?? literal(prop.key); value = literal(prop.value); } catch { continue; }
    if (!/^text\d+$/.test(key) || !bounds(value) || !bounds(exactTextBounds[key])
      || JSON.stringify(value) !== JSON.stringify(exactTextBounds[key])) continue;
    if (leafBounds.has(key)) throw new Error("Duplicate leaf bounds");
    leafBounds.set(key, value);
  }
  const wrappers = new Map();
  for (const [symbol, fn] of functions) {
    if (!/^sprite\d+$/.test(symbol) || fn.params.length !== 5 || fn.params.some(param => !id(param))
      || new Set(fn.params.map(id)).size !== 5 || fn.body.body.length !== 4) continue;
    const [scratch, count, normalize, dispatch] = fn.body.body;
    const sd = decl(scratch), cd = decl(count), normalized = expr(normalize);
    const [context, color, frame] = fn.params.map(id);
    if (!id(sd?.id) || !id(cd?.id) || id(sd.id) === id(cd.id)
      || fn.params.some(param => [id(sd.id), id(cd.id)].includes(id(param)))
      || sd.init?.type !== "ArrayExpression" || sd.init.elements.length || cd.init?.value !== 1
      || normalized?.type !== "AssignmentExpression" || normalized.operator !== "="
      || id(normalized.left) !== frame || normalized.right?.type !== "BinaryExpression"
      || normalized.right.operator !== "%" || id(normalized.right.left) !== frame
      || id(normalized.right.right) !== id(cd.id)
      || dispatch.type !== "SwitchStatement" || id(dispatch.discriminant) !== frame
      || dispatch.cases.length !== 1 || dispatch.cases[0].test?.value !== 0) continue;
    const statements = dispatch.cases[0].consequent, inner = expr(statements[0]);
    if (statements.length !== 2 || statements[1].type !== "BreakStatement" || statements[1].label
      || !call(inner, "_timelineTextFilters", "draw") || inner.arguments.length !== 6
      || id(inner.arguments[2]) !== context || id(inner.arguments[4]) !== color) continue;
    let text, transform, chain;
    try { [text, transform, chain] = [inner.arguments[0], inner.arguments[3], inner.arguments[5]].map(literal); } catch { continue; }
    if (!leafBounds.has(text) || !functions.has(text) || !plainText(functions.get(text))
      || !matrix(transform) || !values(inner.arguments[3].elements.slice(0, 4), [1, 0, 0, 1])
      || !chainValid(chain) || !id(inner.arguments[1])
      || [...fn.params.map(id), id(sd.id), id(cd.id)].includes(id(inner.arguments[1]))) continue;
    wrappers.set(symbol, { text, transform, chain, root: id(inner.arguments[1]) });
  }
  const edits = [], matches = [];
  for (const statements of lists) for (let i = 0; i < statements.length; i++) {
    const previous = decl(statements[i]), image = decl(statements[i + 1]), target = decl(statements[i + 2]);
    const context = id(previous?.init), saved = id(previous?.id), layer = id(image?.id), temp = id(target?.id);
    if (!context || !saved || !layer || !temp || new Set([context, saved, layer, temp]).size !== 4
      || id(image?.init?.callee) !== "createCanvas" || image.init.arguments.length !== 2
      || !call(target?.init, layer, "getContext") || !values(target.init.arguments, ["2d"])) continue;
    const root = id(image.init.arguments[0]?.object);
    if (!root || [context, saved, layer, temp].includes(root)
      || !member(image.init.arguments[0], root, "width") || !member(image.init.arguments[1], root, "height")) continue;
    const enhance = expr(statements[i + 3]), apply = expr(statements[i + 4]), assign = expr(statements[i + 5]);
    if (id(enhance?.callee) !== "enhanceContext" || enhance.arguments.length !== 1 || id(enhance.arguments[0]) !== temp
      || !call(apply, temp, "applyTransforms") || apply.arguments.length !== 1 || !member(apply.arguments[0], context, "_matrix")
      || assign?.type !== "AssignmentExpression" || assign.operator !== "=" || id(assign.left) !== context || id(assign.right) !== temp) continue;
    const placed = expr(statements[i + 6]);
    if (id(placed?.callee) !== "place" || placed.arguments.length !== 9) continue;
    let symbol, outer;
    try { symbol = literal(placed.arguments[0]); outer = literal(placed.arguments[3]); } catch { continue; }
    const wrapper = wrappers.get(symbol);
    if (!wrapper || wrapper.root !== root || id(placed.arguments[1]) !== root || id(placed.arguments[2]) !== context
      || !matrix(outer) || !pureColor(placed.arguments[4]) || !values(placed.arguments.slice(5, 6), [1])
      || !placed.arguments.slice(6).every(pureNumber)) continue;
    let end = i + 7;
    const outerChain = [];
    while (end < statements.length) {
      const assignment = expr(statements[end]), applied = assignment?.right;
      if (assignment?.type !== "AssignmentExpression" || assignment.operator !== "=" || id(assignment.left) !== layer
        || applied?.type !== "CallExpression" || !["glow", "dropShadow"].includes(id(applied.callee?.property))
        || !member(applied.callee, filterOwner, id(applied.callee.property)) || id(applied.arguments[0]) !== layer
        || !call(applied.arguments[1], layer, "getContext") || !values(applied.arguments[1].arguments, ["2d"])) break;
      let item;
      try { item = [id(applied.callee.property), ...applied.arguments.slice(2).map(literal)]; } catch { break; }
      if (!chainValid([item])) break;
      outerChain.push(item); end++;
    }
    if (!chainValid(outerChain) || wrapper.chain.length + outerChain.length > 4) continue;
    const restore = expr(statements[end]), ctm = decl(statements[end + 1]), identity = expr(statements[end + 2]);
    const draw = expr(statements[end + 3]), resume = expr(statements[end + 4]);
    if (restore?.type !== "AssignmentExpression" || restore.operator !== "=" || id(restore.left) !== context
      || id(restore.right) !== saved || !id(ctm?.id) || !member(ctm.init, context, "_matrix")
      || !call(identity, context, "setTransform") || !values(identity.arguments, [1, 0, 0, 1, 0, 0])
      || !call(draw, context, "drawImage") || id(draw.arguments[0]) !== layer || !values(draw.arguments.slice(1), [0, 0])
      || !call(resume, context, "applyTransforms") || resume.arguments.length !== 1 || id(resume.arguments[0]) !== id(ctm.id)) continue;
    const [a, b, c, d, x, y] = outer, [, , , , tx, ty] = wrapper.transform;
    const combined = [a, b, c, d, a * tx + c * ty + x, b * tx + d * ty + y];
    if (!combined.every(finite)) continue;
    const color = source.slice(placed.arguments[4].start, placed.arguments[4].end), chain = [...wrapper.chain, ...outerChain];
    edits.push({ start: statements[i].start, end: statements[end + 4].end,
      text: `_timelineTextFilters.draw(${JSON.stringify(wrapper.text)},${root},${context},${JSON.stringify(combined)},${color},${JSON.stringify(chain)});` });
    matches.push({ wrapper: symbol, text: wrapper.text, matrix: combined, chain });
    i = end + 4;
  }
  let result = source, lastStart = source.length;
  for (const edit of edits.sort((a, b) => b.start - a.start)) {
    if (edit.end > lastStart) throw new Error("Overlapping nested filter rewrite");
    result = result.slice(0, edit.start) + edit.text + result.slice(edit.end);
    lastStart = edit.start;
  }
  parse(result, { ecmaVersion: "latest", sourceType: "module" });
  return { source: result, groups: edits.length, matches };
}
