# Escher and sliding tiles

## Complete family performance review

The review covered all 13 activities: seven picture puzzles (Birds and Fish,
Faces, Drawing Hands, Reptiles, Impossible Stairways, Stairs, Waterfall), five
standalone loops (`Escher-ball`, `Escher-reptilies`, `Escher-stairsbig`,
`Hands-escher`, `Birdfish-e`), and Sliding Tiles. All twelve generated Canvas
painters, `index.tsx`, `TimelinePlayer.tsx`, `GameTimeline.tsx`,
`FacesCelebration.tsx`, and the source-range/audio mapping in `presentation.ts`
were inspected. Sliding Tiles is event-driven DOM, not a filtered Canvas loop.

All seven existing picture-parent text-cache patches remain byte-for-byte
unchanged: a dry-run through the reviewed patcher found zero new groups,
no helper refresh, and identical output for each. Each standalone loop has
only the common filter-library call sites (three blur, five drop-shadow,
one gradient-bevel), with no additional authored filtered placements to cache.
Consequently no new Escher painter rewrite was warranted. This inventory is
not a claim that all vector drawing has negligible cost.

The existing in-place crop scratch Canvas is reused, Faces keeps its fixed
43 particles and six-step catch-up cap, and the nine-piece DOM group updates
remain interaction-driven. No additional concrete unbounded per-frame
controller defect was established. Source loop ranges, celebration placement,
audio, and freeform movable jigsaw groups were preserved.

The focused Escher, stories, and shared jigsaw tests passed together: 20 tests,
zero failures. No browser automation, FPS claim, audio listening, pixel-parity
verification, or new full-resolution baseline profiling was performed.

## In-place victory and bounded filter performance follow-up

The two reported Birds and Fish screenshots showed a correct movable picture
followed by a second whole-picture celebration below it. Completion now mounts
the shared source player **inside the existing jigsaw stage** instead. Its
pointer-transparent host follows the completed group's current bounding box,
including transient pointer movement and keyboard movement. The existing nine
buttons still own pointer capture, cancellation, clamping and keyboard focus;
the source player does not relocate the group. Play/Pause, Restart and Sound
remain below the same stage, with localized **Puzzle complete** status.
The optional precompletion introduction remains separate and cannot advance
into the victory sequence.

The source victory starts at frame 157, automatically after solving unless
reduced motion is enabled. The game sound preference is inherited, including
an explicit unchecked choice, and changes made in the victory player's Sound
control persist back to the puzzle. The old independent final-placement
fanfare is removed to prevent playing the same sound twice. Entry into an
unsolved puzzle does not autoplay audio. Reset unmounts the victory player,
stops its audio/clock, releases the crop scratch buffer and restores fragments.

`recover-celebration-viewports.py` reads the recovered XFL without editing it.
It recovers all 24 explicit picture matrices for frames 157–180 and verifies
the underlying bitmap fill is an axis-aligned closed rectangle. For the mature
frame-181 compositions it uses the exact original bitmap-background rectangle,
including Hands' nested bitmap shape. This is image viewport evidence, not
substitute text bounds. `celebrationGeometry.ts` intersects these source bounds
with the authored 600×420 canvas (600×550 for Waterfall), retaining source stage
clipping during Faces' zoom. A single reusable scratch canvas crops and scales
the rendered artwork at the current actual canvas pixel density. The scratch
and destination are cleared before copying, avoiding overlapping self-copy
feedback or stale pixels; resizing reuses the same scratch object.

This deliberately normalizes the source's picture relocation/zoom into the
user-requested freely movable completed rectangle. Original frame ordering,
animated artwork and source sound cues are retained. Artwork outside the
authored image-background viewport is clipped to that viewport; this is not
claimed to reproduce the whole original stage's title/footer composition.
The clean original complete image remains underneath as loading/error fallback.

Faces' former second full-picture particle viewer is removed. Its 43 original
bounded Snow/Ball particles now draw over the frame-181 artwork in the same
victory canvas, before viewport projection, under the shared transport.
The Faces-only `continueAfterComplete` setting leaves the source root stopped
and complete at frame 181 while the transport's elapsed clock keeps the
particles advancing; it neither loops unreachable root frames nor replays cues.
Particle catch-up after hidden time is bounded to six ticks per draw rather
than replaying an unbounded history.

