// Reproducible derivative generation. Archives are read only; scratch is owned.
import { mkdtemp, rm, mkdir } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { spawnSync } from "node:child_process";

const root = resolve(import.meta.dirname, "../../..");
const counts = { BandF: 261, faces: 240, hands: 240, lizards: 259, stairbig: 320, stairs: 260, waterfall: 279 };
function run(command, args) {
  const result = spawnSync(command, args, { cwd: root, stdio: "inherit" });
  if (result.status !== 0) throw new Error(`${command} failed (${result.status})`);
}
await mkdir(join(root, "public/media/escher/game-timelines"), { recursive: true });
for (const [key, frames] of Object.entries(counts)) {
  const scratch = await mkdtemp(join(tmpdir(), "mightymatica-escher-"));
  try {
    for (let start = 1; start <= frames; start += 120) {
      run(process.execPath, ["scripts/export-original-frames.mjs",
        "--source", `/home/ignat/code/mightymatica-source-recovery/objects/Movies/Escher-${key}-game/original/Escher-${key}-game.swf`,
        "--frames", `${start}-${Math.min(frames, start + 119)}`,
        "--output", scratch, "--format", "png"]);
    }
    run("flock", [join(tmpdir(), "mightymatica-ffdec-export.lock"), "nice", "-n", "15",
      "ffmpeg", "-hide_banner", "-loglevel", "error", "-y", "-threads", "2",
      "-framerate", "24", "-start_number", "1", "-i", join(scratch, "%d.png"),
      "-c:v", "libx264", "-threads", "2", "-preset", "veryfast", "-crf", "18",
      "-pix_fmt", "yuv420p", "-movflags", "+faststart",
      join(root, `public/media/escher/game-timelines/${key}.mp4`)]);
  } finally {
    await rm(scratch, { recursive: true, force: true });
  }
}
