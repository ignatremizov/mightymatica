# Visual reasoning restoration

## Original painted playback controls (2026-10-31)

The hand-counting lesson's painted Play button now starts playback. The same
missing hit targets were restored for the other source `pp` controls, including
both Paradox Box transport variants in Russian. Source Play/Pause sprites now
reflect transport state instead of alternating with animation time.
Burning house and Turtles retain their initial explicit Play stops; those
buttons and all three source Hint stops have transparent semantic hit targets.

Source hashes, exact authored spans and nested Hit-state matrices are recovered
by `scripts/recover-reasoning-logic-controls.py` into `source-controls.json`.
Only the 16 painters with reviewed two-state controls receive the mechanical
playback patch; other artwork, existing filter caches, narration and frame
metadata remain unchanged. Source and native question branches remain separate:
painted transport cannot leave the current bounded branch or bypass an answer.
The toolbar remains an alternative control path.

Regeneration reapplies `reasoning-logic-playback-control.mjs --apply reasoning`
after existing optimizations. Original painters are backed up under
`.cache/source-controls-originals/`. The Calculus XML reader's optional extra
button support preserves byte-equivalent default Calculus recovery output.

Manual checks: original Play/Pause and keyboard focus in both languages,
question/wrong/retry/correct branches, all three hints, restart and background
audio. Recovery, syntax and control-state tests do not establish browser pixel
alignment or listening fidelity.

Final integrated checks passed: TypeScript, 264 tests with one opt-in diagnostic
skipped, and the production build/native-loading gates. The updated local preview
entry, bundles and changed painters match their build hashes over localhost and
Tailscale. No browser automation, publication or listening verification was done.

## Tram animated-shadow fix (2026-10-31)

Both speakers' original shadows were still filtering the full display-resolution
stage on every frame. `optimize-tram.mjs --apply` now crops those effects to the
source-verified character bounds while keeping their independent animation clocks.
It covers all five original character sequences per locale: one 50-frame sequence
and four 49-frame sequences, with 2,742 root shadow placements in each source.

The bounded proof is shared with Earth-and-belt, through separate source-specific
adapters. It unions every pose with the original SWF ShapeBounds, quadratic
control hulls and conservative round NORMAL stroke expansion. Tram's original
fractional 0.4-width strokes are included. Unknown children, masks, effects,
blends, loop lengths and unsupported root transforms are rejected. Embedded
bitmap fills retain the previously verified immutable decoded-image lifetime.

Every frame, ratio and time argument is forwarded unchanged and included in
cache identity. This does not freeze the speakers, alter dialogue pacing or
change question/wrong/retry/correct routes or audio. Each renderer owns one
additional four-entry / 262,144-pixel cache, disposed before image cleanup.
Filtered layers use the established authored-density policy, not an assertion
of exact full-DPR pixel equivalence.

All 108 English and 100 Russian original artwork functions—including text,
fonts, buttons, shapes, images and sprites—remain byte-identical to their
immediate pre-fix versions. The generated optimization record retains exact
source hashes, all pose bounds and before/after painter hashes; originals are
in `.cache/tram-animated-originals/`. Recovery reapplies the fix after static and
nested-text optimization.

[The focused diagnostic](../reviews/tram-animation-performance.json) compares
twelve consecutive fresh-clock frames at 1520 × 1105 using actual filter
arithmetic and inert vector/image I/O. Median redraw costs changed from
492.685 to 5.002 ms (EN) and 470.956 to 4.465 ms (RU); full-stage reads changed
from 120 to zero per window. A first uncached draw still reached about 54–55 ms.
These are not browser FPS, rasterization, listening or pixel-parity measurements.
The older collection-wide report used 550 × 400 for Tram and is historical.

Checks: 23 focused cache/Earth/Tram tests passed; both full 1,371-frame sources
executed through the tiny inert Canvas; syntax, metadata/export preservation,
artwork equality and repeat-idempotence passed. Independent read-only review
found no concrete regression. Manual acceptance still needs both languages'
introductory dialogue, animated limbs/heads/shadows, answer/retry branches,
Pause/Restart and background audio. Hard-refresh to load changed native modules.

