# Magic arithmetic restoration

## Painted hourglass Hint control (2026-10-31)

The hourglass Hint at frame 765 now leaves the original painted button visible,
using a transparent semantic hit area instead of drawing a second HINT label
over it. Bounds come from each language's source DefineButton2 Hit artwork and
XFL placement, not the previous approximate replacement rectangle. English
symbol 38 and Russian symbol 37 share the recovered Hit envelope but retain
their own source hashes in `source-controls.json`.

The existing root-play continuation, frame-766 button sound, final solution
stop and optional simulator unlock are unchanged. No source Play/Pause control
was demonstrated for either hourglasses or subtraction, so no native transport
sprite or subtraction interaction was added or patched.

Reproduce this family's geometry with
`node scripts/algebra-coloring-magic-playback-control.mjs --recover-controls`.
Recovery reads the preservation tree without modifying or exporting it. The
script's painter-patching mode deliberately excludes magic. The existing
focused hourglass-gate and subtraction-timer tests passed. Main owns integrated
type-check/build; no browser or listening verification was performed.
Manual acceptance: both localized hourglass lessons stop at the question,
their single painted Hint supports keyboard/touch, and selecting it starts the
solution and source button sound once; restart hides exploration as before.

## Source-stage presentation review

All six activities were reviewed against the recovered XFL `DOMDocument.xml`
files and text/vector attributes. Mindread intentionally keeps its black stage,
white Arial-rounded-style instructions, unboxed number/symbol chart and purple
prediction ball. Mistic subtraction and Twohourglasses use the source `#66ffff`
stage and Times New Roman teaching text; the arithmetic is emphasized in blue.
All three mouse games likewise use their authored `#66ffff` stage with black
walls, rather than the former pale-green board and rounded frame. Existing
recovered mouse, cat and cheese artwork remains unchanged.

This does not claim exact Flash reconstruction. Mindread's Unicode symbols and
the mazes' numbered target markers remain adaptations. Subtraction and
hourglasses now use recovered native Canvas artwork with synchronized original
audio as their primary experience; the simplified teaching pages have been
removed. No browser run or compiler/build was performed by this shard.

Implemented logical activities (English and Russian share rules):

| ID | Original artifacts | Coverage |
| --- | --- | --- |
| `magic-mindread` | `Movies/Mindread.swf`, `Movies/Mindread-ru.swf` | Secret two-digit choice, digit-sum subtraction, 0–99 symbol chart, ball reveal, repeat rounds, optional algebraic explanation after reveal. |
| `magic-mistic-subtraction` | `Movies/Mistic substr.swf`, `Movies/Mistic substr-ru.swf` | Original narrated animation, first-minus-last digit constraint ≥2, reverse/subtract/reverse/add, 1089 reveal, twenty final half-second examples. Entered examples/proof unlock after the lesson. |
| `magic-two-hourglasses` | `Movies/Twohourglasses.swf`, `Movies/Twohourglasses-ru.swf` | Original narrated question and animated solution, explicit HINT stop, replay. The 11/7-minute event-based simulator unlocks after the lesson. |

All three remain catalogued as **adaptations**, without a visual/listening parity
claim. Mindread uses distinct Unicode symbols and deterministic round rotation
rather than the original fixed chart-image timeline.

## Interactive audiovisual lessons

The user requirement is an interactive animated/video lesson, not a page of
explanations. `MagicLesson.tsx` now composes `OriginalLessonPlayer` for both
verified language variants of subtraction and hourglasses. Source animation,
text and audio play together after an explicit Play gesture. There is no seek
control or substituted quiz. The original hourglass question plays through to
global frame 765 and waits for HINT before the solution can advance. Generic
source transport pause/resume is available, but no answer is revealed merely by
opening the activity. Explorers are unmounted and unavailable until completion.

Six audited native drawing modules cover 4,852 selected global source frames:
subtraction 1–896 per language; hourglass question 1–765 and hint 766–1530 per
language. They contain drawing only, not SWF or ActionScript playback. The first
packed exports were rejected by the converter; re-exporting with the shared
helper's `packJavaScripts=false` produced plain drawing code accepted by the
unchanged audited conversion route. No packed JavaScript was evaluated.

