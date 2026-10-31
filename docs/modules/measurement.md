# Measurement restoration

## Source-bound static-composite follow-up, 2026-10-31

This supersedes the remaining Area-shadow limitation recorded in the earlier
review below. An additional 2,627 English / 2,580 Russian static composite shadow
blocks now use the reviewed bounded cache, without removing authored effects.
Polygon required no further painter edits. Neither Area painter now has remaining
direct root pixel-filter blocks; library implementation calls are not root blocks.

New `area-drawing-bounds.json` and `polygon-drawing-bounds.json` contain 76/81 and
36/37 combined static shape/text rectangles respectively. The binary-only
`scripts/recover-static-drawing-bounds.mjs` importer uses stroke-inclusive
ShapeBounds, excludes morph/dynamic text and non-scaling Shape4 strokes, and
records source hashes. Use the same bilingual originals documented below with
`--output src/modules/measurement/<id>-drawing-bounds.json`. Original text evidence
is preserved. `optimize-lessons.mjs` requires matching source hashes and shared
text rectangles between both evidence sets before applying drawing bounds.

The actual stroked source placements were traced before application: all
2,627/2,580 outer transforms are uniform scale/rotations, not anisotropic/sheared
transforms; all 14 shape-child placements per language are identity matrices.
This scoped evidence does not certify arbitrary transformed stroked paths.

Existing hashed backups, syntax checks, deep metadata/export comparisons and
concurrent-edit guards remain. Reviewed measurement conversion now reapplies the
optimizer after all variants are converted. The existing Circle hook is intact;
patch-only transport recovery does not newly invoke Area/Polygon optimization.
Repeat application is byte-idempotent. Source archives, audio and lesson
timing/gates are unchanged. Focused cache/importer/rules/source-branch/quiz tests
passed 31/31; both optimizers and recovery hooks passed syntax checks.
Central serialized CPU/pixel profiling belongs to Main, not this follow-up.

## Area and Polygon rendering review, 2026-10-31

Reviewed all three activities and six native painters. Circle's separate local
optimization and its documentation below are preserved unchanged. Area EN/RU
now cache 3,540/2,996 verified static-text filter blocks; Polygon EN/RU cache
435/435. The shared reviewed helper preserves authored effects and their order,
uses source-density text crops, bounds retained memory, and releases caches on
renderer disposal. No narration, question gates, transport or lesson timing
changed. Source dimensions remain 550 × 400.

`area-text-bounds.json` and `polygon-text-bounds.json` contain rectangles
recovered directly from the respective bilingual original SWFs, with source
hashes (Area 45/46 static texts; Polygon 14/15). Regenerate each with
`scripts/recover-calculus-text-bounds.mjs --en <original English SWF> --ru
<original Russian SWF> --output src/modules/measurement/<id>-text-bounds.json`.
The original movie names are `Area`, `Area-ru`, `Area of polygon` and
`Area of polygon-ru`, under the read-only recovery tree's `objects/Movies`.
Apply using `node src/modules/measurement/optimize-lessons.mjs --apply`.
The tool verifies source hashes, saves hashed backups under
`.cache/measurement-lessons-filter-originals`, syntax-checks candidates,
deep-compares metadata/export keys, rejects concurrent edits and is idempotent.

Remaining cost is explicit: Area EN/RU retain 2,627/2,580 root shadow blocks on
14 composite formula/geometry sprites per language. They combine text and shapes
and are deliberately outside the verified static-text-only rewrite. Polygon
has no remaining root pixel-filter blocks. Filter library implementation calls
are not counted as root drawing blocks. No shadow was removed. The event-driven
optional measurement explorers introduce no continuous rendering loop.

Focused cache, measurement, source-branch, quiz-progression and solids tests
passed 24/24; all ten newly changed lesson painters passed syntax and unchanged
metadata/exports checks, and a repeat application made no changes. No browser,
FPS, audio-listening or pixel-parity verification is claimed. Manual review
should cover both languages, Area's later composite formulas/shadows, Polygon's
labels and moving artwork, playback and completion. Central serialized
performance measurement and recovery-script integration belong to Main.

