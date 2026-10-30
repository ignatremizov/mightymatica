/** Verify the two source linkage bindings and reuse their identical MP3 bytes. */
import { readFile, writeFile } from "node:fs/promises";
import { inflateSync } from "node:zlib";
import { createHash } from "node:crypto";

const directory = new URL(".", import.meta.url);
const first = JSON.parse(await readFile(new URL("audio-source.json", directory), "utf8"));
const second = JSON.parse(await readFile(new URL("audio-more-inventory.json", directory), "utf8"));
const bindings = { question: 1, theme: 2 };
for (const metadata of [first, second]) {
  if (metadata.audioAssets.length !== 2 || metadata.audioCues.length || metadata.unsupported.length
    || metadata.nestedTimelines.some(timeline => timeline.audioCues.length)) throw new Error("Unexpected source audio.");
  const bytes = await readFile(metadata.source);
  const body = bytes.toString("ascii", 0, 3) === "CWS" ? inflateSync(bytes.subarray(8)) : bytes.subarray(8);
  let offset = Math.ceil((5 + 4 * (body[0] >> 3)) / 8) + 4;
  const exports = {};
  while (offset < body.length) {
    const header = body.readUInt16LE(offset); offset += 2;
    let length = header & 63;
    if (length === 63) { length = body.readUInt32LE(offset); offset += 4; }
    const end = offset + length;
    if (end > body.length) throw new Error("Truncated source tag.");
    if (header >> 6 === 56) {
      const count = body.readUInt16LE(offset);
      let cursor = offset + 2;
      for (let index = 0; index < count; index++) {
        const id = body.readUInt16LE(cursor); cursor += 2;
        const terminator = body.indexOf(0, cursor);
        if (terminator < cursor || terminator >= end) throw new Error("Malformed source linkage.");
        exports[body.toString("utf8", cursor, terminator)] = id;
        cursor = terminator + 1;
      }
    }
    offset = end;
  }
  for (const [name, id] of Object.entries(bindings)) {
    if (exports[name] !== id) throw new Error(`Changed source sound binding: ${name}`);
    const original = first.audioAssets.find(asset => asset.soundId === id);
    const current = metadata.audioAssets.find(asset => asset.soundId === id);
    if (!original || current?.sha256 !== original.sha256) throw new Error("Quiz variants no longer share their audio.");
    const output = await readFile(new URL(`../../../public/media/${original.src}`, directory));
    if (createHash("sha256").update(output).digest("hex") !== original.sha256) throw new Error("Changed extracted MP3.");
  }
}
await writeFile(new URL("audio-music.json", directory), JSON.stringify({
  fps: first.fps, bindings, audioAssets: first.audioAssets,
}, null, 2) + "\n");
console.log("Verified both quiz linkages and two deduplicated original MP3 payloads.");
