/**
 * Assemble only the four reviewed arithmetic/hourglass lessons.
 * Run after recover-lesson-audio.mjs and audited Canvas conversion.
 * Archives remain read-only; this writes only this family's metadata.
 */
import { readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { resolve } from "node:path";
import { inflateSync } from "node:zlib";

const directory = fileURLToPath(new URL(".", import.meta.url));
const root = resolve(directory, "../../..");

async function hintSound(source, expectedButton, expectedSound) {
  const bytes = await readFile(source);
  const body = bytes.toString("ascii", 0, 3) === "CWS" ? inflateSync(bytes.subarray(8)) : bytes.subarray(8);
  let offset = Math.ceil((5 + 4 * (body[0] >> 3)) / 8) + 4;
  let found = false;
  while (offset < body.length) {
    const header = body.readUInt16LE(offset);
    offset += 2;
    let length = header & 63;
    if (length === 63) { length = body.readUInt32LE(offset); offset += 4; }
    if (offset + length > body.length) throw new Error("Truncated source tag.");
    if (header >> 6 === 17) {
      // Exact reviewed DefineButtonSound: only the pressed transition has
      // a sound, with an empty event SOUNDINFO. Fail on any changed semantics.
      const expected = Buffer.from([expectedButton, 0, 0, 0, 0, 0, expectedSound, 0, 0, 0, 0]);
      if (!body.subarray(offset, offset + length).equals(expected) || found) throw new Error("Unexpected hint sound.");
      found = true;
    }
    offset += length;
  }
  if (!found) throw new Error("Missing original hint sound.");
  return { frame: 766, soundId: expectedSound, inPoint44: 0, outPoint44: null, loops: 1, sync: "event", envelope: [] };
}

const lessons = {};
for (const kind of ["subtraction", "hourglasses"]) {
  lessons[kind] = {};
  for (const locale of ["en", "ru"]) {
    const audio = JSON.parse(await readFile(resolve(directory, `${kind}-${locale}-audio.json`), "utf8"));
    if (audio.inventoryOnly || audio.fps !== 24 || audio.linkageCues.length
      || audio.streams.some(stream => stream.tagType === 19)
      || audio.nestedTimelines.some(timeline => timeline.audioCues.length || timeline.linkageCues.length
        || timeline.streams.some(stream => stream.tagType === 19))) throw new Error("Unexpected source audio mechanism.");
    const name = kind === "subtraction" ? "Mistic substr" : "Twohourglasses";
    const source = `${name}${locale === "ru" ? "-ru" : ""}`;
    const sourceFile = `/home/ignat/code/mightymatica-source-recovery/objects/Movies/${source}/original/${source}.swf`;
    // Source stops at 895 while twenty 500 ms timer events update its fields.
    // Hold that exact artwork for ten seconds, then enter the adjacent final
    // drawing only to finish this finite native presentation (no AS playback).
    const endFrame = kind === "subtraction" ? 896 : 1530;
    const chapters = kind === "subtraction"
      ? [{ id: "lesson", startFrame: 1, endFrame, module: `magic/native/${kind}/${locale}/lesson.mjs` }]
      : [
        { id: "question", startFrame: 1, endFrame: 765, module: `magic/native/${kind}/${locale}/question.mjs` },
        { id: "hint", startFrame: 766, endFrame, module: `magic/native/${kind}/${locale}/hint.mjs` },
      ];
    for (const chapter of chapters) {
      const text = await readFile(resolve(root, "public/media", chapter.module), "utf8");
      const metadata = JSON.parse(text.match(/export const metadata = (.*);/)?.[1] ?? "null");
      if (!metadata || metadata.width !== audio.width || metadata.height !== audio.height
        || metadata.frames.length !== chapter.endFrame - chapter.startFrame + 1
        || metadata.frames.some((frame, index) => frame !== chapter.startFrame + index)) {
        throw new Error("Native chapter does not cover its declared source frames.");
      }
    }
    const audioCues = audio.audioCues.filter(cue => cue.frame <= endFrame);
    if (kind === "hourglasses") {
      if (audio.unsupported.length !== 1 || audio.unsupported[0].kind !== "button-sound") throw new Error("Unexpected hourglass audio.");
      audioCues.push(await hintSound(sourceFile, locale === "en" ? 38 : 37, locale === "en" ? 37 : 36));
      audioCues.sort((a, b) => a.frame - b.frame);
    } else if (audio.unsupported.length) throw new Error("Unsupported subtraction audio.");
    lessons[kind][locale] = {
      source: `Movies/${source}.swf`, sourceSha256: audio.sourceSha256,
      width: audio.width, height: audio.height, fps: audio.fps,
      initialFrame: 1, endFrame, chapters,
      stops: kind === "subtraction" ? [{ frame: 895, kind: "timed", delayMs: 10000 }, { frame: 896, kind: "complete" }]
        : [{ frame: 765, kind: "manual" }, { frame: 1530, kind: "complete" }],
      audioAssets: audio.audioAssets,
      audioCues,
    };
  }
}
await writeFile(resolve(directory, "native-lessons.json"), JSON.stringify(lessons, null, 2) + "\n");
console.log("Verified four source lessons: 4,852 native frames; 44 timed/interaction audio cues.");