`recover-lesson-audio.mjs` extracted 36 original embedded MP3 payloads, whose
hashes were rechecked against metadata. All twelve subtraction root cues and
thirty hourglass root cues preserve original global frame placement, overlap,
trim, loops and stereo gain envelopes. Empty stream headers are not treated as
sound streams. There are no actual nested StartSound events in these sources.

The hourglass HINT includes a separate DefineButtonSound: EN button 38 uses
sound 37; RU button 37 uses sound 36. Exact binary transition bytes and XFL button
state 2 establish its pressed-state trigger. The native controller maps it to
frame 766, immediately after the explicit HINT action: at most one source-frame
later than Flash's pointer-down event, rather than incorrectly flattening it
as a continuously running nested narration cue.

The subtraction root stops at 895 and starts twenty 500 ms dynamic text updates.
The native definition holds that exact source drawing for ten seconds. A
`drawOverlay` callback restores the five original empty device-text fields at
their XFL coordinates with valid randomly chosen examples, using the shared
active presentation clock. Only after that timer finishes does the finite native
presentation enter adjacent drawing 896 and complete. This extra terminal
transition replaces the original permanently stopped timeline; it is not an
attempt to execute its remaining unreachable root frames. Pausing or hiding the
tab also suspends example updates. Source random-number probabilities are not
claimed bit-identical; all examples preserve the original digit constraint.

Native media totals about 9.8 MiB for these four language lessons and loads on
demand. `native-lessons.json` contains media-relative paths, not absolute archive
paths. `build-native-lessons.mjs` verifies chapter coverage and exact hint-button
metadata before rebuilding it. The four `*-audio.json` files retain offline
binary audit evidence and are not imported by runtime code.

Mindread was separately inspected: one 67.027-second embedded track, four
reveal-start cues at 76/198/311/436 and gain envelopes, without a multi-track
narration sequence. The EN/RU payloads are byte-identical, so one original
132 KiB MP3 serves both. `useMindreadSound.ts` reuses the shared cue-only audio
owner to play the matching source-round envelope only when the player both
opts into Reveal sound and clicks the ball. Merely enabling sound does not play
it. The source fades fully silent after 3.42–3.60 seconds; the adapter disposes
its one live owner at that point instead of running a silent track for a minute.
New rounds, disabling sound and unmount also dispose it; hidden tabs suspend
its active clock and sound. Slow loading/error retry cannot revive a disposed
round. No listening/transcription was performed, so it is not labelled silent
or certified narration; no invented narration was added. The chart artwork
remains an adaptation. Mouse audio remains separate game-effects restoration work.

Remaining acceptance work: listen for EN/RU synchronization, check source
device-font baselines in the final examples, and visually compare authored
question/solution composition. Runtime teardown, sound failure/retry, explicit
playback and hidden-tab suspension are provided by the shared lesson player;
browser behavior has not been verified by this shard.

## Inspected evidence

Read recovery `README.md` and `MODERNIZATION.md`. Inspected each implemented
object's `actionscript/scripts/*/MainTimeline.as`, extracted `resources/texts/*.txt`,
and reconstructed `project/.../DOMDocument.xml`. English and Russian extracted
texts establish equivalent mathematics. Mistic's `newNumbers` explicitly computes
the reverse, difference, reverse difference and sum. Hourglasses text explicitly
gives `4 + 11 = 15`; its timeline stops for a hint at frame 765.

## Mouse games: source-topology adaptations

- `magic-mouse-cheese` / `Movies/Mouse-cheese.swf`: all three maze scenes,
  moving cats, cheese goal, loss/retry, level selection and next-level progression.
- `magic-mouse-cherry` / `Movies/Mouse-cherry.swf`: all eight exact-count targets
  3–10, authored cherry-bunch positions/values, irreversible once-only collection,
  and exact-count checking at the cheese.
- `magic-mouse-cherry-oppo` / `Movies/Mouse-cherry-oppo.swf`: all five supplies
  3–7, authored mousekin-group positions and costs, once-only feeding,
  insufficient-food failure, and no-leftovers checking at the cheese.

