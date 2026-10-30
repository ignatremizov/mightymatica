import test from "node:test";
import assert from "node:assert/strict";
import { createWordmarkLayout, wordmarkGlyphFrame } from "../src/shared/WordmarkTimeline.ts";

test("the space in THINKING ACADEMY reserves width and an entry-delay slot without drawing a glyph", () => {
  const layout = createWordmarkLayout("thinking-academy");
  assert.equal(layout.glyphs.length, 15);
  assert.equal(layout.glyphs[7].character, "G");
  assert.equal(layout.glyphs[8].character, "A");
  assert.equal(layout.glyphs[8].start - layout.glyphs[7].start, 20);
  const ordinaryGap = (layout.glyphs[0].x - layout.glyphs[1].x) * -1;
  assert.ok(layout.glyphs[8].x - layout.glyphs[7].x > ordinaryGap);
});

test("letters enter independently and wait for the last letter before the shared hold and exit", () => {
  for (const kind of ["mightymatica", "thinking-academy"]) {
    const layout = createWordmarkLayout(kind);
    const first = layout.glyphs[0];
    const last = layout.glyphs.at(-1);
    assert.equal(wordmarkGlyphFrame(layout, last, last.start - 1), -1);
    assert.equal(wordmarkGlyphFrame(layout, last, last.start), 0);
    assert.equal(wordmarkGlyphFrame(layout, first, last.start), 24);
    assert.equal(layout.exit - (last.start + 24), 42);
    assert.equal(wordmarkGlyphFrame(layout, last, layout.exit - 1), 24);
    assert.equal(wordmarkGlyphFrame(layout, first, layout.exit), 99);
    assert.equal(wordmarkGlyphFrame(layout, last, layout.exit), 99);
    assert.equal(wordmarkGlyphFrame(layout, first, layout.exit + 2), -1);
    assert.equal(wordmarkGlyphFrame(layout, first, layout.cycle), 0);
    assert.equal(wordmarkGlyphFrame(layout, last, layout.cycle), -1);
  }
});