Final integration: TypeScript and the production build/loading checks passed.
The complete test run passed 253 tests, with one opt-in diagnostic skipped.
Both Tram and Earth optimizers revalidated their existing results without
changes. Only the two built Tram modules were refreshed in the composed local
preview; their localhost and Tailscale responses match the final hashes.
Both application entry files and preview services are unchanged. Nothing was
committed, pushed or published; a later release must refresh the corresponding
source package for the changed drawing modules and shared proof tooling.

## Source-bound embedded-bitmap follow-up (2026-10-31)

This supersedes Hunter's bitmap exclusion in the earlier static review. The
shared patcher now accepts only its exact closed source grammar: literal
clip path, balanced save/clip/restore, two constant transforms, immutable
embedded image decoded before renderer return, repeated pattern and fixed
fill rectangle. Both original binaries verify `shape28` bounds
`[0,0,1660,1643]`. Raw image helpers must match the same grammar; image aliases,
mutation, unknown escape paths, external/undecoded images and arbitrary clips
remain rejected.

The static family pass adds 1,220 cached outer shadow blocks per Hunter locale.
It also adds 256 cached outer glow blocks per Paradox locale: `sprite193` wraps
`shape177`, whose binary bounds are `[0,0,1180,760]`. That leaf matches the same
closed bitmap grammar, with a literal rectangular clip, constant 20× image
transform and constant image-edge correction. No broader helper was needed.
Existing nested patches remain intact, and the nested optimizer was not rerun.
Stroked shapes and animated Tram artwork remain excluded. No teaching sequence,
audio, question gate or effect parameter changed. Hashed backups, source
verification, candidate syntax, deep metadata/export comparisons, concurrency
and immediate repeat-idempotence guards apply. Main owns final profiling;
this follow-up does not claim browser FPS, pixel parity or audio verification.

## Source-bound static-composite follow-up (2026-10-31)

Reviewed all 22 mapped painters after the text-only pass, covering all ten direct
lessons and all nine Paradox selections. New `drawing-bounds-<key>.json` evidence
was recovered from each original binary using the reviewed static shape/text
importer. Source hashes match both `native-timelines.json` and the preserved
text-only evidence; every shared text rectangle is checked for equality.

`node src/modules/reasoning/optimize-static-painters.mjs --recover` recovers this
evidence and the banknote evidence without executing drawing code. `--apply`
checks the existing painters; `--verify` repeats the check without writing.
The family guard excludes **all stroked shape leaves**, avoiding any assumption
that a transformed ShapeBounds encloses arbitrary anisotropically scaled strokes.
Only the shared helper's reviewed solid-vector/placement-only grammar can qualify.
New changes, if eligible on regeneration, require hashed backups, candidate syntax,
deep-equal metadata/exports, idempotence and a concurrent-edit hash guard.

This review found **zero additional eligible static groups** and changed no media
bytes. Hunter's `shape28`, wrapped by `sprite29`, is clipped bitmap-pattern artwork
using image color transformation and Canvas transforms, not a plain solid vector.
It is deliberately rejected. Animated Tram artwork, stroke-bearing shapes and
nested-filter wrappers are also outside this pass; no authored effect was removed.
`static-filter-optimization.json` records all 22 before/after hashes, zero added
groups and per-painter excluded stroke symbols. Nested-filter work is a separate
coordinated follow-up and may supersede residual counts in the earlier review.

`export-native.mjs` now runs static evidence recovery/application after its existing
text optimization. It does not add nested-filter support. Shared cache/importer
tests passed 14/14 and focused reasoning rule/audio/gate tests passed 11/11.
All 24 mapped static checks repeated with zero changes; both new/updated scripts
passed syntax checks. No recovery export, browser, dense benchmark or build ran.

## Nested static-text follow-up (2026-10-31)

The subsequently reviewed one-frame, single-text-child rewrite now removes the
outer nested-text filter limitation described below. It fuses 118 Snail blocks,
109 Tram blocks and 490 Paradox blocks per locale. Qualified wrappers are
Snail `sprite31`, Tram EN `sprite79` / RU `sprite71`, and Paradox `sprite240`.
Their inner filtered text is painted directly with the composed placement,
then filtered in original inner-before-outer order at source density. The
original wrapper functions and existing static/shape caches remain unchanged.