`extract_mouse.py` mechanically imports nested XFL wall-edge geometry with full
affine transforms into `mouse-data.json`. It selects active scene frames using
the original ActionScript setup-frame numbers, extracts cat patrol axis, endpoints
and durations from `new Tween`, and extracts collectible/group coordinates from
the same frame functions. It rejects unexpected curved/hex wall-edge syntax rather
than silently dropping it. The output includes source frame numbers for auditing.
Run the importer from the standalone repository root; it reads but never writes
the recovery archive. Media copied verbatim from Mouse-cheese resources:
`47.png` → `public/media/magic/cat.png`, `66.png` → `mouse.png`,
`52.png` → `cheese.png`. These recovered illustrations are not newly licensed.

Fidelity is **adaptation** for all three: static original mouse/cat/cheese bitmap
art is reused, but original eye/tail/sprite sub-timelines, fireworks and audio are
not reproduced. Cherry and mousekin-group markers use explicit numbered DOM/SVG
symbols rather than original illustrated sprites. Walls preserve original topology
and cat patrols preserve original source timing with quadratic ease-in/out.
Bounded circle/segment and ellipse contacts replace Flash pixel-mask collision.
Keyboard movement is normalized, supports wall sliding and has an adapted speed;
pointer movement travels directly toward the selected point rather than the
original discrete diagonal-then-axis timer. The collision footprint is intentionally
smaller than the illustrated body so narrow authored passages remain navigable.

The reverse-cherry source contains contradictory later success-frame comparisons
against the initial supply, even though its actual cheese contact branch explicitly
requires no cherries left. The adaptation follows the stated distribution lesson
and the zero-leftover contact branch consistently. It repairs negative-food and
duplicate-feed behavior by rejecting insufficient supplies before deduction.
No invented maze or substituted generic arithmetic exercise is used.

## Verification

Focused deterministic tests cover every eligible three-digit input, every
two-digit secret across multiple rounds, sand conservation, event progression,
and the source hourglass solution. Main owns integrated compiler/build checks.
No browser testing performed.

Mouse checks: focused tests verify once-only collection/feeding, exact exit
conditions, insufficient food, thin-wall collision, reversing cat patrols, and
static reachability of every exit and target in all sixteen imported scenes.
Reachability ignores moving-cat timing and does not establish visual fidelity.
Manual check: each game at narrow width; all arrow/WASD/touch/pointer controls;
pause/resume; collision and loss/retry; correct/incorrect counts; every scene's
target markers and patrols; restart, level selection and final completion.

Manual checks: use keyboard and touch for all controls; inspect chart at narrow
width; verify no reveal/proof appears before requested; repeat symbol rounds;
enter invalid and valid subtraction numbers; solve glasses with start-both,
wait, mark, wait, flip-11, wait; reset and try an incorrect interval.

## Input review

Final sharded review covered all six IDs in the table/list above, including
all sixteen imported maze scenes (3 cheese, 8 collect, 5 distribute). Read
the three recovered mouse main timelines' setup/contact/progression branches,
the topology importer and all native mouse rules/UI; checked XFL stage/timeline
metadata for all nine localized magic source objects. Reviewed EN/RU
Mindread, Mistic subtraction and Twohourglasses extracted text, English main
timeline scripts, the source hourglass HINT stop, and the subtraction final
twenty-example timer. No source artwork was regenerated or changed.

The mouse pointer destination now clears when the board loses focus, matching
the keyboard/direction release path, so an abandoned pointer command cannot
keep steering the mouse after focus leaves. Explicit play/pause, hidden-tab
suspension through the shared animation hook and listener cleanup are retained.
The later audiovisual followup replaces the arithmetic/hourglass text stages;
their source timer and audio now share the player's bounded lifecycle.

The focused command recorded in the quiz module notes passed 15 tests,
including reachability for every exit/target in all sixteen mazes. No browser,
devserver, integrated compiler/build or broad suite was run. Manual acceptance:
check mental arithmetic before the 1089 reveal, optional examples/proof,
hourglass question then HINT/replay, optional simulator reset, and mouse
pointer movement stopping when focus leaves the board, in both languages.

