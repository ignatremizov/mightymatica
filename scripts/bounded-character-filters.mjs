// Offline crop proof for explicitly reviewed finite character timelines.
// Root targets/counts/effects are supplied by source-specific adapters. This
// is neither arbitrary drawing-code support nor a Flash/AS interpreter.
import { parse } from "acorn";
import { createHash } from "node:crypto";
import { createCachedTextFilters } from "../src/shared/CachedTextFilters.mjs";
import { bitmapFillLeaf, decodedEmbeddedImages } from "./optimize-calculus-filters.mjs";

const id = node => node?.type === "Identifier" ? node.name : null;
const expr = node => node?.type === "ExpressionStatement" ? node.expression : null;
const decl = node => node?.type === "VariableDeclaration" && node.kind === "var"
  && node.declarations.length === 1 ? node.declarations[0] : null;
function value(node) {
  if (node?.type === "Literal") return node.value;
  if (node?.type === "TemplateLiteral" && !node.expressions.length) return node.quasis[0].value.cooked;
  if (node?.type === "UnaryExpression" && node.operator === "-") return -value(node.argument);
  if (node?.type === "ArrayExpression") return node.elements.map(value);
  throw new Error("Expected constant source artwork.");
}
function isValue(node, expected) {
  try { return JSON.stringify(value(node)) === JSON.stringify(expected); } catch { return false; }
}
const member = (node, object, key) => node?.type === "MemberExpression" && !node.computed
  && id(node.object) === object && id(node.property) === key;
const method = (node, object, key) => node?.type === "CallExpression" && member(node.callee, object, key);
function walk(node, visit, owner = null) {
  if (!node?.type) return;
  if (["FunctionDeclaration", "FunctionExpression", "ArrowFunctionExpression"].includes(node.type)) owner = node;
  visit(node, owner);
  for (const child of Object.values(node)) {
    if (Array.isArray(child)) child.forEach(item => walk(item, visit, owner));
    else if (child?.type) walk(child, visit, owner);
  }
}
const validBounds = bounds => Array.isArray(bounds) && bounds.length === 4
  && bounds.every(Number.isFinite) && bounds[0] < bounds[2] && bounds[1] < bounds[3];
const union = (a, b) => [Math.min(a[0], b[0]), Math.min(a[1], b[1]),
  Math.max(a[2], b[2]), Math.max(a[3], b[3])];
const empty = () => [Infinity, Infinity, -Infinity, -Infinity];
const multiply = (a, b) => [
  a[0] * b[0] + a[2] * b[1], a[1] * b[0] + a[3] * b[1],
  a[0] * b[2] + a[2] * b[3], a[1] * b[2] + a[3] * b[3],
  a[0] * b[4] + a[2] * b[5] + a[4], a[1] * b[4] + a[3] * b[5] + a[5],
];
function transformed(bounds, matrix) {
  const [x0, y0, x1, y1] = bounds;
  let result = empty();
  for (const [x, y] of [[x0, y0], [x1, y0], [x0, y1], [x1, y1]]) {
    const px = matrix[0] * x + matrix[2] * y + matrix[4];
    const py = matrix[1] * x + matrix[3] * y + matrix[5];
    result = union(result, [px, py, px, py]);
  }
  return result;
}
function matrix(node) {
  const result = value(node);
  if (!Array.isArray(result) || result.length !== 6 || !result.every(Number.isFinite)
    || result.some(number => Math.abs(number) > 20_000)) throw new Error("Unbounded artwork transform.");
  return result;
}

