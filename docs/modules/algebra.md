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
