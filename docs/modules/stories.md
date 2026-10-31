# Cartoon picture puzzles

## Bounded text-filter performance review

All three generated parent painters were reviewed together with `index.tsx`,
`StoryPresentation.tsx`, `StoryFilm.tsx`, and `presentation.ts`. Pinocchio and
Prostokvashino each repeated 189 static-text shadow placements; Snow White
repeated 581. These placements now use the shared source-density, bounded
text-filter cache, preserving the authored shadow rather than removing it.
The original filter library remains present for other artwork.

`text-bounds-Pinoc-game.json`, `text-bounds-Prosto-game.json`, and
`text-bounds-Snowhite-game.json` recover the two static text symbols in each
actual preserved `Movies/<name>.swf` binary. Both locale entries deliberately
refer to the same original binary; they are not separate translated sources.
Reproduce bounds with `scripts/recover-calculus-text-bounds.mjs`, supplying that
binary to both `--en` and `--ru` and the matching family JSON to `--output`.
The recorded source SHA-256 values are checked before every rewrite.

Run `node src/modules/stories/optimize-painters.mjs --apply` after regeneration.
The parent exporter also invokes it. It retains hash-addressed originals under
`.cache/stories-filter-originals`, checks candidate syntax, deep-compares
metadata and export names, rejects concurrent target changes, verifies
idempotence, and atomically replaces each target. A second invocation is a no-op.

An AST inventory after patching leaves only the common filter-library calls
(three blur, five drop-shadow, one gradient-bevel call site per painter); no
additional uncached authored filter placements remain in these three parents.
This does not mean ordinary vector drawing or media decoding is free. The
source film/parent ranges, companion audio, question/assembly gates, movable
jigsaw groups, and user-controlled playback are unchanged. No separate
unbounded frame-loop defect was established in the family controllers.

Focused verification: `node --experimental-strip-types --test
tests/escher.test.mjs tests/stories.test.mjs tests/jigsaw-groups.test.mjs`
passed all 20 tests. Candidate syntax, deep metadata/export checks, original
source hashes, and second-pass no-op checks passed for all three painters.
No browser, FPS measurement, audio listening, pixel-parity claim, integrated
build, or full-resolution baseline benchmark is implied.

Manual follow-up: play each original introduction and reward transition;
check text/shadow edges at narrow and large sizes, freeform grouped dragging,
return from the companion film, pause/replay, and soundtrack synchronization.

## Audio-source follow-up

The four converted films retain their existing original audio and explicit,
muted-by-default native playback; no film media/controller was replaced.
Compared all seven story-related inventory entries with the native controller.
The three parent puzzle SWFs additionally contain root sounds not supplied by
the four film players: Pinocchio/Prostokvashino at global frames 2,157,181;
Snow White at 2,173,197. Parent scripts stop at puzzle frames 154/170 and
load companions at 181/197; Snow White also loads its introduction at frame 2.
The source parent/child soundtrack overlap cannot safely be reconstructed by
simply playing every parent clip over an already audio-bearing converted film.

Main approved exactly three bounded parent exports. The reproducible
`export-parent-timelines.mjs` uses the serialized shared helper and fail-closed
converter, preserving every source frame (Pinocchio 240, Prostokvashino 240,
Snow White 703). Their native modules total 2,648,798 bytes and are dynamically
loaded only when a parent clip is opened. Original archives remain unchanged.
No raster rendering, SWF/emulator shipping, installation, or source-script
execution was involved. Nine exact root MP3 payloads and their cue metadata were
recovered; payload hashes and contiguous drawing-frame coverage were checked.
There are no nested audio cues or unsupported records in these three parents.

`StoryPresentation.tsx` uses the shared lesson player, initially sound-disabled:

- Optional Pinocchio/Prostokvashino introductions cover frames 1–153, including
  their source frame-2 audio, without advancing into victory.
- Snow White's optional assembly introduction covers 106–169, after the existing
  introductory film; it does not duplicate the child film's interval or soundtrack.
- The completion-gated reward action opens a finite victory transition:
  157–180 for Pinocchio/Prostokvashino, 173–196 for Snow White. The original
  victory cue is synchronized to the clip's first source frame. Continue to
  cartoon is explicit and unmounts parent playback before the existing
  audio-bearing film mounts. Return to picture keeps the completed group.