// These are convex bounds of the actual M/L/Q data, unioned with the original
// SWF ShapeBounds. Including quadratic control points is conservative, rather
// than estimating the changing outline from a screenshot.
function pathBounds(path) {
  if (typeof path !== "string" || !/^[MLQZ0-9eE+.,\s-]+$/.test(path)) throw new Error("Unsupported source path.");
  const numbers = path.replace(/[MLQZ]/g, " ").trim().split(/[\s,]+/).filter(Boolean).map(Number);
  if (!numbers.length || numbers.length % 2 || !numbers.every(Number.isFinite)) throw new Error("Invalid source path.");
  let result = empty();
  for (let index = 0; index < numbers.length; index += 2) {
    result = union(result, [numbers[index], numbers[index + 1], numbers[index], numbers[index + 1]]);
  }
  return result;
}
function paint(node, color) {
  if (id(node?.callee) !== "tocolor" || node.arguments.length !== 1) return false;
  const applied = node.arguments[0];
  if (!method(applied, color, "apply") || applied.arguments.length !== 1) return false;
  try {
    const rgba = value(applied.arguments[0]);
    return Array.isArray(rgba) && rgba.length === 4 && rgba.every(Number.isFinite);
  } catch { return false; }
}
const assigned = (statement, context, property) => {
  const assignment = expr(statement);
  return assignment?.type === "AssignmentExpression" && assignment.operator === "="
    && member(assignment.left, context, property) ? assignment.right : null;
};
function leaf(fn, originalBounds, decoded, bitmapCandidates) {
  if (!validBounds(originalBounds) || fn.params.length !== 5 || fn.params.some(param => !id(param))) {
    throw new Error("Missing source-verified shape bounds.");
  }
  const [context, color] = fn.params.map(id);
  const statements = fn.body.body;
  let bounds = [...originalBounds], stroke = 0, index = 0;
  while (index < statements.length) {
    const path = decl(statements[index]);
    if (!path || !id(path.id)) throw new Error("Unknown shape statement.");
    bounds = union(bounds, pathBounds(value(path.init)));
    const bitmap = bitmapCandidates.find(candidate => candidate.fn.id.name === fn.id.name
      && candidate.fn.body.body[0] === statements[index]);
    if (bitmap) {
      if (!decoded.has(bitmap.image)) throw new Error("Unverified embedded image lifetime.");
      index += 11;
      continue;
    }
    const draw = offset => {
      const call = expr(statements[index + offset]);
      return id(call?.callee) === "drawPath" && id(call.arguments[0]) === context
        && id(call.arguments[1]) === id(path.id) ? call : null;
    };
    const filled = draw(2), fill = expr(statements[index + 3]);
    if (paint(assigned(statements[index + 1], context, "fillStyle"), color)
      && filled?.arguments.length === 3 && isValue(filled.arguments[2], false)
      && method(fill, context, "fill") && fill.arguments.length === 1
      && isValue(fill.arguments[0], "evenodd")) {
      index += 4;
      continue;
    }
    const mode = decl(statements[index + 1]), stroked = draw(6);
    const width = assigned(statements[index + 3], context, "lineWidth");
    if (mode && isValue(mode.init, "NORMAL")
      && paint(assigned(statements[index + 2], context, "strokeStyle"), color)
      && isValue(assigned(statements[index + 4], context, "lineCap"), "round")
      && isValue(assigned(statements[index + 5], context, "lineJoin"), "round")
      && stroked?.arguments.length === 4 && isValue(stroked.arguments[2], true)
      && id(stroked.arguments[3]) === id(mode.id) && Number.isFinite(value(width))
      && value(width) > 0 && value(width) <= 2) {
      stroke = Math.max(stroke, value(width));
      index += 7;
      continue;
    }
    throw new Error("Unreviewed shape painting, mask, filter or stroke.");
  }
  if (!statements.length || !validBounds(bounds)) throw new Error("Empty character shape.");
  return { bounds, stroke };
}
function frameExpression(node, time, count) {
  return node?.type === "BinaryExpression" && node.operator === "%" && isValue(node.right, count)
    && node.left?.type === "BinaryExpression" && node.left.operator === "+"
    && Number.isInteger(value(node.left.left)) && id(node.left.right) === time;
}
function placements(fn, count, rootCanvas) {
  if (!fn || fn.params.length !== 5 || fn.params.some(param => !id(param))
    || new Set(fn.params.map(id)).size !== 5 || fn.body.body.length !== 4) throw new Error("Unknown sprite structure.");
  const [scratch, size, normalized, dispatch] = fn.body.body;
  const [context, color, frame, , time] = fn.params.map(id);
  const a = decl(scratch), b = decl(size), normalize = expr(normalized);
  if (!a || !b || a.init?.type !== "ArrayExpression" || a.init.elements.length || !isValue(b.init, count)
    || !id(a.id) || !id(b.id) || id(a.id) === id(b.id)
    || fn.params.some(param => [id(a.id), id(b.id)].includes(id(param)))
    || normalize?.type !== "AssignmentExpression" || normalize.operator !== "=" || id(normalize.left) !== frame
    || normalize.right?.type !== "BinaryExpression" || normalize.right.operator !== "%"
    || id(normalize.right.left) !== frame || id(normalize.right.right) !== id(b.id)
    || dispatch.type !== "SwitchStatement" || id(dispatch.discriminant) !== frame
    || dispatch.cases.length !== count) throw new Error("Unknown sprite clock.");
  return dispatch.cases.map((entry, index) => {
    if (!isValue(entry.test, index) || entry.consequent.length < 2
      || entry.consequent.at(-1).type !== "BreakStatement" || entry.consequent.at(-1).label) {
      throw new Error("Unknown sprite dispatch.");
    }
    return entry.consequent.slice(0, -1).map(statement => {
      const call = expr(statement), args = call?.arguments;
      if (id(call?.callee) !== "place" || args.length !== 9 || id(args[1]) !== rootCanvas
        || id(args[2]) !== context || id(args[4]) !== color || !isValue(args[5], 1)
        || !(isValue(args[6], 0) || frameExpression(args[6], time, 1))
        || !isValue(args[7], 0) || id(args[8]) !== time) throw new Error("Unknown character child placement.");
      return { symbol: value(args[0]), matrix: matrix(args[3]) };
    });
  });
}

