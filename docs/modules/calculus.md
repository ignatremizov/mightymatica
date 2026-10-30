# Functions and calculus

Calculus in five minutes now uses original animated teaching artwork, original
embedded audio and source quiz branches as its primary experience. The ten
graph/menu entries remain native mathematical adaptations.

## Exact coverage

| Activity | Source |
| --- | --- |
| calculus-graphintro | Movies/Graphintro.swf |
| calculus-graph-linear | Movies/Graph-linear.swf |
| calculus-graph-square | Movies/Graph-square.swf |
| calculus-graph-cubic | Movies/Graph-cubic.swf |
| calculus-graph-power | Movies/Graph-power.swf |
| calculus-graph-sine | Movies/Graph-sine.swf |
| calculus-graph-cosine | Movies/Graph-cosine.swf |
| calculus-graph-tan | Movies/Graph-tan.swf |
| calculus-graph-gaussian | Movies/Graph-gaussian.swf |
| calculus-graph-sinecosine | Movies/Graph-sinecosine.swf |
| calculus-five-minutes | Movies/Calculus5min.swf; Movies/Calculus5min-ru-mod.swf |

## Original interactive calculus lesson

`NativeLesson.tsx` selects the actual EN/RU source variant. English contains
11,859 frames and 157 root audio events; Russian contains 10,997 frames and
155 root events. Both run at source 24fps. Each is split into three contiguous
Canvas modules of at most 4,000 selected frames, loaded only as needed. The
English introduction, five teaching parts, original car/graph artwork and full
eight-question ending quiz are included as source drawing timelines, not
replaced by a spoiler movie or explanatory page.

Each language has 23 source questions (15 within the lessons, eight in the
ending quiz), 23 wrong/retry states, and 80 stopped frames. `recover-flow.py`
reads XML structurally and recovers only literal ActionScript branch targets;
it does not execute them. Scene-relative gotoAndPlay destinations are translated
to one-based global frames. `en-flow.json` and `ru-flow.json` retain that evidence.
Question choices and Retry use the shared player's finite `stopActions`:
Play cannot step through a question. Correct choices take their source branch;
wrong choices play the source feedback and offer its exact retry destination.
Original numbered choice positions come from DOM instance matrices. Source
part/quiz navigation remains available, but no arbitrary time slider or
answer-seeking control is introduced.

Original MP3 bytes, sound trims, loops and stereo envelopes are recovered by
the shared offline extractor into owned `*-audio.json` metadata and
`public/media/calculus/native/{en,ru}/`. Source definitions number 32 EN and
29 RU. These sources contain no nested StartSound cues. The shared player owns
explicit Play/Pause/Sound/Restart, background audio progression and unmount disposal.
It does not autoplay sound or execute Flash/ActionScript. Reduced motion leaves
explicit playback available. The previous slope/accumulation exploration is
supplementary, available after lesson completion, and no longer imposes another
replacement prerequisite quiz.

## Graph explorers and retained mathematical corrections

Read each graph's MainTimeline slider defaults and handlers. Source-specific
initial parameter values, ranges and Reset are restored. Sine/cosine/sum use
three ordered panels with six independent controls. Graphintro remains the
chooser for all nine graph types. Graph-power is exponential aˣ+b.

Gaussian is normalized and excludes singular sigma=0 (minimum 0.1).
Tangent segments split at analytical poles with either frequency sign.
Source's inconsistent square `/10` change-handler scaling is deliberately not
reproduced: the model stays consistent before and after editing. Fixed viewport
clipping is not a domain restriction. Pointer inspection and keyboard sliders
remain supplementary; original Flash pixel scaling and the linear slope-helper
artwork are not fully restored.

## Recovery, limits and acceptance

Read both calculus MainTimeline scripts, their extracted texts and all source
scene XML, plus graph scripts/text. Recovered source scene bounds:

- EN: 1–868, 869–2865, 2866–4856, 4857–6900, 6901–8875,
  8876–11035, 11036–11859.
- RU: 1–1997, 1998–3994, 3995–6038, 6039–8013,
  8014–10173, 10174–10997.

Explicit Canvas exports used the serialized helper, original limits and audited
converter. No raster film export, source mutation, installation or ActionScript
execution occurred. Media is large (roughly 99MiB EN and 88MiB RU drawing code,
before transport compression) and must stay lazy; it is not initial shell media.
Original files and source hashes remain in family metadata.

All 115 question/retry actions per language also retain their exact untrimmed
source down-state sound IDs (EN 188/98; RU 260/28), honoring the shared Sound
toggle. Other source part/play-button effects remain an explicit limitation,
distinct from the restored root soundtrack. Audio has not been listened
to here; generic tracks are not all claimed spoken narration. Exact decoded
alignment, fonts, nested visual state, click-hit rectangles and visual parity
require user playback. Rights/provenance review still applies. Conic/cube-section
film sources belong to the film treatment, not an invented calculus simulator.

Focused verification:

```sh
node --experimental-strip-types --test tests/algebra-rules.test.mjs tests/calculus-rules.test.mjs tests/calculus-lesson.test.mjs
```

