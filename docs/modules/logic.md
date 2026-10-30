# Logical toys: restoration scope

Presentation review: all seven source DOMDocuments use `#66ffff`. Recovered
board/story artwork is displayed with square, unframed edges; coins use an aqua
stage and Times New Roman labels rather than a generic neutral diagram surface.
The supplementary traveler simulator uses plain separators instead of rounded
passenger cards. Implementation-status notices have been removed from lesson
copy; the fidelity limitations below still apply. Source preservation files
remain unchanged and no browser visual verification was performed.

Seven functional interactive adaptations are exposed, using original authored
boards where applicable. Original author: Yuri Remizov / MightyMatica.
These are not pixel/timeline-equivalent Flash restorations.

| Activity ID | Exact source paths | Coverage |
| --- | --- | --- |
| `logic-complete-chain` | `Movies/Completechain.swf` | All six authored stages; blue/pink bead ownership, color-specific holes, occupancy validation, reset, progression and success. |
| `logic-necklace` | `Movies/Necklace.swf` | All eight authored boards; six matching triangles/circles/squares/inverted triangles per board; original distractors, selection, reset and progression. |
| `logic-ripped-necklace` | `Movies/Rippednecklace.swf` | All three authored shape/color stages; six original half-necklace matches per stage; one-to-one validation, connecting lines, reset and progression. |
| `logic-count-stones` | `Movies/Stones.swf` | All 29 authored questions across three levels (8 / 9 / 12); original numeric choice labels and answers, level selection and completion. |
| `logic-coins-to-move` | `Movies/Coinstomove.swf`, `Movies/Coinstomove-ru.swf` | Ten-coin triangle, three corner moves, distinct destinations, reset, success. |
| `logic-three-wisemen` | `Movies/Wisemen.swf`, `Movies/Wisemen-ru.swf` | Three dirty travelers, laughter question, original two-person hint, interactive reasoning check and explicit assumptions. |
| `logic-eight-wisemen` | `Movies/Wisemen 8.swf`, `Movies/Wisemen 8-ru.swf` | Silent travelers, public announcement, washing at stops, two-person induction hint; explorable 1–8 dirty faces. |

All activities provide English/Russian interface copy. The first four SWFs in
the table are single source objects; Russian interface copy is new translation,
not a claim that a separate original Russian SWF was recovered.

## Evidence and repeatable visual extraction

Read recovery `README.md`, `MODERNIZATION.md`, `MainTimeline.as`, extracted
`resources/texts/*.txt`, and reconstructed `DOMDocument.xml` / library-symbol
timelines. The XFL hierarchy, original bitmap fills, vector edges, transforms,
and scene boundaries reconstruct playable boards rather than guessing patterns
from titles or snap coordinates.

`recover_visuals.py` reads the archives without modifying them, emits the
family-owned `recovered.json`, and rasterizes original keyframes under
`public/media/logic/`. It uses Python's standard library and system
`librsvg-2`, `libcairo`, and `libgobject` via ctypes; it does not require Flash,
a browser, network access, or an installed Python package. Run from the
standalone project root:

```sh
python3 src/modules/logic/recover_visuals.py
```

Global frame numbers are resolved across all authored XFL scenes. Treating every
global frame as Scene 1 silently repeats incorrect boards in Stones and
Rippednecklace.

- Completechain: frames 87, 199, 311, 423, 535, 647. Source target coordinates
  and color families control legal placement. Duplicate target coordinates
  identify one physical hole, not multiple occupancies.
- Necklace: frames 85, 144, 215, 301, 392, 470, 541, 627. Original `t`, `c`,
  `s`, `tu` families are triangles, circles, squares, inverted triangles.
  The source accepts six instances of the current family and recolors them
  blue; other shape families are distractors.
- Rippednecklace: frames 87, 198, 309. `nlef1`–`nlef6` match corresponding
  `nrig` identities, not the right-side display row. Later color/shape changes
  come from separate authored scenes.
- Stones: all 29 questions whose correct button calls `startnext`. The actual
  number comes from that button's authored text: `bSt2` is not always number 2.
- Coinstomove: `frame43` supplies initial and target coordinates;
  `stopDragging` accepts p1, p7, p10; success means three distinct placements.
  This port uses an ideal triangular lattice instead of hand-positioned offsets.
- EN/RU `MainTimeline.as` files are byte-identical for Coinstomove, Wisemen,
  and Wisemen 8 (verified with `diff -q`); extracted translations were compared.

## Companion illustrations and remaining animation work

The four board activities include original mouse, squirrel, and/or wiseman
companions at their authored playable keyframes. Their companions remain static.
The legacy static extractor does not interpolate tweens or execute AVM3.

