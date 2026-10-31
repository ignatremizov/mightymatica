# Original films

This family restores the original moving images, not generic replacement
diagrams or newly invented cartoons. It is a native HTML5 playback port, not a
claim that a film is an interactive mathematical simulation.

## Reproduction

Run `node scripts/transcode-films.mjs [recovery-root] [archive-raw-site-root] [film-key]`.
Requires ffmpeg, ffprobe and nice. Inputs are read-only. Outputs are sequential
H.264/AAC MP4 conversions at source dimensions and source frame timing, using
`nice -n 10`, two codec threads, veryfast, CRF 20 and faststart. No resizing,
interpolation, arbitrary music or parallel encoders are used. An optional film
key regenerates only that film while retaining the other metadata records.
Möbius uses CRF 12 to limit further losses in the already compressed 640 × 480
Sorenson source; it retains all 759 frames at 25 fps, without upscaling.

`src/content/films.json` is the integration API: an array containing `key`, `src`
(relative to `public/media/`, resolved with shared `mediaUrl`), `source` (original
site-relative path), `duration` (seconds), `audio` and `title`.

`public/media/films/provenance.json` records exact input video/audio SHA-256,
audio duration, source stream metadata, SWF timeline frame rate/count,
first/last SoundStreamBlock frame, and output hashes.

## Soundtrack linkage and timing

The eight embedded FLVs contain video only. Their sibling
`resources/sounds/-1.mp3` files are recovered SWF streaming audio, not incidental
button effects. Möbius is the exception in audible content: its recovered MP3
decodes to digital silence (`volumedetect` mean/max −91 dB). The native Möbius
MP4 therefore omits that empty audio stream; its original hash and timing remain
in provenance. Each XFL DOMDocument declares precisely one embedded movie and
one sound (`sound-1_1-N.wav`); the suffix N matches the movie's frame span.
The XFL converter lists the sound as a media item but omits its timeline layer.
Therefore the reproduction script also parses the original compressed SWF
tags: SoundStreamBlock tags establish the audio's actual frame linkage. It
refuses conversion if audio does not begin at frame zero or has no stream
blocks. This avoids silently replacing a missing soundtrack or guessing an
offset from filenames.

Video and streaming MP3 start together at time zero. Original recovered MP3
sample durations are slightly shorter than the visual timeline. The MP4 keeps
the full video tail; no stretching, padding or `-shortest` truncation is applied.
Decoder delay and lossy MP3→AAC recoding prevent a claim of sample-exact audio
identity; hashes identify the exact original MP3 input.

## Coverage and fidelity

- `Pinoc1`, `Prosto5`, `Snowpart-0`, `Snowpart-2`: original cartoon companions;
  same media can be embedded by the stories family without a second conversion.
- `Funnymathmult`, `Conic-6x4-f`, `cubesec6x4-f`, `Moeb7`: original educational films.
- `Cubesections`: original external `Movies/Cubesections.flv`, with any original
  embedded audio mapped directly rather than borrowing another SWF's soundtrack.

Source artifacts inspected: each corresponding
`objects/Movies/<key>/resources/movies/1.flv`,
`resources/sounds/-1.mp3`, `original/<key>.swf` and
`project/<key>.xfl/<key>/DOMDocument.xml`; external source is the archive's
`raw-site/Movies/Cubesections.flv`.

Native standalone controls provide explicit play, pause, seeking, full screen and replay.
Audio is muted initially and opt-in. There is no autoplay or forced looping.
Started playback continues across tab hiding and focus changes, subject to
browser/OS suspension; leaving the activity pauses the player on teardown.
Reduced motion does not start the film automatically; motion remains explicitly
requested by Play. The Books page's silent Möbius illustration instead loops
automatically while visible, honors page reduced motion, preserves an explicit
pause, and suspends while hidden or offscreen. Its poster is a lossless frame
from the original FLV, without an intermediate JPEG/MP4 recompression.

Original pixels and audio remain subject to their original rights, including
third-party cartoon/music rights. This work grants no blanket media license.
Original language is retained. No captions, audio description or transcript
have been invented; these are accessibility limitations.

## Verification

