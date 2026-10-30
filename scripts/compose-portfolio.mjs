import { access, cp, readFile, realpath } from "node:fs/promises";
import { basename, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const argument = process.argv[2];
if (!argument || process.argv.length !== 3) {
  console.error("Usage: npm run compose:portfolio -- /absolute/path/to/website/dist");
  process.exit(1);
}
const source = await realpath(fileURLToPath(new URL("../dist/", import.meta.url)));
const target = await realpath(resolve(argument));
if (basename(target) !== "dist" || target === source) {
  throw new Error("Choose the portfolio's existing generated dist directory, not a source directory.");
}
await access(resolve(target, "index.html"));
const html = await readFile(resolve(source, "index.html"), "utf8");
if (!html.includes("/mightymatica/assets/")) throw new Error("Build MightyMatica with its /mightymatica/ base before composing.");
const destination = resolve(target, "mightymatica");
let exists = false;
try { await access(destination); exists = true; } catch { /* A fresh portfolio build is expected. */ }
if (exists) throw new Error("dist/mightymatica already exists. Rebuild the portfolio to get a fresh artifact; no files were overwritten.");
await cp(source, destination, { recursive: true, force: false, errorOnExist: true });
console.log(`Prepared combined static artifact at ${destination}. Nothing was published.`);
