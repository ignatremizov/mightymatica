# Coloring restoration

## Painted plane controls (2026-10-31)

All four plane proofs in both source languages now expose the original initial
Play artwork as a transparent semantic target. Source `pp_5` is symbol 22 for
two-plane / segment / equilateral and symbol 23 for three-plane, placed only at
global frame 1. The reviewed two-frame painter follows the shared transport's
Play/Pause choice; the source artwork does not alternate with timeline parity.

The existing Hint action at frame 26 now uses the actual localized button's
Hit geometry with `sourceArtwork: true`, retaining its label for keyboard and
assistive-technology use without painting a duplicate label over the original.
The generic transport remains blocked at 26. Hint still uses the same source
button sound and jumps to 321, or 347 for the three-color proof; opening the
lesson or pressing Play does not reveal the proof. Cube and the four separate
solid-coloring adaptations are unchanged by this control pass.

`source-controls.json` records each original source hash and control placement.
Recovery uses the read-only FFDec tag-model XML where original XFL folders are
empty, including root ShowFrame/placement/removal order, DefineButton2 Hit
records, affine matrices and source shape/text bounds. Other variants use
their actual XFL, not copied cross-language geometry. Recovered AS handlers
verify both `go` / `halt` and Hint targets. Reproduce metadata with
`node scripts/algebra-coloring-magic-playback-control.mjs --recover-controls`;
after raw painter regeneration, use its `--apply` mode. Painter rewrites preserve
existing optimizations and have hash-addressed backups, syntax validation,
metadata/export comparison, idempotence and concurrent-edit checks.

Focused checks cover source transport selection, the absence of a source
transport route through frame 26, retained source button/audio assets and the
existing cube answer/timer gates. No browser, server or listening verification
was run; Main owns integrated compiler/build checks. Manual acceptance: all
eight localized plane lessons' initial painted Play, their painted Hint after
the question, pause/restart, no early proof via the generic toolbar, narrow
layout, keyboard focus and unchanged source artwork/shadows.

## Static-text rendering cost review (2026-10-31)

Reviewed all nine activities. Cube and the four plane proofs use ten generated
native painters (English/Russian); the other four solids use bounded SVG geometry
in `SolidActivity.tsx` and `SourceSoundtrack.tsx`. No interaction, answer gate,
narration timing, degree readout, face color or sound preference changed.

`src/modules/coloring/optimize-painters.mjs --recover-bounds` recovers static
DefineText bounds from the ten corresponding read-only `objects/Movies/<name>/
original/<name>.swf` binaries in the source-recovery archive. Five
`text-bounds-*.json` files record exact source names and SHA-256 hashes.
Both languages use their actual distinct source; there is no substituted variant.
The optimizer rewrites existing painters, not source exports. It backs up originals
under `.cache/coloring-filter-originals`, checks candidate syntax, deep-compares
metadata and exports, and checks the target hash before replacing it.

| Activity | Native source objects, English / Russian | Cached static-text filter groups |
| --- | --- | --- |
| coloring-cube | Cube-colorproblem / Cube-colorproblem-ru | 2253 / 2252 |
| coloring-two-plane | Twocolorplane-eng / Twocolorplane | 599 / 599 |
| coloring-segment | Twocolorplaneseg-en / Twocolorplaneseg-ru | 918 / 918 |
| coloring-equilateral | Twocoloreqtri-eng / Twocoloreqtri-ru | 1739 / 1739 |
| coloring-three-plane | Threecolorplane-eng / Threecolorplane-ru | 1663 / 1663 |
| coloring-hexagonal-prism | Recthexprizm-colorproblem / Recthexprizm-colorproblem-ru | No generated painter; unchanged SVG |
| coloring-tetrahedron | Tetra-colorproblem / Tetra-colorproblem-ru | No generated painter; unchanged SVG |
| coloring-brick | brick-colorproblem / brick-colorproblem-ru | No generated painter; unchanged SVG |
| coloring-right-prism | paralele-colorproblem / paralele-colorproblem-ru | No generated painter; unchanged SVG |