Performance work did not re-export any SWF or change source frame coverage.
Seven `text-bounds-*.json` files come from exact binary DefineText RECTs,
using the shared recovery CLI with each same source in its two input slots.
`optimize-painters.mjs` imports the shared verified static-text optimizer and
patches only recognized filter blocks in the existing minified painters:
one block each for BandF, Hands, Lizards, Stairbig, Stairs and Waterfall, and
61 for Faces. The source alpha/blur/shadow formulas, color transforms and
nontext filters remain intact. Original painters are retained by SHA-256 in
the ignored `.cache/escher-filter-originals/`; syntax and exported metadata
were checked before replacing each owned derivative.

`profile-painters.mjs` runs the real filter arithmetic with real bounded pixel
arrays and inert vector/image drawing, without a browser or GPU. Sampled
source frames were 157,181,182,183 at authored canvas dimensions. Warm
182–183 draws fell from roughly 28–44 ms to 8–9 ms for six painters, and
Faces from roughly 29 ms to 0.04–0.08 ms. The five full-stage filter reads per
sampled victory frame fell to zero in all seven. These are bounded diagnostic
measurements, **not browser FPS, image-parity or perceived-smoothness claims**.

Checks: `node --experimental-strip-types --test tests/escher.test.mjs`
passed 6 tests; the added regression verifies all recovered source viewports,
positive clamped crop extents, stable mature-picture bounds and Faces'
original offstage zoom clipping. Generated painter syntax and metadata/export
equality passed. No browser, server, compiler, build or full suite was run.
Manual acceptance still needs all seven in-place sequences, group movement
during playback and pause, cancellation/reset, sound toggles, reduced motion,
narrow layouts and visual/perceived frame smoothness.

## Source-cued audio follow-up

Reused all twelve existing native drawing modules without rendering or exporting
new frames. The five standalone decorative movies have no embedded root/nested
sound, stream blocks, or recovered script audio evidence; their silent,
autoplaying, Play/Pause-only loop presentations remain unchanged.

The seven puzzle presentations now use the shared `OriginalLessonPlayer`
instead of independent audio elements. `presentation.ts` selects introduction
frames 1–153 while unsolved and victory frames beginning at 157 only after the
external freeform jigsaw is complete. The source root cue at frame 2 belongs to
the introduction; frame 157 starts victory audio; stairs and waterfall also
start their extra sound at frame 181. Raw trims, stereo envelopes, loops and
event/start/stop semantics remain source metadata, not hard-coded guessed delays.
The presentation starts sound-disabled and waits for explicit Play, with shared pause, sound, loading,
hidden-tab, retry and teardown behavior. Jigsaw group movement and seamless
completion artwork are unchanged.

Recovered eight single-SWF audio inventories using
`scripts/recover-lesson-audio.mjs`, writing `audio-*.json` in this family and
original MP3 payloads under `public/media/escher/audio/`. The seven Escher
games contain 16 MP3 definitions and 16 root cues, no nested sound cues, and no
unsupported audio records. All 16 extracted payload hashes were checked against
their embedded hashes. No ActionScript/exporter JavaScript was executed.
Source stops/jumps establish celebration endpoints: faces stops at 181;
BandF jumps at 261, hands/lizards at 240, stairbig at 320, stairs at 259,
and waterfall at 279. These differ from some declared trailing-frame counts.
Faces retains its separate bounded native particle celebration.

Sliding-4's eight root victory cues use sound 107; the move-sound
controller now uses that exact extracted sound on a solving move. Sound 105
belongs to the down-state of the source NEXT button (`LIBRARY/Symbol 106.xml`).
Its DefineButtonSound mechanism is explicitly reported unsupported by the
generic extractor; it is not guessed into the root timeline or remapped to
Shuffle/Reset.

The source celebrations other than Faces jump back to frame 181. These six
victory contexts now use the shared player's bounded `loopToFrame={181}` API;
introductions do not loop. A still-active sound from the same source cue is
retained rather than creating unbounded simultaneous copies on each loop.
This deliberately normalizes the original repeated event-sound stacking bug,
especially waterfall's long background clip. Faces stops at its authored
frame 181 and retains the separate native particles. The source NEXT-button
transition sound has no matching control in the current sliding adaptation.
Browser-decoded alignment and perceived audio content have not been listened
to or verified.

Focused verification: `node --experimental-strip-types --test
tests/escher.test.mjs tests/stories.test.mjs` passed 8 tests, including source
cue preservation, phase gating, and source-specific stop endpoints. No browser,
server, compiler, build, full suite, or new frame conversion was run.

## Final source-first UX review