14/14 passed, including all 46 source question branch/retry mappings,
non-question stops not acquiring quizzes, per-graph reset/ranges, tangent poles,
Gaussian normalization and calculus identities. No pre-existing failure found.
Main owns compiler/build/integrated checks. No browser, server, full suite or
listening run by this slice.

Manual acceptance: EN/RU full lessons; wrong/retry/correct and transport at every
question; final quiz; manual teaching stops; parts/Restart; Sound toggle during
playback; hidden tab/unmount; chapter-load continuity; native choice hotspots
at narrow widths; all nine graph defaults/reset and three sum panels.

## Source controls and backing-resolution correction

The generated Canvas enhancer now tracks native scaling, rotation, translation
and reset in its shadow matrix. Chart strokes and capsule outlines consequently
use the same transform as their filled artwork and labels. The bounded static
text-filter cache remains intact; authored title sizes, graph geometry and green
endpoint markers are unchanged. The large first-question heading matches the
original scene rather than an inferred type-size adjustment.

Only the reviewed English `pp_26` and Russian `pp_9` two-state transport sprites
follow native playback state. Their original artwork remains visible beneath
transparent semantic hit regions at recovered positions. The painted Part/Quiz
menu is also clickable. The HTML shortcuts remain available before the original
menu appears, so the introduction can still be skipped. Explicit chapter choices
restart that chapter, including choosing the current one again; mute survives
those jumps. The original Part 2 Quiz handler's `"7"` scene-name typo is narrowly
resolved to `Scene 7`.

The HTML Part/Quiz shortcuts share one wrapping toolbar with Play/Pause,
Restart and Sound to their right, as requested. The toolbar can use the activity
width while the original lesson stage retains its centered 760-pixel maximum.

`recover-controls.py` reproduces the exact source placement metadata.
`scripts/calculus-playback-control.mjs` reproduces the transport adapter and is
applied after regenerating the six chapter modules. No original source is
modified. Manual acceptance remains necessary for EN/RU menu hit regions, stable
Play/Pause, chart alignment at different display densities, mute across chapter
choices, and all original question gates.

## Original NEXT and answer regions

The four teaching-part NEXT stops in each language now use the original Hit
artwork and source placement matrices. Their handlers resume the current
timeline; they do not jump over intervening teaching or question stops.
Numbered answers and Retry likewise retain their painted source artwork beneath
transparent semantic buttons. Text-only retry regions also use the original
binary button-record matrices and static-text rectangles, not estimated labels.
All 23 questions and 23 wrong/retry gates per language retain their source
destinations and sounds. Generic Play cannot bypass them.

After the final quiz, a prominent **Explore slope and accumulation** action on
the lesson opens the supplementary exploration and moves focus to its heading.
It does not impose the already-answered power-rule question again. Previous/Next
example controls advance the same constant / accelerating / sine selection as
the Motion dropdown, without discarding the current time or secant interval.
Fractions, derivatives and integrals use native MathML with localized accessible
labels. A separate, collapsible note attributed to Ignat explains the arbitrary
constant `+ C` in an indefinite integral; the original lesson is unchanged.

## Bounded transition rendering

Additional profiling identified two distinct sources of slow title transitions:
full-canvas filters around static text hidden inside one-frame sprite wrappers,
and large root functions plus short-lived numeric filter arrays.

- The reviewed filter optimizer now recognizes only verified, one-child static
  text wrappers. Their bounds come from the original `DefineText` rectangles
  transformed through the authored child matrix. It rejects animated or
  otherwise unrecognized wrappers and extends the same bounded cache.
- Root frame dispatch is split into helpers of at most 32 cases, retaining
  original case bodies and factory scope. Exact safety guards reject unknown
  control flow and context redirection that does not restore its input.
- Three recognized filter scratch arrays use `Float64Array`, retaining
  JavaScript-number arithmetic and original rounding. Filter order, authored
  shadow strengths, fractional displacement and alpha composition are unchanged.

The repeatable transition profile uses real filter pixel arrays with inert
vector/image drawing at a 1520 × 1105 backing size. In the English Integral-title
window, warmed average CPU time changed from 113.39 ms to 1.53 ms per draw;
the corresponding Russian window changed from 170.93 ms to 1.80 ms. Full-canvas
reads fell to zero in all ten sampled transition windows. These are CPU
diagnostics, **not measured browser frame rates or pixel-equivalence evidence**.
Filtered bitmaps still use the documented source-density quality tradeoff;
ordinary vectors remain high-DPI.

`optimize-calculus-transitions.mjs` applies the dispatch/buffer corrections;
`optimize-calculus-filters.mjs` applies or extends the text cache. Both preserve
module metadata and source artwork, with backups and concurrent-edit checks.
The actual-source dispatch proof remains rerunnable against its preserved
pre-optimization input. An execution-only smoke check traversed all 22,856
current Calculus frame paths without exceptions.

Manual acceptance remains necessary for the reported title transitions and
shadows, NEXT and answer hit alignment, both locales, completion-only exploration,
example navigation, and MathML layout at narrow widths. No browser or listening
verification is claimed.
