# Triangle constructions

All eleven titles now open with the original animated lesson artwork and
source-timed event audio, using native Canvas and browser audio rather than
Flash. Ten titles have separate English/Russian source lessons; palm
trigonometry has only its English source. Source question gates and original
wrong/correct/retry branches are native controls, not seeks through an answer.
The earlier mathematical explorers and corrected quizzes remain optional
followups after completion. These are not claims of browser-verified audiovisual
parity. Recovered art/audio retain their provenance and receive no blanket new
license.

## Interactive source-audio restoration

### In-stage dragging, NEXT controls and Altitudes text followup

The reported Altitudes screenshots exposed two missing native bindings:
painted NEXT had a separate generic Continue button, and the original in-stage
vertex dots were inert while a different SVG worked below the film.

`recover-interactions.py` now recovers source continuation controls and six
drag layouts into `source-interactions.json`. It uses original XFL matrices,
button vector/DefineText hit bounds and verified root handlers, not screenshot
coordinates. All 21 variants were inspected; 29 native manual holds have a
verified NEXT/Proof continuation hit. These add `sourceArtwork: true`
transparent stop hotspots, without adding a seek or changing any answer gate.
For example, Altitudes EN's NEXT at frame 804 occupies
`(414.8, 284.45, 110, 29)`; the interlude NEXT at 909 occupies
`(414.6, 342.7, 110, 29)`. Whole button bounds include both its background
vector and its exact text Hit record, not merely the word NEXT.

`SourceDragStage.tsx` now mounts inside the shared player's positioned
`stageOverlay` at the original exploration stop. It replaces only the small
original vertex/label footprints with native interactive geometry; the
companion, instruction text, stage background and source controls remain.
There is no second interlude SVG below the lesson. Exact Altitudes centers are
EN A `(83.05,354)`, B `(365,350)`, C `(227,145)` and
RU A `(114,261.95)`, B `(292,200)`, C `(154,91)`.
Median and bisector centers/colors are recovered by the same method.
Source ActionScript draws its lines from each root `mc.x/y + 8`; the native
geometry preserves that coordinate convention.

The in-stage SVG remains at source `550 × 400` with a fixed view transform.
Only vertex handles accept pointer input; source controls remain above it.
Pointer capture keeps the inverse transform and initial grab offset for the
whole drag. Exactly one primary pointer owns the grab; other pointers cannot
move or release it. Capture is explicitly released on owned up/cancel/lost
capture, Escape, focus/window blur, hidden document and unmount, with listener
cleanup. Cancellation preserves already committed vertex positions.
Arrow keys and larger Shift steps are supported.
Handles remain inside the authored initial vertex envelope (the
source itself has no explicit drag rectangle). Near-collinearity/short edges
are rejected rather than inventing an intersection. Altitude lines are
numerically clipped before reaching SVG; a distant orthocenter is reported
outside the diagram, never mathematically clamped.

The optional post-lesson explorer keeps its useful orthocenter auto-fit, but
freezes its viewBox and inverse pointer transform during capture. Fitting
resumes on release/cancellation. This prevents moving the coordinate system
under the grabbed point. The optional construction checkbox is compact inline.

For the slow Altitudes caption phase, the original binary files provided
159 EN and 153 RU exact DefineText rectangles in `altitudes-text-bounds.json`.
Examples in source twips:
EN text143 `[8,55,5749,1124]`, text150 `[-742,67,5598,2356]`;
RU text143 `[6,69,5171,1124]`, text150 `[-704,65,5573,2179]`.
They cover the “Fascinating properties”/three-altitudes captions shown near the
804 hold; frame 145 was not assumed from the screenshot.

`optimize-altitudes.mjs` applies Main's reviewed generic static-text caching
API to **only four Altitudes EN/RU chapters**. Originals are saved under
`.cache/triangle-filter-originals/`; writes use the shared export lock,
concurrent SHA guards, and unchanged metadata/export checks. Existing CTM,
transport, root dispatch, art/color, filter and disposal behavior remain.
The static caption crops/caches replace repeated full-canvas pixel filters,
including verified one-frame text wrappers. No new SWF/art export was made.
An idempotence pass reports zero further changes.