## Local Circle rendering follow-up, 2026-10-31

The reported slow Circle introduction repeatedly applied five full-canvas pixel
filter passes per frame. This affected both languages and scaled poorly with
the Canvas backing resolution.

Both Circle drawing modules now use the existing reviewed static-text crop/cache
helper. Only verified static text and one-frame static-text wrappers qualify;
the original effect order, colors and arguments remain. Filtered text bitmaps
use authored source density, while ordinary vector artwork keeps the higher
display resolution. Cache lifetime is bounded to 24 entries / 2,097,152 pixels
and released with the renderer. Audio, all eight questions, answer branches,
transport state, source frame coverage and lesson metadata are unchanged.

`circle-text-bounds.json` records 97 English and 96 Russian static-text rectangles
recovered directly from the original binaries. To reproduce:

```sh
node scripts/recover-calculus-text-bounds.mjs \
  --en /home/ignat/code/mightymatica-source-recovery/objects/Movies/Circle/original/Circle.swf \
  --ru /home/ignat/code/mightymatica-source-recovery/objects/Movies/Circle-ru/original/Circle-ru.swf \
  --output src/modules/measurement/circle-text-bounds.json
node src/modules/measurement/optimize-circle.mjs --apply
```

The recipe verifies source hashes, backs up the existing modules before writing,
checks syntax and unchanged metadata/exports, rejects concurrent edits, and is
idempotent. Measurement conversion/transport regeneration reapplies it.

A bounded software diagnostic ran the actual drawing/filter functions with
inert vector/image boundaries and real pixel arrays. At 1520 × 1105, warmed
introduction samples changed from about 241 ms to 0.05 ms in English and from
227 ms to 0.07 ms in Russian. Repeated full-stage pixel reads changed from five
per frame to zero; a later uncached label sample took about 5–7 ms after cropping.
These numbers isolate CPU filter work: they are not browser FPS or pixel-parity
measurements.

The focused cache, measurement, source-branch and quiz-progression suites passed
18/18. Manual acceptance must still check both languages, animated shadows and
text placement, playback/sound, all question gates, and visual smoothness after
a full page refresh. No publication is part of this local follow-up.

## Source transport and completion-action follow-up

The six measurement renderers now expose the same optional
`setPlaybackState(boolean)` method as Sphere. Source `pp`/`Buttonp` controls
are independently stopped two-frame sprites, not animations to advance with
the root timeline. The reviewed sprites are Area EN 15, Area RU 15/114,
Polygon EN/RU 16, Circle EN 21/195 and Circle RU 21/176. Their recovered classes
select frame 1 for Play and frame 2 for Stop/Pause using `gotoAndStop`; the
native patch selects those frames from actual transport state.

The existing Sphere AST patcher was extracted into
`scripts/reviewed-playback-control.mjs`. Sphere keeps its previous wrapper API,
state name, marker and all six existing media files unchanged. The new
`measurement-playback-control.mjs` wrapper restricts the patch to the reviewed
measurement source variants, including both sprites when a source replaces its
transport later in the film. `recoverMedia.mjs --patch-reviewed` updates existing
audited modules without exports; `--convert-reviewed` also applies it after
normal conversion. No other artwork frame, audio or disposal logic is changed.

Native invisible Play/Pause hit regions follow the source artwork throughout
its actual **inclusive global** placements:

| Source | Transport artwork ranges |
| --- | --- |
| Area EN | 17–1092, 1109–1527, 1544–2007, 2024–2553 |
| Area RU | 17–1092, 1109–1527, 1544–2008, 2025–2554 |
| Polygon EN | 1–903 |
| Polygon RU | 1–904 |
| Circle EN/RU introduction | 127–1375 |
| Circle EN/RU correct-answer feedback | 1627–1650, 1700–1723, 1772–1795, 1844–1867, 1916–1939, 1988–2011, 2060–2083; 2132 only |

