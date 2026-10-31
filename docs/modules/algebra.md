# Visual algebra restoration

The four audio-bearing lessons now open with original animated artwork and
embedded sound, not pages of replacement explanation. The two silent sums
remain SVG adaptations. No preservation-tree files were changed.

| Activity | Source | Primary treatment |
| --- | --- | --- |
| algebra-square-of-sum | Movies/Aplusbsquare.swf | Native drawing frames 1–855, eight root audio cues |
| algebra-difference-of-squares | Movies/Asqminbsq.swf | Native drawing frames 1–890, seven root audio cues |
| algebra-transformations | Movies/Algbra trans.swf | Native drawing frames 1–1710, ten root audio cues; source stop at 481 |
| algebra-quadratic | Movies/Quadratic eq.swf | Native drawing frames 1–4030, root cues through the final source stop; six original chapter targets |
| algebra-sum-integers | Movies/Sum1n.swf | Silent staircase SVG adaptation |
| algebra-sum-odds | Movies/Sum2n-1.swf | Silent odd-border SVG adaptation |

## Original animated lessons

`NativeLesson.tsx` composes the shared native lesson player with family-owned
audio inventories and lazily imported Canvas drawing modules under
`public/media/algebra/native/`. Play, Pause, Restart and Sound are explicit;
event-sound timing, trims, loops and envelopes remain source data. The shared
player owns loading, visibility suspension and disposal. No SWF, emulator,
generated HTML, ActionScript or exporter eval is executed or shipped.

Quadratic keeps the six source chapter destinations 37/851/1058/1312/1646/2646:
numeric squares 4/9/25; x²=c; x²+c=0; shifted square; monic completion and
discriminant; general equation. Source's initial stop 36 remains. Algbra trans
retains its distributivity prelude and stop 481 before the R derivation.
The source final stop 4030 ends Quadratic; its trailing unused frames are not
treated as another lesson.

After completion, the previous parameter/step experiments are optional.
Their domain corrections remain: 0<V<12, r>0 for the R example; a≠0 for the
quadratic formula; no undefined division. Numeric R is final-step-only.
Initial SVG descriptions do not announce later identities. No quiz was invented
for algebra.

There is only one source language for these four lessons. Russian controls do
not relabel English source artwork/audio as Russian narration; the UI states
the original language. The silent sum exercises retain translated controls.

## Evidence and recovery

Read recovered MainTimeline and play/pause scripts, extracted text, and
DOMDocument/resource timelines for all six activities. Quadratic chapter
evidence additionally includes recursive text from symbols
83/93/101/109/47/46/119/124/126/129/156. Archived Visualmath pages informed
the existing aqua stage presentation.

Audio extraction used `scripts/recover-lesson-audio.mjs`, preserving embedded
MP3 bytes and hashes. Family `*-audio.json` files retain source provenance,
root/nested cue inventories and unsupported categories. There are no nested
StartSound events in these sources. Source MP3 definitions: square 6,
difference 5, transformations 10, quadratic 17. Only cues through each lesson's
source final stop are scheduled.

Drawing used the existing serialized FFDec helper, explicit finite frame
ranges, two-CPU/768MB/120-second bounds, then the audited Canvas converter.
Packed initial exports were rejected without execution. Re-export with the
verified `packJavaScripts=false` configuration succeeded. Drawing code was
mechanically parsed/audited, never evaluated by recovery tools.

## Limits and acceptance

Native exports reproduce source vector/timeline drawings; browser fidelity and
audible synchronization still require user testing. Export does not execute
arbitrary source behavior. Original button hover/down sound tags in the
transform/quadratic inventories are separate from restored root audio; those
button effects are not claimed restored. Original soundtrack semantics have
not been listened to or classified as speech/music here. Copyright/redistribution
review remains governed by the project provenance policy.

The two silent sums still use step-controlled SVG rather than authored animation.
`Funnymathmult.swf` remains outside this family catalog: recovered metadata
identifies embedded H.263 video, not evidence for inventing multiplication rules.

Focused verification:

```sh
node --experimental-strip-types --test tests/algebra-rules.test.mjs tests/calculus-rules.test.mjs tests/calculus-lesson.test.mjs
```

14/14 passed. No pre-existing failure found. Main owns integrated type-check
and build; no browser, server, full suite or listening test was run by this slice.
Manual acceptance: four original lessons' Play/Pause/Sound/Restart; background
tab suspension; both manual teaching stops; all six quadratic chapters; optional
experiments after completion; EN/RU language notice; mobile stage/controls.

## Rendering performance review (2026-10-31)

All six activities were reviewed: square of a sum, difference of squares,
transformations and quadratic use the four native painters; integer and odd sums
use event-driven SVG with at most 110 cells and no animation loop. The first
three painters contain filter implementation helpers but no placed filter
effects, so they are unchanged.

Quadratic contained 1,610 repeated full-stage shadow groups around verified
static text. These now use the reviewed source-density crop and bounded filter
cache, retaining the authored shadows. Its 50 remaining blue-glow call sites
surround the composite `sprite37` in animated `sprite38`, not a verified static
text wrapper. They deliberately retain the original full-stage drawing path;
this is a remaining performance cost, not a claim of complete filter elimination.

`quadratic-text-bounds.json` is recovered from
`Movies/Quadratic eq.swf` (SHA-256
`c7cf28afa587d386160f9e6ecd332d590ea3398dcbf6c07cdeb0035e3b57f1fa`).
Both language entries honestly reference that same English original because
both shell locales use the same native lesson. Regenerate bounds with the
shared recovery script using this original for both `--en` and `--ru`, then run:

```sh
node src/modules/algebra/optimize-quadratic.mjs --apply
```

The optimizer verifies source provenance, saves hash-named originals under
`.cache/algebra-filter-originals`, syntax-checks the candidate, compares metadata
and export contracts deeply, checks repeat-application idempotence, and rejects
concurrent painter changes before replacement. It does not change lesson frames,
stops, narration, answer behavior, or chapter navigation.

Focused checks across algebra and calculus passed 27 tests, with one opt-in
actual-painter dispatch diagnostic skipped, and zero failures. No browser FPS,
pixel parity, sound synchronization, or visual acceptance is claimed. User
acceptance should check quadratic text/shadows throughout six chapters,
Play/Pause/Restart and the initial Begin gate.

## Painted source controls (2026-10-31)

Transformations' `pp_14` / symbol 41 is now a semantic transparent Play/Pause
target on global frames 481–1710. Quadratic's `pp_2` / symbol 63 is active only
on source frames 36–2693. Both are verified two-frame `go` / `halt` controls:
the native painter selects Play or Pause from the shared player state instead
of alternating with frame parity. The generic Begin / Make R overlay is
suppressed wherever the authored transport exists; original teaching stops
and completion frames remain unchanged.

Quadratic's six painted chapter buttons now invoke the same navigation path
as the retained HTML chapter shortcuts. Recovered `frame37` handlers and
`shoot1`–`shoot6` prove targets 37/851/1058/1312/1646/2646. These chapter
gestures start the selected chapter, can restart the currently selected one,
hide completed-lesson exploration, and preserve the user's sound setting.
They do not create a new answer/quiz route.

`source-controls.json` records source hashes and the recovered XFL Hit-state
geometry. `scripts/algebra-coloring-magic-playback-control.mjs --recover-controls`
reproduces it without modifying the preservation tree. After raw painter
regeneration, `--apply` on that script reapplies only the reviewed transport
sprite selection. It makes hash-addressed backups under
`.cache/algebra-coloring-playback-originals`, checks candidate syntax,
metadata/export equality, repeat-application idempotence and concurrent edits.
Existing text/filter caches and audio metadata are preserved.

Focused playback-patch and family rule/gate checks passed; Main owns integrated
type-check/build. No browser or listening verification was performed.
Manual acceptance: click the original Play at 481 / 36; pause/resume from both
painted control and toolbar; inspect all six painted/HTML chapter jumps with
sound muted, including repeating the current chapter; restart and leave the
activity; check narrow layout and both UI locales. Button hover/down effects
remain separate un-restored source behavior.