The bounded software diagnostic `profile-altitudes.mjs` sampled frames
790–796 and 804 at 1520 × 1105, with inert vector/image I/O and actual filter
pixel arrays. Warm averages changed from **242.09 ms to 0.63 ms EN** and
**481.56 ms to 0.53 ms RU**; full-canvas reads across seven warm samples fell
from 35/70 to zero. These are diagnostic CPU/filter measurements, **not
browser FPS, screenshot parity or audible synchronization verification**.

Focused tests now pass **15/15**, including remote orthocenter clipping without
changing its mathematical coordinates, stable pointer grab offsets and
reachable/non-collinear vertex movement. A metadata audit confirmed all six
in-stage layouts and 29 continuation holds with zero question-gate collisions.
An initial new-test import failed because Node requires the runtime `.ts`
extension; that own change was fixed and all focused tests then passed.
No pre-existing test failure was encountered.

Manual checks still required: click the actual Altitudes NEXT, drag the actual
in-stage A/B/C dots in EN/RU, use keyboard/cancel/restart, and move the optional
explorer into an obtuse/near-flat configuration while holding the pointer.
The grabbed point must not jump when H moves far away; optional fitting may
occur only after release. Check the preserved source captions and audio while
playing through the previously slow phase.

### Source-painted transport controls followup

The reported Congruence screenshot showed the original painted Play control,
a second generic in-stage Play control and the HTML toolbar. The triangle
wrapper now supplies transparent semantic hit areas over verified source
transport artwork; it does not paint a replacement or cover the original.
The toolbar remains an accessible alternate transport.

`source-controls.json` records 192 exact global placement spans and separate
Play/transport rectangles for all 21 source variants. It was recovered from
root XFL `pp` placements, nested button matrices and vector hit-state artwork
using the reviewed structured XML reader in `calculus/recover-controls.py`.
Bounds exclude text and stroke; the transport rectangle is the union of the
verified Play/Pause hit areas, so different source button sizes remain usable.
For example, Congruence EN's initial control spans frames 1–889 and has
Play hit bounds `(12.1, 159.1, 104.9, 39.75)` in stage pixels.

Each of the 21 corresponding `pp` ActionScript classes was checked for the two
stopped local states: paused frame 0 (`go`/`bControl`), playing frame 1
(`halt`/`sButton`), root play/stop handlers and `gotoAndStop(2/1)`.
`scripts/triangle-playback-control.mjs` configures only those reviewed sprites
through the existing audited patch helper. Their native renderers now expose
`setPlaybackState`, so the authored Play/Pause artwork follows actual transport
instead of cycling on a free-running two-frame timeline. No other sprite is
frozen. The recovery recipe reapplies this source-specific mapping after a new
Canvas conversion.

The patch was applied only after the shared Canvas CTM refresh was frozen;
all 31 modified chapter modules retain the `Canvas context transforms v1`
correction. No media was re-exported. Source question actions still own all
84 gates; this metadata changes neither stops, branches, Hint nor interludes.
No arbitrary source button bounds or unverified menu controls were added.

Reproduction:

```sh
node scripts/triangle-playback-control.mjs --recover-controls
node scripts/triangle-playback-control.mjs --check
node scripts/triangle-playback-control.mjs --apply
```

The `--check` pass audits every chapter before `--apply` writes any module.
All 31 chapters passed the source-specific patch audit and were patched.
The existing two narrow triangle test files still pass **13/13**, and both
recovery/config scripts pass `node --check`. A read-only metadata check verified
21 source variants, 192 non-overlapping spans and finite positive hit bounds.
The screenshot was inspected as a supplied image, not through browser
automation. Post-fix visual/pointer confirmation remains a manual user check:
click the painted initial Congruence Play, pause it again, and verify there is
no duplicate generic in-stage Play. Repeat a later moved source control and an
answer gate, confirming the source transport does not bypass the question.

The 21 reviewed source variants provide **49,803 global root frames**, split
into **31 lazy Canvas chapters** of at most 2,500 frames. There are **725 root
audio cues**, **354 original MP3 definitions**, and **84 question gates** counting
both languages. Before the later shared drawing minification, drawing modules
and MP3s totaled 155,094,755 bytes (about 148 MiB);
audio audit JSON adds a small amount. None of this is eagerly loaded by catalog
metadata. `NativeTriangleLesson.tsx` loads only the selected source JSON, then
`OriginalLessonPlayer` loads the current drawing chapter and nearby audio.