The 14,343 rewritten filter placements retain authored glow/shadow parameters,
using the shared verified-text crop and source-density cache (24 entries / 2 MP).
The handwritten `public/media/coloring/native/cube-stage.mjs` remains unchanged:
SHA-256 `2a6fb2fca45dd80bb32b15d907ce8e864a26026e944e6691b4e99fc0e7621232`.
The optimizer's temporary metadata-import candidate resolves that adapter by
absolute file URL; the delivered painter retains its existing relative import.

Remaining cost: each cube painter still has 263 direct authored bevel call sites,
including `sprite106`'s filtered `text88`. Bevel is not supported by the reviewed
static-text rewrite. Remaining cube drop-shadow paths can also include non-text
artwork. These are deliberately preserved, not removed for speed. The other eight
painters have no remaining direct `Filters.*` calls after rewriting. A future
re-export must rerun this optimizer; no external recovery pipeline was modified.

Validation: candidate syntax and metadata/export checks passed for all ten
painters; a second optimizer run made no changes. The four focused suites
`coloring`, `coloring-lessons`, `spatial-rules`, and `octahedron-projection`
passed all 19 tests. No browser automation, FPS measurement, audio listening,
full-resolution raster baseline or pixel-parity claim was made.
Manual follow-up: inspect both language versions' question and proof captions,
cube counting/quarter-turn scenes and preserved bevels; check rotation and sound.

## Interactive source-audio restoration (current primary experience)

All nine activities / eighteen original language objects contain source audio.
Exact MP3 payloads and binary global cue metadata were recovered with
`scripts/recover-lesson-audio.mjs`; eighteen JSON inventories live beside the
coloring controllers. No recording is invented or translated. The other four
solid sources contain one long soundtrack each, not evidence of a narrated
counting film. Audio content has not been listened to or transcribed in this
pass, so unknown tracks are not described as spoken narration.

`ColoringLesson.tsx` now makes the native original-art/audio lesson primary for
the cube and all four plane activities. Mathematical explorations are secondary
and unlock after the film completes. The source EN/RU vector drawings are
converted native Canvas modules under `public/media/coloring/native/`; no SWF,
emulator, original exporter HTML, packed JavaScript, or source ActionScript is
shipped there. Ten drawing modules contain 7,240 selected source frames in total.
All original MP3 bytes remain intact (81 files); native media totals about 38 MiB
and loads only when its activity/lesson is requested.

The cube starts at its stopped question frame. Its four source answers are
6, 24, 30 and 720. Only 30 enters global frame 3 and then the counting film.
Wrong answers stay on the question, show retry feedback, and do not restart its
root audio; button-down sounds 25/36 follow recovered button definitions.
Generic Play cannot bypass the question, and Restart relocks it. The second
scene begins at global frame 91. All sixteen source Timer holds are represented,
including the complete 26-second chained rotation at frame 164 and the EN/RU
differences at frames 94 and 165. Playback stops at the actual source stop 167,
not the unused 194-frame root tail.

Drawing export alone cannot reproduce the cube: ActionScript originally
assembles six flat face symbols into a cube, rotates it, and reveals labels by
changing alpha. The owned `cube-stage.mjs` placement adapter restores a coherent
depth-sorted six-face solid using source face colors, timer-driven rotation and
ordered source-label fades. It retains the converted original text artwork.
The shared transport redraws during held frames using an explicit bounded
callback, and its integer animation ticks drive the native drawing modules.
This is a native reconstruction, not a claim of exact Flash 3D camera,
easing/filter or sampled-rotation parity.

Plane lessons explicitly start with Play. At source frame 26, Hint is required:
it jumps to global 321 (347 for Threecolorplane), exactly as `bHint` does.
Generic Play remains blocked at that question/hint stop. Hint button-down sound
IDs were checked in each source `DefineButtonSoundTag` and are played separately
from the intact root cues. The original long question decoration loop is held
at the available Hint instead of repeatedly seeking to frame 2. This avoids
replaying root audio and never exposes a proof before the requested hint.
Full source proof drawings and authored root audio replace the earlier
step-text primary presentation. Button hover/out transition sounds are not
reproduced. After completion the existing accessible, mathematically corrected
SVG exploration remains available.

