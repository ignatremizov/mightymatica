# Cube sections: native interactive sequence

## Scope

`CubeSectionsLesson` restores the primary five-phase progression from
`Movies/Cubesections.swf` and `Movies/Cubesections-ru.swf`. The mathematical
plane/cube explorer remains a supplementary activity, revealed after the authored
final animation completes. This implementation does not use the separate
111-second FLV/MP4, a Flash emulator, or invented narration.

Source recovery is read-only. The examined artifacts are under
`/home/ignat/code/mightymatica-source-recovery/objects/Movies/`:

- Both language variants' complete `MainTimeline.as`, `cube3_20.as`, and
  `pp_37.as` under `actionscript/scripts/`.
- Both XFL `DOMDocument.xml` timelines, especially the first four root-held scenes,
  root cube placement, NEXT artwork and localized title.
- English XFL cube symbols 15, 34, 45 and 56 and their nested face/plane/section
  symbols. The media extraction retains source coordinates, fills, stroke widths,
  alpha, and display-list order.

## Sequence and source rules

| Phase | Global root frame | Native behavior |
| --- | --- | --- |
| 1 | 1 | Section and plane translate along X; the control variable reverses beyond ±75. |
| 2 | 3 | Plane and section tilt 45° about X, translate oppositely in Y/Z, and the section's Y scale varies as `1 − abs(movez)/75`. |
| 3 | 5 | Plane and section rotate −1° about X each tick; section Y scale is `1/cos(cosx)`, with `cosx` oscillating between ±45°. |
| 4 | 7 | Plane/triangle rotate 35° about X and −45° about Y, translate in X/−Z; triangle scale varies uniformly as `1 − abs(movex)/75`. |
| 5 | 9–1248 | Original vector/morph drawing timeline, with source-positioned pp Play/Pause control and terminal completion stop. |

The four demonstrations run at the source's 24 ticks per second. Their cube
parent rotates −0.2° about all three axes each tick. The native SVG projection
uses the source 55° field of view, stage projection center (275, 200), cube origin
(260.95, 194), and overall alpha 0.55078125. Faces are composed in Flash display
order rather than depth-sorted. Source title and NEXT artwork are drawn once by
the bounded local Canvas painter, beneath the moving SVG geometry.

The source checks reversal before moving the visible children. This creates
small differences between the control variable and visible section offset.
`cubeSectionsLessonRules.ts` preserves that order, including overshoot, instead
of replacing it with an idealized sine sweep. Its finite precomputed cycles make
long background playback bounded, without replaying every missed tick.

The third phase's `--rotationX` does **not** reverse when `cosx` reverses. This
unusual source behavior is preserved, rather than corrected into a different
animation. Scene 4's pink triangle is a direct `DOMShape`, not a symbol instance,
and is nevertheless the eighth display child targeted by ActionScript.

`gotoAndPlay(2)` advances to frame 2 **within the current scene**. Each NEXT
therefore disposes the old native demonstration and advances to the next phase;
it does not jump back to global frame 2.

## Accessibility and lifecycle

NEXT and Play/Pause are semantic keyboard/touch buttons. Each timer phase also
has paused single-tick stepping. Reduced motion starts demonstrations paused,
without an opaque fade hiding the static diagram. Otherwise the original cyan
cover loses 0.008 alpha per source tick.

The shared animation lifecycle preserves user-started playback across blur and
hidden tabs, skips hidden SVG redraws, and cleans up timers/animation frames on
unmount. There are no pointer captures or drag gestures in the source lesson;
the separate explorer retains its own mathematical interaction.

The existing opt-in `SourceSoundtrack` supplies `Swinger-Singers.mp3` at the
source 0.4 gain. It stays mounted across NEXT transitions, never autoplays, and
owns its audio teardown. The final vector timeline contains no fabricated voice
track.

## Verification and remaining fidelity review

Focused command:

```sh
node --experimental-strip-types --test tests/cube-sections-lesson.test.mjs
```

Three rule tests pass: 4,000-tick source-rule comparison per phase,
the third scene's monotonic rotation versus oscillating scale, and bounded long
background playback. Main performs integrated type checking/build verification;
this worker did not start a compiler, browser, server, install, or full suite.

No browser verification was performed. Native SVG projection/rasterization can
differ subtly from Flash's renderer; exact perceived perspective, translucent
overlaps and font/filter appearance remain subject to visual review.

Manual review:

1. In both languages, inspect all four demonstrations and use NEXT in order.
   Confirm source title/NEXT artwork, section colors, face registration, cyan
   fade and smooth rotation.
2. Pause each demonstration, step repeatedly through a reversal, then resume.
   With reduced motion enabled, confirm the first diagram is visible and paused.
3. Enter the fifth phase: it should wait at root 9 for Play; source pp transport
   and accessible toolbar should both control the authored animation.
4. Confirm the final animation stops at root 1248 and only then exposes the
   supplementary explorer.
5. Opt into music; cross NEXT boundaries and switch tabs. Confirm music is not
   restarted and playback choices are preserved. Close the activity and confirm
   audio stops.