`recover-native.mjs` is an offline, finite recovery recipe within the family.
It reads only the eleven named English sources and their ten named Russian
partners. It uses the shared serialized 2-CPU/120-second exporter, audited
Canvas converter and binary MP3/cue recovery CLI; it does not run recovered
JavaScript or ActionScript. Run from the repository root:

```sh
node src/modules/triangles/recover-native.mjs
# Or one reviewed variant:
node src/modules/triangles/recover-native.mjs cosine-law:en
```

Existing modules and audio inventories are reused rather than re-exported.
Generated runtime metadata is `src/modules/triangles/native-*.json`; reviewed
native drawings/audio and original binary-audio audit manifests are under
`public/media/triangles/native/<title>/<language>/`. Media paths omit a `media/`
prefix and remain within that owned directory.

### Source flow and protected answers

- False proof holds at the original HINT stop. An explicit Hint action plays
  the original hint audio at 2016/2266 and enters the native all-vertex hint
  at 2017/2267. Its native hint opens automatically, and the
  intentional-false-proof warning is visible before playback.
- Congruence plays its definition before the square and circle gates, then
  continues to the three original congruence criteria. The existing native
  superposition/quiz is a supplemental activity, not a bypass around these gates.
- Pythagoras, medians, altitudes, bisectors and inscribed angle each retain
  eight question diagrams, answer choices, original result artwork/audio,
  wrong-answer animation and retry.
- Cosine law, sine law, trig addition and palm trigonometry retain their source
  playback/section stops without adding a mandatory quiz.

`TriangleLessonRules.ts` restores question, wrong-result and correct-result
manual holds. `stopActions` authorizes only a selected answer's specific source
branch; generic Play/Continue cannot release those question or retry holds.
A wrong answer enters the original error segment and can only retry the same
question. A correct answer enters its original result hold before Next.
The same player/audio owner survives these authorized jumps, preserving event
sound tails instead of rebuilding an estimated soundtrack at each question.
No seek slider or answer-skipping menu is exposed. Restart clears completion
and the supplemental explorer. All controls are keyboard-operable.

Question text and diagram labels are also extracted from the active XFL scene
at the global gate frame; an optional readable transcript is available while
that question is waiting. It does not expose later questions or result text.
Source diagrams themselves still need interactive accessibility review.

Three source mathematical defects are corrected in the semantic answer gate,
with the calculation disclosed after acceptance:

- Medians Q4: EODA consists of two of the six equal-area parts, so its area is
  `20√2`, not the source grader's `40√2`. The native gate accepts option 3.
- Altitudes Q2: legs 3 and 4 give hypotenuse 5 and altitude `12/5 = 2.4`;
  the source displays 2.5. Native option 3 is 2.4.
- Bisectors Q6: a leg split into 4 and 5 gives a 9–12–15 triangle by the
  angle-bisector ratio. Its area is 54, not the source option 240.
  Native option 4 is 54.

The source picture is preserved, so these erroneous printed choices may still
appear inside the original artwork; the actual interactive choices and grading
use the corrected values. Congruence's individual sufficient conditions are
acknowledged as sufficient when its source requests the most complete answer.

### Audio, lifecycle and remaining limits

Each source retains its own FPS: English Insangle is 10 FPS, its Russian
partner 24 FPS. The reviewed four-second Timer holds in Mediana and Russian
Insangle are preserved; other source stops require explicit continuation.
Audio starts only through user playback. The shared player owns sound on/off,
pause, visibility suspension, reduced-motion pauses, bounded lazy decoding,
chapter loading, restart, load errors and disposal. Explicit play remains
available with reduced motion.

All 21 binary inventories have root event audio and no nested event cues or
streaming audio requiring another scheduler. Each also reports a
DefineButtonSound tag: exact button-transition click sound behavior is not
implemented by this family. Generic sound names have not been listened to or
transcribed here; preservation of their bytes/cues does not classify every
recording as spoken narration.