Animated Tram artwork and Paradox's non-text chocolate glow are not flattened;
Hunter's bitmap-derived artwork also remains unchanged. No filters are removed,
and question gates, hints, audio, timings and all nine Paradox crops are retained.
This follows the approved source-density policy, not universal exact parity
with the earlier mixed-density DPR>1 path.

See [the nested-filter review](../reviews/nested-filter-optimization.md) and
its JSON companion for source hashes, actual-source leaf bounds verification,
wrapper counts, baseline backups, result hashes, reproduction and checks.
Four focused nested-filter tests pass, including tiny actual-filter arithmetic
probes for order, transparent intermediate composition, stage edges and
fractional placement. Browser/font pixel parity, FPS and listening were not
verified; no dense benchmark or integrated build was run by this pass.

## Source-text filter performance pass (2026-10-31)

Reviewed all 19 activities and all 22 English/Russian native painters. The ten
direct lessons are burninghouse, grandma, hunter, snail, staruhi, tram, turtles,
wine, bacteria and hand. The nine Paradox selections remain triangle, egg-eight,
area-two, area-four, chocolate, gnomes, eggs-nine-ten, people and equality;
they share the two Paradox painters and retain their existing scene bounds.

Recovered exact static DefineText bounds from each of the 22 preserved source
SWFs, with SHA-256 matching `native-timelines.json`. The bounds live in
`src/modules/reasoning/text-bounds-*.json`; reproduce them and the two banknote
bounds with `node src/modules/reasoning/recover-text-bounds.mjs`. This reads
source data only and never executes ActionScript or regenerates artwork.

Applied the reviewed source-density, bounded static-text filter cache directly
to 20 existing minified painters. It retains the original text vectors, authored
shadow/glow parameters, placement matrices and color transforms. Each timeline
owns its cache and disposes it with the renderer. No question, hint, narration,
timing, crop, playback or React component changed.

| Painter | Cached filter groups EN / RU |
| --- | --- |
| Paradox (all nine selections) | 2483 / 2483 |
| Burninghouse | 572 / 572 |
| Grandma | 1679 / 1679 |
| Hunter | 2925 / 3036 |
| Snail | 177 / 177 |
| Staruhi | 1114 / 281 |
| Tram | 1918 / 1237 |
| Turtles | unchanged / unchanged |
| Wine and milk | 2480 / 2480 |
| Bacteria | 512 / 506 |
| Hand | 430 / 430 |

The 27,171 groups are generated source locations, not simultaneous per-frame
operations. Turtles has no authored filter placements: its eight filter calls
are internal filter-library implementations, so neither painter changed.

`node src/modules/reasoning/optimize-painters.mjs --apply` reproduces the rewrite
for this family and dissections. It verifies source hashes, makes content-hashed
family-owned backups before replacement, checks candidate syntax, deep-compares
metadata and exports, checks idempotence, and refuses concurrent painter edits.
`filter-optimization.json` records each original backup and before/after hashes.
`--verify` checks current source evidence and idempotence without writing.

Remaining original full-canvas filter sites are deliberately retained. Per
locale, Hunter has 1220 shadows on shape wrapper `sprite29`; Paradox has 256
glows on shape wrapper `sprite193` and 490 outer shadows on `sprite240`; Snail
has 118 outer shadows on `sprite31`; Tram has 2851 shadows across
`sprite17/45/57/59/71/79`. The first five Tram wrappers contain 49/50-frame
animated artwork. `sprite79`, Snail's `sprite31` and Paradox's `sprite240`
contain static text with an already cached inner filter; safely flattening their
outer filters requires separately reviewed nested-filter support. No authored
shadows were removed and no vector/animated artwork was flattened.

Validation: all 20 replacements passed syntax, metadata/export and idempotence
checks; the unchanged Turtles variants passed the explicit no-placement check.
The three focused reasoning test files passed all 11 tests. No browser, server,
full suite, integrated compiler/build, full-density baseline benchmark, audio
listening, pixel-parity or FPS verification was performed. Useful manual checks
are all seven question → wrong → retry → solution paths, all three hint holds,
all nine Paradox crops, and bilingual text/shadows during playback and replay.
Actual-filter CPU/pixel probes are coordinated separately by Main.