Audio followup checks:
`node --experimental-strip-types --test tests/magic.test.mjs tests/magic-native-lessons.test.mjs`
passed six tests, including a source HINT stop that cannot auto-advance and the
ten-second final-artwork hold with exactly twenty half-second example updates.
All four definitions passed `validateOriginalLesson`; all 36 MP3 hashes were
verified; `node --check` accepted the family metadata builder and all six native
drawing modules. Integrated compiler/build checks remain Main's responsibility.
No browser, server, listening/transcription or full suite was run.

Manual audiovisual checklist: explicit Play/Sound/Pause in both languages;
hourglass pauses at its question and requires HINT; source illustrations, sand
and text stay aligned with audio; subtraction's final fields update twenty times
then stop; pause/hidden-tab freezes both examples and audio; restart resets
progress and hides explorers; leaving the activity silences it; media errors offer
retry; reduced-motion users retain explicit playback control.

Mindread acceptance: reveal feedback is checked initially per the user's
request; opening the activity or enabling sound alone is silent;
ball reveal plays only the selected original fade envelope; Try again, sound
off, navigation away and hidden-tab suspension cannot leave sound behind; slow
loading/retry cannot play an abandoned round. Its original MP3 hash was verified
against the recovered payload and byte-identical Russian counterpart. The
shared audio owner now accepts a cue-only definition; no fictitious Canvas
chapter is needed for an effect adapter. No additional browser/platform tests
were added merely to test Web Audio or React behavior.

Maze WASD handling now normalizes letter case on both press and release.
Caps Lock or holding Shift therefore no longer disables the advertised controls,
and releasing Shift before releasing a movement key cannot leave that key stuck.
Arrow keys and direct pointer destinations are unchanged. This was checked by
source inspection; manually check WASD with Caps Lock and changing Shift while
holding a direction, alongside pause, blur, and touch controls.
## Rendering/performance review (2026-10-31)

All six activities were reviewed: Mouse and cheese, Mouse collects cherries,
Mouse shares cherries, Mind-reading ball, Mysterious subtraction and Two
hourglasses. The three mouse games already update bounded mouse/cat SVG refs
per tick rather than rerendering every wall and target through React; React
snapshots change only on count/status/used-target transitions. Movement,
collision, feedback, source levels and pause behavior remain unchanged.
The ball uses event-driven DOM/SVG with a finite owned audio envelope; no
generated Canvas filter pipeline was found there.

The EN/RU subtraction lessons and hourglass question painters now cache verified
static-text shadows at source density using cropped layers bounded to 24
entries/2 million pixels. This replaces 2,292 filter blocks across four painters.
Both hourglass hint painters have no authored filter placements and remain
byte-identical. Generic FFDec filter-library definitions are not mistaken for
active scene calls. After rewriting, none of the six magic painters retain an
authored direct glow/shadow/blur placement.

Exact bounds and source hashes are in `subtraction-text-bounds.json` and
`hourglasses-text-bounds.json`, recovered separately from `Movies/Mistic substr.swf`,
`Movies/Mistic substr-ru.swf`, `Movies/Twohourglasses.swf`, and
`Movies/Twohourglasses-ru.swf`. No original shadow was removed. The hourglass
HINT gate, subtraction's twenty half-second examples, narration, source timing,
questions and metadata remain unchanged.

After raw regeneration:

```sh
node src/modules/magic/optimize-painters.mjs --apply --recover
```

The tool validates preserved-source hashes, backs up existing painters under
`.cache/magic-filter-originals/`, syntax-checks candidates, deeply compares
metadata/export names, checks idempotence and refuses concurrent painter edits.
`filter-optimization.json` retains before/after hashes and changed block counts.
Bounds recovery never executes SWF or ActionScript. The original sources remain
read-only. All four changed candidates passed these checks; the combined focused
logic/magic/quiz run passed 27 tests. No browser, FPS or pixel-parity verification,
audio listening, service, full suite, build or integrated compiler was run.

Manual acceptance remains: both language text/shadows throughout the two
lessons, HINT stop and explicit continuation, the final subtraction examples,
restart/unmount, and mouse/cat movement and count/status feedback on all three
games. Existing lifecycle wording elsewhere in this historical document does
not imply that this rendering-only pass changed background playback policy.