Native Canvas preserves the authored drawing timeline, not arbitrary Flash
code. The source draggable construction interludes in Mediana, Altitudes and
Bisector use ActionScript `graphics`; their direct geometry is not produced by
the drawing export. These six EN/RU interludes now pause the film at their exact
source entry: Mediana 532/549, Altitudes 909/934, Bisector 532/659.
The native vertex-drag SVG now sits in the source stage in geometry-only mode,
without explanatory formulas, proof text, quizzes or a second companion.
The painted NEXT resumes the authored proof. The overlay replaces the
ActionScript graphics/drag mechanism without interpreting Flash code.
Full explorers remain after
completion. False proof's final native hint similarly replaces its
source-script drawing loop. No browser or listening
verification was performed; original vector/font fidelity, timing, touch
layout and audible synchronization need user testing.

The initial packed Canvas pilot was correctly rejected by the converter. Main
updated the shared exporter to `packJavaScripts=false`; the pilot was
re-exported and converted without evaluating packed code. Four bounded
Insangle question PNGs were exported to temporary comparison storage only to
check the meaning of the 60° arc, central angle, radius chord and diameter;
they are not shipped raster lessons.

Focused verification:
`node --experimental-strip-types --test tests/triangles.test.mjs tests/triangles-lessons.test.mjs`
passed **13/13**. New tests exercise all 84 source gates through
question/error/retry/correct holds, protect the six vertex-drag interlude holds,
preserve the false-proof Hint hold and its tail audio cue, and verify the three
corrected mathematical answers.
A separate read-only metadata/media audit found all 21 definitions,
31 chapter files and referenced sound paths, all under the owned media prefix.
No browser, server, compiler, type-check, build or full suite was run for this
audio followup. No installations, commits, remote operations or archive writes
were performed.

Manual acceptance:

- Open every source/language variant, explicitly Play, and inspect sound on/off,
  pause, chapter transitions, hidden-tab return and reduced-motion explicit play.
- For each source quiz, try a wrong answer, retry, then the correct answer.
  Play/Continue must not skip a question. Congruence must reach both gates before
  its criteria; final questions must not skip their result/finish sequence.
- Check the three mathematical correction disclosures after acceptance.
- Restart during a question, during narration and after completion; verify no
  stale sound, completion or explorer remains. Switch language during loading.
- Complete the false proof and open its movable-vertex hint. Complete each other
  title and check its optional explorer. Palm's source remains English in RU UI.
- In medians, altitudes and bisectors, pause at the source exploration interlude,
  move all vertices by pointer/keyboard and resume the proof. No formulas or
  later proof text should appear in that geometry-only interlude.

## Supplemental explorer notes

The following earlier restoration details concern the optional native
mathematical explorers, not a replacement for the primary source lessons.
Selected original timeline drawings remain available as stills. The standalone
companion in these explorers uses its authentic silent idle atlas.

## Playable coverage and provenance

All source paths below are relative to the original `raw-site/` directory.
Recovered references are under matching objects in
`mightymatica-source-recovery/objects/`.

| Activity ID | Exact source objects | Covered mathematical idea |
| --- | --- | --- |
| triangles-false-proof | `Movies/Alltriangles.swf`, `Movies/Alltriangles-ru.swf` | Six-stage false argument, angle/perpendicular bisectors, perpendicular feet, segment-order trap, draggable hint/reveal |
| triangles-congruence | `Movies/Congruence.swf`, `Movies/Congruence-ru.swf` | Definition, SSS/SAS/ASA marked diagrams, rotation/reflection/superposition, original square/circle questions |
| triangles-pythagoras | `Movies/Pifagor-gl.swf`, `Movies/Pifagoras Theorem - ru.swf` | Three squares, theorem/converse, original four-triangle rearrangement, all eight source quiz questions, original proof stills and authentic companion idle |
| triangles-medians | `Movies/Mediana.swf`, `Movies/Mediana-ru.swf` | Draggable medians, centroid, 2:1 ratio, equal-area statement |
| triangles-altitudes | `Movies/Altitudes.swf`, `Movies/Altitudes-ru.swf` | Draggable altitudes and extensions, orthocenter including obtuse case |
| triangles-bisectors | `Movies/Bisector.swf`, `Movies/Bisector-ru.swf` | Draggable bisectors, incircle, division ratio |
| triangles-cosine-law | `Movies/Coslaw.swf`, `Movies/Coslaw-ru.swf` | Projection, coordinate-proof identity, live numeric equality |
| triangles-sine-law | `Movies/Sinlaw.swf`, `Movies/Sinlaw-ru.swf` | Altitude construction and three live side/sine ratios |
| triangles-inscribed-angle | `Movies/Insangle.swf`, `Movies/Insangle-ru.swf` | Central/inscribed angle relation; movable point restricted to opposite arc; three sequential diameter/addition/subtraction proof cases |
| triangles-trig-addition | `Movies/Trig-cos.swf`, `Movies/Trig-cos-ru.swf` | Addition identities and unit-circle vector |
| triangles-palm-trig | `Movies/Palmandtrig.swf` | Five-finger square-root mnemonic and exact unit-circle values |

