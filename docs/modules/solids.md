# Solids restoration

## Sphere completion explorer action

The Sphere wrapper now supplies the shared player's completion-only **Try it
yourself** / **Попробовать самостоятельно** action. It opens the existing
mathematical explorer, then focuses its heading after mounting and scrolls it
into view. Reduced motion uses immediate scrolling; otherwise scrolling is
smooth. Restart clears the reveal and focus request. The separate corrected
quiz remains available after completion and is not bypassed or replaced.
No explorer formulas or sliders are mounted before the lesson completes.
This wrapper change was source-inspected, not browser-verified; shared overlay
rendering and transport are owned by Main.

## Cube and tetrahedron original soundtracks

The two rotatable activities now offer an opt-in **Play original soundtrack**
control, with Pause and Replay. This is source audio, not a claim of narration.
It does not replace or change the native geometry interactions or the Sphere
lesson. There is no audio autoplay or additional Canvas export.

`SourceSoundtrack.tsx` owns a single HTML audio element and a lazily created
Web Audio gain graph. Source channel gains are preserved:

- Cube sections loads the exact literal `Swinger-Singers.mp3`, available at
  archive `raw-site/Movies/Swinger-Singers.mp3`. Both source controllers use
  `SoundTransform(0.4,0)` and restart the track from `SOUND_COMPLETE`.
  Native playback retains stereo, gain 0.4 and repeating playback.
  Runtime copy: `public/media/solids/audio/cube/Swinger-Singers.mp3`;
  SHA-256 `5005dd06796c938a249cf32433abac35dc6c4fead8befb504a58c943501415e3`.
- Tetrahedron's root frame 1 starts embedded sound 25 once. English and Russian
  contain identical MP3 bytes, so both use the one runtime copy
  `public/media/solids/audio/tetrahedron/25.mp3`.
  Its mono input is sent to stereo gains **9755/32768** left and
  **11506/32768** right, matching the source envelope at mark 0.
  SHA-256 `c2555bb4c5dadb5547b5df63439319af633f4894dad0e40da8aee4cd3ab0ebb5`.
  Original declared samples represent about 52.422 seconds; measured MP3 packet
  duration includes decoder padding and is not a claim of sample-exact playback.

Both tracks pause when the document becomes hidden and require explicit Play
to resume. Unmount invalidates pending playback, pauses/unloads the audio,
removes the visibility listener, disconnects nodes and closes the owned audio
context. Rapid Pause/Replay and asynchronous play failures are bounded by a
request token. Sound failures leave the geometry usable and expose retry text.

Source evidence: cube EN/RU `MainTimeline.frame1/musicStart`, tetrahedron
`DOMDocument.xml` root Sound Layer 0 and binary root SOUNDINFO recovered by the
generic audio tool. Provenance metadata is beside each runtime track. The
tetrahedron recovery reported one root cue, one MP3 and zero unsupported
records; source/copy SHA-256 checks passed for both tracks and both tetrahedron
language variants. `ffprobe` confirmed cube stereo/44100 Hz and 183.066122 s.
No compiler, browser, server, Canvas export, build or full-suite run was made
for this soundtrack-only follow-up. Manual acceptance must verify opt-in
silence, both gains/balance, cube repetition, tetrahedron ending, Replay,
hidden-tab suspension, rapid Play/Pause and navigating away during loading.

## Sphere interactive-video primary flow

The sphere activity now opens the recovered native animated lesson, not the
mathematical explorer. `SphereLesson.tsx` wraps the shared
`OriginalLessonPlayer` with the language-specific metadata from
`src/content/sphere-lesson.json`. The generated drawing modules and original
audio assets are lazy media owned by the separate source exporter. No SWF,
emulator or reconstructed ActionScript is executed.

The primary flow follows the inspected root timelines:

- English: explicit initial Play at 3; proof ends at 2878 with **Go to
  Examples**; examples title waits at 2901; examples hold for four seconds at
  3113, 3292, 3514, 3751 and 4031; explicit continuation at 4147 leads to the
  volume-growth/surface-area ending through 5071.
- Russian: explicit initial Play at 73; four-second proof holds at 944 and
  1128; **Посмотреть примеры** at 2879; four-second example holds at 3112,
  3291, 3513, 3750 and 4030; drawing playback ends at 4361, immediately before
  the original first quiz prompt at 4362.

