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
function literalString(node) {
  try {
    const value = literal(node);
    return typeof value === "string" ? value : null;
  } catch { return null; }
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

// Closed FFDec bitmap-fill leaf. Clipping is permitted ONLY in this balanced
// grammar: it clips a decoded immutable embedded image to authoritative
// ShapeBounds, before two constant pattern-space transforms. No strokes/masks,
// dynamic image sources or arbitrary Canvas clipping enter the cache.
export function bitmapFillLeaf(fn) {
  if (fn.params.length !== 5 || fn.params.some(param => !name(param))
    || new Set(fn.params.map(name)).size !== 5 || fn.body.body.length !== 11) return null;
  const [pathStatement, pathCall, save, clip, first, second, imageStatement,
    patternStatement, style, fill, restore] = fn.body.body;
  const path = declaration(pathStatement), image = declaration(imageStatement), pattern = declaration(patternStatement);
  const context = name(fn.params[0]), color = name(fn.params[1]);
  const locals = [path, image, pattern].map(decl => name(decl?.id));
  if (locals.some(local => !local || fn.params.some(param => name(param) === local))
    || new Set(locals).size !== 3 || [pathStatement, imageStatement, patternStatement].some(node => node.kind !== "var")) return null;
  const pathValue = literalString(path.init);
  const draw = expression(pathCall);
  if (!pathValue || !/^[MLQClqcmzZ0-9eE+.,\s-]*$/.test(pathValue)
    || name(draw?.callee) !== "drawPath" || draw.arguments.length !== 3
    || name(draw.arguments[0]) !== context || name(draw.arguments[1]) !== locals[0]
    || !matchesValues(draw.arguments.slice(2), [false])) return null;
  for (const [statement, method] of [[save, "save"], [clip, "clip"], [restore, "restore"]]) {
    const invoked = expression(statement);
    if (!call(invoked, context, method) || invoked.arguments.length) return null;
  }
  for (const statement of [first, second]) {
    const transform = expression(statement);
    if (!call(transform, context, "transform") || transform.arguments.length !== 6
      || !transform.arguments.every(argument => {
        try { return Number.isFinite(literal(argument)); } catch { return false; }
      })) return null;
  }
  const input = image.init;
  if (!call(input, color, "applyToImage") || input.arguments.length !== 1 || !name(input.arguments[0])) return null;
  if (!call(pattern.init, context, "createPattern") || pattern.init.arguments.length !== 2
    || name(pattern.init.arguments[0]) !== locals[1]
    || !matchesValues(pattern.init.arguments.slice(1), ["repeat"])) return null;
  const assignment = expression(style), filled = expression(fill);
  if (assignment?.type !== "AssignmentExpression" || assignment.operator !== "="
    || !member(assignment.left, context, "fillStyle") || name(assignment.right) !== locals[2]
    || !call(filled, context, "fillRect") || !matchesValues(filled.arguments, [-16384, -16384, 32768, 32768])) return null;
  let safe = true;
  walk(fn.body, node => {
    if (node.type === "Identifier" && fn.params.slice(2).some(param => name(param) === node.name)) safe = false;
  });
  if (!safe || locals.includes(name(input.arguments[0])) || fn.params.some(param => name(param) === name(input.arguments[0]))) return null;
  return { fn, image: name(input.arguments[0]), reference: input.arguments[0] };
}

export function decodedEmbeddedImages(factory, awaited, candidates) {
  const all = awaited.expression.argument;
  const mapped = call(all, "Promise", "all") && all.arguments.length === 1 ? all.arguments[0] : null;
  const callback = mapped?.arguments?.[0];
  if (mapped?.type !== "CallExpression" || mapped.callee?.type !== "MemberExpression"
    || mapped.callee.computed || name(mapped.callee.property) !== "map" || mapped.callee.object.type !== "ArrayExpression"
    || mapped.arguments.length !== 1 || callback?.type !== "ArrowFunctionExpression"
    || callback.async || callback.params.length !== 1 || !name(callback.params[0])
    || !call(callback.body, name(callback.params[0]), "decode") || callback.body.arguments.length) return new Set();
  const decoded = mapped.callee.object.elements;
  if (decoded.some(node => !name(node))) return new Set();
  let decodeBlock = null;
  function unconditionalBlock(node) {
    if (node?.type !== "BlockStatement") return;
    if (node.body.includes(awaited)) decodeBlock = node;
    for (const statement of node.body) {
      if (statement.type === "BlockStatement") unconditionalBlock(statement);
      // Preparation may be wrapped in the reviewed teardown-on-error try.
      // Conditional/loop/catch/finally decode paths are not accepted.
      if (statement.type === "TryStatement") unconditionalBlock(statement.block);
    }
  }
  unconditionalBlock(factory.body);
  if (!decodeBlock) return new Set();
  let earlyReturn = false;
  walk(factory, (node, owner) => {
    if (owner === factory && node.type === "ReturnStatement"
      && (node.start < awaited.end || !decodeBlock.body.includes(node))) earlyReturn = true;
    if (owner === factory && node.type === "VariableDeclarator" && ["document", "Promise"].includes(name(node.id))) earlyReturn = true;
    if (node.type === "AssignmentExpression"
      && (member(node.left, "document", "createElement") || member(node.left, "Promise", "all"))) earlyReturn = true;
  });
  if (earlyReturn) return new Set();
  const result = new Set();
  for (const image of new Set(candidates.map(candidate => candidate.image))) {
    const bindings = [], sources = [];
    walk(factory, (node, owner) => {
      if (owner !== factory) return;
      if (node.type === "VariableDeclarator" && name(node.id) === image) bindings.push(node);
      if (node.type === "AssignmentExpression" && member(node.left, image, "src")) sources.push(node);
    });
    if (bindings.length !== 1 || sources.length !== 1 || name(factory.params[0]) === image) continue;
    const binding = bindings[0], source = sources[0];
    if (!call(binding.init, "document", "createElement") || !matchesValues(binding.init.arguments, ["img"])
      || source.operator !== "=" || binding.end > source.start || source.end > awaited.start
      || !/^data:image\/(?:png|jpeg|gif|webp);base64,[a-z0-9+/]+={0,2}$/i.test(literalString(source.right) ?? "")) continue;
    const decodedRefs = decoded.filter(node => name(node) === image);
    if (decodedRefs.length !== 1) continue;
    const allowed = new Set([binding.id, source.left.object, ...decodedRefs,
      ...candidates.filter(candidate => candidate.image === image).map(candidate => candidate.reference)]);
    // The reviewed lifecycle releases embedded resources only after disposing
    // the cache. Permit this exact cleanup loop, not arbitrary image mutation.
    walk(factory, (node, owner) => {
      if (owner?.id?.name !== "_timelineRelease" || node.type !== "ForOfStatement" || node.await
        || node.left.type !== "VariableDeclaration" || node.left.kind !== "const"
        || node.left.declarations.length !== 1 || node.left.declarations[0].init
        || !name(node.left.declarations[0].id) || node.right.type !== "ArrayExpression") return;
      const members = node.right.elements;
      if (members.length !== decoded.length || members.some((member, index) => name(member) !== name(decoded[index]))) return;
      const chained = expression(node.body);
      const removal = chained?.type === "ChainExpression" ? chained.expression : null;
      if (!call(removal, name(node.left.declarations[0].id), "removeAttribute")
        || !removal.callee.optional || !matchesValues(removal.arguments, ["src"])) return;
      for (const reference of members) if (name(reference) === image) allowed.add(reference);
    });
    // Minified helpers reuse short names. Resolve the factory image binding
    // conservatively: skip a nested function only when it owns that name.
    function owns(fn) {
      if (name(fn.id) === image || fn.params.some(param => name(param) === image)) return true;
      if (fn.body.type === "BlockStatement"
        && fn.body.body.some(node => node.type === "FunctionDeclaration" && name(node.id) === image)) return true;
      let found = false;
      function scan(node) {
        if (!node?.type) return;
        if (node !== fn.body && ["FunctionDeclaration", "FunctionExpression", "ArrowFunctionExpression"].includes(node.type)) {
          return;
        }
        // var is function-scoped; let/const may shadow only an inner block.
        // Do not skip the whole function for a block-local name: such ambiguous
        // references conservatively fail the allowed-reference check instead.
        if (node.type === "VariableDeclaration" && node.kind === "var"
          && node.declarations.some(decl => name(decl.id) === image)) found = true;
        for (const value of Object.values(node)) {
          if (Array.isArray(value)) value.forEach(scan);
          else if (value?.type) scan(value);
        }
      }
      scan(fn.body);
      return found;
    }
    let safe = true;
    function references(node, parent = null) {
      if (!node?.type) return;
      if (node !== factory && ["FunctionDeclaration", "FunctionExpression", "ArrowFunctionExpression"].includes(node.type)
        && owns(node)) return;
      if (node.type === "CatchClause" && name(node.param) === image) return;
      if (node.type === "Identifier" && node.name === image) {
        const propertyKey = parent?.type === "MemberExpression" && parent.property === node && !parent.computed
          || parent?.type === "Property" && parent.key === node && !parent.computed && !parent.shorthand;
        if (!propertyKey && !allowed.has(node)) safe = false;
      }
      for (const value of Object.values(node)) {
        if (Array.isArray(value)) value.forEach(child => references(child, node));
        else if (value?.type) references(value, node);
      }
    }
    references(factory);
    if (safe) result.add(image);
  }
  return result;
}

// bounds is a flat source-space map. textN-only maps preserve the original
// caption contract; adding authoritative shapeN entries enables verified
// straight-line vector leaves and recursive placement-only composites.
// Use recoverStaticDrawingBounds, not guessed visual rectangles, for shapes.
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
  const texts = new Map(), shapes = new Map(), images = new Map(), sprites = new Map(), lists = [], releases = [], awaits = [], initializers = [];
  walk(factory, (node, owner) => {
    if (node.type === "FunctionDeclaration" && /^text\d+$/.test(node.id?.name)) texts.set(node.id.name, node);
    if (node.type === "FunctionDeclaration" && /^shape\d+$/.test(node.id?.name)) shapes.set(node.id.name, node);
    if (node.type === "FunctionDeclaration" && /^image\d+$/.test(node.id?.name)) images.set(node.id.name, node);
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
  const compositeLeaves = new Set();
  const staticBounds = { ...bounds };
  const validBounds = value => Array.isArray(value) && value.length === 4
    && value.every(Number.isFinite) && value[0] <= value[2] && value[1] <= value[3];
  // Raw imageN helpers share embedded bindings with shapeN wrappers. Their
  // references are permitted only when the same full closed grammar matches;
  // imageN itself never qualifies for a source-ShapeBounds crop.
  const bitmapLeaves = [...shapes.values(), ...images.values()].map(bitmapFillLeaf).filter(Boolean);
  const embeddedImages = decodedEmbeddedImages(factory, awaits[0], bitmapLeaves);
  for (const candidate of bitmapLeaves) {
    const symbol = candidate.fn.id.name;
    if (/^shape\d+$/.test(symbol) && validBounds(bounds[symbol]) && embeddedImages.has(candidate.image)) {
      staticTexts.add(symbol);
      compositeLeaves.add(symbol);
    }
  }
  for (const [symbol, fn] of texts) {
    if (!validBounds(bounds[symbol]) || fn.params.length !== 5) continue;
    const unused = new Set(fn.params.slice(2).map(name));
    let safe = true;
    walk(fn.body, node => {
      if (node.type === "Identifier" && unused.has(node.name)) safe = false;
      if (node.type === "CallExpression" && name(node.callee) === "place") safe = false;
    });
    if (safe) {
      staticTexts.add(symbol);
      // Existing text-only eligibility stays unchanged. New composites use a
      // stricter leaf set so an inner filter or script call cannot be hidden
      // inside a supposedly plain text child.
      let plain = true;
      const context = name(fn.params[0]), color = name(fn.params[1]);
      const inkNames = new Set();
      for (const statement of fn.body.body) {
        if (statement.type === "VariableDeclaration" && statement.kind === "var") {
          for (const decl of statement.declarations) {
            if (!name(decl.id) || fn.params.some(param => name(param) === name(decl.id))
              || name(decl.init?.callee) !== "tocolor") plain = false;
            else inkNames.add(name(decl.id));
          }
        } else if (expression(statement)?.type !== "CallExpression") plain = false;
      }
      walk(fn.body, node => {
        if (node.type === "NewExpression" || node.type === "AssignmentExpression"
          || node.type === "UpdateExpression" || node.type === "AwaitExpression") plain = false;
        if (node.type !== "CallExpression") return;
        const method = name(node.callee?.property);
        const owner = name(node.callee?.object);
        if (owner === context && ["save", "restore"].includes(method) && !node.arguments.length) return;
        if (owner === context && ["transform", "fillRect"].includes(method)
          && node.arguments.length === (method === "transform" ? 6 : 4)
          && node.arguments.every(argument => {
            try { return Number.isFinite(literal(argument)); } catch { return false; }
          })) return;
        if (owner === color && method === "apply" && node.arguments.length === 1) {
          try {
            const values = literal(node.arguments[0]);
            if (Array.isArray(values) && values.length === 4 && values.every(Number.isFinite)) return;
          } catch { /* fail closed */ }
        }
        if (name(node.callee) === "tocolor" && node.arguments.length === 1
          && call(node.arguments[0], color, "apply")) return;
        if (/^font\d+$/.test(name(node.callee)) && node.arguments.length === 3
          && name(node.arguments[0]) === context && typeof literalString(node.arguments[1]) === "string"
          && inkNames.has(name(node.arguments[2]))) return;
        plain = false;
      });
      if (plain) compositeLeaves.add(symbol);
    }
  }
  // Apart from the closed embedded-bitmap grammar above, shape support accepts
  // only straight-line solid paths, never arbitrary Canvas code. Gradients,
  // other images/clipping/transforms and script calls fail closed.
  // ShapeBounds includes source strokes; EdgeBounds would not suffice.
  for (const [symbol, fn] of shapes) {
    if (!validBounds(bounds[symbol]) || fn.params.length !== 5
      || fn.params.some(param => !name(param))) continue;
    const context = name(fn.params[0]), color = name(fn.params[1]);
    const constants = new Map();
    const value = node => {
      if (node?.type === "Identifier" && constants.has(node.name)) return constants.get(node.name);
      try { return literal(node); } catch { return undefined; }
    };
    const finite = node => Number.isFinite(value(node));
    const rgba = node => {
      const result = value(node);
      return Array.isArray(result) && result.length === 4 && result.every(Number.isFinite);
    };
    const paint = node => name(node?.callee) === "tocolor" && node.arguments.length === 1
      && call(node.arguments[0], color, "apply") && node.arguments[0].arguments.length === 1
      && rgba(node.arguments[0].arguments[0]);
    let safe = true, paths = 0;
    for (const statement of fn.body.body) {
      if (statement.type === "VariableDeclaration" && statement.kind === "var") {
        for (const decl of statement.declarations) {
          const result = value(decl.init);
          if (!name(decl.id) || fn.params.some(param => name(param) === name(decl.id))
            || !(typeof result === "string" || Number.isFinite(result))) { safe = false; break; }
          constants.set(name(decl.id), result);
        }
      } else {
        const expr = expression(statement);
        if (expr?.type === "AssignmentExpression" && expr.operator === "="
          && name(expr.left?.object) === context && !expr.left.computed) {
          const property = name(expr.left.property);
          if (["fillStyle", "strokeStyle"].includes(property)) safe &&= paint(expr.right);
          else if (["lineWidth", "miterLimit"].includes(property)) safe &&= finite(expr.right) && value(expr.right) >= 0;
          else if (property === "lineCap") safe &&= ["butt", "round", "square"].includes(value(expr.right));
          else if (property === "lineJoin") safe &&= ["round", "bevel", "miter"].includes(value(expr.right));
          else safe = false;
        } else if (name(expr?.callee) === "drawPath") {
          const args = expr.arguments;
          // The path string is data, never evaluated. Only known path commands
          // and finite numeric tokens may reach the existing drawPath helper.
          const path = value(args[1]);
          safe &&= name(args[0]) === context && typeof path === "string"
            && /^[MLQClqcmzZ0-9eE+.,\s-]*$/.test(path)
            && (args.length === 3 || args.length === 4)
            && typeof value(args[2]) === "boolean"
            && (args.length === 3 || value(args[3]) === "NORMAL");
          paths++;
        } else if (call(expr, context, "fill")) {
          safe &&= expr.arguments.length === 0
            || expr.arguments.length === 1 && ["evenodd", "nonzero"].includes(value(expr.arguments[0]));
        } else safe = false;
      }
      if (!safe) break;
    }
    // A parameter used anywhere, even through an otherwise permitted expression,
    // disqualifies a morph/clock-dependent shape.
    walk(fn.body, node => {
      if (node.type === "Identifier" && fn.params.slice(2).some(param => name(param) === node.name)) safe = false;
    });
    if (safe && paths) {
      staticTexts.add(symbol);
      compositeLeaves.add(symbol);
    }
  }
  // Text-only inputs retain the legacy single-caption wrapper contract.
  // Shape-bound inputs opt into pure placement-only static composites:
  // no nested filters, masks, clocks, blends or dynamic children. Embedded
  // bitmap-fill children require the separately verified closed grammar above.
  // Iterate to a fixed point so declaration order does not matter. Only finite
  // acyclic trees whose leaves have verified bounds can enter the eligible set.
  const vectorMode = Object.keys(bounds).some(symbol => /^shape\d+$/.test(symbol));
  for (let pass = 0; pass <= sprites.size; pass++) {
    let added = false;
    for (const [symbol, fn] of sprites) {
      if (staticTexts.has(symbol)) continue;
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
      if (statements.length < 2 || (!vectorMode && statements.length !== 2)
        || statements.at(-1).type !== "BreakStatement" || statements.at(-1).label) continue;
      const union = [Infinity, Infinity, -Infinity, -Infinity];
      let safe = true;
      for (const statement of statements.slice(0, -1)) {
        const placed = expression(statement);
        const childColor = placed?.arguments?.[4];
        const constantColor = name(childColor) === colorName
          || vectorMode && call(childColor, colorName, "merge") && childColor.arguments.length === 1
            && childColor.arguments[0]?.type === "NewExpression" && name(childColor.arguments[0].callee) === "cxform"
            && childColor.arguments[0].arguments.length === 8
            && childColor.arguments[0].arguments.every(argument => {
              try { return Number.isFinite(literal(argument)); } catch { return false; }
            });
        if (name(placed?.callee) !== "place" || placed.arguments.length !== 9
          || !name(placed.arguments[1]) || name(placed.arguments[1]) !== name(factory.params[0])
          || name(placed.arguments[2]) !== contextName || !constantColor
          || name(placed.arguments[8]) !== name(fn.params[4])
          || !matchesValues(placed.arguments.slice(5, 8), [1, 0, 0])) { safe = false; break; }
        let child, matrix;
        try { child = literal(placed.arguments[0]); matrix = literal(placed.arguments[3]); } catch { safe = false; break; }
        if (!staticTexts.has(child) || (vectorMode ? !compositeLeaves.has(child) : !texts.has(child)) || !Array.isArray(matrix)
          || matrix.length !== 6 || !matrix.every(Number.isFinite)) { safe = false; break; }
        const [x0, y0, x1, y1] = staticBounds[child];
        const corners = [[x0, y0], [x1, y0], [x0, y1], [x1, y1]].map(([x, y]) =>
          [matrix[0] * x + matrix[2] * y + matrix[4], matrix[1] * x + matrix[3] * y + matrix[5]]);
        union[0] = Math.min(union[0], ...corners.map(point => point[0]));
        union[1] = Math.min(union[1], ...corners.map(point => point[1]));
        union[2] = Math.max(union[2], ...corners.map(point => point[0]));
        union[3] = Math.max(union[3], ...corners.map(point => point[1]));
      }
      if (!safe || !validBounds(union)) continue;
      staticBounds[symbol] = union;
      staticTexts.add(symbol);
      compositeLeaves.add(symbol);
      added = true;
    }
    if (!added) break;
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
