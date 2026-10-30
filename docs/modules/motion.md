# Rolling and motion lessons

## Original interactive audiovisual lessons

The source animation with synchronized embedded audio is now the primary
experience for the seven audio-bearing motion activities. The mathematical
SVG explorers described below remain optional follow-ups after completion.
Silent ladder and cycloid activities are unchanged; no narration was invented.

`NativeMotionLesson.tsx` uses the shared native lesson player, source event
audio, chapter drawings, original Hint holds, and native answer/retry actions.
Question stops cannot be bypassed by generic Play or a seek slider. Incorrect
choices enter the original wrong-feedback frames and stop for Retry; correct
choices jump directly to the original correct explanation, skipping the wrong
branch. Source actions keep one player/audio session alive rather than restarting
the soundtrack when choosing an answer. Restart closes the optional explorer.

| Source variants | Question / wrong branch / correct start (global one-based frames) |
| --- | --- |
| `Coinsrotate-2c-e`, `Coinsrotate-2c` | 183 / 203–205 / 206 |
| `Coinrotate-sq-e` | 261 / 282–283 / 284 |
| `Coinrotate-sq-ru` | 261 / 281–283 / 284 |
| `Walk around earth`, `Walk around earth-ru` | 623 / 642–645 / 646 |
| `Byciclist-eng`, `Byciclist-ru` | 818 / 838–840 / 841 |
| `Byciclist-chi` | 818 / 819–840 / 841 |

The coin sources have a two-frame Intro scene: their numeric `gotoAndPlay`
targets are scene-local, while the recovered frame scripts and media manifest
use global frames. The Russian square's wrong branch starts one frame earlier
than the English source. The Chinese cyclists recording is explicitly selectable
as 中文, with its original 843-frame endpoint; it is not relabeled EN or RU.

The other source pairs are `Coinsrotate-e`/`Coinsrotate` (Hint 1257),
`Earthandbelt`/`Earthandbelt-ru` (Hint 580), and
`Caterpillar`/`Caterpillar-ru` (Hint 518, Play 519, endpoint 1000).
Source root and nested scripts, corresponding XFL scene boundaries, exported
texts, binary sound cues and native drawing exports were inspected.

`recover-native-lessons.mjs` records the exact bounded offline plans for both
owned families. It uses the shared serialized exporter and audited converter;
no ActionScript, original SWF, emulator, generated exporter chrome or raster
video is shipped. The motion result contains 15 variants, 49 lazy drawing
chapters covering 15,401 source frames, 185 original MP3 definitions and 227
root audio events. Converted drawing modules and MP3s live under
`public/media/motion/native/`; raw audio recovery metadata lives in
`.cache/motion-fractal-lessons/`, not the published media tree. The family-local
runtime manifest retains original source paths and SHA-256 hashes.

Raw source envelope order is preserved, including slightly out-of-order
final fade points in some coin and belt effects. Shared playback handles that
authored defect; the family does not reorder or rewrite the original cues.
DefineButtonSound feedback tags remain unported, separately from the restored
root audio. Dynamic ActionScript title effects are not executed by the drawing
renderer. Browser rendering, audio listening, timing and exact visual fidelity
still require manual acceptance.

Asset verification inspected all 59 motion/fractal chapter headers for complete
frame coverage and matching source stage dimensions, and verified the SHA-256
of all 246 extracted MP3 payloads against recovery metadata. It did not execute
the drawing modules, open a browser, listen to audio or run a compiler/build.

Recovery can target one exact variant, for example
`node src/modules/motion/recover-native-lessons.mjs motion square-coin/ru`.
The optional `--metadata-only` mode reuses existing recovered audio metadata and
chapter output without exporting another frame or extracting another track.
Fresh raw exports and inventories go to `.cache/motion-fractal-lessons/`.

Final focused verification:
`node --experimental-strip-types --test tests/motion-lessons.test.mjs tests/motion-rules.test.mjs tests/fractals.test.mjs`
passed all 15 tests (82 ms). New source-flow tests exercise question holds,
three wrong/one correct answer targets, original wrong-feedback stops and Retry,
language-specific scene offsets, and optional Hint versus mandatory quiz paths.
The first run exposed authored nonmonotonic envelope points; the shared engine
now accepts their numeric bounds and evaluates fades in source order without
sorting. No source metadata was altered to make validation pass.
No browser, integrated typecheck/build or full suite was run.