Area's hit silhouette is `(-5.4,-3.35,105.9,40.75)` transformed by scale
`0.6688995361328125` and translation `(16.25,22.95)`. Polygon uses the same
silhouette at `(22,329.35)`. Circle uses `(-.5,-4.2,90.95,39.35)` at
`(19.55,352.75)` in the introduction. Feedback starts at `(462.2,155.95)`,
except frame 1700 at `(467.25,141.95)`; the following 23 frames move the control
to `(463.05,153.7)`, or `(463.05,147.7)` after frame 1700. These shifts are
retained in `sourceControls.ts`, rather than extending one guessed rectangle
across all feedback. Stops use `sourceArtwork: true` so semantic hit areas do
not cover the authored buttons with replacement capsules. Initial semantic
labels explicitly say Play in both languages, including Polygon.

After actual completion, an in-stage **Try it yourself** /
**Попробовать самостоятельно** action opens the existing explorer. Once
mounted, its heading receives focus without an extra browser focus-scroll,
and scrolls into view smoothly unless reduced motion requests immediate
scrolling. The explorer remains absent before completion. Restart closes it.
Circle's question/retry gates are unchanged; this action cannot skip them.
Sphere's wrapper receives the same completion action while keeping its separate
post-lesson quiz.

Checks: focused Sphere/measurement patch and Circle branch regressions passed
**10/10**. Synthetic readable and compact fixtures cover every reviewed sprite,
multiple controls in one source, independent renderers, unrelated animation,
disposal and fail-closed variant/coverage checks. All six measurement modules
passed syntax/idempotence checks; all six Sphere modules returned byte-identical
content from the extracted patcher. No recovered drawing code was executed.
No browser, compiler, build or export was run for this follow-up. Canvas DPR
sharpness, shared transport behavior and the completion overlay implementation
belong to Main. Manual acceptance must check in-picture Play/Pause in each
range, both languages, no cycling control labels, all Circle gates, and explorer
reveal/focus/scroll after completion and after Restart.

## Original animated lessons and audio

All three activities now open their recovered animated lesson as the primary
experience, with explicit Play, original event audio, source stops and native
controls. The prior SVG mathematical explorers remain optional, collapsed
follow-ups after actual lesson completion. They no longer replace the films or
disclose formulas before the authored teaching sequence.

Six read-only source variants were recovered:

| Lesson | Language | Frames at 24 fps | Initial frame | Authored manual stops before completion | Root sound cues / used MP3s |
| --- | --- | --- | --- | --- | --- |
| Area | EN | 2553 | 17 | 17, 1109, 1544, 2024 | 18 / 12 |
| Area | RU | 2554 | 17 | 17, 1109, 1544, 2025 | 18 / 12 |
| Area of polygon | EN | 907 | 1 | 1 | 4 / 4 |
| Area of polygon | RU | 907 | 1 | 1 | 4 / 4 |
| Circle | EN | 2178 | 127 | Intro plus eight question, wrong-answer and correct-answer stops | 42 / 14 |
| Circle | RU | 2229 | 127 | Intro plus eight question, wrong-answer and correct-answer stops | 52 / 23 |

`public/media/measurement/native/{area,polygon,circle}/{en,ru}/timeline.mjs`
contains six converter-audited Canvas drawing modules, **11,328** global
one-based frames in total, approximately **26 MiB** uncompressed. They are lazy
media, never imports from the eager manifest. The same directories contain
77 exact original embedded MP3 payloads and six `audio.json` recovery records.
69 asset entries are referenced by the 138 root cues. Additional extracted
button sound definitions are retained as evidence, not mislabeled narration.
`lessonData.json` contains only the runtime lesson metadata. The offline
family helper `recoverMedia.mjs` reproduces audio recovery, serialized bounded
drawing exports, and reviewed conversion without changing shared tooling.

