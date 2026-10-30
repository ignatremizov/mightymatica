// Scoped offline cache rewrite of the four reviewed Altitudes chapters only.
import { readFile, writeFile, mkdir, rename } from "node:fs/promises";
import { resolve, dirname } from "node:path";
import { pathToFileURL } from "node:url";
import { createHash } from "node:crypto";
import { patchCalculusFilters } from "../../../scripts/optimize-calculus-filters.mjs";

const root = resolve(import.meta.dirname, "../../..");
const sha = value => createHash("sha256").update(value).digest("hex");
const bounds = JSON.parse(await readFile(resolve(import.meta.dirname, "altitudes-text-bounds.json"), "utf8"));
if (!["--check", "--apply"].includes(process.argv[2])) throw new Error("Use --check or --apply.");
const apply = process.argv[2] === "--apply";
const changes = [];
for (const locale of ["en", "ru"]) {
  const definition = JSON.parse(await readFile(resolve(import.meta.dirname, `native-altitudes-${locale}.json`), "utf8"));
  if (bounds.languages[locale].sourceSha256 !== definition.sourceSha256) throw new Error("Altitudes source/bounds mismatch.");
  for (const chapter of definition.chapters) {
    const filename = resolve(root, "public/media", chapter.module);
    if (!filename.startsWith(resolve(root, `public/media/triangles/native/altitudes/${locale}/`)+"/")) throw new Error("Unexpected Altitudes chapter.");
    const original = await readFile(filename, "utf8");
    const start = original.indexOf("// Mechanically converted FFDec 26.2.1 drawing code.");
    const prefix = original.slice(0, start);
    if (start < 0 || prefix.split("\n").some(line => line.trim() && !line.startsWith("//"))) throw new Error("Unexpected native module prefix.");
    if (!original.includes("Canvas context transforms v1") || !original.includes("Triangle playback control v1")) throw new Error("Missing reviewed transform or transport correction.");
    const result = patchCalculusFilters(original.slice(start), bounds.languages[locale].textBounds, definition.width, definition.height);
    const patched = prefix+result.source;
    console.log(`${locale}/${chapter.id}: ${result.groups} text groups; helper refreshed=${result.refreshed}`);
    if (patched === original) continue;
    const backup = resolve(root, `.cache/triangle-filter-originals/${locale}/${chapter.id}.mjs`);
    changes.push({ filename, original, patched, backup });
  }
}
if (apply) for (const change of changes) {
  await mkdir(dirname(change.backup), { recursive: true });
  try { await writeFile(change.backup, change.original, { flag: "wx" }); }
  catch (error) {
    if (error.code !== "EEXIST" || sha(await readFile(change.backup)) !== sha(change.original)) throw error;
  }
  const candidate = change.backup+".candidate.mjs";
  await writeFile(candidate, change.patched);
  // Imports inspect only exports/constant metadata, never create a renderer.
  const [before, after] = await Promise.all([import(pathToFileURL(change.backup)), import(pathToFileURL(candidate))]);
  if (JSON.stringify(Object.keys(before)) !== JSON.stringify(Object.keys(after))
    || JSON.stringify(before.metadata) !== JSON.stringify(after.metadata)) throw new Error("Metadata or renderer exports changed.");
  if (sha(await readFile(change.filename)) !== sha(change.original)) throw new Error("Concurrent Altitudes change; refusing to overwrite.");
  await rename(candidate, change.filename);
}
console.log(`${changes.length} Altitudes chapters ${apply ? "patched with backups and hash guards" : "would change"}; no source export.`);
