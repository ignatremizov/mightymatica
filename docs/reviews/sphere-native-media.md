# Sphere: recovered native lesson media

## Native transport sprite state follow-up

The recovered play/pause control is an independently stopped two-frame sprite,
not decorative animation. English `pp_11` / Symbol 32 selects button 27 on
one-based sprite frame 1 and button 31 on frame 2. Both frames execute `stop()`.
Play calls `root.play()` plus `gotoAndStop(2)`; Pause calls `root.stop()` plus
`gotoAndStop(1)`. Russian `pp_12` / Symbol 40 similarly selects buttons 34/39.
The previous drawing export advanced those sprites modulo 2 with the root
frame, visibly alternating their control state.

`scripts/sphere-playback-control.mjs` now applies an Acorn-AST-located,
source-specific mechanical patch. It adds factory-local playback state,
defaults to paused, overrides only the reviewed transport sprite's frame
parameter, and returns the optional renderer method:

```ts
setPlaybackState(playing: boolean): void
```

The mechanical core is shared through `scripts/reviewed-playback-control.mjs`
with the later measurement transport fix. The Sphere wrapper retains the same
reviewed sprite IDs, state variable and patch marker. Extracting the core
preserved all six existing Sphere modules byte-for-byte under its idempotence
check; it does not expand Sphere's runtime interpretation.

The setter does not draw, start a clock, play audio or change other artwork.
The player must set the state before drawing the current frame. Renderer
instances do not share state. Only English sprite 32 and Russian sprite 40
are supported; unknown sprite/factory/partial-patch shapes fail closed.
Both minified existing modules and freshly converted readable modules are
handled structurally, without evaluating drawing code or interpreting
ActionScript. The patch is idempotent, including after state-variable renaming.

`recover-sphere-lesson.mjs --convert-reviewed` applies this patch immediately
after each normal audited conversion. All six existing chapter modules were
patched in place, adding 217 bytes each without rerendering or re-exporting
any source frames. Audio, provenance, metadata, drawing helpers and resource
disposal remain unchanged.

Actual source control placements use these **inclusive global frame ranges**:

| Source | Active frames | Logical hit rectangle `(x, y, width, height)` |
| --- | --- | --- |
| English proof | 3–2875 | `(13.6, 6.65, 105.9, 40.75)` |
| English examples | 2901–4124 | `(13.6, 6.65, 105.9, 40.75)` |
| English ending | 4147–5057 | `(-0.6532318, 331.7632729, 91.2550461, 35.1146660)` |
| Russian proof | 73–2883 | `(13.6, 6.65, 105.9, 40.75)` |

Russian examples and the exported Russian ending through 4361 have **no**
source pp placement. Do not invent a transport hit region there. The separate
Examples button at English 2878 / Russian 2879 is not a pp transport button.
Hit rectangles come from the source hit-state silhouette
`(-5.4, -3.35, 105.9, 40.75)`, transformed by the XFL pp placement: `(19,10)`
normally, or `(4,334.65)` at scale `0.8617095947265625` for the English ending.
The source stage is 550×400.

Verification: `node --test scripts/sphere-playback-control.test.mjs` passed
**5/5**. Synthetic fixtures cover both languages, compact/readable code,
alternating root-frame inputs, independent renderer instances, Play/Pause
selection, unchanged unrelated animation/disposal, idempotence and rejection
of an unexpected/partial patch. Only synthetic drawing functions were executed;
the recovered modules were parsed and checked for patch idempotence, not
rendered. `node --check` passed for the helper, recovery script and all six
patched drawing modules. No browser, build, compiler, media export or broad
suite was run for this fix. Native invisible hit overlays and shared transport
wiring are owned separately by Main.

Task: `sphere-native-lesson-media`. Scope is the original lesson drawing timelines,
source audio, repeatable recovery script, and lesson metadata. Shared playback
and the Sphere activity wrapper belong to their respective owners.

## Source evidence

Read-only recovery root:
`/home/ignat/code/mightymatica-source-recovery/objects/Movies/`.

- English: `Volumeofball-proof-examples`.
- Russian: `Volumeofball-proof-examples -ru`.
- Each object's `original/*.swf` supplies the authoritative binary movie header,
  root ShowFrame/StartSound tags, and DefineSound metadata.
- Each object's nested `project/**/DOMDocument.xml` supplies scene names,
  scene-local sound placements, envelopes, and sound-library provenance.
- English `actionscript/scripts/Volumeofasphereproof_fla/MainTimeline.as` and
  `pp_11.as` describe explicit stops, Examples, timed continuation, and the
  original play/pause button. Russian
  `actionscript/scripts/Volumeofball_fla/MainTimeline.as` describes its stops and
  subsequent answer-gated quiz.

