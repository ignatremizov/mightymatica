/** Native transcription of the two recovered canvas/texteffect timelines.
 * Frame numbers here are zero-based; source frame 25 is index 24.
 */
export type WordmarkKind = "mightymatica" | "thinking-academy";
export const WORDMARK_FPS = 12;
const ratios: Readonly<Record<string, number>> = {
  " ": .29, A: .77, C: .77, D: .77, E: .71, G: .82, H: .77,
  I: .29, K: .77, M: .88, N: .77, T: .65, Y: .71,
};
export interface WordmarkGlyph {
  character: string;
  x: number;
  start: number;
}
export interface WordmarkLayout {
  size: number;
  glyphs: readonly WordmarkGlyph[];
  exit: number;
  cycle: number;
}
export function createWordmarkLayout(kind: WordmarkKind): WordmarkLayout {
  const text = kind === "mightymatica" ? "MIGHTYMATICA" : "THINKING ACADEMY";
  const size = kind === "mightymatica" ? 45 : 35;
  // DefineEditText 6 bounds are -2..13.35: Flash includes its four-pixel
  // gutter in _width (XFL exports only 11.35). Include Symbol 7's matrix,
  // then the canvas frame-1 scale. Spaces consume width and a delay slot.
  const width = 15.35 * 1.003814697265625 * size / 10 * .65;
  let left = (400 - [...text].reduce((sum, char) => sum + ratios[char]! * width, 0)) / 2;
  const glyphs: WordmarkGlyph[] = [];
  [...text].forEach((character, index) => {
    const advance = ratios[character]! * width;
    if (character !== " ") glyphs.push({ character, x: left + advance / 2, start: index * 10 });
    left += advance;
  });
  const completed = glyphs[glyphs.length - 1]!.start + 24;
  // Canvas 6/7 polls every other frame; 8/9 post-decrements 20 through zero.
  // Then 10/11 waits for source frame 101; 12,4,5 prepare the next paragraph.
  const exit = completed + 42;
  return { size, glyphs, exit, cycle: exit + 6 };
}
export function wordmarkGlyphFrame(layout: WordmarkLayout, glyph: WordmarkGlyph, movieFrame: number): number {
  const frame = Math.max(0, Math.floor(movieFrame)) % layout.cycle;
  if (frame >= layout.exit) return frame < layout.exit + 2 ? 99 + frame - layout.exit : -1;
  if (frame < glyph.start) return -1;
  return Math.min(24, frame - glyph.start);
}

// Verbatim per-frame transforms from Symbol 11. Both source objects agree.
export const splitY = [-21.3, -18.95, -16.55, -14.2, -11.85, -9.45, -7.1, -4.75, -2.35, 0] as const;
export const upperMaskY = [-27.4, -25, -22.65, -20.25, -17.9, -15.5, -13.15, -10.75, -8.4, -6] as const;
export const upperMaskScale = [1, 1.000457763671875, 1.0009002685546875, 1.0013580322265625, 1.0018157958984375, 1.00225830078125, 1.002716064453125, 1.003173828125, 1.0036163330078125, 1.0040740966796875] as const;
export const lowerMaskY = [29.45, 27.1, 24.75, 22.4, 20.05, 17.65, 15.3, 12.95, 10.6, 8.25] as const;
export const echoOneScale = [1, 1.1630401611328125, 1.3260955810546875, 1.4891204833984375, 1.65216064453125, 1.8152008056640625, 1.978240966796875, 2.141265869140625, 2.3043212890625, 2.4673614501953125] as const;
export const echoOneAlpha = [1, .890625, .77734375, .66796875, .5546875, .4453125, .33203125, .22265625, .109375, 0] as const;
export const echoTwoScale = [1, 1.1461944580078125, 1.2923736572265625, 1.4385528564453125, 1.5847320556640625, 1.730926513671875, 1.8771209716796875, 2.0233001708984375, 2.1694793701171875, 2.3156585693359375, 2.46185302734375] as const;
export const echoTwoAlpha = [1, .8984375, .80078125, .69921875, .6015625, .5, .3984375, .30078125, .19921875, .1015625, 0] as const;
