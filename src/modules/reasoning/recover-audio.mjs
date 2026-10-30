// Recover only this family's source audio; never regenerate the native artwork.
import { readFile, writeFile } from "node:fs/promises";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { resolve } from "node:path";

const root = fileURLToPath(new URL("../../../", import.meta.url));
const archive = "/home/ignat/code/mightymatica-archive-2026-08-09/raw-site";
const timelines = JSON.parse(await readFile(new URL("./native-timelines.json", import.meta.url), "utf8"));
const families = { reasoning: timelines, dissections: {
  bills: {
    en: { source: "Movies/Bills-transform.swf" },
    ru: { source: "Movies/Bills-transform-ru.swf" },
  },
} };
for (const [family, entries] of Object.entries(families)) {
  const result = {};
  for (const [key, languages] of Object.entries(entries)) {
    result[key] = {};
    for (const [locale, source] of Object.entries(languages)) {
      const directory = resolve(root, `public/media/${family}/audio/${key}-${locale}`);
      const metadata = `${directory}/source.json`;
      const child = spawnSync(process.execPath, [
        "scripts/recover-lesson-audio.mjs", "--source", resolve(archive, source.source),
        "--output", metadata, "--media-dir", directory,
      ], { cwd: root, stdio: "inherit", timeout: 120000 });
      if (child.status !== 0) throw new Error(`Audio recovery failed: ${source.source}`);
      const recovered = JSON.parse(await readFile(metadata, "utf8"));
      // Source button hover/click effects are distinct from root lesson events.
      // Retain their limitation in source.json; do not invent timeline cues.
      if (recovered.unsupported.some(item => item.kind !== "button-sound")
        || recovered.nestedTimelines.some(t => t.audioCues.length)) {
        throw new Error(`Review unsupported or nested audio before integration: ${source.source}`);
      }
      result[key][locale] = {
        width: recovered.width, height: recovered.height, fps: recovered.fps,
        frameCount: recovered.frameCount, sourceSha256: recovered.sourceSha256,
        audioAssets: recovered.audioAssets,
        audioCues: recovered.audioCues,
      };
    }
  }
  await writeFile(resolve(root, `src/modules/${family}/lesson-audio.json`), JSON.stringify(result, null, 2) + "\n");
}