These numbers are internal source evidence, not visible playback counters.
Both sources are 550×400 at 24 fps. Read the complete English/Russian
`MainTimeline.as`, English `pp_11`, Russian `pp_12` and `pp_69`, all extracted
text resources, and source XFL transport/Examples placements. Scene offsets
and audio timing are documented by the exporter in
`docs/reviews/sphere-native-media.md`. The source has original event audio;
there is no narration stream to invent or synthesize. Source `stop()` pauses
drawing, not ongoing event sounds. The shared player owns sound suspension on
explicit Pause/hidden tabs, timed holds, resource disposal and reduced-motion
behavior.

After actual lesson completion, a separate **Check your understanding** button
opens the existing corrected eight-question native quiz. English remains an
explicit translation of the Russian quiz, not a claim that the English film
contained one. An initially collapsed **Explore the mathematics** section
mounts the previous numerical explorer only when opened. Neither explanatory
formulas nor explorer sliders are exposed before completion. The final-formula
reference illustration and unrelated static companion are not placed before
the sphere film. Restart hides and resets the follow-up quiz and explorer;
changing language remounts the lesson, so completion in one language does not
bypass the other language's authored sequence.

Wrapper changes are confined to `SphereLesson.tsx`, sphere integration in
`index.tsx`, small follow-up layout rules in `solids.css`, and these notes.
Shared-player implementation, generated metadata/audio/drawing exports and
integrated verification belong to Main and the media exporter. No compiler,
build, browser or server was run by this wrapper worker; no deterministic
mathematical rules changed in this follow-up. Manual acceptance must verify
initial silence/Play, source Examples hotspot and continuation, audio through
four-second holds, Pause/hidden-tab suspension, English derivative ending,
Russian pre-quiz handoff, later quiz/explorer gating, Restart and locale changes.
Native drawing and MP3 synchronization are not visually/audibly certified here.

## Final sharded UX review

Reviewed all three manifest entries: `solids-cube-sections`,
`solids-tetrahedron-weekdays` (including the complete 01–07 target range), and
`solids-sphere-volume` with all eight quiz routes. Inspected bilingual recovered
texts, cube and tetrahedron `MainTimeline.as`, English sphere proof timeline,
and the Russian sphere quiz stop/correct branches at
4362/4532/4626/4755/4921/5100/5220/5385. Source one-based quiz keys remain
`[4,3,3,2,3,1,1,3]`. Inspected the already-exported tetrahedron reference PNG,
which explicitly prints the zero-padded target range.

Bounded fixes:

- Cube view supports direct drag rotation as well as the existing keyboard
  slider, and Reset restores every view/plane/construction parameter.
- The tetrahedron's static sketch is replaced by actual equal-edge tetrahedron
  geometry with four face labels and depth-sorted SVG faces. Each solid supports
  direct drag rotation and two keyboard rotation sliders. This addresses the
  source's `SimpleZSorter.sortClips` / mouse-dependent `rotationX/rotationY`
  interaction without an always-running frame loop. Reset restores rotations
  along with digits, selected faces, 01–07 mode and reasoning. Existing accessible
  face selection and digit swapping remain.
- Sphere quiz correction notes are shown only after a correct answer.
  Previously the fourth question's note explicitly named the answer
  “diameter” before the learner chose. Both mathematically corrected prompts
  remain intact; corrections are still explained after successful selection.

The exploratory diagrams are event-driven: no autoplay, animation frames, timers, global
listeners or async resources were added. Hidden tabs perform no ongoing work;
unmount discards local pointer state. Pointer capture is cleared on release,
cancel and lost capture. Reduced motion does not remove any information.

Remaining parity work is **not** certified or waived: original cube automatic
moving-plane demonstrations and construction film, tetrahedron continuous
mouse-position-driven paired spinning and exact source perspective, sphere
proof timeline was still missing at the review checkpoint; the later sphere
interactive-video integration above supersedes that gap. Native tetrahedron rotation is direct dragging,
not a claim of frame-exact Flash motion. Source geometry/artwork tracing is
needed for those authored sequences; no unverified film export was generated.

Verification:
`node --experimental-strip-types --test tests/measurement-rules.test.mjs tests/solids-rules.test.mjs tests/lesson-quiz-progression.test.mjs`
passed **15/15**. No browser, development server, compiler, build or integrated
suite run. No claim of visual acceptance: manually rotate both solids to inspect
every label, swap digits and reset, compare drag and keyboard cube views,
exercise all sphere wrong/correct/completion routes in both locales, confirm
correction notes do not appear before success, and inspect narrow touch layouts.