English/Russian texts verify matching mathematical topics and labels. UI
translations share one implementation; they are not verbatim transcripts.
Palmandtrig has only an English source in this assigned family; its Russian UI
is a new translation, not an assertion of an archived Russian variant.

## Sources examined

Inspected extracted `resources/texts/*.txt` for each listed English lesson,
Russian Pythagoras, and paired Russian topic/formula text. Inspected recovered
`actionscript/scripts/*/MainTimeline.as` frame maps and event handlers: median
midpoints, bisector length-weighted division, altitude dragging, Pythagoras and
inscribed-angle quiz branches, and stop-only timeline scripts for cosine law,
sine law, trig addition and palm mnemonic.

For Alltriangles and Congruence, inspected their full MainTimeline scripts and
parsed the reconstructed XFL DOMDocument frame text. The false proof's
recovered text asks for the “bogus step”; the script constructs an angle
bisector, a perpendicular bisector, their intersection and perpendiculars to
the side lines. The native argument follows that construction rather than
substituting an unrelated triangle lesson.

Congruence's English/Russian definition, three criteria, corresponding
equalities and square/circle questions agree. The original questions intend
“any of the three” as the complete answer. Each individual condition is also
mathematically sufficient and is acknowledged as such.

Inspected Pifagor-gl `resources/images/3.png` and `20.png`: the original
bearded/laurel character and its larger body/face base. Inspected the recovered
XFL `project/Pifagor-gl.xfl/Pifagor-gl/DOMDocument.xml`, including square-area
labels and theorem/proof sections. Used the shared serialized FFDec helper to
export root frames 42, 1000, 1200 and 1291 to
`public/media/triangles/pythagoras-reference/*.svg` and matching PNGs. They are preserved timeline
drawings, not execution of ActionScript or a native parity claim. The native
lesson offers PNGs as an explicitly labeled original-drawing gallery; SVG
equivalents are retained alongside them.
Inspected all four exported PNG equivalents directly: frame 42 is the title
with the original companion, frame 1000 shows the two-square/four-triangle
proof, and 1200/1291 show the theorem equation. The native PythagorasProof
reconstructs frame 1000's two endpoint arrangements with the same four right
triangles. Its controllable animation uses rigid translations/rotations; no
triangle is distorted or resized between arrangements.

Also exported original Alltriangles root frames 600, 1000, 1500, 1900 and 2015
to `public/media/triangles/false-proof-reference/`, and Congruence frames 2200,
3200 and 4200 to `public/media/triangles/congruence-reference/`. Inspected the
false proof's actual misleading feet/congruence diagram and claimed conclusion,
and each of the three original congruence criteria drawings. The two activities
include these source-drawing galleries. The false-proof gallery explicitly
warns that the original foot placement/conclusion is intentionally false.

The animated companion is the shared `OriginalCompanion`, sourced from the
authentic Figure source repository's Pifagor atlas, not a newly drawn character.
Its provenance, 70-frame/24fps timing and limitations are in
`docs/animated-companions.md`. This reuse does not claim that Figure's silent
idle reproduces Pifagor-gl's talking timeline.
The same companion also accompanies medians, altitudes, bisectors, congruence
and inscribed angles: their recovered body PNGs were verified byte-identical
to Pifagor-gl's `20.png` (SHA-256
`1d538be1d70d1049450acdc945d248c3e24a862a1262ab0667582c54b38db6d8`).
The files are respectively Mediana `24.png`, Altitudes `33.png`, Bisector
`36.png`, Congruence `3.png`, and Insangle `3.png`. Silent idle reuse preserves
the authentic character without inventing talking behavior.

