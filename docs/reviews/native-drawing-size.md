# Reviewed native drawing minification

## Approved rollout result

After the single-file proof below was accepted, Main approved sequential in-place
optimization of reviewed generated drawing modules. The completed rollout
optimized **184 modules across 16 families**, from **817,203,092 bytes to
635,221,022 bytes**, saving **181,982,070 bytes (22.27%, approximately 173.55 MiB)**.
These are raw file sizes, not compressed transfer estimates.

Every replacement passed actual ESM import, equal export names, deep-equal full
metadata, and the unchanged execution/network/timer regression gate. An
initial/middle/end three-frame sample from every family passed identical
deterministic Canvas command hashes and disposal checks: **16 modules, 48
frames, no differing recorded commands**. The largest-calculus proof separately
exercised chapter 2. No original artwork, embedded image strings, audio files,
frame lists, teaching gates, placement adapters, or source archives were edited.

| Family | Modules | Before bytes | After bytes |
| --- | ---: | ---: | ---: |
| Algebra | 4 | 20,341,323 | 15,257,305 |
| Calculus | 6 | 192,730,727 | 132,520,212 |
| Coloring | 8 | 30,794,501 | 24,866,825 |
| Dissections | 2 | 5,424,118 | 4,020,397 |
| Escher | 12 | 25,972,573 | 24,638,815 |
| Falling | 1 | 15,566,779 | 15,256,010 |
| Fractals | 10 | 19,120,344 | 14,472,672 |
| Kids | 10 | 84,255,398 | 76,528,584 |
| Logic | 8 | 19,861,823 | 16,038,242 |
| Magic | 6 | 9,173,902 | 6,592,677 |
| Measurement | 6 | 26,250,016 | 18,390,747 |
| Motion | 49 | 79,829,491 | 66,974,510 |
| Reasoning | 22 | 106,428,944 | 88,391,882 |
| Solids | 6 | 32,069,510 | 24,588,163 |
| Stories | 3 | 2,648,798 | 2,167,009 |
| Triangles | 31 | 146,734,845 | 104,516,972 |

The three excluded files are `coloring/native/cube-en/timeline.mjs`,
`coloring/native/cube-ru/timeline.mjs`, and their handwritten
`coloring/native/cube-stage.mjs` companion. The first two import the placement
adapter, so they are outside the pure generated-only schema. The first rollout
attempt encountered that dependency while verifying a cached candidate, before
replacing the cube timeline; neither cube timeline was changed.

Escher's older generated `Object.freeze({...})` registry was inspected and
supported alongside the newer null-prototype registry; both have focused
string-key dispatch coverage. All source comments, including ordinary JPEXS
credits and legal/license comments, are preserved. The first 20 outputs were
refreshed from saved originals after ordinary-comment preservation was added,
then reverified.

### Recovery and final audit

Originals remain under these ignored, local-only recovery roots:

- `.cache/native-unminified/2026-10-30T14-04-38.482Z-2269590/original/`
- `.cache/native-unminified/2026-10-30T14-05-35.135Z-2273118/original/`
- `.cache/native-unminified/2026-10-30T14-06-57.842Z-2276672/original/`

Each run's `manifest.jsonl` records source/output byte counts, source/output
SHA-256, original backup path, export names, metadata SHA-256, and sample traces
when applicable. `comment-preservation-manifest.jsonl` records the first 20 final
revisions. The consolidated `.cache/native-unminified/verified-final.json`
contains the authoritative 184 final records, family totals, and all 16 sample
traces. Every backup and final public output was hashed again and matched its
record. Recovery artifacts are not shipped or committed; keep them until the
approved output is accepted or regenerate from the read-only source archives.

The operation used sequential short-lived workers to release parsed-module
memory after each file, nice priority 15, and `RAYON_NUM_THREADS=2`. Outputs are
prepared and verified in the recovery cache, recovery mappings are recorded
before replacement, and the current public hash is checked before atomic
rename to avoid overwriting a concurrent writer. Failed candidates leave the
public original untouched.

Final focused tests passed **10/10** in approximately **1.03 seconds**:

```sh
nice -n 15 env RAYON_NUM_THREADS=2 node --test --test-concurrency=1 \
  scripts/minify-native-drawings.test.mjs \
  scripts/canvas-font-locals.test.mjs \
  scripts/canvas-timeline-lifecycle.test.mjs \
  scripts/convert-canvas-export.test.mjs
```

Existing family tests were inspected for generated `.mjs` hash contracts; none
were found. Audio/image source hashes remain unchanged. Main owns integrated
type-check/build verification. No browser verification is claimed.

Final `node --check` passed for the tool and representative large calculus,
Escher, and Kids modules. Re-running the opt-in largest-calculus proof against
the final shipped output passed **4/4 tests**, with the same three hashes shown
below. Re-running the complete in-place command changed **zero files**: it
skipped 184 already optimized modules and the three excluded cube files.

### Future regeneration

After converters/recovery tooling regenerate reviewed native drawing modules,
apply the optimization as an explicit overlay:

```sh
nice -n 15 env RAYON_NUM_THREADS=2 node scripts/minify-native-drawings.mjs \
  --in-place --all
```

For one regenerated module:

```sh
nice -n 15 env RAYON_NUM_THREADS=2 node scripts/minify-native-drawings.mjs \
  --in-place public/media/calculus/native/en/chapter-2.mjs
```

