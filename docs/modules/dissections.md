# Nine bills become ten

## Embedded-bitmap eligibility follow-up (2026-10-31)

Both banknote painters were rechecked by the static optimizer after adding the
reviewed immutable embedded-bitmap fill grammar. No additional blocks qualified
and neither painter changed in this pass. Existing nested glow patches are
preserved; the nested optimizer was not rerun. Source hashes and static
stroke exclusions remain in force. No audio, timing, explanatory gate or
authored effect changed. No dense benchmark, browser or full build ran here.

## Source-bound static-composite follow-up (2026-10-31)

Reviewed both banknote painters with binary-derived static shape/text bounds in
`drawing-bounds-bills.json`. Source hashes match the existing per-language text
evidence and actual preserved binaries; shared text rectangles are checked for
equality. Existing text-only evidence is unchanged.

The reasoning-owned `optimize-static-painters.mjs --recover|--apply|--verify` covers
this family too. Its conservative guard excludes stroked leaves, while the shared
static grammar rejects clipped bitmap patterns, dynamic artwork and nested filters.
No additional static groups qualified in either banknote painter, so this pass
changed **no media bytes**. `static-filter-optimization.json` records both original
and unchanged result hashes. The Russian nested-glow wrapper is intentionally not
handled here; its separate coordinated follow-up may supersede the residual count
in the earlier text-only review.

Reasoning's native export recipe now runs the static pass after its existing
text pass, including these two companions. Future eligible replacements must pass
source validation, hashed backups, syntax, deep metadata/export equivalence,
idempotence and concurrent-edit guards. No gate, audio, timing, question or visual
effect changed. Shared cache/importer tests passed 14/14; focused reasoning
rule/audio/gate tests passed 11/11. The static check repeated without changes.
No browser, dense benchmark, build or recovery export ran.

## Nested static-text follow-up (2026-10-31)

The subsequently reviewed nested-text rewrite now fuses the 746 Russian outer
glow blocks around `sprite69 → text68`; the earlier limitation below is
superseded. The one-frame wrapper itself, original banknote imagery, cuts,
transitions, existing caches, audio, timing and explanation gate are unchanged.
Both authored glow stages retain their parameters and inner-before-outer order,
running together at source density. This is the approved density policy, not
universal exact parity with the former mixed-density DPR>1 path.

See [the nested-filter review](../reviews/nested-filter-optimization.md) and its
JSON companion for actual-source bounds/hash verification, original backup,
result hash, reproduction and focused checks. All four nested-filter tests
pass, including tiny actual-filter arithmetic probes. No browser/font pixel
parity, FPS, listening, dense baseline benchmark or integrated build was
performed by this pass.

## Source-text filter performance pass (2026-10-31)

Reviewed the single activity and both existing 700×400, 988-frame banknote
painters. Exact bounds for all three static texts per language were recovered
from `Bills-transform.swf` and `Bills-transform-ru.swf`, with independent source
SHA-256 evidence in `src/modules/dissections/text-bounds-bills.json`.
`node src/modules/reasoning/recover-text-bounds.mjs` reproduces this recovery
alongside the reasoning sources, without executing ActionScript or exporting
any artwork.

The reviewed bounded source-density text cache now handles 901 English and 156
Russian generated filter groups. These are source locations, not concurrent
per-frame calls. Original banknote bitmaps, cuts, piece transforms, audio,
30 fps timing, initial/terminal frames, and explanation gate remain unchanged.
Authored shadows/glows remain: only verified text-only filter work is cropped
and reused, with renderer-owned cache teardown.

Russian `sprite69` retains 746 original outer glow sites, active at source
frames 203–948. It wraps `text68` with a now-cached inner glow; safely flattening
the additional outer filter needs separately reviewed nested-filter support.
No unsupported nested-filter optimization or shadow removal was attempted.
English has no remaining authored filter placements outside the text cache.
The eight filter-library implementation calls in each painter remain.

`node src/modules/reasoning/optimize-painters.mjs --apply` performs the guarded
rewrite; `--verify` checks source evidence and idempotence without writing.
Both replacements passed syntax and deep-equal metadata/export checks, retained
content-hashed originals under `.cache/dissections-filter-originals/`, and
passed immediate and repeat idempotence checks. The exact backup paths and
before/after hashes are in `src/modules/dissections/filter-optimization.json`.
The 11 focused reasoning rule/audio/gate regressions also pass. No new
banknote rule or user interaction was introduced.

No browser, server, integrated compiler/build, full suite, full-density baseline
benchmark, listening, pixel-parity or FPS verification was performed. Main
coordinates actual-filter probes. Manual acceptance should compare EN/RU title
and caption glows, the moving banknote seams (including RU frame 576), replay,
sound and the terminal explanation gate.

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
