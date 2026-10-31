# Falling Figure

## Rendering performance review (2026-10-31)

Reviewed color, size, shape and All gameplay modes plus all four completion
ranges. Gameplay remains bounded to one/five figures. Its hidden gameplay
canvas no longer redraws grass, buckets and figures during completion; the
separate visible companion keeps its existing animation clock and painter.
Scoring, automatic target acceptance, drag feedback and source audio are
unchanged.

Completion now caches 282 verified static-text filter blocks at source density,
retaining original shadow/glow parameters. Bounds and source SHA-256 come from
the preserved FallingFigure.swf in `text-bounds-falling-figure.json`; both
language entries honestly reference that single source. The family-owned kids
`optimize-painters.mjs --apply falling` checks source hashes, backs up the current
painter in `.cache/falling-filter-originals`, verifies syntax and deep-equal
metadata/export contracts, and guards against concurrent writes.
`recover_audio.mjs --convert-reviewed-falling` reapplies the patch after conversion.

Follow-up: separately reviewed `scripts/optimize-empty-text-filters.mjs` removes
282 transparent isolation/shadow/glow blocks around text95, whose generated
function is empty. The original `place(...)` calls and text leaf remain.
Exact outer/non-knockout chains are required; nonempty artwork, arbitrary calls,
dynamic expressions, inner effects, knockout and bevel are ineligible.
No authored visible text effects are removed. Recovery conversion runs this pass
after static-text optimization; guarded backups, candidate syntax/contract
checks and second-pass idempotence passed.

Candidate checks and second-pass idempotence passed; focused kids/falling rules
tests passed **15/15**; five focused empty-filter rewrite/rejection tests passed.
No browser, FPS benchmark, listening or pixel-parity
verification was performed. Main owns integrated checks. Manual follow-up:
complete each mode, inspect completion lettering/shadows and companion animation,
then restart and verify pointer/keyboard sorting and sound.

Presentation review: the published XFL declares a `#66ffff` stage and Times New
Roman Bold lettering. The native canvas now uses that exact aqua background with
square unframed edges; supplementary controls use blue outlines instead of green
rounded framing. The companion is not enclosed in a separate rounded panel.
The garden, figures, buckets, and interaction rules are unchanged. This is a
source/CSS inspection pass, without browser visual verification.

Activity ID: `falling-figure`. Published source: `Movies/FallingFigure.swf`.
Fidelity: native behavioral port with remaining presentation and input gaps, not a
pixel-identical reconstruction.

## Evidence examined

Read recovery README, MODERNIZATION, FallingFigure PROVENANCE and
MODERN_PORT_NOTES; original repository README; all fourteen
`timeline-scripts/initial-FallingFigure-Old/DOMDocument/*.as`; published
`actionscript/scripts/Figure.as`; original figure symbol XML.
The published old timeline is authoritative, not the later refactored game.

## Preserved rules

- Color: pink/blue figures of all three shapes, two targets. The preliminary
  port notes say circles, but the actual generator does not constrain shape.
- Size: any color/shape; width ≤85 versus >85 logical stage units.
- Shape: circle, triangle, square, ignoring figure color.
- All: five simultaneous figures; buckets fixed pink, green, blue; random
  shape per bucket, rerolled after **each** successful placement. Both shape
  and color must match. Unmatched figures can pass below the stage and respawn.
- Nine correct placements complete single-property modes; ten complete All.
  Wrong drops accelerate to 10 units per original 24-Hz frame; single-mode
  figures wrap and restore their individual randomized fall speed.
- Dragging suspends that figure's fall. No life or score penalty for misses.

## Current behavior and restoration gaps

