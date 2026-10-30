#!/usr/bin/env node
import { readFile, writeFile, mkdir, readdir, rename } from "node:fs/promises";
import { dirname, resolve, relative } from "node:path";
import { createHash } from "node:crypto";
import { fileURLToPath } from "node:url";
import { patchContextTransforms } from "./canvas-context-transforms.mjs";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const backup = resolve(root, ".cache/canvas-transform-originals");
const hash = source => createHash("sha256").update(source).digest("hex");
async function* files(directory) {
  for (const entry of (await readdir(directory, { withFileTypes: true })).sort((a, b) => a.name.localeCompare(b.name))) {
    const path = resolve(directory, entry.name);
    if (entry.isDirectory()) yield* files(path);
    else if (entry.isFile() && entry.name.endsWith(".mjs")) yield path;
  }
}
// Audit everything before changing anything. Memory remains bounded to one source.
let audited = 0, matched = 0, pending = 0;
for await (const path of files(resolve(root, "public/media"))) {
  const result = patchContextTransforms(await readFile(path, "utf8"));
  audited++;
  if (result.matched) matched++;
  if (result.changed) pending++;
}
if (process.argv.includes("--check")) {
  console.log(JSON.stringify({ audited, matched, pending }));
  process.exitCode = pending ? 1 : 0;
} else {
  await mkdir(backup, { recursive: true });
  await writeFile(resolve(backup, ".gitignore"), "*\n", { flag: "w" });
  let changed = 0;
  for await (const path of files(resolve(root, "public/media"))) {
    const original = await readFile(path, "utf8");
    const result = patchContextTransforms(original);
    if (!result.changed) continue;
    const digest = hash(original);
    const target = resolve(backup, `${digest}.mjs`);
    try { await writeFile(target, original, { flag: "wx" }); }
    catch (error) {
      if (error.code !== "EEXIST" || hash(await readFile(target, "utf8")) !== digest) throw error;
    }
    const temporary = `${path}.canvas-transforms-${process.pid}`;
    await writeFile(temporary, result.source, { flag: "wx" });
    if (hash(await readFile(path, "utf8")) !== digest) throw new Error(`Concurrent edit: ${relative(root, path)}`);
    await rename(temporary, path);
    changed++;
  }
  console.log(JSON.stringify({ audited, matched, changed, backup: relative(root, backup) }));
}