## Question-first lesson flow

Two-coins, square-coin, Earth-walk and cyclists keep their initial problem
diagram visible, but require the correct answer before exposing playback,
numeric counters, parameter extensions or the solution. Incorrect choices
stay at the question with retry feedback, not an instruction to inspect an
already-revealed solution. Completed choices remain locked until “Start the
question again” resets the lesson, parameters and paused playback together.
The playback Reset button only rewinds the demonstration.

This distinction follows the recovered `MainTimeline.as` answer stops and
wrong-answer return handlers: `Coinsrotate-2c-e` frames 183/205,
`Coinrotate-sq-e` frames 261/283, `Walk around earth` frames 623/645,
and `Byciclist-eng` frames 818/840. Their exported texts identify the numerical
answers and retry feedback.

The cluster source has no multiple-choice requirement: `Coinsrotate-e`
stops at frame 1257 for Hint after its counting sequence. The adaptation
therefore asks the question, offers “Let's count the turns”, and exposes
the explanation Hint at the demonstration endpoint (including static
scrubbing to that endpoint). It no longer invents a mandatory cluster quiz.
Earth-belt retains an explicit Hint reveal, matching frame 580.
Caterpillar keeps its editable problem board and reveals the shortest-route
explanation only when Hint is requested, matching its frame-518 Hint entry.
The unfolded board itself remains a documented adaptation.

Verification for this change: all nine existing motion-rule tests passed
with `node --experimental-strip-types --test tests/motion-rules.test.mjs`.
No browser, server, compiler or build was run; integrated verification belongs
to Main. Manually check wrong-answer retries do not expose controls/solutions,
correct answers unlock paused demonstrations, question restart restores the
initial state, cluster counting precedes Hint, and belt/caterpillar Hint
reveals work with keyboard, touch and reduced-motion preferences.

Ten interactive SVG activities preserve the mathematical questions and
models in Yuri Remizov's recovered lessons. Nine are marked `adaptation`, not
timeline-exact restorations. `motion-circle-in-circle` is a native mathematical
port of the original procedural drawing tool. Recovered penny, cyclist, fly, and caterpillar
bitmaps are reused unchanged. No sound was copied.

## Coverage and provenance

| Activity ID | Exact original objects | Preserved behavior |
| --- | --- | --- |
| `motion-circle-in-circle` | `Movies/Circincirc.swf`, `Movies/Circincirc-ru.swf` | Signed-radius slider, inside/outside rolling-circle equations, rim-point trajectory, number of center orbits and orbit counter. |
| `motion-coin-cluster` | `Movies/Coinsrotate.swf`, `Movies/Coinsrotate-e.swf` | Seven stationary pennies, six outer contact arcs of 120°, four moving-penny turns, continuous double-contact transitions. |
| `motion-two-coins` | `Movies/Coinsrotate-2c.swf`, `Movies/Coinsrotate-2c-e.swf` | Equal coin rolls once around another; answer is two turns, including the extra turn from circumnavigation. |
| `motion-square-coin` | `Movies/Coinrotate-sq-e.swf`, `Movies/Coinrotate-sq-ru.swf` | Square side length is 2πr; four edge turns plus four quarter-turn corners gives five. Continuous offset-path model includes corner pivot arcs. |
| `motion-earth-belt` | `Movies/Earthandbelt.swf`, `Movies/Earthandbelt-ru.swf` | One extra metre creates a uniform gap of 1/(2π) m. Adjustable extra length is a modern extension. |
| `motion-earth-walk` | `Movies/Walk around earth.swf`, `Movies/Walk around earth-ru.swf` | Six-foot traveler's head goes 12π ft farther than feet. Height adjustment extends the original question. |
| `motion-cyclists` | `Movies/Byciclist-eng.swf`, `Movies/Byciclist-ru.swf`, `Movies/Byciclist-chi.swf` | Original 40 km, 15/10 km/h cyclists and 100 km/h fly, 160 km answer; event-based fly reversals. |
| `motion-caterpillar` | `Movies/Caterpillar.swf`, `Movies/Caterpillar-ru.swf` | Opposite cube corners, shortest surface route via unfolding. Movable seam crossing exposes the straight-line optimum. |
| `motion-ladder` | `Movies/Ladder.swf`, `Movies/Ladder-ru.swf` | Adjustable length (original default 275), cat position, linearly moving foot, rigid ladder, cat trace. |
| `motion-kitten-ladder` | `Movies/Kitten and Ladder.swf` | Fixed length 300, initial cat halfway, same rigid-ladder geometry and trace. |

