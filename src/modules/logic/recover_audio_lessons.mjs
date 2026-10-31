/** Bounded, source-specific regeneration; archives are read-only. */
import { execFileSync } from "node:child_process";
import { mkdir, readFile, writeFile, copyFile } from "node:fs/promises";
import { join } from "node:path";

const recovery = "/home/ignat/code/mightymatica-source-recovery/objects/Movies";
const native = "public/media/logic/native";
const metadataOnly = process.argv.includes("--metadata-only");
const variants = [
  { source: "Wisemen", key: "wisemen-en", initial: 11, end: 1140 },
  { source: "Wisemen-ru", key: "wisemen-ru", initial: 11, end: 1140 },
  { source: "Wisemen 8", key: "wisemen-eight-en", initial: 1, end: 1137 },
  { source: "Wisemen 8-ru", key: "wisemen-eight-ru", initial: 1, end: 1137 },
];
const run = (script, args) => execFileSync(process.execPath, [script, ...args], { stdio: "inherit" });
const lessons = {};
for (const variant of variants) {
  const source = join(recovery, variant.source, "original", `${variant.source}.swf`);
  const audioFile = `src/modules/logic/${variant.key}-audio.json`;
  if (!metadataOnly) run("scripts/recover-lesson-audio.mjs", ["--source", source, "--output", audioFile,
    "--media-dir", `${native}/${variant.key}`]);
  const audio = JSON.parse(await readFile(audioFile, "utf8"));
  const definitions = {};
  for (const [part, start, end] of [["story", 1, 1097], ["hint", 1098, variant.end]]) {
    const output = `${native}/${variant.key}-${part}.mjs`;
    const temp = `/tmp/mightymatica-logic-${variant.key}-${part}`;
    if (!metadataOnly) {
      run("scripts/export-original-frames.mjs", ["--source", source, "--frames", `${start}-${end}`,
        "--output", temp, "--format", "canvas"]);
      run("scripts/convert-canvas-export.mjs", [temp, output]);
    }
    const cues = audio.audioCues.filter(cue => cue.frame >= start && cue.frame <= end);
    const used = new Set(cues.map(cue => cue.soundId));
    definitions[part] = {
      width: audio.width, height: audio.height, fps: audio.fps,
      initialFrame: part === "story" ? variant.initial : start, endFrame: end,
      chapters: [{ id: part, startFrame: start, endFrame: end, module: `logic/native/${variant.key}-${part}.mjs` }],
      stops: part === "story"
        ? [{ frame: variant.initial, kind: "manual" }, { frame: end, kind: "complete" }]
        : [{ frame: end, kind: "complete" }],
      audioAssets: audio.audioAssets.filter(asset => used.has(asset.soundId)),
      audioCues: cues,
    };
  }
  lessons[variant.key] = definitions;
}
await writeFile("src/modules/logic/wisemen-lessons.json", JSON.stringify(lessons, null, 2) + "\n");
await mkdir(`${native}/effects`, { recursive: true });
for (const file of ["Howmany.mp3", "Shortbang.mp3", "AngryMob.mp3", "Mystery.mp3", "Kidsmelody.mp3", "salut.MP3"]) {
  await copyFile(`/home/ignat/code/mightymatica-archive-2026-08-09/raw-site/Movies/${file}`, `${native}/effects/${file}`);
}
if (!metadataOnly) {
  run("src/modules/logic/optimize-painters.mjs", ["--apply"]);
  run("scripts/optimize-reviewed-nested-filters.mjs", ["--apply", "--family", "logic"]);
  execFileSync("python3", ["scripts/recover-reasoning-logic-controls.py"], { stdio: "inherit" });
  run("scripts/reasoning-logic-playback-control.mjs", ["--apply", "logic"]);
}