Source evidence: complete English/Russian root timelines and playback classes
for Area, Area of polygon and Circle; extracted bilingual texts from the prior
review; binary sound inventories; XFL scene/frame placements and transport hit
silhouettes. Native transport hotspots follow the actual source placements.
Generic sound filenames do not establish speech: this restores original audio
without claiming every clip is narration or synthesizing new speech.

### Circle question gates

The Circle film cannot run through a question via generic Play/Continue.
Every question and wrong-answer retry stop is blocked. The only authorized
actions at a question are the four original choices, routed using the verified
answer keys `[2,3,2,4,3,4,2,3]`. A wrong choice runs the original wrong-feedback
frames and can retry only that question. A correct choice enters the original
correct-feedback stop, whose explicit continuation proceeds to the next
question. These are constrained source-controller actions, not a seek menu.
The same player remains mounted, preserving event-audio lifetimes.

English question stops are
1604/1677/1749/1821/1893/1965/2037/2109; Russian stops are
1622/1696/1769/1841/1913/1984/2055/2128.
Wrong-feedback stops in both sources are
1626/1699/1771/1843/1915/1987/2059/2131.
Correct-feedback starts are
1627/1700/1772/1844/1916/1988/2060/2132.
All eight correct branches are required before congratulations and the optional
explorer become available. The semantic question text and choices preserve
locale units and mathematical clarifications; authentic diagrams remain in the
animated source stage. There is no second, duplicate quiz in the explorer.

Shared playback owns explicit audio consent, reduced-motion pause behavior,
hidden-tab suspension, asynchronous loading, error recovery and teardown.
The source `stop()` calls do not themselves stop already-playing event sounds.
Locale/activity changes remount the family lesson; Restart hides the follow-up.
Source press/hover button effects are a remaining audio-parity limit: the binary
tool records one unsupported button-sound mechanism per variant. Root lesson
audio is recovered, but MP3 decoder padding, sound content and visual/audio
synchronization still require manual acceptance.

### Verification for this follow-up

- Six serialized Canvas exports completed; all six audited conversions passed.
  FFDec reported nonfatal “Cannot minimize script” warnings and left plain
  drawing code; no packed/evaluated JavaScript was imported.
- Generic audio recovery verified original payload hashes and measured positive
  MP3 durations. All six runtime definitions pass `validateOriginalLesson`.
- `node --check` passed for all six generated drawing modules.
- `node --experimental-strip-types --test tests/measurement-rules.test.mjs tests/measurement-source-branches.test.mjs`
  passed **7/7**, including both locales' source feedback bounds, next-question
  gates, final congratulations bounds and invalid-stage rejection.
- No browser, server, compiler, build or full-suite run. No unrelated test
  failures were encountered. Static conversion is not visual certification.

Manual acceptance: play both languages of all three lessons; continue every
authored Area stop; inspect original irregular-area examples, triangle and
trapezoid derivations; verify polygon film progression; answer every Circle
question wrong and correctly; confirm Play cannot bypass a question, retry
returns to the same question, final completion unlocks only the collapsed
explorer, Restart clears it, and audio pauses on hidden tabs and explicit Pause.
Inspect source transport and semantic answer controls on narrow touch layouts.

Remaining-solids audio inspection (no solids files changed): Cube sections has
zero root sound events and explicitly loads `Swinger-Singers.mp3`; embedded
sounds and the external track are not evidence for invented narration.
Tetrahedron EN/RU both contain the byte-identical 52.422-second sound 25
(`c2555bb4c5dadb5547b5df63439319af633f4894dad0e40da8aee4cd3ab0ebb5`).
Its speech/music semantics remain unverified; no narrated lesson was fabricated
from the presence of that track.

## Final sharded UX review

