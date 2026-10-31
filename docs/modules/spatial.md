# Spatial restoration

## Rendering cost review (2026-10-31)

All eight activities were reviewed without changing their authored interactions:

| Activity | Runtime reviewed | Outcome |
| --- | --- | --- |
| spatial-find-pair | `Companions.tsx`, `PairRules.ts`, `PairStageAudio.tsx` | Four fixed eight-cube clusters; CSS transforms rather than pixel filters; unchanged |
| spatial-dodecahedron | `Companions.tsx` | Twelve fixed portrait faces, one rotating CSS parent; unchanged |
| spatial-octahedron | `Octahedron.tsx`, `OctahedronProjection.ts` | Six shared vertices / eight SVG faces, bounded depth ordering; unchanged |
| spatial-illustrated-cube | `Companions.tsx` | Six preserved face images, one rotating CSS parent; unchanged |
| spatial-net-choice | `index.tsx`, `OriginalNets.ts`, `NetArtwork.ts`, `useDragRotation.ts` | Six-face hinge projection, preview then Check retained; unchanged |
| spatial-net-rearrange | Above plus `DraggableNet.tsx` | Six-face swap/projection, authored artwork retained; unchanged |
| spatial-eleven-nets | `index.tsx`, `OriginalNets.ts`, `rules.ts` | Eleven fixed choices, six-face folding, animation stops at completion; unchanged |
| spatial-calendar-cubes | `CalendarLesson.tsx`, `useSourceAudio.ts` | Two six-face CSS cubes, bounded lesson/audio updates; unchanged |

There are no generated native `.mjs` painters in `public/media/spatial`.
Consequently this family has no full-canvas FFDec glow/shadow pixel-loop hotspot
to rewrite. The source-augmented cube painter and handwritten adapter belong to
coloring; see that family's rendering review. Small fixed geometry allocations
and DOM transform updates remain, but this review found no comparable unbounded
or full-surface pixel defect warranting a behavior-sensitive refactor.

Narrow validation passed all 19 tests across the spatial-rules,
octahedron-projection, coloring and coloring-lessons suites. This was not browser
or visual verification. Manual follow-up remains rotating companions, net fold/
drag, preview-then-Check, degree readouts, and default-on puzzle sound.

Eight playable adaptations, including three passive animated companions; none
claims timeline-equivalent restoration.

| Activity ID | Covered original objects | Coverage |
| --- | --- | --- |
| spatial-net-choice | Movies/Cube-Nets.swf; Movies/CubeNG-1.swf through CubeNG-5.swf | Five original illustrated assignments, four original option shapes and source answer order, preview selection followed by explicit Check |
| spatial-net-rearrange | Movies/Cube-Nets-2.swf; Movies/Cubenetslide-1.swf through Cubenetslide-5.swf | Five original illustrated assignments and authored face slots, direct drag swapping with keyboard/tap alternative |
| spatial-eleven-nets | Movies/Cubnet3d.swf | All eleven distinct cube nets, continuous hinge folding and adjustable view |
| spatial-calendar-cubes | Movies/Cubeflash-white.swf; Movies/Cubeflash-white-eng.swf | Two-cube calendar, all dates 01–31, four logical hints and the 6/9 insight |
| spatial-find-pair | Movies/Cubes-findpair.swf; Movies/Cubes-findpair-ru.swf | Four original stages and arrangement tables; matching clusters under rotation |
| spatial-dodecahedron | Movies/Dodecaedr-pictures-center.swf | Twelve recovered portrait PNGs on a rotating regular dodecahedron |
| spatial-octahedron | Movies/Octa-8.swf | Recovered vector face backgrounds and text formula glyphs |
| spatial-illustrated-cube | Movies/Cubeflash-text.swf | Six complete original first-frame face compositions on a natively rotating cube |

## Evidence inspected

