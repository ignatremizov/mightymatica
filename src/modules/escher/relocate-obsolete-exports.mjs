import { mkdir, readdir, rename } from "node:fs/promises";
import { join, resolve } from "node:path";

const root = resolve(import.meta.dirname, "../../..");
const media = join(root, "public/media/escher");
const cache = join(root, ".cache/escher-exports");
await mkdir(cache, { recursive: true });
for (const folder of ["game-timelines", "canvas-source"]) {
  await rename(join(media, folder), join(cache, folder));
}
const timelines = join(media, "timelines");
for (const source of await readdir(timelines)) {
  const destination = join(cache, "timelines", source);
  await mkdir(destination, { recursive: true });
  for (const frame of await readdir(join(timelines, source))) {
    if (frame !== "1.png") await rename(join(timelines, source, frame), join(destination, frame));
  }
}
console.log("Relocated obsolete owned derivatives; original archives were untouched.");