For every listed object the recovered `actionscript/**/MainTimeline.as` and
`resources/texts/*.txt` were inspected. English/Russian text, quiz listeners,
frame-script stops, and numerical ladder equations establish the distinctions.
The original timelines drive most non-ladder animation; modern diagrams use
explicit mathematical rules instead. Recovery `README.md` and `MODERNIZATION.md`
were read before implementation.

### Seven-penny geometry

The reconstructed Russian `Coinsrotate` XFL `DOMDocument.xml`, Scene 1,
layers 15–21 contains seven stationary `Symbol 15` instances. Their centers are
approximately (322.65,226.25), (322.65,171.75), (229.2,226.75),
(229.7,172.25), (275.7,253.75), (275.5,145.45), (276,199.5).
`Symbol 15.xml` draws the fixed bitmap in a 54 × 54 square. These are six
radius-27 pennies around a central penny, with minor authoring round-off.
Layer 14 contains hundreds of moving-penny keyframes, changing symbol during
the counting sequence.

The port normalizes the authored positions to the exact regular hexagonal
packing. For outer center Cᵢ = 2r(cos(iπ/3),sin(iπ/3)), the moving center follows
Cᵢ + 2r(cos α,sin α), with α from iπ/3−π/3 to iπ/3+π/3.
Each arc length is 4πr/3, producing ⅔ of a spin. Six arcs produce four spins.
At shared arc endpoints the penny touches two adjacent stationary pennies,
so the contact normal changes but position and orientation do not jump.
This is not a convex perimeter formula and does not add artificial corner
pivots. Tests check all five internal joins, closure, four-turn count, and
nonpenetration against every outer penny over 601 samples.

### Recovered art

Copied unchanged from `objects/Movies/<object>/resources/images/` in the
read-only recovery into `public/media/motion/`:

| Runtime file | Recovered image |
| --- | --- |
| `penny-head.png` | `Coinsrotate/13.png` |
| `penny-tail.png` | `Coinsrotate/9.png` |
| `cyclist-blue.png` | `Byciclist-eng/22.png` |
| `cyclist-red.png` | `Byciclist-eng/36.png` |
| `fly.png` | `Byciclist-eng/49.png` |
| `caterpillar-head.png` | `Caterpillar/20.png` |

All six bitmaps were visually inspected before reuse. The cyclists and fly
move according to the original numerical scenario. The recovered caterpillar
head traverses the selected unfolded surface route. These are animated
mathematical adaptations, not claims to reproduce the original skeletal
motion, frame timing, wing motion, or cube-unfolding timeline.
The ladder originals themselves draw a line and a red circular cat marker
in ActionScript rather than a kitten bitmap; the port retains that approach.
Recovered artwork retains its original provenance; no new blanket license is
asserted for these images.

The Chinese cyclist source has the same scenario constants and correct fourth
quiz choice; its ending is shorter than the English/Russian explanatory ending.
It is covered as a behavioral adaptation only: Chinese UI is not restored because
the shared locale contract supports English and Russian. English/Russian wording
is newly typeset, with Russian translation for the English-only kitten source.

## Current differences and restoration gaps

The remaining schematic diagrams, unfolded-board replacement and changed trace /
control behavior below are fidelity gaps, not permission to replace the original
lesson UX. Restore authored layout, sequence and playback around the restored
question gates. Parameter extensions and inspection controls should remain
supplementary and must not bypass those gates. Keep explicit mathematical
qualifications, reduced-motion support and safe lifecycle behavior.

- The mathematical explorers do not themselves reconstruct the source title,
  narration, theatrical timeline or cube unfolding. The primary source lessons
  above now supply recovered timeline artwork and embedded audio separately.
  The procedural ladder still has no invented cat illustration.
- Caterpillar shows the unfolded adjacent faces directly, not a manipulable 3D
  room. All equal cube face-pair routes are symmetric; only one is drawn.
- The ladder diagram uses a fixed viewport scale, and its blue trace shows the entire locus
  rather than accumulating history. Cat position is clamped to the ladder
  instead of permitting the original slider's beyond-end positions.
- Belt clearance is reported precisely as 15.92 cm for one metre. The original's
  “enough for any cat” is qualified; animal size is not a mathematical guarantee.