## Interactive source-audio extension (2026-10-30)

The current primary experience for all 19 activities is now a native interactive
video lesson: existing original Canvas artwork plus source-frame event audio,
using the shared `OriginalLessonPlayer`. This supersedes the silent-player and
missing-prelude limitations recorded by earlier passes below.

Reused all 22 existing EN/RU Canvas modules without a frame export. Recovered
250 original embedded MP3 definitions and 323 root StartSound cues from exactly
the 22 corresponding source SWFs (9,879,214 audio bytes). Every recovered source
hash matches its existing Canvas mapping. `lesson-audio.json` retains exact
sample counts/rates, MP3 seek samples, event/start/stop semantics, loops, trims
and stereo envelopes; per-source inventories/hashes live beside the MP3s under
`public/media/reasoning/audio/<lesson>-<locale>/source.json`. These assets load
through the shared player as needed, never through the catalog manifest.

The seven introductory sequences are restored from frame 1 through their exact
question stop. Only reaching that finite endpoint exposes the semantic choices.
There is no Continue or seek path through a question gate. A wrong answer mounts
the original wrong branch through its source stop, then offers Try again; a
correct answer mounts only the correct branch. Branch metadata excludes cues
from all preceding/wrong branches, so audio reconstruction cannot replay a wrong
answer during a correct solution. Snail's correct branch is the source's single
frame 1160 with its event sound, not the unused tail. Bacteria RU's declared
1282-frame source still stops at recovered-script frame 1052; its unused tail
adds no root sound events and is not required by this lesson.

Burninghouse, Turtles and Wine/milk now use one continuous source lesson with
manual hint stops at 515, 722 and 940. Their explicit Show hint actions resume
the authored timeline without resetting active event sounds. They have no new
quiz. Burninghouse and Turtles initially display their authored Play stop at
frame 2; Wine/milk and the seven question introductions begin at frame 1.
Mathematical explorers, corrected commentary and additional hints become
optional supplements after the source lesson completes. All nine Paradox scenes
use their exact previously mapped bounds, triangle at 10 fps and the others at
24 fps. Cues are clipped per scene so a previous scene cannot leak sound into a
new selection. Their optional explanations reset on restart/locale change.

Recovery is reproducible with `node src/modules/reasoning/recover-audio.mjs`,
which invokes the reviewed binary recovery CLI sequentially for these 22 variants
and the two owned bills variants. No ActionScript execution, image rendering,
transcoding, installation or source-archive writes occur.

Remaining audio limit: every reasoning source contains a DefineButtonSound tag.
The binary tool records but does not resolve those button hover/click transition
sounds; no invented root cue substitutes for them. None of these sources has
nested StartSound events or an audio stream needing placement reconstruction.
Paradox's recovered pause control calls `SoundMixer.stopAll`; native Pause
suspends audio and supports resumption instead. Track semantics have not been
listened to or transcribed: generic embedded recordings are not all claimed to
be narration. Painted source controls still have native semantic equivalents
rather than executable Flash hit targets.

Verification: `node --experimental-strip-types --test
tests/reasoning-audio.test.mjs tests/reasoning-question-gates.test.mjs
tests/reasoning-rules.test.mjs` — 11 passed. The new regressions cover finite
question boundaries, wrong/correct audio isolation, explicit manual hint holds
and Paradox scene isolation in both locales. No browser, server, compiler, build,
full suite, repeat Canvas export or listening verification was performed.
Main owns shared player verification; its singleton-frame completion fix covers
Snail and returned question cards without advancing beyond their source stop.
Manual acceptance must check synchronization/listening in both locales, all seven
intro→wrong→retry→correct paths, source hint stops, pause/resume/mute/restart,
hidden-tab/navigation cleanup, reduced-motion explicit Play, zoom and mobile fit.

## Final source-first UX review (2026-10-30)

Reviewed all 19 entries: burninghouse, grandma, hunter, snail, staruhi, tram,
turtles, wine, bacteria, hand, and paradox triangle, egg-eight, area-two,
area-four, chocolate, gnomes, eggs-nine-ten, people, equality. Compared all
English MainTimeline classes in full, Russian branch/stop registrations, recovered
English text resources, XFL document/stage definitions, and existing native
timeline/scene metadata. Preservation roots remain unchanged.