Both Wisemen activities now use native Canvas audiovisual lessons, not the
previous seven-picture slideshow. Four distinct original language sources are
preserved: `Wisemen`, `Wisemen-ru`, `Wisemen 8`, and `Wisemen 8-ru`.
Each has a finite narrative chapter ending exactly at the source question
(global frame 1097), plus a separately mounted optional hint chapter
(1098–1140 for three wisemen; 1098–1137 for eight). Generic Play cannot cross
that question into the hint. The RU eight-person source has 1176 root frames,
but its source script stops at 1137; the unreachable tail is not published.

`WisemenLesson.tsx` composes `OriginalLessonPlayer` with
`wisemen-lessons.json`. The shared player owns explicit play/pause, original
event-audio overlap/envelopes/loops, loading/error recovery, hidden-tab suspension,
reduced-motion pause, restart and disposal. No visible source frame counters or
seek controls are added. The explanatory question and optional corrected
reasoning/simulator appear only after narrative completion; no new source quiz
is imposed. A Russian interface selects the actual Russian source, not English
audio relabeled as Russian.

Stones now starts with the central board covered. Explicit Start exposes the
arrangement for the source cover span (119 frames at 24 fps), then covers it
before enabling numeric answers. Wrong answers retain the cover for retry;
correct answers reveal the arrangement for the source `startnext` duration
(45 × 100 ms), then advance within the chosen level. Level ends stop rather
than silently entering the next difficulty. All 29 arrangements and the three
original level entry points remain. Untimed practice is supplementary and
explicitly selected. Reset restores the initial covered state. The sample at
upper left is excluded from the count. The cover is a flat magenta panel with
localized text, not the source perspective rotation/alpha choreography.

Accessible DOM copy replaces embedded Flash labels. Direct pointer dragging
now supplements click/keyboard placement for Completechain, Necklace and coins.
Chain and Necklace drag previews crop their existing authored board artwork,
not substitute shape assets. Rippednecklace supports a bounded freehand magenta
stroke from the left half to its matching right endpoint; wrong strokes clear,
correct pairs disappear under board-colored masks. Keyboard/select-then-place
paths remain available. Pointer capture permits release outside the source
piece; cancel, Escape, blur and hidden-tab transitions discard transient drags.
No gesture listeners survive unmount.