- Parent companion-loading cues at 181/197 are excluded because the native
  companion videos own that phase's soundtrack. Snow White's parent frame-2
  cue overlaps the original child introduction and is likewise not layered over
  its existing native film. The parent soundtrack mix is deliberately not
  claimed bit-identical to the original simultaneous parent/child composition.

Reset closes optional parent playback. Switching to an intro/reward film also
unmounts it. The primary freeform jigsaw, snapping, movable completion artwork,
and existing explicit, initially paused/muted films are preserved.

Verification: syntax checks passed for all three generated native modules;
`node --experimental-strip-types --test tests/escher.test.mjs
tests/stories.test.mjs` passed 8 tests, including parent source-range and
nonduplicated soundtrack gating. No browser, server, compiler, build, or full
suite was run. Playback, perceived synchronization, transition navigation,
hidden-tab behavior, keyboard/touch input, and visual layout require manual
acceptance.

## Final source-first UX review

Reviewed all three manifest entries: `stories-pinocchio`,
`stories-prostokvashino`, and `stories-snow-white`. Rechecked their recovered
`MainTimeline.as` start/end coordinates against the native stage layouts,
including Pinocchio/Prostokvashino's one-pixel destination differences and Snow
White's distinct registrations. Inspected Snow White `LIBRARY/Symbol 3.xml`:
the bitmap shape begins at (-59.5,-52) before its stage scale, consistent with
the native registration calculation. Byte-compared all nine fragments for
each puzzle with recovered resources: 27 of 27 match. Rechecked the four
companion films' recovered replay handlers (`gotoAndPlay("1")`) against native
replay/return controls.

The latest user override removes all nine painted destination squares.
One bounded stage rectangle remains; keyboard-only destination buttons are
transparent except for focus indication. Freeform snapping and whole-group
movement remain unchanged. Completion now remains true during a drag of the
finished picture, so its success status and reward access no longer disappear
merely because the completed group is being moved.

On completion, each existing clean `36.jpg` reference covers the nine fragment
images and tracks the same group's live bounding box. All three originals were
directly inspected and have no internal tile seams. The overlay has no pointer
events: existing underlying buttons still own group dragging, keyboard movement,
clamping, cancellation, and visible keyboard focus. Fragment images are hidden
only after the full image loads successfully, so an image failure retains the
playable fragment presentation. Reset restores the unfinished fragments; no new
completion state or movement lock is introduced.

The intro remains skippable, rewards remain completion-gated and explicitly
opened, and films start paused/muted. Film playback pauses on hidden tabs and
unmount; puzzle pointer cancellation discards only transient movement.
EN/RU controls are preserved. Existing transition choreography, scattered-piece
motion, placement audio, captions/transcripts, and exact parent/child timeline
synchronization remain restoration limitations, not verified parity.

Checks: `node --experimental-strip-types --test tests/escher.test.mjs
tests/stories.test.mjs` passed all 6 tests. No browser, dev server, integrated
compiler/build, or full suite was run. Manual acceptance still needs arbitrary
joins, completed-group dragging with stable reward access, keyboard focus-only
destinations, touch/cancellation, reset/intro/reward navigation, film playback
and audio synchronization, and narrow layouts.

## Playable coverage

| Activity ID | Exact original object | Coverage |
| --- | --- | --- |
| `stories-pinocchio` | `Movies/Pinoc-game.swf`, `Movies/Pinoc1.swf` | Original puzzle and cartoon reward with original audio |
| `stories-prostokvashino` | `Movies/Prosto-game.swf`, `Movies/Prosto5.swf` | Original puzzle and cartoon reward with original audio |
| `stories-snow-white` | `Movies/Snowhite-game.swf`, `Movies/Snowpart-0.swf`, `Movies/Snowpart-2.swf` | Original puzzle, cartoon introduction and reward with original audio |