- Earth diagrams exaggerate separation and say so visibly. Earth walk assumes
  an upright radial traveler and both Earth lessons assume a perfect sphere.
- Animation is opt-in, stops at the endpoint, pauses in hidden tabs through
  `useAnimation`, and is disabled under reduced motion. Sliders support static
  inspection. No audio, GPU resources, custom global listeners, or remote assets.

## Circincirc native explorer

`Circles.tsx` implements the authored `Circincirc_fla/MainTimeline.as`
`initialize`, `sliderChanged`, and `timerListener` rules. The 380-line main
script was read in full; the much larger supporting source consists mostly of
Flash controls. The Russian `Circincirc_ru_fla/MainTimeline.as` was compared
against it: only package name, label formatting/translation and an initial
graphics clear differ. Both text exports and the XFL document header and
procedural/control layout were inspected. There are no drag rules to reconstruct
and no character art in this tool: circles, blue trace and red point are drawn
by ActionScript.

Original behavior:

- Slider from −300% through 100%, step 1%, initial 20%.
- A zero ratio becomes 50% on Start, avoiding division by zero. The port makes
  this fallback visible rather than leaving a misleading zero label.
- Negative signed radius draws an epicycloid outside; positive draws a
  hypocycloid inside.
- R = 60 for ratios below −90%; otherwise R = 180.
- θ decreases by one degree each tick. Center = (R−r)(cos θ, sin θ);
  internal angle = −θ(R−r)/r; point = center + r(cos angle, sin angle).
- Number of “spins” is actually center orbits, not the rolling circle's own
  rotations. A trace uses 360 original one-degree samples per orbit.

Native UI adds pause, clear/reset, scrubbing, whole-trace reveal, explanations,
and whole-number orbit counts from 1 to 20 to bound the trace at 7,201 vertices.
Playback is slowed from
the original nominal one-millisecond timer to 90 center-degrees per second.
Changing controls clears and pauses the drawing. The diagram auto-fits rather
than clipping large outside curves to the fixed original 1000×800 stage.
The responsive drawing viewport has a stable height independent of the radius,
and the brief zero-radius explanation stays in place while controls change.
The section preview uses a static SVG sampled from the same radius-20 equations,
so opening the activity no longer begins with an empty illustrated slot.
Reduced motion disables playback while retaining all static inspection.
These do not change the equations, but altered timing, bounds and composition
remain UX differences to review against the source. Extra inspection controls
should supplement the original Start/slider workflow, not replace it.

Manual checks: 50% gives a diameter, 100% a fixed point, 25% a four-cusped
curve; −100% gives an exterior one-cusped curve; 30% closes after three orbits;
0% announces its 50% fallback. Check both locales and keyboard control paths.

## Verification

### Ladder presentation

The ladder activities use the original Ladder stage's aqua (`#66ffff`),
Times New Roman text, brown (`#993300`) ladder, blue (`#0000ff`) trace,
thin black wall/floor and red circular cat marker with a black outline.
Both recovered `MainTimeline.as` files draw the moving ladder as a single
stroke and the cat as a radius-10 point; no invented kitten bitmap or rungs
are added to this procedural diagram. The recovered Ladder XFL document
establishes the stage color and typeface. The reference collection screenshot
was also inspected for the embedded arrangement.

The shared optional `embedded` prop selects a compact diagram and controls,
without the introductory paragraph, coordinates or mathematical explanation.
Standalone activities retain the explanation as plain text on the aqua stage.
The generic adaptation footer is removed from this family in both locales.
Motion rules, playback, reset and keyboard-native range controls are unchanged.

Presentation-only verification: source and CSS inspection, no browser run.
Main runs integrated static/build checks. Manually compare the aqua diagram
against the collection, check narrow-screen control wrapping, and use Tab,
arrow keys, Play and Reset in both embedded and standalone views.

### Motion-family presentation review

Reviewed the recovered XFL `DOMDocument.xml` headers and font declarations
for Coinsrotate, Coinsrotate-2c, Coinrotate-sq-e, Earthandbelt, Walk around
earth, Byciclist-eng, Caterpillar and Circincirc, plus their exported lesson
text. Every reviewed stage declares aqua `#66ffff`; the principal lesson
typeface is Times New Roman. No reviewed native activity stage declares a
white or black background. Embedded source media elsewhere in the collection
can still have intentional white/black backgrounds; these styles do not
target that media or any other family.