The reproduction script completed all nine conversions, probing every source
and output and validating SWF stream audio starts. `node --check
scripts/transcode-films.mjs` passed. A separate ffprobe packet-count check
confirmed all nine outputs contain populated H.264 video and AAC audio streams.
The eight embedded films retain exactly 379, 390, 104, 510, 3357, 1856, 2777 and
759 video packets respectively, matching their authored frame counts. The
external film contains 2220 video packets. Total output is approximately 26 MiB.
No browser, compiler, full test suite or build is run by this worker.
Manual integration checks: open each film; explicitly play; enable sound;
seek and replay; hide the tab and confirm started playback continues; change
activity and confirm audio stops; check mobile controls and source aspect ratio.
Audio/video perceptual synchronization still needs human viewing/listening.

### Playback-control review

The soundtrack checkbox now follows native mute/volume changes, rather than
displaying stale sound state after the built-in controls are used. Explicitly
enabling the soundtrack also restores a zero native volume, matching the story
companion player. Successful playback clears a previous playback-error notice.
Initial mute, explicit playback and teardown are unchanged. The current
background-playback policy is described above.
Repeated collection-author credit was removed from the player footer; distinct
artwork and film credits remain.

Verified by source inspection only; no browser or compiler was run. Manually
check native mute/unmute and zero-volume changes against the checkbox, then
enable the checkbox from zero volume. Verify a successful playback retry removes
the error notice. Main owns integrated checks.

### Final sharded review

Reviewed all nine manifest entries: `Pinoc1`, `Prosto5`, `Snowpart-0`,
`Snowpart-2`, `Funnymathmult`, `Conic-6x4-f`, `cubesec6x4-f`, `Moeb7`, and
`Cubesections`. Rechecked the eight embedded-film `DOMDocument.xml` media
declarations and recovered `DefineButton2_3` replay actions (`gotoAndPlay("1")`).
The terminal-frame decompilations contain malformed stack expressions, so they
are not used to infer additional end-of-film behavior. The archived
`Visualmath.html` and `Livegeometry.html` link the ninth film directly as FLV.
There is no source-backed reason to add question gates to these film entries.

Fixed a native-control feedback bug: reaching zero volume made React force
mute, so raising native volume could leave the film unexpectedly silent.
Mute is now initialized once, while subsequent mute/volume state belongs to
the native player. The soundtrack checkbox still mirrors audibility and can
explicitly unmute and restore zero volume. Removed redundant visible
credits-preservation boilerplate; actual film credits and shell attribution
remain. Explicit play, no loop, replay, teardown pause and
original media dimensions remain unchanged.

Read-only asset validation found all nine film files present and nonempty.
No browser, compiler, build, transcoding or full suite was run. A platform
media-control regression needs manual verification, not a mock-DOM unit test:
play with sound, reduce native volume to zero, raise it, and confirm sound
returns without a separate unmute. Check checkbox/native mute agreement,
replay at the end, background playback, teardown and unavailable-media errors.
Perceptual sync and visual fidelity still require human viewing/listening.

### Rendering/performance review

All nine entries listed above use the same native `FilmPlayer` and were
reviewed for frame-loop and lifecycle overhead. The player has no Canvas,
generated painter, pixel filter, animation timer, `timeupdate` subscription,
or per-frame React/DOM update. React state changes only for sound controls and
playback/error events. Only the selected film mounts; `preload="metadata"`
does not request all nine films. Native video retains the source dimension
cap and browser-owned decoding, seeking and playback. No replacement renderer,
transcode, background-policy change or runtime optimization was justified.

A read-only Node validation passed for all nine output MP4 SHA-256 hashes and
all recorded input video/audio hashes in `public/media/films/provenance.json`.
The eight recovered film `DOMDocument.xml` files each declare one video and
one sound item; the ninth input is the recorded external `Cubesections.flv`.
No expensive generated text filters exist in this family.

Only documentation changed in this review, including correction of stale
hidden-tab pause descriptions to match the current runtime policy. No browser,
FPS benchmark, audio listening, compiler, build, full suite or media processing
was performed. Native playback and perceptual fidelity still require the manual
checks above.