All three are marked **adaptation**, not timeline-exact restorations. Pointer
and touch input grab the original artwork directly, preserving the grabbed
offset while moving. The requested interaction permits continuous free placement,
not just a discrete grid: incorrect drops remain where released and correctly
positioned pieces remain movable. This deliberately overrides the recovered
`stopDragging` handlers, which return incorrect drops to the authored start and
remove drag listeners from correct pieces. Original-source evidence remains
documented; it does not prescribe that overridden behavior for this adaptation.
Correct relative neighbours snap together within 20 stage pixels and become a
connected group. Dragging any member translates the whole group; groups can join
other groups anywhere on the stage. Completion means all nine pieces form one
correctly connected picture, regardless of its absolute position. Neither
completed pictures nor partial groups lock to the board. Group movement is
bounded so the complete artwork remains reachable within the stage.
Escape, pointer cancellation, a hidden document, window blur, or unmount cancel
the transient drag without committing movement or snapping. Only capture owned
by that drag is released. Post-drag click suppression does not consume keyboard
activation and is cleared on cancellation or the next pointer press.
Click-select then click-place and Tab/Enter remain alternatives, and arrow keys
move focused artwork continuously (Shift uses a finer step). Reference-picture
visibility is an optional aid. The responsive 600×420 stage restores each
story's authored scattered start and destination coordinates, rather than a
separate modern tray. Pinocchio/Prostokvashino tiles retain their 119×89 stage
dimensions; Snow White bitmaps use the recovered approximately 0.349 scale.
No timers, scores, invented story questions, or additional
rules are imposed. There is no animation requiring a reduced-motion alternate.

## Source inspection and provenance

Read the source recovery `README.md` and `MODERNIZATION.md`, then inspected:

- `objects/Movies/Pinoc-game/actionscript/scripts/Pinoc_fla/MainTimeline.as`
- `objects/Movies/Prosto-game/actionscript/scripts/Prosto_fla/MainTimeline.as`
- `objects/Movies/Snowhite-game/actionscript/scripts/Snow_fla/MainTimeline.as`
- Each object's `resources/texts/*.txt`, `resources/images/*.jpg`, and
  reconstructed `project/<name>.xfl/<name>/DOMDocument.xml` and library symbols.
- Companion `Pinoc1`, `Prosto5`, `Snowpart-0`, and `Snowpart-2` frame/replay
  scripts and resource inventory; `Pinoc1` FLV codec/dimensions/duration.

The authoritative source root is
`/home/ignat/code/mightymatica-source-recovery/`.
The separate archived site remains at
`/home/ignat/code/mightymatica-archive-2026-08-09/raw-site/`.
Neither archive was changed.

Assets in `public/media/stories/<object>/` are independent copies from
`objects/Movies/<object>/resources/images/`. All ten JPEGs from each of the
three puzzle objects are used: nine tiles plus `36.jpg` as the reference.
XFL instance/library mappings establish the row-major ordering:

- Pinocchio/Prostokvashino: `s11` → Symbol 4 → `2.jpg`, then
  `5,8,11,14,17,20,23,26.jpg` through `s33` → Symbol 28.
- Snow White: `s11` → Symbol 3 → `1.jpg`, then
  `4,7,10,13,16,19,22,25.jpg` through `s33` → Symbol 27.

Full original pictures were visually inspected directly. They depict
Pinocchio with a kitten, the Prostokvashino characters by a car, and the
seven dwarfs at a staircase. Original English instruction text appears in
Pinocchio/Snow White; Prostokvashino supplies Russian instruction text.
Modern instructions are translated; these are not claimed to be historical
English/Russian variant objects.

Collection attribution: Yuri Remizov / MightyMatica. Cartoon imagery remains
third-party material, preserved as original activity content; no new ownership
or blanket redistribution license is asserted. Rights review is necessary
before public redistribution.

## Explicitly unported

The original transition animations, scattered-piece motion, placement sound
effects, and exact parent/child timeline orchestration are not reproduced.
Companion films are now integrated through `src/content/films.json` and
`mediaUrl`. The native `StoryFilm.tsx` controller starts paused and muted, offers
play/pause, replay, opt-in sound and skip/continue, pauses on hidden tabs, and
pauses the element on unmount. Conversion was performed by a separate media
worker; see `docs/modules/films.md` and `public/media/films/provenance.json`.
There is no autoplay, including when reduced motion is disabled.

### Integrated companions

- `Movies/Pinoc1.swf`: cartoon reward originally loaded at Pinoc-game frame 181.
- `Movies/Prosto5.swf`: cartoon reward originally loaded at Prosto-game frame 181.
- `Movies/Snowpart-0.swf`: introduction originally loaded at Snowhite-game frame 2,
  removed at frame 106.
