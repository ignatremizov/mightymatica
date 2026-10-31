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

const shape = `function shape7(ctx,color,frame,ratio,time){
var path="M 0 0 L 10 0 10 5 0 5 Z";var mode="NORMAL";
ctx.fillStyle=tocolor(color.apply([255,0,0,1]));drawPath(ctx,path,false);ctx.fill("evenodd");
ctx.strokeStyle=tocolor(color.apply([0,0,0,1]));ctx.lineWidth=1;ctx.lineCap="round";ctx.lineJoin="round";
drawPath(ctx,path,true,mode);}`;
const drawingBounds = { text24: [0, 0, 20, 10], shape7: [-1, -1, 11, 6] };
function composite(symbol, placements) {
  return `function ${symbol}(ctx,color,frame,ratio,time){
var unused=[];var count=1;frame=frame%count;switch(frame){case 0:${placements}break;}}`;
}
const placement = (symbol, matrix = "[1,0,0,1,0,0]", color = "color") =>
  `place("${symbol}",canvas,ctx,${matrix},${color},1,0,0,time);`;
function drawingSource(symbol, definitions) {
  return source.replace("function main", `${shape}\n${definitions}\nfunction main`)
    .replace('place("text24",canvas,ctx,[1,0,0,1,50,40],color,1,0,0,time);',
      `place("${symbol}",canvas,ctx,[1,0,0,1,50,40],color,1,0,0,time);`);
}

test("source-bounded solid vector leaves retain their authored shadow chain", () => {
  const input = drawingSource("shape7", "");
  const result = patchCalculusFilters(input, drawingBounds);
  assert.equal(result.groups, 1);
  assert.ok(result.source.includes('_timelineTextFilters.draw("shape7",canvas,ctx,'));
  assert.ok(result.source.includes('"shape7":[-1,-1,11,6]'));
  assert.ok(result.source.includes(shape), "the vector painter itself is unchanged");
  assert.throws(() => patchCalculusFilters(input, { text24: drawingBounds.text24 }), /No verified/);
  assert.equal(patchCalculusFilters(result.source, drawingBounds).source, result.source);
});

test("recursive one-frame composites union transformed text and shape bounds independent of declaration order", () => {
  const inner = composite("sprite17", placement("shape7", "[0,2,-3,0,4,5]")
    + placement("text24", "[1,0,0,1,-7,4]", "color.merge(new cxform(0,0,0,0,256,256,256,256))"));
  const outer = composite("sprite18", placement("sprite17", "[-1,0,0,1,10,-2]"));
  const input = drawingSource("sprite18", outer + inner);
  const result = patchCalculusFilters(input, drawingBounds);
  assert.equal(result.groups, 1);
  // Rotated shape: [-14,3,7,27], text [-7,4,13,14];
  // union [-14,3,13,27], then reflected/translated [ -3,1,24,25 ].
  assert.ok(result.source.includes('"sprite18":[-3,1,24,25]'));
  assert.equal(patchCalculusFilters(result.source, drawingBounds).source, result.source);
});

