// Offline, fail-closed optimization. Never changes drawing commands or assets.
import { parse } from "acorn";

function walk(node, visit, owner = null) {
  if (!node?.type) return;
  visit(node, owner);
  if (["FunctionDeclaration", "FunctionExpression", "ArrowFunctionExpression"].includes(node.type)) owner = node;
  for (const value of Object.values(node)) {
    if (Array.isArray(value)) value.forEach(child => walk(child, visit, owner));
    else if (value?.type) walk(value, visit, owner);
  }
}
const fail = message => { throw new Error(`Frame dispatch: ${message}`); };
const marker = "// Bounded calculus root frame dispatch v1";
const allowed = new Set([
  "SwitchCase", "Literal", "Identifier", "ExpressionStatement", "CallExpression",
  "TemplateLiteral", "TemplateElement", "ArrayExpression", "UnaryExpression",
  "BinaryExpression", "MemberExpression", "NewExpression", "BreakStatement",
  "VariableDeclaration", "VariableDeclarator", "AssignmentExpression",
]);

export function splitCalculusFrameDispatch(source, { chunkSize = 32 } = {}) {
  if (!Number.isInteger(chunkSize) || chunkSize < 1 || chunkSize > 32) fail("chunk size must be 1..32");
  if (source.includes(marker)) fail("already rewritten");
  const ast = parse(source, { ecmaVersion: "latest", sourceType: "module" });
  const factories = [];
  walk(ast, node => {
    if (node.type === "FunctionDeclaration" && node.id?.name === "createTimeline") factories.push(node);
  });
  if (factories.length !== 1) fail("expected one createTimeline factory");
  const mains = [];
  walk(factories[0], (node, owner) => {
    if (node.type === "FunctionDeclaration" && node.id?.name === "main") {
      if (owner !== factories[0]) fail("main nested in another function");
      mains.push(node);
    }
  });
  if (mains.length !== 1) fail("expected one factory-owned main");
  const main = mains[0];
  if (main.async || main.generator || main.params.map(p => p.name).join(",") !== "t,n,r,i,a") fail("unknown main signature");
  const body = main.body.body;
  const compact = node => source.slice(node.start, node.end).replace(/\s/g, "");
  if (body.length !== 7 || compact(body[0]) !== "t.save();"
    || compact(body[1]) !== "t.transform(1,0,0,1,0,0);"
    || compact(body[2]) !== "vars=[];" || !/^varc=\d+;$/.test(compact(body[3]))
    || compact(body[4]) !== "r=r%c;" || !/^t\.restore\(\);?$/.test(compact(body[6]))) fail("unknown prefix/suffix");
  const sw = body[5];
  if (sw.type !== "SwitchStatement" || sw.discriminant.name !== "r" || !sw.cases.length) fail("unknown frame switch");
  const locals = new Set();
  const protectedNames = new Set(["t", "n", "r", "i", "a", "s", "c"]);
  let previous = -Infinity;
  for (const frame of sw.cases) {
    if (frame.test?.type !== "Literal" || !Number.isSafeInteger(frame.test.value)
      || frame.test.value < 0 || frame.test.value <= previous) fail("default, unordered, or nonnumeric frame");
    previous = frame.test.value;
    if (frame.consequent.at(-1)?.type !== "BreakStatement") fail("fallthrough");
    walk(frame, node => {
      if (!allowed.has(node.type)) fail(`unsupported ${node.type}`);
      if (node.type === "BreakStatement" && (node !== frame.consequent.at(-1) || node.label)) fail("nonterminal/labeled break");
      if (node.type === "VariableDeclaration" && node.kind !== "var") fail("lexical binding");
      if (node.type === "VariableDeclarator") {
        if (node.id.type !== "Identifier" || protectedNames.has(node.id.name)) fail("unsafe binding");
        locals.add(node.id.name);
      }
      if (node.type === "Identifier" && ["arguments", "eval", "Function", "main"].includes(node.name)) fail("scope-sensitive reference");
      if (node.type === "UnaryExpression" && node.operator === "delete") fail("delete");
      if (node.type === "AssignmentExpression" && node.left.type !== "Identifier"
        && node.left.type !== "MemberExpression") fail("unknown assignment");
      if (node.type === "AssignmentExpression" && node.left.type === "Identifier"
        && protectedNames.has(node.left.name) && node.left.name !== "t") fail("prefix/parameter mutation");
    });
    // Exported filter blocks temporarily redirect t, then restore its alias.
    // Prove the suffix still sees the incoming context, without rewriting it.
    const aliases = new Map([["t", true]]);
    for (const statement of frame.consequent) {
      const directAssignment = statement.type === "ExpressionStatement"
        && statement.expression.type === "AssignmentExpression" ? statement.expression : null;
      walk(statement, node => {
        if (node.type === "AssignmentExpression" && node.left.type === "Identifier"
          && node !== directAssignment) fail("nested local assignment");
      });
      if (statement.type === "VariableDeclaration") {
        for (const decl of statement.declarations) if (decl.init) {
          aliases.set(decl.id.name, decl.init.type === "Identifier" && aliases.get(decl.init.name) === true);
        }
      }
      if (directAssignment?.left.type === "Identifier") {
        aliases.set(directAssignment.left.name, directAssignment.operator === "="
          && directAssignment.right.type === "Identifier" && aliases.get(directAssignment.right.name) === true);
      }
    }
    if (!aliases.get("t")) fail("context not restored before suffix");
  }
  // All bare assignments must resolve to a main-local var, not factory state.
  walk(sw, node => {
    if (node.type === "AssignmentExpression" && node.left.type === "Identifier"
      && node.left.name !== "t" && !locals.has(node.left.name)) fail("nonlocal assignment");
  });
  const names = new Set();
  walk(ast, node => { if (node.type === "Identifier") names.add(node.name); });
  const params = "t,n,r,i,a,s,c";
  const helpers = [], calls = [];
  for (let offset = 0; offset < sw.cases.length; offset += chunkSize) {
    const cases = sw.cases.slice(offset, offset + chunkSize);
    const name = `_calculusFrameChunk${helpers.length}`;
    if (names.has(name)) fail("helper name collision");
    const declarations = locals.size ? `var ${[...locals].join(",")};` : "";
    helpers.push(`function ${name}(${params}){${declarations}switch(r){${cases.map(frame => source.slice(frame.start, frame.end)).join("\n")}}}`);
    calls.push(`${calls.length ? "else " : ""}if(r>=${cases[0].test.value}&&r<=${cases.at(-1).test.value})${name}(${params});`);
  }
  const replacement = helpers.join("\n") + "\n" + source.slice(main.start, sw.start)
    + calls.join("\n") + source.slice(sw.end, main.end);
  return {
    source: source.slice(0, main.start) + marker + "\n" + replacement + source.slice(main.end),
    frames: sw.cases.length, helpers: helpers.length, chunkSize,
  };
}