Canvas redraws the falling primitives and grass, while reusing the original
Pythagoras companion atlas, butterfly/flower bitmaps and authored bucket
fronts. The companion's 70-frame silent animation follows the original
24-Hz atlas order (50 distinct frames followed by a 20-frame hold), with
source trim offsets retained. It freezes under reduced motion and pauses
with the game. Primitive
widths use 20-unit base × original integer scale range 2–6; these are not
claimed to reproduce the exact per-frame original symbol bounds.
Target checking now uses the published old timeline's per-scene registration
regions: color (112,330)/(444,330), size (113,292)/(433,201), and the three
shape/All bucket registrations from the XFL. Automatic per-frame acceptance
is restored, including a held figure entering its matching region. Bucket
fronts and labels are placed at those targets rather than a generic bottom strip.
Only one success is processed per animation callback so All can reroll its
targets safely; a synchronous score ref prevents multiple events losing progress.
Reduced motion freezes falling; semantic figure/bucket buttons provide an
equivalent nonmoving sorting path. An explicit “let pass” action permits
unmatched All figures to be replaced without waiting, including reduced motion.
The manual pause/reset controls, keyboard/touch path and Russian UI are new
accessibility/localization work, not evidence of a separate archived Russian SWF.
Sound uses the authentic `Shortbang.mp3` and `Boing.mp3` recordings.
The user's default-on feedback preference is applied; opening the game plays
nothing, and the checkbox can silence effects. Correct placement retains the source's full-volume Shortbang;
Boing retains its 0.05 gain and is limited to the source color-mode wrong-release
condition below y=400. Wrong releases in other modes do not invent a Boing effect.
The companion remains present
above the board instead of overlapping the original stage target regions.
Correct drops add a brief hop; wrong drops add a brief sideways response.
Those response translations are modern additions around the authored
idle/blink/hand animation, not recovered success/failure keyframes.
The original in-game speaking-mouth/companion placement is not recreated.
Round completion now plays the original native Canvas timeline and embedded
soundtrack, bounded to source frames 55–109 (color), 150–204 (size), 244–329
(shape), or 338–423 (All). The final fade/menu dispatch remains native game
controls rather than executing ActionScript. No asset receives a new or
blanket license.

Companion placement and the original final menu fade remain restoration targets;
their current
replacements above are not approved primary-UX changes. Keep stationary sorting,
“let pass”, keyboard access and pause controls supplementary to source-faithful
falling/dragging play, with reduced-motion alternatives still available.

## Reused original media

- `public/media/falling/pifagor.png`: untouched
  `original-sources/github/ignatremizov-Figure/snapshots/f5e6221-initial-source/assets/Pifagor/Pifagor.png`.
  Frame rectangles in `src/modules/falling/art.ts` transcribe its adjacent plist.
- `public/media/falling/buckets/*.png`: nine untouched original snapshot
  `assets/Bucket/Front/` images (three colors × three shapes).
- `flowers.png`, `butterfly.png`: untouched published SWF extracted
  `objects/Movies/FallingFigure/resources/images/35.png` and `88.png`.
- `Shortbang.mp3`, `Boing.mp3`: untouched original snapshot `assets/` files,
  verified by preservation provenance as byte-identical to the live-site audio.

Original artwork and audio retain their original rights and attribution;
no explicit software/media license was declared in the source repository.

The game is bounded to one or five figures; shared animation pauses in hidden
tabs; audio elements stop and release their sources on unmount. All activity
assets are served locally with the application, without external requests.

## Completion soundtrack recovery

Two original embedded MP3 definitions (101/102) and all eight root event cues
were extracted directly from the preserved published SWF, without transcoding.
Each completion branch retains its own source-global cue positions, trimming,
loops and stereo envelopes. A single reviewed native module includes only
the four completion ranges: **282 frames**, not a movie for every game state.
It loads only after the existing nine/ten-placement game gate is satisfied.
Continuation is authorized by starting the game; reduced motion requires
explicit Play. Completion inherits the game's sound preference and has
native pause/restart/sound controls. The earlier game sound checkbox is disabled
while completion's own sound control is authoritative.

Metadata is in `src/modules/falling/audio.json`, raw extraction evidence in
`public/media/falling/audio/falling-figure/source.json`. Extraction and Canvas
conversion are repeated through the owned kids recovery helper's
`--export-falling` / `--convert-reviewed-falling` modes. The generated
completion/audio directory is approximately 15 MiB before compression.
Track content was not listened to/transcribed in this pass; exact original
recordings are retained without inventing a narrated introduction.

## Verification

Focused Node rules tests cover the size boundary, color generator, shape versus
combined matching, nine/ten completion targets, and rejection outside authored
target regions (including the obsolete bottom strip). Final combined kids/falling
run: `node --experimental-strip-types --test tests/falling-rules.test.mjs
tests/kids-original.test.mjs tests/kids-sorting.test.mjs`: **13/13 pass**.
Integrated compilation and
build belong to Main. No browser or visual verification performed.

Manual checklist: complete each mode; wrong-drop acceleration; pause/resume;
restart and mode change; touch drag into all bucket positions; keyboard-only
sorting; natural falling into a matching target without releasing a drag;
All rerolls and unmatched replacement; reduced-motion stationary play;
sound remains silent until enabled; narrow-screen labels and canvas scaling.
