// Offline, finite restoration of the 21 reviewed triangle source variants.
// Run from the repository root; never imports or executes recovered drawing JS.
import { readFile, readdir, mkdir, stat, writeFile } from "node:fs/promises";
import { resolve, relative } from "node:path";
import { spawnSync } from "node:child_process";
import { patchTrianglePlaybackControl } from "../../../scripts/triangle-playback-control.mjs";

const repository = resolve(import.meta.dirname, "../../..");
const recovery = "/home/ignat/code/mightymatica-source-recovery/objects/Movies";
const titles = [
  ["false-proof", "Alltriangles", "Alltriangles-ru"],
  ["congruence", "Congruence", "Congruence-ru"],
  ["pythagoras", "Pifagor-gl", "Pifagoras Theorem - ru"],
  ["medians", "Mediana", "Mediana-ru"],
  ["altitudes", "Altitudes", "Altitudes-ru"],
  ["bisectors", "Bisector", "Bisector-ru"],
  ["cosine-law", "Coslaw", "Coslaw-ru"],
  ["sine-law", "Sinlaw", "Sinlaw-ru"],
  ["inscribed-angle", "Insangle", "Insangle-ru"],
  ["trig-addition", "Trig-cos", "Trig-cos-ru"],
  ["palm-trig", "Palmandtrig"],
];
const selection = process.argv[2];
if (selection && !titles.some(([id, ...names]) => names.some((_, i) => selection === `${id}:${i ? "ru" : "en"}`))) {
  throw new Error("Expected one reviewed title:en|ru selection, or no argument for all 21.");
}
const run = (script, args) => {
  const result = spawnSync(process.execPath, [resolve(repository, "scripts", script), ...args],
    { cwd: repository, stdio: "inherit", timeout: 300000 });
  if (result.error || result.status !== 0) throw result.error ?? new Error(`${script} failed (${result.status})`);
};
const decodeXmlText = value => value.replace(/&#(\d+);/g, (_, code) => String.fromCodePoint(Number(code)))
  .replace(/&#x([0-9a-f]+);/gi, (_, code) => String.fromCodePoint(parseInt(code, 16)))
  .replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&apos;/g, "'").replace(/&amp;/g, "&")
  .replace(/\s+/g, " ").trim();
function textAtFrame(xml, frame) {
  let offset = 0;
  for (const timeline of xml.matchAll(/<DOMTimeline\b[^>]*>([\s\S]*?)<\/DOMTimeline>/g)) {
    const entries = [...timeline[1].matchAll(/<DOMFrame\b([^>]*)>([\s\S]*?)<\/DOMFrame>/g)].map(match => ({
      index: Number(match[1].match(/\bindex="(\d+)"/)?.[1] ?? 0),
      duration: Number(match[1].match(/\bduration="(\d+)"/)?.[1] ?? 1), body: match[2],
    }));
    const length = Math.max(0, ...entries.map(entry => entry.index + entry.duration));
    if (frame > offset && frame <= offset + length) {
      const active = entries.filter(entry => entry.index <= frame - offset - 1 && frame - offset - 1 < entry.index + entry.duration);
      const texts = active.flatMap(entry => [...entry.body.matchAll(/<DOMStaticText\b[^>]*>([\s\S]*?)<\/DOMStaticText>/g)]
        .map(text => decodeXmlText([...text[1].matchAll(/<characters>([\s\S]*?)<\/characters>/g)].map(run => run[1]).join(""))));
      return [...new Set(texts.filter(Boolean))].join(" · ");
    }
    offset += length;
  }
  throw new Error(`Missing XFL question frame ${frame}.`);
}
for (const [id, ...names] of titles) {
  for (const [index, name] of names.entries()) {
    const locale = index ? "ru" : "en";
    if (selection && selection !== `${id}:${locale}`) continue;
    const source = `${recovery}/${name}/original/${name}.swf`;
    const scriptRoot = `${recovery}/${name}/actionscript/scripts`;
    const owner = (await readdir(scriptRoot)).find(entry => entry.endsWith("_fla"));
    if (!owner) throw new Error(`Missing timeline owner: ${name}`);
    const actions = await readFile(`${scriptRoot}/${owner}/MainTimeline.as`, "utf8");
    const xfl = await readFile(`${recovery}/${name}/project/${name}.xfl/${name}/DOMDocument.xml`, "utf8");
    const frames = [...actions.matchAll(/internal function frame(\d+)\(\)\s*:\s*\*\s*\{([\s\S]*?)(?=\n      (?:internal|public) function|\n   \})/g)]
      .map(match => ({ frame: Number(match[1]), body: match[2] }));
    if (!frames.length) throw new Error(`No reviewed root frames: ${name}`);
    const sourceMeta = JSON.parse(await readFile(`${recovery}/${name}/metadata.json`, "utf8"));
    const gates = frames.filter(entry => /bQuiz\d\.addEventListener/.test(entry.body)).map(entry => {
      const correct = Number(entry.body.match(/bQuiz(\d)\.addEventListener\([^,]+,\s*(?:this\.)?shootq\d+\)/)?.[1]);
      const wrong = frames.find(frame => frame.frame > entry.frame && /bWrongAns\.addEventListener/.test(frame.body))?.frame;
      if (!correct || !wrong) throw new Error(`Unresolved quiz branch in ${name}:${entry.frame}`);
      return { frame: entry.frame, correctChoice: correct, wrongEnd: wrong, correctStart: wrong + 1,
        text: textAtFrame(xfl, entry.frame) };
    });
    const hintFrame = id === "false-proof" ? frames.find(entry => /bHint\.addEventListener/.test(entry.body))?.frame : undefined;
    const endFrame = hintFrame ? hintFrame + 2 : sourceMeta.frame_count;
    if (!endFrame) throw new Error(`Unresolved ending: ${name}`);
    const stops = frames.filter(entry => /\bstop\(\)/.test(entry.body) && entry.frame <= endFrame
      && !gates.some(gate => entry.frame >= gate.frame && entry.frame <= gate.correctStart))
      .map(entry => ({ frame: entry.frame, kind: /delay\.start\(\)/.test(entry.body) ? "timed" : "manual",
        ...(/delay\.start\(\)/.test(entry.body) ? { delayMs: 4000 } : {}) }));
    const interactionFrame = ["medians", "altitudes", "bisectors"].includes(id)
      ? frames.find(entry => /mc\.addEventListener\(MouseEvent.MOUSE_DOWN/.test(entry.body))?.frame : undefined;
    if (interactionFrame) stops.push({ frame: interactionFrame, kind: "manual" });
    stops.sort((a, b) => a.frame - b.frame);
    const chapters = [];
    let startFrame = 1;
    while (startFrame <= endFrame) {
      const maxEnd = Math.min(endFrame, startFrame + 2499);
      const candidates = [...stops.map(stop => stop.frame), ...gates.map(gate => gate.frame)]
        .filter(frame => frame >= startFrame + 600 && frame <= maxEnd);
      const chapterEnd = maxEnd === endFrame ? endFrame : Math.max(startFrame + 599, ...candidates);
      const chapterId = `chapter-${chapters.length + 1}`;
      chapters.push({ id: chapterId, startFrame, endFrame: chapterEnd,
        module: `triangles/native/${id}/${locale}/${chapterId}.mjs` });
      startFrame = chapterEnd + 1;
    }
    const directory = resolve(repository, `public/media/triangles/native/${id}/${locale}`);
    await mkdir(directory, { recursive: true });
    const audioPath = resolve(directory, "audio.json");
    try { await stat(audioPath); }
    catch { run("recover-lesson-audio.mjs", ["--source", source, "--output", audioPath, "--media-dir", directory]); }
    const audio = JSON.parse(await readFile(audioPath, "utf8"));
    if (audio.unsupported.some(record => record.kind !== "button-sound")
      || audio.nestedTimelines.some(timeline => timeline.audioCues?.length)) {
      throw new Error(`Unresolved non-root audio in ${name}; inspect before proceeding.`);
    }
    for (const chapter of chapters) {
      const output = resolve(repository, "public/media", chapter.module);
      try {
        const drawing = await readFile(output, "utf8");
        const exported = JSON.parse(drawing.match(/export const metadata = (\{[^\n]+\});/)?.[1] ?? "null");
        if (exported?.frames[0] === chapter.startFrame && exported.frames.at(-1) === chapter.endFrame) continue;
      } catch (error) {
        if (error.code !== "ENOENT") throw error;
      }
      const scratch = `/tmp/mightymatica-triangles-audio/${id}-${locale}-${chapter.id}`;
      run("export-original-frames.mjs", ["--source", source, "--frames", `${chapter.startFrame}-${chapter.endFrame}`,
        "--output", scratch, "--format", "canvas"]);
      run("convert-canvas-export.mjs", [scratch, output]);
      const drawing = await readFile(output, "utf8");
      await writeFile(output, patchTrianglePlaybackControl(drawing, id, locale));
    }
    const definition = {
      source: `Movies/${name}.swf`, sourceSha256: audio.sourceSha256,
      width: audio.width, height: audio.height, fps: audio.fps,
      initialFrame: 1, endFrame, chapters, stops,
      audioAssets: audio.audioAssets,
      audioCues: audio.audioCues.filter(cue => cue.frame <= endFrame),
      gates, ...(interactionFrame ? { interactionFrame } : {}), ...(hintFrame ? { hintFrame } : {}),
    };
    // Generated metadata is local to its lazy family, never eager app metadata.
    const output = resolve(import.meta.dirname, `native-${id}-${locale}.json`);
    await writeFile(output, JSON.stringify(definition, null, 2) + "\n");
    console.log(`Recovered ${id}:${locale}: ${endFrame} frames, ${chapters.length} bounded chapters, ${gates.length} gates → ${relative(repository, output)}`);
  }
}