Both original headers are **550 × 400 at 24 fps**. English has 5,071 root frames;
Russian has 5,518. XFL scene offsets are zero-based:

| Language | Proof | Examples | Ending / subsequent quiz |
| --- | --- | --- | --- |
| English | offset 0, length 2885 | offset 2885, length 1248 | offset 4133, length 938 |
| Russian | offset 0, length 2884 | offset 2884, length 1248 | offset 4132, length 1386 |

All published metadata uses **one-based global root frames**, not scene-local
indices. The drawing modules accept those same global frame numbers.

English source stops: 3, 2878, 2901, 3113, 3292, 3514, 3751, 4031, 4147,
5071. Frames 3113/3292/3514/3751/4031 request four-second Timer holds.
2878 is the Examples button; 2901 is the examples title; 4147 is the explicit
ending/derivative continuation.

Russian lesson stops: 73, 944, 1128, 2879, 3112, 3291, 3513, 3750, 4030.
944/1128/3112/3291/3513/3750/4030 request four-second Timer holds.
2879 is the Examples button. Frame 4362 is the first original quiz prompt:
the published drawing timeline deliberately ends at **4361**, handing off to
the corrected native quiz. Its metadata completion stop at 4361 is a restoration
boundary, not an original ActionScript stop.

The first displayed frames are English 3 and Russian 73. Russian has an earlier
sound event at frame 10; beginning playback from 73 needs an explicit policy for
resuming that already-started event (2.625 seconds elapsed), not silently moving
its original start cue to frame 73.

## Media and playback contract

`src/content/sphere-lesson.json` records version, frame numbering, audio timebase,
and `languages.en` / `languages.ru`. Each language includes source SHA-256,
dimensions, fps, original frame count, playback end, initial frame, chapters,
stops, audio cues, and audio assets.

All `chapter.module` and `audioAssets.src` paths are relative to `public/media/`,
for example `solids/sphere-lesson/en/proof.mjs`. Use the shared media URL helper;
do not prepend another `media/` to stored paths.

Each of the six chapter modules exports `metadata` and
`async createTimeline(canvas)`. The returned object exposes
`draw(globalFrame, time = 0)` and `dispose()`. Metadata lists its finite selected
global frames. The native player owns timing, interactions, source stops,
visibility suspension, and audio. Chapter transitions are scene partitions,
not newly invented teaching stops.

Audio is recovered from root **StartSound event cues**, not a narration stream.
Both movies contain an empty `SoundStreamHead2` with bytes `27000000`, zero
samples per block, and **no SoundStreamBlock tags**. Recovery rejects nonempty
streams instead of guessing their synchronization.

Every copied MP3 is verified byte-for-byte by SHA-256 against its corresponding
DefineSound payload in the original SWF, in addition to its archive resource.
There are 67 English cues / 37 English sound assets, and 47 Russian cues /
16 Russian sound assets before the quiz boundary. All observed cues are
`sync: "event"` with `loops: 1`; there are no root stop-sound cues in these ranges.
This preserves original recorded sound, without synthesizing or translating
narration. File identity does not establish that every asset contains speech.

Cue fields:

- `frame`, `soundId`, `sync`, `loops`.
- Raw `inPoint44`, nullable `outPoint44`, and converted
  `inPointSeconds` / nullable `outPointSeconds`.
- `envelope`: raw `{mark44,left,right}` plus
  `{seconds,leftGain,rightGain}`. Positions are in a 44,100-units-per-second
  source sound timebase; levels normalize by 32,768. Interpolate the envelope,
  preserve stereo gains, and hold the final level. An empty envelope means unity.
- Assets record ffprobe `durationSeconds`, SWF codec/sample rate/sample count,
  MP3 `seekSamples`, payload hash, and published file hash.

For example, English sound 33 at frame 10 starts with silence, reaches unity at
35400/44100 seconds, remains unity to 155101/44100, and reaches zero at
166601/44100. Its file lasts 122.72 seconds according to ffprobe. Playing the whole
file at unity would therefore introduce sound that the source envelope silences.
Frame 565 sound 70 explicitly ends at 307439/44100 seconds.

Source `stop()` pauses the timeline, **not already playing event sounds**.
Automatic holds therefore contribute elapsed audio time while the picture is
held. Later event onsets include previous automatic holds; do not continuously
recompute active audio position from `(currentFrame - cueFrame) / fps`, which
would freeze event audio during those holds. Source manual stops also do not
stop event sounds. A native user Pause, hidden-document suspension, sound toggle,
loading interruption, or teardown can intentionally suspend/cancel sound.
Those user-facing lifecycle decisions belong to the shared player.