## Source styling follow-up

Reviewed all three activities against their English/Russian XFL stages
(`#66ffff`) and recovered shape palettes. The diagram stages are square aqua,
with serif labels; cube sections use black edges and source magenta, tetrahedra
white faces, and sphere slices source blue/magenta rather than muted modern
teal/orange. Preserved original reference artwork and static companion.
Visible export-process disclaimers are replaced with concise author attribution;
the tetrahedron reasoning now states the mathematics directly. Rules and quiz
flow are unchanged. Source/diff inspection only; no browser, compiler or build
run. Manual checks should inspect section transparency, sphere slice visibility,
both tetrahedra, both locales, and keyboard controls at narrow widths.

## Delivered activities and source mappings

All three entries are **adaptations**, not frame-exact restorations.

| ID | Exact original paths | Functional coverage |
| --- | --- | --- |
| `solids-cube-sections` | `Movies/Cubesections.swf`, `Movies/Cubesections-ru.swf` | Actual plane/edge intersections of a cube, ordered section polygon, plane tilt/translation and view controls; triangle, square, pentagon and regular-hexagon presets; construction-point explanation |
| `solids-tetrahedron-weekdays` | `Movies/Tatrahedron.swf`, `Movies/Tatrahedron-ru.swf` | Original weekday digit-placement question; eight uniquely assigned digits; face inspection, swapping and exhaustive pair reachability; explanation of impossibility under the one-copy-per-digit rule |
| `solids-sphere-volume` | `Movies/Volumeofball-proof-examples.swf`, `Movies/Volumeofball-proof-examples -ru.swf` | Original native animated lesson and source audio with authored stops and examples; later corrected quiz and optional hemisphere/cylinder-minus-cone numerical explorer |

The Russian sphere filename contains a **space before `-ru`**. It is not the
nonexistent `Volumeofball-proof-examples-ru.swf`.

## Recovered evidence

Read the archive recovery README and modernization rubric. Examined extracted
texts for all six source objects; main-timeline ActionScript for the English
objects and Russian tetrahedron/sphere objects; the English reconstructed XFL
`DOMDocument.xml` metadata. Cube scripts animate four constructions using moving
and rotating plane symbols, with a subsequent construction explanation. They
also load external `Swinger-Singers.mp3`; this restoration does not autoplay it.
Tetrahedron scripts rotate and depth-sort two labelled tetrahedra; they do not
evaluate an entered solution. Sphere scripts sequence a proof and timed
examples with event sounds; the Russian object additionally contains an
eight-question quiz absent from the English timeline.

Exported original timeline illustrations using the shared serialized FFDec
helper, without changing preservation archives:

- `public/media/solids/cube-reference/1.svg`
- `public/media/solids/tetrahedron-reference/1.svg` and diagnostic `1.png`
- `public/media/solids/sphere-reference/2878.svg` and diagnostic `2878.png`
- `public/media/solids/sphere-reference/1500.svg` (additional preserved proof
  frame, not currently shown in the activity)

Directly inspected the tetrahedron and sphere PNG exports. The tetrahedron frame
explicitly shows **01 through 07**, resolving an ambiguity in the extracted text.
The sphere frame shows the final volume statement and “Go to Examples”.
Frame export does not execute ActionScript, so it must not be described as a
capture of the original runtime's rotating models.

The optional original-illustration panel shows these authentic SVG frames.
An independent optional panel uses the shared recovered Pythagoras companion in
a still pose. That figure comes from the collection, not from these particular
solids films, and is labelled accordingly. No original asset is relicensed.

## Mathematical decisions and limits

- Cube geometry is a new exact clipping calculation on `[-1,1]³`, rendered as
  an orthographic wireframe SVG projection. It is not fake preset polygon
  interpolation. The plane may miss the cube or touch an edge/point; the UI
  distinguishes these cases. All wireframe edges remain visible intentionally.
- A section cannot have seven sides: a plane intersects each of the six convex
  faces in at most one segment. The original pentagon/regular-hexagon prompts are
  preserved with working presets.
