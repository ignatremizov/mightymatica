#!/usr/bin/env node
// Read preserved SWF data only; no drawing, ActionScript or archive writes.
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { spawnSync } from "node:child_process";

const root = resolve(import.meta.dirname, "../../..");
const recovery = "/home/ignat/code/mightymatica-source-recovery/objects/Movies";
const reasoning = JSON.parse(await readFile(new URL("./native-timelines.json", import.meta.url), "utf8"));
for (const [family, entries] of Object.entries({
  reasoning,
  dissections: { bills: {
    en: { source: "Movies/Bills-transform.swf" },
    ru: { source: "Movies/Bills-transform-ru.swf" },
  } },
})) {
  for (const [key, locales] of Object.entries(entries)) {
    const args = ["scripts/recover-calculus-text-bounds.mjs"];
    for (const locale of ["en", "ru"]) {
      const name = locales[locale].source.slice("Movies/".length, -".swf".length);
      args.push(`--${locale}`, resolve(recovery, name, "original", `${name}.swf`));
    }
    args.push("--output", resolve(root, `src/modules/${family}/text-bounds-${key}.json`));
    const child = spawnSync(process.execPath, args, { cwd: root, stdio: "inherit", timeout: 120000 });
    if (child.status !== 0) throw new Error(`Static text recovery failed: ${family}/${key}`);
    const bounds = JSON.parse(await readFile(args.at(-1), "utf8"));
    for (const locale of ["en", "ru"]) {
      if (bounds.languages[locale].source !== locales[locale].source
        || (locales[locale].sha256 && bounds.languages[locale].sourceSha256 !== locales[locale].sha256)) {
        throw new Error(`Preserved source mapping changed: ${family}/${key}/${locale}`);
      }
    }
  }
}
