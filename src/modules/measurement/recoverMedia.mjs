#!/usr/bin/env node
// Offline family recovery; never imported by the application.
import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { spawnSync } from "node:child_process";
import { patchMeasurementPlaybackControl } from "../../../scripts/measurement-playback-control.mjs";

const root = resolve(import.meta.dirname, "../../..");
const recovery = "/home/ignat/code/mightymatica-source-recovery/objects/Movies";
const configurations = [
  { id: "area", locale: "en", source: "Area", initial: 17, end: 2553, stops: [17, 1109, 1544, 2024, 2553] },
  { id: "area", locale: "ru", source: "Area-ru", initial: 17, end: 2554, stops: [17, 1109, 1544, 2025, 2554] },
  { id: "polygon", locale: "en", source: "Area of polygon", initial: 1, end: 907, stops: [1, 907] },
  { id: "polygon", locale: "ru", source: "Area of polygon-ru", initial: 1, end: 907, stops: [1, 907] },
  { id: "circle", locale: "en", source: "Circle", initial: 127, end: 2178, stops: [127] },
  { id: "circle", locale: "ru", source: "Circle-ru", initial: 127, end: 2229, stops: [127] },
];
const mode = process.argv[2];
if (!["--audio", "--export", "--convert-reviewed", "--patch-reviewed"].includes(mode)) {
  throw new Error("Use --audio, --export, --patch-reviewed, or --convert-reviewed after reviewing generated drawing exports.");
}
const run = args => {
  const result = spawnSync(process.execPath, args, { cwd: root, stdio: "inherit" });
  if (result.status !== 0) throw new Error(`Recovery failed: ${args.join(" ")}`);
};
const lessons = {};
for (const item of configurations) {
  const source = resolve(recovery, item.source, "original", `${item.source}.swf`);
  const relative = `measurement/native/${item.id}/${item.locale}`;
  const directory = resolve(root, "public/media", relative);
  const inventory = resolve(directory, "audio.json");
  const temporary = `/tmp/mightymatica-measurement-${item.id}-${item.locale}`;
  if (mode === "--export") {
    run(["scripts/export-original-frames.mjs", "--source", source, "--frames", `1-${item.end}`, "--output", temporary, "--format", "canvas"]);
    continue;
  }
  if (mode === "--convert-reviewed" || mode === "--patch-reviewed") {
    const target = resolve(directory, "timeline.mjs");
    if (mode === "--convert-reviewed") run(["scripts/convert-canvas-export.mjs", temporary, target]);
    await writeFile(target, patchMeasurementPlaybackControl(await readFile(target, "utf8"), item.id, item.locale));
    continue;
  }
  run(["scripts/recover-lesson-audio.mjs", "--source", source, "--output", inventory, "--media-dir", directory]);
  const metadata = JSON.parse(await readFile(inventory, "utf8"));
  if (metadata.frameCount !== item.end || metadata.fps !== 24) throw new Error("Unexpected source timeline.");
  const used = new Set(metadata.audioCues.map(cue => cue.soundId));
  const assets = metadata.audioAssets.filter(asset => used.has(asset.soundId));
  if (assets.some(asset => !Number.isFinite(asset.durationSeconds) || asset.durationSeconds <= 0)) throw new Error("Audio duration needs review.");
  lessons[item.id] ??= {};
  lessons[item.id][item.locale] = {
    width: metadata.width, height: metadata.height, fps: metadata.fps,
    initialFrame: item.initial, endFrame: item.end,
    chapters: [{ id: item.id, startFrame: 1, endFrame: item.end, module: `${relative}/timeline.mjs` }],
    stops: item.stops.map(frame => ({ frame, kind: frame === item.end ? "complete" : "manual" })),
    audioAssets: assets,
    audioCues: metadata.audioCues,
  };
}
if (mode === "--audio") {
  await writeFile(resolve(import.meta.dirname, "lessonData.json"), JSON.stringify(lessons, null, 2) + "\n");
}
