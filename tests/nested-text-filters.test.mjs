import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { parse } from "acorn";
import { patchNestedTextFilters } from "../scripts/optimize-nested-text-filters.mjs";
import { createCachedTextFilters } from "../src/shared/CachedTextFilters.mjs";

const inner = [["dropShadow", 3, 3, 44, 2, [0, 0, 255, 0.7], false, 1, 1, false]];
const outer = [["glow", 5, 5, 1, [255, 40, 0, 0.8], false, false, 1]];
const exactBounds = { text30: [0, 0, 5, 4] };
const leaf = `function text30(ctx,color,frame,ratio,time){
var ink=tocolor(color.apply([255,0,153,0.7]));
ctx.save();ctx.transform(1,0,0,1,0,0);font29(ctx,"S",ink);ctx.restore();}`;
const wrapper = `function sprite31(ctx,color,frame,ratio,time){
var scratch=[];var count=1;frame=frame%count;switch(frame){case 0:
_timelineTextFilters.draw("text30",canvas,ctx,[1,0,0,1,-2,-1],color,${JSON.stringify(inner)});break;}}`;
const block = `var prior=ctx;var image=createCanvas(canvas.width,canvas.height);
var off=image.getContext("2d");enhanceContext(off);off.applyTransforms(ctx._matrix);ctx=off;
place("sprite31",canvas,ctx,[0.8,0.1,-0.2,0.9,12.25,10.75],color,1,(0+time)%1,0,time);
image=Filters.glow(image,image.getContext("2d"),5,5,1,[255,40,0,0.8],false,false,1);
ctx=prior;var saved=ctx._matrix;ctx.setTransform(1,0,0,1,0,0);ctx.drawImage(image,0,0);ctx.applyTransforms(saved);`;
const fixture = `// Mechanically converted FFDec 26.2.1 drawing code. Review before importing.
// Context lifecycle v2: restore canvas ownership before reuse.
export const metadata={width:48,height:32,frames:[1]};
export async function createTimeline(canvas) {
let _timelineTextFilters=null;
${createCachedTextFilters.toString()}
var slices={},rects={};
var place=function(symbol,root,ctx,matrix,color,blend,frame,ratio,time){
if(typeof slices[symbol]!=="undefined"){return rects[symbol];}
placeRaw(symbol,root,ctx,matrix,color,blend,frame,ratio,time);};
${leaf}
${wrapper}
function main(ctx,color,frame,ratio,time){${block}}
const Filters={};
_timelineTextFilters=createCachedTextFilters({place,filters:Filters,enhanceContext,createCanvas,
bounds:{"text30":[0,0,5,4]},width:48,height:32});
return {};
}`;

test("nested one-frame text chains retain order, composed placement, color and original wrappers", () => {
  const result = patchNestedTextFilters(fixture, exactBounds);
  assert.equal(result.groups, 1);
  assert.deepEqual(result.matches, [{
    wrapper: "sprite31", text: "text30", matrix: [0.8, 0.1, -0.2, 0.9, 10.85, 9.65],
    chain: [...inner, ...outer],
  }]);
  assert.ok(result.source.includes(wrapper));
  assert.ok(result.source.includes(leaf));
  assert.ok(result.source.includes('_timelineTextFilters.draw("text30",canvas,ctx,[0.8,0.1,-0.2,0.9,10.85,9.65],color,'));
  const repeat = patchNestedTextFilters(result.source, exactBounds);
  assert.equal(repeat.groups, 0);
  assert.equal(repeat.source, result.source);
  const merged = fixture.replace('],color,1,(0+time)%1', '],color.merge(new cxform(0,0,0,0,256,256,256,180)),1,(0+time)%1');
  assert.ok(patchNestedTextFilters(merged, exactBounds).source.includes(
    '],color.merge(new cxform(0,0,0,0,256,256,256,180)),[["dropShadow"'));
});

