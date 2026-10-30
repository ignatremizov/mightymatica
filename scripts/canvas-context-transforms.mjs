import { parse } from "acorn";

const marker = "// Canvas context transforms v1: native and shadow CTMs agree.\n";
const provenance = "// Mechanically converted FFDec 26.2.1 drawing code. Review before importing.";
const natives = ["save", "restore", "scale", "rotate", "translate", "transform", "setTransform", "resetTransform"];
const clean = value => JSON.stringify(value, (key, item) => ["start", "end", "raw"].includes(key) ? undefined : item);
const functionNode = source => parse(`(${source})`, { ecmaVersion: "latest" }).body[0].expression;
function walk(node, visit) {
  if (!node || typeof node !== "object") return;
  if (typeof node.type === "string") visit(node);
  for (const value of Object.values(node)) {
    if (Array.isArray(value)) value.forEach(child => walk(child, visit));
    else if (value && typeof value === "object") walk(value, visit);
  }
}

/** Patch only the reviewed FFDec enhancer; unknown variants are errors. */
export function patchContextTransforms(source) {
  const original = source;
  const header = source.indexOf(provenance);
  if (header > 0) {
    const prefix = source.slice(0, header);
    if (!/^(?:[ \t]*(?:\/\/[^\n]*)?\r?\n)*$/.test(prefix)) {
      throw new Error("Unexpected code before native drawing provenance.");
    }
    // Existing generation/minification tools identify reviewed code from its
    // first line. Later mechanical patch markers must not obscure that header.
    source = provenance + "\n" + prefix + source.slice(header + provenance.length).replace(/^\r?\n/, "");
  }
  const comments = [];
  const ast = parse(source, { ecmaVersion: "latest", sourceType: "module", onComment: comments });
  const candidates = [];
  walk(ast, node => {
    if (node.type === "CallExpression" && node.callee.type === "MemberExpression"
      && node.callee.object.name === "Object" && node.callee.property.name === "assign"
      && node.arguments[1]?.type === "ObjectExpression"
      && node.arguments[1].properties.some(property => property.key?.name === "applyTransformToPoint")) candidates.push(node);
  });
  if (!candidates.length) {
    if (source.includes(marker) || /\benhanceContext\s*=/.test(source)) throw new Error("Unrecognized context enhancer.");
    return { source, matched: false, changed: source !== original };
  }
  if (candidates.length !== 1) throw new Error("Expected one context enhancer.");
  const candidate = candidates[0];
  const properties = candidate.arguments[1].properties;
  const methods = Object.fromEntries(properties.map(property => [property.key?.name, property.value]));
  if (properties.length !== 10 || [...natives, "applyTransforms", "applyTransformToPoint"].some(name => methods[name]?.type !== "FunctionExpression")) throw new Error("Unknown enhancer method set.");
  const transform = methods.transform;
  const assignment = transform.body.body[0];
  const concat = assignment?.expression?.right?.callee?.name;
  const native = transform.body.body[1]?.expression?.callee?.object?.object?.name;
  if (!concat || !native || transform.params.some(param => param.type !== "Identifier")) throw new Error("Unknown transform implementation.");
  const args = transform.params.map(param => param.name);
  const expectedTransform = `function(${args}){this._matrix=${concat}([${args}],this._matrix);${native}.transform.call(this,${args})}`;
  if (clean(transform) !== clean(functionNode(expectedTransform))) throw new Error("Unknown transform composition.");
  const set = methods.setTransform;
  const setArgs = set.params.map(param => param.name);
  if (clean(set) !== clean(functionNode(`function(${setArgs}){this._matrix=[${setArgs}];${native}.setTransform.call(this,${setArgs})}`))) throw new Error("Unknown setTransform implementation.");
  let captured = false;
  walk(ast, node => {
    if (node.type !== "VariableDeclarator" || node.id.name !== native || node.init?.type !== "ObjectExpression") return;
    const entries = node.init.properties;
    captured ||= entries.length === 8 && entries.every((property, index) =>
      property.key.name === natives[index] && property.value.type === "MemberExpression"
      && property.value.object.name === candidate.arguments[0].name && property.value.property.name === natives[index]);
  });
  if (!captured) throw new Error("Unknown native context capture.");
  const patched = comments.some(comment => comment.value.trim() === marker.slice(2).trim());
  const edits = [];
  for (const name of ["scale", "rotate", "translate", "resetTransform"]) {
    const method = methods[name];
    if (method.params.some(param => param.type !== "Identifier")) throw new Error(`Unknown ${name} parameters.`);
    const params = method.params.map(param => param.name);
    const count = { scale: 2, rotate: 1, translate: 2, resetTransform: 0 }[name];
    if (params.length !== count) throw new Error(`Unknown ${name} arity.`);
    const [x, y] = params;
    const matrix = name === "scale" ? `[${x},0,0,${y},0,0]`
      : name === "translate" ? `[1,0,0,1,${x},${y}]`
      : `[Math.cos(${x}),Math.sin(${x}),-Math.sin(${x}),Math.cos(${x}),0,0]`;
    const update = name === "resetTransform" ? "this._matrix=[1,0,0,1,0,0];"
      : `this._matrix=${concat}(${matrix},this._matrix);`;
    const call = `${native}.${name}.call(this${params.length ? `,${params}` : ""})`;
    const replacement = `function(${params}){${update}${call}}`;
    const expected = patched ? replacement : `function(${params}){${call}}`;
    if (clean(method) !== clean(functionNode(expected))) throw new Error(`Unknown ${name} implementation${patched ? " under patch marker" : ""}.`);
    edits.push({ start: method.start, end: method.end, replacement });
  }
  if (patched) return { source, matched: true, changed: source !== original };
  for (const edit of edits.sort((a, b) => b.start - a.start)) source = source.slice(0, edit.start) + edit.replacement + source.slice(edit.end);
  return {
    source: source.startsWith(provenance + "\n")
      ? provenance + "\n" + marker + source.slice(provenance.length + 1)
      : marker + source,
    matched: true, changed: true,
  };
}