The other four solids retain their primary direct rotation and palette-colored
selectors. `SourceSoundtrack.tsx` provides explicit Play/Pause/Restart using the
shared audio scheduler, preserving their root cue's stereo envelope rather than
playing the MP3 at an invented full volume. No narration, quiz prerequisite,
autoplay or finite fake movie is added to these one-frame source activities.
Their existing optional checks/reasoning remain supplemental.

Shared lesson transport owns pause, sound buffering/retry, reduced-motion
explicit playback, hidden-tab suspension and disposal. The one-frame solid
soundtracks similarly freeze their presentation clock while hidden, pause
audio on visibility changes, guard stale async startup after restart/unmount,
and dispose their audio owner and listener.

Checks: `node --experimental-strip-types --test tests/coloring.test.mjs
tests/coloring-lessons.test.mjs` passes **8/8**. These cover the existing
mathematics plus the non-bypassable cube question, complete chained Timer hold,
all eighteen sources' exact MP3 payload hashes, and button-asset resolution.
`node --check public/media/coloring/native/cube-stage.mjs` passes.
The bounded serialized exporter and audited converter processed the ten
explicit source variants; no recovered ActionScript or exporter drawing code
was executed. Initial packed exports were replaced after the shared helper
disabled FFDec packing, then raw exporter HTML/runtime files were removed.
No browser, listening check, devserver, compiler, build or broad suite was run.
Main owns integration verification.

Manual acceptance: in both locales check cube wrong/correct/restart with sound
enabled before and after Play, counting-label timing and all four quarter-turns;
check each plane's initial question, Hint gate, full original proof/audio and
secondary exploration; check four solid soundtracks, pause/replay, rotation and
palette swaps. Test hidden-tab/resume, reduced motion, loading cancellation and
narrow-screen controls. Exact visual and audible parity remains unverified.

## Earlier source-first SVG UX review

Reviewed all nine IDs in the table below against the recovered English
MainTimeline ActionScript for their nine source objects, Russian MainTimeline
gate/rotation markers for all nine counterparts, and English/Russian plane
text resources. Also inspected the cube's recovered question/answer and
counting text. The read-only recovery paths are
`objects/Movies/<object>/actionscript/scripts/*/MainTimeline.as` and
`objects/Movies/<object>/resources/texts/*.txt`.

Confirmed and fixed an early-answer leak in all four plane activities:
the source initially stops and provides an optional `bHint` that jumps to the
proof (`321`, or `347` in Threecolorplane). The native entry now presents the
verified problem statement in either locale, with an explicit Hint button.
Neither construction, proof text, solution status nor point-color exploration
appears before the hint. Reset returns to that question-only state.

Within the hint, segment AB precedes extensions C/D and midpoint E;
the equilateral lesson introduces blue A/B/C, then D, then E/F, before
highlighting a monochromatic triangle. The two-color unit pair is highlighted
only at its conclusion. Existing reflected-triangle/circle/chord stages remain.
Point-color exploration remains available at the conclusion without changing
the mathematical proof or imposing a new question/answer prerequisite.

The five solids retain direct drag rotation and user-colored selectors.
Cube explanation still requires a correct answer and Reset relocks it;
the four other solids do not acquire a mandatory quiz gate. Existing checks
there remain supplementary. Source rotation and fade timers, cube's four-button
answer layout and sequential factorial/orientation animation, and exact
authored plane timeline layouts remain adaptation gaps, not claims of parity.
This pass does not recreate those animations or require new media exports.
The native plane hints are explicit static stages, so no hidden-tab animation
or teardown work is introduced; the solid pointer-capture lifecycle is unchanged.

Verification: `node --experimental-strip-types --test tests/coloring.test.mjs`
passes all five existing mathematical regression tests. No test-only
abstractions or brittle visual assertions were added. No browser automation,
devserver, integrated compiler or build was run. Main owns integration checks.
Manual acceptance must check all four question-only entry screens, Hint,
Previous/Next, conclusion-only exploration, Reset, EN/RU, and all five solids'
rotation, palette swaps and cube correct/wrong/reset gate behavior.

## Source styling follow-up