Read recovery README and MODERNIZATION. Inspected recovered text resources for all
assigned titles, `actionscript/scripts/*/MainTimeline.as` for Cube-Nets, CubeNG-1,
Cubenetslide-1, Cubnet3d, Cubeflash-white-eng, Cubeflash-text,
Dodecaedr-pictures-center and Octa-8, including loader/stage scripts, CubeNG face
placement, Cubenetslide target/initial positions and `checkGame`. Inspected the
calendar reconstructed XFL DOMDocument timeline header and its recovered English
and Russian lesson text. Archives remain untouched.

Cube-Nets and Cube-Nets-2 are stage loaders. The latest source review inspected
all five CubeNG answer handlers and initial child transforms, all five
Cubenetslide target/initial coordinates, and the relevant XFL display-list
symbol mappings. Child order is the reverse of the XFL layer serialization.
`OriginalNets.ts` records the authored four option shapes, per-stage symbol
assignments, correct choices and all eleven Cubnet3d net/face orders.
The original rearrangement checker contains a duplicated T1 condition where
T4.x would be expected; the native checker requires all six correct slots.

## Current differences and restoration gaps

- Original net face compositions now load from bounded first-frame source
  exports, including orientation variants used by CubeNG targets. Nominal
  40-unit face squares and full authored image bounds are separate: protruding
  stage-five arrows and strokes must not be cropped or stretched into a square.
  The face export metadata is in `src/content/spatial-net-art.json`.
- Rearrangement uses direct pointer/touch dragging between stationary slots.
  An invalid drop leaves the assignment unchanged. A completed drag cannot
  trigger an extra click swap; cancellation, Escape, hidden tabs and unmount
  release capture. Two selections remain the keyboard/tap alternative.
  Source fixed-slot success replaces the former face-identity-only rotation
  checker, which could incorrectly accept oriented motifs.
  The flat face editor and its instructions appear above the target/folding
  comparison. Turn, tilt and fold sliders are grouped with those comparison
  views and show current degrees (folding hinges range from 0° to 90°).
  The sound-effects checkbox stays inline with its label.
- CubeNG choices now separate preview selection from explicit Check submission,
  as requested by the user. This overrides the source's immediate answer
  handlers: selecting a net never grades or plays correct/wrong feedback.
  Check captures the selected answer; changing the preview clears the submitted
  result and any stale feedback/Next action. Reset and stage changes clear both
  preview and submission. The optional fold inspection and replay/reset remain
  available. Five-stage
  selection is freely available, matching the two loader menus rather than
  imposing a new requirement to solve stages sequentially. A wrong answer does
  not show a success/next-stage action. Source sound, fireworks and timed choreography
  remain absent. The responsive DOM layout is not the exact original 620×430
  stage composition; first-frame source artwork does not establish visual parity.
- Spatial sound effects are checked on initially, as requested. Audio elements
  are created and played only from actual interactions; mounting the activity
  or toggling the checkbox does not play a sound. Music and stage narration
  retain their separate explicit playback controls.
- All eleven nets retain source order, face identities and colors recovered
  from `setVertices1..11`, `setFaces1..11` and `facesColors`. Thumbnail buttons
  replace the generic select menu and explicitly trigger folding. SVG
  orthographic projection and continuous hinges replace Flash's perspective
  renderer and interpolated vertices. The generated-net enumerator remains a
  separately tested mathematical helper, not the exhibit's source order.
- The calendar now opens with its six-scene source-based audiovisual explanation;
  numeric inputs and exhaustive date checking are a collapsed optional exercise.
  Both retain separate 0, 1, 2, insufficient-space and 6/9 reveals. The initial
  question and catalog no longer disclose the 6/9 trick. English/Russian source
  text verifies the same educational sequence; source audio events and lifecycle
  are detailed in the audio review.
