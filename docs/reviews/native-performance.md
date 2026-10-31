# Native rendering diagnostic

Serialized actual drawing/filter JavaScript, real transparent pixel arrays and inert Canvas vector/image boundaries. Not browser FPS, audio or pixel fidelity.

Baseline: `382efbdd72a6a62540abcaeadd662ec70113f2fd`. Backing store: 1520 × 1105 unless the original exceeds the fixed pixel budget; then BOTH versions use 550 × 400. Three draws of each listed source frame; warm values exclude each frame's first draw. Each painter runs in a fresh child process. Wall-clock/JIT/GC variance applies; these timings do not establish browser frame rates.

| Sample | Before warm median (ms) | After warm median (ms) | Full-stage reads, before → after | Backing store |
| --- | ---: | ---: | ---: | --- |
| Pythagoras EN | 702.588 | 0.501 | 50 → 0 | 1520 × 1105 |
| Pythagoras RU | 674.311 | 0.501 | 50 → 0 | 1520 × 1105 |
| Calculus question | 1.053 | 1.119 | 0 → 0 | 1520 × 1105 |
| Quadratic formula | 228.424 | 0.703 | 10 → 0 | 1520 × 1105 |
| Area | 1392.462 | 0.288 | 60 → 0 | 1520 × 1105 |
| Polygon | 743.928 | 0.527 | 30 → 0 | 1520 × 1105 |
| Circle | 503.29 | 0.573 | 20 → 0 | 1520 × 1105 |
| Sphere proof | 875.642 | 0.348 | 30 → 0 | 1520 × 1105 |
| Sphere examples | 1224.008 | 0.207 | 50 → 0 | 1520 × 1105 |
| Sphere ending | 1844.017 | 0.673 | 70 → 0 | 1520 × 1105 |
| Cube counting | 268.522 | 0.123 | 10 → 0 | 1520 × 1105 |
| Plane proof | 543.574 | 2.198 | 20 → 0 | 1520 × 1105 |
| Eight wisemen RU | 539.351 | 0.437 | 20 → 0 | 1520 × 1105 |
| 1089 | 0.584 | 0.789 | 0 → 0 | 1520 × 1105 |
| Color sorting | 269.298 | 0.305 | 10 → 0 | 1520 × 1105 |
| Missing picture ending | 786.714 | 0.503 | 30 → 0 | 1520 × 1105 |
| Falling Figure completion | 916.504 | 0.305 | 40 → 0 | 1520 × 1105 |
| Earth belt | 1485.879 | 259.849 | 60 → 10 | 1520 × 1105 |
| Buffon | 530.369 | 0.511 | 20 → 0 | 1520 × 1105 |
| Carpet | 251.943 | 4.78 | 10 → 0 | 1520 × 1105 |
| Tram question | 238.463 | 72.819 | 90 → 20 | 550 × 400 |
| Hunter question | 1843.747 | 0.118 | 70 → 0 | 1520 × 1105 |
| Cutting paradox | 1238.007 | 0.225 | 50 → 0 | 1520 × 1105 |
| Banknotes RU | 539.199 | 0.129 | 20 → 0 | 1520 × 1105 |
| Snow White completion | 0.098 | 0.108 | 0 → 0 | 1520 × 1105 |
| Faces completion | 0.144 | 0.128 | 0 → 0 | 1520 × 1105 |

The JSON retains every cold and warm draw, exact input hashes and active source frames. Transparent pixel arrays exercise the original filter loops, not glyph rasterization or image decoding. Books/films use native images/video; silent SVG/CSS tools and spatial geometry were inspected separately. Authored shadows and remaining animated/non-text effects are not removed to improve this diagnostic.