Reviewed all three manifest entries: `measurement-area` (rectangle,
parallelogram, triangle and trapezoid), `measurement-polygon`, and
`measurement-circle` including all eight question routes. References were the
English/Russian recovered text resources and main timelines for `Area`,
`Area of polygon` and `Circle`. Circle's English question stop frames
1604/1677/1749/1821/1893/1965/2037/2109 still agree with the native answer keys.
The bilingual source frames for questions four and six remain the primary
diagram references, without revealing a selected answer.

This pass adds the missing optional trapezoid decomposition: the central
rectangle uses the shorter base, and the two flank triangles together use the
difference of the bases. This reproduces the recovered `B2 × H` plus
`½(B1−B2) × H` derivation and remains valid when either editable base is longer.
Reset clears this reveal. The circle quiz now says to choose the nearest listed
value rather than instructing `π=3.14` for every question: question one's
preserved `50.26` option is inconsistent with `3.14 × 16 = 50.24`.
Diagram questions retain their source-specific `3.14` convention. Final-question
centimetre choices are localized for Russian.

At that review checkpoint, remaining source-parity work included Area's authored
irregular-shape counting examples (27.45 and 39.5), narrated cut-and-move
choreography and explicit film playback stops are still missing. Polygon and
circle exploration are static SVG rather than the authored film sequence.
Recreating these accurately requires tracing the original geometric timeline;
no new guessed examples or mandatory quizzes were introduced. Existing source
colors and explicit, timer-free exploration remained intact. The subsequent
original animated-lesson integration above supersedes these film omissions;
the SVG explorers remain supplementary.

Verification this pass:
`node --experimental-strip-types --test tests/measurement-rules.test.mjs tests/solids-rules.test.mjs tests/lesson-quiz-progression.test.mjs`
passed **15/15**. These are existing mathematical/quiz regressions; no visual
snapshot tests were added for presentation changes. No browser, development
server, compiler, build or full-suite run. Manual acceptance: compare trapezoid
decomposition with B>b, B=b and B<b; switch locales through all quiz questions;
try wrong answers, advance, finish, and restart.

## Area interaction follow-up

The area stage includes the full allowed trapezoid envelope: when B=1 and b=10,
the upper-left corner is at x=−2.5, which was clipped by the previous x≥0
viewport. A fixed −4…18 horizontal window now preserves the figure, height
annotation and unit-grid scale while changing parameters. The parallelogram's
top-left dot can be dragged horizontally with pointer capture; its integer
0…3 shear range matches the existing keyboard-accessible slider. The source
Area texts 68/78/82/86 describe parallelogram base/height and area preservation;
99/133 give the trapezoid sum-of-bases formula. This handle is a native control,
not a claim about original timeline interaction.

Source-only verification; no browser or compiler run. Manually check B=1,b=10
and B=10,b=1 trapezoids, then mouse/touch dragging beyond both shear limits and
keyboard slider adjustment. No mathematical rules or quiz text changed.

## Source styling follow-up

All three English XFL `DOMDocument.xml` files and their Russian counterparts
specify `#66ffff` stages. The interactive SVG stages now use this aqua background
without rounded panels. Area uses the recovered `#00ccff` figure fill; polygon
and circle subdivisions use source shape fills `#33ffcc` and `#ffcc99` with black
edges and Times New Roman diagram labels. Original quiz artwork is unchanged.
The visible adaptation-process footer has been removed; fidelity limits remain
documented here. Reviewed all three activities; no rules, quiz progression,
manifest metadata or shared APIs changed. Direct source/diff inspection only;
browser, compiler and build verification are left to integration.

Three bilingual **adaptations**, not frame-exact native restorations:

| ID | Exact original artifacts | Implemented coverage |
| --- | --- | --- |
| `measurement-area` | `Movies/Area.swf`, `Movies/Area-ru.swf` | Unit-square grid, rectangle product, parallelogram base/height and shear invariance, triangle half-parallelogram derivation, trapezoid average-base formula |
| `measurement-polygon` | `Movies/Area of polygon.swf`, `Movies/Area of polygon-ru.swf` | Regular hexagon decomposed into equal central triangles, apothem and perimeter, A = Ph/2; added 3–12-side exploration |
| `measurement-circle` | `Movies/Circle.swf`, `Movies/Circle-ru.swf` | Inscribed regular polygons approaching circle circumference/area; radius controls; all eight original quiz stages, options, retry/correct progression and congratulations; original bilingual diagram frames |

## Evidence inspected

Read recovery `README.md` and `MODERNIZATION.md`. Examined all six objects'
recovered `resources/texts` and ActionScript, including the play/pause clips and
main-timeline frame scripts. Inspected the English objects' reconstructed
`project/<name>.xfl/DOMDocument.xml` timeline metadata.

Area's recovered text explicitly explains counting squares, rectangle,
parallelogram, triangle and trapezoid formulas. The separate polygon lesson
explicitly uses six equal triangles, side a, apothem h and perimeter P.
Circle explicitly increases inscribed polygon sides toward infinity, giving
P → 2πr, h → r and A → πr². English/Russian sources share these concepts;
their playback stop frames differ. Modern controls are additions, not recovered
original interaction.

## Deliberate limits

- Original audio, timeline choreography and play/pause stops now belong to the
  primary native lesson. Exploration diagrams remain new SVG and do not animate
  automatically. The source film uses the shared player's suspension lifecycle.
- Area's triangle mode uses the recovered `Area/resources/texts/89.txt`
  formula `Area = 1/2 B x H`. A second congruent triangle completes a rectangle,
  demonstrating half-parallelogram area. Irregular shapes and original worked
  numeric examples are not reproduced.
- The polygon formula is restricted to **regular** polygons, not arbitrary or
  merely equilateral polygons. The original English wording “equilateral” is
  clarified rather than repeated as an overgeneralized mathematical claim.
- Circle restores all eight prompts/options in source order from English texts
  162–252 and Russian texts 142–240. English stop frames
  1604/1677/1749/1821/1893/1965/2037/2109 establish one-based keys
  `[2,3,2,4,3,4,2,3]`; Russian branches agree. Wrong choices retry the
  current stage; correct choices unlock the next stage; stage eight leads to
  congratulations, with an explicit restart control.
- The two diagram questions use original exported SVG frames: English
  1821/1965, Russian 1841/1984, under `public/media/measurement/circle-quiz*`.
  PNG inspection established the shaded 8×12 rectangle minus diameter-8 disc
  and the labelled ABC triangle with AC=r. Full source frames preserve artwork,
  options and oversized timeline headings; these are not runtime recordings.
  Adjacent semantic prompts/controls remain usable independently of image text.
- Source numeric choices and locale-specific units are preserved. The lesson's
  approximate π/rounding is disclosed instead of replacing choices with exact
  expressions. The pictured symmetric ABC configuration gives
  `100/3.14 × (1+√3/2)/2 ≈ 29.71`.
- Radius and side-count controls generalize source demonstrations. They do not
  claim to be original Flash controls.

## Verification

Focused Node tests protect equal-triangle area, polygon convergence from below,
quadratic radius scaling, triangle half-area, trapezoid/rectangle consistency,
all quiz retry/correct/completion branches and the two diagram answers.
`node --experimental-strip-types --test tests/measurement-rules.test.mjs tests/lesson-quiz-progression.test.mjs tests/solids-rules.test.mjs`
passed all 15 tests. No browser,
compiler, build or integrated-suite execution by this worker.

Manual integration checks: switch both locales; operate every range with keyboard
and touch; shear the parallelogram and confirm fixed area; compare equal trapezoid
bases with a rectangle; separate hexagon pieces; increase circle polygon sides;
answer each quiz incorrectly and correctly; reset; inspect narrow-screen labels.