- Cubes-findpair now uses the actual `Cube.as` swap tables, corner coordinates,
  two cubes per color and the four original arrangement lists. English/Russian
  Cube.as differs only in declaration order; stage arrangement calls also match.
  The four stage layouts retain the authored cube centers from `MainTimeline.as`
  frames 36, 96, 156 and 216 on its 1080×720 aqua stage. The board crops the
  unused narrative region above y=150, scales responsively and keeps a stable
  height across stages. Source-blue rounded SVG marker loops and connectors
  replace rectangular card highlights. Drag between arrangements with mouse,
  pen or touch, or select two buttons by click/tap or Tab and Enter/Space.
  Rotation pauses while choosing; Escape clears a selection. Pointer capture
  is released on completion, cancellation and unmount; canceled gestures do
  not check a pair, and completed drags do not produce a second click action.
  The source's final stage
  repeats arrangement 1 as well as the intended arrangement 9; either genuinely
  matching pair is accepted, rather than retaining its endpoint-only checker.
  Original timing, fireworks, transitions and sound are not reproduced.
- Dodecahedron portraits are all twelve untouched recovered images, with newly
  constructed regular geometry and adapted portrait placement. Original
  portrait provenance/copyright is not inferred; preservation is not a new license.
- Octahedron uses eight original SVG backgrounds and recreated white text
  glyphs. Front/back/left/right face adjacency now follows the source child
  transforms rather than treating consecutive source faces as neighbors.
  Exact mirrored glyph transforms and typography remain adapted; the source's
  extra ninth square plane is omitted.
- Cubeflash-text now uses first-frame exports of the six complete original face
  sprites (27, 57, 87, 113, 136, 160), including their nested artwork and layer
  transforms. The caterpillar, cat, squirrel, mouse, globe and turtle are no
  longer isolated bitmap fragments. Rotation is native; animation inside each
  face remains frozen. See `public/media/spatial/cube-faces/README.md` for the
  bounded, serialized source-extraction recipe and provenance.

There are no WebGL resources or external network assets. Source audio restoration
and remaining soundtrack gaps are detailed in [spatial audio](spatial-audio.md).
The calendar's six-scene audiovisual lesson is primary; the numeric-input
exercise is optional. CSS 3D companions
use the shared visibility-paused animation hook, update DOM transform refs, and
stop automatic rotation under reduced motion. Every view can be turned manually.
Rotating shape surfaces disable native text/image selection; image faces also
retain `draggable=false`. The surrounding explanations and controls are outside
that selection rule and remain copyable.
Nets and standalone companions accept direct pointer/touch drag rotation, with
sliders retained for keyboard inspection. Pair connector gestures and face
rearrangement gestures remain separate. Eleven-net folding starts only after an
explicit thumbnail choice; its shared animation lifecycle pauses while hidden,
and reduced motion changes the fold immediately. Folding can also be paused or
scrubbed. No browser automation or visual verification was performed.

## Checks and manual verification

Run `node --experimental-strip-types --test tests/spatial-rules.test.mjs`.
Checks protect all-eleven-net enumeration, authored eleven-net closure, cube closure, invalid nets, rotation
versus reflection, every calendar date including shared 6/9, original cluster
arrangements, genuine spatial rotations, matching pairs in all four stages and
octahedron front/back topology.
Main owns integrated type-check/build.

Manual checklist: inspect each net fully flat and fully folded; turn/tilt to
read all six target faces; choose a wrong/right answer, fold and advance through
five stages; drag faces between slots and select/swap using keyboard and touch;
confirm every motif, including stage-five protrusions, against the original;
drag net/companion views without jumps and confirm pair dragging still connects;
enter the calendar hint
solution and verify all dates; inspect responsive layout at phone width.
Also inspect companion face visibility/portrait loading, pause and manual controls,
reduced motion, all four pair stages and the final-stage alternative valid pair.
For matching, verify the original row / four corners / six centers / nine centers
layouts; click and keyboard selections; drag to a correct, incorrect or empty
endpoint; touch cancellation and Escape; and resizing on a narrow phone.
Only a released connector on another option checks a pair. The line is a bounded
quadratic SVG connector, not the source's unrestricted freehand stroke; native
click/keyboard access intentionally extends the original endpoint-only gesture.
