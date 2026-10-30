#!/usr/bin/env node
// Recover data only: never execute ActionScript, exported drawings, or a renderer.
import { readFile, writeFile, realpath, stat } from "node:fs/promises";
import { resolve, dirname, basename, sep } from "node:path";
import { inflateSync } from "node:zlib";
import { createHash } from "node:crypto";
import { fileURLToPath } from "node:url";

const repository = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const recovery = "/home/ignat/code/mightymatica-source-recovery";
const defaultSource = name => `${recovery}/objects/Movies/${name}/original/${name}.swf`;
const options = {
  en: defaultSource("Calculus5min"),
  ru: defaultSource("Calculus5min-ru-mod"),
  output: resolve(repository, "src/modules/calculus/text-bounds.json"),
};
const usage = "Usage: node scripts/recover-calculus-text-bounds.mjs [--en original.swf] [--ru original.swf] [--output bounds.json]";
for (let i = 2; i < process.argv.length; i++) {
  const argument = process.argv[i];
  if (argument === "--help") { console.log(usage); process.exit(0); }
  const key = argument.slice(2);
  if (!argument.startsWith("--") || !Object.hasOwn(options, key) || !process.argv[i + 1] || process.argv[i + 1].startsWith("--")) {
    throw new Error(usage);
  }
  options[key] = resolve(process.argv[++i]);
}

const limit = 256 * 1024 * 1024;
function rectangle(bytes, offset) {
  let bit = offset * 8;
  function unsigned(count) {
    if (bit + count > bytes.length * 8) throw new Error("Truncated RECT.");
    let value = 0;
    for (let i = 0; i < count; i++, bit++) value = value * 2 + ((bytes[bit >> 3] >> (7 - bit % 8)) & 1);
    return value;
  }
  const width = unsigned(5);
  if (!width) throw new Error("Invalid zero-width RECT encoding.");
  function signed() {
    const value = unsigned(width);
    return value >= 2 ** (width - 1) ? value - 2 ** width : value;
  }
  const [xMin, xMax, yMin, yMax] = [signed(), signed(), signed(), signed()];
  return { bounds: [xMin, yMin, xMax, yMax], end: Math.ceil(bit / 8) };
}

function recover(input) {
  if (input.length < 8) throw new Error("Truncated SWF header.");
  const signature = input.toString("ascii", 0, 3);
  if (signature !== "FWS" && signature !== "CWS") throw new Error(`Unsupported SWF signature: ${signature}`);
  const declaredSize = input.readUInt32LE(4);
  if (declaredSize < 8 || declaredSize > limit) throw new Error("SWF declared size exceeds budget or is invalid.");
  const body = signature === "CWS"
    ? inflateSync(input.subarray(8), { maxOutputLength: limit - 8 })
    : input.subarray(8);
  if (body.length + 8 !== declaredSize) throw new Error("SWF declared size does not match inflated data.");
  const header = rectangle(body, 0);
  if (header.end + 4 > body.length) throw new Error("Truncated movie frame header.");
  const entries = new Map();
  let tagCount = 0;
  function timeline(bytes, offset, depth) {
    if (depth > 32) throw new Error("DefineSprite nesting exceeds 32.");
    let ended = false;
    while (offset < bytes.length) {
      if (++tagCount > 200000) throw new Error("SWF exceeds 200000 tags.");
      if (offset + 2 > bytes.length) throw new Error("Truncated tag header.");
      const header = bytes.readUInt16LE(offset); offset += 2;
      const type = header >> 6;
      let length = header & 63;
      if (length === 63) {
        if (offset + 4 > bytes.length) throw new Error("Truncated long tag header.");
        length = bytes.readUInt32LE(offset); offset += 4;
      }
      if (length > bytes.length - offset) throw new Error("Tag exceeds its timeline.");
      const data = bytes.subarray(offset, offset + length); offset += length;
      if (type === 0) {
        if (length !== 0 || offset !== bytes.length) throw new Error("Invalid End tag or trailing timeline bytes.");
        ended = true;
        break;
      }
      if (type === 11 || type === 33) {
        if (data.length < 3) throw new Error("Truncated DefineText.");
        const id = data.readUInt16LE(0);
        if (entries.has(id)) throw new Error(`Duplicate static text character ID ${id}.`);
        const { bounds } = rectangle(data, 2);
        if (bounds[2] <= bounds[0] || bounds[3] <= bounds[1]) throw new Error(`Non-positive text bounds for ${id}.`);
        entries.set(id, bounds);
      } else if (type === 39) {
        if (data.length < 4) throw new Error("Truncated DefineSprite.");
        timeline(data, 4, depth + 1);
      }
      // DefineEditText (37) is deliberately excluded: it has dynamic layout.
    }
    if (!ended) throw new Error("Timeline has no End tag.");
  }
  timeline(body, header.end + 4, 0);
  if (!entries.size) throw new Error("No static text found.");
  return Object.fromEntries([...entries].sort(([a], [b]) => a - b).map(([id, bounds]) => [`text${id}`, bounds]));
}

// Resolve symlinks before writing; neither preservation archive may be modified.
const output = resolve(options.output);
let canonicalOutput;
try { canonicalOutput = await realpath(output); }
catch (error) {
  if (error.code !== "ENOENT") throw error;
  canonicalOutput = resolve(await realpath(dirname(output)), output.slice(dirname(output).length + 1));
}
for (const archive of [recovery, "/home/ignat/code/mightymatica-archive-2026-08-09"]) {
  const canonicalArchive = await realpath(archive);
  if (canonicalOutput === canonicalArchive || canonicalOutput.startsWith(canonicalArchive + sep)) throw new Error("Preservation archives are read-only.");
}
const languages = {};
for (const language of ["en", "ru"]) {
  if ((await stat(options[language])).size > limit) throw new Error("Input exceeds 256 MiB budget.");
  const input = await readFile(options[language]);
  languages[language] = {
    source: `Movies/${basename(options[language])}`,
    sourceSha256: createHash("sha256").update(input).digest("hex"),
    textBounds: recover(input),
  };
}
await writeFile(canonicalOutput, JSON.stringify({ version: 1, languages }, null, 2) + "\n");
for (const [language, data] of Object.entries(languages)) console.log(`${language}: ${Object.keys(data.textBounds).length} static text bounds; SHA-256 ${data.sourceSha256}`);