Reviewed all nine activities. The five solid-coloring XFL documents explicitly
specify aqua `#66ffff` stages; their existing recovered face palettes remain.
The four plane-coloring objects instead specify magenta `#ff00cc` in
`tag-model/<object>.swf.xml` `SetBackgroundColorTag`. Their recovered shape
resources use magenta/blue (`#ff00cc`, `#0000ff`), with green `#00ff00` in
Threecolorplane. These authored backgrounds and point colors now replace
the generic rounded navy canvas and pastel palette. Separate `.coloring-solid`
styling prevents the plane proof palette from affecting solid models.
Serif diagram labels replace system-font labels; educational point-number
redundancy is retained. Export-process captions are replaced by dimensions and
attribution. No rule, answer flow, activity ID or manifest metadata changes.
No browser, compiler or build run; direct source/diff inspection only. Manual
acceptance should inspect point contrast on magenta, all proof steps, source
face colors, rotation, keyboard focus and both locales at narrow widths.

Nine functional adaptations cover all eighteen assigned English/Russian
objects. These are not exact Flash timeline reproductions.

| ID | Original objects under Movies/ | Rotations | Distinct colorings |
| --- | --- | --- | --- |
| coloring-cube | Cube-colorproblem.swf; Cube-colorproblem-ru.swf | 24 | 30 |
| coloring-hexagonal-prism | Recthexprizm-colorproblem.swf; Recthexprizm-colorproblem-ru.swf | 12 | 3360 |
| coloring-tetrahedron | Tetra-colorproblem.swf; Tetra-colorproblem-ru.swf | 12 | 2 |
| coloring-brick | brick-colorproblem.swf; brick-colorproblem-ru.swf | 8 | 90 |
| coloring-right-prism | paralele-colorproblem.swf; paralele-colorproblem-ru.swf | 8 | 90 |
| coloring-two-plane | Twocolorplane.swf; Twocolorplane-eng.swf | — | — |
| coloring-segment | Twocolorplaneseg-en.swf; Twocolorplaneseg-ru.swf | — | — |
| coloring-equilateral | Twocoloreqtri-eng.swf; Twocoloreqtri-ru.swf | — | — |
| coloring-three-plane | Threecolorplane-eng.swf; Threecolorplane-ru.swf | — | — |

## Source inspection and geometry decisions

Read recovery README/MODERNIZATION and examined recovered MainTimeline
ActionScript, addFrameScript timeline markers, hint transitions, exported text
resources, and solid-face vector resources. Paired plane texts and timeline
markers specify the same constructions. Cube Russian text explicitly has the
same 720 assignments, 24 orientations, and answer 30; its face placements match.
Other solid Russian question texts and geometry placements also match English.

Crucially, neither `brick` nor `paralele` is a three-unequal-edge rectangular
box. Brick shapes 1/3/9/11 are 150 × 250 rectangles and shapes 5/7 are 150 × 150
squares; MainTimeline places sides at x/z = ±75, caps at y = ±125.
Paralele has 100 × 180 rectangles, 100 × 100 square caps, offsets x/z = ±50,
y = ±90. Therefore both are square-based right prisms with **eight**, not four,
orientation-preserving symmetries. Answers are 6!/8 = 90.

Recthexprizm shapes have 50 × 150 rectangular sides and a regular hexagonal cap
approximately 100 × 86.6; timeline placements/60° rotations confirm the regular
hexagonal prism. Its proper rotation group has order 12, giving 8!/12 = 3360.
Tetra faces are hand-drawn near-equilateral triangles of side approximately 150;
the model is the ideal regular tetrahedron, order 12, giving 4!/12 = 2.

Four non-cube source objects rotate solids and pose questions but do not contain
answer checking or a textual numerical solution. Modern checks and reasoning
are derived mathematically from verified geometry, not recovered answer scripts.

## Interaction and fidelity

The cube's reasoning reveal requires a correctly submitted count, matching
`Cube-colorproblem_fla/MainTimeline.as`'s stopped first frame and `bQuiz3`
correct-answer handler. Incorrect attempts allow retry without exposing the
answer, while rotation and color swaps remain available for solving the puzzle.
Reset clears the unlock. The other four source solids have no required quiz,
so their optional reasoning is not given an invented prerequisite.

