#!/usr/bin/env node
/**
 * Mechanical conversion of locally reviewed FFDec 26.2.1 drawing exports.
 * This is not a sandbox or an importer for untrusted JavaScript.
 */
import { readFile, writeFile, mkdir } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { parse } from "acorn";
import { addContextLifecycle } from "./canvas-timeline-lifecycle.mjs";
import { localizeFontFill } from "./canvas-font-locals.mjs";
import { patchContextTransforms } from "./canvas-context-transforms.mjs";

const [input, output] = process.argv.slice(2);
if (!input || !output || process.argv.length !== 4) {
  console.error("Usage: node scripts/convert-canvas-export.mjs REVIEWED_EXPORT_DIR output.mjs");
  process.exit(1);
}
const fail = (message) => { throw new Error(message); };
const html = await readFile(resolve(input, "frames.html"), "utf8");
let runtime = await readFile(resolve(input, "canvas.js"), "utf8");
const scripts = [...html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/g)]
  .map((match) => match[1]).filter((body) => body.trim());
if (scripts.length !== 1) fail("Expected exactly one FFDec inline drawing script.");
const script = scripts[0];
const start = 'var canvas=document.getElementById("myCanvas");';
const end = "var frame = -1;";
if (!script.startsWith(start) || !script.includes(end)) fail("Unrecognized FFDec timeline boilerplate.");
let drawing = script.slice(start.length, script.indexOf(end));
drawing = localizeFontFill(drawing);
const number = (pattern, name) => {
  const value = Number(script.match(pattern)?.[1]);
  if (!Number.isSafeInteger(value) || value < 1) fail(`Missing ${name}.`);
  return value;
};
const width = number(/var originalWidth\s*=\s*(\d+);/, "width");
const height = number(/var originalHeight\s*=\s*(\d+);/, "height");
if (width > 2048 || height > 2048) fail("Canvas dimensions exceed the restoration budget.");
const background = script.match(/var backgroundColor\s*=\s*"(#[a-fA-F0-9]{6})";/)?.[1];
if (!background) fail("Missing plain background color.");
const selectedFrames = [...script.matchAll(/frames\.push\((\d+)\);/g)].map((match) => Number(match[1]) + 1);
if (!selectedFrames.length) fail("Missing selected frames.");
const functionNames = [...drawing.matchAll(/^function ([A-Za-z_$][\w$]*)\(/gm)].map((match) => match[1]);
if (!functionNames.includes("main")) fail("Missing main drawing function.");
const images = [...drawing.matchAll(/var (imageObj\d+) = document\.createElement\("img"\);/g)].map((match) => match[1]);

// Exact known exporter dispatch replacements. No JavaScript string evaluation.
const dispatches = [
  ['eval(obj + "(ctx,new cxform(0,0,0,0,255,255,255,255),frame,ratio,time);");',
    "symbols[obj](ctx,new cxform(0,0,0,0,255,255,255,255),frame,ratio,time);"],
  ['eval(obj + "(ctx,ctrans,frame,ratio,time);");',
    "symbols[obj](ctx,ctrans,frame,ratio,time);"],
];
for (const [from, to] of dispatches) {
  if (runtime.split(from).length !== 2) fail("Unknown FFDec dispatch implementation.");
  runtime = runtime.replace(from, to);
}
const chromeStart = runtime.indexOf("window.addEventListener('load'");
const chromeEnd = runtime.indexOf("function drawMorphPath(", chromeStart);
if (chromeStart < 0 || chromeEnd < 0) fail("Unknown FFDec resize chrome.");
runtime = runtime.slice(0, chromeStart) + runtime.slice(chromeEnd);
runtime = runtime.replace(/^Filters = \{\};/m, "var Filters = {};");
runtime = runtime.replace(/^\s*document\.body\.(?:appendChild|removeChild)\(c\);\r?$/gm, "");
// The exporter shadows context methods by swapping its prototype. Keep the same
// wrappers as own methods instead, capturing only the eight original methods.
const protoStart = "var super_ = context.__proto__;";
const protoEnd = "__proto__: super_";
if (runtime.split(protoStart).length !== 2 || runtime.split(protoEnd).length !== 2) fail("Unknown context enhancement.");
runtime = runtime.replace(protoStart,
  "var super_ = {save:context.save,restore:context.restore,scale:context.scale,rotate:context.rotate,translate:context.translate,transform:context.transform,setTransform:context.setTransform,resetTransform:context.resetTransform};");
runtime = runtime.replace("context.__proto__ = ({", "Object.assign(context, {");
runtime = runtime.replace(/,\s*__proto__: super_\s*\}\);/, "\n    });");

