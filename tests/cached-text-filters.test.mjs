import test from "node:test";
import assert from "node:assert/strict";
import { createCachedTextFilters } from "../src/shared/CachedTextFilters.mjs";
import { patchCalculusFilters } from "../scripts/optimize-calculus-filters.mjs";

const chain = [
  ["glow", 7, 7, 1, [0, 51, 204, 1], false, false, 1],
  ["dropShadow", 5, 5, 44, 5, [0, 0, 0, 1], false, 1, 1, false],
];
function fixture(options = {}) {
  const images = [], applied = [], painted = [], composites = [];
  const createCanvas = (width, height) => {
    const image = { width, height };
    const context = { canvas: image, applyTransforms(matrix) { this._matrix = matrix; } };
    image.getContext = () => context;
    images.push(image);
    return image;
  };
  const filters = Object.fromEntries(["glow", "dropShadow"].map(kind =>
    [kind, (image, _context, ...args) => { applied.push([kind, ...args]); return image; }]));
  const renderer = createCachedTextFilters({
    createCanvas, filters, enhanceContext() {},
    place(...args) { painted.push(args); },
    bounds: { text24: [0, 0, 20, 10] }, width: 200, height: 150, ...options,
  });
  const context = {
    _matrix: [2, 0, 0, 2, 0, 0], save() {}, restore() {}, setTransform() {},
    drawImage(...args) { composites.push(args); },
  };
  const canvas = { width: 400, height: 300 };
  const draw = (matrix = [1, 0, 0, 1, 50, 40], color = { red: 1 }) =>
    renderer.draw("text24", canvas, context, matrix, color, chain);
  return { renderer, images, applied, painted, composites, context, canvas, draw };
}

test("moving filtered text reuses whole-pixel artwork without reusing different fractional coverage or colors", () => {
  const f = fixture();
  f.draw();
  assert.deepEqual(f.applied, chain, "the original effect order and parameters must remain intact");
  assert.equal(f.painted.length, 1);
  f.draw([1, 0, 0, 1, 53, 42]);
  assert.equal(f.painted.length, 1, "integer movement should composite cached text, not rerun pixel filters");
  assert.equal(f.composites[1][1] - f.composites[0][1], 6);
  assert.equal(f.composites[1][2] - f.composites[0][2], 4);
  f.draw([1, 0, 0, 1, 53.25, 42]);
  assert.equal(f.painted.length, 2, "fractional placement changes antialiased coverage");
  f.draw([1, 0, 0, 1, 53.25, 42], { red: .5 });
  assert.equal(f.painted.length, 3);
  f.draw([1.1, 0, 0, 1, 53.25, 42], { red: .5 });
  assert.equal(f.painted.length, 4, "a changing animated scale cannot reuse static ink");
  f.renderer.dispose();
  assert.ok(f.images.every(image => image.width === 0 && image.height === 0));
});

test("filter crops retain chained halos and real canvas edges while high-DPI work stays at source density", () => {
  const f = fixture();
  f.draw();
  const first = f.images[0];
  // Radius 3 + radius 2 + ceil(fractional shadow shift) 4 + 1
  // translation support + 2 antialias padding on each side.
  assert.equal(first.width, 20 + 12 * 2);
  assert.equal(first.height, 10 + 12 * 2);
  assert.equal(f.composites[0][3], first.width * 2);
  f.draw([1, 0, 0, 1, -5, -2]);
  const edge = f.images.at(-1);
  assert.equal(f.composites.at(-1)[1], 0);
  assert.equal(f.composites.at(-1)[2], 0);
  assert.ok(edge.width < first.width && edge.height < first.height);
  const count = f.images.length;
  f.draw([1, 0, 0, 1, -1000, -1000]);
  assert.equal(f.images.length, count, "fully invisible outer effects need no pixel work");
  f.renderer.dispose();
});

test("filtered ink follows the real high-DPI transform even when the old exporter bookkeeping misses root scale", () => {
  const f = fixture();
  f.context._matrix = [1, 0, 0, 1, 0, 0];
  f.context.getTransform = () => ({ a: 2, b: 0, c: 0, d: 2, e: 0, f: 0 });
  f.draw();
  assert.equal(f.images[0].width, 44);
  assert.deepEqual(f.painted[0][2]._matrix, [1, 0, 0, 1, -38, -28]);
  assert.deepEqual(f.composites[0].slice(1), [76, 56, 88, 68]);
  f.renderer.dispose();
});

test("text effect cache evicts and disposes retained canvases within its memory and entry budgets", () => {
  const f = fixture({ maxEntries: 1 });
  f.draw();
  const original = f.images[0];
  f.draw(undefined, { red: .5 });
  assert.equal(original.width, 0);
  assert.ok(f.images[1].width > 0);
  f.renderer.dispose();
  f.renderer.dispose();
  assert.ok(f.images.every(image => image.width === 0 && image.height === 0));
  const tiny = fixture({ maxPixels: 1 });
  tiny.draw();
  tiny.draw();
  assert.equal(tiny.painted.length, 2, "an oversized layer must not remain in the cache");
  assert.ok(tiny.images.every(image => image.width === 0 && image.height === 0));
});

