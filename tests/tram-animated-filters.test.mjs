import test from "node:test";
import assert from "node:assert/strict";
import { createCachedTextFilters } from "../src/shared/CachedTextFilters.mjs";
import { patchTramAnimation } from "../scripts/tram-animated-filters.mjs";

const targets = {
  en: { sprite17: 50, sprite45: 49, sprite57: 49, sprite59: 49, sprite71: 49 },
  ru: { sprite17: 50, sprite45: 49, sprite56: 49, sprite58: 49, sprite66: 49 },
};
function fixture(locale, stroke = false) {
  const shape = `function shape6(ctx,color,frame,ratio,time){
var path="M 0 0 Q 10 20 20 0";
ctx.fillStyle=tocolor(color.apply([0,0,0,1]));drawPath(ctx,path,false);ctx.fill("evenodd");
${stroke ? `var path="M 0 0 Q 10 20 20 0";var mode="NORMAL";
ctx.strokeStyle=tocolor(color.apply([0,0,0,1]));ctx.lineWidth=.4;
ctx.lineCap="round";ctx.lineJoin="round";drawPath(ctx,path,true,mode);` : ""}
}`;
  const characters = Object.entries(targets[locale]).map(([symbol, count]) =>
    `function ${symbol}(ctx,color,frame,ratio,time){var scratch=[];var size=${count};frame=frame%size;switch(frame){${
      Array.from({ length: count }, (_, index) => `case ${index}:place("shape6",canvas,ctx,[1,0,0,1,${index},0],color,1,0,0,time);break;`).join("")
    }}}`);
  const blocks = Object.entries(targets[locale]).map(([symbol, count]) => `
var previous=ctx;var image=createCanvas(canvas.width,canvas.height);
var off=image.getContext("2d");enhanceContext(off);off.applyTransforms(ctx._matrix);ctx=off;
place("${symbol}",canvas,ctx,[.016,0,0,.016,100,200],color,1,(3+time)%${count},40,time);
image=Filters.dropShadow(image,image.getContext("2d"),4,4,44,4,[0,0,0,1],false,1,1,false);
ctx=previous;var saved=ctx._matrix;ctx.setTransform(1,0,0,1,0,0);ctx.drawImage(image,0,0);ctx.applyTransforms(saved);`);
  const source = `// Mechanically converted FFDec 26.2.1 drawing code. Reviewed fixture.
// Context lifecycle v2: restore canvas ownership before reuse.
export const metadata={frames:[1],width:550,height:400};
export async function createTimeline(canvas){
${createCachedTextFilters.toString()}
function _timelineRelease(){}
${shape}
${characters.join("\n")}
function main(ctx,color,frame,ratio,time){switch(frame){case 0:${blocks.join("\n")}break;}}
const Filters={};await Promise.all([]);return {draw(){},dispose:_timelineRelease};
}`;
  return { source, characters, bounds: { shape6: [0, 0, 20, 10] } };
}

test("Tram preserves each speaker's independent 49/50-frame clock and all original poses in both languages", () => {
  for (const locale of ["en", "ru"]) {
    const input = fixture(locale);
    const result = patchTramAnimation(input.source, input.bounds, locale);
    assert.equal(result.groups, 5);
    for (const [symbol, count] of Object.entries(targets[locale])) {
      assert.equal(result.poseBounds[symbol].length, count);
      assert.deepEqual(result.bounds[symbol], [0, 0, 20 + count - 1, 20],
        "the path's control hull is included, not just its original tight curve bounds");
      assert.ok(result.source.includes(`[(3+time)%${count},40,time]`));
    }
    assert.ok(input.characters.every(character => result.source.includes(character)));
    assert.ok(result.source.includes("_tramAnimatedFilters?.dispose();"));
    assert.equal(patchTramAnimation(result.source, input.bounds, locale).source, result.source);
  }
});

test("Tram's fractional round-stroke widths get conservative crop padding without changing the painter", () => {
  const input = fixture("en", true), result = patchTramAnimation(input.source, input.bounds, "en");
  assert.deepEqual(result.bounds.sprite17, [-16, -16, 85, 36]);
  assert.ok(result.source.includes("ctx.lineWidth=.4;"));
  for (const unsafe of [
    input.source.replace('ctx.lineJoin="round"', 'ctx.lineJoin="miter"'),
    input.source.replace("ctx.lineWidth=.4", "ctx.lineWidth=time"),
    input.source.replace("ctx.lineWidth=.4", "ctx.lineWidth=-.4"),
  ]) assert.throws(() => patchTramAnimation(unsafe, input.bounds, "en"));
});

test("Tram rejects mismatched source languages, changed loop lengths, masks and non-source shadow effects", () => {
  const input = fixture("en");
  assert.throws(() => patchTramAnimation(input.source, input.bounds, "ru"));
  assert.throws(() => patchTramAnimation(input.source, input.bounds, "unknown"), /language/);
  for (const unsafe of [
    input.source.replace("var size=50", "var size=51"),
    input.source.replace('ctx.fill("evenodd");', 'ctx.fill("evenodd");ctx.clip();'),
    input.source.replace("(3+time)%50,40,time", "(3+time)%49,40,time"),
    input.source.replace("4,4,44,4,[0,0,0,1]", "4,4,44,8,[0,0,0,1]"),
    input.source.replace("[.016,0,0,.016,100,200]", "[.016,.01,0,.016,100,200]"),
  ]) assert.throws(() => patchTramAnimation(unsafe, input.bounds, "en"));
});