// Fail closed on execution/network/lifecycle features absent from drawing code.
// AST parsing avoids interpreting text embedded in PNGs or comments as code.
const source = parse(runtime + drawing, { ecmaVersion: "latest", sourceType: "script" });
const forbidden = new Set(["eval", "Function", "fetch", "XMLHttpRequest", "WebSocket",
  "Worker", "SharedWorker", "importScripts", "setInterval", "setTimeout",
  "requestAnimationFrame", "window", "globalThis", "navigator", "location",
  "localStorage", "sessionStorage", "cookie", "innerHTML", "outerHTML",
  "insertAdjacentHTML", "constructor", "__proto__", "prototype"]);
function audit(node) {
  if (node.type === "Identifier" && forbidden.has(node.name)) fail(`Unsupported drawing feature: ${node.name}`);
  if (node.type === "ImportExpression") fail("Dynamic import in drawing code.");
  if (node.type === "MemberExpression" && node.object.type === "Identifier" && node.object.name === "document") {
    if (node.computed || node.property.name !== "createElement") fail("Unexpected document access.");
  }
  if (node.type === "CallExpression" && node.callee.type === "MemberExpression"
    && node.callee.object.type === "Identifier" && node.callee.object.name === "document") {
    const arg = node.arguments[0];
    if (node.arguments.length !== 1 || arg.type !== "Literal" || !["img", "canvas"].includes(arg.value)) fail("Unexpected DOM construction.");
  }
  if (node.type === "AssignmentExpression" && node.left.type === "MemberExpression" && node.left.property.name === "src") {
    if (node.right.type !== "Literal" || typeof node.right.value !== "string"
      || !/^data:image\/(?:PNG|png|jpeg|JPEG);base64,[A-Za-z0-9+/=]+$/.test(node.right.value)) fail("Only embedded image data is supported.");
  }
  for (const value of Object.values(node)) {
    if (Array.isArray(value)) {
      for (const child of value) if (child && typeof child.type === "string") audit(child);
    } else if (value && typeof value === "object" && typeof value.type === "string") audit(value);
  }
}
audit(source);
const module = `// Mechanically converted FFDec 26.2.1 drawing code. Review before importing.
export const metadata = ${JSON.stringify({ width, height, frames: selectedFrames, background })};
export async function createTimeline(canvas) {
${runtime}
${drawing}
const symbols = Object.freeze(Object.assign(Object.create(null), {${functionNames.join(",")}}));
await Promise.all([${images.join(",")}].map(image => image.decode()));
return {
  draw(frame, time = 0) {
    ctx.setTransform(1,0,0,1,0,0);
    ctx.clearRect(0,0,canvas.width,canvas.height);
    ctx.fillStyle = ${JSON.stringify(background)};
    ctx.fillRect(0,0,canvas.width,canvas.height);
    ctx.save();
    ctx.scale(canvas.width/${width},canvas.height/${height});
    main(ctx,ctrans,frame-1,0,time);
    ctx.restore();
  },
  dispose() { ${images.map((name) => `${name}.removeAttribute("src");`).join(" ")} }
};
}
`;
await mkdir(dirname(resolve(output)), { recursive: true });
await writeFile(resolve(output), patchContextTransforms(addContextLifecycle(module)).source);
console.log(`Converted ${selectedFrames.length} selected frames, ${images.length} embedded images → ${output}`);
console.log("No generated drawing code was executed. Review the module before importing.");
