// Serialized CPU/filter diagnostic, not a browser FPS or pixel-parity test.
import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { createHash } from "node:crypto";
import { profileNativeDrawing } from "./profile-native-drawing.mjs";

const root = resolve(import.meta.dirname, "..");
const records = JSON.parse(await readFile(resolve(root,
  "src/modules/motion/earth-belt-animation-optimization.json"), "utf8")).languages;
const hash = bytes => createHash("sha256").update(bytes).digest("hex");
const results = [];
for (const locale of ["en", "ru"]) {
  const record = records[locale];
  const baseline = `.cache/earth-belt-animated-originals/${record.beforeSha256}.mjs`;
  const current = `public/media/${record.module}`;
  if (hash(await readFile(resolve(root, baseline))) !== record.beforeSha256
    || hash(await readFile(resolve(root, current))) !== record.afterSha256) throw new Error("Probe input changed.");
  const comparison = { locale, beforeSha256: record.beforeSha256, afterSha256: record.afterSha256 };
  for (const [version, module] of [["before", baseline], ["after", current]]) {
    comparison[version] = {
      repeated: await profileNativeDrawing({ module, frames: [326, 360, 580], repeat: 3 }),
      // A live animation rarely repeats the exact same clock. Measure fresh
      // consecutive poses separately so cache-hit timings cannot hide misses.
      consecutive: await profileNativeDrawing({
        module, frames: Array.from({ length: 12 }, (_, index) => 326 + index), repeat: 1,
      }),
    };
    const samples = comparison[version].consecutive.samples.map(sample => sample.milliseconds).sort((a, b) => a - b);
    comparison[version].consecutive.medianMilliseconds = samples[Math.floor(samples.length / 2)];
    console.log(`${locale}/${version}: consecutive median ${comparison[version].consecutive.medianMilliseconds} ms`);
  }
  if (hash(await readFile(resolve(root, current))) !== record.afterSha256) throw new Error("Concurrent painter edit.");
  results.push(comparison);
}
await writeFile(resolve(root, "docs/reviews/earth-belt-animation-performance.json"),
  JSON.stringify({ version: 1, method: "actual filter arithmetic; inert Canvas vectors/images; not browser FPS",
    width: 1520, height: 1105, results }, null, 2) + "\n");