Motion-family diagrams now use transparent backgrounds on aqua, thin black
construction lines, and serif diagram labels. Generic lavender diagram
panels, pale filled geometry, rounded cream explanation boxes and green
status cards are removed locally. Original penny, cyclist, fly and
caterpillar bitmaps remain unchanged. Controls and quiz answers remain
semantic buttons/ranges with visible focus and selected-answer states.

Circincirc's original procedural drawing calls specify black one-pixel
circles, a blue one-pixel trajectory and a red point with a fine black
outline. The native explorer now uses those colors instead of muted navy,
gray and red with a white halo. Its embedded view omits long introductory
and explanatory text while retaining controls and status. No drawing
equations, animation rules or parameter bounds changed.

This is a presentation review, not a new claim of timeline-exact fidelity:
the existing Earth and unfolded-room diagrams remain schematic, and source
theatrical sequences are not reconstructed here. No browser, compiler,
build or tests were run for these presentation-only changes; integrated
verification belongs to Main. Manually check coin/image visibility on aqua,
quiz selection/focus contrast, control wrapping, and Circincirc's trace at
50%, 25% and a negative ratio.

Ran `node --experimental-strip-types --test tests/motion-rules.test.mjs`:
all nine tests passed (71 ms).
Tests cover rigid ladder constraints and midpoint locus, rolling turn totals,
the cube optimum, circle length identities, Circincirc diameter/stationary
degeneracies, signed-radius contact and multi-orbit closure, and the fly's exact meeting and
containment between cyclists. No browser automation or visual verification was
performed. Main owns integrated compilation and build.

Manual checks: inspect each diagram on narrow screens; scrub each endpoint;
watch coin orientation markers complete their four/two/five turns; compare
ladder fractions 0%, 50%, 100%; check cyclist endpoint is 160 km; change belt
length and traveler height; move the caterpillar seam crossing and restore its
midpoint; verify all controls by keyboard and reduced-motion settings.

### Seam-crossing interaction review

The caterpillar's unfolded diagram now accepts direct dragging of its marked
seam crossing, alongside the existing keyboard-native range. Pointer capture
keeps dragging active outside the marker; conversion through the SVG screen
matrix accounts for scaling and letterboxing. Crossing edits pause playback
without resetting its position. The moving head cannot obscure the hit target.
This is an interaction addition to the mathematical adaptation, not a recovered
source gesture: the Caterpillar main and playback-symbol scripts expose
timeline hint/play/pause buttons rather than an editable unfolding.

The narrow motion/fractal rule run passed all 12 tests. No browser or integrated
compiler was run. Manually drag the marker to both seam endpoints on mouse and
touch, including while the head passes over it; verify that the range stays in
sync, playback pauses, and the shortest-route button restores the midpoint.

### Final family review and ladder-size regression

Reviewed all ten manifest IDs: `motion-circle-in-circle`,
`motion-coin-cluster`, `motion-two-coins`, `motion-square-coin`,
`motion-earth-belt`, `motion-earth-walk`, `motion-cyclists`,
`motion-caterpillar`, `motion-ladder`, and `motion-kitten-ladder`.
Checked current question gates, wrong-answer retry, Hint availability,
progress inspection, paused playback and replay/reset paths against the
recovered MainTimeline stop/answer handlers cited above, including Ladder's
`startTimer`/`timerListener` geometry and the kitten's fixed-length variant.
Circincirc's fixed-height viewport and integer orbit controls are preserved.
No new quiz is added to the cluster, belt, caterpillar or ladder activities.

The adjustable ladder had a confirmed rendering bug: every coordinate was
multiplied by `300 / length`, cancelling the selected length from the diagram
and cat locus. Its viewport now uses a constant `300 / 350` scale for the
100–350 length range. At the same cat fraction and progress, changing L changes
the visible ladder, cat position and trajectory together. The fixed-length
kitten retains its previous scale. Mathematical rules are unchanged.

The 12 motion/fractal deterministic tests passed in the focused run recorded
above. This spatial fix requires manual comparison at lengths 100, 275 and
350 in the embedded LiveGeometry lesson and standalone activity; also inspect
midpoint and endpoint cat positions and narrow-screen layout. No browser or
integrated checks were run. Original theatrical introductions, narrated
demonstrations and Caterpillar's animated cube unfolding remain the documented
authored-media gaps; this pass does not claim exact timeline or visual parity.
