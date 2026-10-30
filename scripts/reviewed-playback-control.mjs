import { parse } from "acorn";

function walk(node, visit, owner = null) {
  if (!node || typeof node.type !== "string") return;
  if (["FunctionDeclaration", "FunctionExpression", "ArrowFunctionExpression"].includes(node.type)) owner = node;
  visit(node, owner);
  for (const value of Object.values(node)) {
    if (Array.isArray(value)) value.forEach(child => walk(child, visit, owner));
    else if (value && typeof value.type === "string") walk(value, visit, owner);
  }
}

/** Mechanically select explicitly reviewed two-frame controls; never interpret AS. */
export function patchReviewedPlaybackControl(source, { spriteNames, stateName, marker }) {
  if (!spriteNames.length || new Set(spriteNames).size !== spriteNames.length
    || !spriteNames.every(name => /^sprite[1-9]\d*$/.test(name))
    || !/^[A-Za-z_$][\w$]*$/.test(stateName)) throw new Error("Invalid reviewed transport configuration.");
  const ast = parse(source, { ecmaVersion: "latest", sourceType: "module" });
  const factory = ast.body.find(node => node.type === "ExportNamedDeclaration"
    && node.declaration?.type === "FunctionDeclaration" && node.declaration.id?.name === "createTimeline")?.declaration;
  if (!factory) throw new Error("Missing reviewed native timeline factory.");
  const sprites = [], returns = [], identifiers = [];
  walk(factory, (node, owner) => {
    if (node.type === "FunctionDeclaration" && spriteNames.includes(node.id?.name)) sprites.push(node);
    if (node.type === "ReturnStatement" && owner === factory) returns.push(node);
    if (node.type === "Identifier" && node.name === stateName) identifiers.push(node);
  });
  if (sprites.length !== spriteNames.length || new Set(sprites.map(sprite => sprite.id.name)).size !== spriteNames.length
    || returns.length !== 1 || returns[0].argument?.type !== "ObjectExpression") {
    throw new Error("Unexpected source sprite or renderer ownership.");
  }
  const renderer = returns[0].argument;
  if (sprites.some(sprite => sprite.params[2]?.type !== "Identifier" || sprite.body.type !== "BlockStatement")
    || !["draw", "dispose"].every(name => renderer.properties.some(property => property.key?.name === name))) {
    throw new Error("Unexpected source transport or renderer contract.");
  }
  const setter = renderer.properties.find(property => property.key?.name === "setPlaybackState");
  if (setter || identifiers.length) {
    const assignment = sprites[0].body.body[0]?.expression;
    const selected = assignment?.right?.test?.name;
    const binding = factory.body.body.some(statement => statement.type === "VariableDeclaration"
      && statement.declarations.some(declaration => declaration.id?.name === selected && declaration.init?.value === false));
    const update = setter?.value?.body?.body[0]?.expression;
    const selectedConsistently = sprites.every(sprite => {
      const expression = sprite.body.body[0]?.expression;
      return expression?.type === "AssignmentExpression" && expression.left.name === sprite.params[2].name
        && expression.right?.type === "ConditionalExpression" && expression.right.test?.name === selected
        && expression.right.consequent?.value === 1 && expression.right.alternate?.value === 0;
    });
    if (!setter || !selectedConsistently || !binding
      || update?.type !== "AssignmentExpression" || update.left?.name !== selected
      || update.right?.type !== "BinaryExpression" || update.right.operator !== "==="
      || update.right.left?.name !== setter.value.params[0]?.name || update.right.right?.value !== true) {
      throw new Error("Partial or unrelated source playback-state patch.");
    }
    return source;
  }
  const edits = [
    { at: factory.body.start + 1, text: `\nlet ${stateName} = false;\n` },
    ...sprites.map(sprite => ({ at: sprite.body.start + 1, text: `${sprite.params[2].name} = ${stateName} ? 1 : 0;` })),
    { at: renderer.start + 1, text: `setPlaybackState(playing) { ${stateName} = playing === true; },` },
  ];
  let output = source;
  for (const edit of edits.sort((left, right) => right.at - left.at)) {
    output = output.slice(0, edit.at) + edit.text + output.slice(edit.at);
  }
  const provenance = "// Mechanically converted FFDec 26.2.1 drawing code. Review before importing.\n";
  output = output.startsWith(provenance)
    ? provenance + marker + output.slice(provenance.length)
    : marker + output;
  parse(output, { ecmaVersion: "latest", sourceType: "module" });
  return output;
}