test("static composite eligibility rejects animation, morphs, masks, nested filters and dynamic children", () => {
  const inner = composite("sprite17", placement("shape7"));
  const input = drawingSource("sprite17", inner);
  const rejected = [
    input.replace("var count=1", "var count=2"),
    input.replace('place("shape7",canvas,ctx,[1,0,0,1,0,0],color,1,0,0,time)',
      'place("shape7",canvas,ctx,[1,0,0,1,0,0],color,1,0,ratio,time)'),
    input.replace('drawPath(ctx,path,false);', 'ctx.clip();drawPath(ctx,path,false);'),
    input.replace('drawPath(ctx,path,false);', 'Filters.glow(ctx);drawPath(ctx,path,false);'),
    input.replace('drawPath(ctx,path,false);', 'ctx.globalCompositeOperation="multiply";drawPath(ctx,path,false);'),
    input.replace('drawPath(ctx,path,false);', 'unknownPainter(ctx);drawPath(ctx,path,false);'),
    input.replace('var path="M', 'ratio;var path="M'),
    input.replace('place("shape7",', 'place("morphshape7",'),
    input.replace('case 0:place("shape7"', 'case 0:ctx.clip();place("shape7"'),
    input.replace('[1,0,0,1,0,0],color,1,0,0,time', '[1,0,0,1,time,0],color,1,0,0,time'),
    input.replace('place("shape7",canvas', 'place("sprite17",canvas'),
    input.replace('place("shape7",canvas', 'place("shape7",foreignCanvas'),
    input.replace('color,1,0,0,time);break;', 'color,1,0,0,time,"multiply");break;'),
    input.replace('color,1,0,0,time);break;', 'color.merge(new cxform(0,0,0,time,256,256,256,256)),1,0,0,time);break;'),
  ];
  for (const candidate of rejected) assert.throws(() => patchCalculusFilters(candidate, drawingBounds), /No verified/);
  const textChild = drawingSource("sprite17", composite("sprite17", placement("text24")));
  for (const unsafe of [
    "Filters.glow(ctx);",
    "ctx.clip();",
    "if(externalFlag) unknownPainter(ctx);",
  ]) {
    assert.throws(() => patchCalculusFilters(
      textChild.replace("ctx.fillRect(0,0,20,10);", `${unsafe}ctx.fillRect(0,0,20,10);`),
      drawingBounds), /No verified/, "composites cannot hide unsafe operations inside text children");
  }
  assert.throws(() => patchCalculusFilters(input.replace(
    'image=Filters.glow(image,image.getContext("2d"),7,7,1,[0,51,204,1],false,false,1);',
    'image=Filters.bevel(image,image.getContext("2d"),7,7,1);').replace(
    'image=Filters.dropShadow(image,image.getContext("2d"),5,5,44,5,[0,0,0,1],false,1,1,false);', ""),
  drawingBounds), /No verified/, "bevels stay on the original path");
});

test("extending an existing text cache with a static composite preserves prior bounds and lifetime", () => {
  const initial = patchCalculusFilters(source, drawingBounds).source;
  const extra = block.replaceAll("text24", "sprite17");
  const input = initial.replace("function main", `${shape}
${composite("sprite17", placement("shape7") + placement("text24"))}
function extra(ctx,color,frame,ratio,time){${extra}}
function main`);
  const result = patchCalculusFilters(input, drawingBounds);
  assert.equal(result.groups, 1);
  assert.ok(result.source.includes('"text24":[0,0,20,10],"sprite17":[-1,-1,20,10]'));
  assert.equal(result.source.match(/_timelineTextFilters\?\.dispose\(\)/g).length, 1);
  assert.equal(result.source.match(/_timelineTextFilters=createCachedTextFilters/g).length, 1);
  assert.equal(patchCalculusFilters(result.source, drawingBounds).source, result.source);
});

const bitmapShape = `function shape8(ctx,color,frame,ratio,time){
var path="M 0 0 L 20 0 20 10 0 10 0 0";
drawPath(ctx,path,false);ctx.save();ctx.clip();
ctx.transform(20,0,0,20,0,0);ctx.transform(1.01,0,0,1.02,-.5,-.5);
var image=color.applyToImage(embedded);
var pattern=ctx.createPattern(image,"repeat");
ctx.fillStyle=pattern;ctx.fillRect(-16384,-16384,32768,32768);ctx.restore();}`;
const embeddedSetup = 'var embedded=document.createElement("img");embedded.src="data:image/PNG;base64,AAAA";';
const decodeEmbedded = 'await Promise.all([embedded].map(img=>img.decode()));';
function bitmapSource(definitions = "") {
  return drawingSource("shape8", bitmapShape + definitions)
    .replace("await Promise.all([]);", embeddedSetup + decodeEmbedded);
}
const bitmapBounds = { ...drawingBounds, shape8: [0, 0, 20, 10] };

