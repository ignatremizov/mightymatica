// Fresh-clock CPU/filter probe; no browser/GPU or audible synchronization claim.
import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { createHash } from "node:crypto";
import { profileNativeDrawing } from "./profile-native-drawing.mjs";

const root = resolve(import.meta.dirname, "..");
const records = JSON.parse(await readFile(resolve(root,
  "src/modules/reasoning/tram-animation-optimization.json"), "utf8")).languages;
const hash = bytes => createHash("sha256").update(bytes).digest("hex");
const results = [];
for (const locale of ["en", "ru"]) {
  const record = records[locale], baseline = `.cache/tram-animated-originals/${record.beforeSha256}.mjs`;
  const current = `public/media/${record.module}`;
  if (hash(await readFile(resolve(root, baseline))) !== record.beforeSha256
    || hash(await readFile(resolve(root, current))) !== record.afterSha256) throw new Error("Probe input changed.");
  const result = { locale, beforeSha256: record.beforeSha256, afterSha256: record.afterSha256 };
  for (const [version, module] of [["before", baseline], ["after", current]]) {
    const consecutive = await profileNativeDrawing({
      module, frames: Array.from({ length: 12 }, (_, index) => 904 + index), repeat: 1,
    });
    const sorted = consecutive.samples.map(sample => sample.milliseconds).sort((a, b) => a - b);
    consecutive.medianMilliseconds = sorted[Math.floor(sorted.length / 2)];
    result[version] = consecutive;
    console.log(`${locale}/${version}: consecutive median ${consecutive.medianMilliseconds} ms`);
  }
  if (hash(await readFile(resolve(root, current))) !== record.afterSha256) throw new Error("Concurrent painter edit.");
  results.push(result);
}
await writeFile(resolve(root, "docs/reviews/tram-animation-performance.json"),
  JSON.stringify({ version: 1, method: "actual filter arithmetic; inert Canvas vectors/images; not browser FPS",
    width: 1520, height: 1105, results }, null, 2) + "\n");
