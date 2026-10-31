// Release-maintainer tool. Run from the repository root with Node.js.
// Only selected text sources enter the archive; never preservation archives.
import { readFile, writeFile, mkdir, readdir, copyFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import { dirname, resolve } from "node:path";

const root = process.cwd();
const modifiedDate = "2026-10-31";
const staging = resolve(root, `.cache/ffdec-readable-source-${modifiedDate}-final`);
const sha = bytes => createHash("sha256").update(bytes).digest("hex");
const manifest = { format: 1, modifiedDate, records: [], support: [] };
async function put(path, bytes) {
  const target = resolve(staging, path);
  await mkdir(dirname(target), { recursive: true });
  await writeFile(target, bytes);
}
const inventory = JSON.parse(await readFile(".cache/native-unminified/verified-final.json", "utf8"));
const known = new Set();
async function baselineFor(path, original, expectedHash) {
  if (sha(original) !== expectedHash) throw new Error(`Baseline mismatch: ${path}`);
  const current = await readFile(path);
  known.add(path);
  const baseline = `baseline/${path}`;
  await put(baseline, original);
  // The final text is already committed at record.input; do not duplicate
  // minified drawing/image payloads as giant whole-file replacement patches.
  manifest.records.push({ path, baseline,
    finalSource: `https://github.com/ignatremizov/mightymatica/blob/main/${path}`,
    baselineSha256: sha(original), finalSha256: sha(current) });
}
for (const record of inventory.records) {
  await baselineFor(record.input, await readFile(record.backup), record.beforeSha256);
}
// The first release kept these adapter-bearing cube painters unminified.
// Preserve those readable sources now that their reviewed filters are compact.
const previous = resolve(root, ".cache/ffdec-readable-source");
const previousManifest = JSON.parse(await readFile(resolve(previous, "manifest.json"), "utf8"));
for (const locale of ["en", "ru"]) {
  const path = `public/media/coloring/native/cube-${locale}/timeline.mjs`;
  const entry = previousManifest.support.find(record => record.path === path);
  if (!entry) throw new Error(`Missing prior readable cube source: ${path}`);
  await baselineFor(path, await readFile(resolve(previous, "support", path)), entry.sha256);
}
async function walk(directory) {
  const paths = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const path = `${directory}/${entry.name}`;
    if (entry.isDirectory()) paths.push(...await walk(path));
    else if (entry.isFile()) paths.push(path);
  }
  return paths;
}
const support = [
  ...(await walk("scripts")).filter(path => /\.(mjs|py)$/.test(path)),
  ...(await walk("src")).filter(path => /\.(ts|tsx|mjs|py|css|json)$/.test(path)),
  ...(await walk("public/media")).filter(path => path.endsWith(".mjs") && !known.has(path)),
  "package.json", "package-lock.json", "tsconfig.json", "vite.config.ts",
  "third-party/ffdec/canvas-original.js", "third-party/ffdec/package-source.mjs",
  "public/licenses/LGPL-3.0.txt", "public/licenses/GPL-3.0.txt",
];
for (const path of support.sort()) {
  const bytes = await readFile(path);
  await put(`support/${path}`, bytes);
  manifest.support.push({ path, sha256: sha(bytes) });
}
await put("manifest.json", JSON.stringify(manifest, null, 2) + "\n");
await copyFile(resolve(staging, "manifest.json"), "third-party/ffdec/source-manifest.json");
console.log(`Prepared ${manifest.records.length} readable baselines; ${support.length} support sources in ${staging}`);
