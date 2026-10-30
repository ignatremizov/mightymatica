#!/usr/bin/env node
import { spawn } from "node:child_process";
import { access, mkdir, realpath, stat } from "node:fs/promises";
import { dirname, resolve, sep } from "node:path";
import { tmpdir } from "node:os";

const usage = `Usage: node scripts/export-original-frames.mjs --source file.swf --frames 1,3-5 --output folder --format svg|png|canvas [--sprite characterId]
Uses one shared flock, nice 15, 2 active CPUs, 768MB heap, and a 120s export limit.
Optional environment: FFDEC_JAVA, FFDEC_JAR. No runtime installation is performed.`;

async function main() {
  const args = process.argv.slice(2);
  if (args.includes("--help")) { console.log(usage); return; }
  const options = {};
  for (let i = 0; i < args.length; i += 2) {
    const key = args[i];
    if (!["--source", "--frames", "--output", "--format", "--sprite"].includes(key)
      || !args[i + 1] || options[key]) throw new Error(usage);
    options[key] = args[i + 1];
  }
  const frames = options["--frames"];
  if (!frames || !/^[1-9]\d*(?:-[1-9]\d*)?(?:,[1-9]\d*(?:-[1-9]\d*)?)*$/.test(frames)) {
    throw new Error("Explicit finite, positive frame numbers/ranges are required.");
  }
  let count = 0;
  for (const range of frames.split(",")) {
    const [start, end = start] = range.split("-").map(Number);
    if (!Number.isSafeInteger(end) || end < start) throw new Error("Invalid frame range.");
    count += end - start + 1;
  }
  const limit = options["--format"] === "canvas" ? 5000 : 120;
  if (count > limit) throw new Error(`At most ${limit} selected frames per invocation.`);
  const sprite = options["--sprite"];
  if (sprite && !/^[1-9]\d*$/.test(sprite)) throw new Error("Sprite must be a positive character ID.");
  const format = options["--format"];
  if (!["svg", "png", "canvas"].includes(format) || !options["--source"] || !options["--output"]) throw new Error(usage);
  const source = await realpath(resolve(options["--source"]));
  if (!(await stat(source)).isFile() || !/\.swf$/i.test(source)) throw new Error("Source must be a single SWF file.");
  const output = resolve(options["--output"]);
  let ancestor = output;
  while (true) {
    try { await access(ancestor); break; }
    catch (error) {
      if (error.code !== "ENOENT" || dirname(ancestor) === ancestor) throw error;
      ancestor = dirname(ancestor);
    }
  }
  const canonicalAncestor = await realpath(ancestor);
  for (const archive of ["/home/ignat/code/mightymatica-archive-2026-08-09", "/home/ignat/code/mightymatica-source-recovery"]) {
    if (canonicalAncestor === archive || canonicalAncestor.startsWith(archive + sep)) throw new Error("Archives are read-only.");
  }
  await mkdir(output, { recursive: true });
  const canonicalOutput = await realpath(output);
  const java = process.env.FFDEC_JAVA || "/nix/store/mxf12821brqjb2kv1p3v8b9n6d5741y0-openjdk-21.0.12+8/bin/java";
  const jar = process.env.FFDEC_JAR || "/home/ignat/code/.tools/ffdec-26.2.1/app/ffdec.jar";
  await access(java);
  await access(jar);
  const kind = sprite ? "sprite" : "frame";
  const cli = [resolve(tmpdir(), "mightymatica-ffdec-export.lock"), "nice", "-n", "15", java,
    "-XX:ActiveProcessorCount=2", "-Xmx768m", "-Djava.awt.headless=true", "-jar", jar,
    "-config", "packJavaScripts=false",
    "-onerror", "abort", "-exportTimeout", "120",
    "-select", sprite ? `${sprite}:${frames}` : frames,
    ...(sprite ? ["-selectid", sprite] : []),
    "-format", `${kind}:${format}`, "-export", kind, canonicalOutput, source];
  console.log(`Queued ${kind} ${frames} (${format}); exports are serialized.`);
  const child = spawn("flock", cli, { stdio: "inherit" });
  const forward = (signal) => child.kill(signal);
  const interrupt = () => forward("SIGINT");
  const terminate = () => forward("SIGTERM");
  process.on("SIGINT", interrupt);
  process.on("SIGTERM", terminate);
  await new Promise((resolvePromise, reject) => {
    child.once("error", reject);
    child.once("exit", (code, signal) => {
      process.exitCode = code ?? (signal ? 130 : 1);
      resolvePromise();
    });
  });
  process.off("SIGINT", interrupt);
  process.off("SIGTERM", terminate);
}
main().catch((error) => { console.error(error.message); process.exitCode = 1; });
