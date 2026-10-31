// Three explicitly approved parent timelines; no raster rendering or AS execution.
import { mkdtemp } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { spawnSync } from "node:child_process";

const root = resolve(import.meta.dirname, "../../..");
function run(args) {
  const result = spawnSync(process.execPath, args, { cwd: root, stdio: "inherit" });
  if (result.status !== 0) throw new Error(`${args[0]} failed (${result.status})`);
}
for (const [source, frames] of [["Pinoc-game", 240], ["Prosto-game", 240], ["Snowhite-game", 703]]) {
  // Retain the bounded scratch export for inspection; never publish its HTML/JS.
  const scratch = await mkdtemp(join(tmpdir(), "mightymatica-story-parent-"));
  console.log(`Reviewed derivative scratch: ${scratch}`);
  run(["scripts/export-original-frames.mjs",
    "--source", `/home/ignat/code/mightymatica-source-recovery/objects/Movies/${source}/original/${source}.swf`,
    "--frames", `1-${frames}`, "--output", scratch, "--format", "canvas"]);
  const output = `public/media/stories/canvas/${source}.mjs`;
  run(["scripts/convert-canvas-export.mjs", scratch, output]);
  run(["--check", output]);
  run(["scripts/recover-lesson-audio.mjs",
    "--source", `/home/ignat/code/mightymatica-source-recovery/objects/Movies/${source}/original/${source}.swf`,
    "--output", `src/modules/stories/audio-${source}.json`,
    "--media-dir", `public/media/stories/audio/${source}`]);
}
// Keep regenerated parent artwork on the same source-verified text-cache path.
run(["src/modules/stories/optimize-painters.mjs", "--apply"]);
