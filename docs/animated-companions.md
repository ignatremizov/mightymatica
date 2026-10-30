# Original companions and bounded export tooling

## Shared Pythagoras idle

`src/shared/OriginalCompanion.tsx` exports named and default `OriginalCompanion`.
Props are `{ playing?: boolean; reducedMotion: boolean; label?: string }`.
`playing` defaults to true; reduced motion or pausing shows the first authored
frame. The shared `useAnimation` preserves playback across tab changes and
cleans up on unmount.
The component changes SVG image offsets only when the authored frame changes,
not React state on every animation tick. It uses the application base URL.

The original source is:

`mightymatica-source-recovery/original-sources/github/ignatremizov-Figure/snapshots/f5e6221-initial-source/assets/Pifagor/Pifagor.png`

Its sibling `Pifagor.plist` defines 70 silent frames, including 20 repetitions
of the final image after the 50 distinct atlas rectangles. The component uses
the recovered 24 fps playback and restores each trimmed rectangle to its
115×132 stage. The 1024×1024 PNG is copied unchanged into
`public/media/companions/pifagor-idle.png`. The source image was inspected.
This is authentic idle animation, **not** a restoration of Flash talking,
lip synchronization, voice, or authored correct/wrong reactions. No new
cartoon illustration or invented mouth sequence is substituted.

The falling family independently owns its existing source-derived atlas player;
the shared component does not import that family or replace its integration.
Recovered art retains its original attribution and is not granted a new license.

## Serialized FFDec export

From the repository root:

```sh
node scripts/export-original-frames.mjs \
  --source /absolute/path/to/original.swf \
  --frames 1,3-8 \
  --output public/media/YOUR-FAMILY/original \
  --format svg
```

Use `--format png` for short raster sequences. `--sprite 123` selects the
specific nested character timeline; without it, frames refer to the root
timeline. Frame indices are one-based. Selection is required, finite, and
limited to 120 frames per invocation. Split longer recovered timelines into
explicit chunks and inspect output filenames before integrating them.
FFDec retains its own output subdirectories; the helper does not rename art.
Do not use full-movie or all-assets exports for a single still.

The wrapper validates a single SWF input, prevents output into either read-only
archive, and runs FFDec under a shared advisory `flock` lock at
`/tmp/mightymatica-ffdec-export.lock`. All families must use this helper to
serialize exports. Each invocation uses `nice -n 15`,
`-XX:ActiveProcessorCount=2`, `-Xmx768m`, headless Java, and a 120-second
FFDec export timeout. Explicit argument arrays avoid shell interpolation.
No downloads or global configuration changes occur.

The existing local defaults are:

- Java: `/nix/store/mxf12821brqjb2kv1p3v8b9n6d5741y0-openjdk-21.0.12+8/bin/java`
- FFDec: `/home/ignat/code/.tools/ffdec-26.2.1/app/ffdec.jar`

Other machines may supply `FFDEC_JAVA` and `FFDEC_JAR`. These are executable
and archive paths, not shell commands. FFDec 26.2.1's actual `-help -export`
was checked: root timelines use `-select ... -format frame:svg -export frame`;
nested timelines use `-select ID:... -selectid ID -format sprite:svg -export sprite`.
Exported frames are visual timeline snapshots, not ActionScript execution.
Verify nested clip state, embedded images, fonts, and frame sequence fidelity.

## Native generated Canvas timelines

`--format canvas` is a **code-generation** option, not a way to run exported
HTML or Flash. This format permits up to 5,000 explicitly selected frames in
one invocation; the same process lock, CPU, heap, and timeout budgets apply.
FFDec's vector drawing functions preserve timeline frame cases and transforms
without exporting thousands of raster images. They do not execute ActionScript.
Export into a temporary directory outside `public`:

```sh
node scripts/export-original-frames.mjs \
  --source /absolute/path/Hands-escher.swf --frames 1-60 \
  --output /tmp/reviewed-hands-export --format canvas
node scripts/convert-canvas-export.mjs \
  /tmp/reviewed-hands-export public/media/YOUR-FAMILY/hands.mjs
```

