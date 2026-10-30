# Original animated wordmarks

`OriginalWordmark` draws the two original script-generated titles with native
Canvas text, rectangle clipping and explicit source-frame transforms. Its API is
`kind: "mightymatica" | "thinking-academy"`, `reducedMotion: boolean`, and an
optional `className`. Keep a semantic title outside this decorative canvas.

## Source evidence

Read-only reference root:
`/home/ignat/code/mightymatica-source-recovery/objects/Images/`.
Both `Mightymaticatext` and `Thinkingacademytext` were examined:

- `actionscript/scripts/frame_1/DoAction.as`: original text, proportional width
  table, 45/35 size, bold dark-blue Arial, 400 × 200 viewport, infinite looping.
- `DefineSprite_1_canvas/frame_{1,5,6,7,8,9,10,11,12,13}/DoAction.as`:
  proportional glyph placement, space handling, entry scheduling, hold and exit.
- `DefineSprite_11_texteffect/frame_{1,25,101}/DoAction.as` and
  `DefineSprite_7_letter/frame_1/DoAction.as`: counters, stop frames and formatting.
- `project/<name>.xfl/<name>/DOMDocument.xml`: 12 fps.
- `project/<name>.xfl/<name>/LIBRARY/Symbol {7,8,9,10,11}.xml`: dynamic field
  bounds/matrix, rectangle masks, every entrance transform and both expansion
  echo scale/alpha sequences. The two Symbol 11 timelines are identical.
- `original/Mightymaticatext.swf`, read as binary tag data only:
  DefineEditText 6 has x bounds -2..13.35, so the Flash `_width` is 15.35,
  including the four-pixel gutter omitted by XFL's 11.35 width.
- Separate backeffect Symbols 18 (MightyMatica) and 15 (Thinking Academy) were
  inspected to distinguish their responsibility from the glyph animation.

The entry is **not a generic fade**: upper/lower clipped letters converge
vertically over ten frames, then two enlarged translucent copies expand around
the solid letter. The letter timeline stops at frame 25. EnterDelay 5 is counted
by the canvas's two-frame loop, so letters begin ten movie frames apart. A space
reserves both width and a delay slot. LetterDelay 20 likewise uses a two-frame
post-decrement loop. All letters then jump to frame 100; this source contains no
exit tween, so they stay solid until frame 101 reports completion and the canvas
removes them.

## Fidelity boundaries and acceptance

Placement uses the source's measured width ratios and dynamic-field matrix.
Native Arial rendering replaces Flash's dynamic-text renderer: the original
font is not embedded, so glyph rasterization and its text-field inset/baseline
are not pixel-identical. The native baseline is an approximation. The schedule
uses explicit next-tick destination-frame handling; AVM1 parent/child event
ordering can differ by one frame at completion/loop boundaries. The original
initial loader frames are omitted.

This component restores the glyph animation, not the independent randomized
starfield or equalizer backeffects, nor an original background bitmap. It has no
sound, external runtime, dynamic code evaluation or source JavaScript playback.
Counts are fixed at 11/15 glyphs and updates occur only when the 12 fps movie
frame changes. Hidden-document and offscreen time is paused, not replayed.
Reduced motion displays the settled title with no running animation.

Focused tests cover delayed spaces, independent glyph starts, shared completion,
hold, simultaneous exit and clean loop restart. No browser automation was run.
Main owns integrated type-check/build validation. Manual acceptance should check
both mastheads at narrow/wide widths, clipped split entry and expanding echoes,
simultaneous removal/re-entry, visibility suspension, and static reduced motion.