## Mathematical and interaction limits

The false proof preserves the true equalities but rejects its conclusion:
one perpendicular foot lies on a side extension, the other inside the side.
One whole side is obtained by subtraction and the other by addition. Replacing
both differences with whole side lengths is invalid. The isosceles limit gives
coincident construction lines and no unique X; the UI reports this explicitly.
The native hint now moves A, B and C by pointer or keyboard, matching the
original's three drag targets; sliders additionally move A. The perpendicular
bisector rotates with BC rather than assuming a horizontal base. Near-degenerate
triangles and very short edges are rejected.

Congruence reconstructs the three criteria and both shape questions. The square
question and then the circle question now precede access to the criteria, as
in original root frames 1104/1177 before the criterion sections ending at
2278/3268/4236. Each question retains retry and explicit Next after the complete
answer. A single sufficient condition is acknowledged mathematically rather
than incorrectly called false. Start over restores the two-question gate and
the initial triangle/superposition state. Its
optional two-second rigid-motion superposition is modern, not extracted
timeline playback. Reflection is explicit, not represented by a non-rigid
squashing animation. Manual superposition remains available. Reduced motion
stops automatic playback when the preference changes; users can still explicitly
start the alignment or Pythagoras rearrangement. The shared animation lifecycle
pauses hidden tabs.

Full narrated proof sequences and the eight-question quizzes for medians,
altitudes, bisectors and inscribed angles are not yet reproduced. Their
questions refer to authored diagram labels, positions and angle marks, so
text-only transcription would omit givens. These are remaining restoration
tasks, not approved UX substitutions.
The Pythagoras post-lesson quiz now contains all eight source questions in
order: integer side triples, radical side triples, radical hypotenuse,
parallelogram/rectangle, triangle perimeter, rectangle perimeter, rectangle
area and rhombus side. Wrong answers allow retry without showing the solution;
a correct answer shows the calculation and enables explicit Next. The final
question leads to congratulations, and Restart resets question and feedback.
English and Russian share this behavior.
The native Pythagoras proof now reconstructs the original four-triangle
rearrangement geometry, with modern rigid-motion paths, pause, manual progress,
restart and explicit playback under reduced motion. Its exact authored timeline,
voice and reactions remain unported. The original-drawing gallery retains
source artwork; stills are not advertised as complete animated playback.
The trigonometric-addition lesson gives identities and rotations, not the
original full geometric decomposition. The inscribed-angle exploration covers
minor central angles 20–170° with A on the opposite arc. Its optional Proof
now restores the three source cases in sequence: AC a diameter, O inside BAC
(addition), and O outside BAC (subtraction). Each has an explicit diagram,
source argument, Previous/Next and close/reopen reset. These are native static
proof stages, not the source animated narration.
The palm lesson lacks the original animated hand. These remain genuine
native-parity gaps despite every assigned logical title now having a playable
adaptation.

Vertex movement rejects near-collinearity and very short sides to keep formulas
meaningful. Altitude view bounds include the orthocenter. Draggable center/law
vertices support arrow keys with Shift for larger steps. Range controls provide
touch/keyboard equivalents elsewhere. Inscribed-angle points A and C also accept
direct circular dragging, arrow keys (Shift for larger steps), and Home/End.
A stays on the opposite arc at 190–350°, and C preserves the minor central
angle range of 20–170°. Dragging through the center leaves the angle unchanged.
These handles are native interaction improvements; the recovered Insangle
MainTimeline and pp playback scripts provide timeline/quiz controls, not this
exact dragging behavior. Audio never autoplays.

## Verification

### Final sharded UX pass

Reviewed all eleven IDs listed in the coverage table against their current
components, recovered English text files and ActionScript stop/control maps;
checked paired Russian topic/question text for the ten paired titles. Inspected
the eleven English XFL DOMDocument stage headers (all aqua), and sampled their
authored text runs. No source archive was changed. The detailed source
prerequisite evidence was Congruence's MainTimeline and its square/circle
text, Alltriangles MainTimeline frames 2017/2018 (three drag handlers),
Pifagor-gl resources/texts/245–327 (eight quiz questions), and Insangle
resources/texts/102–208 (three proof cases).

