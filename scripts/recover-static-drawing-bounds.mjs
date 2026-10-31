#!/usr/bin/env node
// Binary data only. Never executes SWF, ActionScript or generated drawing code.
import { readFile, writeFile, realpath, stat } from "node:fs/promises";
import { resolve, dirname, basename, sep } from "node:path";
import { inflateSync } from "node:zlib";
import { createHash } from "node:crypto";
import { pathToFileURL } from "node:url";

const limit = 256 * 1024 * 1024;
function rectangle(bytes, offset) {
  let bit = offset * 8;
  function unsigned(count) {
    if (bit + count > bytes.length * 8) throw new Error("Truncated RECT");
    let value = 0;
    for (let i = 0; i < count; i++, bit++) value = value * 2 + ((bytes[bit >> 3] >> (7 - bit % 8)) & 1);
    return value;
  }
  const width = unsigned(5);
  if (!width) throw new Error("Invalid RECT width");
  const signed = () => {
    const value = unsigned(width);
    return value >= 2 ** (width - 1) ? value - 2 ** width : value;
  };
  const [xmin, xmax, ymin, ymax] = [signed(), signed(), signed(), signed()];
  if (xmin > xmax || ymin > ymax) throw new Error("Inverted RECT");
  return { bounds: [xmin, ymin, xmax, ymax], end: Math.ceil(bit / 8) };
}

export function recoverStaticDrawingBounds(input) {
  if (input.length < 8 || input.length > limit) throw new Error("Invalid SWF size");
  const signature = input.toString("ascii", 0, 3);
  if (!["FWS", "CWS"].includes(signature)) throw new Error("Unsupported SWF compression");
  const size = input.readUInt32LE(4);
  if (size < 8 || size > limit) throw new Error("Invalid declared SWF size");
  const body = signature === "CWS" ? inflateSync(input.subarray(8), { maxOutputLength: limit - 8 }) : input.subarray(8);
  if (body.length + 8 !== size) throw new Error("SWF size mismatch");
  const header = rectangle(body, 0);
  if (header.end + 4 > body.length) throw new Error("Truncated movie header");
  const entries = new Map(), ids = new Set();
  let tags = 0;
  function timeline(bytes, offset, depth) {
    if (depth > 32) throw new Error("Sprite nesting exceeds budget");
    let ended = false;
    while (offset < bytes.length) {
      if (++tags > 200000 || offset + 2 > bytes.length) throw new Error("Invalid tag header or tag budget exceeded");
      const header = bytes.readUInt16LE(offset); offset += 2;
      const type = header >> 6;
      let length = header & 63;
      if (length === 63) {
        if (offset + 4 > bytes.length) throw new Error("Truncated long tag");
        length = bytes.readUInt32LE(offset); offset += 4;
      }
      if (length > bytes.length - offset) throw new Error("Tag exceeds timeline");
      const data = bytes.subarray(offset, offset + length); offset += length;
      if (type === 0) {
        if (length || offset !== bytes.length) throw new Error("Invalid End tag");
        ended = true; break;
      }
      const shape = [2, 22, 32, 83].includes(type);
      const text = [11, 33].includes(type);
      if (shape || text) {
        if (data.length < 3) throw new Error("Truncated static definition");
        const id = data.readUInt16LE(0);
        if (ids.has(id)) throw new Error("Duplicate static character ID");
        ids.add(id);
        // For DefineShape4 this FIRST RECT is ShapeBounds, including strokes.
        // The following EdgeBounds RECT is deliberately not substituted.
        const rect = rectangle(data, 2);
        if (type === 83) {
          const edge = rectangle(data, rect.end);
          if (edge.end >= data.length) throw new Error("Truncated DefineShape4 flags");
          // Non-scaling/hairline strokes cannot be bounded conservatively by
          // transforming a source-space rectangle at arbitrary display scales.
          if (data[edge.end] & 2) continue;
        }
        entries.set(`${shape ? "shape" : "text"}${id}`, rect.bounds);
      } else if (type === 39) {
        if (data.length < 4) throw new Error("Truncated DefineSprite");
        timeline(data, 4, depth + 1);
      }
      // MorphShape(46/84), EditText(37), bitmaps and all dynamic tags excluded.
    }
    if (!ended) throw new Error("Timeline has no End tag");
  }
  timeline(body, header.end + 4, 0);
  if (!entries.size) throw new Error("No eligible static drawing bounds");
  return Object.fromEntries([...entries].sort(([a], [b]) => a.localeCompare(b, "en", { numeric: true })));
}

async function main() {
  const options = {};
  const usage = "Use --en original.swf --ru original.swf --output bounds.json";
  for (let i = 2; i < process.argv.length; i++) {
    const key = process.argv[i].slice(2);
    if (!["en", "ru", "output"].includes(key) || !process.argv[i].startsWith("--")
      || options[key] || !process.argv[i + 1] || process.argv[i + 1].startsWith("--")) throw new Error(usage);
    options[key] = resolve(process.argv[++i]);
  }
  if (!options.en || !options.ru || !options.output) throw new Error(usage);
  let output;
  try { output = await realpath(options.output); }
  catch (error) {
    if (error.code !== "ENOENT") throw error;
    output = resolve(await realpath(dirname(options.output)), basename(options.output));
  }
  for (const archive of ["/home/ignat/code/mightymatica-source-recovery", "/home/ignat/code/mightymatica-archive-2026-08-09"]) {
    const canonical = await realpath(archive);
    if (output === canonical || output.startsWith(canonical + sep)) throw new Error("Preservation archives are read-only");
  }
  const languages = {};
  for (const locale of ["en", "ru"]) {
    if ((await stat(options[locale])).size > limit) throw new Error("Input exceeds budget");
    const input = await readFile(options[locale]);
    languages[locale] = {
      source: `Movies/${basename(options[locale])}`,
      sourceSha256: createHash("sha256").update(input).digest("hex"),
      drawingBounds: recoverStaticDrawingBounds(input),
    };
  }
  await writeFile(output, JSON.stringify({ version: 1, languages }, null, 2) + "\n");
  for (const [locale, data] of Object.entries(languages)) console.log(`${locale}: ${Object.keys(data.drawingBounds).length} static drawing bounds`);
}
if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  main().catch(error => { console.error(error.message); process.exitCode = 1; });
}