The converter uses Acorn to parse generated drawing JavaScript without executing
it. Only the known FFDec 26.2.1 boilerplate is transformed. It replaces both
`eval`-based drawing dispatches with a frozen, null-prototype function registry;
replaces the context prototype swap with captured native methods and own-method
wrappers; removes resize listeners, body insertion and the global interval; and
rejects remaining evaluation, dynamic imports, global window access, network
APIs, unexpected document access, and non-data image URLs. Unrecognized output
fails conversion. Images remain embedded in the generated module and must decode
before drawing. Original generated drawing and filter functions are retained.

This converter is **not a sandbox for arbitrary JavaScript**. Review the local
input and output before importing. Do not inject generated HTML, use an iframe,
or copy SWF, FLA, XFL, JAR or emulator files into public assets. The converter
does not grant redistribution rights. The exported runtime identifies itself
as “JPEXS Free Flash Decompiler Filters” and belongs to FFDec 26.2.1's LGPLv3
`ffdec_lib` (not the application's separate GPL license). The generated modules
preserve that header. See `public/licenses/NOTICE.txt` and
`third-party/ffdec/README.md` for license texts, dated modification notices and
the readable baseline/patch corresponding-source package. Recovered artwork
has separate provenance; these software terms do not grant media permissions.

`OriginalTimeline` accepts:

```ts
{
  moduleUrl: string; // reviewed local BASE_URL/media/*.mjs only
  startFrame: number; // one-based, inclusive
  endFrame: number;   // inclusive; every frame must be present in metadata
  fps: number;       // explicit recovered source rate, <=60
  reducedMotion: boolean;
  locale?: "en" | "ru";
  label?: string;
  checkpoints?: readonly { frame: number; label: string }[];
  presentation?: "inspection" | "loop" | "still"; // defaults to inspection
  active?: boolean; // defaults to true; offscreen suspension preserves Play/Pause
}
```

In its default inspection presentation it loads only on mounting, does not autoplay, and provides play/pause, restart,
scrubbing and optional checkpoint controls. The shared clock continues while
hidden and stops at the selected end frame. Reduced motion
starts playback paused but leaves individual-frame inspection available. Async load
completion tolerates replacement/unmount and disposes image references.
Native family code continues to own answers, navigation, rules and source segment
selection; the generated code only draws. Original Flash button scripts are not
recovered by this path.

Both inline and standalone Escher artwork use the loop presentation: it starts playing
unless the applicable reduced-motion preference is enabled, wraps from the last
authored frame to the first, and exposes only Play/Pause. Refreshing the page
starts again at the first frame; no playback position is persisted. A manual
pause survives scrolling away and returning or hiding and restoring the tab.
The layout preloads nearby artwork but enables its clock only while the actual
slot intersects the viewport. Tab switching does not reset or pause playback.
Enabling reduced motion pauses playback;
the user may explicitly press Play, and disabling the preference does not undo a
manual pause. These Canvas presentations contain no audio playback. Educational
and puzzle timelines retain the inspection controls.

The shared animation driver uses requestAnimationFrame while visible and a
bounded timer while hidden. Audio-backed lessons retain real elapsed time and
schedule source sound events ahead on the audio clock: four seconds while
visible, thirty while hidden. Projection stops at the same chapter and manual
question gates as actual playback. Hidden lessons do not redraw their Canvas;
returning to the tab paints the current source frame. Explicit Pause cancels
audible and future audio nodes; Restart clears their plans. Unmount removes
timers/listeners and releases media. Browser/OS suspension remains outside the
application's control.

Lesson Canvas backbuffers now follow the displayed width and device pixel ratio,
bounded to 2,048 pixels per side and 2,097,152 pixels total. Recovered vector
artwork and text therefore receive real drawing pixels rather than a stretched
550 × 400 bitmap. Embedded raster source art and authored filters are unchanged.

The still presentation draws the selected source frame without playback or
seeking controls. Question-first lessons use it for the initial problem
illustration; their native answer controls own the prerequisite and unlock the
demonstration only when the recovered source requires it. Numeric frame
counters are not displayed in any presentation.

The converter also localizes the recognized exporter font assignment
`defaultFill = textColor`. Its implicit global worked in the old non-strict
script but throws in a native ES module. All 31 affected drawing modules now
declare that state inside each font function. An exhaustive, renderer-free
check executed all 34,304 exported frames across the 36 modules successfully;
this verifies JavaScript execution, not browser image decoding or pixel fidelity.
Initial, playback, and seek failures release the renderer and display an error
instead of silently leaving an unresponsive animation.

Generated factories also own their Canvas context enhancements. A shared
per-context ownership token retires an older renderer before capturing native
methods. Disposal restores original own-property descriptors (or removes newly
introduced properties) for native methods, transform helpers, and matrix
bookkeeping. It is idempotent and cannot undo a newer owner's wrappers. Failed
image decoding and obsolete async preparation release ownership too. The React
canvas is keyed by module URL as additional isolation on language/source changes.

`scripts/refresh-canvas-lifecycle.mjs` mechanically upgrades the recognized older
generated module shape without rerendering source films. It parses and audits
every candidate before writing any changes. The lifecycle fix was applied to all
36 existing public drawing modules; all 36 passed Node syntax checks.

The actual generated Hands renderer has a focused same-canvas regression using
only a stub context boundary, not a browser or GPU. It verifies repeated
create/dispose, cross-module replacement, late asynchronous decode completion,
decode failure, exact context restoration, and a single native transform call
without wrapper growth:

```sh
node --test scripts/canvas-timeline-lifecycle.test.mjs scripts/convert-canvas-export.test.mjs
```

All four focused tests passed. These lifecycle checks do not establish pixel
equivalence or replace interactive visual review.

Actual validation: all 60 frames of `Hands-escher.swf` exported and converted
successfully into a 944KB self-contained module (three embedded images). Node
syntax validation passed. Two focused converter tests passed, covering the exact
dispatch/prototype/timer regression and rejection of network, dynamic Function,
external image and DOM-injection features:

```sh
node --test scripts/convert-canvas-export.test.mjs
```

No generated drawing was executed in a browser and no pixel equivalence is
claimed. Compare original composition, first/middle/last frames, transforms,
image readiness and segment boundaries manually before marking visual fidelity.

Verification performed: Node syntax check, helper help output, original plist
inspection, and direct FFDec CLI help. No browser, integrated type-check,
production build, or full suite was run by this worker. Main owns integration.
The headless-only Java binary passed CLI help but another worker's real export
revealed missing `libfontmanager`; the default now uses the existing full OpenJDK
wrapper whose closure contains that library. No additional runtime was installed.

## Canvas transform tracking

The exporter forwards native `scale`, `rotate`, `translate` and `resetTransform`
without updating the matrix used by manually stroked paths. This separated
outlines, graphs and curves from fills when lesson backing canvases were enlarged.
The reviewed converter now applies `canvas-context-transforms.mjs`, which updates
both transformations with the same composition and one native call per operation.
`refresh-canvas-transforms.mjs` applies that narrow correction to existing
generated modules with a full preflight, content-addressed backups and
concurrent-edit guards. `--check` performs a read-only idempotence audit.

The 186 generated enhancers are corrected; the forwarding adapter inherits its
underlying painter. Original geometry, text, filters, clocks, gates and audio are
unchanged. Deterministic tests compare native and shadow matrices through nested
transformations, trace the original Calculus chart-axis drawing at high density,
and check patch-marker survival when later tools prepend headers. These are
coordinate regressions, not browser screenshots or pixel-equivalence evidence.

## Source-positioned interaction and completed pictures

`OriginalLessonPlayer` accepts a `stageOverlay` for family-owned interaction at
the source's logical coordinates. The transparent overlay does not intercept
input unless its own handles explicitly do so. Source answer, NEXT and transport
hit regions remain separate semantic controls over the original painted art.

For completed jigsaws, `stageTarget` can portal the existing Canvas stage into
the family's live picture bounds while keeping transport controls in document
flow. Moving the connected group updates those bounds rather than creating a
second player or soundtrack. A family `drawOverlay` can normalize the source
celebration's authored picture viewport with reusable scratch storage; teardown
must release that storage. The clean assembled image remains a loading/error
fallback beneath the animation.

`completionLabel` supplies puzzle-specific status without relabeling lessons.
`continueAfterComplete` is opt-in and defaults to false: it allows source-scripted
overlay motion to use elapsed presentation time while the final root frame stays
stopped. It neither re-enters that frame's audio cues nor unlocks a later branch.
Faces uses this for its bounded 43-particle celebration, which originally kept
moving after the root timeline stopped. Explicit Pause and unmount still stop
the owned work.
