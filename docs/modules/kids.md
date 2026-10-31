# Young learners: original illustrated activities

## Rendering performance review (2026-10-31)

Reviewed all eleven activities: ten full-root Canvas lesson painters and their
98 question gates, plus the browser-decoded Kitten MP4. OriginalBoard overlays
and optional SortingPractice SVG update on gestures/state changes, not a
continuous animation loop. Kitten has no generated Canvas filter loop.

The ten painters now use the reviewed source-density bounded static-text cache,
preserving authored shadow parameters and vector text. Rewritten filter-block
counts in catalog order: Find/connect 137, improper 1838, couple 324,
match 411, proper 2099, same 1140, put/place 1169, color/shape/size 324 each.
No scoring, gates, narration, audio, stage timings or direct gesture code changed.

Repeatable tooling: `node src/modules/kids/optimize-painters.mjs
--recover-bounds` recovers bounds from each original SWF; `--apply` verifies
source hashes, backs up current painters under `.cache/kids-filter-originals`,
checks candidate syntax and deep-equal metadata/export contracts, guards against
concurrent edits, then replaces files. A second application changes nothing.
`recover_audio.mjs --convert-reviewed-lessons` reapplies optimization after
conversion. Eleven family-owned `text-bounds-*.json` files across kids/falling
record source hashes; both locale entries deliberately identify the same
preserved source, not an invented Russian variant.

Follow-up: the separately reviewed `scripts/optimize-empty-text-filters.mjs`
eliminates eight transparent isolation/filter blocks in Findproper: one text582
(three local color conversions, no painting), seven text584 (empty body).
It retains the original `place(...)` evaluation and leaf bodies, including color
conversion behavior. Only exact isolated outer/non-knockout shadow/glow chains
qualify; paint operations, arbitrary calls, dynamic expressions, inner effects,
knockout and bevel are rejected. Current painters are backed up before replacing;
candidate syntax, metadata/exports, concurrent edits and idempotence are checked.
Recovery conversion applies this pass after static-text optimization.
General vector paths and animated sprites remain uncached. No browser FPS,
pixel parity or listening claim is made.

Verification: all eleven candidate syntax/metadata/export checks passed;
second-pass optimization was idempotent. Focused kids/falling tests: **15/15
pass**. Five focused empty-filter rewrite/rejection tests also pass.
Recovery-helper syntax passed. Integrated checks and serialized
performance diagnostics belong to Main. Manual follow-up: compare introductory
and success text/shadows, then complete first/last question gates using pointer
and keyboard input.

Presentation review: all ten question-board source DOMDocuments and Kitten use
`#66ffff` stages. Original image/video surfaces retain square uncropped corners.
Family copy follows the recovered Comic Sans lettering with installed-font
fallbacks; optional descriptive practice uses plain outlined controls and saturated
pink/blue figures instead of cream tiles and rounded dashed containers.
Playback and preservation limitations remain documented here, not in lesson copy.
No browser visual verification was performed for this presentation pass.

All eleven assigned objects now have functional browser-native activities.
Every catalog entry is marked **adaptation**, not frame-exact Flash emulation.
Original characters, toys, pictures, diagrams, and baskets are retained in
question-frame imagery rendered directly from each untouched SWF.

| ID | Exact original source | Verified coverage |
| --- | --- | --- |
| `kids-find-connect` | `Movies/Find and connect.swf` | 11 same-shape example stages |
| `kids-find-improper` | `Movies/Find improper to.swf` | 10 odd-picture scenes |
| `kids-find-couple` | `Movies/Findcouplewithline.swf` | 3 layouts; 4 same-color pairs each |
| `kids-find-match` | `Movies/Findmatchandconnect.swf` | 33 stages across all 3 scenes |
| `kids-find-proper` | `Movies/Findproper.swf` | 19 missing-picture patterns |
| `kids-find-same` | `Movies/Findsamecoupleline.swf` | 6 identical-pair toy shelves |
| `kids-put-place` | `Movies/Put in place.swf` | 7 pink/white counter patterns |
| `kids-share-color` | `Movies/Sharecolor-eng.swf` | All 3 sorting rounds, 5/6/8 figures |
| `kids-share-shape` | `Movies/Shareform-eng.swf` | All 3 sorting rounds, 5/6/8 figures |
| `kids-share-size` | `Movies/Sharesize-eng.swf` | All 3 sorting rounds, 5/6/8 figures |
| `kids-kitten` | `Movies/Kitten.swf` | All 555 timeline frames at 24fps; original audio |

The ten interactive objects contain 98 question stages in total. Kitten is an
animated scene with playback controls, not an invented matching game.

## Source evidence and repeatable generation

Read recovery `README.md` and `MODERNIZATION.md`. Inspected all eleven
`actionscript/scripts/*_fla/MainTimeline.as` files, Kitten's `pp_16.as`, their
metadata and reconstructed root `DOMDocument.xml` timelines, relevant nested
library symbols, and exported text. Archives remain read-only:

- `/home/ignat/code/mightymatica-source-recovery/objects/Movies/`
- `/home/ignat/code/mightymatica-archive-2026-08-09/raw-site/Movies/`

`src/modules/kids/recover_content.py` generates `recovered.json` and original
PNG question frames through Main's serialized `scripts/export-original-frames.mjs`
helper. Use `--data-only` to regenerate only input data. It parses numeric literal
coordinate assignments with Python AST, never `eval`; original instance names
are retained for traceability.

XFL scenes have scene-local frame indexes. Generation adds scene lengths before
looking up active display instances; otherwise later Findproper/Same/Match
scenes incorrectly lose their clickable objects. Direct script answer regions
take precedence over approximate vector bounds.

Same-picture decoys are baked into larger unnamed library artwork. All six
exported shelves were visually inspected and their 4-, 5-, and 6-column input
grids reconstructed; only the accepted pair comes from original script coordinates.
Decoys remain selectable: exposing only the two named correct objects would turn
the activity into an answer-revealing placeholder.

Specific rules verified:

- Find and connect permits the endpoint families used by each authored
  `artist*`/`stopDrawing*` callback.
- Findmatchandconnect has 11 stages repeated with different shape-family art in
  three 600-frame scenes. Its switch uses scene-local frame numbers.
- Find improper uses its exact authored odd-picture regions.
- Findcouplewithline pairs leaf/frog, flower/gloves, lemon/chick, tomato/strawberry,
  with three original arrangements. This is color correspondence, not arbitrary
  animal/food association.
- Findproper uses original `Correct`/`Wrong*` instances, adds one for a correct
  answer, and subtracts one for a wrong answer. Accessible labels and traversal
  do not disclose the `Correct` internal name.
- Findsamecoupleline accepts its named s4/s11 pair, including either direction.
- Put in place permits a counter to occupy any unfilled destination of its
  original type, not only its identically numbered slot. Target capacity is one.
  Authored completion counts are 5/5/5/6/6/8/6, including original spare counters
  and the last stage's early completion condition; this has not silently become
  an invented “place every piece” rule.
- Share* bins accept multiple pieces. The exact source object/group membership
  remains intact. Pink/blue fills and large/small relationships were verified
  through nested source symbols, not inferred just from names.

## Original Kitten animation

`recover_kitten.py` exports the complete root timeline in serialized chunks of at
most 120 frames, then encodes a 550×400 H.264/AAC MP4 at the original 24fps. It
retains frame 1 as the poster and removes only the intermediate frames it created.
`ffprobe` verifies **555 video frames**, **24/1 fps**, and **23.125 seconds**.

Original root audio events are sound48 at frame index 4, sound55 at index 77
(outPoint44 98819), and sound56 at index 138. Their recovered audio is mixed at
those offsets; the first track's complex stereo envelope is simplified to a
constant 0.3 bed volume. This is not a sample-exact audio reconstruction.
Video compression is lossy. The source's embedded graphical play control remains
visible in the raster timeline; native player controls perform playback.

Video has no autoplay, starts muted, loads only on demand, and pauses when the tab
is hidden or reduced motion becomes enabled. Original audio may be unmuted
explicitly. The original kitten, ladder, and animation are preserved, rather than
replacing the scene with generic cat imagery.

## Modern interaction and remaining fidelity gaps

Native HTML input overlays original question imagery. Players can drag between
pictures or click one then the other; Tab/Enter provide the same path.
The final source review adds a visible connection while drawing and an
original-art crop following the pointer for counter/sorting drags, rather than
an invisible drag gesture. The underlying question frame is still flattened:
the original piece remains visible at its origin during dragging, and successful
pieces use native marks instead of the source's alpha removal. Exact isolated
piece movement needs separate per-piece artwork/background exports; this pass
does not pretend a cropped preview achieves full source sprite parity.
Odd-one-out retains whole-board pointer input and a keyboard crosshair
(arrows = 20 source pixels, Shift+arrows = 5 pixels, Enter/Space = choose).
Wrong attempts give announced feedback, completed pieces cannot score twice,
slots cannot be reused, and advancing to the next stage is explicit.

Native success lines/checkmarks still replace alpha/tween behavior inside the
interactive question boards. The original introductory, between-question and
celebratory root timelines are now native Canvas lessons with the original
embedded soundtrack, rather than silent explanatory replacements. Each of the
98 questions is a blocked source-frame stop; Play cannot bypass its answer gate.
After a board is completed, Continue enters its source-backed success branch.
Wrong answers remain on the board, with their verified original feedback.
The optional idle companion remains supplementary, not an invented talking
sequence. Runtime ActionScript tweens are not executed: notably, Findproper's
three-second moving-answer tween is still represented by native completion
feedback rather than the original sprite trajectory.
Some source text is cropped in the original artwork (notably toy shelves); native
instructions make the lesson readable without pretending the original frame
layout was redesigned.

