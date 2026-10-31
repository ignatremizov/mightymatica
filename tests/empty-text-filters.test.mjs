import test from "node:test";
import assert from "node:assert/strict";
import { patchEmptyTextFilters } from "../scripts/optimize-empty-text-filters.mjs";

const leaf = "function text95(e,t,n,r,i){}";
const shadow = "u=o.dropShadow(u,u.getContext('2d'),5,5,44,5,[0,0,0,1],false,1,1,false);";
const glow = "u=o.glow(u,u.getContext('2d'),5,5,1,[255,0,0,1],false,false,1);";
const placed = "place('text95',e,t,[.05,0,0,.05,20,30],n,1,0,46,a);";
function fixture({ body = leaf, effects = shadow + glow } = {}) {
  return `${body}
function main(e,t,n,a){
var l=t;var u=createCanvas(e.width,e.height);var d=u.getContext('2d');
enhanceContext(d);d.applyTransforms(t._matrix);t=d;
${placed}
${effects}
t=l;var f=t._matrix;t.setTransform(1,0,0,1,0,0);
t.drawImage(u,0,0);t.applyTransforms(f);
}`;
}
const patch = source => patchEmptyTextFilters(source, ["text95"]);

test("transparent text effects disappear while the original leaf evaluation remains", () => {
  const result = patch(fixture());
  assert.equal(result.groups, 1);
  assert.deepEqual(result.counts, { text95: 1 });
  assert.ok(result.source.includes(placed));
  assert.ok(!result.source.includes("dropShadow"));
  assert.ok(!result.source.includes("createCanvas"));
  assert.deepEqual(patch(result.source), { source: result.source, groups: 0, counts: {} });
});

test("color-only leaf evaluation and its possible side effects are retained", async () => {
  const body = "function text95(e,t,n,r,i){var a=tocolor(t.apply([255,0,204,1]));var a=tocolor(t.apply([255,0,204,1]));}";
  const result = patch(fixture({ body }));
  assert.equal(result.groups, 1);
  assert.ok(result.source.includes(body));
  let conversions = 0, applications = 0;
  const factory = new Function("tocolor", "place", `${result.source};return main;`);
  // Execute the rewritten placement too, not merely the preserved declaration.
  const place = (_id, canvas, context, _matrix, color, ...rest) => {
    const evaluate = new Function("tocolor", `${body};return text95;`)(() => { conversions++; });
    evaluate(canvas, color, ...rest);
  };
  const run = factory(() => { conversions++; }, place);
  run({}, {}, { apply() { applications++; return []; } }, 0);
  assert.equal(applications, 2);
  assert.equal(conversions, 2);
});

test("painting, arbitrary calls and dynamic color expressions are not eligible leaves", () => {
  for (const statement of [
    "t.fillRect(0,0,2,2);", "alert('x');", "var x=other();",
    "var a=tocolor(t.apply(dynamic));", "t.fillStyle='red';",
    "place('sprite1',e,t,[],n,1,0,0,i);",
    "var t=tocolor(t.apply([1,2,3,1]));",
  ]) assert.throws(() => patch(fixture({ body: `function text95(e,t,n,r,i){${statement}}` })), /not proven paint-free/);
});

test("inner, knockout, bevel, dynamic and malformed effect chains stay untouched", () => {
  for (const effects of [
    shadow.replace(",false,1,1,false", ",true,1,1,false"),
    shadow.replace(",false,1,1,false", ",false,1,1,true"),
    glow.replace(",false,false,1", ",true,false,1"),
    glow.replace(",false,false,1", ",false,true,1"),
    shadow.replace("dropShadow", "bevel"),
    shadow.replace("5,5,44", "amount,5,44"),
    shadow + "u=o.bevel(u,u.getContext('2d'),1);",
    shadow.replace(",5,5,44", ",Infinity,5,44"),
  ]) {
    const source = fixture({ effects });
    assert.equal(patch(source).source, source);
  }
});

test("unknown isolation transforms and additional artwork prevent elimination", () => {
  for (const source of [
    fixture().replace("t=d;", "t=d;t.fillRect(0,0,2,2);"),
    fixture().replace("t.drawImage(u,0,0)", "t.drawImage(u,1,0)"),
    fixture().replace("enhanceContext(d)", "other(d)"),
    fixture().replace("[.05,0,0,.05,20,30]", "[scale,0,0,.05,20,30]"),
  ]) assert.equal(patch(source).source, source);
});
