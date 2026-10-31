# Reviewed nested static-text filters

Only explicit reviewed targets are considered. The rewrite preserves wrapper
functions and existing shape/static-composite caches. It directly paints the
verified text leaf with the composed matrix, then applies the original inner
chain followed by the outer chain at source density. It never calls the nested
wrapper inside a cropped context. Original shadow/glow parameters remain.

This is the approved source-density policy, not universal pixel equivalence to
the former mixed-density path at DPR greater than one. Timeline metadata,
exports, audio, question gates, hints and scene crops are unchanged.

Reproduce with `node scripts/optimize-reviewed-nested-filters.mjs --apply`,
optionally adding `--family FAMILY`. The JSON companion records exact source
hashes, original backups, before/after hashes and wrapper counts. A prepared
entry is not proof of replacement: the target must match its after hash.
Both bounds and source hashes are checked against the preserved SWF data.

| Painter | Status | Rewritten blocks | Qualified wrappers |
| --- | --- | ---: | --- |
| dissections/bills-ru.mjs | applied | 746 | sprite69 → text68 (746) |
| logic/native/wisemen-eight-ru-hint.mjs | unchanged | 0 | — |
| logic/native/wisemen-eight-ru-story.mjs | applied | 330 | sprite79 → text78 (139), sprite83 → text82 (191) |
| motion/native/earth-belt/en/frames-1-580.mjs | applied | 102 | sprite29 → text28 (102) |
| motion/native/earth-belt/ru/frames-1-580.mjs | applied | 102 | sprite29 → text28 (102) |
| reasoning/native/paradox-en.mjs | applied | 490 | sprite240 → text239 (490) |
| reasoning/native/paradox-ru.mjs | applied | 490 | sprite240 → text239 (490) |
| reasoning/native/snail-en.mjs | applied | 118 | sprite31 → text30 (118) |
| reasoning/native/snail-ru.mjs | applied | 118 | sprite31 → text30 (118) |
| reasoning/native/tram-en.mjs | applied | 109 | sprite79 → text78 (109) |
| reasoning/native/tram-ru.mjs | applied | 109 | sprite71 → text70 (109) |
| solids/sphere-lesson/en/examples.mjs | applied | 142 | sprite241 → text240 (142) |
| triangles/native/inscribed-angle/ru/chapter-1.mjs | applied | 134 | sprite80 → text79 (134) |

The additional Russian eight-wise-men `sprite83` is explicitly approved and
reported separately from `sprite79`. No dynamic wrapper is flattened.
Targets marked unchanged had no qualifying outer block.

Validation: `node --test tests/nested-text-filters.test.mjs` passed all four
tests, including rejection/idempotence and actual recovered filter arithmetic
on tiny 48×32 deterministic pixel fixtures. Those probes cover filter order,
transparent intermediate composition, stage-edge clipping and fractional
placement; they do not substitute for browser/font rasterization validation.
Every replacement also passes syntax, deep metadata/export comparison,
concurrent-edit protection and idempotence checks. No browser automation,
dense baseline profiling, server or integrated build was run by this batch.
