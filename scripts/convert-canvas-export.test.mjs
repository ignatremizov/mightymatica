import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, writeFile, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spawnSync } from "node:child_process";

// Representative exporter syntax, not a canvas implementation or runtime mock.
const runtime = `Filters = {};
function placeRaw(obj,ctx,ctrans,frame,ratio,time) {
eval(obj + "(ctx,new cxform(0,0,0,0,255,255,255,255),frame,ratio,time);");
eval(obj + "(ctx,ctrans,frame,ratio,time);");
}
function enhanceContext(context) {
var super_ = context.__proto__;
context.__proto__ = ({save:function(){super_.save.call(this);}, __proto__: super_});
}
window.addEventListener('load', function(){});
function drawMorphPath() {}
`;
const html = (extra = "") => `<script>var canvas=document.getElementById("myCanvas");
function main(ctx,ctrans,frame,ratio,time) {}
${extra}
var frame = -1;
var frames = []; frames.push(0); frames.push(1);
var originalWidth = 550; var originalHeight= 400;
var backgroundColor = "#66ffff";
window.setInterval(function(){},41);
</script>`;
async function convert(body) {
  const dir = await mkdtemp(join(tmpdir(), "mm-converter-test-"));
  try {
    await writeFile(join(dir, "canvas.js"), runtime);
    await writeFile(join(dir, "frames.html"), body);
    const output = join(dir, "out.mjs");
    const result = spawnSync(process.execPath,
      [new URL("./convert-canvas-export.mjs", import.meta.url).pathname, dir, output],
      { encoding: "utf8" });
    return { ...result, module: result.status === 0 ? await readFile(output, "utf8") : "" };
  } finally { await rm(dir, { recursive: true, force: true }); }
}
test("recovered FFDec dispatch becomes a closed registry without original timers or prototype swaps", async () => {
  const result = await convert(html());
  assert.equal(result.status, 0, result.stderr);
  assert.match(result.module, /symbols\[obj\]/);
  assert.match(result.module, /Object\.create\(null\)/);
  assert.match(result.module, /"frames":\[1,2\]/);
  assert.doesNotMatch(result.module, /\beval\s*\(|__proto__|setInterval|window\.addEventListener/);
});
test("unexpected executable or external-resource escape fails conversion", async () => {
  for (const extra of [
    'fetch("https://example.com");',
    'var imageObj1=document.createElement("img"); imageObj1.src="https://example.com/art.png";',
    'var run = new Function("return 1");',
    'document.body.innerHTML="unsafe";',
  ]) {
    const result = await convert(html(extra));
    assert.notEqual(result.status, 0);
    assert.equal(result.module, "");
  }
});

test("font drawing exports keep fill state local in strict modules", async () => {
  const result = await convert(html("function font21(ctx,ch,textColor){\n\tdefaultFill = textColor;\n}"));
  assert.equal(result.status, 0, result.stderr);
  assert.match(result.module, /var defaultFill = textColor;/);
});