Both commands back up originals and verify each replacement. Handwritten and
adapter-importing files are skipped in batch mode and refused in single-file
processing. The exact `// Native drawing minified v1: ...` marker makes repeated
application skip already optimized files; newly regenerated files do not carry
that marker and are processed again. Do not manually add the marker to
unoptimized files. No converter was changed.

For an external proof output, the original two-argument CLI remains available:
`node scripts/minify-native-drawings.mjs REVIEWED_MEDIA.mjs OUTPUT.mjs`, or
`--all OUTPUT_DIRECTORY`. This mode exclusively creates external outputs and
refuses public destinations; public replacement must use `--in-place`.

## Historical single-file proof and approval boundary

The initial work was a single-file proof, not a public-media rollout. No shipped asset,
converter, application source, package manifest, build gate, image, audio, frame
selection, or lesson gate was changed. No browser, server, compiler, production
build, full suite, network access, or dependency installation was used.

The tool only accepts `.mjs` inputs beneath this repository's `public/media`.
Each input must have the reviewed converter provenance, lifecycle v2 marker,
metadata export, timeline creator, and a recognized frozen registry. These
checks are regression checks for known reviewed inputs, not a sandbox or
permission to import untrusted JavaScript. The existing build-gate forbidden
execution/network/timer pattern is checked before and after minification.

Proof outputs are exclusively created, refuse existing files, and cannot be
written beneath `public`. The subsequently approved in-place workflow is
described above.

## Implementation

`scripts/minify-native-drawings.mjs` uses the already installed
`rolldown/utils` `minifySync` API (Oxc). Its actual installed declarations were
inspected in `node_modules/rolldown/dist/shared/binding-BQxk4mNX.d.mts` and the
utils export entry.

Options:

- ES module syntax, whitespace removal, no compression or dead-code elimination.
- Local identifier mangling; top-level binding mangling disabled.
- Function/class names preserved; no property-name mangling.
- Legal/license comments preserved inline; ordinary source comments preserved
  using Acorn tokenization, so strings are never interpreted as comments.
- Exact converter provenance and lifecycle v2 comments prepended because they
  are ordinary comments stripped by minification.
- No bundling, packed code, string evaluation, binary interpreter, blob loader,
  SWF, or runtime/security-policy changes.

Generated function-registry string keys remain intact when shorthand bindings
are renamed. A focused fixture explicitly dispatches through a string key to
protect this behavior.

## Largest-calculus proof

Input: `public/media/calculus/native/en/chapter-2.mjs`.

Temporary output: `/tmp/mightymatica-chapter-2-minified-proof.mjs`.

| Measurement | Result |
| --- | ---: |
| Original bytes | 36,951,146 |
| Minified bytes | 25,409,201 |
| Saved bytes | 11,541,945 |
| Reduction | 31.24% |
| Read/minify/exclusive-write elapsed time | 1,671 ms |

This is raw storage/delivery size, not a gzip/Brotli estimate, and is not an
estimate for the entire media collection.

Commands were run at nice priority 15 with `RAYON_NUM_THREADS=2`:

```sh
nice -n 15 env RAYON_NUM_THREADS=2 node --test scripts/minify-native-drawings.test.mjs
nice -n 15 env RAYON_NUM_THREADS=2 node scripts/minify-native-drawings.mjs \
  public/media/calculus/native/en/chapter-2.mjs \
  /tmp/mightymatica-chapter-2-minified-proof.mjs
nice -n 15 env RAYON_NUM_THREADS=2 \
  NATIVE_DRAWING_PROOF_INPUT=/home/ignat/code/mightymatica/public/media/calculus/native/en/chapter-2.mjs \
  NATIVE_DRAWING_PROOF_OUTPUT=/tmp/mightymatica-chapter-2-minified-proof.mjs \
  node --test scripts/minify-native-drawings.test.mjs
```

The ordinary focused tests passed 2/2. The opt-in proof run passed 3/3 in
approximately 1.64 seconds. It imported the actual reviewed renderer and its
minified output, compared export names and all metadata, created each timeline,
drew the initial/middle/final selected frames, and disposed each timeline.
Disposal restored the original context `save` method, was safe twice, and
prevented further drawing.

The deterministic Canvas command traces matched:

| Selected frame | Recorded calls | SHA-256 |
| --- | ---: | --- |
| 4001 | 8,320 | `0daab79d7c086a136aefd4bebd70a6bcee0bccf023fce61a7e991f1bea9d975f` |
| 6001 | 9,175 | `7f1fca923089918e2a240d47b6a65df483e524a5b51ca11e6a85ef01226e0c1c` |
| 8000 | 8,702 | `bb6c7348562384a43fc1b5f9651c3caa219597a9da1a6333368679c2697ab8fd` |

The inert Canvas/image boundary follows the existing
`scripts/canvas-font-locals.test.mjs` fixture. It records method calls and
primitive arguments, substitutes stable labels for platform objects, and does
not rasterize or decode images. Thus these are command-equivalence and lifecycle
checks, not visual confirmation, pixel equivalence, or exhaustive coverage of
all frames/filters/gradients/property assignments.

## Handoff

Owned files:

- `scripts/minify-native-drawings.mjs`: conservative offline minifier and
  sequential single-file/batch CLI with backed-up, verified in-place mode.
- `scripts/minify-native-drawings.test.mjs`: dispatch/license/gate regressions
  and opt-in real-renderer command-trace proof.
- `docs/reviews/native-drawing-size.md`: this evidence and scope record.

No unrelated pre-existing failures were encountered in these focused checks.
Public asset writes are frozen after the approved rollout. Integrated build
verification belongs to Main; browser visual verification remains unperformed.