Direct diagram controls now cover coin selection and destinations, the original
Completechain bead sources as well as its holes, and both sides of Rippednecklace.
These hit regions use the existing lattice/recovered coordinates and invoke the
same placement checks as the supplementary buttons. Interactive SVG groups
(including Necklace's existing shape controls) expose button roles, labels,
disabled/selected state, Enter/Space activation and visible keyboard focus.
The boards remain authored artwork, with native interactive overlays.

Sequential board progress no longer has an arbitrary stage picker that bypasses
unsolved questions. Stones retains its source level selector. Completed runs
offer replay. Static companions, rectangular half-necklace erase masks,
approximate drag anchoring, and native Canvas playback still require visual review;
these do not establish full authored-animation parity.

Wisemen story playback stops at the original question; the hint chapter
is unavailable until the explicit Two-person hint is opened. Closing
the hint returns to the story. The optional simulator/reasoning check lives
under “Explore the reasoning,” not as a mandatory source quiz. The eight-person
simulator starts with eight dirty faces; reset restores that configuration and
restarts the story. The public announcement remains before any washing stops.
The two-person hint now asks the source's smaller question rather than spelling
out the full induction answer. Story playback remains explicit and bounded;
the shared lesson lifecycle pauses hidden-tab time and disposes audio/renderers.

Wisemen's simulator explicitly states synchronized reasoning, perfect logic,
and observable stop behavior. The laughter argument is not presented as a
rigorous theorem without behavioral assumptions.

## Attribution

Rasterized boards and train keyframes derive from recovered MightyMatica SWF
artwork, including embedded third-party illustrations. Preservation does not
grant a new license or claim ownership. Original audio is now redistributed
only as the recovered recordings listed below; preservation does not relicense it.

## Original audio follow-up

The binary recovery tool extracted 12/13/12/11 root cues respectively for
three EN/RU and eight EN/RU. The finite narrative uses 9/10/8/7 distinct original
MP3 assets. Hints contain no root StartSound cues. Each binary inventory records
one unsupported button-sound tag; those button-transition effects have not been
mistaken for global narration or guessed from sprite-local frames. No nested
StartSound events were present in these four binary inventories.

`recover_audio_lessons.mjs` regenerates the four audio inventories and eight
bounded native drawing chapters using the shared serialized exporter and audited
converter. Total selected source frames: 4554; largest individual export: 1097.
Source frame drawings are Canvas modules with embedded source images, not a SWF,
emulator, ActionScript runtime, browser export player, or raster video.
`recover_effect_audio.mjs` copies exact original named recordings and the short
board events. Both preservation trees stay read-only. Generated drawing/audio
assets live exclusively under `public/media/logic/native/` (about 22 MiB).

For the five board toys, `useLogicAudio.tsx` offers default-on interaction
feedback, as requested by the user; opening a board remains silent. It connects
original named Shortbang/AngryMob feedback, Stones' explicit Howmany prompt and
Mystery reveal, and source completion events. Completechain uses embedded 18
at sound enable/new stages and 80 at completion; Necklace uses 75 at enable,
79 at nonfinal completion, 80 on stage transition, 87 at final completion;
Rippednecklace uses 56 at enable/new stages and 62/63 at completion. Stones
retains embedded 78/79 on starting/covering and 185 at level completion.
Coins retain original three-move success fireworks audio. These native board
events are mapped to equivalent user actions, not claimed frame-perfect audio
choreography. Single-source board recordings remain in their original language;
no translated or synthesized narration was invented.

The source's Kidsmelody recording is available through explicit Play/Pause music
after sound is enabled; it never starts automatically. Source music looping and
choreography, fireworks visuals, and animated board companions remain incomplete.
Each active toy owns at most
one audio element per fixed recording; hidden tabs pause audio, reset stops it,
and unmount releases every source and listener.

## Verification and manual checklist

Extraction completed all board/story families without an unknown XFL element
kind. Original PNGs for Completechain, Necklace, Stones (including a later-level
board), Rippednecklace (including stage 2), and a train scene were inspected as
local files, not in a browser. Focused Node tests cover coin geometry,
bead color/occupancy, necklace pairing, and dirty-face reasoning.

No browser automation, integrated build, or integrated type-check is run by
this worker; Main owns integrated verification.

Focused follow-up check:
`node --experimental-strip-types --test tests/logic-rules.test.mjs`
passes all 4 existing tests. This verifies the reused placement/occupancy and
reasoning rules, not rendered pointer geometry or the browser memory timer.
The audio follow-up additionally ran
`node --experimental-strip-types --test tests/logic-rules.test.mjs tests/logic-lessons.test.mjs`:
all 6 tests pass. The two added regressions exercise finite narrative playback
stopping at the question and exact source-language cue/hash/segment preservation.
All eight Canvas conversions passed the shared converter's static audit.
No browser automation, compiler, build, full suite, devserver, raster export,
audio transcode or listening verification was performed.

Final source review inspected all seven manifest entries and recovered
stage metadata (6 chain, 8 necklace, 3 ripped-necklace, 29 Stones boards), the
seven families' `MainTimeline.as` handlers, both Wisemen extracted story texts,
Stones `DOMDocument.xml` frame rate and `LIBRARY/Symbol 6.xml` cover artwork,
the family extractor's board/story frame selections, and existing rasterized
Stones/Rippednecklace boards. Read-only recovery README/MODERNIZATION and
project guidance were also reviewed. No source artifact was changed.

1. Complete all chain stages, including six-hole stages; reject wrong colors
   and occupied holes.
2. Select matching shapes and reject distractors on all eight Necklace boards.
3. Match all six halves on each of three shape/color stages.
4. Complete counting levels; verify later answers up to 14, not button indices.
5. Inspect keyboard-only use, narrow wrapping, and touch targets, especially
   the many selectable bead controls.
6. Play/pause the EN/RU train lessons; leave during playback, hide the tab,
   enable reduced motion, toggle sound, and retry missing audio/media.
7. Choose coins, chain beads/holes and broken necklace halves directly on their
   diagrams, then repeat with Tab/Enter/Space and the supplementary buttons.
   Confirm selected outlines, completed controls and narrow-screen hit regions.
8. Drag every bead family and all ten coins; invalid drops return without a
   placement, legal placements lock, occupied destinations reject reuse. Draw
   matching and wrong Rippednecklace paths on each of its three boards.
9. Start Stones, wait for the cover, answer incorrectly then correctly. Verify
   correct reveal/next-board and level-end behavior, reset during each phase,
   untimed practice, image-loading readiness, hidden-tab pause and EN/RU copy.
10. Browse/play Wisemen up to the question without opening the hint; confirm the
    hint chapter is not exposed. Open/close the hint, use optional reasoning,
    and reset after playback, hints and simulator changes.
11. Enable toy sound, complete/retry/reset stages, and listen for the original
    prompt, move and completion events. Verify hidden tabs and navigation stop
    the recordings. Audio synchronization and drawing fidelity still require
    human acceptance.
