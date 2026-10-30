# Source-first UX and audio review

This is a maintainer handoff, not a public restoration report or a certification
of frame-perfect parity. The review covers all 143 registered activities in
20 families. Source inventories include 203 content SWFs and four support SWFs;
the external cube-sections film is also accounted for.

## Review boundaries

The original archives remain read-only. Reviewers compared recovered
ActionScript, scene/frame registrations, XFL artwork and text, sound linkage
and binary sound events with the native activities.

Source questions, Hint stops, correct/wrong/retry branches, and direct dragging
or drawing take precedence over replacement explanation pages. Keyboard and
inspection controls supplement those interactions.

Explicit user choices remain exceptions:

- Jigsaws allow continuous free placement and movable connected groups,
  including completed pictures.
- Completed pictures use clean original artwork instead of visible tile seams.
- Decorative Escher artwork loops with Play/Pause rather than frame counters.
- Book zoom uses document flow; fullscreen contains the reader only.

## Sharded coverage

| Family | Activities | Main fixes or checks |
| --- | ---: | --- |
| Algebra | 6 | Original audiovisual lessons for the four audio-bearing titles; chapter order and distributivity; explorers follow the lesson |
| Books | 7 | Full scans, free document-flow zoom, fullscreen, ±3-page preloading, page-turn gestures and scroll retention |
| Calculus | 11 | Source graph controls and three-panel composition; original bilingual lesson with all 23 question/retry gates per language |
| Coloring | 9 | Original questions and Hint gates, source palettes, direct rotation, colored selectors, original audio and cube counting sequence |
| Dissections | 1 | Banknote drawing/audio timeline; no invented arrangement checkpoints |
| Escher | 13 | Source sliding deals, freeform grouped pictures, completion-gated celebration, original sound cues and silent decorative loops |
| Falling figures | 1 | All four modes; source target regions, automatic acceptance, original completion animation and effects |
| Films | 9 | Original audiovisual playback, native volume/mute agreement, visibility and teardown |
| Fractals | 3 | Original audiovisual introductions and stops, carpet handoff/zoom, source Buffon controls, Möbius transport and dragging |
| Kids | 11 | Original artwork and 98 source question gates, native transitions/audio, pointer feedback and completion |
| Logic | 7 | Direct coin/bead dragging and necklace drawing, Stones memory sequence, original Wisemen audiovisual lessons and toy sounds |
| Magic | 6 | Source reveal/Hint sequence, original subtraction/hourglass audiovisual lessons, opt-in MindReader cue, maze input fixes |
| Measurement | 3 | Triangle/trapezoid derivations, direct shear, original audiovisual lessons and eight Circle question routes |
| Motion | 10 | Visible ladder-length changes, source audiovisual questions and feedback, integer cycloid orbits and stable view sizing |
| Quiz | 2 | Original questions, failure/prize/lifeline flow, restored source music and explicit source-defect disclosures |
| Reasoning | 19 | Original audiovisual presentation, seven answer gates and separate feedback branches, hint boundaries and paradox scenes |
| Solids | 3 | Primary narrated Sphere film with authored pauses, direct cube/tetrahedron rotation, source soundtracks and corrected quiz |
| Spatial | 8 | Original net art/assignments and stages, drag swaps and rotation, pair connectors, source calendar sequence and available audio |
| Stories | 3 | Source scattered artwork, freeform groups, clean completed picture, parent clips separated from audio-bearing cartoons |
| Triangles | 11 | Original audiovisual lessons, 84 question gates, source geometry interludes and verified mathematical corrections |

## Shared playback

`OriginalLessonPlayer` owns global one-based frames, lazy native drawing
chapters, source manual/timed holds, and authorized question/retry actions.
Play cannot turn an answer gate into a generic Continue action. There is no
public frame counter or unrestricted lesson seek control.

`LessonAudio` schedules original event sounds against active presentation
time, retaining source trim points, loop bounds, stereo envelopes and MP3 seek
metadata. Narration continues through an authored visual hold. User pause,
hidden documents and unloading suspend or release owned sound. Audio starts
only after an explicit user action; music/effects remain distinguished from
narration instead of assigning guessed voices to activities.

The shared fixes include single-frame completion, waiting-state refresh at
chapter boundaries, integer animation ticks for exported nested sprites,
same-question wrong actions without duplicate root sounds, bounded celebration
sound reuse, and interpretation of a few malformed source envelope marks
without reordering their final fades.

Source audio recovery is reproducible through
`scripts/recover-lesson-audio.mjs`. Native drawing recovery uses the serialized
exporter and fail-closed converter. No SWF, ActionScript, Flash runtime, raw
export HTML, or string evaluation is part of the application.

## Verification and remaining acceptance

The integrated review check passed TypeScript and 171 deterministic tests, and
the final check after asset optimization also passed. Both production builds,
their artifact gates and the combined portfolio composition succeeded. Ten
representative resources matched both generated outputs and both preview hosts
byte-for-byte. Exact delivery sizes and verification details are recorded in
`COMMUNICATION.md`. Individual family documents retain source evidence and the
narrow checks performed by their owners.

The 184 optimized generated drawing modules retain their exports, complete
metadata and provenance comments. Representative drawing-command comparisons
across all 16 affected families passed; this is not a pixel-level comparison.
The complete collection is large and remains loaded on demand, with the eager
entry below its existing transfer budget.

No automated browser or listening tests were run. Manual acceptance must cover:

- Play, Pause, Sound, Hint, answer/retry, Restart and both language variants.
- Audio synchronization, original MP3 priming/padding, voice balance and tails.
- Leaving during load, hidden tabs, reduced motion and explicit playback.
- Pointer/touch rotation, line drawing, grouped-piece dragging and cancellation.
- Narrow layouts and the geometry interludes' relationship to the animated film.
- Reader zoom/fullscreen, page turns and scroll retention.

Unavailable external recordings, some original button hover/transition sounds,
dynamic ActionScript-only choreography, exact camera/easing/filter composition,
captions and full nonvisual diagram descriptions remain disclosed source-parity
work. Missing referenced tracks are not replaced with unrelated recordings.
Source mistakes repaired in grading retain explicit mathematical explanations;
the preserved artwork can still contain the original printed error.
