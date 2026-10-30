import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import { splitCalculusFrameDispatch } from "../scripts/calculus-frame-dispatch.mjs";

const fixture = cases => `export function createTimeline(){let closed=7;{
function main(t,n,r,i,a){t.save();t.transform(1,0,0,1,0,0);var s=[];var c=11859;r=r%c;switch(r){${cases}}t.restore()}
return main;}}`;
const load = async source => (await import(`data:text/javascript,${encodeURIComponent(source)}`)).createTimeline();
const trace = (fn, frame) => {
  const calls = [];
  const t = { save: () => calls.push("save"), transform: (...a) => calls.push(a),
    restore: () => calls.push("restore"), draw: (...a) => calls.push(a) };
  fn(t, 2, frame, 3, 4);
  return calls;
};
test("bounded root dispatch retains closures, normalization, sparse frames and var hoisting", async () => {
  const cases = Array.from({ length: 67 }, (_, index) =>
    `case ${4000 + index * 2}:t.draw(closed,n,r,i,a,typeof l,s.length,c);var l=${index};s.push(l);break;`).join("");
  const original = fixture(cases);
  const result = splitCalculusFrameDispatch(original);
  assert.equal(result.helpers, 3);
  const [before, after] = await Promise.all([load(original), load(result.source)]);
  for (const frame of [3999, 4000, 4001, 4062, 4064, 4128, 4132, 4134, 4000 + 11859, NaN, -1]) {
    assert.deepEqual(trace(after, frame), trace(before, frame));
  }
  assert.ok(result.source.includes(cases.slice(0, cases.indexOf("case 4002:"))));
});
test("unknown scopes, control flow and data dependencies fail closed", () => {
  for (const cases of [
    "default:break;", "case 1:t.draw(1);case 2:break;",
    "case 1:let x=1;break;", "case 1:function nested(){}break;",
    "case 1:r=2;break;", "case 1:t={};break;", "case 1:closed=2;break;",
    "case 1:t.draw(arguments);break;", "case 1:eval('x');break;",
    "case 1:if(n)break;break;", "case 2:break;case 1:break;",
    "case 1:var s=2;break;", "case 1:while(n){}break;",
  ]) assert.throws(() => splitCalculusFrameDispatch(fixture(cases)), /Frame dispatch:/);
  assert.throws(() => splitCalculusFrameDispatch(fixture("case 1:break;").replace("t.restore()", "t.draw(l)")), /prefix\/suffix/);
  assert.throws(() => splitCalculusFrameDispatch(fixture("case 1:break;"), { chunkSize: 33 }));
});

test("temporary filter contexts are restored before the original suffix", async () => {
  const source = fixture("case 1:var l=t;var d=n;t=d;t=l;t.draw(7);break;");
  const [before, after] = await Promise.all([load(source), load(splitCalculusFrameDispatch(source).source)]);
  assert.deepEqual(trace(after, 1), trace(before, 1));
  for (const body of [
    "var l=t;t=n;", "var l=t;t=n;l=n;t=l;", "var l=t;t=n;t=(l=n);",
  ]) assert.throws(() => splitCalculusFrameDispatch(fixture(`case 1:${body}break;`)));
});

test("vars declared only in another chunk remain hoisted instead of capturing factory state", async () => {
  const source = fixture("case 1:t.draw(typeof closed);break;case 2:var closed=4;t.draw(closed);break;");
  const [before, after] = await Promise.all([
    load(source), load(splitCalculusFrameDispatch(source, { chunkSize: 1 }).source),
  ]);
  for (const frame of [1, 2, 1]) assert.deepEqual(trace(after, frame), trace(before, frame));
  assert.throws(() => splitCalculusFrameDispatch(source.replace("return main;", "return main;function _calculusFrameChunk0(){}")), /collision/);
  assert.throws(() => splitCalculusFrameDispatch(source.replace("let closed=7;{", "let closed=7;function nested(){")), /nested in another/);
});