## Repeatable recovery

Run from the repository root:

```sh
node scripts/recover-sphere-lesson.mjs --metadata
node scripts/recover-sphere-lesson.mjs --export
# Review all six /tmp/mightymatica-sphere-{en,ru}-{proof,examples,ending} exports.
node scripts/recover-sphere-lesson.mjs --convert-reviewed
```

The script reads originals without modifying either preservation archive.
It uses the existing serialized `export-original-frames.mjs` helper, keeping each
selection below 5,000 frames and retaining the helper's 120-second / 768-MB /
two-active-CPU constraints. Conversion uses the existing audited
`convert-canvas-export.mjs`: it parses drawing code, removes exporter chrome and
dispatch evals, rejects unsupported execution/network features, and adds the
existing context lifecycle protection. Neither recovery nor conversion executes
raw exporter JavaScript.

The six semantic modules contain 9,432 selected frames in total, represented by
native vector drawing programs rather than 9,432 raster images. Published Sphere
media occupies approximately 33 MiB uncompressed and is suitable for per-chapter
lazy loading, not eager initial download. Original SWFs, ActionScript, and raw
exporter HTML/runtime are not copied into runtime media.

## Verification performed and limitations

Successful checks:

- All six serialized original Canvas exports and all six converter AST audits.
- `node --check` for the recovery script and each converted module.
- ffprobe duration inspection for every one of the 53 published audio files.
- All 53 published audio hashes match original embedded MP3 payload hashes.
- Static inspection of each module metadata verifies dimensions, first/last
  frame, exact contiguous frame count, complete chapter coverage, and cue-to-asset
  references. English 1–5071 and Russian 1–4361 have no chapter gaps.

No browser, server, dependency installation, compiler, production build, full
test suite, or interactive visual/audio verification was run for this slice.
No unrelated failure was encountered. FFDec emitted its nonfatal
`JPacker: Cannot minimize script` warning on exports; conversion succeeded.

Known fidelity limits requiring integration/manual acceptance:

- MP3 duration includes decoder/encoder padding and differs from
  `sampleCount/sampleRate`. Many embedded 11,025-Hz clips record `seekSamples=1661`
  (about 0.150658 seconds); other assets use their actual recorded values.
  Preserve this evidence when decoding, but do not blindly assume browser MPEG
  priming matches Flash. Source cue identity and timing are verified; sample-exact
  audible synchronization is **not** certified without listening/decoder review.
- Canvas exports recover authored drawing timelines, not ActionScript execution,
  button hit regions, or independently controlled nested clip states. Source
  gates and playback controls must remain native and explicit. Visual review
  must confirm nested artwork remains correct at stops and transitions.
- The Russian original quiz drawing/action sequence is intentionally excluded
  after frame 4361, with corrected semantic quiz behavior owned by the wrapper.
- Existing original reference samples under `sphere-reference/` may help compare
  source artwork, but do not prove these native modules render identically.

Manual integration checklist: explicitly start both languages; check initial
questions/title, proof progression and Russian proof holds; take Examples only
at the source gate; confirm every four-second hold and independent audio decay;
check English ending/derivative continuation; verify native Russian quiz handoff;
pause/resume/mute/hide during speech and loading; restart without overlapping old
audio; compare representative diagrams with preserved source reference images.

## Slow-frame playback regression

The user reported repeated speech after about one minute, temporarily cleared
by Pause/Play. The shared animation step previously discarded visible time over
50 ms, whereas the audio clock continued in real time. Its drift correction then
rewound a recording repeatedly. A bounded actual-engine trace reproduced the
150–200 ms repeats without finding simultaneously orphaned sources.

The native lesson player now retains visible elapsed time, syncs sound before
costly Canvas drawing, checks cue readiness across the complete next advance,
and quietly preloads upcoming recordings. Manual gates, chapter boundaries and
timed holds still bound progression; hidden/loading/user-pause time is excluded.
The general animation hook's previous cap remains for other clients.

No English pause was invented near one minute. The original English controller
has no hold between frames 3 and 2878; Russian's earlier four-second holds are
already represented. Binary comparison confirmed all 67 English and 47 Russian
root cue objects, including trims and envelopes.

The slow-frame regression fails with the old cap restored in memory and passes
with the fix. The integrated check passed TypeScript and all 179 tests, and both
production builds plus composed-preview HTTP checks passed. These checks do not
certify audible or pixel-level browser behavior. The original transport-state
cycling is corrected, but the separately reported white rectangle still needs
manual visual confirmation.
