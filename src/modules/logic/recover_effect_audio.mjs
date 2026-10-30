/** Exact-byte copies of reviewed original named effects and short board events. */
import { copyFile, mkdir } from "node:fs/promises";
const target = "public/media/logic/native/effects";
await mkdir(target, { recursive: true });
for (const file of ["Howmany.mp3", "Shortbang.mp3", "AngryMob.mp3", "Mystery.mp3", "Kidsmelody.mp3", "salut.MP3"]) {
  await copyFile(`/home/ignat/code/mightymatica-archive-2026-08-09/raw-site/Movies/${file}`, `${target}/${file}`);
}
for (const [family, ids] of [
  ["Completechain", [18, 80]],
  ["Necklace", [75, 79, 80, 87]],
  ["Rippednecklace", [56, 62, 63]],
  ["Stones", [78, 79, 185]],
]) {
  for (const id of ids) await copyFile(
    `/home/ignat/code/mightymatica-source-recovery/objects/Movies/${family}/resources/sounds/${id}.mp3`,
    `${target}/${family}-${id}.mp3`);
}
