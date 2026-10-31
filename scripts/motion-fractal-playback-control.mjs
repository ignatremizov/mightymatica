import { readFile, writeFile, mkdir, rename } from "node:fs/promises";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { createHash } from "node:crypto";
import { isDeepStrictEqual } from "node:util";
import { spawnSync } from "node:child_process";
import { patchReviewedPlaybackControl } from "./reviewed-playback-control.mjs";

const sprites = {
  motion: { caterpillar: { en: "sprite43", ru: "sprite43" }, cyclists: { en: "sprite63", ru: "sprite63", zh: "sprite63" } },
  fractals: { buffon: { en: "sprite44", ru: "sprite41" } },
};

/** Only source pp_16 / pp_25 / pp_10 / pp_9; never other animated sprites. */
export function patchMotionFractalPlaybackControl(source, family, id, locale) {
  const sprite = Object.hasOwn(sprites, family) && Object.hasOwn(sprites[family], id)
    && Object.hasOwn(sprites[family][id], locale) && sprites[family][id][locale];
  if (!sprite) throw new Error("Expected a reviewed motion/fractal lesson and language.");
  return patchReviewedPlaybackControl(source, {
    spriteNames: [sprite],
    stateName: "motionFractalPlaybackPlaying",
    marker: "// Motion/fractal playback control v1: reviewed source pp follows native transport.\n",
  });
}

async function apply(family) {
  if (!Object.hasOwn(sprites, family)) throw new Error("Expected motion or fractals.");
  const root = resolve(import.meta.dirname, "..");
  const lessons = JSON.parse(await readFile(resolve(root, `src/modules/${family}/native-lessons.json`), "utf8"));
  const controls = JSON.parse(await readFile(resolve(root, `src/modules/${family}/source-controls.json`), "utf8"));
  const cache = resolve(root, ".cache/motion-fractal-playback-originals");
  await mkdir(cache, { recursive: true });
  const sha = source => createHash("sha256").update(source).digest("hex");
  let changed = 0, reviewed = 0;
  for (const [id, variants] of Object.entries(sprites[family])) for (const [locale, sprite] of Object.entries(variants)) {
    const entry = lessons[id][locale], evidence = controls[id][locale];
    if (evidence.source !== entry.source || evidence.sourceSha256 !== entry.sourceSha256
      || evidence.evidence.transport !== `Symbol ${sprite.slice(6)}`) throw new Error("Unverified transport evidence.");
    for (const chapter of entry.lesson.chapters) {
      if (!chapter.module.startsWith(`${family}/native/${id}/${locale}/`) || chapter.module.includes("..")) {
        throw new Error("Unexpected chapter path.");
      }
      const target = resolve(root, "public/media", chapter.module);
      const original = await readFile(target, "utf8");
      const patched = patchMotionFractalPlaybackControl(original, family, id, locale);
      reviewed++;
      if (patched === original) continue;
      const backup = resolve(cache, `${sha(original)}.mjs`);
      try { await writeFile(backup, original, { flag: "wx" }); }
      catch (error) { if (error.code !== "EEXIST" || sha(await readFile(backup)) !== sha(original)) throw error; }
      const candidate = resolve(cache, `${sha(patched)}.candidate.mjs`);
      await writeFile(candidate, patched);
      if (spawnSync(process.execPath, ["--check", candidate], { stdio: "inherit" }).status !== 0) {
        throw new Error("Invalid transport painter.");
      }
      const before = await import(pathToFileURL(backup));
      const after = await import(pathToFileURL(candidate));
      if (!isDeepStrictEqual(before.metadata, after.metadata)
        || !isDeepStrictEqual(Object.keys(before).sort(), Object.keys(after).sort())) throw new Error("Painter contract changed.");
      if (patchMotionFractalPlaybackControl(patched, family, id, locale) !== patched) throw new Error("Non-idempotent transport patch.");
      if (sha(await readFile(target)) !== sha(original)) throw new Error("Concurrent painter edit.");
      await rename(candidate, target);
      changed++;
      console.log(`Patched ${chapter.module}: ${sprite} only`);
    }
  }
  console.log(`${family}: reviewed ${reviewed} painters; patched ${changed}.`);
}

if (process.argv[1] && pathToFileURL(resolve(process.argv[1])).href === import.meta.url) {
  if (process.argv[2] !== "--apply") throw new Error("Usage: node scripts/motion-fractal-playback-control.mjs --apply motion|fractals");
  await apply(process.argv[3]);
}
