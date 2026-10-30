# Fractals, Buffon, and the Möbius face

Original native-drawing audiovisual lessons are primary. Mathematical explorers
remain supplementary adaptations, not timeline-exact restorations.

## Original audiovisual lesson extension

`NativeFractalLesson.tsx` now plays recovered source drawing chapters and their
actual embedded event audio before exposing the existing explorers:

- Carpet: `Serp-carp-intr`, 1–1144, then the five-level native carpet appears
  directly with explicit Play zoom, matching the source handoff into its
  procedural `Main` controller. Reset also permits construction inspection.
  Its English source is identified as English in the Russian UI; no
  Russian recording is fabricated.
- Buffon: `byufon`, 1–4214, source Play holds 986, 2796 and 3876;
  `byufon-ru`, 1–3823, holds 851, 2661 and 3423. This restores the authored
  explanation, curved/circular needle and additivity drawings rather than
  replacing the lesson with the experiment's explanatory paragraph.
  The unbiased bounded experiment remains available after lesson completion.
- Möbius face: `Moebius and face`, 1–685, including its four actual root audio
  events and original face/strip artwork. The rotatable mathematical explorer
  remains available afterward. This is an English-only source.

All four sources use their actual 24 FPS and global one-based frames.
The result comprises 10 lazy chapters covering 9,866 source frames, 61 MP3
definitions and 97 root audio events under `public/media/fractals/native/`.
Raw exporter/audio inventory output is not published. The exact bounded export
plans are in the motion family's `recover-native-lessons.mjs`; runtime metadata
and source hashes remain local to this family. Source references are read-only.

The carpet script requests external `SwingerSingers.mp3` after its final
frame. That exact filename is absent from the preserved archive; the available
`Swinger-Singers.mp3` is not silently substituted. All 11 embedded carpet clips
are retained. Buffon DefineButtonSound feedback remains separate unported
button audio; its 82 root events across EN/RU are retained. No narration or
soundtrack was added to the silent experiment SWFs.

Playback is explicit, with source-specific manual holds, Pause, Sound, Restart,
hidden-tab suspension and unmount teardown through the shared lesson player.
There is no visible frame counter or free seek bypass. Source drawings are
mechanically converted and audited, not an executable Flash runtime.
These checks do not establish audible or visual parity: manual playback,
chapter transitions, source text/artwork, both languages and mobile controls
still require acceptance.

Offline asset integrity verification covered all 59 chapters and 246 MP3
payloads across the two owned families: every declared source frame is present
in its drawing module, stage dimensions match, and every MP3 hash matches the
recovered embedded bytes. No browser, audio listening, compiler or build was
used for that inspection.

Final focused motion/fractal verification passed all 15 tests in 82 ms:
`node --experimental-strip-types --test tests/motion-lessons.test.mjs tests/motion-rules.test.mjs tests/fractals.test.mjs`.
This covers the existing fractal mathematical regressions and the newly
restored motion source-question/retry rules. Integrated checks and manual
audiovisual acceptance remain with Main and the user respectively.

## Presentation reference pass

Compared the recovered `DOMDocument.xml` stages for `Serp-carp-intr`,
`byufon`, `byufon-exp`, and `Moebius and face`, the carpet's `Square.as`
blue/white fill commands, the original `Serpcarpet.png` thumbnail, and the
archived `reference-screenshots/05-visualmath-pi.png`. The SVG stages now use
square aqua framing and Times typography instead of rounded pale panels.
The carpet keeps its source blue square and white holes; the needle board
keeps a white working surface and blue parallel lines, not cream paper.
The Möbius stage remains aqua; its blue-grey/lilac projected strip now has the
longitudinal and transverse grid visible in the recovered `resources/images/1.png`
instead of alternating unsegmented ribbons. The mesh remains bounded to 384 tiles.
No mathematical model or playback behavior changed. The cartoon face and
source mesh are still simplified native drawings, not exact source artwork.
No browser, compiler, build, or tests were run for this presentation-only pass;
check both languages, carpet depths, needle contrast, and narrow-screen controls
manually.

## Implemented source coverage

