import { readFile, writeFile, mkdir } from "node:fs/promises";
import { inflateSync } from "node:zlib";
import { createHash } from "node:crypto";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import path from "node:path";

const root = fileURLToPath(new URL("../", import.meta.url));
const recovery = process.argv[2] || "/home/ignat/code/mightymatica-source-recovery";
const archive = process.argv[3] || "/home/ignat/code/mightymatica-archive-2026-08-09/raw-site";
const only = process.argv[4];
const titles = {
  Pinoc1: "Pinocchio · original cartoon",
  Prosto5: "Prosto5 · original cartoon",
  "Snowpart-0": "Snow White · introduction",
  "Snowpart-2": "Snow White · reward",
  Funnymathmult: "Funny mathematics · original film",
  "Conic-6x4-f": "Conic sections · original film",
  "cubesec6x4-f": "Cube sections · original film",
  Moeb7: "Möbius strip · original film",
  Cubesections: "Cube sections · external original film",
};
if (only && !Object.hasOwn(titles, only)) throw new Error(`Unknown film: ${only}`);
function run(command, args) {
  const result = spawnSync(command, args, { encoding: "utf8", maxBuffer: 4 * 1024 * 1024 });
  if (result.status !== 0) throw new Error(`${command}: ${result.stderr}`);
  return result.stdout;
}
const probe = file => JSON.parse(run("ffprobe", ["-v", "error", "-show_streams", "-show_format", "-of", "json", file]));
const hash = async file => createHash("sha256").update(await readFile(file)).digest("hex");
function timeline(buffer) {
  const data = buffer.toString("ascii", 0, 3) === "CWS"
    ? Buffer.concat([buffer.subarray(0, 8), inflateSync(buffer.subarray(8))]) : buffer;
  let offset = 8 + Math.ceil((5 + 4 * (data[8] >> 3)) / 8);
  const fps = data.readUInt16LE(offset) / 256;
  const frames = data.readUInt16LE(offset + 2);
  offset += 4;
  let frame = 0;
  const blocks = [];
  while (offset + 2 <= data.length) {
    const tag = data.readUInt16LE(offset); offset += 2;
    const code = tag >> 6;
    let length = tag & 63;
    if (length === 63) { length = data.readUInt32LE(offset); offset += 4; }
    if (code === 19) blocks.push(frame);
    if (code === 1) frame++;
    offset += length;
    if (!code) break;
  }
  return { fps, frames, streamBlocks: blocks.length, firstAudioFrame: blocks[0] ?? null, lastAudioFrame: blocks.at(-1) ?? null };
}
await mkdir(path.join(root, "public/media/films"), { recursive: true });
const films = only ? JSON.parse(await readFile(path.join(root, "src/content/films.json"), "utf8")) : [];
const provenance = only ? JSON.parse(await readFile(path.join(root, "public/media/films/provenance.json"), "utf8")) : [];
const replace = (items, item) => {
  const index = items.findIndex(entry => entry.key === item.key);
  if (index < 0) items.push(item); else items[index] = item;
};
for (const [key, title] of Object.entries(titles)) {
  if (only && key !== only) continue;
  const external = key === "Cubesections";
  const directory = path.join(recovery, "objects/Movies", key);
  const video = external ? path.join(archive, "Movies/Cubesections.flv") : path.join(directory, "resources/movies/1.flv");
  const audio = external ? null : path.join(directory, "resources/sounds/-1.mp3");
  const info = probe(video);
  const timing = external ? null : timeline(await readFile(path.join(directory, "original", `${key}.swf`)));
  if (audio && (!timing.streamBlocks || timing.firstAudioFrame !== 0)) throw new Error(`${key}: inspect non-zero/missing stream audio timing before conversion`);
  const output = path.join(root, "public/media/films", `${key}.mp4`);
  // The recovered Möbius stream is digitally silent; retain its source
  // provenance without shipping an empty soundtrack or an unmute control.
  const silent = key === "Moeb7";
  const crf = silent ? "12" : "20";
  const args = ["-n", "10", "ffmpeg", "-hide_banner", "-loglevel", "error", "-y", "-threads", "2", "-i", video];
  if (audio && !silent) args.push("-threads", "2", "-i", audio);
  args.push("-map", "0:v:0");
  if (silent) args.push("-an");
  else args.push("-map", audio ? "1:a:0" : "0:a?", "-c:a", "aac", "-b:a", "128k");
  args.push("-c:v", "libx264", "-threads", "2", "-preset", "veryfast", "-crf", crf, "-pix_fmt", "yuv420p", "-movflags", "+faststart", output);
  console.log(`Converting ${key} sequentially`);
  run("nice", args);
  const converted = probe(output);
  replace(films, { key, src: `films/${key}.mp4`, source: `Movies/${key}.${external ? "flv" : "swf"}`, duration: Number(converted.format.duration), audio: converted.streams.some(s => s.codec_type === "audio"), title });
  replace(provenance, { key, video, videoSha256: await hash(video), audio, audioSha256: audio ? await hash(audio) : null, audioDuration: audio ? Number(probe(audio).format.duration) : null, timing, sourceStreams: info.streams, encoding: { crf: Number(crf), silentAudioOmitted: silent }, outputSha256: await hash(output) });
}
for (const film of films) {
  const stream = provenance.find(entry => entry.key === film.key)?.sourceStreams.find(stream => stream.codec_type === "video");
  if (stream) { film.width = stream.width; film.height = stream.height; }
}
await writeFile(path.join(root, "src/content/films.json"), `${JSON.stringify(films, null, 2)}\n`);
await writeFile(path.join(root, "public/media/films/provenance.json"), `${JSON.stringify(provenance, null, 2)}\n`);