Reviewed all thirteen manifest activities: `escher-sliding-4`,
`escher-bandf`, `escher-faces`, `escher-hands`, `escher-lizards`,
`escher-stairbig`, `escher-stairs`, `escher-waterfall`,
`escher-ball-animation`, `escher-reptiles-animation`,
`escher-stairways-animation`, `escher-hands-animation`, and
`escher-birdfish-animation`.

Compared the seven games' recovered `MainTimeline.as` start/end registrations
with the native layouts; all match, including their one-pixel irregularities.
Byte-compared every published puzzle fragment with its corresponding recovered
JPEG: 63 of 63 match. Reviewed Sliding-4's level handlers, `Checkresult*`,
and all eight XFL scenes. Scene 3's colored 3×3 deal and Scene 4's numbered
3×3 deal differ; the latter is now restored instead of reusing Scene 3.
Other colored/numbered scene pairs share their starting arrangements.
Sliding now opens the original colored 2×2 deal; board and color-mode changes
load the corresponding authored deal. Random shuffling remains an optional
action, and Reset returns to the selected deal.

The latest explicit user override removes painted nine-cell jigsaw guides:
the stage has one bounded outer rectangle. Optional keyboard destination
buttons remain transparent except for focus indication. Arbitrary placement,
relative snapping, joined-group dragging, and movable completed pictures remain
unchanged. Drag cancellation now also clears pending pointer-click suppression.

The subsequent completion presentation uses each original uncut reference
(`37.jpg`, faces `40.jpg`, stairs `39.jpg`, copied as `complete.jpg`).
All seven images were directly inspected: no internal tile seams are present.
Only after completion and successful image loading, the clean artwork covers
the existing nine fragment images and follows their live group bounding box.
The overlay accepts no pointer events; the same underlying group buttons retain
pointer and keyboard movement, cancellation, bounds, and visible keyboard focus.
Failed image loading leaves the original fragments usable. Unfinished puzzles
still use original fragments. This does not create a new puzzle state or lock
the completed picture.

The supplementary original game viewer no longer offers the victory checkpoint
or victory sound before completion. Its precompletion range ends before the
frame-154 assembly stop; completion exposes the authored frame-157 celebration.
The five standalone decorative animations retain their looping Play/Pause-only
player, reduced-motion opt-in, and shared hidden-tab suspension.

Checks: `node --experimental-strip-types --test tests/escher.test.mjs
tests/stories.test.mjs` passed 6 tests, including the distinct numbered 3×3
deal regression. No browser, dev server, integrated compiler/build, or full
suite was run. Manual acceptance remains required for touch/capture
cancellation, keyboard focus destinations, arbitrary group joining and movement,
all board modes, and decorative playback. Exact Flash transition choreography,
fragment border/display-list composition, and synchronized presentation audio
remain fidelity limitations; no new converter or media export was attempted.

Follow-up interaction review matched reference-cell proportions to fragment
buttons and removed repeated collection-author footer credit while retaining
M. C. Escher attribution. Focused Escher/reasoning tests passed (9 total).
Manual checks remain: correct/wrong drops, touch/canceled gestures, keyboard
selection, and portrait/landscape references. No browser or compiler was run.

## Covered activities

The eight interactive puzzle entries are labelled **adaptation**, not
timeline-exact restorations. Five original standalone animations are native
rendered-frame players.

| Activity ID | Exact source |
| --- | --- |
| escher-sliding-4 | Movies/Sliding-4.swf |
| escher-bandf | Movies/Escher-BandF-game.swf |
| escher-faces | Movies/Escher-faces-game.swf |
| escher-hands | Movies/Escher-hands-game.swf |
| escher-lizards | Movies/Escher-lizards-game.swf |
| escher-stairbig | Movies/Escher-stairbig-game.swf |
| escher-stairs | Movies/Escher-stairs-game.swf |
| escher-waterfall | Movies/Escher-waterfall-game.swf |
| escher-ball-animation | Movies/Escher-ball.swf |
| escher-reptiles-animation | Movies/Escher-reptilies.swf |
| escher-stairways-animation | Movies/Escher-stairsbig.swf |
| escher-hands-animation | Movies/Hands-escher.swf |
| escher-birdfish-animation | Movies/Birdfish-e.swf |

## Behavioral evidence and deliberate differences

Inspected recovered `actionscript/scripts/*/MainTimeline.as`, extracted texts,
image resources, and XFL `DOMDocument.xml` / library symbols.

