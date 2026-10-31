# Cube sections: source drawing and native geometry recovery

This recovers `Movies/Cubesections.swf` and `Movies/Cubesections-ru.swf`,
not the separate film `Cubesections.flv` or its MP4 conversion. Yuri Remizov's
source attribution and existing third-party media notices continue to apply.
Recovered artwork is not newly licensed by this extraction.

## Source identities and bounded recovery

Both originals are 550 × 400, 24 fps, 1248 root frames.

| Original | SHA-256 |
| --- | --- |
| `Movies/Cubesections.swf` | `e5f8bac0aca2e7485289e7c3c5472af56c49977116085ff9b06df02de554dc73` |
| `Movies/Cubesections-ru.swf` | `e63ea4f3923ba2f3323b9e66fc81218553c0fa7179a84b98f7b03a6b87d41409` |

`node src/modules/solids/recover-cube-media.mjs --proof` exports only English
roots 9, 120, 600 and 1248. `--recover` exports both complete finite drawing
timelines and rebuilds `src/content/cube-sections-media.json`.
The existing serialized FFDec helper limits Java to two active processors,
768 MB heap, nice 15 and a 120-second export timeout. Each final export took
less than one second in this recovery. No raster sequence or video was generated.
Preservation archives are only read.

The EN proof was inspected as drawing code and compared to recovered XFL.
Frame 120 contains morph 78 at ratio 15729; frame 600 contains eight cube/section
shape placements and morph 130 at ratio 53248. These are distinct authored
vector drawings, not an inert screenshot. Scene 5's recursively traversed
symbol dependencies contain no script-owned artwork apart from the separately
adapted transport symbol 70. `cube3_20` / symbol 45's `AnimatorFactory3D`
dependency belongs to Scene 3, not Scene 5. This is why Scene 5 can use the
drawing exporter while the first four demonstrations cannot.

## Contract and use

Each `languages.en` / `languages.ru` entry is compatible with
`OriginalLessonDefinition`: initial root 9, end root 1248, manual stop 9,
complete stop 1248, one lazy drawing module and no audio cues.

Import the chapter module lazily, call `await createTimeline(canvas)`, and use
`draw(globalOneBasedFrame, time)`, `setPlaybackState(playing)` and `dispose()`.
The same module's roots 1, 3, 5 and 7 retain the source title and NEXT artwork.
Only the cube placements on roots 1–8 are removed: their ActionScript-driven
3D belongs in the native controller, not a misleading flattened drawing.

`nativeScenes` retains the four source cube registrations and display-list
child order. Every child includes local polygon points, fill and opacity,
black stroke and width, and raw source matrix/edge evidence. Nested symbol
translations **and the child matrix are already baked into the polygon points**;
do not apply them again. In particular Scene 4's plane already includes its
1.2943572998046875 Y scale. Its eighth child is a direct `DOMShape`, not a symbol
instance: the pink triangular section is retained with its original asymmetric
vertices. No idealized replacement section geometry is substituted.

`playbackHotspot` and `nextBounds` come from original Hit records and recovered
placements. The playback areas differ between English and Russian and must not
be shared by assumption. The reviewed `pp_37` class / symbol 70 root play/stop
adapter selects its authored two-frame artwork according to native transport.

Static text filter bounds come directly from SWF `DefineText` records. The
reviewed cropped, source-density bounded cache helper is applied before
publishing either painter; repeated full-stage text filter work is avoided.
The generated module retains the shared context-transform and lifecycle fixes.

## Verification and remaining limits

- Both finite exports and the audited Canvas converter completed successfully.
- Source transport class handlers and frame selection were checked before patching.
- Recursive XFL Scene 5 script-owned-art dependency validation passed.
- `node --check` passed for both generated painters.
- Contract/metadata and frame-range assertions passed without rendering or a browser.
- No browser automation, visual comparison, full build or type-check was run by
  this worker. Source-code/path correspondence is not a claim of visual parity
  with Flash's renderer. User verification should inspect the final morph
  sequence, localized captions, playback symbols and final question.

The original looping `Swinger-Singers.mp3` remains owned by the existing
`SourceSoundtrack` at gain 0.4. These files add neither duplicate background
audio nor narration. The host's native timer controller owns the first four
demonstrations' transforms, fades and input lifecycle.