The original illustrated sequence is now primary after each required answer,
and initially for the three ungated lessons. Mathematical SVG explorers are
optional supplemental details. Correct answers enter their actual source branches
(502, 941, 1160, 1198, 904, 524, 694) rather than replaying introductions and
wrong-answer cards. Snail ends on source stop 1160, not its unused exported tail;
Russian Bacteria ends on its own stop 1052. Burninghouse, Turtles and Wine/milk
stop at their source hint boundaries (515, 722, 940); an explicit hint action
opens the continuation. No additional mandatory quiz was introduced.

All seven question gates, disabled before-answer reveals/hints, retry feedback,
reset and locale reset remain. Nine Paradox scenes retain their source scene
bounds and rates; invented midpoint/final checkpoint buttons were removed.
Play/pause, restart and accessible seeking remain. Locale changes now reset the
Paradox explanation and magnification as well as its artwork.

Focused verification: `node --experimental-strip-types --test
tests/reasoning-question-gates.test.mjs tests/reasoning-rules.test.mjs` — 8 passed,
including a correct-branch regression. No browser, compiler, full suite, build,
media export or original-source mutation was performed.

Remaining parity limits: introductory cartoons before the seven questions are
still replaced by the fixed source question illustration plus the full textual
premise; wrong-answer feedback is semantic text rather than the original short
animation. Painted source controls are not hit targets; equivalent native controls
remain below the illustration. Original audio is not restored. Explicit Play is
retained rather than source autoplay. Shared hidden-tab/unmount and reduced-motion
behavior was inspected, not modified or interactively verified. User testing is
needed for loading, both locales, source hint transitions, all seven wrong/correct/
reset paths, keyboard/touch controls, magnified cuts and narrow layouts.

The historical implementation notes below describe earlier restoration passes;
the current sequence and control behavior is specified by this review.

## Required original questions

Grandma, Hunter, Snail, Two walkers, Tram, Bacteria, and Hand now require the
correct original multiple-choice answer before mounting the solution explorer,
enabling hints or explanation, or opening the full original illustration
timeline. Incorrect answers display retry feedback and leave the question
available. Start again clears the answer, hints, explanation, explorer state,
and native timeline. Changing locale also starts a fresh question.

Before answering, the original problem illustration is shown at the source
question stop, with the timeline bounded to that single frame and no playback,
restart, or seeking controls. Thus it cannot advance into an explanation or a wrong-answer branch.
The textual problem remains available while artwork loads or if it cannot load.
Modern semantic answer buttons reproduce the source choice order in each locale;
painted source buttons remain artwork. No new quiz is imposed on Burninghouse,
Turtles, or Wine and milk, whose source timelines do not require one.

The question data was compared directly with recovered text resources:
Grandmaclimbes 54/59/64–67; Hunter 55/65/86/88/91–94; Snail-eng
48/57/68/73–76; Staruhi-eng 61/66/76/77/82/88/90–93; Tram 78/83–86;
Bacteria 8/24/32/34–38; Hand1000 4/35/52–56. Russian choices use
Grandmaclimbes-ru 64–67, Hunter-ru 91–94, Snail 73–76, Staruhi 84–87,
Tram-ru 75–78, Bacteria-ru 31–34, and Hand1000-ru 53–57.
The source question/correct-branch frames are respectively 479/502, 918/941,
1137/1160, 1175/1198, 881/904, 501/524, and 671/694.
Exact recovered quiz prompts and choice text accompany the contextual modern
problem summaries, rather than replacing all lesson copy with a transcription.

Focused verification: `node --experimental-strip-types --test
tests/reasoning-question-gates.test.mjs tests/reasoning-rules.test.mjs`.
Browser, compiler, build, and full-suite verification remain Main's responsibility.
Manually check each wrong answer, correct unlock, reset, locale switching, loading
failure, and keyboard answer selection; confirm the fixed question illustration
cannot be advanced before answering.

## Direct river interaction

