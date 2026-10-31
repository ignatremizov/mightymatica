import { readFile, writeFile, mkdir, rename } from "node:fs/promises";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { createHash } from "node:crypto";
import { spawnSync } from "node:child_process";
import assert from "node:assert/strict";
import { patchReviewedPlaybackControl } from "./reviewed-playback-control.mjs";

// Only source-reviewed pp classes. Do not freeze other animated two-frame art.
const transports = {
  "wisemen-en": [29], "wisemen-ru": [28], "wisemen-eight-en": [43], "wisemen-eight-ru": [45],
  "paradox:en": [75], "paradox:ru": [75, 274],
  "grandma:en": [51], "grandma:ru": [51], "hunter:en": [44], "hunter:ru": [44],
  "snail:en": [43], "snail:ru": [43], "staruhi:en": [59], "staruhi:ru": [59],
  "wine:en": [23], "wine:ru": [23], "bacteria:en": [20], "bacteria:ru": [20],
  "hand:en": [17], "hand:ru": [17],
};
export function patchReasoningLogicPlaybackControl(source, variant) {
  if (!Object.hasOwn(transports, variant)) throw new Error("Unknown reviewed lesson transport.");
  return patchReviewedPlaybackControl(source, {
    spriteNames: transports[variant].map(id => `sprite${id}`),
    stateName: "sourceLessonPlaybackPlaying",
    marker: "// Reasoning/logic playback v1: reviewed source pp follows native transport.\n",
  });
}

async function main() {
  const mode = process.argv[2], family = process.argv[3];
  if (!["--apply", "--check"].includes(mode) || !["logic", "reasoning"].includes(family)) {
    throw new Error("Use --apply|--check logic|reasoning.");
  }
  const root = resolve(import.meta.dirname, "..");
  const controls = JSON.parse(await readFile(resolve(root, `src/modules/${family}/source-controls.json`), "utf8"));
  const timelines = family === "reasoning"
    ? JSON.parse(await readFile(resolve(root, "src/modules/reasoning/native-timelines.json"), "utf8"))
    : JSON.parse(await readFile(resolve(root, "src/modules/logic/wisemen-lessons.json"), "utf8"));
  const hash = value => createHash("sha256").update(value).digest("hex");
  const backupDir = resolve(root, ".cache/source-controls-originals");
  const changes = [];
  for (const [key, data] of Object.entries(controls)) {
    if (!data.transportSymbols.length) continue;
    assert.deepEqual(data.transportSymbols, transports[key]?.map(id => `sprite${id}`));
    const sourceName = data.source.slice("Movies/".length);
    const original = await readFile(`/home/ignat/code/mightymatica-source-recovery/objects/Movies/${sourceName.slice(0, -4)}/original/${sourceName}`);
    assert.equal(hash(original), data.sourceSha256, `Source changed: ${key}`);
    const [title, locale] = key.split(":");
    const module = family === "logic" ? timelines[key].story.chapters[0].module : timelines[title][locale].module;
    const target = resolve(root, "public/media", module);
    assert.ok(target.startsWith(resolve(root, "public/media", family) + "/"), "Unexpected media target");
    const before = await readFile(target, "utf8"), after = patchReasoningLogicPlaybackControl(before, key);
    assert.equal(patchReasoningLogicPlaybackControl(after, key), after, "Non-idempotent source patch");
    changes.push({ key, target, before, after });
  }
  if (mode === "--apply") await mkdir(backupDir, { recursive: true });
  for (const { key, target, before, after } of changes) {
    if (before === after) continue;
    const syntax = spawnSync(process.execPath, ["--input-type=module", "--check"], {
      input: after, encoding: "utf8", maxBuffer: 1024 * 1024,
    });
    if (syntax.status !== 0) throw new Error(syntax.stderr || `Invalid painter: ${key}`);
    const prior = await import(`data:text/javascript;base64,${Buffer.from(before).toString("base64")}`);
    const next = await import(`data:text/javascript;base64,${Buffer.from(after).toString("base64")}`);
    assert.deepEqual(Object.keys(next).sort(), Object.keys(prior).sort(), "Changed module exports");
    assert.deepEqual(next.metadata, prior.metadata, "Changed frame metadata");
    if (mode === "--apply") {
      const backup = resolve(backupDir, `${hash(before)}.mjs`);
      try { await writeFile(backup, before, { flag: "wx" }); }
      catch (error) { if (error.code !== "EEXIST") throw error; }
      assert.equal(hash(await readFile(backup)), hash(before), "Backup mismatch");
      const candidate = `${target}.control-update`;
      await writeFile(candidate, after);
      assert.equal(hash(await readFile(target)), hash(before), "Concurrent native painter edit");
      await rename(candidate, target);
    }
  }
  const count = changes.filter(change => change.before !== change.after).length;
  if (mode === "--check" && count) throw new Error(`${count} source transports still need patching.`);
  console.log(`${family}: ${changes.length} reviewed painters; ${count} ${mode === "--apply" ? "patched" : "pending"}.`);
}

if (process.argv[1] && pathToFileURL(resolve(process.argv[1])).href === import.meta.url) {
  main().catch(error => { console.error(error); process.exitCode = 1; });
}