- `fractals-carpet`: `Movies/Serp-carp-intr.swf`. Inspected recovered `Main.as`, `Square.as`, `Serp_fla/MainTimeline.as`, and all extracted explanatory text. Preserves eight-way recursive central removal (up to the original five levels) and the area argument `(8/9)^n → 0`. Explicit Play now advances construction from the initial square into continuous corner zoom; iteration controls remain available for paused inspection. Original music and narration are not included.
- `fractals-buffon`: `Movies/byufon.swf`, `Movies/byufon-ru.swf`, `Movies/byufon-exp.swf`, `Movies/byufon-exp-ru.swf`. Inspected both experiment timeline scripts, `Needle.as`, explanatory text in both languages, and the lesson timeline's stop points. Both experiment variants use uniform position and angle, needle length equal to spacing, and `2N/K`. English initializes `k=1`; Russian initializes `k=0`. The supplementary experiment intentionally uses zero, shows an undefined estimate before any hit, and avoids the English bias. The primary player above now presents the authored source explanation separately.
- `fractals-mobius-face`: `Movies/Moebius and face.swf`. Inspected metadata (685 frames, no action tags), extracted face/bruise/non-orientability text, and reconstructed timeline XML. A real parametrized half-twist strip with manual projection/view control replaces the original timeline. The face is explicitly a flat explanatory overlay, not a 3D transported mesh. One lap reverses the marked cheek; two restore it. Original face bitmap, audio, and timeline transitions are not reused.

## Deferred

The supplementary carpet now has construction and continuous zoom, and the Möbius face explorer has
explicit transport playback. They remain mathematical reconstructions, not
the exact authored timelines. The separate primary audiovisual players above
now carry the recovered carpet/removal, face journey and Buffon demonstrations
in source order. Iteration, projection and experiment controls remain supplementary.
Preserve the explicitly documented zero-hit mathematical correction; source
fidelity does not require restoring a biased estimate.

`Movies/Moeb7.swf` remains unported and is not listed as playable. Its available scripts are a button action and an unreliable decompiled end-frame action; there is no extracted text. Its substantial authored visual timeline needs a separate visual reference pass before claiming coverage. It is not silently merged with the face demonstration.

## Runtime and verification

Carpet work is bounded to five levels and zoom rebases at a factor of three.
Buffon work runs in batches of 50 at most ten times per second, with at most
300 visible needles and 1,000 throws per experiment. The recovered experiment's
10–1,000 step-10 slider and default of 10 replace the former arbitrary presets.
Animation uses the shared hidden-tab-aware lifecycle. Playback starts paused;
changing reduced-motion preferences stops active playback, while explicit Play
remains available. All controls have semantic keyboard/touch alternatives; no
audio or external assets load.

Focused tests cover recursive removal area/count, crossing projection and deterministic probability integration, zero-hit handling, and Möbius seam identification. No browser, GPU, development server, integrated compiler, or build verification was run by this worker.

Manual checks: change carpet depth 0–5; run/pause/reset a needle experiment and compare counts; use reduced-motion batch controls; move the face to 0, 1, and 2 laps and rotate the strip; inspect narrow-screen controls. SVG projection does not depth-sort strip tiles and is not a full 3D occlusion renderer.

## Final interaction review

Reviewed all three manifest IDs: `fractals-carpet`, `fractals-buffon`,
`fractals-mobius-face`. Re-inspected the carpet's three scripts above, the
English experiment's complete `byufon_fla/MainTimeline.as`, and all extracted
texts for these three source objects. The face text explicitly describes its
bruise changing sides after a journey, so the whole face now turns edge-on
with its local orientation instead of only compressing its facial features
inside a permanently frontal head. Play/Pause and Reset supplement the lap
slider; playback ends after two laps and Play replays from the beginning.
Horizontal pointer-captured dragging rotates the view, with the existing
view-angle range providing the keyboard alternative. Pointer cancellation
and lost capture clear the drag session.

The carpet's source `Main.loop` enlarges the corner-anchored fractal continuously
and reintroduces a smaller copy. The bounded reconstruction uses corner zoom
and rebases at ×3. The finest detail changes at rebasing because recursion is
finite; original narration, exact timeline pacing, layering, face artwork and
depth occlusion remain fidelity gaps, not verified equivalence. Those require
separate authored-media work rather than an invented lesson sequence.

Verification: `node --experimental-strip-types --test
tests/motion-rules.test.mjs tests/fractals.test.mjs` passed all 12 tests.
No browser, server, integrated typecheck, build or full suite was run.
Manual acceptance must check construction-to-zoom continuity, Play/Pause/Reset,
face transport and view dragging on mouse/touch, cancellation, keyboard
alternatives, both languages, and hidden-tab/resume/unmount behavior.

### Experiment control-state review

The manual-drop label now shows the actual bounded number of remaining drops
(including the ten-throw experiment), and completed runs show “Complete”
instead of a disabled “Pause” button. The simulation model is unchanged.
The narrow motion/fractal rule run passed all 12 tests; browser and integrated
verification remain with Main. Manually check a ten-throw batch, an automatically
completed run, and reset followed by changing the target in both languages.