// Explicit opt-in: executes preserved generated code, not part of the fast suite.
test("actual en/2 transition retains Canvas commands and filter pixel work", {
  skip: process.env.CALCULUS_DISPATCH_PROOF !== "1",
}, async () => {
  let source = await readFile(process.env.CALCULUS_DISPATCH_SOURCE
    ?? new URL("../public/media/calculus/native/en/chapter-2.mjs", import.meta.url), "utf8");
  if (source.includes("// Bounded calculus root frame dispatch v1")) {
    source = await readFile(new URL("../.cache/calculus-transition-originals/en/chapter-2.mjs", import.meta.url), "utf8");
  }
  const candidate = splitCalculusFrameDispatch(source);
  const importSource = text => import(`data:text/javascript;base64,${Buffer.from(text).toString("base64")}`);
  const previous = Object.getOwnPropertyDescriptor(globalThis, "document");
  let hash, reads, pixels, canvasIndex;
  const record = (...args) => hash.update(JSON.stringify(args, (_key, value) =>
    ArrayBuffer.isView(value) ? { bytes: value.byteLength, sha: createHash("sha256").update(value).digest("hex") } : value) + "\n");
  const identity = () => [1, 0, 0, 1, 0, 0];
  const multiply = (a, b) => [
    a[0]*b[0]+a[2]*b[1], a[1]*b[0]+a[3]*b[1],
    a[0]*b[2]+a[2]*b[3], a[1]*b[2]+a[3]*b[3],
    a[0]*b[4]+a[2]*b[5]+a[4], a[1]*b[4]+a[3]*b[5]+a[5],
  ];
  function canvas(width = 1, height = 1) {
    const id = canvasIndex++;
    const result = { width, height, style: {}, toJSON: () => ({ canvas: id, width: result.width, height: result.height }) };
    let matrix = identity();
    const saved = [];
    const context = { canvas: result };
    for (const key of ["fillStyle", "strokeStyle", "lineWidth", "lineCap", "lineJoin", "miterLimit",
      "globalAlpha", "globalCompositeOperation", "filter", "font", "textAlign", "textBaseline",
      "shadowColor", "shadowBlur", "shadowOffsetX", "shadowOffsetY", "imageSmoothingEnabled"]) {
      let current;
      Object.defineProperty(context, key, {
        configurable: true, get: () => current,
        set: value => { current = value; record(id, key, value); },
      });
    }
    for (const key of ["clearRect", "fillRect", "drawImage", "beginPath", "moveTo", "lineTo",
      "quadraticCurveTo", "bezierCurveTo", "closePath", "fill", "stroke", "clip", "putImageData"]) {
      context[key] = (...args) => record(id, key, args);
    }
    context.save = () => { record(id, "save"); saved.push([...matrix]); };
    context.restore = () => { record(id, "restore"); matrix = saved.pop() ?? identity(); };
    const transform = (...values) => { record(id, "transform", values); matrix = multiply(matrix, values); };
    context.transform = transform;
    context.setTransform = (...values) => { record(id, "setTransform", values); matrix = values; };
    context.resetTransform = () => { matrix = identity(); };
    context.scale = (x, y) => transform(x, 0, 0, y, 0, 0);
    context.translate = (x, y) => transform(1, 0, 0, 1, x, y);
    context.rotate = angle => transform(Math.cos(angle), Math.sin(angle), -Math.sin(angle), Math.cos(angle), 0, 0);
    context.getTransform = () => Object.fromEntries(["a", "b", "c", "d", "e", "f"].map((key, index) => [key, matrix[index]]));
    context.getImageData = (x, y, w, h) => {
      reads++; pixels += Math.ceil(w) * Math.ceil(h);
      record(id, "getImageData", x, y, w, h);
      if (pixels > 64_000_000) throw new Error("proof pixel budget");
      return { width: w, height: h, data: new Uint8ClampedArray(Math.max(1, Math.ceil(w)*Math.ceil(h))*4) };
    };
    context.createImageData = (w, h) => ({ width: w, height: h, data: new Uint8ClampedArray(Math.max(1,w*h)*4) });
    context.createPattern = () => ({ setTransform() {} });
    context.createLinearGradient = context.createRadialGradient = () => ({ addColorStop() {} });
    result.getContext = () => context;
    return result;
  }
  Object.defineProperty(globalThis, "document", { configurable: true, value: {
    createElement: tag => tag === "canvas" ? canvas() : { width: 1, height: 1, decode: async () => {}, removeAttribute() {} },
  } });
  try {
    const outputs = [];
    for (const text of [source, candidate.source]) {
      hash = createHash("sha256"); reads = pixels = canvasIndex = 0;
      const module = await importSource(text);
      const renderer = await module.createTimeline(canvas(550, 400));
      const samples = [];
      try {
        for (let frame = 5430; frame <= 5550; frame++) {
          hash = createHash("sha256"); reads = pixels = 0;
          renderer.draw(frame, frame - 1);
          samples.push({ frame, hash: hash.digest("hex"), reads, pixels });
        }
      } finally { renderer.dispose(); }
      outputs.push(samples);
    }
    assert.deepEqual(outputs[1], outputs[0]);
  } finally {
    if (previous) Object.defineProperty(globalThis, "document", previous);
    else delete globalThis.document;
  }
});