Source drag destinations are symbol registration points. Counter input regions
are shifted to visible counter centers, and basket regions are centered inside
the visible baskets. Those are interaction improvements, not different matching
rules. Vector bounds include Bézier control points conservatively, and final
touch hit-area alignment still needs interactive verification.

The sorting activities also offer a separate fully described SVG practice view,
using the same verified property classification and 5/6/8 progression. It is
explicitly optional; the original illustrated board is the default.
Russian UI is a new translation, not a claimed recovered Russian SWF variant.
Original audio retains its actual source language; Russian UI does not relabel
the English-source tracks as Russian narration.

## Interactive soundtrack recovery

`recover_audio.mjs` invokes the reviewed binary extractor for the ten interactive
kids SWFs and Falling Figure. Kids recovery retains **39 embedded MP3
definitions and 245 root events** (before separately mapped script music and
fireworks). The four archive-loaded tracks Kidsmelody, Shortbang, AngryMob and
salut are copied without transcoding and have SHA-256 provenance. Embedded
tracks likewise retain their exact MP3 payload hashes, trim/loop/envelope data.
Track identity/timing is verified; this pass does not claim listening or
transcription established the semantic content of every recording.

`recover_lesson_stages.py` uses XFL scene lengths and recovered frame handlers
to map the 98 gates and their success cuts. Odd-picture success starts at its
authored local frame 104, not immediately after question frame 24. Connect and
Match retain each exact `gtf` assignment, including later scene offsets.
Share* retains an obvious stale source `gotoAndPlay(89)` although its expanded
published question is at frame 409: literal replay would return to the same
question. This port instead enters the published success branch at frame 411
(844/1310 for subsequent scenes), preserving the 5/6/8 completion progression.
This source defect correction is explicit, not an invented extra puzzle.

Ten serialized full-root drawing exports total **13,085 source frames**, one
native module per SWF, not 98 independent films. They replace the superseded
intro-only modules. Heavy modules remain in lazy `public/media/kids/audio/`;
the family manifest contains no runtime/art imports. Source controls are native;
no SWF, emulator, or ActionScript execution is shipped. The generated family
audio/art directory is approximately 83 MiB before production compression.

The original music channel's script starts/stops and gains are mapped explicitly.
Board feedback uses a bounded `LessonAudio` event adapter, pausing when hidden
and disposing when its owner leaves. Findproper's button-down sounds are
mapped from actual source button symbols: correct sound 24 and wrong sound 5,
including each button's differing stereo envelope. Sprite-local clocks are
not guessed or flattened into root cue frames. No StartSound sprite cues occur
in these ten sources; the separately inventoried button-sound mechanism is
handled by this source-specific mapping.

Picture controls have spatially stable labels, not full semantic descriptions
of every visual pattern/toy variation. Thus the native boards are keyboard
operable but are **not yet equivalent nonvisual lessons**. The sorting practice
view provides descriptive figure labels. A future accessibility pass should add
carefully authored descriptions without revealing correct answers.

Recovered imagery and audio retain their original attribution and rights.
No blanket license is granted to the original artwork/media.

## Verification

`node --experimental-strip-types --test tests/kids*.test.mjs`: **8 tests pass**.
Coverage includes original color pairing, repeated-drop protection, multiple
figures per bin versus one counter per space, every stage's ability to reach its
authored completion count, selectable shelf distractors, all sorting rounds, and
property-specific classification.

All six toy shelves and representative boards from the other families were
inspected as exported local PNGs; this is not browser interaction verification.
No browser automation, development server, compiler, or integrated build was run
by this worker. Main owns integrated static and production verification.

Follow-up source review removed the generic “click two pictures / drag” hint
from odd-picture and missing-picture boards: those stages require one choice,
not pairing. Their mode-specific instructions and keyboard controls are retained.
The existing four original-board rule tests pass in the combined focused
logic/kids check; no new rule or presentation-only test was introduced.

Final audio/gating check:
`node --experimental-strip-types --test tests/kids-audio.test.mjs
tests/kids-original.test.mjs tests/kids-sorting.test.mjs
tests/falling-rules.test.mjs`: **15/15 pass**. The added behavioral tests
walk all 98 source gates, confirm playback waits for board authorization,
and verify original missing-picture feedback assignments. Binary recovery and
reviewed Canvas conversion completed without executing exported drawing code.
Integrated type-check/build and interactive/listening verification remain Main
and user responsibilities.

Manual checklist:

1. Complete every activity's first and last stages with click selection and drag.
2. Try wrong picture types, the wrong counter color, and an already filled slot.
3. Verify distractor pictures are selectable on every toy shelf.
4. Complete stages with Tab/Enter, and an odd-picture stage with the crosshair.
5. Check narrow-screen hit areas, original illustrations, Russian labels, and
   sorting's optional descriptive practice view.
6. Play/pause/seek Kitten, opt into audio, hide the tab, and enable reduced motion.
7. Confirm the optional idle companion pauses and never autoplays sound.