Burninghouse's water stop now supports tapping/dragging along the river alongside
the labelled range input. Coordinates use the SVG screen transform and the same
0–10 range and 0.1 step. Route mathematics and educational checkpoints are
unchanged. The recovered MainTimeline's stops at frames 515 and 580 remain
available in the separate illustrated animation. Focused Escher/reasoning tests
passed (9 total). No compiler or browser was run; manually check scaled/narrow
SVG placement, capture outside the river, and keyboard slider operation.

## Presentation reference pass

All ten native lesson explorers and all nine Paradox Box entries were reviewed
against their recovered stage definitions and existing source timeline mappings.
`Burninghouse`, `Grandmaclimbes`, `Snail`, `Staruhi`, `Turtles`,
`Wineandmilk`, `Bacteria`, `Hand1000`, and `Paradox box` use aqua stages;
`Hunter` intentionally uses blue `#0000ff`, while `Tram` uses `#000066`.
Recovered typography is principally Times New Roman, with Comic Sans used
in some illustrated lessons. The native explanatory SVGs now use aqua,
black serif labels, blue routes and square framing instead of a dark dashboard
palette. Hunter retains a blue diagram and Tram a navy table. These CSS rules
target only the new SVGs, not the original Canvas illustrations.

Implementation-process notices were replaced by concise viewing instructions.
Source artwork remains opt-in and answer warnings, hint progression, reset,
locale selection, lazy loading and timeline controls are unchanged. No generated
media was modified. Native simplified figures are still adaptations rather than
the original illustrated characters. No browser, compiler, build or tests were
run for this presentation-only pass. Manual review is needed for the ten lesson
diagrams, table contrast, both locales, nine rearrangements and magnified cuts.

Ten mathematical adaptations and nine full-frame native Canvas Paradox Box scenes
from Yuri Remizov's recovered MightyMatica lessons.
All catalog entries use `fidelity: "adaptation"`: the original questions,
numerical facts and intended answers are retained. The principal explorers
replace Flash cartoons and timing with new diagrams, retaining required
multiple-choice questions; optional native Canvas sequences retain every original illustrated frame.
Original audio is not reproduced.
The controls are manual steps, range inputs, and explicit hints/explanations.
There is no autoplay or time-based work, so reduced-motion behavior is inherent.
All controls are native DOM elements and diagrams are responsive SVG with an
accessible title; text status provides the numerical/state counterpart.

## Catalog and exact covered objects

All paths below are original paths relative to the preserved raw site.

| Activity ID | Original source paths | Preserved lesson |
| --- | --- | --- |
| `reasoning-burninghouse` | `Movies/Burninghouse.swf`, `Movies/Burninghouse-ru.swf` | Shortest route via a river, solved by reflecting B to B′ |
| `reasoning-grandma` | `Movies/Grandmaclimbes.swf`, `Movies/Grandmaclimbes-ru.swf` | First to fifth takes five minutes; first to ninth takes ten, by counting flights |
| `reasoning-hunter` | `Movies/Hunter.swf`, `Movies/Hunter-ru.swf` | South/west/north return route and white polar bear |
| `reasoning-snail` | `Movies/Snail-eng.swf`, `Movies/Snail.swf` | Two metres up, one down, ten-metre destination, arrival on day nine |
| `reasoning-staruhi` | `Movies/Staruhi-eng.swf`, `Movies/Staruhi.swf` | Noon meeting, arrivals four and nine hours later, sunrise at six |
| `reasoning-tram` | `Movies/Tram.swf`, `Movies/Tram-ru.swf` | Product 36, ambiguous sum 13, unique eldest son |
| `reasoning-turtles` | `Movies/Turtles.swf`, `Movies/Turtles-ru.swf` | Three straight-line turtles; the last turtle lies |
| `reasoning-wine` | `Movies/Wineandmilk.swf`, `Movies/Wineandmilk-ru.swf` | Equal return transfer gives equal amounts of foreign liquid |
| `reasoning-bacteria` | `Movies/Bacteria.swf`, `Movies/Bacteria-ru.swf` | Every-second doubling, full at sixty seconds, half at fifty-nine |
| `reasoning-hand` | `Movies/Hand1000.swf`, `Movies/Hand1000-ru.swf` | Nonduplicated endpoint counting cycle of eight; index finger at 1000 |

