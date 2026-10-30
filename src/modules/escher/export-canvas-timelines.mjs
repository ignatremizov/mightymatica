import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { spawnSync } from "node:child_process";

const root = resolve(import.meta.dirname, "../../..");
const counts = {
  "Escher-ball": 80, "Escher-reptilies": 60, "Escher-stairsbig": 140,
  "Hands-escher": 60, "Birdfish-e": 80,
  "Escher-BandF-game": 261, "Escher-faces-game": 240, "Escher-hands-game": 240,
  "Escher-lizards-game": 259, "Escher-stairbig-game": 320,
  "Escher-stairs-game": 260, "Escher-waterfall-game": 279,
};
function run(command, args) {
  const result = spawnSync(command, args, { cwd: root, stdio: "inherit" });
  if (result.status !== 0) throw new Error(`${command} failed (${result.status})`);
}
for (const [source, frames] of Object.entries(counts)) {
  const scratch = await mkdtemp(join(tmpdir(), "mightymatica-escher-canvas-"));
  try {
    run(process.execPath, ["scripts/export-original-frames.mjs",
      "--source", `/home/ignat/code/mightymatica-source-recovery/objects/Movies/${source}/original/${source}.swf`,
      "--frames", `1-${frames}`, "--output", scratch, "--format", "canvas"]);
    const output = `public/media/escher/canvas/${source}.mjs`;
    run(process.execPath, ["scripts/convert-canvas-export.mjs", scratch, output]);
    run(process.execPath, ["--check", output]);
  } finally {
    await rm(scratch, { recursive: true, force: true });
  }
}