Changes are in `Congruence.tsx`, `FalseProof.tsx`, `PythagorasQuiz.tsx`,
`InscribedProof.tsx`, `OriginalDrawings.tsx` and the family composition root.
Source frame numbers are no longer exposed by the optional drawing gallery;
buttons identify drawings by their order.

Still incomplete after this pass: the four diagram-dependent quizzes noted
above, medians' parallelogram concurrency proof, altitudes' larger-triangle
proof, bisectors' parallel-line/similarity proof, exact authored law-of-sines/
cosines/trig-addition playback, animated palm/hand, and full narration/timing.
No runtime export or broad media conversion was attempted. Existing direct
geometry, false-proof warnings, mathematical corrections and source colors
remain. This pass does not certify visual or complete UX parity.

Final focused command:
`node --experimental-strip-types --test tests/triangles.test.mjs`: **8 passed**.
The added regression covers moving B/C to tilt the base, equal distances from
the perpendicular-bisector intersection, opposite foot order, and invariance
under rotation. Existing seven rule tests also pass.
The six changed/new TSX components also passed a source-only syntax transform
using Vite's installed `transformWithOxc`; this is not type checking or a build.
An initial attempt to use TypeScript's legacy `transpileModule` API could not
run because installed TypeScript 7 exposes no `JsxEmit` compiler API; the Vite
syntax check succeeded instead. No dependencies were changed.
No browser, devserver, integrated type-check/build, or full suite was run.
Main owns integration; the user owns interactive visual testing.

Additional manual checks for this pass:

- Congruence: answer a single sufficient condition, then the complete answer;
  only Next should advance square → circle → criteria. Start over must reset.
- Pythagoras: try a wrong choice and retry on each question; progress cannot
  advance until correct. Complete all eight and restart in both locales.
- False proof: tilt BC by moving B/C using pointer and keyboard; m must remain
  perpendicular to BC. Reset restores the original triangle and hidden reveal.
- Inscribed angle: open Proof and traverse all three cases; check the diameter,
  addition/subtraction statements and close/reopen reset on narrow screens.

Presentation review inspected DOMDocument backgrounds for all eleven English
sources: each specifies aqua (`#66ffff`). Native stages now use that background,
dark blue outlines/Times-family labels and magenta constructions, without navy
rounded chart panels. Mediana, Congruence and Pifagor-gl vector/font attributes
were checked. Direct inspection of preserved Pythagoras frame 1000 and
Congruence frame 2200 confirmed blue geometry, bright magenta accents and, in
the Pythagoras proof, intentional green square areas with navy triangles.
Those green mathematical areas are preserved; they are not generic UI chrome.
Visible migration disclaimers were removed, while these fidelity limits and
the false-proof gallery's mathematical warning remain. No browser, compiler or
test runner was used for this presentation-only pass.

`node --experimental-strip-types --test tests/triangles.test.mjs`: seven passing
tests. Coverage protects median ratios, incenter distances, bisector division,
obtuse orthocenter behavior, sine-law consistency, parallel-line handling, the
false proof's true equalities, opposite foot orders, and isosceles limit, plus
inscribed-angle drag bounds across the angular wrap and the center singularity.

The initial frame export found missing `libfontmanager` in the headless-only
JDK. The shared helper owner selected an already installed full JDK; the repeat
SVG export succeeded. No runtime was installed.

No browser automation, integrated type-check/build or full suite was run by
this worker. Main owns integration. Manual checklist:

- Open all eleven routes in both locales; inspect narrow mobile layout.
- Drag/keyboard-move center/law vertices; try obtuse triangles and orthocenter framing.
- Sweep Pythagoras legs to 1 and 5; rearrange/pause/seek the four triangles, submit 24, pause the companion, open original drawings.
- Sweep inscribed angle/A position by sliders, point dragging and keyboard; verify A/C stay on their allowed arcs at the endpoints and across 0°. Compare addition values at 0°/90°; choose all fingers.
- Traverse all false-proof steps, move A across the midpoint, identify the segment-order error.
- Inspect congruence's three criteria, mirror/align/pause copies, try reduced motion, answer both original questions.