test("dynamic, clipped, blended, nontranslation and unverified nested text is never flattened", () => {
  for (const [label, bad] of [
    ["animated wrapper", fixture.replace("var count=1", "var count=2")],
    ["wrapper effect", fixture.replace("var scratch=[];", "ctx.globalAlpha=0.5;var scratch=[];")],
    ["inner scale", fixture.replace("[1,0,0,1,-2,-1]", "[2,0,0,1,-2,-1]")],
    ["different root", fixture.replace('draw("text30",canvas,ctx,', 'draw("text30",other,ctx,')],
    ["shadowed root", fixture.replace("var scratch=[]", "var canvas=[]")],
    ["different inner color", fixture.replace('],color,[["dropShadow"', '],otherColor,[["dropShadow"')],
    ["inner color side effect", fixture.replace('],color,[["dropShadow"', '],color.merge(new cxform()),[["dropShadow"')],
    ["blend mode", fixture.replace('],color,1,(0+time)%1', '],color,2,(0+time)%1')],
    ["clock leaf", fixture.replace('font29(ctx,"S",ink)', 'font29(ctx,time,ink)')],
    ["leaf clipping", fixture.replace('font29(ctx,"S",ink);', 'ctx.clip();font29(ctx,"S",ink);')],
    ["leaf filter", fixture.replace('font29(ctx,"S",ink);', 'Filters.glow(ctx);font29(ctx,"S",ink);')],
    ["inner filter", fixture.replace("[255,40,0,0.8],false,false,1", "[255,40,0,0.8],true,false,1")],
    ["knockout", fixture.replace("[255,40,0,0.8],false,false,1", "[255,40,0,0.8],false,true,1")],
    ["unapproved outer effect", fixture.replace("image=Filters.glow", "image=Filters.bevel")],
    ["different filter owner", fixture.replace("image=Filters.glow", "image=OtherFilters.glow")],
    ["intervening operation", fixture.replace("ctx=prior;var saved", "ctx.clearRect(0,0,1,1);ctx=prior;var saved")],
    ["missing bounds", fixture.replace('"text30":[0,0,5,4]', '"text30":[0,0,6,4]')],
  ]) {
    const result = patchNestedTextFilters(bad, exactBounds);
    assert.equal(result.groups, 0, label);
    assert.equal(result.source, bad, label);
  }
  const tooMany = fixture.replace(JSON.stringify(inner), JSON.stringify([...inner, ...inner, ...inner, ...inner]));
  assert.equal(patchNestedTextFilters(tooMany, exactBounds).groups, 0);
  assert.equal(patchNestedTextFilters(fixture, {}).groups, 0);
  assert.throws(() => patchNestedTextFilters(fixture.replace("var slices={}", "var slices={sprite31:1}"), exactBounds), /scale-nine/);
  assert.throws(() => patchNestedTextFilters(fixture.replace("var slices={}", "var slices={};slices.sprite31=1"), exactBounds), /scale-nine/);
  assert.throws(() => patchNestedTextFilters(fixture.replace("Context lifecycle v2", "unknown lifetime"), exactBounds), /reviewed/);
  assert.throws(() => patchNestedTextFilters(fixture.replace("filters:Filters", "filters:Filters,filters:OtherFilters"), exactBounds), /bindings/);
});

// Deterministic pixel I/O, not a browser/font rasterization substitute. These
// tiny probes run the ACTUAL recovered blur/shadow/glow functions. Translation
// sampling uses a defined bilinear premultiplied rule in both compared paths.
function pixelCanvas(width, height) {
  assert.ok(width <= 64 && height <= 64, "probe must remain tiny");
  const image = { width, height, pixels: new Uint8ClampedArray(width * height * 4) };
  let transform = [1, 0, 0, 1, 0, 0];
  const stack = [];
  const context = {
    globalCompositeOperation: "source-over", fillStyle: "rgba(0,0,0,0)",
    save() { stack.push([...transform]); },
    restore() { transform = stack.pop(); },
    setTransform(...value) { transform = value; },
    applyTransforms(value) { transform = [...value]; },
    getTransform() { return Object.fromEntries(["a", "b", "c", "d", "e", "f"].map((key, i) => [key, transform[i]])); },
    createImageData: (w, h) => ({ width: w, height: h, data: new Uint8ClampedArray(w * h * 4) }),
    getImageData: () => ({ width, height, data: image.pixels.slice() }),
    putImageData(data) { image.pixels.set(data.data); },
    fillRect() {
      image.pixels.fill(0);
      if (this.fillStyle === "#000000") for (let i = 3; i < image.pixels.length; i += 4) image.pixels[i] = 255;
    },
    drawImage(from, dx, dy, dw = from.width, dh = from.height) {
      assert.equal(dw, from.width); assert.equal(dh, from.height);
      assert.deepEqual(transform, [1, 0, 0, 1, 0, 0], "filter composites use pixel coordinates");
      for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) {
        const sx = x - dx, sy = y - dy, ix = Math.floor(sx), iy = Math.floor(sy), rgba = [0, 0, 0, 0];
        for (let j = 0; j <= 1; j++) for (let i = 0; i <= 1; i++) {
          const px = ix + i, py = iy + j;
          if (px < 0 || py < 0 || px >= from.width || py >= from.height) continue;
          const weight = (i ? sx - ix : 1 - sx + ix) * (j ? sy - iy : 1 - sy + iy);
          const at = (py * from.width + px) * 4, alpha = from.pixels[at + 3] / 255 * weight;
          for (let c = 0; c < 3; c++) rgba[c] += from.pixels[at + c] * alpha;
          rgba[3] += alpha;
        }
        const at = (y * width + x) * 4, a = rgba[3], b = image.pixels[at + 3] / 255;
        const behind = this.globalCompositeOperation === "destination-over";
        const factor = this.globalCompositeOperation === "copy" ? 0 : behind ? 1 : 1 - a;
        const input = behind ? 1 - b : 1, alpha = a * input + b * factor;
        for (let c = 0; c < 3; c++) {
          image.pixels[at + c] = alpha ? (rgba[c] * input + image.pixels[at + c] * b * factor) / alpha : 0;
        }
        image.pixels[at + 3] = alpha * 255;
      }
    },
  };
  image.getContext = () => context;
  return image;
}

