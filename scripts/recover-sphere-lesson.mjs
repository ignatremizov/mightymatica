#!/usr/bin/env node
// Read-only source recovery. Raw exporter JavaScript is never executed.
import { readFile, writeFile, mkdir, copyFile } from "node:fs/promises";
import { resolve, dirname } from "node:path";
import { inflateSync } from "node:zlib";
import { createHash } from "node:crypto";
import { spawnSync } from "node:child_process";
import { patchSpherePlaybackControl } from "./sphere-playback-control.mjs";
const root = resolve(import.meta.dirname, "..");
const archive = "/home/ignat/code/mightymatica-source-recovery/objects/Movies";
const media = "public/media/solids/sphere-lesson";
const sha = data => createHash("sha256").update(data).digest("hex");
function run(args) {
  const result = spawnSync(process.execPath, args, { cwd: root, stdio: "inherit" });
  if (result.status !== 0) throw new Error(`Failed: ${args.join(" ")}`);
}
function parseMovie(input) {
  if (!["CWS", "FWS"].includes(input.toString("ascii", 0, 3))) throw new Error("Unsupported SWF compression.");
  const body = input.toString("ascii", 0, 3) === "CWS" ? inflateSync(input.subarray(8)) : input.subarray(8);
  let bit = 5;
  const bits = body[0] >> 3;
  const signed = () => {
    let value = 0;
    for (let i = 0; i < bits; i++, bit++) value = value * 2 + ((body[bit >> 3] >> (7 - bit % 8)) & 1);
    return value >= 2 ** (bits - 1) ? value - 2 ** bits : value;
  };
  const [xmin, xmax, ymin, ymax] = [signed(), signed(), signed(), signed()];
  let offset = Math.ceil(bit / 8);
  const fps = body.readUInt16LE(offset) / 256;
  const frameCount = body.readUInt16LE(offset + 2);
  offset += 4;
  let frame = 1;
  const cues = [], sounds = {};
  while (offset < body.length) {
    const header = body.readUInt16LE(offset); offset += 2;
    const type = header >> 6;
    let size = header & 63;
    if (size === 63) { size = body.readUInt32LE(offset); offset += 4; }
    const data = body.subarray(offset, offset + size); offset += size;
    if (type === 0) break;
    if (type === 1) frame++;
    if (type === 14) {
      const id = data.readUInt16LE(0), flags = data[2];
      sounds[id] = { codec: flags >> 4, sampleRate: [5512.5, 11025, 22050, 44100][(flags >> 2) & 3], sampleCount: data.readUInt32LE(3), ...(flags >> 4 === 2 ? { seekSamples: data.readInt16LE(7), embeddedMp3Sha256: sha(data.subarray(9)) } : {}) };
    }
    // Both movies have an empty SoundStreamHead2 (27000000), but no stream blocks.
    if (type === 19 || ((type === 18 || type === 45) && data.readUInt16LE(2) !== 0)) throw new Error("Nonempty stream sound requires a separate reviewed extraction.");
    if (type !== 15) continue;
    const id = data.readUInt16LE(0), flags = data[2]; let p = 3;
    const u32 = () => { const value = data.readUInt32LE(p); p += 4; return value; };
    const inPoint44 = flags & 1 ? u32() : 0;
    const outPoint44 = flags & 2 ? u32() : null;
    const loops = flags & 4 ? data.readUInt16LE(p) : 1; if (flags & 4) p += 2;
    const envelope = [];
    if (flags & 8) {
      const count = data[p++];
      for (let i = 0; i < count; i++) {
        const mark44 = u32(), left = data.readUInt16LE(p), right = data.readUInt16LE(p + 2); p += 4;
        envelope.push({ mark44, left, right, seconds: mark44 / 44100, leftGain: left / 32768, rightGain: right / 32768 });
      }
    }
    cues.push({ frame, soundId: id, inPoint44, outPoint44, inPointSeconds: inPoint44 / 44100, outPointSeconds: outPoint44 === null ? null : outPoint44 / 44100, loops, sync: flags & 32 ? "stop" : flags & 16 ? "start" : "event", envelope });
  }
  return { width: (xmax - xmin) / 20, height: (ymax - ymin) / 20, fps, frameCount, cues, sounds };
}
const configurations = {
  en: { name: "Volumeofball-proof-examples", chapters: [["proof", 1, 2885], ["examples", 2886, 4133], ["ending", 4134, 5071]], stops: [3, 2878, 2901, 3113, 3292, 3514, 3751, 4031, 4147, 5071], timed: [3113, 3292, 3514, 3751, 4031] },
  ru: { name: "Volumeofball-proof-examples -ru", chapters: [["proof", 1, 2884], ["examples", 2885, 4132], ["ending", 4133, 4361]], stops: [73, 944, 1128, 2879, 3112, 3291, 3513, 3750, 4030, 4361], timed: [944, 1128, 3112, 3291, 3513, 3750, 4030] },
};
const mode = process.argv[2] ?? "--metadata";
if (!["--metadata", "--export", "--convert-reviewed"].includes(mode)) throw new Error("Use --metadata, --export, or --convert-reviewed after reviewing each temporary export.");
const languages = {};
for (const [language, config] of Object.entries(configurations)) {
  const source = resolve(archive, config.name);
  const original = await readFile(resolve(source, "original", `${config.name}.swf`));
  const movie = parseMovie(original);
  const output = resolve(root, media, language);
  await mkdir(output, { recursive: true });
  const chapters = config.chapters.map(([id, startFrame, endFrame]) => ({ id, startFrame, endFrame, module: `${media.replace("public/media/", "")}/${language}/${id}.mjs` }));
  for (const chapter of chapters) {
    const temporary = `/tmp/mightymatica-sphere-${language}-${chapter.id}`;
    if (mode === "--export") run(["scripts/export-original-frames.mjs", "--source", resolve(source, "original", `${config.name}.swf`), "--frames", `${chapter.startFrame}-${chapter.endFrame}`, "--output", temporary, "--format", "canvas"]);
    if (mode === "--convert-reviewed") {
      const target = resolve(root, "public/media", chapter.module);
      run(["scripts/convert-canvas-export.mjs", temporary, target]);
      await writeFile(target, patchSpherePlaybackControl(await readFile(target, "utf8"), language));
    }
  }
  const endFrame = chapters.at(-1).endFrame;
  const audioCues = movie.cues.filter(cue => cue.frame <= endFrame);
  const audioAssets = [];
  for (const id of [...new Set(audioCues.map(cue => cue.soundId))]) {
    const filename = `${id}.mp3`;
    const path = resolve(source, "resources/sounds", filename);
    const data = await readFile(path);
    if (sha(data) !== movie.sounds[id]?.embeddedMp3Sha256) throw new Error(`Recovered MP3 ${id} differs from embedded source bytes.`);
    await copyFile(path, resolve(output, filename));
    const probe = spawnSync("ffprobe", ["-v", "error", "-show_entries", "format=duration", "-of", "json", path], { encoding: "utf8" });
    if (probe.status !== 0) throw new Error(`ffprobe failed for ${path}`);
    audioAssets.push({ soundId: id, src: `${media.replace("public/media/", "")}/${language}/${filename}`, sha256: sha(data), durationSeconds: Number(JSON.parse(probe.stdout).format.duration), ...movie.sounds[id] });
  }
  languages[language] = {
    source: `Movies/${config.name}/${config.name}.swf`, sourceSha256: sha(original),
    width: movie.width, height: movie.height, fps: movie.fps, frameCount: movie.frameCount, endFrame, initialFrame: language === "en" ? 3 : 73,
    chapters,
    stops: config.stops.map(frame => ({ frame, kind: config.timed.includes(frame) ? "timed" : frame === endFrame ? "complete" : "manual", ...(config.timed.includes(frame) ? { delayMs: 4000 } : {}) })),
    audioCues, audioAssets,
  };
}
const target = resolve(root, "src/content/sphere-lesson.json");
await mkdir(dirname(target), { recursive: true });
await writeFile(target, JSON.stringify({ version: 1, frameNumbering: "one-based-global", soundTimebase: 44100, envelopeLevelMaximum: 32768, languages }, null, 2) + "\n");
console.log(`Recovered Sphere metadata (${mode}); no source drawing JavaScript executed.`);
