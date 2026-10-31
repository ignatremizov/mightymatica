# Collection-wide rendering review — 2026-10-31

All 143 activities across the 20 module families were reviewed in separate
shards. Books, films and event-driven SVG/CSS tools were inspected without
inventing Canvas optimizations for them. Generated drawing modules were checked
against their recovered source bounds and actual placed filter effects.

## Applied fixes

- Crop and cache verified static text, solid vector compositions and closed
  embedded-bitmap fills instead of filtering full-stage buffers every frame.
- Fuse narrowly verified nested text effects in their original order, at
  authored density. Preserve the original shadows, glows and color transforms.
- Remove only proven transparent empty-text effect layers, retaining original
  leaf evaluation.
- Keep caches bounded and release them with their renderer. Preserve the
  existing source questions, answer gates, branches, audio cues and transport.
- Avoid redrawing Falling Figure's hidden board during its completion sequence;
  reuse the Möbius explorer's unchanged strip geometry.

The source-density policy is explicit: filtered raster effects do not scale
their CPU pixel workload by device-pixel ratio squared. Ordinary vectors retain
display-resolution rendering. This is not a claim of universal pixel equivalence
to Flash or to the earlier mixed-density nested-filter path.

Each family records original source hashes, exact bounds, backups and recovery
commands in its module documentation. Static and nested passes are sequential;
their intermediate output hashes are historical patch snapshots, not a single
manifest of the final combined artifact.

## Measurements and limits

[The serialized diagnostic](native-performance.md) and its
[complete records](native-performance.json) cover 26 source-derived samples
across 16 families. They execute actual generated drawing/filter JavaScript,
with real bounded pixel arrays and inert vector/image I/O. They do not measure
browser frame rates, rasterization, image decoding or audio synchronization.

The reported Pythagoras title/question samples dropped from roughly 700 ms to
0.5 ms per warm diagnostic redraw, with no repeated full-stage pixel reads.
Sphere, Area, Circle, the quadratic formula and several other affected text
sequences likewise avoid the repeated full-stage work in their sampled frames.
Cold compilation, new cache entries and garbage collection can still hitch.

The subsequent [Earth-and-belt animation diagnostic](earth-belt-animation-performance.json)
supersedes that activity's residual below: the 49-pose cat now has a clock-aware
bounded shadow crop. Twelve consecutive frames improved from median 233 to 5 ms
(EN) and 231 to 4.5 ms (RU) in the same CPU-only fixture, with no repeated
full-stage reads. Its original artwork functions and animation arguments remain
unchanged. See [the implementation and limits](../modules/motion.md).

Historical residuals and remaining limits:

- The historical 26-sample report measured Earth-and-belt at about 260 ms before
  the subsequent animated-shadow fix; it is retained as the earlier snapshot,
  not a measurement of the current painter.
- The historical Tram sample measured about 73 ms at 550 × 400 after the static
  pass. Its subsequent [animated-shadow fix](../modules/reasoning.md) removes
  those remaining full-stage effects. Twelve fresh-clock frames at 1520 × 1105
  now measure about 5 ms median versus 493/471 ms before that fix, in the same
  CPU-only diagnostic. First uncached draws can still hitch.
- Other non-static, morph, blend, bevel and unverified composite paths remain
  source-drawn where the reviewed cache cannot prove a safe replacement.

Other unverified effects need their own bounded optimization, not removal of
authored artwork or an unsafe static cache. The focused Earth/Tram reports
supersede their older rows without rewriting the historical collection snapshot.

## Cube sections and integration

The cube activity now opens its original five-phase sequence: four bounded
24 Hz native demonstrations with working NEXT artwork, followed by the original
9–1248 vector/morph timeline and Play/Pause. The mathematical explorer is a
completion-gated follow-up. The separate FLV movie is not used as a substitute.
See [sequence recovery](cube-sections-native-sequence.md).

Initial collection-wide verification (before the Earth-and-belt follow-up):

- TypeScript and production build/loading gates passed.
- Unit checks: 246 passed, one opt-in diagnostic skipped, zero failures.
- Both new cube drawing modules executed all 1,248 frames through a tiny inert
  Canvas boundary.
- The build contains 143 activities, 188 reviewed drawing modules and one pinned
  adapter; no Flash runtime or preserved SWF is shipped.
- Local preview delivery was byte-checked at localhost and Tailscale. No browser
  automation, listening certification, commit, push or publication was performed.

Manual checks: hard-refresh the preview; play through Pythagoras's quiz title and
first question; use NEXT through all four cube demonstrations, then Play/Pause
the final sequence; check both languages, reduced motion and background audio.
Before a future release, refresh the corresponding-source package for the
changed generated modules.