test("source-bounded embedded bitmap fills retain their closed clip and pattern geometry", () => {
  const input = bitmapSource();
  const result = patchCalculusFilters(input, bitmapBounds);
  assert.equal(result.groups, 1);
  assert.ok(result.source.includes(bitmapShape), "clip and pattern painters are not rewritten");
  assert.ok(result.source.includes('_timelineTextFilters.draw("shape8",canvas,ctx,'));
  assert.ok(result.source.includes('"shape8":[0,0,20,10]'));
  assert.equal(patchCalculusFilters(result.source, bitmapBounds).source, result.source);
  assert.throws(() => patchCalculusFilters(input, drawingBounds), /No verified/,
    "even immutable images require authoritative shape bounds");
  const wrapped = input.replace('place("shape8",canvas,ctx,[1,0,0,1,50,40],color,1,0,0,time);',
    'place("sprite19",canvas,ctx,[1,0,0,1,50,40],color.merge(new cxform(1,2,3,4,256,256,256,256)),1,0,0,time);')
    .replace("function main", composite("sprite19", placement("shape8", "[2,0,0,3,7,-4]")) + "\nfunction main");
  const compositeResult = patchCalculusFilters(wrapped, bitmapBounds);
  assert.equal(compositeResult.groups, 1);
  assert.ok(compositeResult.source.includes('"sprite19":[7,-4,47,26]'));
});

test("bitmap cache rejects dynamic, escaping, mutable or not-yet-decoded images", () => {
  const input = bitmapSource();
  for (const candidate of [
    input.replace('embedded.src="data:image/PNG;base64,AAAA"', 'embedded.src=externalURL'),
    input.replace('data:image/PNG;base64,AAAA', 'https://example.invalid/image.png'),
    input.replace('data:image/PNG;base64,AAAA', 'data:image/svg+xml;base64,AAAA'),
    input.replace('document.createElement("img")', 'document.createElement("canvas")'),
    input.replace(decodeEmbedded, 'await Promise.all([]);'),
    input.replace(decodeEmbedded, `if(externalFlag){${decodeEmbedded}}`),
    input.replace(decodeEmbedded, `try{${decodeEmbedded}}catch(error){}`),
    input.replace(decodeEmbedded, decodeEmbedded + 'embedded.src="data:image/PNG;base64,BBBB";'),
    input.replace(embeddedSetup + decodeEmbedded, decodeEmbedded + embeddedSetup),
    input.replace('img=>img.decode()', 'img=>Promise.resolve(img)'),
    input.replace(embeddedSetup, embeddedSetup + 'embedded.src="data:image/PNG;base64,BBBB";'),
    input.replace(embeddedSetup, embeddedSetup + 'embedded=otherImage;'),
    input.replace(embeddedSetup, embeddedSetup + 'embedded.width=1;'),
    input.replace(embeddedSetup, embeddedSetup + 'var alias=embedded;'),
    input.replace(embeddedSetup, embeddedSetup + 'unknown(embedded);'),
    input.replace(embeddedSetup, embeddedSetup + 'function mutate(){embedded.src="data:image/PNG;base64,BBBB";}'),
    input.replace(embeddedSetup, embeddedSetup + 'function mutate(){embedded=otherImage;}'),
    input.replace(embeddedSetup, embeddedSetup + 'function mutate(){{let embedded=otherImage;}embedded.src=dynamicURL;}'),
    input.replace(embeddedSetup, 'var Promise=customPromise;' + embeddedSetup),
    input.replace(embeddedSetup, 'var document=customDocument;' + embeddedSetup),
    input.replace(embeddedSetup, 'Promise.all=customDecoder;' + embeddedSetup),
    input.replace(embeddedSetup, embeddedSetup + 'if(externalFlag)return {};'),
  ]) assert.throws(() => patchCalculusFilters(candidate, bitmapBounds), /No verified/);
  const withShadow = input.replace(embeddedSetup,
    embeddedSetup + 'function unrelated(embedded){embedded.src=dynamicURL;return embedded;}');
  assert.equal(patchCalculusFilters(withShadow, bitmapBounds).groups, 1,
    "an unrelated minified parameter does not mutate the factory image binding");
});