The Escher games are **not sliding puzzles**. `startDragging`, `stopDragging`,
and `checkGame` handle nine named pieces (`s11` through `s33`). A piece released
outside its target tolerance returns to its starting position; a correct piece
snaps to its target and loses its drag listeners. All nine must be correctly
placed. The modern activity deliberately differs at the user's request: pieces
may be released anywhere on the continuous stage, including over other pieces.
Correct relative edge-neighbours snap together within 20 stage units and become
a group. Grabbing any member translates the whole group; groups can join other
groups. Completion means all nine pieces are connected in the correct relative
arrangement, anywhere on the stage. The finished picture remains movable.
This freeform grouping rule is not claimed as original Flash behavior.
The shared `JigsawGroups` rules own relative snapping, grouping and completion.
Pointer dragging and keyboard arrows share the same group translation and
stage-boundary clamping. Tab/Enter also select pieces and original target cells
as an optional placement aid, without constraining pointer placement.
Mouse, pen and touch use pointer capture. Pieces visually follow the pointer
after a small drag threshold, preserving the grabbed offset and fragment size.
Pointer cancellation,
lost capture, Escape, window blur, hidden tabs, reset and unmount clear the drag.
Click/keyboard select-piece/select-target placement remains available.
The stage now uses each game's original ActionScript scattered starting positions
and solved registration coordinates, rather than a separate tray and grid.
XFL symbol offsets are (-59.5,-52), except stairs (-46.5,-57); Waterfall uses
the original 0.8258209228515625 symbol scale. Stages are 600×420 except
Waterfall's 600×550. Small per-fragment shape/border variations and original
overlapping target registrations are not a pixel-exact display-list restoration.
Reference preview is an added aid.

The nine original JPEG fragments are copied, unmodified, to
`public/media/escher/<variant>/0.jpg` through `8.jpg` in row-major target order.
Original resource IDs are 2,5,8,11,14,17,20,23,26 for most variants;
faces uses 5,8,11,14,17,20,23,26,29; stairs uses 3,6,9,12,15,18,21,24,27.
XFL named instances and bitmap-fill symbols establish their relationship.
The art is M. C. Escher's, presented in Yuri Remizov's MightyMatica.
No new license or ownership over the artwork is asserted.

Sliding-4's `Jump0`, `Jump`, `Jump7`, and `Jump8` verify that only a tile
orthogonally adjacent to `Space_mc` moves into it. The original progresses
through small colored and numbered boards, up to 24 numbered tiles. The port
offers 2×2 through 5×5 boards with a bottom-right blank, legal-walk
shuffles, move count, keyboard navigation, and reset to the current deal.
The four original authored starting arrangements are recovered from XFL scene
instance matrices and available through a dedicated button. Their permutation
and solvability parity are regression-tested. Original tile fill colors for
2×2 through 4×4 boards are available through a checkbox; numeric labels remain
visible for accessibility. Source `SolidColor` values include blue `#0000ff`,
green `#00ff00`, brown `#660000`, red `#ff0000`, yellow `#ffff00`,
purple `#ff00ff`, pink `#ff6666`, and gray `#666666`.
The 5×5 source uses numbered tiles. Intermediate story/success timelines and
transitions are not yet restored. The original
`Movies/Shortbang.mp3` is preserved and available through the move-sound
checkbox, checked initially per the user's request. Opening the puzzle is
silent. Escher source requests `Shortbang.MP3` (case differs from the archived
file); both puzzle types use it only for a successful move/placement.

The five standalone animation timelines contain no recovered ActionScript.
All original frames are exported and registered in the catalog, with their
original nested sprite/placement animation rendered rather than approximated.
`TimelinePlayer.tsx` uses the shared native Canvas `OriginalTimeline` loop
presentation: the five standalone artworks autoplay and wrap continuously,
with only Play/Pause visible. Reduced motion starts them paused but permits
explicit Play. Hidden tabs suspend playback without replaying elapsed time.
Educational and puzzle timelines retain their inspection controls. No static
image is advertised as a complete animation. The source timelines are all 550×400 at 24 fps:
Escher-ball (80 frames), Escher-reptilies (60), Escher-stairsbig (140),
Hands-escher (60), Birdfish-e (80). The full five root timelines are restored
as generated drawing ES modules, with embedded original bitmap/vector media.
The first PNG derivatives (420 distinct frames) have been relocated to ignored
`.cache/escher-exports/timelines/`, except each referenced `1.png` thumbnail.
Obsolete game MP4s and raw FFDec HTML/JS trial exports were also relocated to
`.cache/escher-exports/`. No raw HTML/JS or SWFs remain in this family's public
media. Original archives were never edited or relocated.