const block = `
var prior=ctx;var image=createCanvas(canvas.width,canvas.height);
var off=image.getContext("2d");enhanceContext(off);off.applyTransforms(ctx._matrix);ctx=off;
place("text24",canvas,ctx,[1,0,0,1,50,40],color,1,0,0,time);
image=Filters.glow(image,image.getContext("2d"),7,7,1,[0,51,204,1],false,false,1);
image=Filters.dropShadow(image,image.getContext("2d"),5,5,44,5,[0,0,0,1],false,1,1,false);
ctx=prior;var saved=ctx._matrix;ctx.setTransform(1,0,0,1,0,0);ctx.drawImage(image,0,0);ctx.applyTransforms(saved);
`;
const source = `// Mechanically converted FFDec 26.2.1 drawing code. Review before importing.
// Context lifecycle v2: restore canvas ownership before reuse.
export const metadata={width:550,height:400,frames:[1],background:"#66ffff"};
export async function createTimeline(canvas) {
function _timelineRelease() {}
function text24(ctx,color,frame,ratio,time) {ctx.fillRect(0,0,20,10);}
function main(ctx,color,frame,ratio,time) {${block}}
const Filters={};
await Promise.all([]);
return {draw(){},dispose:_timelineRelease};
}`;
test("offline rewrite changes only verified static outer-text blocks and retains renderer metadata", () => {
  const bounds = { text24: [0, 0, 20, 10] };
  const result = patchCalculusFilters(source, bounds);
  assert.equal(result.groups, 1);
  assert.ok(result.source.includes('export const metadata={width:550,height:400,frames:[1],background:"#66ffff"};'));
  assert.ok(result.source.includes('_timelineTextFilters.draw("text24",canvas,ctx,'));
  assert.ok(result.source.includes("_timelineTextFilters?.dispose();"));
  assert.equal(patchCalculusFilters(result.source, bounds).source, result.source);
  assert.throws(() => patchCalculusFilters(source.replace("ctx.fillRect", "time;ctx.fillRect"), bounds),
    /No verified/);
  assert.throws(() => patchCalculusFilters(source.replace("false,false,1", "true,false,1"), bounds),
    /No verified/, "inverted-alpha inner filters must use the original path");
  assert.throws(() => patchCalculusFilters(source, {}), /No verified/);
});

test("one-frame text wrappers use bounded crops instead of full-stage shadows", () => {
  const wrapper = `function sprite17(ctx,color,frame,ratio,time){
var unused=[];var count=1;frame=frame%count;switch(frame){
case 0:place("text24",canvas,ctx,[1,0,0,1,-7,4],color,1,0,0,time);break;}}`;
  const wrapped = source.replace("function main", `${wrapper}\nfunction main`)
    .replace('place("text24",canvas,ctx,[1,0,0,1,50,40],color,1,0,0,time);',
      'place("sprite17",canvas,ctx,[1,0,0,1,50,40],color,1,(0+time)%1,300,time);');
  const result = patchCalculusFilters(wrapped, { text24: [0, 0, 20, 10] });
  assert.equal(result.groups, 1);
  assert.ok(result.source.includes('_timelineTextFilters.draw("sprite17",canvas,ctx,'));
  assert.ok(result.source.includes('"sprite17":[-7,4,13,14]'));
  assert.equal(patchCalculusFilters(result.source, { text24: [0, 0, 20, 10] }).source, result.source);
  assert.throws(() => patchCalculusFilters(wrapped.replace("var count=1", "var count=2"),
    { text24: [0, 0, 20, 10] }), /No verified/, "a genuinely animated sprite cannot become a static bitmap");
  assert.throws(() => patchCalculusFilters(wrapped.replace('place("text24",canvas,ctx,', 'place("shape24",canvas,ctx,'),
    { text24: [0, 0, 20, 10] }), /No verified/, "unreviewed artwork cannot use text bounds");
});

test("extending an existing text cache merges new bounds without duplicating lifetime hooks", () => {
  const bounds = { text24: [0, 0, 20, 10], text25: [1, 2, 11, 12] };
  const initial = patchCalculusFilters(source, bounds).source;
  const nextText = "function text25(ctx,color,frame,ratio,time){ctx.fillRect(1,2,10,10);}";
  const extra = block.replaceAll("text24", "text25").replace("color,1,0,0,time",
    "color.merge(new cxform(0,0,0,0,256,256,256,256)),1,0,0,time");
  const update = initial.replace("function main", `${nextText}\nfunction extra(ctx,color,frame,ratio,time){${extra}}\nfunction main`);
  const result = patchCalculusFilters(update, bounds);
  assert.equal(result.groups, 1);
  assert.ok(result.source.includes('"text24":[0,0,20,10],"text25":[1,2,11,12]'));
  assert.equal(result.source.match(/_timelineTextFilters\?\.dispose\(\)/g).length, 1);
  assert.equal(result.source.match(/_timelineTextFilters=createCachedTextFilters/g).length, 1);
  assert.equal(patchCalculusFilters(result.source, bounds).groups, 0);
});
