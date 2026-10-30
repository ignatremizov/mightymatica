// Release-maintainer tool. Run from the repository root with Node.js.
// Only selected text sources enter the archive; never preservation archives.
import { readFile, writeFile, mkdir, readdir, copyFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import { dirname, resolve } from "node:path";

const root = process.cwd();
const staging = resolve(root, ".cache/ffdec-readable-source");
const sha = bytes => createHash("sha256").update(bytes).digest("hex");
const manifest = { format: 1, modifiedDate: "2026-10-30", records: [], support: [] };
async function put(path, bytes) {
  const target = resolve(staging, path);
  await mkdir(dirname(target), { recursive: true });
  await writeFile(target, bytes);
}
const inventory = JSON.parse(await readFile(".cache/native-unminified/verified-final.json", "utf8"));
const known = new Set();
for (const record of inventory.records) {
  const original = await readFile(record.backup);
  if (sha(original) !== record.beforeSha256) throw new Error(`Baseline mismatch: ${record.input}`);
  const current = await readFile(record.input);
  known.add(record.input);
  const baseline = `baseline/${record.input}`;
  await put(baseline, original);
  // The final text is already committed at record.input; do not duplicate
  // minified drawing/image payloads as giant whole-file replacement patches.
  manifest.records.push({ path: record.input, baseline,
    finalSource: `https://github.com/ignatremizov/mightymatica/blob/main/${record.input}`,
    baselineSha256: sha(original), finalSha256: sha(current) });
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
  ...(await walk("scripts")).filter(path => path.endsWith(".mjs")),
  ...(await walk("public/media")).filter(path => path.endsWith(".mjs") && !known.has(path)),
  "package.json", "package-lock.json", "third-party/ffdec/canvas-original.js",
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