All seven games additionally expose their complete original root timelines
as native Canvas drawing code, including intro and celebration, with checkpoints
at frames 1 and 157. On puzzle completion the viewer starts at 157; it never
autoplays. No ActionScript, exported HTML, string evaluation, or Flash runtime
is executed. `export-canvas-timelines.mjs` reproduces all twelve drawing modules
using the shared serialized exporter, fail-closed AST converter and syntax check.
The complete twelve-module source footprint is approximately 25 MB.
Two earlier silent MP4 trial derivatives and the old raster exporter script are
superseded by the Canvas implementation and are not referenced by the application.

All seven root timelines place a byte-identical success sound on frame 157:
resource 40.mp3 for most games, 43.mp3 for faces and 42.mp3 for stairs.
It is preserved once as `completion.mp3` and replaces the short move sound on
the final correct placement when sound is enabled. The shared original intro
sound (33.mp3 for most games, 36.mp3 for faces, 34.mp3 for stairs),
stairs 97.mp3 and waterfall 104.mp3 are preserved as separate native audio
tracks in the animation viewer. Track controls are independent of timeline
scrubbing rather than pretending exact synchronization. Audio never autoplays
and pauses when the tab hides or the viewer unmounts.

Faces additionally creates script-driven particles at frame 181 and stops
the root timeline. `FacesCelebration.tsx` ports the original Snow/Ball update
rules and original 43-particle bound (11 small falling, 11 large falling,
21 expanding/moving spheres), with the original particle SVG and frame-181 art.
It uses a bounded 24 Hz clock, play/pause and manual next-frame control.
It appears after completing Faces, never autoplays, and honors reduced motion.
This supplementary composition draws particles above the flattened artwork;
the original's mixed foreground/background display-list placement is not exact.
Other root animations retain their authored vector drawing layers.

Russian interface strings are new translations, not a claimed recovered
Russian edition.

## Verification

Direct-drag follow-up: inspected the reported Waterfall screenshot and recovered
Waterfall and six sibling `MainTimeline.as` files (`startDragging`,
`stopDragging`, start/end registrations, target tolerance and listener removal),
plus each XFL's `s11` registration, bitmap fill and symbol scale.
`node --experimental-strip-types --test tests/escher.test.mjs tests/jigsaw-groups.test.mjs`
passed all 14 tests after the freeform integration. The obsolete family-local
target-lock/free-grid helper and its tests were removed; the shared grouping
suite now owns picture-placement invariants.
No browser, server, compiler, integrated
build or full suite was run for this follow-up. Manual acceptance still needs
mouse/touch following, grab-offset stability, arbitrary free drops, relative
neighbour/group joining away from the target frame, completed-group movement,
cancellation, reset, keyboard movement after canceling a drag, and narrow layouts.

Presentation review covered all thirteen entries. The seven game
`DOMDocument.xml` files use `#66ffff` stages (600×420; Waterfall 600×550).
Source Sliding-4 uses the same aqua and Times New Roman Bold; its library
contains `#0099ff` tile fills as well as the selectable original multicolor
fills. The Escher-ball frame-1 export was inspected directly: its monochrome
artwork is centered on aqua, not surrounded by a modern white card.
The native puzzle frame/tray now use thin square blue boundaries and aqua
empty cells, retain each artwork's existing fragment proportions, and cap
individual boards at 360px. Shared timeline canvases are centered without
overriding authored canvas backgrounds. Recovery-process paragraphs were
removed from the player; concise artwork/collection attribution remains.
No mathematical rules, source mappings or manifest metadata changed.
Verification here was direct source/code/image inspection, not browser playback.

Run `node --experimental-strip-types --test tests/escher.test.mjs`.
Tests protect neighbor-only movement, row boundaries, shuffle reversibility,
and original sliding deals. Shared `tests/jigsaw-groups.test.mjs` protects free
group translation, relative joins and completion. Integration compilation belongs
to the main task.
No browser automation or visual gameplay verification was performed.
Original exported Escher-ball frame 40 was inspected directly as an image;
all five sequences were checked for complete numbered frame coverage and
distinct frame hashes. This is not a claim of interactive browser testing.

Manual checks: select each artwork, compare its assembled image and reference,
release pieces freely, join matching neighbours away from the frame, drag any
group member, complete and move the whole picture, reset; use
keyboard-only and narrow touch layouts. For sliding tiles try every board size,
verify arrow keys move the blank without row wrapping, and reset after moving.
