# Original cube-net face artwork

Completed task: bounded original-art extraction for `Cubenetslide-1` through
`Cubenetslide-5`, six named faces per source. Main subsequently approved a bounded
CubeNG extension for unique face sprites only; no whole cubes or timelines.

## Source and export

Read-only recovery root:
`/home/ignat/code/mightymatica-source-recovery/objects/Movies/`.
Each object's `metadata.json` identifies the original `Movies/Cubenetslide-N.swf`
and its SHA-256. Exports used that object's `original/Cubenetslide-N.swf`.
The named T instances were checked against the recovered XFL `DOMDocument.xml`.

Stages 1–4 map T1…T6 to sprite IDs `[8, 2, 4, 12, 6, 10]`.
Stage 5 maps them to `[12, 3, 6, 18, 9, 15]`.

Exactly frame 1 of each of these 30 sprites was exported to PNG using
`scripts/export-original-frames.mjs --frames 1 --sprite ID --format png`.
The first export was inspected before the other 29 were started. All exports
ran sequentially through the helper's shared flock, nice 15, two active CPUs,
768 MiB Java heap, and 120-second export timeout. No ActionScript was executed.
No additional software was installed.

The existing resource SVGs describe individual shapes, not necessarily complete
face compositions: stage 5 includes nested, transformed bitmap artwork.
Sprite rendering retains these nested illustrations. PNGs are unmodified FFDec
outputs: no cropping, palette changes, rotations, or replacement illustrations.
No Flash or exporter runtime is shipped.

## Metadata and placement

`src/content/spatial-net-art.json` is keyed by source stem and then T1…T6.
Each record contains:

- `src`: `public/media`-relative `spatial/nets/.../1.png`; the shared media URL
  helper adds the application base and `media/` prefix.
- `width`, `height`: integer raster dimensions read from the PNG header.
- `spriteId`, `source`, `sourceSha256`: source identity and provenance.
- `sha256`: hash of the exact published PNG.
- `origin`: authored full-bounds top-left relative to sprite registration.
- `bounds`: authored full width and height, including fractional extents.
- `faceBounds`: the nominal square at `(-20,-20)`, size 40×40.

Bounds and origin come from the recovered matching shape SVG's dimensions and
normalizing translation, retaining the full sprite's decorative extents.
For a cell at `(left, top)` and scale `k = cellSize / 40`, place the image at
`left + (origin.x + 20) * k`, `top + (origin.y + 20) * k`; use full authored
`bounds.width * k`, `bounds.height * k`. Do not stretch every bitmap into the
nominal square. PNG dimensions can be the ceiling of fractional bounds.

Stages 1–4 are 41×41 including the square's stroke. Stage 5 has raster dimensions
T1 41×41, T2 42×41, T3 46×41, T4 43×41, T5 42×42, T6 44×41.
The arrow decoration on T3 and additional T6 extents must not be cropped.

## Verification and limits

All 30 helper invocations succeeded. All metadata references were read and
hashed; PNG dimensions were checked independently with ImageMagick `identify`.
Direct image inspection covered the first gray proof, stage 3 triangle,
stage 4 diagonal, and stage 5 star and right-facing arrow. These inspections
show complete rendered art, not a claim of browser-level spatial fidelity.

No browser, server, type-check, build, full suite, remote operation, or commit
was run. Main owns integrated checks; the spatial worker owns runtime placement.
Manual acceptance should check all six faces per stage, palette/orientation,
full decorative extents, and registration during dragging/folding.

Recovered art retains original attribution and rights restrictions; this
extraction does not grant a new license. The recovery tree was not modified.

## CubeNG extension

CubeNG records use `CubeNG-N.Symbol_ID` with the same fields and source-specific
hashes. Actual unique IDs were independently recovered from the option and
target cube children in each source's XFL and confirmed by the spatial owner.
Document traversal order is not geometric child order; runtime mapping remains
the spatial owner's responsibility.

- CubeNG-1: `[2, 4, 6, 8, 10, 12]`.
- CubeNG-2: `[2, 4, 6, 8, 9, 10]`.
- CubeNG-3: `[2, 4, 6, 7, 8, 10, 23]`.
- CubeNG-4: `[10, 12, 14, 16, 18, 20, 26, 28, 30, 32]`.
- CubeNG-5: `[11, 14, 17, 20, 23, 26, 32]`.

CubeNG-4 includes target-only variants `[26, 28, 30, 32]`, bringing
that stage to ten unique faces rather than the initially approved eight.
Main explicitly approved ten before these four additional exports.

The CubeNG-5 Symbol 11 circle was exported and directly inspected before the
remaining extension exports. Further direct inspections covered the CubeNG-3
Symbol 23 right-facing triangle and CubeNG-5 Symbol 32 green diagonal half.
The extension has 36 PNGs. All 66 combined references, PNG hashes, original SWF
hashes, and raster dimensions were validated; each raster dimension matches the ceiling of its
authored bound. Shared nested graphics were resolved through the sprite's XFL
reference rather than assuming `spriteId - 1` always identifies its shape.
CubeNG-4 Symbol 32's target-specific diagonal was also directly inspected.
The 66 PNGs total 35,938 bytes. No unrelated pre-existing failures were
encountered during these focused asset checks.