- The original tetrahedron illustration supplies a question, not an explicit
  recovered solution. This adaptation uses each digit exactly once over eight
  faces and allows swapping the order of the two solids. Since the unique zero
  lies on one solid, only four partner digits can be displayed by the other:
  all seven zero-padded days are impossible. The optional single-digit comparison
  is a modern addition, clearly distinguished from the original 01–07 diagram.
  Face selection remains discrete for accessibility; the native diagram now
  also supports depth-sorted direct rotation, but not the original continuous
  mouse-position-driven spinning.
- Sphere proof uses the source's height convention: `h=0` is the hemisphere's
  bottom, so cone radius is `r−h`. At every h, disc and annulus areas are
  `π[r²−(r−h)²]`. This establishes equality of hemisphere and cylinder-minus-cone
  volumes; doubling gives `4πr³/3`.
- Slice-count control calculates a midpoint approximation but does not draw a
  stack of hundreds of discs. The main diagram shows an axial section and the
  selected slice, explicitly labelled rather than presented as a 3D rendering.
- Five examples retain the source radii: water drop 0.2 cm, tennis ball 3.2 cm,
  basketball 12.5 cm, Earth 6400 km, Sun 695500 km. They describe ideal spheres,
  not current reference measurements. Computations use full JavaScript π rather
  than reproducing source rounding.
- Four cube demonstration choreographies are not emulated. Sphere's original
  audio, fades and authored timeline now belong to the primary interactive
  lesson, subject to the media-export fidelity limits documented separately.
- Sphere quiz is restored from Russian texts 246–344 and MainTimeline frames
  4362/4532/4626/4755/4921/5100/5220/5385, with congratulations at 5518.
  Source one-based keys are `[4,3,3,2,3,1,1,3]`: question two's correct
  choice is **1 distinct diameter length**, the third option. All original
  options and question stages are retained; incorrect choices stay on the stage,
  correct choices unlock next, and completion/restart are explicit.
- Two mathematical repairs use corrected prompts, with source correction notes
  shown after a correct answer. Question
  three specifies a plane cutting the interior of the solid ball, excluding
  tangent and disjoint planes. Question four's original “intersection of arcs
  of great circles” cannot equal a diameter: the intersections are points.
  Its corrected prompt asks about the segment joining the two intersection
  points of distinct great circles, retaining the source's diameter answer.
  English quiz copy is explicitly identified as a new translation, not an
  original English source variant.
- Explorer controls are semantic HTML; diagrams are SVG with equivalent
  instructions and numerical status. The primary sphere film uses the shared
  native Canvas/audio player lifecycle. The recovered companion for the other
  solids activities is deliberately static.

## Verification

Usability review follow-up: the sphere's axial-section caveat is now wrapping
HTML below the diagram instead of fixed-width SVG text, preserving its wording
while avoiding clipping/shrinking long Russian text. Tetrahedron Reset restores
the original two-face 01–07 mode as well as digits, face selections and reasoning;
the explanation toggle also exposes its expanded state. Mathematical rules,
source caveats, tetrahedron question and sphere quiz are unchanged. No browser
verification performed; manually check narrow Russian captions and resetting
after switching to the single-digit comparison.

`node --experimental-strip-types --test tests/solids-rules.test.mjs`:
**6 passed**. Coverage includes four section types, regular-hexagon equal sides,
touching/missing planes, point/plane and cube-boundary invariants, equal-area
slices, cubic volume scaling and surface derivative, and tetrahedron reachability.
An initial pentagon preset produced a quadrilateral; the regression caught it and
both implementation and test now use an oblique five-sided section.

No compiler, build, browser, development server or integrated test suite run by
this worker. Local exported-image inspection is not live browser verification.

Quiz restoration follow-up:
`node --experimental-strip-types --test tests/measurement-rules.test.mjs tests/lesson-quiz-progression.test.mjs tests/solids-rules.test.mjs`
passed all **15** tests. New regressions cover all eight stages' wrong/correct
branches through completion, the distinct-diameter-length answer, and cubic
scaling. Manual acceptance must also exercise both quiz locales, retries,
congratulations/restart and visible mathematical correction notes.

Manual checks for integration: inspect each preset, sweep the offset through
empty/point/polygon states, rotate the view, toggle construction labels, swap
tetrahedron digits and inspect all faces, compare weekday modes, change sphere
examples/heights/slice counts, decrease Δr, switch locale, and inspect keyboard
focus plus narrow-screen original-illustration panels.
