import { readFile, readdir, stat, writeFile } from "node:fs/promises";
import { gzipSync } from "node:zlib";
import { createHash } from "node:crypto";
import { readCollection } from "./collection-metadata.mjs";

const root = new URL("../", import.meta.url);
const dist = new URL("dist/", root);
const { families, activities } = await readCollection(root);
const legacy = JSON.parse(await readFile(new URL("src/content/legacy.json", root), "utf8"));
const sourceIds = new Set(legacy.map((item) => item.source));
const categories = new Set(["geometry", "visual-math", "puzzles", "magic", "kids", "spatial", "calculus", "books"]);
const ids = new Set();
const covered = new Map();
for (const activity of activities) {
  if (!/^[a-z][a-z0-9-]+$/.test(activity.id) || ids.has(activity.id)) {
    throw new Error(`Invalid or duplicate activity ID: ${activity.id}`);
  }
  ids.add(activity.id);
  if (!categories.has(activity.category) || !activity.sources.length) {
    throw new Error(`Incomplete activity metadata: ${activity.id}`);
  }
  for (const source of activity.sources) {
    if (source.endsWith(".swf") && !sourceIds.has(source)) {
      throw new Error(`Unrecognized original source in ${activity.id}: ${source}`);
    }
    const entries = covered.get(source) ?? [];
    entries.push(activity.id);
    covered.set(source, entries);
  }
}

async function walk(directory, prefix = "") {
  const output = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const name = `${prefix}${entry.name}`;
    if (entry.isSymbolicLink()) throw new Error(`Symlink not allowed in the published artifact: ${name}`);
    if (entry.isDirectory()) output.push(...await walk(new URL(`${entry.name}/`, directory), `${name}/`));
    else output.push({ path: name, url: new URL(entry.name, directory) });
  }
  return output;
}

const files = await walk(dist);
let bytes = 0;
let drawingModules = 0;
let drawingAdapters = 0;
// This reviewed pure drawing helper allocates no canvas, timers or listeners;
// it therefore has no context-ownership wrapper to restore. Pin its source
// instead of weakening the lifecycle requirement for generated renderers.
const drawingAdapterHashes = new Map([
  ["media/coloring/native/cube-stage.mjs", "2a6fb2fca45dd80bb32b15d907ce8e864a26026e944e6691b4e99fc0e7621232"],
]);
for (const file of files) {
  bytes += (await stat(file.url)).size;
  if (/\.(?:swf|fla|xfl|as|jar|exe|wasm)$/i.test(file.path)) {
    throw new Error(`Legacy executable artifact must not ship: ${file.path}`);
  }
  if (file.path.startsWith("media/") && /\.(?:html?|js)$/i.test(file.path)) {
    throw new Error(`Raw exporter HTML/JavaScript must not ship: ${file.path}`);
  }
  if (file.path.startsWith("media/") && file.path.endsWith(".mjs")) {
    const source = await readFile(file.url, "utf8");
    // A regression gate for our reviewed code generator, not a JavaScript sandbox.
    if (/\beval\s*\(|\bnew\s+Function\b|\b(?:fetch|XMLHttpRequest|WebSocket|setInterval|setTimeout)\s*\(/.test(source)) {
      throw new Error(`Unreviewed execution/network/timer primitive in drawing export: ${file.path}`);
    }
    const adapterHash = drawingAdapterHashes.get(file.path);
    if (adapterHash) {
      if (createHash("sha256").update(source).digest("hex") !== adapterHash) {
        throw new Error(`Native drawing adapter needs review: ${file.path}`);
      }
      drawingAdapters++;
    } else if (!source.includes("Context lifecycle v2")) {
      throw new Error(`Drawing export predates the reusable-canvas lifecycle fix: ${file.path}`);
    } else {
      drawingModules++;
    }
  }
}

const html = await readFile(new URL("index.html", dist), "utf8");
if (!html.includes("/mightymatica/assets/")) throw new Error("The production asset base must be /mightymatica/.");
const entryMatch = html.match(/<script[^>]+src="\/mightymatica\/([^"]+)"/);
if (!entryMatch) throw new Error("Production entry script missing.");
const entry = await readFile(new URL(entryMatch[1], dist));
const entryGzipBytes = gzipSync(entry).length;
if (entryGzipBytes > 160_000) throw new Error(`Eager entry exceeds 160 kB gzip: ${entryGzipBytes}`);

const sources = legacy.map((item) => ({
  source: item.source,
  kind: item.kind,
  activities: covered.get(item.source) ?? [],
}));
const summary = {
  families: families.length,
  webActivities: activities.length,
  preservedObjects: legacy.length,
  sourceObjectsRepresented: sources.filter((item) => item.activities.length).length,
  activitySourcesAwaitingEdition: sources.filter((item) => !item.activities.length && item.kind !== "support").map((item) => item.source),
  supportObjects: sources.filter((item) => item.kind === "support").map((item) => item.source),
  nativeDrawingModules: drawingModules,
  nativeDrawingAdapters: drawingAdapters,
  totalArtifactBytes: bytes,
  entryGzipBytes,
  fidelityNote: "Source representation is not a claim of complete animation, narration, interaction, or accessibility parity.",
  sources,
};
// Source accounting is maintainer documentation, not a public application page.
await writeFile(new URL("docs/restoration-report.json", root), `${JSON.stringify(summary, null, 2)}\n`);
console.log(`${activities.length} web activities in ${families.length} families; ${summary.sourceObjectsRepresented}/${legacy.length} source objects represented.`);
console.log(`${drawingModules} reviewed native drawing modules and ${drawingAdapters} pinned drawing adapters; no shipped SWF/Flash runtime/raw export HTML.`);
console.log(`Eager entry ${Math.round(entryGzipBytes / 1024)} KiB gzip; total static artifact ${(bytes / 1024 / 1024).toFixed(1)} MiB (media is on demand).`);
if (summary.activitySourcesAwaitingEdition.length) {
  console.log(`Still awaiting a web edition:\n${summary.activitySourcesAwaitingEdition.join("\n")}`);
}
