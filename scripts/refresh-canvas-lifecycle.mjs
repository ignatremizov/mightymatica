#!/usr/bin/env node
import { readdir, readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { parse } from "acorn";
import { addContextLifecycle } from "./canvas-timeline-lifecycle.mjs";

async function* modules(folder) {
  for (const entry of await readdir(folder, { withFileTypes: true })) {
    const filename = resolve(folder, entry.name);
    if (entry.isDirectory()) yield* modules(filename);
    else if (entry.isFile() && filename.endsWith(".mjs")) yield filename;
  }
}
let updated = 0;
let checked = 0;
const pending = [];
for await (const filename of modules(resolve("public/media"))) {
  const source = await readFile(filename, "utf8");
  if (!source.startsWith("// Mechanically converted FFDec 26.2.1 drawing code.")) {
    throw new Error(`Unrecognized public module: ${filename}`);
  }
  const next = addContextLifecycle(source);
  const ast = parse(next, { ecmaVersion: "latest", sourceType: "module" });
  function audit(node) {
    if (node.type === "Identifier" && ["eval", "Function", "__proto__", "window", "fetch", "XMLHttpRequest", "setInterval"].includes(node.name)) {
      throw new Error(`Unsafe generated feature ${node.name}: ${filename}`);
    }
    if (node.type === "ImportExpression") throw new Error(`Unexpected import: ${filename}`);
    for (const value of Object.values(node)) {
      if (Array.isArray(value)) {
        for (const child of value) if (child?.type) audit(child);
      } else if (value?.type) audit(value);
    }
  }
  audit(ast);
  checked++;
  if (next !== source) pending.push([filename, next]);
}
// Validate every input before performing this mechanical refresh.
for (const [filename, next] of pending) { await writeFile(filename, next); updated++; }
console.log(`Context lifecycle refreshed: ${updated}; generated modules parsed/audited: ${checked}.`);
