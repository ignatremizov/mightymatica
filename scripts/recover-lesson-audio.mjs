#!/usr/bin/env node
// Binary data recovery only. Never evaluates ActionScript or exporter JavaScript.
import { readFile, writeFile, mkdir, realpath, stat } from "node:fs/promises";
import { resolve, dirname, relative, sep } from "node:path";
import { inflateSync } from "node:zlib";
import { createHash } from "node:crypto";
import { spawnSync } from "node:child_process";

const repository = resolve(import.meta.dirname, "..");
const archives = [
  "/home/ignat/code/mightymatica-source-recovery",
  "/home/ignat/code/mightymatica-archive-2026-08-09",
];
const usage = `Usage: node scripts/recover-lesson-audio.mjs --source original.swf --output metadata.json --media-dir public/media/family/lesson [--inventory-only]
Extracts original embedded MP3 bytes and root event cues; inventories nested cues.
--inventory-only writes metadata without writing audio or creating media directories.
No Flash, ActionScript, exporter JavaScript, or renderer is executed.`;
const sha = bytes => createHash("sha256").update(bytes).digest("hex");
const inside = (parent, child) => child === parent || child.startsWith(parent + sep);
async function canonicalDestination(path) {
  let ancestor = path;
  const suffix = [];
  for (;;) {
    try { return resolve(await realpath(ancestor), ...suffix.reverse()); }
    catch (error) {
      if (error.code !== "ENOENT") throw error;
      if (dirname(ancestor) === ancestor) throw error;
      suffix.push(relative(dirname(ancestor), ancestor));
      ancestor = dirname(ancestor);
    }
  }
}
async function writableDestination(path) {
  const canonical = await canonicalDestination(path);
  if (archives.some(archive => inside(archive, canonical))) throw new Error("Preservation archives are read-only.");
  return canonical;
}
function parseMovie(input) {
  const signature = input.toString("ascii", 0, 3);
  if (!["CWS", "FWS"].includes(signature)) throw new Error(`Unsupported SWF signature ${signature}; expected FWS/CWS.`);
  const body = signature === "CWS" ? inflateSync(input.subarray(8), { maxOutputLength: 256 * 1024 * 1024 }) : input.subarray(8);
  if (body.length + 8 !== input.readUInt32LE(4)) throw new Error("SWF declared length does not match its uncompressed body.");
  let bit = 5;
  const bits = body[0] >> 3;
  if (bits < 1 || Math.ceil((5 + 4 * bits) / 8) + 4 > body.length) throw new Error("Invalid movie header.");
  const signed = () => {
    let value = 0;
    for (let i = 0; i < bits; i++, bit++) value = value * 2 + ((body[bit >> 3] >> (7 - bit % 8)) & 1);
    return value >= 2 ** (bits - 1) ? value - 2 ** bits : value;
  };
  const [xmin, xmax, ymin, ymax] = [signed(), signed(), signed(), signed()];
  const headerEnd = Math.ceil(bit / 8);
  const movie = {
    width: (xmax - xmin) / 20, height: (ymax - ymin) / 20,
    fps: body.readUInt16LE(headerEnd) / 256, frameCount: body.readUInt16LE(headerEnd + 2),
    audioCues: [], nestedTimelines: [], unsupported: [], soundDefinitions: new Map(),
  };
  let tagCount = 0;
  function soundInfo(data, offset) {
    let p = offset;
    const requireBytes = n => { if (p + n > data.length) throw new Error("Truncated SOUNDINFO."); };
    const u8 = () => { requireBytes(1); return data[p++]; };
    const u16 = () => { requireBytes(2); const value = data.readUInt16LE(p); p += 2; return value; };
    const u32 = () => { requireBytes(4); const value = data.readUInt32LE(p); p += 4; return value; };
    const flags = u8();
    const inPoint44 = flags & 1 ? u32() : 0;
    const outPoint44 = flags & 2 ? u32() : null;
    const loops = flags & 4 ? u16() : 1;
    const envelope = [];
    if (flags & 8) {
      const count = u8();
      for (let i = 0; i < count; i++) {
        const mark44 = u32(), left = u16(), right = u16();
        envelope.push({ mark44, left, right, seconds: mark44 / 44100, leftGain: left / 32768, rightGain: right / 32768 });
      }
    }
    if (p !== data.length) throw new Error("Unexpected trailing SOUNDINFO bytes.");
    return { inPoint44, outPoint44, inPointSeconds: inPoint44 / 44100, outPointSeconds: outPoint44 === null ? null : outPoint44 / 44100, loops, sync: flags & 32 ? "stop" : flags & 16 ? "start" : "event", envelope };
  }
  function timeline(bytes, start, spriteId = null, depth = 0) {
    if (depth > 32) throw new Error("Nested timeline budget exceeded.");
    let offset = start, frame = 1, ended = false;
    const cues = [], streams = [], linkageCues = [], buttonSoundTags = [], actionScriptTags = [];
    while (offset < bytes.length) {
      if (++tagCount > 200000) throw new Error("Tag budget exceeded.");
      if (offset + 2 > bytes.length) throw new Error("Truncated tag header.");
      const header = bytes.readUInt16LE(offset); offset += 2;
      const type = header >> 6;
      let length = header & 63;
      if (length === 63) {
        if (offset + 4 > bytes.length) throw new Error("Truncated extended tag header.");
        length = bytes.readUInt32LE(offset); offset += 4;
      }
      if (offset + length > bytes.length) throw new Error("Tag extends beyond its timeline.");
      const data = bytes.subarray(offset, offset + length); offset += length;
      if (type === 0) { ended = true; break; }
      if (type === 1) frame++;
      if (type === 14) {
        if (data.length < 7) throw new Error("Truncated DefineSound.");
        const soundId = data.readUInt16LE(0), flags = data[2], codec = flags >> 4;
        if (movie.soundDefinitions.has(soundId)) throw new Error("Duplicate sound character ID.");
        if (codec === 2 && data.length < 9) throw new Error("Truncated MP3 DefineSound.");
        movie.soundDefinitions.set(soundId, {
          soundId, codec, sampleRate: [5512.5, 11025, 22050, 44100][(flags >> 2) & 3],
          sampleCount: data.readUInt32LE(3), channels: flags & 1 ? 2 : 1,
          ...(codec === 2 ? { seekSamples: data.readInt16LE(7), payload: data.subarray(9) } : {}),
        });
        if (codec !== 2) movie.unsupported.push({ kind: "sound-codec", soundId, codec });
      }
      if (type === 15) {
        if (data.length < 3) throw new Error("Truncated StartSound.");
        cues.push({ frame, soundId: data.readUInt16LE(0), ...soundInfo(data, 2) });
      }
      if (type === 89) {
        const terminator = data.indexOf(0);
        if (terminator < 0) throw new Error("Unterminated StartSound2 linkage name.");
        linkageCues.push({ frame, className: data.toString("utf8", 0, terminator), ...soundInfo(data, terminator + 1) });
      }
      if (type === 18 || type === 45) {
        if (data.length < 4) throw new Error("Truncated stream header.");
        streams.push({ frame, tagType: type, codec: data[1] >> 4, samplesPerBlock: data.readUInt16LE(2), headerHex: data.toString("hex") });
      }
      if (type === 19) streams.push({ frame, tagType: type, byteLength: data.length });
      if (type === 17) {
        buttonSoundTags.push({ frame, buttonId: data.length >= 2 ? data.readUInt16LE(0) : null, byteLength: data.length });
      }
      if ([12, 59, 72, 82].includes(type)) actionScriptTags.push({ frame, tagType: type, byteLength: data.length });
      if (type === 39) {
        if (data.length < 4) throw new Error("Truncated DefineSprite.");
        const nested = timeline(data, 4, data.readUInt16LE(0), depth + 1);
        movie.nestedTimelines.push({ spriteId: data.readUInt16LE(0), frameNumbering: "one-based-sprite-local", frameCount: data.readUInt16LE(2), ...nested });
      }
    }
    if (!ended) throw new Error("Timeline has no End tag.");
    const context = spriteId === null ? { timeline: "root" } : { timeline: "sprite", spriteId };
    if (streams.some(item => item.tagType === 19 || item.samplesPerBlock > 0)) movie.unsupported.push({ kind: "stream-audio", ...context });
    if (linkageCues.length) movie.unsupported.push({ kind: "class-linked-sound", ...context });
    if (buttonSoundTags.length) movie.unsupported.push({ kind: "button-sound", ...context });
    return { audioCues: cues, linkageCues, streams, buttonSoundTags, actionScriptTags };
  }
  Object.assign(movie, timeline(body, headerEnd + 4));
  for (const entry of [{ audioCues: movie.audioCues }, ...movie.nestedTimelines]) {
    for (const cue of entry.audioCues) {
      if (!movie.soundDefinitions.has(cue.soundId)) movie.unsupported.push({ kind: "missing-sound-definition", soundId: cue.soundId });
    }
  }
  return movie;
}
async function main() {
  const args = process.argv.slice(2);
  if (args.includes("--help")) { console.log(usage); return; }
  const options = {};
  for (let i = 0; i < args.length; i++) {
    const key = args[i];
    if (options[key] !== undefined) throw new Error("Duplicate option.");
    if (key === "--inventory-only") options[key] = true;
    else if (["--source", "--output", "--media-dir"].includes(key) && args[i + 1] && !args[i + 1].startsWith("--")) options[key] = args[++i];
    else throw new Error(usage);
  }
  if (!options["--source"] || !options["--output"] || !options["--media-dir"]) throw new Error(usage);
  const source = await realpath(resolve(options["--source"]));
  if (!/\.swf$/i.test(source) || !(await stat(source)).isFile()) throw new Error("Source must be one SWF file.");
  if ((await stat(source)).size > 128 * 1024 * 1024) throw new Error("Compressed input exceeds 128 MiB budget.");
  const output = await writableDestination(resolve(options["--output"]));
  if (!output.endsWith(".json") || output === source) throw new Error("Output must be a separate JSON file.");
  const mediaRoot = await canonicalDestination(resolve(repository, "public/media"));
  const mediaDirectory = await writableDestination(resolve(options["--media-dir"]));
  if (!inside(mediaRoot, mediaDirectory) || mediaDirectory === mediaRoot) throw new Error("Media directory must be a lesson subdirectory of this repository's public/media.");
  const input = await readFile(source), movie = parseMovie(input);
  const audioAssets = [];
  for (const definition of movie.soundDefinitions.values()) {
    const { payload, ...metadata } = definition;
    if (!payload) continue;
    const filename = `${definition.soundId}.mp3`;
    const destination = await writableDestination(resolve(mediaDirectory, filename));
    if (!inside(mediaDirectory, destination)) throw new Error("Audio destination escapes its lesson directory through a symlink.");
    let durationSeconds = null;
    let durationMeasurement = null;
    // ffprobe reads stdin; inventory-only never materializes temporary audio files.
    const probe = spawnSync("ffprobe", ["-v", "error", "-show_entries", "format=duration:packet=duration_time", "-of", "json", "pipe:0"], { input: payload, encoding: "utf8", timeout: 15000, maxBuffer: 1024 * 1024 });
    if (probe.status === 0) {
      const measured = JSON.parse(probe.stdout);
      const packetDurations = (measured.packets ?? []).map(packet => Number(packet.duration_time));
      const packetDuration = packetDurations.length && packetDurations.every(value => Number.isFinite(value) && value > 0) ? packetDurations.reduce((sum, value) => sum + value, 0) : null;
      const duration = Number(measured.format?.duration ?? packetDuration);
      if (Number.isFinite(duration) && duration > 0) {
        durationSeconds = duration;
        durationMeasurement = measured.format?.duration === undefined ? "ffprobe-packet-sum" : "ffprobe-format";
      }
    }
    if (!options["--inventory-only"]) {
      await mkdir(dirname(destination), { recursive: true });
      await writeFile(destination, payload);
      if (sha(await readFile(destination)) !== sha(payload)) throw new Error("Written audio hash mismatch.");
    }
    audioAssets.push({ ...metadata, src: relative(mediaRoot, destination).split(sep).join("/"), sha256: sha(payload), embeddedMp3Sha256: sha(payload), durationSeconds, durationMeasurement });
  }
  const { soundDefinitions, ...metadata } = movie;
  const result = {
    version: 1, frameNumbering: "one-based-global", soundTimebase: 44100, envelopeLevelMaximum: 32768,
    source: relative(repository, source).split(sep).join("/"), sourceSha256: sha(input),
    ...metadata, audioAssets, inventoryOnly: Boolean(options["--inventory-only"]),
    limitations: [
      "Root cue frames are global; nested cue frames are sprite-local and cannot be flattened without placement/playhead/controller evidence.",
      "ActionScript audio creation, linkage, stopAll, timers, and dynamic playback are not executed or inferred. Inspect source scripts separately.",
      "Event sounds continue during source timeline stops. Native pause, visibility, loading, and teardown require explicit player lifecycle handling.",
      "MP3 seekSamples and decoder padding require decoder/listening review; sample-exact audible alignment is not certified.",
      "durationSeconds is ffprobe format duration or summed MP3 packet durations, including MPEG padding. Null means unavailable; source sampleCount/sampleRate is separate evidence.",
      "Empty stream headers are inventoried; nonempty stream audio, non-MP3 codecs, button sounds, and class-linked sounds require separate recovery.",
    ],
  };
  await mkdir(dirname(output), { recursive: true });
  await writeFile(output, JSON.stringify(result, null, 2) + "\n");
  console.log(`${options["--inventory-only"] ? "Inventoried" : "Recovered"} ${movie.audioCues.length} root cues, ${movie.nestedTimelines.length} sprite timelines, ${audioAssets.length} MP3 assets; ${movie.unsupported.length} unsupported records. No source code executed.`);
}
main().catch(error => { console.error(error.message); process.exitCode = 1; });