- `Movies/Snowpart-2.swf`: reward originally loaded at Snowhite-game frame 197.

These are embedded FLV/timeline movies, not additional picture-puzzle rules.
The media worker muxed each original soundtrack from frame zero without
stretching or truncating the video. All four manifest entries have `audio:true`.
The Snow White introduction appears before assembly, with an explicit skip.
Joining all nine pieces exposes the appropriate reward button. The assembled
picture stays visible and movable; opening the reward is an explicit choice.
Returning to the picture preserves completion and exposes a reward replay
button. Restart clears puzzle progress and returns Snow White to its intro.
Reopening the introduction alone preserves existing assembly progress.
No artificial post-completion delay is imposed.

Captions and descriptive transcripts are not restored. Source-sized movie
conversion and native controls are not a claim of exact timeline parity.

### Verified original transition map

All seven SWFs have 24 fps timelines. Pinocchio and Prostokvashino stop for
assembly at frame 154. Completing all nine pieces jumps to frame 157; frame 181
loads the reward companion, after 24 frames (about one second) of transition.
The parent stops at frame 240; the child movie has its own longer timeline.

Snow White loads the introduction at frame 2 and removes it at frame 106
(104 frames, approximately 4.333 seconds). Assembly stops at frame 170.
Completion jumps to frame 173; frame 197 loads the reward, again after
24 frames. The parent stops at frame 256.

Companion timeline lengths are Pinoc1 379 frames (15.792 seconds), Prosto5
390 frames (16.25 seconds), Snowpart-0 104 frames (4.333 seconds), and Snowpart-2
510 frames (21.25 seconds). Their recovered replay button jumps to frame 1.

## Verification

Presentation review covered all three puzzles and their companion player.
Each puzzle's recovered `DOMDocument.xml` uses a 600×420 `#66ffff` stage;
Pinocchio text uses Times New Roman Bold with pink `#ff0066` accents.
The original Pinocchio full-picture JPEG was inspected directly. Native boards
are now centered near their source picture dimensions, with aqua empty cells,
thin square blue frames, a compact three-column piece tray and a source-pink
selection cue. Cream fills, rounded piece labels and green selection styling
were removed. Placed tray pieces leave empty slots rather than faded duplicates.
Film playback stays black-backed and source-contained. Visible prose now
focuses on playing, with concise attribution; preservation limitations remain
documented here. No rules, phase flow, source media or manifest metadata changed.
Direct source/code/image inspection only; no browser or compiler was run.

The later control review removed repeated collection-author wording from the
puzzle footer while retaining the distinct cartoon-artwork rights notice.
Picture assembly, introduction/reward flow and companion controls are unchanged.

The latest direct-drag revision supersedes the earlier compact-tray presentation
described above, including the earlier placement-locking regression expectations.
No browser runtime verification was performed. Main owns integrated compiler
and build checks.

The story regression scenarios use the shared jigsaw rules and cover completion
away from the original board, the original Pinocchio one-pixel target variations,
moving the whole completed picture, and retaining a loose incorrect placement.
Executed `node --experimental-strip-types --test tests/stories.test.mjs` after
the shared grouping integration: 2 passed, 0 failed. Shared helper regression
coverage is maintained separately by its owner.

Earlier asset verification used `diff -qr` to confirm every copied JPEG
directory matched the recovered image directory byte-for-byte. The three
directories total approximately 960 KiB. Comparing complete
Pinocchio/Prostokvashino scripts showed only the package name and reward-movie
URL differ.

Manual checklist: open each of the three activities; inspect that the nine
tiles assemble into its reference picture; drop a tile at an arbitrary position
and confirm it stays there; join two correct neighbours away from the original
board, drag either one and confirm both move; join that group to another group;
finish all nine anywhere and move the whole completed picture; verify the reward
button opens the film without automatically hiding the picture on completion;
restart; repeat with keyboard
only and a narrow touch viewport; toggle the reference without losing progress.
For Snow White, play or skip the intro before assembly. Verify each reward is
initially paused/muted, supports sound, pause, seek and replay, and returns to
the completed picture without clearing pieces. Hide the tab during playback
and confirm it remains paused on return. Check perceptual audio synchronization
manually; neither this worker nor the media worker performed browser playback.
