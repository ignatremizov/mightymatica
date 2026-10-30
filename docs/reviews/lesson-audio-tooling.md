# Generic original lesson audio recovery

Task: `recover-lesson-audio`. Owned files:
`scripts/recover-lesson-audio.mjs` and this document. The previously reviewed
Sphere assets, metadata, and tooling remain unchanged.

## Scope and use

This is an offline, single-SWF binary recovery tool. It reads an original FWS or
CWS movie and extracts MP3 payloads directly from DefineSound tags. It does not
run ActionScript, Flash, exporter JavaScript, a renderer, or a browser. No frame
export, compiler, server, installation, or bulk collection traversal is involved.

From the repository root:

```sh
node scripts/recover-lesson-audio.mjs \
  --source '/absolute/path/to/original.swf' \
  --output /tmp/lesson-audio-inventory.json \
  --media-dir public/media/family/lesson \
  --inventory-only
```

After reviewing the inventory and source playback logic, omit `--inventory-only`
to write the original embedded MP3s to that lesson directory. The JSON output
path is explicit. Inventory mode writes JSON only, without creating a media
directory or materializing temporary audio. ffprobe receives MP3 bytes on stdin.
Ordinary extraction writes audio, verifies its hash, and writes metadata.

Destination checks resolve existing symlink ancestors. Preservation archive
paths are rejected for both metadata and audio writes. The media directory must
be a lesson subdirectory of this repository's `public/media/`; individual audio
symlinks may not escape that directory. Source and metadata output must differ.
The tool intentionally does not alter either original preservation tree.

The parser has bounded input/decompression (128 MiB compressed / 256 MiB
uncompressed), tag count (200,000), and nested timeline depth (32). Malformed
headers, truncated tags/SOUNDINFO, duplicate sound IDs, and unsupported SWF
compression fail clearly rather than returning a partially guessed timeline.
ffprobe runs sequentially, with a 15-second per-file timeout and bounded output.
No global frame limit or rendering budget is expanded.

## Published metadata contract

Root metadata contains:

- `version: 1`, `frameNumbering: "one-based-global"`,
  `soundTimebase: 44100`, `envelopeLevelMaximum: 32768`.
- `source`, `sourceSha256`, `width`, `height`, `fps`, `frameCount`.
- `audioCues`, `audioAssets`, `nestedTimelines`, `linkageCues`, `streams`,
  `buttonSoundTags`, `actionScriptTags`, `unsupported`, and `limitations`.
- `inventoryOnly`, so inventory output cannot be mistaken for copied assets.

Root `audioCues` uses the same source-data schema as the Sphere lesson:

```text
frame, soundId, sync ("event" | "start" | "stop"), loops
inPoint44, outPoint44 (nullable)
inPointSeconds, outPointSeconds (nullable)
envelope[]:
  mark44, left, right
  seconds, leftGain, rightGain
```

Root `frame` is the one-based global ShowFrame position. No XFL scene offset
translation is needed: the binary root timeline already contains all scenes in
order. Sound trim/envelope coordinates use 44,100 units per second regardless
of the sound's sample rate. Raw envelope levels normalize by 32,768.

Each extracted MP3 `audioAssets` entry includes:

```text
soundId, codec, sampleRate, sampleCount, channels, seekSamples
src, sha256, embeddedMp3Sha256
durationSeconds (nullable), durationMeasurement (nullable)
```

`src` is relative to `public/media/`, for example
`solids/sphere-lesson/en/36.mp3`, without another `media/` prefix. The file and
embedded payload hashes identify exactly the same bytes. All MP3 definitions
are inventoried/extracted, including unreferenced definitions and those used by
unimplemented button/nested mechanisms; do not interpret the asset count as the
number of active narration clips.

`durationMeasurement` distinguishes `ffprobe-format` from
`ffprobe-packet-sum`. Null duration means probing was unavailable or incomplete,
not zero-length audio. Packet durations include MPEG padding. In particular,
the same original Sphere sound 33 measures 123.2982 seconds by packet sum but
122.72 seconds by ffprobe's seekable-file format estimate. Neither is a guarantee
of browser-decoded audible duration. Use actual decoded buffer duration, source
trim/envelope metadata, and source MP3 `seekSamples` with decoder review; do not
silently clamp verified event cues to a filesize-based duration estimate.

## What the inventory does not claim

**Nested cue frames are sprite-local, not global.** Each `nestedTimelines` record
has a `spriteId`, declared `frameCount`, and its own cue/stream/linkage/button/
ActionScript inventories. A sprite can be placed repeatedly, restarted, stopped,
or controlled independently. The tool does not infer those lifetimes, placements,
instance paths, or playheads. A lesson owner must inspect source placement and
ActionScript and map them into its native controller. Do not flatten nested cues
by adding the frame where DefineSprite happened to be defined.

The tool also records, without guessing:

- StartSound2 class-linked cues in `linkageCues`, retaining their sound-info
  fields and class name. Class-to-sound linkage is not resolved.
- Stream headers and block positions/byte lengths in `streams`. Empty headers
  remain evidence, not invented narration. Nonempty streaming audio receives
  an unsupported record and requires a separate reviewed extraction.
- Non-MP3 DefineSound codecs as unsupported, with their IDs and codec numbers.
  They are not mislabeled or copied as MP3.
- DefineButtonSound tags as unsupported, retaining button ID and byte length.
  Their transition sound selection requires a native interaction implementation.
- DoAction, DoInitAction, and DoABC tag presence/positions/byte lengths in
  `actionScriptTags`. Source code is not evaluated. Dynamic Sound creation,
  callbacks, stopAll, programmatic seeks, and arbitrary timers require separate
  source inspection; a clean root cue list does not certify audio completeness.
- Missing numeric sound definitions as unsupported references.

The tool does **not** create source stops, question gates, chapters, or Timer
holds. Owners supply those from reviewed source behavior. Source timeline
`stop()` does not itself stop event sounds. Native Pause, loading, and teardown
must explicitly manage audio; tab switching alone must not pause playback.
Preserve source overlap,
start/no-duplicate, stop-sound, trim, loop, and stereo-envelope semantics.

## Checks performed

No production media was extracted by this task. Real source checks used
`--inventory-only`, with JSON written under `/tmp/`.

- Syntax check and CLI help completed successfully.
- English Sphere binary inventory recovered 67 root cues, 72 sprite timelines,
  and 39 MP3 definitions. All root cue objects, movie header fields, source hash,
  and 37 root-used assets' hashes/sample rates/sample counts/seek samples match
  the frozen Sphere manifest exactly.
- All 39 inventoried MP3s produced measured positive packet durations.
- The generic inventory additionally reports the source's root button-sound tag;
  the 72 Sprite timelines have no StartSound cues. This is a distinct UI-sound
  limitation, not evidence of missing root narration.
- A synthetic binary fixture verified in/out trims, two loops, raw/normalized
  stereo envelope gain, nested local frame 2 stop-sound semantics, unsupported
  stream reporting, and inventory mode creating no media directory.
- A preservation-tree metadata write attempt was rejected before any write.

An initial check expecting packet-summed durations to equal the old seekable-file
duration estimate failed. Investigation established the measurement difference
described above; the tool now labels its measurement explicitly. This was a
diagnostic assumption corrected during implementation, not a pre-existing suite
failure. No browser, compiler, build, full suite, or listening verification was
run. Frozen Sphere files were not regenerated or modified.