export function patchBoundedCharacterFilters(source, sourceBounds, {
  marker, cacheName, targets, shadow, width = 550, height = 400,
}) {
  if (typeof marker !== "string" || !marker.startsWith("// ") || /[\r\n]/.test(marker)
    || !/^_[A-Za-z][A-Za-z0-9]*$/.test(cacheName)
    || !targets || Object.keys(targets).length < 1 || Object.keys(targets).length > 5
    || Object.entries(targets).some(([symbol, count]) => !/^sprite\d+$/.test(symbol) || ![49, 50].includes(count))
    || !Array.isArray(shadow) || shadow.length !== 9 || shadow[5] !== false || shadow[8] !== false
    || !Number.isInteger(shadow[6]) || shadow[6] < 1 || shadow[6] > 3
    || !shadow.slice(0, 4).every(Number.isFinite)
    || !shadow.slice(0, 2).every(number => number >= 0 && number <= 64)
    || !Array.isArray(shadow[4]) || shadow[4].length !== 4 || !shadow[4].every(Number.isFinite)
    || !Number.isFinite(shadow[7]) || shadow[7] < 0
    || !Number.isInteger(width) || !Number.isInteger(height) || width < 1 || height < 1) {
    throw new Error("Invalid bounded character review contract.");
  }
  const ast = parse(source, { ecmaVersion: "latest", sourceType: "module" });
  const factory = ast.body.find(node => node.type === "ExportNamedDeclaration"
    && node.declaration?.id?.name === "createTimeline")?.declaration;
  if (!factory || !source.startsWith("// Mechanically converted FFDec 26.2.1 drawing code.")
    || !source.includes("Context lifecycle v2")) throw new Error("Expected reviewed native renderer.");
  const functions = new Map(), lists = [], awaits = [];
  walk(factory, (node, owner) => {
    if (node.type === "FunctionDeclaration") functions.set(node.id.name, node);
    if (node.type === "SwitchCase" && owner?.id?.name === "main") lists.push(node.consequent);
    if (node.type === "ExpressionStatement" && node.expression.type === "AwaitExpression" && owner === factory) awaits.push(node);
  });
  if (awaits.length !== 1 || !functions.has("_timelineRelease") || !functions.has("createCachedTextFilters")) {
    throw new Error("Unknown renderer/cache lifetime.");
  }
  const bitmapCandidates = [];
  for (const [name, fn] of functions) {
    if (!/^(shape|image)\d+$/.test(name)) continue;
    for (let index = 0; index + 11 <= fn.body.body.length; index++) {
      const candidate = bitmapFillLeaf({ ...fn, body: { ...fn.body, body: fn.body.body.slice(index, index + 11) } });
      if (candidate) bitmapCandidates.push(candidate);
    }
  }
  const helper = functions.get("createCachedTextFilters");
  const helperSource = source.slice(helper.start, helper.end);
  if (helperSource !== createCachedTextFilters.toString()
    && createHash("sha256").update(helperSource).digest("hex")
      !== "36753ef638523beaa8ae595b91a71c62607ea44775aa374ef6e6dda2098d88fa") {
    throw new Error("Unreviewed existing drawing cache.");
  }
  // The verified helper does not capture factory image bindings. Its own
  // destructured x/y variables must not be confused with minified image names.
  const imageScope = { ...factory, body: { ...factory.body,
    body: factory.body.body.filter(statement => statement !== helper) } };
  const decoded = decodedEmbeddedImages(imageScope, awaits[0], bitmapCandidates);
  const leaves = new Map(), visited = new Set();
  const bounds = {}, poseBounds = {};
  function bound(symbol, parent, stack) {
    if (stack.has(symbol)) throw new Error("Cyclic character artwork.");
    const fn = functions.get(symbol);
    if (!fn) throw new Error("Missing original character function.");
    visited.add(symbol);
    if (/^shape\d+$/.test(symbol)) {
      if (!leaves.has(symbol)) leaves.set(symbol, leaf(fn, sourceBounds[symbol], decoded, bitmapCandidates));
      const item = leaves.get(symbol), result = transformed(item.bounds, parent);
      // The character uses round NORMAL strokes. A full stroke width times
      // the matrix's absolute linear sum conservatively bounds the exporter's
      // diagonal-based pen, including the changing anisotropic limb poses.
      const padding = 20 * item.stroke * parent.slice(0, 4).reduce((sum, number) => sum + Math.abs(number), 0);
      return [result[0] - padding, result[1] - padding, result[2] + padding, result[3] + padding];
    }
    if (!/^sprite\d+$/.test(symbol)) throw new Error("Unsupported character child.");
    let bounds = empty();
    const next = new Set([...stack, symbol]);
    for (const placed of placements(fn, 1, id(factory.params[0]))[0]) {
      bounds = union(bounds, bound(placed.symbol, multiply(parent, placed.matrix), next));
    }
    return bounds;
  }
  for (const [symbol, count] of Object.entries(targets)) {
    const poses = placements(functions.get(symbol), count, id(factory.params[0]));
    bounds[symbol] = empty();
    poseBounds[symbol] = [];
    for (const pose of poses) {
      let current = empty();
      for (const placed of pose) current = union(current, bound(placed.symbol, placed.matrix, new Set([symbol])));
      poseBounds[symbol].push(current);
      bounds[symbol] = union(bounds[symbol], current);
    }
    if (!validBounds(bounds[symbol])) throw new Error("Missing finite character bounds.");
  }
  if (source.includes(marker)) {
    if (!source.includes(createCachedTextFilters.toString())
      || !source.includes(`bounds:${JSON.stringify(bounds)}`)
      || !source.includes(`${cacheName}?.dispose();`)) throw new Error("Partial animated-shadow patch.");
    return { source, groups: 0, bounds, poseBounds, symbols: [...visited] };
  }
  if (source.includes(cacheName)) throw new Error("Unexpected animated cache.");
  const edits = [], owners = new Set();
  for (const statements of lists) for (let index = 0; index < statements.length; index++) {
    const placed = expr(statements[index + 6]);
    if (id(placed?.callee) !== "place") continue;
    const symbol = value(placed.arguments[0]);
    if (!Object.hasOwn(targets, symbol)) continue;
    const args = placed.arguments;
    const previous = decl(statements[index]), layer = decl(statements[index + 1]), target = decl(statements[index + 2]);
    const context = id(previous?.init), root = id(factory.params[0]), temp = id(target?.id), image = id(layer?.id);
    const enhance = expr(statements[index + 3]), apply = expr(statements[index + 4]), redirect = expr(statements[index + 5]);
    const effect = expr(statements[index + 7]), filter = effect?.right;
    const restore = expr(statements[index + 8]), saved = decl(statements[index + 9]);
    const identity = expr(statements[index + 10]), draw = expr(statements[index + 11]), resume = expr(statements[index + 12]);
    const placement = matrix(args[3]);
    if (args.length !== 9 || !context || !image || !temp
      || id(layer.init?.callee) !== "createCanvas" || layer.init.arguments.length !== 2
      || !member(layer.init.arguments[0], root, "width") || !member(layer.init.arguments[1], root, "height")
      || !method(target.init, image, "getContext") || !isValue(target.init.arguments[0], "2d")
      || id(enhance?.callee) !== "enhanceContext" || id(enhance.arguments[0]) !== temp
      || !method(apply, temp, "applyTransforms") || !member(apply.arguments[0], context, "_matrix")
      || redirect?.type !== "AssignmentExpression" || redirect.operator !== "="
      || id(redirect.left) !== context || id(redirect.right) !== temp
      || id(args[1]) !== root || id(args[2]) !== context || !isValue(args[5], 1)
      || placement[1] !== 0 || placement[2] !== 0 || placement[0] === 0
      || Math.abs(placement[0]) !== Math.abs(placement[3])
      || !frameExpression(args[6], id(functions.get("main").params[4]), targets[symbol])
      || !Number.isInteger(value(args[7])) || id(args[8]) !== id(functions.get("main").params[4])
      || effect?.type !== "AssignmentExpression" || effect.operator !== "=" || id(effect.left) !== image
      || filter?.type !== "CallExpression" || id(filter.callee.property) !== "dropShadow"
      || filter.callee.computed || !id(filter.callee.object) || filter.arguments.length !== 11
      || id(filter.arguments[0]) !== image || !method(filter.arguments[1], image, "getContext")
      || !isValue(filter.arguments[1].arguments[0], "2d")
      || !isValue({ type: "ArrayExpression", elements: filter.arguments.slice(2) }, shadow)
      || restore?.type !== "AssignmentExpression" || restore.operator !== "="
      || id(restore.left) !== context || id(restore.right) !== id(previous.id)
      || !member(saved?.init, context, "_matrix")
      || !method(identity, context, "setTransform") || identity.arguments.length !== 6
      || !isValue({ type: "ArrayExpression", elements: identity.arguments }, [1, 0, 0, 1, 0, 0])
      || !method(draw, context, "drawImage") || draw.arguments.length !== 3 || id(draw.arguments[0]) !== image
      || !isValue(draw.arguments[1], 0) || !isValue(draw.arguments[2], 0)
      || !method(resume, context, "applyTransforms") || id(resume.arguments[0]) !== id(saved.id)) {
      throw new Error("Unreviewed animated-shadow isolation.");
    }
    owners.add(id(filter.callee.object));
    const slice = argument => source.slice(argument.start, argument.end);
    edits.push({ start: statements[index].start, end: statements[index + 12].end,
      text: `${cacheName}.draw(${JSON.stringify(symbol)},${root},${context},${slice(args[3])},${slice(args[4])},${JSON.stringify([["dropShadow", ...shadow]])},[${args.slice(6).map(slice).join(",")}]);` });
    index += 12;
  }
  const groups = edits.length;
  if (!groups || owners.size !== 1) throw new Error("Missing or ambiguous animated-shadow groups.");
  edits.push({ start: helper.start, end: helper.end, text: createCachedTextFilters.toString() });
  edits.push({ start: factory.body.start + 1, end: factory.body.start + 1,
    text: `\n${marker}\nlet ${cacheName}=null;\n` });
  const release = functions.get("_timelineRelease");
  edits.push({ start: release.body.start + 1, end: release.body.start + 1, text: `${cacheName}?.dispose();` });
  edits.push({ start: awaits[0].start, end: awaits[0].start,
    text: `${cacheName}=createCachedTextFilters({place,filters:${[...owners][0]},enhanceContext,createCanvas,bounds:${JSON.stringify(bounds)},width:${width},height:${height},maxPixels:262144,maxEntries:4});\n` });
  let cursor = 0;
  const parts = [];
  for (const edit of edits.sort((a, b) => a.start - b.start)) {
    if (edit.start < cursor) throw new Error("Overlapping animated-shadow edits.");
    parts.push(source.slice(cursor, edit.start), edit.text);
    cursor = edit.end;
  }
  parts.push(source.slice(cursor));
  const result = parts.join("");
  parse(result, { ecmaVersion: "latest", sourceType: "module" });
  return { source: result, groups, bounds, poseBounds, symbols: [...visited] };
}
