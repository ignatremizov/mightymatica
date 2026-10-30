import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";
import { parse } from "acorn";
import { patchContextTransforms } from "./canvas-context-transforms.mjs";

const source = readFileSync(new URL("../public/media/calculus/native/en/chapter-1.mjs", import.meta.url), "utf8");
function extract(source) {
  const found = {};
  function walk(node) {
    if (!node || typeof node !== "object") return;
    if (node.type === "FunctionDeclaration" && node.id.name === "concatMatrix") found.concat = source.slice(node.start, node.end);
    if (node.type === "FunctionDeclaration" && node.id.name === "drawPath") found.path = source.slice(node.start, node.end);
    if (node.type === "VariableDeclarator" && node.id.name === "enhanceContext") found.enhance = source.slice(node.init.start, node.init.end);
    for (const value of Object.values(node)) {
      if (Array.isArray(value)) value.forEach(walk);
      else if (value && typeof value === "object") walk(value);
    }
  }
  walk(parse(source, { ecmaVersion: "latest", sourceType: "module" }));
  assert.ok(found.concat && found.enhance && found.path);
  return `${found.concat}\n${found.path}\nvar enhanceContext=${found.enhance};`;
}
// Independent native-Canvas affine multiplication, deliberately not concatMatrix.
const multiply = (m, n) => [
  m[0]*n[0]+m[2]*n[1], m[1]*n[0]+m[3]*n[1],
  m[0]*n[2]+m[2]*n[3], m[1]*n[2]+m[3]*n[3],
  m[0]*n[4]+m[2]*n[5]+m[4], m[1]*n[4]+m[3]*n[5]+m[5],
];
const identity = () => [1,0,0,1,0,0];
const near = (a, b) => a.forEach((value, index) => assert.ok(Math.abs(value-b[index]) < 1e-9, `${a} != ${b}`));
const enhancer = extract(source);
const fixture = (source.includes("// Canvas context transforms v1:")
  ? "// Canvas context transforms v1: native and shadow CTMs agree.\n" : "") + enhancer;
const patchedEnhancer = patchContextTransforms(fixture).source;
for (const [width, height] of [[550,550], [1100,1100], [1100,825]]) {
  test(`filled art and shadow-transformed strokes agree at ${width}×${height}`, () => {
    let matrix = identity();
    const stack = [], calls = [];
    const native = {
      save() { calls.push("save"); stack.push([...matrix]); },
      restore() { calls.push("restore"); matrix = stack.pop(); },
      scale(x,y) { calls.push("scale"); matrix = multiply(matrix,[x,0,0,y,0,0]); },
      rotate(angle) { calls.push("rotate"); matrix = multiply(matrix,[Math.cos(angle),Math.sin(angle),-Math.sin(angle),Math.cos(angle),0,0]); },
      translate(x,y) { calls.push("translate"); matrix = multiply(matrix,[1,0,0,1,x,y]); },
      transform(...m) { calls.push("transform"); matrix = multiply(matrix,m); },
      setTransform(...m) { calls.push("setTransform"); matrix = m; },
      resetTransform() { calls.push("resetTransform"); matrix = identity(); },
    };
    const context = runInNewContext(`${patchedEnhancer}\nenhanceContext(native)`, { native });
    const step = (name, ...args) => {
      const before = calls.length;
      context[name](...args);
      assert.deepEqual(calls.slice(before), [name], "native method called exactly once");
      near(context._matrix, matrix);
      for (const point of [{x:0,y:0},{x:137,y:-41},{x:550,y:550}]) {
        const stroke = context.applyTransformToPoint(point);
        near([stroke.x,stroke.y], [matrix[0]*point.x+matrix[2]*point.y+matrix[4], matrix[1]*point.x+matrix[3]*point.y+matrix[5]]);
      }
    };
    step("setTransform",1,0,0,1,0,0);
    step("save"); step("scale",width/550,height/550);
    step("save"); step("translate",17,-29); step("rotate",0.73);
    step("scale",-2,0.6); step("transform",1,0.2,-0.3,1,8,9);
    step("save"); step("resetTransform"); step("translate",3,4);
    step("restore"); step("restore"); step("restore");
  });
}
test("the generated chart stroke path stays attached to its scaled filled artwork", () => {
  let matrix = identity();
  const stack = [], drawn = [];
  const native = {
    save() { stack.push([...matrix]); },
    restore() { matrix = stack.pop(); },
    scale(x, y) { matrix = multiply(matrix, [x,0,0,y,0,0]); },
    rotate(angle) { matrix = multiply(matrix, [Math.cos(angle),Math.sin(angle),-Math.sin(angle),Math.cos(angle),0,0]); },
    translate(x, y) { matrix = multiply(matrix, [1,0,0,1,x,y]); },
    transform(...m) { matrix = multiply(matrix, m); },
    setTransform(...m) { matrix = m; },
    resetTransform() { matrix = identity(); },
    beginPath() {}, stroke() {}, closePath() {},
    moveTo(x, y) { drawn.push([matrix[0]*x+matrix[2]*y+matrix[4],matrix[1]*x+matrix[3]*y+matrix[5]]); },
    lineTo(x, y) { this.moveTo(x, y); },
  };
  const api = runInNewContext(`${patchedEnhancer}\n({context:enhanceContext(native),drawPath})`, { native });
  api.context.scale(1520/550,1105/400);
  api.context.transform(.05,0,0,.05,0,0);
  const expected = [2780,3880,2780,5379].reduce((points, value, index, coordinates) => {
    if (index % 2 === 0) points.push([
      matrix[0]*value+matrix[2]*coordinates[index+1]+matrix[4],
      matrix[1]*value+matrix[3]*coordinates[index+1]+matrix[5],
    ]);
    return points;
  }, []);
  // This path is from the first Calculus question's actual axis shape.
  api.drawPath(api.context, "M 2780 3880 L 2780 5379", true, "NONE");
  assert.equal(drawn.length, 2);
  drawn.forEach((point, index) => near(point, expected[index]));
  near(api.context._matrix, matrix);
});
test("patch is idempotent and rejects a corrupted patched wrapper", () => {
  const patched = patchedEnhancer;
  assert.equal(patchContextTransforms(patched).source, patched);
  assert.throws(() => patchContextTransforms(patched.replace("this._matrix=[1,0,0,1,0,0];", "this._matrix=[2,0,0,1,0,0];")));
  const reordered = "// Later transport/provenance header.\n" + patched;
  assert.equal(patchContextTransforms(reordered).source, reordered);
  const provenance = "// Mechanically converted FFDec 26.2.1 drawing code. Review before importing.";
  const generated = "// Later transport header.\n" + provenance + "\n" + patched;
  const normalized = patchContextTransforms(generated);
  assert.ok(normalized.source.startsWith(provenance + "\n"));
  assert.equal(patchContextTransforms(normalized.source).source, normalized.source);
});
test("unminified enhancer and unrelated adapter are handled without changing other code", () => {
  const readable = fixture.replaceAll(";", ";\n");
  const patched = patchContextTransforms(readable);
  assert.equal(patched.matched, true);
  assert.equal(patchContextTransforms(patched.source).changed, false);
  const adapter = "export { metadata, createTimeline } from './lesson.mjs';";
  assert.deepEqual(patchContextTransforms(adapter), { source: adapter, matched: false, changed: false });
  assert.throws(() => patchContextTransforms(readable.replace("resetTransform:", "unknownTransform:")));
});
