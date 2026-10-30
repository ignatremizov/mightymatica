#!/usr/bin/env node
// Apply the two bounded, artwork-preserving Calculus runtime optimizations.
import { readFile, writeFile, mkdir, rename } from "node:fs/promises";
import { resolve, dirname } from "node:path";
import { createHash } from "node:crypto";
import { parse } from "acorn";
import { patchCalculusFilterBuffers } from "./calculus-filter-buffers.mjs";
import { splitCalculusFrameDispatch } from "./calculus-frame-dispatch.mjs";

const sha = value => createHash("sha256").update(value).digest("hex");
const dispatchMarker = "// Bounded calculus root frame dispatch v1";
const root = resolve(import.meta.dirname, "..");
if (process.argv.length !== 3 || process.argv[2] !== "--apply") {
  throw new Error("Usage: node scripts/optimize-calculus-transitions.mjs --apply");
}
for (const locale of ["en", "ru"]) for (const part of [1, 2, 3]) {
  const target = resolve(root, `public/media/calculus/native/${locale}/chapter-${part}.mjs`);
  const original = await readFile(target, "utf8");
  const buffered = patchCalculusFilterBuffers(original);
  if (buffered.source.includes(dispatchMarker)) {
    if (buffered.changed) throw new Error("Unexpected partial transition optimization.");
    console.log(`${locale}/${part}: already optimized`);
    continue;
  }
  const result = splitCalculusFrameDispatch(buffered.source);
  parse(result.source, { ecmaVersion: "latest", sourceType: "module" });
  const saved = resolve(root, `.cache/calculus-transition-originals/${locale}/chapter-${part}.mjs`);
  await mkdir(dirname(saved), { recursive: true });
  try { await writeFile(saved, original, { flag: "wx" }); } catch (error) {
    if (error.code !== "EEXIST" || sha(await readFile(saved)) !== sha(original)) throw error;
  }
  const candidate = saved + ".candidate";
  await writeFile(candidate, result.source);
  if (sha(await readFile(target)) !== sha(original)) throw new Error("Renderer changed during optimization.");
  await rename(candidate, target);
  console.log(`${locale}/${part}: ${result.frames} original frame cases in ${result.helpers} bounded helpers; fixed numeric buffers`);
}
