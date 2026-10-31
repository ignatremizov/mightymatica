/**
 * Offline, bounded recovery for the reviewed motion/fractal lesson sources.
 * Run from the repository root. Never imported by application code.
 */
import { spawnSync } from "node:child_process";
import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const archive = "/home/ignat/code/mightymatica-archive-2026-08-09/raw-site/Movies";
const plans = [
  ["motion", "coin-cluster", "en", "Coinsrotate-e", 1558, [1257]],
  ["motion", "coin-cluster", "ru", "Coinsrotate", 1558, [1257]],
  ["motion", "two-coins", "en", "Coinsrotate-2c-e", 733, [], [183, 203, 205, 206]],
  ["motion", "two-coins", "ru", "Coinsrotate-2c", 733, [], [183, 203, 205, 206]],
  ["motion", "square-coin", "en", "Coinrotate-sq-e", 1190, [], [261, 282, 283, 284]],
  ["motion", "square-coin", "ru", "Coinrotate-sq-ru", 1190, [], [261, 281, 283, 284]],
  ["motion", "earth-belt", "en", "Earthandbelt", 1028, [580]],
  ["motion", "earth-belt", "ru", "Earthandbelt-ru", 1028, [580]],
  ["motion", "earth-walk", "en", "Walk around earth", 890, [], [623, 642, 645, 646]],
  ["motion", "earth-walk", "ru", "Walk around earth-ru", 890, [], [623, 642, 645, 646]],
  ["motion", "cyclists", "en", "Byciclist-eng", 880, [], [818, 838, 840, 841]],
  ["motion", "cyclists", "ru", "Byciclist-ru", 880, [], [818, 838, 840, 841]],
  ["motion", "cyclists", "zh", "Byciclist-chi", 843, [], [818, 819, 840, 841]],
  ["motion", "caterpillar", "en", "Caterpillar", 1000, [518, 519]],
  ["motion", "caterpillar", "ru", "Caterpillar-ru", 1000, [518, 519]],
  ["fractals", "carpet", "en", "Serp-carp-intr", 1144, []],
  ["fractals", "buffon", "en", "byufon", 4214, [986, 2796, 3876]],
  ["fractals", "buffon", "ru", "byufon-ru", 3823, [851, 2661, 3423]],
  ["fractals", "mobius-face", "en", "Moebius and face", 685, []],
];
const run = (args) => {
  const result = spawnSync(process.execPath, args, { stdio: "inherit" });
  if (result.status !== 0) throw new Error(`Recovery failed: ${args.join(" ")}`);
};
const selected = process.argv[2];
const selectedTitle = process.argv[3];
const metadataOnly = process.argv.includes("--metadata-only");
for (const family of ["motion", "fractals"]) {
  if (selected && selected !== family) continue;
  let entries = {};
  try { entries = JSON.parse(await readFile(resolve(`src/modules/${family}/native-lessons.json`), "utf8")); }
  catch (error) { if (error.code !== "ENOENT") throw error; }
  for (const [owner, id, language, source, end, holds, gate] of plans) {
    if (owner !== family) continue;
    if (selectedTitle && selectedTitle !== "--metadata-only" && selectedTitle !== `${id}/${language}`) continue;
    const local = `${family}/native/${id}/${language}`;
    const destination = resolve("public/media", local);
    await mkdir(destination, { recursive: true });
    const cache = resolve(".cache/motion-fractal-lessons", local);
    await mkdir(cache, { recursive: true });
    const metadata = resolve(cache, "audio-source.json");
    if (metadataOnly) {
      try { await rename(resolve(destination, "audio-source.json"), metadata); }
      catch (error) { if (error.code !== "ENOENT") throw error; }
    } else {
      run(["scripts/recover-lesson-audio.mjs", "--source", `${archive}/${source}.swf`,
        "--output", metadata, "--media-dir", destination]);
    }
    const audio = JSON.parse(await readFile(metadata, "utf8"));
    if (audio.unsupported.length) {
      console.log(`${source}: unsupported mechanisms: ${JSON.stringify(audio.unsupported)}`);
    }
    const boundaries = new Set([end, ...holds]);
    if (gate) {
      boundaries.add(gate[0]);
      boundaries.add(gate[1] - 1);
      boundaries.add(gate[2]);
    }
    const chapters = metadataOnly ? entries[id][language].lesson.chapters : [];
    let start = 1;
    for (const finish of metadataOnly ? [] : [...boundaries].sort((a, b) => a - b)) {
      const id = `frames-${start}-${finish}`;
      const exported = resolve(cache, id);
      run(["scripts/export-original-frames.mjs", "--source", `${archive}/${source}.swf`,
        "--frames", `${start}-${finish}`, "--output", exported, "--format", "canvas"]);
      run(["scripts/convert-canvas-export.mjs", exported, resolve(destination, `${id}.mjs`)]);
      chapters.push({ id, startFrame: start, endFrame: finish, module: `${local}/${id}.mjs` });
      start = finish + 1;
    }
    const lesson = {
      width: audio.width, height: audio.height, fps: audio.fps,
      initialFrame: 1, endFrame: end, chapters,
      stops: holds.map(frame => ({ frame, kind: "manual" })),
      audioAssets: audio.audioAssets,
      audioCues: audio.audioCues,
    };
    entries[id] ??= {};
    entries[id][language] = { source: `Movies/${source}.swf`, sourceSha256: audio.sourceSha256, lesson, gate };
    // Retain progress if an unrelated title later hits a converter limit.
    await writeFile(resolve(`src/modules/${family}/native-lessons.json`), JSON.stringify(entries, null, 2) + "\n");
    console.log(`Completed ${family}/${id}/${language}`);
  }
  if (!metadataOnly) {
    run(["src/modules/motion/optimize-painters.mjs", family, "--recover-bounds"]);
    run(["src/modules/motion/optimize-painters.mjs", family, "--recover-drawing-bounds"]);
    run(["src/modules/motion/optimize-painters.mjs", family, "--apply"]);
    if (family === "motion") {
      run(["scripts/optimize-reviewed-nested-filters.mjs", "--apply", "--family", "motion"]);
      run(["src/modules/motion/optimize-earth-belt.mjs", "--apply"]);
    }
    // Restore only source-verified two-state pp painters after regeneration.
    run(["scripts/motion-fractal-playback-control.mjs", "--apply", family]);
  }
}
