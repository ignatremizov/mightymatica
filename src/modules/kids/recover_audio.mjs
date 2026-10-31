// Offline binary audio recovery only; preservation trees are read-only.
import { readFile, writeFile, copyFile, mkdir, readdir, unlink } from "node:fs/promises";
import { resolve } from "node:path";
import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";

const root = resolve(import.meta.dirname, "../../..");
const boards = JSON.parse(await readFile(resolve(import.meta.dirname, "recovered.json"), "utf8"));
const recovery = "/home/ignat/code/mightymatica-source-recovery/objects";
const originalMedia = "/home/ignat/code/mightymatica-archive-2026-08-09/raw-site/Movies";
const sources = [
  ...Object.entries(boards).map(([id, board]) => ({
    id, family: "kids", source: board.source, introEnd: board.stages[0].frame,
  })),
  { id: "falling-figure", family: "falling", source: "Movies/FallingFigure.swf", introEnd: 1 },
];
if (process.argv.includes("--export-falling") || process.argv.includes("--convert-reviewed-falling")) {
  const temporary = "/tmp/mightymatica-falling-audio-completion";
  const args = process.argv.includes("--export-falling") ? [
    "scripts/export-original-frames.mjs",
    "--source", resolve(recovery, "Movies/FallingFigure/original/FallingFigure.swf"),
    "--frames", "55-109,150-204,244-329,338-423", "--output", temporary, "--format", "canvas",
  ] : [
    "scripts/convert-canvas-export.mjs", temporary,
    resolve(root, "public/media/falling/audio/falling-figure/completion.mjs"),
  ];
  const result = spawnSync(process.execPath, args, { cwd: root, stdio: "inherit" });
  if (result.status !== 0) throw new Error("Falling completion recovery failed.");
  if (process.argv.includes("--convert-reviewed-falling")) optimizePainters("falling");
  process.exit(0);
}
if (process.argv.includes("--export-lessons") || process.argv.includes("--convert-reviewed-lessons")) {
  const catalog = JSON.parse(await readFile(resolve(import.meta.dirname, "audio.json"), "utf8"));
  for (const entry of sources.filter(item => item.family === "kids")) {
    const name = entry.source.slice("Movies/".length, -4);
    const temporary = `/tmp/mightymatica-${entry.id}-audio-intro`;
    const args = process.argv.includes("--export-lessons") ? [
      "scripts/export-original-frames.mjs",
      "--source", resolve(recovery, "Movies", name, "original", `${name}.swf`),
      "--frames", `1-${catalog[entry.id].endFrame}`, "--output", temporary, "--format", "canvas",
    ] : [
      "scripts/convert-canvas-export.mjs", temporary,
      resolve(root, `public/media/kids/audio/${entry.id}/lesson.mjs`),
    ];
    const result = spawnSync(process.execPath, args, { cwd: root, stdio: "inherit" });
    if (result.status !== 0) throw new Error(`Intro recovery failed: ${entry.id}`);
    if (process.argv.includes("--convert-reviewed-lessons")) {
      // Replace only this script's superseded generated introduction module.
      await unlink(resolve(root, `public/media/kids/audio/${entry.id}/intro.mjs`)).catch(error => {
        if (error.code !== "ENOENT") throw error;
      });
    }
  }
  if (process.argv.includes("--convert-reviewed-lessons")) optimizePainters("kids");
  process.exit(0);
}
function optimizePainters(family) {
  const result = spawnSync(process.execPath, [
    "src/modules/kids/optimize-painters.mjs", "--apply", family,
  ], { cwd: root, stdio: "inherit" });
  if (result.status !== 0) throw new Error(`${family}: source-text filter optimization failed.`);
  const empty = spawnSync(process.execPath, [
    "scripts/optimize-empty-text-filters.mjs", "--apply", family,
  ], { cwd: root, stdio: "inherit" });
  if (empty.status !== 0) throw new Error(`${family}: empty-text filter optimization failed.`);
}
const catalogs = { kids: {}, falling: {} };
async function findMain(directory) {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const filename = resolve(directory, entry.name);
    if (entry.isDirectory()) {
      const result = await findMain(filename);
      if (result) return result;
    } else if (entry.name === "MainTimeline.as") return filename;
  }
}
for (const entry of sources) {
  const name = entry.source.slice("Movies/".length, -4);
  const folder = `${entry.family}/audio/${entry.id}`;
  const destination = resolve(root, "public/media", folder);
  const output = resolve(destination, "source.json");
  const source = resolve(recovery, "Movies", name, "original", `${name}.swf`);
  const result = spawnSync(process.execPath, [
    "scripts/recover-lesson-audio.mjs", "--source", source,
    "--output", output, "--media-dir", destination,
  ], { cwd: root, stdio: "inherit" });
  if (result.status !== 0) throw new Error(`Audio recovery failed: ${entry.id}`);
  const metadata = JSON.parse(await readFile(output, "utf8"));
  const externalMusic = [];
  const fireworks = [];
  if (entry.family === "kids") {
    const filename = await findMain(resolve(recovery, "Movies", name, "actionscript"));
    const script = await readFile(filename, "utf8");
    const gain = Number(script.match(/this\.trans = new SoundTransform\(([\d.]+),0\)/)?.[1] ?? .4);
    // frameNN method numbers are global in these recovered AS3 root classes.
    // Only the verified sndkid channel is mapped; arbitrary Sound code is not.
    for (const method of script.matchAll(/internal function frame(\d+)\(\)[\s\S]*?\n      \}/g)) {
      if (method[0].includes("this.channel = this.sndkid.play(0,1,this.trans)")) {
        externalMusic.push({ frame: Number(method[1]), sync: "event", gain });
      }
      if (method[0].includes("this.channel.stop()")) {
        externalMusic.push({ frame: Number(method[1]), sync: "stop", gain });
      }
      if (method[0].includes("this.fireworksChannel = this.fireworks.play")) {
        const volume = Number(method[0].match(/new SoundTransform\(([\d.]+),0\)/)?.[1]);
        if (!Number.isFinite(volume)) throw new Error("Unresolved fireworks gain.");
        fireworks.push({ frame: Number(method[1]), gain: volume });
      }
    }
  }
  catalogs[entry.family][entry.id] = {
    source: entry.source, sourceSha256: metadata.sourceSha256,
    width: metadata.width, height: metadata.height, fps: metadata.fps,
    initialFrame: 1, endFrame: metadata.frameCount, introEnd: entry.introEnd,
    audioAssets: metadata.audioAssets, audioCues: metadata.audioCues,
    externalMusic,
    fireworks,
    // Sprite-local cues are deliberately not flattened into this root clock.
    nestedCueCount: metadata.nestedTimelines.reduce((sum, item) => sum + item.audioCues.length, 0),
  };
}
const shared = resolve(root, "public/media/kids/audio/effects");
await mkdir(shared, { recursive: true });
const hashes = {};
for (const filename of ["Kidsmelody.mp3", "Shortbang.mp3", "AngryMob.mp3", "salut.MP3"]) {
  const source = resolve(originalMedia, filename);
  const destination = resolve(shared, filename.toLowerCase());
  await copyFile(source, destination);
  hashes[filename] = createHash("sha256").update(await readFile(source)).digest("hex");
}
await writeFile(resolve(shared, "provenance.json"), JSON.stringify(hashes, null, 2) + "\n");
function measuredAsset(filename, soundId) {
  const probe = spawnSync("ffprobe", [
  "-v", "error", "-show_entries", "stream=sample_rate,duration_ts,time_base",
  "-show_entries", "format=duration", "-of", "json", resolve(shared, filename),
], { encoding: "utf8" });
if (probe.status !== 0) throw new Error(`Cannot measure original ${filename}.`);
const measured = JSON.parse(probe.stdout);
const stream = measured.streams[0];
const [numerator, denominator] = stream.time_base.split("/").map(Number);
return {
  soundId, src: `kids/audio/effects/${filename}`,
  durationSeconds: Number(measured.format.duration), sampleRate: Number(stream.sample_rate),
  sampleCount: Math.round(stream.duration_ts * numerator / denominator * Number(stream.sample_rate)),
};
}
const music = measuredAsset("kidsmelody.mp3", 90000);
const effects = [
  measuredAsset("shortbang.mp3", 90001), measuredAsset("angrymob.mp3", 90002),
  measuredAsset("salut.mp3", 90003),
];
for (const lesson of Object.values(catalogs.kids)) {
  lesson.audioAssets.push(music, ...effects);
  lesson.audioCues.push(...lesson.externalMusic.map(cue => ({
    frame: cue.frame, soundId: music.soundId, inPoint44: 0, outPoint44: null,
    loops: 1, sync: cue.sync,
    envelope: [{ mark44: 0, left: Math.round(cue.gain * 32768), right: Math.round(cue.gain * 32768) }],
  })));
  lesson.audioCues.push(...lesson.fireworks.map(cue => ({
    frame: cue.frame, soundId: 90003, inPoint44: 0, outPoint44: null,
    loops: 1, sync: "event",
    envelope: [{ mark44: 0, left: Math.round(cue.gain * 32768), right: Math.round(cue.gain * 32768) }],
  })));
  lesson.audioCues.sort((a, b) => a.frame - b.frame);
}
for (const family of ["kids", "falling"]) {
  await writeFile(resolve(root, `src/modules/${family}/audio.json`), JSON.stringify(catalogs[family], null, 2) + "\n");
}
