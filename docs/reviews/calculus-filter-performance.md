# Calculus drawing performance

The calculus introduction ran CPU glow/shadow filters on full output-sized
canvases every frame. The original source is 550 × 400 at 24 fps. A high-density
1520 × 1105 backing store multiplied this particular pixel work by about 7.6.
This was rendering cost, not an authored slow-motion sequence.

## Scoped optimization

`src/shared/CachedTextFilters.mjs` provides a renderer-owned crop/cache. The
offline `scripts/optimize-calculus-filters.mjs` embeds it into the six reviewed
English/Russian calculus chapter modules, replacing only mechanically recognized
static-text outer-effect blocks.

- Rectangles come from the original binary DefineText/DefineText2 records;
  `scripts/recover-calculus-text-bounds.mjs` reproduces them. Dynamic EditText,
  animated sprites, inner effects, knockouts and unrecognized blocks remain on
  their existing drawing paths.
- Effects process a padded ink rectangle instead of the whole stage. Padding
  includes every sequential box-blur pass, fractional shadow shift and an
  antialias margin. Crops respect true stage edges.
- The original box-blur, strength, color, alpha gating, fractional shadow
  translation and sequential destination-over composition remain unchanged.
  Native Gaussian shadows are not substituted.
- Filtered bitmaps are bounded to the original stage density. Other vector
  content retains the sharper display-density backing store. This is an
  intentional filtered-text resolution tradeoff, not a pixel-equivalence claim
  against the previous high-density output.
- Cache keys include static text identity, local placement and fractional phase,
  scale, color transform, crop dimensions and effect order/parameters. Integer
  movement can reuse a layer; fractional movement, scaling, recoloring or edge
  clipping cannot silently reuse different ink.
- The cache has at most 24 entries and 2,097,152 retained pixels per renderer.
  Eviction and timeline disposal release the cached canvas backing stores.
- The helper uses the native `getTransform()` matrix. The old exporter does not
  track native scale/rotate calls in its `_matrix`, which otherwise misplaces
  cropped text on a high-density root canvas.

All six module exports and complete metadata remain unchanged. Source frame
counts, audio, transport, question branches and playback rate were not edited.
Pre-change modules are retained at `.cache/calculus-filter-originals/`.

After recreating/minifying the calculus drawing modules, run:

```sh
node scripts/recover-calculus-text-bounds.mjs
node scripts/optimize-calculus-filters.mjs --apply
```

The optimizer is idempotent and can refresh its embedded helper without
re-exporting artwork. Unknown ownership, filter schemas or static-text candidates
are not guessed.

## Checks and limits

Five focused tests cover whole-pixel reuse, fractional/color/scale invalidation,
halo padding, stage-edge clipping, actual high-DPI transforms, memory/entry
eviction, disposal and rejection of unsupported rewrite candidates.

The read-only diagnostic uses the actual generated functions and real bounded
pixel arrays with inert Canvas/image I/O:

```sh
nice -n 10 node scripts/profile-calculus-filters.mjs --baseline
nice -n 10 node scripts/profile-calculus-filters.mjs --smoke-all
```

Near the reported introduction (source frames 368–375), the 1520 × 1105 trace
previously requested 33,592,000 read pixels every frame. The optimized first draw
requested 902,740; subsequent cache hits requested none. In that run, warmed
CPU time ranged from 0.07 to 8.55 ms instead of roughly 884–1014 ms. Initial
function compilation/cache construction still has a cost.

These are not browser FPS measurements: vector rasterization, image decoding,
GPU readback and visual pixel parity are not established by an inert boundary.
No browser automation was used. Manual acceptance must check uncropped text and
halos, moving captions, introduction smoothness, both languages, later teaching
parts, answer gates, audio synchronization, resizing and high-density displays.

Final integration passed TypeScript and all 192 tests, both production builds,
artifact/loading/transfer checks and combined preview composition. An execution-only
smoke check traversed all 22,856 exported calculus frames across the six chapters
without exceptions, using tiny inert canvases to bound pixel work. All six modules
passed `node --check`; an optimizer rerun changed none. Those execution checks do
not certify browser rendering or the agreement of glyph pixels with source bounds.