Both locales share one implementation. English and Russian recovered text was
compared for each pair, and corresponding quiz answer handlers were checked.
Russian Snail/Staruhi use the unsuffixed objects; their English versions use
`-eng`. Hunter deliberately preserves miles in English and kilometres in
Russian. Modern copy is edited/translated rather than a verbatim transcription.

## Reference evidence examined

Read the recovery root `README.md` and `MODERNIZATION.md`. For every row above,
read `objects/Movies/<name>/resources/texts/*.txt`, the recovered
`actionscript/scripts/*/MainTimeline.as`, and timeline frame ranges in
`project/<name>.xfl/<name>/DOMDocument.xml`. Read the English controller scripts
fully and compared the language variants' frame/answer dispatch.
The available `pp_*` scripts are play/pause controls, not mathematical rules.

Specific source anchors:

- Burninghouse texts 51/60/68/70 and 76–81: river requirement and B′ reflection.
- Grandmaclimbes texts 54/59/64–67/96/111: first-floor starting convention,
  answer choices and flight-count explanation; quiz button 3 is correct.
- Hunter texts 55/65/86/88/91–94/147: three compass legs and North Pole reveal;
  quiz button 2 is correct.
- Snail texts 48/57/68/73–76: climb, slide, target, choices;
  quiz button 2 (nine) is correct.
- Staruhi-eng texts 61/66/76/77/82 and 124–134: sunrise, noon, arrivals and
  the two velocity equations; quiz button 2 (six) is correct.
- Tram texts 47–78/115/118/126: dialogue, complete factor list and eldest son;
  quiz button 3 (thirteen) is correct.
- Turtles texts 33/36/52/55/66: all three claims and original lying punchline.
- Wineandmilk texts 39/49/51: foreign-liquid comparison and volume conservation.
- Bacteria texts 24/32/34–38/69: doubling period, full time and backward reasoning;
  quiz button 4 (fifty-nine) is correct.
- Hand1000 texts 35/52–56/88–99: finger names and period-eight explanation;
  quiz button 4 (index) is correct.

## Deliberate differences and coverage gaps

- Diagrams use newly authored geometry and no recovered illustration or audio.
  There are no claims of visual or timeline equivalence.
- Burninghouse's coordinates and route units are illustrative. The reflected
  construction and route minimization are mathematical equivalents.
- Hunter's polar projection is schematic, not a metrically correct quarter-circle
  walk. The original intended North Pole answer is preserved, but its uniqueness
  is qualified: the route alone admits special South Pole-adjacent solutions.
- Staruhi is a static distance schematic with an adjustable hypothesized
  pre-noon duration; it is not a timed reconstruction of the two walkers.
- Wine/milk uses an explicitly illustrative 10/4/1-unit setup and uniform-mixing
  arithmetic. The proof explains why equal foreign volumes do not require uniform
  mixing. Components are displayed as separated bands for legibility.
- Bacteria shows capacity proportion, not individually animated organisms.
- Original quiz buttons are replaced by semantic multiple-choice buttons for
  the seven required questions. Their explorers and optional hints are available
  only after a correct answer. The other three activities retain ungated
  exploration because their source has no required multiple-choice question.

## Paradox Box: original cuts and illustrations

Both `Movies/Paradox box.swf` and `Movies/Paradox box-ru.swf` are now represented
by nine catalog entries. The source MainTimeline's scene-button dispatch was
mapped to the XFL stage ranges below. English source artwork is retained in
both locales, with translated modern controls and optional explanations.
Separate complete English and Russian drawing modules preserve the corresponding
source language's embedded text and illustrated characters.

| ID suffix after `reasoning-paradox-` | XFL scene | Global one-based source frames |
| --- | --- | --- |
| `triangle` | Scene 2 | 61–502 |
| `egg-eight` | Scene 3 | 504–936 |
| `area-two` | Scene 4 | 938–1356 |
| `area-four` | Scene 5 | 1358–1771 |
| `chocolate` | Scene 6 | 1773–2378 |
| `gnomes` | Scene 7 | 2380–2684 |
| `eggs-nine-ten` | Scene 8 | 2686–3174 |
| `people` | Scene 9 | 3176–3481 |
| `equality` | Scene 10 | 3483–4121 |

