import test from "node:test";
import assert from "node:assert/strict";
import { createCachedTextFilters } from "../src/shared/CachedTextFilters.mjs";
import { patchEarthBeltAnimation } from "../scripts/earth-belt-animated-filters.mjs";

const shadow = [["dropShadow", 5, 5, 44, 5, [0, 0, 0, 1], false, 1, 1, false]];
function cacheFixture() {
  const images = [], painted = [], filtered = [], shown = [];
  const cache = createCachedTextFilters({
    width: 550, height: 400, bounds: { sprite57: [-10, -10, 20, 20] },
    maxEntries: 2, maxPixels: 200_000,
    enhanceContext() {},
    createCanvas(width, height) {
      const image = { width, height };
      const context = { applyTransforms(matrix) { this._matrix = matrix; } };
      image.getContext = () => context;
      images.push(image);
      return image;
    },
    place(...args) { painted.push(args); },
    filters: { dropShadow(image, _context, ...args) { filtered.push(args); return image; } },
  });
  const canvas = { width: 1100, height: 800 };
  const context = {
    getTransform: () => ({ a: 2, b: 0, c: 0, d: 2, e: 0, f: 0 }),
    save() {}, restore() {}, setTransform() {}, drawImage(...args) { shown.push(args); },
  };
  const draw = sample => cache.draw("sprite57", canvas, context,
    [-1, 0, 0, 1, 100, 200], { alpha: 256 }, shadow, sample);
  return { cache, images, painted, filtered, shown, draw };
}

test("animated shadow keeps the original pose, ratio and clock instead of freezing the first frame", () => {
  const fixture = cacheFixture();
  fixture.draw([0, 325, 10]);
  fixture.draw([1, 325, 11]);
  fixture.draw([1, 325, 11]);
  fixture.draw([1, 326, 11]);
  fixture.draw([1, 326, 12]);
  assert.deepEqual(fixture.painted.map(args => args.slice(6)), [
    [0, 325, 10], [1, 325, 11], [1, 326, 11], [1, 326, 12],
  ]);
  assert.equal(fixture.shown.length, 5);
  assert.ok(fixture.images.every(image => image.width < 100 && image.height < 100));
  assert.deepEqual(fixture.filtered[0], shadow[0].slice(1), "authored shadow arguments are unchanged");
  assert.ok(fixture.images.filter(image => image.width > 0).length <= 2);
  fixture.cache.dispose();
  fixture.cache.dispose();
  assert.ok(fixture.images.every(image => image.width === 0 && image.height === 0));
});

test("animated effect sample validation fails before drawing invalid clock values", () => {
  const fixture = cacheFixture();
  for (const sample of [[0, 1], [0, 1, NaN], [Infinity, 0, 1], {}, "frame"]) {
    assert.throws(() => fixture.draw(sample), /Invalid drawing sample/);
  }
  assert.equal(fixture.painted.length, 0);
  assert.equal(fixture.images.length, 0);
});

const body = `function shape32(ctx,color,frame,ratio,time){
var path="M 0 0 L 20 0 20 10 0 10 0 0";
ctx.fillStyle=tocolor(color.apply([0,0,0,1]));drawPath(ctx,path,false);ctx.fill("evenodd");
}`;
const pose = index => `case ${index}:place("shape32",canvas,ctx,[1,0,0,1,${index},0],color,1,0,0,time);break;`;
const character = `function sprite57(ctx,color,frame,ratio,time){
var scratch=[];var size=49;frame=frame%size;switch(frame){${Array.from({ length: 49 }, (_, index) => pose(index)).join("")}}
}`;
const originalShadow = `
var previous=ctx;var image=createCanvas(canvas.width,canvas.height);
var off=image.getContext("2d");enhanceContext(off);off.applyTransforms(ctx._matrix);ctx=off;
place("sprite57",canvas,ctx,[-.02,0,0,.02,300,200],color,1,(0+time)%49,325,time);
image=Filters.dropShadow(image,image.getContext("2d"),5,5,44,5,[0,0,0,1],false,1,1,false);
ctx=previous;var saved=ctx._matrix;ctx.setTransform(1,0,0,1,0,0);ctx.drawImage(image,0,0);ctx.applyTransforms(saved);
`;
const source = `// Mechanically converted FFDec 26.2.1 drawing code. Reviewed fixture.
// Context lifecycle v2: restore canvas ownership before reuse.
export const metadata={frames:[1],width:550,height:400};
export async function createTimeline(canvas){
${createCachedTextFilters.toString()}
function _timelineRelease(){}
${body}
${character}
function main(ctx,color,frame,ratio,time){switch(frame){case 0:${originalShadow}break;}}
const Filters={};
await Promise.all([]);
return {draw(){},dispose:_timelineRelease};
}`;
const bounds = { shape32: [0, 0, 20, 10] };

test("bounded character rewrite includes all 49 poses and preserves original drawing and clock expressions", () => {
  const patched = patchEarthBeltAnimation(source, bounds);
  assert.equal(patched.groups, 1);
  assert.deepEqual(patched.bounds, [0, 0, 68, 10]);
  assert.equal(patched.poseBounds.length, 49);
  assert.deepEqual(patched.poseBounds[48], [48, 0, 68, 10]);
  assert.ok(patched.source.includes(character));
  assert.ok(patched.source.includes(body));
  assert.ok(patched.source.includes("[(0+time)%49,325,time]"));
  assert.ok(patched.source.includes("_earthBeltAnimatedFilters?.dispose();"));
  assert.equal(patchEarthBeltAnimation(patched.source, bounds).source, patched.source);
});

test("animated crop rejects unbounded artwork, unknown effects, blend changes and unsupported placement", () => {
  for (const candidate of [
    source.replace("var size=49", "var size=50"),
    source.replace('ctx.fill("evenodd");', 'ctx.fill("evenodd");ctx.clip();'),
    source.replace('ctx.fill("evenodd");', 'ctx.fill("evenodd");unknownPainter(ctx);'),
    source.replace('[1,0,0,1,48,0]', '[1,0,0,1,time,0]'),
    source.replace('color,1,0,0,time);break;', 'color,2,0,0,time);break;'),
    source.replace('[-.02,0,0,.02,300,200]', '[-.02,0,0,.04,300,200]'),
    source.replace('Filters.dropShadow', 'Filters.bevel'),
    source.replace('false,1,1,false);', 'true,1,1,false);'),
    source.replace('createCachedTextFilters({', 'unreviewedCache({'),
  ]) assert.throws(() => patchEarthBeltAnimation(candidate, bounds));
  assert.throws(() => patchEarthBeltAnimation(source, {}), /source-verified shape bounds/);
});
