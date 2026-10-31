// Offline, source-verified rewrite of kids lessons and Falling Figure completion.
import { readFile, writeFile, mkdir, rename } from "node:fs/promises";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { createHash } from "node:crypto";
import { spawnSync } from "node:child_process";
import { isDeepStrictEqual } from "node:util";
import { patchCalculusFilters } from "../../../scripts/optimize-calculus-filters.mjs";

const root = resolve(import.meta.dirname, "../../..");
const sha = value => createHash("sha256").update(value).digest("hex");
const boards = JSON.parse(await readFile(resolve(import.meta.dirname, "recovered.json"), "utf8"));
const entries = [
  ...Object.entries(boards).map(([id, board]) => ({ id, family: "kids", source: board.source, painter: "lesson" })),
  { id: "falling-figure", family: "falling", source: "Movies/FallingFigure.swf", painter: "completion" },
];
const mode = process.argv[2];
if (!["--recover-bounds", "--apply"].includes(mode)) {
  throw new Error("Usage: node src/modules/kids/optimize-painters.mjs --recover-bounds|--apply [kids|falling]");
}
for (const entry of entries.filter(item => !process.argv[3] || item.family === process.argv[3])) {
  const name = entry.source.slice(7, -4);
  const source = `/home/ignat/code/mightymatica-source-recovery/objects/Movies/${name}/original/${name}.swf`;
  const boundsFile = resolve(root, `src/modules/${entry.family}/text-bounds-${entry.id}.json`);
  if (mode === "--recover-bounds") {
    // These activities have one preserved source, not a recovered Russian variant.
    const result = spawnSync(process.execPath, [
      "scripts/recover-calculus-text-bounds.mjs", "--en", source, "--ru", source, "--output", boundsFile,
    ], { cwd: root, stdio: "inherit" });
    if (result.status !== 0) throw new Error(`${entry.id}: bound recovery failed`);
    continue;
  }
  const evidence = JSON.parse(await readFile(boundsFile, "utf8")).languages.en;
  if (evidence.source !== entry.source || sha(await readFile(source)) !== evidence.sourceSha256) {
    throw new Error(`${entry.id}: bounds/source mismatch`);
  }
  const target = resolve(root, `public/media/${entry.family}/audio/${entry.id}/${entry.painter}.mjs`);
  const original = await readFile(target, "utf8");
  const patched = patchCalculusFilters(original, evidence.textBounds, 550, 400);
  if (!patched.groups && !patched.refreshed) {
    console.log(`${entry.id}: already optimized`);
    continue;
  }
  const cache = resolve(root, `.cache/${entry.family}-filter-originals`);
  await mkdir(cache, { recursive: true });
  const backup = resolve(cache, `${entry.id}-${sha(original)}.mjs`);
  try { await writeFile(backup, original, { flag: "wx" }); }
  catch (error) {
    if (error.code !== "EEXIST" || sha(await readFile(backup)) !== sha(original)) throw error;
  }
  const candidate = resolve(cache, `${entry.id}-${sha(patched.source)}.candidate.mjs`);
  await writeFile(candidate, patched.source);
  if (spawnSync(process.execPath, ["--check", candidate], { stdio: "inherit" }).status !== 0) {
    throw new Error(`${entry.id}: invalid candidate syntax`);
  }
  const [before, after] = await Promise.all([import(pathToFileURL(backup)), import(pathToFileURL(candidate))]);
  if (!isDeepStrictEqual(before.metadata, after.metadata)
    || !isDeepStrictEqual(Object.keys(before).sort(), Object.keys(after).sort())) {
    throw new Error(`${entry.id}: renderer contract changed`);
  }
  if (sha(await readFile(target)) !== sha(original)) throw new Error(`${entry.id}: concurrent edit`);
  await rename(candidate, target);
  console.log(JSON.stringify({ id: entry.id, groups: patched.groups, refreshed: patched.refreshed,
    before: sha(original), after: sha(patched.source) }));
}