These are not generic reconstructed illustrations: **every source frame** is
exported as Canvas drawing instructions with FFDec 26.2.1, retaining the original
cuts, characters, photo fragments, colored pieces, and stage composition.
Each language module contains all 4,122 source frames, including the menu and
terminal hold. `paradox-scenes.json` records the nine playable scene ranges.
The triangle runs at its source-script rate of 10 fps; the subsequent scenes use
the source-script rate of 24 fps. No raster-frame slideshow remains.

Native controls provide per-frame keyboard/touch scrubbing, play/pause,
restart, source-arrangement checkpoints, and a scrollable magnified view.
Playback pauses in hidden tabs using the shared animation lifecycle and is
unavailable under reduced motion; manual steps remain available.
Original printed Flash controls remain visible as part of the artwork but are
not clickable—the native toolbar replaces them.

This is a **native graphics/timeline adaptation**, not native per-piece dragging
or an execution of the old ActionScript. No Flash, Ruffle, iframe, eval,
`Function`, remote script, or SWF is bundled in the family.
The source-derived drawing JavaScript is mechanically converted to local ESM
using the shared audited converter, which replaces dynamic symbol dispatch with
an explicit frozen function table and rejects unsupported execution features.
The reviewed drawing modules load only when the corresponding timeline is
opened. Source buttons are painted, not old ActionScript hit targets; the native
DOM controls replace them. Mathematical exploration and reveal behavior remain
separate native components.
The optional explanations are modern mathematical commentary, not claims of
recovered source narration. Subtle area discrepancies require visual review.

The ten earlier reasoning lessons also offer opt-in **full-frame** original
illustration timelines in both languages, preserving original characters
alongside the new diagram. These
details are closed by default and warn that the source sequence can contain
answers. `native-timelines.json` records all 22 converted objects, exact original
paths, source hashes, frame counts, frame rates and local module paths.
All 22 outputs passed the converter's AST audit and `node --check`.
After a correct required answer, source quiz branches are available on the scrubber rather than executable:
sequential playback can show a wrong-answer branch before the explanation.
Original audio/narration is not restored, and source buttons are not clickable.
Those limitations mean these remain `adaptation`, not an exact interactive
restoration or a claim of pixel-verified parity.

Regenerate only within the owned media folder:

```sh
node src/modules/reasoning/export-native.mjs
```

The script delegates rendering to the shared serialized export helper and
audited Canvas converter, then syntax-checks each output. It needs the already
installed FFDec and full JDK with fontmanager support; no dependency installation
is performed. Disposable raw HTML/Canvas exporter output is removed after a
successful conversion. The 22 modules contain 30,049 contiguous source frames,
totaling 106,403,089 bytes uncompressed (37,021,128 bytes independently gzip-compressed).
They are independently lazy-loaded by family and locale; HTTP compression is
important. Nine retained WebP images are catalog thumbnails,
not an animation-frame fallback. The earlier 27 MiB sampled-frame experiment
and its dead player were removed from the owned media tree.
No archive file is changed. Original illustration rights are retained; no new
blanket license is granted.

## Verification

Focused command:

```sh
node --experimental-strip-types --test tests/reasoning-rules.test.mjs
```

Five tests pass: finger reversal/1000, snail terminal arrival, ambiguous tram
factorization, reflected shortest route, and equal foreign-liquid conservation.
All generated modules passed source AST audit and `node --check`; all referenced
native module paths and declared frame ranges were checked against local files.
No browser, dev server, full suite, type-check or build was run by this worker;
integrated verification belongs to Main.

The nine Paradox Box terminal frames were visually inspected as a rendered
contact sheet (not through a browser); this confirmed original illustrations
and scene mapping, not interactive UX correctness.

Manual checks still needed: keyboard/touch range and step controls, hint/reveal
and reset in both locales, narrow-screen labels, the final snail day/night
transition, the hunter's diagram interpretation, and route changes around the
shortest river stop, all Paradox Box cuts at magnification, scene-stage playback,
and original-illustration details. No browser interaction correctness is claimed
without that review.