const recovered = readFileSync(new URL("../public/media/dissections/bills-ru.mjs", import.meta.url), "utf8");
const filterNames = new Set(["_premultiply", "_unpremultiply", "_boxBlurHorizontal", "_boxBlurVertical",
  "blur", "_setRGB", "_moveRGB", "dropShadow", "glow"]);
const filterAssignments = new Map();
function collect(node) {
  if (!node?.type) return;
  if (node.type === "AssignmentExpression" && node.left?.type === "MemberExpression"
    && node.left.object.name === "o" && filterNames.has(node.left.property.name)) {
    assert.equal(filterAssignments.has(node.left.property.name), false);
    filterAssignments.set(node.left.property.name, recovered.slice(node.start, node.end));
  }
  for (const value of Object.values(node)) {
    if (Array.isArray(value)) value.forEach(collect);
    else if (value?.type) collect(value);
  }
}
collect(parse(recovered, { ecmaVersion: "latest", sourceType: "module" }));
assert.equal(filterAssignments.size, filterNames.size);
const filterModule = await import(`data:text/javascript;base64,${Buffer.from(
  `export function make(createCanvas){const o={};${[...filterAssignments.values()].join(";\n")};return o;}`
).toString("base64")}`);
const filters = filterModule.make(pixelCanvas);

function paintLeaf(_symbol, _canvas, target, matrix, color) {
  const p = Object.values(target.getTransform()), [a, , , d, tx, ty] = matrix;
  const left = p[0] * tx + p[4], top = p[3] * ty + p[5], right = left + p[0] * a * 5, bottom = top + p[3] * d * 4;
  const image = target.createImageData(target.image.width, target.image.height);
  for (let y = 0; y < target.image.height; y++) for (let x = 0; x < target.image.width; x++) {
    const coverage = Math.max(0, Math.min(x + 1, right) - Math.max(x, left))
      * Math.max(0, Math.min(y + 1, bottom) - Math.max(y, top));
    if (coverage) image.data.set([...color.rgb, 255 * color.alpha * coverage], (y * target.image.width + x) * 4);
  }
  target.putImageData(image);
}
function canvasForLeaf(width, height) {
  const image = pixelCanvas(width, height);
  image.getContext("2d").image = image;
  return image;
}
function applyChain(image, chain) {
  for (const [kind, ...args] of chain) image = filters[kind](image, image.getContext("2d"), ...args);
  return image;
}

test("actual recovered filters retain chain order and transparent intermediate composition at source density", () => {
  const seed = canvasForLeaf(48, 32);
  paintLeaf("text30", seed, seed.getContext("2d"), [1, 0, 0, 1, 18.25, 12.75], { rgb: [83, 190, 47], alpha: 0.65 });
  const first = applyChain(seed, inner), intermediate = pixelCanvas(48, 32);
  intermediate.getContext("2d").drawImage(first, 0, 0);
  assert.deepEqual(intermediate.pixels, first.pixels, "identity composition onto transparency preserves filter pixels");
  const nested = applyChain(intermediate, outer);
  const fused = applyChain(seed, [...inner, ...outer]);
  assert.deepEqual(fused.pixels, nested.pixels);
  assert.notDeepEqual(applyChain(seed, [...outer, ...inner]).pixels, nested.pixels, "order is observable");
  assert.ok(nested.pixels.some(value => value > 0), "actual ink, not a blank-pixel smoke");
});

test("fused cropped cache agrees with full-stage nested filters at stage edges and fractional positions", () => {
  for (const [x, y] of [[18.25, 12.75], [-0.75, 0.25], [44.25, 28.75], [-4.25, 14.5]]) {
    const matrix = [0.8, 0, 0, 0.9, x, y], color = { rgb: [83, 190, 47], alpha: 0.65 };
    const seed = canvasForLeaf(48, 32);
    paintLeaf("text30", seed, seed.getContext("2d"), matrix, color);
    const first = applyChain(seed, inner), intermediate = pixelCanvas(48, 32);
    intermediate.getContext("2d").drawImage(first, 0, 0);
    const expected = applyChain(intermediate, outer);
    const result = pixelCanvas(48, 32);
    let paints = 0;
    const renderer = createCachedTextFilters({
      place(...args) { paints++; paintLeaf(...args); },
      filters, createCanvas: canvasForLeaf, enhanceContext() {},
      bounds: exactBounds, width: 48, height: 32,
    });
    renderer.draw("text30", result, result.getContext("2d"), matrix, color, [...inner, ...outer]);
    assert.deepEqual(result.pixels, expected.pixels, `fractional/edge placement ${x},${y}`);
    renderer.draw("text30", pixelCanvas(48, 32), result.getContext("2d"), matrix, color, [...inner, ...outer]);
    assert.equal(paints, 1, "unchanged repeated text reuses the fused chain");
    renderer.dispose();
  }
});
