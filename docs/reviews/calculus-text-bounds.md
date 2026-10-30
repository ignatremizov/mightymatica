# Calculus authored static-text bounds

`src/modules/calculus/text-bounds.json` preserves the original DefineText (11)
and DefineText2 (33) TextBounds rectangles, indexed by the exported `text<ID>`
function name. Each tuple is `[xMin, yMin, xMax, yMax]` in authored local twips.
Do not divide by 20: these are the coordinates consumed by exported text drawing
functions, before their placement transform. DefineEditText (37) is excluded
because its dynamic layout is not equivalent.

## Sources and repeatable recovery

Run from the repository:

```sh
node scripts/recover-calculus-text-bounds.mjs
```

The importer defaults to these read-only recovered originals:

- `/home/ignat/code/mightymatica-source-recovery/objects/Movies/Calculus5min/original/Calculus5min.swf`
- `/home/ignat/code/mightymatica-source-recovery/objects/Movies/Calculus5min-ru-mod/original/Calculus5min-ru-mod.swf`

The Russian original is actually named `Calculus5min-ru-mod.swf`; metadata
retains that name rather than inventing a `Calculus5min-ru.swf` provenance.
Both originals have byte-identical counterparts in the preservation archive's
`raw-site/Movies` and `local-site/Movies` directories.

| Language | Static text rectangles | Original SHA-256 |
| --- | ---: | --- |
| English | 241 | `e8a4d987f154884c8410116e2ddcdcad1d6675bac1eb71cfd08031027eff725b` |
| Russian | 229 | `534fd4dbe06c3c98c058b44bf68bdca54e1ba361c5e7befaf650acd48b16d73c` |

Optional `--en`, `--ru`, and `--output` arguments override input/output paths.
Source labels in JSON remain the canonical original movie names. Output parents
must already exist. Output paths are canonicalized to prevent writes through
symlinks into either preservation archive.

Recovery reads only FWS/CWS binary data. It verifies declared uncompressed size,
caps input and uncompressed movie size at 256 MiB, recursively visits
DefineSprite timelines with a maximum depth of 32 and 200,000 total tags, and
rejects truncated tags, malformed timeline endings, duplicate static text IDs,
and non-positive text rectangles. It does not evaluate ActionScript, export
rendering code, or execute a renderer.

## Verification

Two consecutive imports produced byte-identical JSON:
`6c0c98a86c063c2141dc6f5268afb90a4425f27b3b1517e4e9ed8a65f0b24660`
(SHA-256). All 470 entries were checked for integer coordinates and positive
area. English reference values matched exactly:

- `text24`: `[-1163, 174, 4738, 927]`
- `text52`: `[-2176, 92, 5616, 2157]`

`node --check scripts/recover-calculus-text-bounds.mjs` passed. No browser,
build, or full application suite was run for this data-only slice. These checks
establish source-data fidelity, not visual confirmation of the runtime filter.
