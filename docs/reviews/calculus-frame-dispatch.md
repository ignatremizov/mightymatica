# Bounded calculus root dispatch

The offline `splitCalculusFrameDispatch(source)` export in
`scripts/calculus-frame-dispatch.mjs` returns `{ source, frames, helpers,
chunkSize }`. It does not read or write assets. The default and maximum chunk
size is 32 cases. The rewrite has been applied to all six Calculus chapters,
alongside the bounded filter-buffer and static-text-cache corrections.

The rewrite finds `main` inside the `createTimeline` factory, including its
inner lexical block. Helpers are declared beside `main`, retaining the same
factory closure. The original function name, signature, prefix, suffix,
metadata, registry, filter code, provenance, playback logic, and every original
case source slice remain unchanged. Range comparisons select a helper; its
switch still matches the exact normalized frame, including sparse frame
numbers. No Math dependency, function cache, per-frame closure, or artwork
rewrite is introduced.

Safety gates require the reviewed seven-statement root shape and reject
default cases, fallthrough, unordered/duplicate/noninteger frame labels,
lexical bindings, nested functions, unsupported control flow, labeled breaks,
scope-sensitive references, nonlocal bare assignments, and parameter/prefix
rebinding. Temporary context redirection is permitted only when straight-line
alias analysis proves `t` is restored to the incoming context before the
original suffix. Nested local assignments are rejected.

Every helper declares the union of original root case-local `var` bindings.
This retains their function-hoisted `undefined` state even when a declaration
appears only in another chunk. Prefix locals `s` and `c` are passed explicitly.
There are no suffix reads of moved locals under the accepted shape.

## Checks

Fast deterministic checks:

```sh
node --test tests/calculus-frame-dispatch.test.mjs
```

Explicit generated-source proof:

```sh
CALCULUS_DISPATCH_PROOF=1 node --test tests/calculus-frame-dispatch.test.mjs
```

The opt-in proof imports current English chapter 2 and its candidate in memory.
After applying the rewrite it uses the preserved pre-optimization input at
`.cache/calculus-transition-originals/en/chapter-2.mjs`; an explicit
`CALCULUS_DISPATCH_SOURCE` path can select another reviewed pre-optimization
input. This keeps the proof rerunnable without rewriting public assets.
The proof
executes all frames 5430 through 5550, and compares per-frame SHA-256 command
traces, drawing-state assignments, native transforms, image-data operations,
filter pixel-read counts and areas. Pixel arrays are real bounded arrays;
vector/image rendering is inert. This is execution/command equivalence, not
browser pixel parity or a performance measurement. It writes no proof assets.

Synthetic coverage includes factory closures, sparse labels, 32-frame chunk
boundaries, normalized and unmatched frames, var hoisting, save/transform/
restore order, context redirection, and unsafe-shape rejection.

The explicit actual-source proof passed all five tests, including every frame
5430–5550 in the English second chapter. A separate execution-only smoke check
traversed all 22,856 current English/Russian frame paths.

The combined transition changes reduced the sampled English Integral-title
window from 113.39 ms to 1.53 ms warmed CPU time per draw and the Russian window
from 170.93 ms to 1.80 ms. This is the combined result, not an isolated dispatcher
speed claim. The profile uses real numeric filter work but inert vector/image
drawing, so it does not establish browser frame rates or visual equivalence.

No browser, dev server or dependency installation is needed for these checks.
Actual browser timing, rasterization, shadows, and audiovisual appearance remain
manual acceptance work.