test("identical raw-image helpers and release-only src cleanup preserve embedded image lifetime", () => {
  const rawHelper = bitmapShape.replace("shape8", "image7");
  const input = bitmapSource(rawHelper).replace("function _timelineRelease() {}",
    'function _timelineRelease(){for(const img of[embedded])img?.removeAttribute("src");}');
  const result = patchCalculusFilters(input, bitmapBounds);
  assert.equal(result.groups, 1);
  assert.equal(patchCalculusFilters(result.source, bitmapBounds).source, result.source);
  for (const candidate of [
    input.replace('img?.removeAttribute("src")', 'img?.setAttribute("src","data:image/PNG;base64,BBBB")'),
    input.replace('for(const img of[embedded])img?.removeAttribute("src");', 'unknown(embedded);'),
    input.replace("function image7", "function arbitraryHelper"),
    input.replace('function image7(ctx,color,frame,ratio,time){', 'function image7(ctx,color,frame,ratio,time){unknown();'),
  ]) assert.throws(() => patchCalculusFilters(candidate, bitmapBounds), /No verified/);
  assert.throws(() => patchCalculusFilters(
    input.replace('function _timelineRelease(){for', 'function _timelineRelease(){return;}function unrelated(){for'),
    bitmapBounds), /No verified/, "src mutation outside the reviewed release path is not permitted");
  const preparedInTry = input.replace(
    'export async function createTimeline(canvas) {', 'export async function createTimeline(canvas) {try{')
    .replace('return {draw(){},dispose:_timelineRelease};\n}', 'return {draw(){},dispose:_timelineRelease};}catch(error){throw error;}\n}');
  assert.equal(patchCalculusFilters(preparedInTry, bitmapBounds).groups, 1,
    "the reviewed preparation try still waits for decoding before returning a renderer");
});

test("bitmap cache rejects arbitrary masks, unbalanced state, dynamic transforms and extra operations", () => {
  const input = bitmapSource();
  for (const candidate of [
    input.replace('var path="M 0 0 L 20 0 20 10 0 10 0 0"', 'var path=dynamicPath'),
    input.replace("ctx.save();ctx.clip();", "ctx.clip();ctx.save();"),
    input.replace("ctx.restore();}", "}"),
    input.replace("ctx.clip();", 'ctx.clip("evenodd");'),
    input.replace("ctx.clip();", "otherContext.clip();"),
    input.replace("ctx.transform(20,0,0,20,0,0)", "ctx.transform(time,0,0,20,0,0)"),
    input.replace("color.applyToImage(embedded)", "color.applyToImage(dynamicImage())"),
    input.replace('createPattern(image,"repeat")', 'createPattern(image,"no-repeat")'),
    input.replace("ctx.fillStyle=pattern", 'ctx.globalCompositeOperation="multiply"'),
    input.replace("ctx.restore();}", "ctx.stroke();ctx.restore();}"),
    input.replace("ctx.restore();}", "Filters.glow(image);ctx.restore();}"),
    input.replace("var image=color.applyToImage", "ratio;var image=color.applyToImage"),
  ]) assert.throws(() => patchCalculusFilters(candidate, bitmapBounds), /No verified/);
});

test("adding embedded bitmap crops to an existing text cache preserves bounds and teardown", () => {
  const initial = patchCalculusFilters(source, drawingBounds).source;
  const input = initial.replace("function main", `${bitmapShape}
function extra(ctx,color,frame,ratio,time){${block.replaceAll("text24", "shape8")}}
function main`).replace("await Promise.all([]);", embeddedSetup + decodeEmbedded);
  const result = patchCalculusFilters(input, bitmapBounds);
  assert.equal(result.groups, 1);
  assert.ok(result.source.includes('"text24":[0,0,20,10],"shape8":[0,0,20,10]'));
  assert.equal(result.source.match(/_timelineTextFilters\?\.dispose\(\)/g).length, 1);
  assert.equal(result.source.match(/_timelineTextFilters=createCachedTextFilters/g).length, 1);
  assert.equal(patchCalculusFilters(result.source, bitmapBounds).source, result.source);
});