The solid activities now group the diagram and rotation sliders beside the face
selectors on wide screens, stacking them on narrow screens. A fixed bounding
sphere sets each solid's projection size, so rotating does not resize the frame
or clip the solid. Answer checking, reasoning and reset use compact grouped
actions. The original aqua stage, geometry and face palettes are unchanged.

Click/touch dragging the diagram adjusts yaw and tilt alongside the existing
keyboard-accessible sliders. Primary-pointer capture stays on the diagram and
is released on completion/cancellation; lost capture clears the gesture. Motion
deltas are bounded, yaw wraps, and tilt stays within the slider limits. There
are no global pointer listeners or automatic animation. Plane proofs do not
receive dragging.

Face labels, collapsed selectors and adjacent swatches show the currently
assigned source color with contrast-selected black or white text. Numbered
face/color labels remain available without color perception; option colors
are supplemental because native dropdown styling varies by platform.
The assignment swap and all symmetry/counting rules are unchanged.
The reference drawing retains its dimensions; its repeated author/site caption
is omitted because attribution is already present in the surrounding site.

This follow-up was inspected in source only; Main owns combined static and
production verification. Manual acceptance: drag with mouse and touch, release
outside the diagram, cancel a touch gesture, adjust both sliders by keyboard,
swap colors repeatedly, check correct/incorrect answers, expand reasoning,
reset, and inspect all five solids in English/Russian at narrow/wide widths.

Five solids share a geometric, depth-sorted SVG projection with keyboard/touch
yaw and tilt controls, source face palettes, color-assignment swaps preserving
distinct colors, answer checks, reasoning, and reset. Rotations identify
equivalent colorings; reflections do not. Approximate drawing/placement errors
are regularized into coherent solids. Original camera, timed fades, automatic
rotation, and audio are not copied. No original music is loaded or autoplayed.

Each solid includes an original face illustration next to recovered dimensions.
These five SVG files are byte-identical preserved exports:

| Public asset under media/coloring/ | Recovered resource under objects/Movies/ |
| --- | --- |
| cube-face.svg | Cube-colorproblem/resources/shapes/1.svg |
| brick-face.svg | brick-colorproblem/resources/shapes/1.svg |
| right-prism-face.svg | paralele-colorproblem/resources/shapes/1.svg |
| tetrahedron-face.svg | Tetra-colorproblem/resources/shapes/1.svg |
| hexagonal-face.svg | Recthexprizm-colorproblem/resources/shapes/3.svg |

Original MightyMatica educational illustrations are attributed to Yuri Remizov;
preservation does not grant a new blanket asset license.

Plane lessons retain original proofs: unit equilateral triangle, common
midpoint contradiction, six-point equilateral construction, and reflected
triangle producing a monochromatic circle of radius √3. Timed hints become
previous/next steps. Finite samples are explicitly not claimed to exhaust a
plane coloring. Point numbers accompany colors; DOM buttons provide keyboard/
touch controls. No animation, audio, observers, storage or listeners need
teardown; reduced motion is inherently honored.

## Verification

Plane-proof usability review: numbered point labels now use black on magenta
and white on blue rather than inheriting white everywhere. Reset is grouped
with proof navigation instead of stretching across the activity; plane-only
spacing is tighter. Proof steps, point-color cycling and magenta palette are
unchanged. Source inspection only; manually check both locales, all proof
steps and point-number contrast at narrow widths.

`node --experimental-strip-types --test tests/coloring.test.mjs`: **5 passed**.
Tests exhaust eight auxiliary-color choices in the six-point proof, reject
collinear false positives, check both midpoint cases, distinguish square-based
and generic-box symmetry counts, and verify distinct-color orbit counts.
`cmp` confirmed all five preserved SVG assets match their recovered originals.

No browser automation or visual verification performed. Main owns integrated
type-check/build. Manual checks: switch English/Russian, rotate every solid,
swap face colors, enter answers above, walk all proof steps, reset, and check
narrow-screen labels/controls and rear-face visibility after rotation.
