# Nine bills become ten

## Interactive source-audio extension (2026-10-30)

The primary banknote lesson now uses `OriginalLessonPlayer`: the two existing
Canvas modules, their 30 fps / 1–988 source timeline, and exact original event
audio. The originals are not silent: each has one 36.023-second embedded track
and one root StartSound cue. Both tracks were extracted without transcoding
(144,352 bytes total), preserving sample/seek metadata and cue envelopes.
No claim is made that the track is speech rather than music; no listening or
transcription was performed. The recorded event is played as authored.

`lesson-audio.json` supplies the runtime metadata; original bytes and per-source
recovery inventories live under `public/media/dissections/audio/bills-en/` and
`bills-ru/`. No original artwork was re-exported. Both sources have no unsupported
audio records, nested events or source streams. Recovery is included in the owned
`src/modules/reasoning/recover-audio.mjs` command.

There is no source quiz, so none was added. Play/Pause, Sound and Restart remain
the native transport. The optional mathematical explanation is available after
the source transformation completes and clears on restart or locale change.
Earlier references below to a silent player, seeking and absent audio describe
superseded implementations.

No browser/server/compiler/build/full suite was run. Source audio recovery
completed successfully and measured positive track durations. No new independent
banknote rule was introduced to unit-test. Main owns shared transport integration.
Manual acceptance needs EN/RU audiovisual synchronization and listening, complete
sound tail at the terminal, mute/pause/replay, reduced-motion explicit playback,
responsive fit and hidden-tab/unmount cleanup.

## Final source-first UX review (2026-10-30)

Reviewed the single activity `dissections-nine-bills` against both recovered
Bills-transform MainTimeline classes (only terminal stop 988), English text,
the XFL 700×400 aqua stage at 30 fps, and existing native-media mapping.
Removed the four invented checkpoint jump buttons: the primary interaction is
now the linear original transformation with Play/Pause and Restart. Accessible
seeking remains supplemental; no question gate was invented. Locale changes
reset the optional explanation as well as the artwork. The optional mathematical
explanation, original photographs and explicit-play behavior remain.

No shared player/font/context code or generated media was changed. No browser,
devserver, type-check/build or broad tests were run; this slice has no new
deterministic mathematical rule to test. Main owns integrated verification.
Remaining differences are the native toolbar instead of executable source
controls, missing audio, and explicit Play rather than original initial playback.
Manually verify EN/RU loading, replay at the terminal, optional explanation reset,
seeking and reduced-motion behavior, responsive artwork and navigation teardown.
Visual correctness has not been interactively verified.

Earlier notes below describe prior passes; the four checkpoint buttons mentioned
there are no longer present.

The follow-up UI review removed the repeated collection-author footer and its
duplicate compare-the-joins instruction. The introduction, explanation, banknote
artwork, provenance documentation and educational checkpoints remain unchanged.
No behavior changed and no additional test was warranted.

## Presentation reference pass

Reviewed `Bills-transform`'s recovered aqua `#66ffff` stage and Times New Roman
Bold text. The existing original timeline already retains its photographs,
white note surfaces and authored layout, so no blanket background recoloring
or media regeneration was applied. Shared player presentation is owned by the
application layer. Replaced the visible export/runtime notice with concise
Yuri Remizov attribution and an instruction to compare the joins. The technical
preservation details remain documented below. No browser, compiler, build or
tests were run for this copy-only adjustment.

Activity `dissections-nine-bills` covers exactly:

- `Movies/Bills-transform.swf`
- `Movies/Bills-transform-ru.swf`

Both originals have 988 frames at 30fps and a 700×400 stage. Both recovered
ActionScript classes stop on frame 988; there are no puzzle rules hidden behind
buttons. English/Russian extracted text explicitly describes nine bills
transforming to ten. Their bitmap-and-vector timeline does the transformation.

## Preservation

`public/media/dissections/bills-en.mjs` and `bills-ru.mjs` preserve all source
frames, original bill bitmap pieces (18 embedded images per language), transforms,
and vector/text artwork. The languages use their own exports, not a substituted
English drawing beneath translated chrome. The catalog marks this `native`:
the source graphics/timeline are retained and controlled by the shared native
Canvas playback controller, with no SWF, emulator, or ActionScript runtime.
Original audio is not included. Native UI starts paused and supplies seeking,
restart, play/pause, four checkpoint buttons, and a revealable DOM explanation.
Reduced-motion users can seek individual frames without automatic playback.

Exported through `scripts/export-original-frames.mjs`, frames `1-988`, Canvas
format, then `scripts/convert-canvas-export.mjs`. This mechanically replaces
exporter string dispatch with a fixed symbol table and removes exporter-owned
timers/window chrome. The converter statically audits generated drawing code
against evaluation, network, storage, arbitrary DOM, and lifecycle APIs. The raw
HTML/exporter JS intermediates were removed from public media after conversion.
The resulting modules contain only embedded local image data and native drawing
helpers; no remote image requests are needed.

Read-only source evidence: recovered metadata, text resources, MainTimeline.as,
and generated Canvas timeline commands. Original PNG frames 1,180,360,540,720,900,
988 were exported for direct image inspection, retained in
`public/media/dissections/reference/` as reference stills. Inspected frames 1,
180,360,540,988: different-height horizontal cuts separate note pieces, and the final
frame compares nine original notes in the upper row with ten joined arrangements
in the lower row. Therefore this is not a generic triangle/rectangle substitution.
The DOM explanation intentionally avoids asserting an unmeasured percentage of
missing paper or claiming that the film is a physically exact area-conservation
simulation.

## Attribution and limits

Original lesson: Yuri Remizov / MightyMatica collection. The banknote photographs
depict historical British £20 notes and retain their original source appearance;
this restoration does not claim ownership or grant a new license to currency
imagery. The explanatory reveal and accessible controls are new.

No browser automation, compiler, build, or full test run was performed by this
worker. Generated modules passed the converter's AST audit and `node --check`.
No standalone game-rule test was added: this item is an original timeline with
shared playback, not a new game simulation. Direct PNG inspection verifies source
art but does not verify the Canvas browser rendering. Main should verify EN/RU
loading, all checkpoint controls, frame 988 joins, reduced-motion manual seeking,
responsive fit, and resource cleanup on navigation.
