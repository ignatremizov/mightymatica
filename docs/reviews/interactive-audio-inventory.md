# Interactive audio source inventory

**Pre-restoration snapshot.** The implementation comparisons below were captured
before the shared audio player and family restorations described in
[the final review](final-ux-review.md). The source evidence remains useful; rows
marked “audio gap” are historical observations, not a current release-status
list. Current family documents and the integration checkpoint record the work
completed afterward.

Audit date: 2026-10-30. Scope: all **203 content SWFs**, plus four support SWFs, in `src/content/legacy.json`. All 203 content sources are mapped to their current activities. These SWFs represent 142 unique activity IDs; the 143rd current activity, `films-cubesections`, comes from external `Movies/Cubesections.flv`, outside the SWF inventory. This is a read-only source/controller audit, not an assertion of audiovisual parity.

## Decision summary

The user requires interactive lessons with audio to remain interactive animation/video lessons, not explanation pages. Restoring a visual canvas export alone does not meet that requirement. `src/shared/OriginalTimeline.tsx` has drawing and playback controls but **no soundtrack contract, cue scheduler, or audio element**. Its reasoning/dissection/Escher consumers therefore do not automatically preserve source audio.

Substantial source root-event sequences occur throughout triangles, algebra, measurement, motion, calculus, reasoning, fractals, logic, magic, coloring, and solids. This is not a sphere-only gap. These are restoration candidates, not verified spoken-narration classifications.

**Important semantic limit:** generic `soundNN.wav` names, durations, and event counts establish authored audio and timing, not whether the recording contains speech, music, laughter, applause, or another effect. No audio was listened to or transcribed in this bounded audit. A complete list of “spoken narration definitely missing” cannot honestly be certified from these artifacts alone. Unknown tracks remain explicitly unknown rather than being declared narration or silent.

## Evidence and method

- Authoritative source: `/home/ignat/code/mightymatica-source-recovery/inventory/swf-recovery.json`, original SWFs referenced there, each object's recovered `project/**/DOMDocument.xml`, `project/**/LIBRARY/*.xml`, and `actionscript/**`.
- Parsed actual SWF DefineSound (14), StartSound (15/89), SoundStreamBlock (19), and recursively DefineSprite (39). Header FPS/frame counts come from recovery metadata. Stream headers alone are not treated as audible streams.
- Collected XFL `DOMFrame soundName`, explicit `soundSync` or its absent/event default, zero-based frame indices, and root-versus-symbol location. These XML cues are evidence, not an executable reachability proof.
- Collected literal ActionScript `loadSound`, `URLRequest`, and `attachSound` arguments. Some arguments are linkage IDs, not URLs; external SWF loads are not automatically audio. Computed/dynamic names can require further source tracing.
- Compared all 20 family manifests, their dynamic content tables, current activity controllers, `src/content/films.json`, and shared timeline player. Family-level audio-file search results in JSON are discovery pointers, **not** proof every activity uses those files.
- No exporter, network request, browser, server, compiler, test, or media transcode was run.
- Full per-source evidence, including track sample durations, XFL cue frames, and literal script loads, lives in `src/content/interactive-audio-inventory.json`. This review JSON is not imported by runtime code.

## Current shipped audio versus work in progress

| Surface | Static implementation evidence | What it does not prove |
| --- | --- | --- |
| Nine films: eight SWF streams plus external Cube sections FLV | `films.json` declares audio and `modules/films/index.tsx` provides native video controls; four story clips also run through `StoryFilm.tsx` | Playback was not probed; a standalone film is not full interactive-lesson parity |
| Kitten | `modules/kids/Kitten.tsx` uses muted-by-default video with native controls and opt-in sound | The MP4 audio stream was not probed |
| Falling Figure | `modules/falling/index.tsx` wires original Shortbang/Boing feedback | Not a narrated educational timeline |
| Escher | `GameTimeline.tsx` exposes introduction/completion/stairs/waterfall clips; puzzle controllers wire move effects | Standalone clips are not automatically synchronized to source timeline events |
| Sphere volume | Parallel worker has wired `SphereLesson.tsx` and generated EN/RU cue metadata in `sphere-lesson.json` | Audit observed an in-progress import of `OriginalLessonPlayer`; player implementation was not yet present at that instant. Treat as in progress, not shipped/verified |
| Other source-audio activities | No activity-local audio/video implementation found beyond the exceptions above | Text explanations or silent original timelines do not preserve their source soundtrack |

## Restoration groups requiring source-audio work

Prioritize exact activity/source entries in the complete matrix below. These groups have substantial authored event sequences or an obvious lesson timeline and currently lack an established synchronized source-audio implementation:

- **Triangles:** all eleven activities: false-proof, congruence, pythagoras, medians, altitudes, bisectors, cosine-law, sine-law, inscribed-angle, trig-addition, palm-trig.
- **Algebra:** square-of-sum, difference-of-squares, transformations, quadratic. Sum-integers and sum-odds have no embedded/script-audio evidence in this audit; do not invent narration.
- **Measurement:** area, polygon, circle.
- **Calculus:** five-minutes. Graph-linear separately loads a bell effect; graphintro has a short event, not evidence for a narrated course.
- **Motion:** coin-cluster, two-coins, square-coin, earth-belt, earth-walk, cyclists (English/Russian/Chinese source variants), caterpillar. Circle-in-circle has no audio evidence.
- **Reasoning:** burninghouse, grandma, hunter, snail, staruhi, tram, turtles, wine, bacteria, hand, plus all nine paradox scenes sharing the two Paradox box sources. Source question timelines and nested events must not be collapsed to answer text.
- **Fractals:** carpet and buffon. Möbius-face has a short audio event whose content needs inspection.
- **Logic:** three-wisemen and eight-wisemen have lesson event sequences. Stones explicitly loads `Howmany.mp3` alongside music/effects; treat that named prompt separately from effects-only puzzles.
- **Magic:** mistic-subtraction and two-hourglasses have substantial event sequences. Mind-reading and mouse games have music/effects evidence; no spoken-narration claim is made.
- **Coloring:** coloring-cube has many language-specific root events; remaining coloring problems retain embedded audio evidence but several consist of a single identical long track across EN/RU, likely shared background audio. Do not call those narrated without listening.
- **Spatial:** calendar-cubes EN has more root sound events than its other source variant; net-choice/rearrange/find-pair use named feedback/music loads. Inspect exact tracks before treating these as narrated lessons.
- **Solids:** sphere-volume is being restored separately. Cube sections has nested feedback and an external `Swinger-Singers.mp3` load, not a root narration sequence. Tetrahedron weekdays retains one 52.422-second track identical in duration across EN/RU; semantics remain unknown.
- **Dissections:** both bills-transform sources contain the same-duration 36.023-second event. Current OriginalTimeline drawing does not play it. Content may be music rather than narration; still a real source-audio gap.

## Known effects/music, not narration by default

Literal source references establish these distinctions:

- `Shortbang`, `Boing`, `AngryMob`, `salut`, `Congrats`, and `Zvuk_kolokolchika`: feedback/effect candidates associated with correct/incorrect moves or graph controls.
- `Kidsmelody`, `Swinger-Singers`/`SwingerSingers`, `Catssing`, `Mystery`, `tzone*`: music/atmosphere candidates; names do not establish spoken teaching.
- `Catvoice` and `Mouse`: character/game sounds, not automatically narration.
- `Howmany.mp3` in Stones: explicit prompt candidate requiring listening, distinct from its Shortbang/AngryMob/salut feedback.
- Quiz `question`/`theme` and masthead `sound` are linkage IDs. Their names are not evidence of spoken questions.
- Generic embedded tracks remain content-unverified. A large or long recording is not itself narration evidence.
- Byte-identical original-file matches independently identify `sound52` in both Grandma variants as `Kidsmelody.mp3`, and `sound33` in both Coins-to-move variants plus `sound106` in Completechain as `salut.MP3`. These are stronger evidence than generic names or duration.

## Language constraints

Preserve the source language of each actual track. A Russian UI does not translate English audio. Verified bilingual source variants are listed separately below, including whitespace-sensitive `Volumeofball-proof-examples -ru.swf`. Algebra's six sources, Palmandtrig, Serp-carp-intr, Möbius-face, several kids/logic games, and other single-source activities have no Russian companion in their manifests; do not fabricate or label Russian narration. Cyclists additionally has a Chinese variant, which must not be silently treated as English/Russian.

The EN inscribed-angle source runs at **10 FPS**, its RU source at **24 FPS**; Paradox box runs at **10 FPS**. Most other educational sources run at 24 FPS. Per-source values below are authoritative; do not impose one global rate.

## Complete content-source matrix

Each row is one original SWF. `E root/nested` counts actual SWF StartSound tags (not playback repetitions); `S root/nested` counts stream blocks. Root frame count does not bound nested symbol duration. “Sequence?” marks a structural candidate (at least four root XFL cue occurrences and at least five embedded tracks), **not** a semantic narration verdict. “Other audio” includes short lessons, effects, music, linkage loads, and unresolved tracks. Exact cue names/frames and script evidence are in JSON.

| Family / activity | Source under Movies/ unless stated | FPS / root frames | E root/nested; S root/nested | Structural audio class | Current comparison |
| --- | --- | --- | --- | --- | --- |
| quiz-permutations | Mil-perm-2.swf | 15 / 81 | E 0/0; S 0/0 | Other audio | Audio gap / inspect content |
| quiz-permutations-more | Millionaire-Perm-more/millionaire.swf | 15 / 81 | E 0/0; S 0/0 | Other audio | Audio gap / inspect content |
| algebra-transformations | Algbra trans.swf | 24 / 1710 | E 10/0; S 0/0 | Sequence? | Audio gap / inspect content |
| triangles-false-proof | Alltriangles-ru.swf | 24 / 2269 | E 27/0; S 0/0 | Sequence? | Audio gap / inspect content |
| triangles-false-proof | Alltriangles.swf | 24 / 2019 | E 27/0; S 0/0 | Sequence? | Audio gap / inspect content |
| triangles-altitudes | Altitudes-ru.swf | 24 / 2720 | E 45/0; S 0/0 | Sequence? | Audio gap / inspect content |
| triangles-altitudes | Altitudes.swf | 24 / 2681 | E 45/0; S 0/0 | Sequence? | Audio gap / inspect content |
| algebra-square-of-sum | Aplusbsquare.swf | 24 / 855 | E 8/0; S 0/0 | Sequence? | Audio gap / inspect content |
| measurement-polygon | Area of polygon-ru.swf | 24 / 907 | E 4/0; S 0/0 | Sequence? | Audio gap / inspect content |
| measurement-polygon | Area of polygon.swf | 24 / 907 | E 4/0; S 0/0 | Sequence? | Audio gap / inspect content |
| measurement-area | Area-ru.swf | 24 / 2554 | E 18/0; S 0/0 | Sequence? | Audio gap / inspect content |
| measurement-area | Area.swf | 24 / 2553 | E 18/0; S 0/0 | Sequence? | Audio gap / inspect content |
| algebra-difference-of-squares | Asqminbsq.swf | 24 / 890 | E 7/0; S 0/0 | Sequence? | Audio gap / inspect content |
| reasoning-bacteria | Bacteria-ru.swf | 24 / 1282 | E 10/0; S 0/0 | Sequence? | Audio gap / inspect content |
| reasoning-bacteria | Bacteria.swf | 24 / 1053 | E 14/0; S 0/0 | Sequence? | Audio gap / inspect content |
| dissections-nine-bills | Bills-transform-ru.swf | 30 / 988 | E 1/0; S 0/0 | Other audio | Audio gap / inspect content |
| dissections-nine-bills | Bills-transform.swf | 30 / 988 | E 1/0; S 0/0 | Other audio | Audio gap / inspect content |
| escher-birdfish-animation | Birdfish-e.swf | 24 / 80 | E 0/0; S 0/0 | No audio evidence | Partial clips/effects |
| triangles-bisectors | Bisector-ru.swf | 24 / 2426 | E 38/0; S 0/0 | Sequence? | Audio gap / inspect content |
| triangles-bisectors | Bisector.swf | 24 / 2299 | E 36/0; S 0/0 | Sequence? | Audio gap / inspect content |
| reasoning-burninghouse | Burninghouse-ru.swf | 24 / 580 | E 8/0; S 0/0 | Sequence? | Audio gap / inspect content |
| reasoning-burninghouse | Burninghouse.swf | 24 / 580 | E 8/0; S 0/0 | Sequence? | Audio gap / inspect content |
| motion-cyclists | Byciclist-chi.swf | 24 / 843 | E 15/0; S 0/0 | Sequence? | Audio gap / inspect content |
| motion-cyclists | Byciclist-eng.swf | 24 / 880 | E 13/0; S 0/0 | Sequence? | Audio gap / inspect content |
| motion-cyclists | Byciclist-ru.swf | 24 / 880 | E 14/0; S 0/0 | Sequence? | Audio gap / inspect content |
| calculus-five-minutes | Calculus5min-ru-mod.swf | 24 / 10997 | E 155/0; S 0/0 | Sequence? | Audio gap / inspect content |
| calculus-five-minutes | Calculus5min.swf | 24 / 11859 | E 157/0; S 0/0 | Sequence? | Audio gap / inspect content |
| motion-caterpillar | Caterpillar-ru.swf | 24 / 1000 | E 6/0; S 0/0 | Other audio | Audio gap / inspect content |
| motion-caterpillar | Caterpillar.swf | 24 / 1000 | E 11/0; S 0/0 | Sequence? | Audio gap / inspect content |
| motion-circle-in-circle | Circincirc-ru.swf | 24 / 2 | E 0/0; S 0/0 | No audio evidence | No source audio found |
| motion-circle-in-circle | Circincirc.swf | 24 / 2 | E 0/0; S 0/0 | No audio evidence | No source audio found |
| measurement-circle | Circle-ru.swf | 24 / 2229 | E 52/0; S 0/0 | Sequence? | Audio gap / inspect content |
| measurement-circle | Circle.swf | 24 / 2178 | E 42/0; S 0/0 | Sequence? | Audio gap / inspect content |
| motion-square-coin | Coinrotate-sq-e.swf | 24 / 1190 | E 23/0; S 0/0 | Sequence? | Audio gap / inspect content |
| motion-square-coin | Coinrotate-sq-ru.swf | 24 / 1190 | E 23/0; S 0/0 | Sequence? | Audio gap / inspect content |
| motion-two-coins | Coinsrotate-2c-e.swf | 24 / 733 | E 16/0; S 0/0 | Sequence? | Audio gap / inspect content |
| motion-two-coins | Coinsrotate-2c.swf | 24 / 733 | E 15/0; S 0/0 | Sequence? | Audio gap / inspect content |
| motion-coin-cluster | Coinsrotate-e.swf | 24 / 1558 | E 24/0; S 0/0 | Sequence? | Audio gap / inspect content |
| motion-coin-cluster | Coinsrotate.swf | 24 / 1558 | E 23/0; S 0/0 | Sequence? | Audio gap / inspect content |
| logic-coins-to-move | Coinstomove-ru.swf | 24 / 45 | E 1/0; S 0/0 | Other audio | Audio gap / inspect content |
| logic-coins-to-move | Coinstomove.swf | 24 / 45 | E 1/0; S 0/0 | Other audio | Audio gap / inspect content |
| logic-complete-chain | Completechain.swf | 24 / 672 | E 13/0; S 0/0 | Other audio | Audio gap / inspect content |
| triangles-congruence | Congruence-ru.swf | 24 / 4335 | E 33/0; S 0/0 | Sequence? | Audio gap / inspect content |
| triangles-congruence | Congruence.swf | 24 / 4236 | E 30/0; S 0/0 | Sequence? | Audio gap / inspect content |
| films-conic-6x4-f | Conic-6x4-f.swf | 25 / 1856 | E 0/0; S 1856/0 | Stream film | Film audio declared |
| triangles-cosine-law | Coslaw-ru.swf | 24 / 986 | E 5/0; S 0/0 | Sequence? | Audio gap / inspect content |
| triangles-cosine-law | Coslaw.swf | 24 / 1166 | E 5/0; S 0/0 | Sequence? | Audio gap / inspect content |
| spatial-net-rearrange | Cube-Nets-2.swf | 24 / 11 | E 0/0; S 0/0 | Other audio | Audio gap / inspect content |
| spatial-net-choice | Cube-Nets.swf | 24 / 11 | E 0/0; S 0/0 | Other audio | Audio gap / inspect content |
| coloring-cube | Cube-colorproblem-ru.swf | 24 / 194 | E 16/0; S 0/0 | Sequence? | Audio gap / inspect content |
| coloring-cube | Cube-colorproblem.swf | 24 / 194 | E 16/0; S 0/0 | Sequence? | Audio gap / inspect content |
| spatial-net-choice | CubeNG-1.swf | 24 / 1 | E 0/0; S 0/0 | Other audio | Audio gap / inspect content |
| spatial-net-choice | CubeNG-2.swf | 24 / 1 | E 0/0; S 0/0 | Other audio | Audio gap / inspect content |
| spatial-net-choice | CubeNG-3.swf | 24 / 1 | E 0/0; S 0/0 | Other audio | Audio gap / inspect content |
| spatial-net-choice | CubeNG-4.swf | 24 / 1 | E 0/0; S 0/0 | Other audio | Audio gap / inspect content |
| spatial-net-choice | CubeNG-5.swf | 24 / 1 | E 0/0; S 0/0 | Other audio | Audio gap / inspect content |
| spatial-illustrated-cube | Cubeflash-text.swf | 24 / 1 | E 0/0; S 0/0 | No audio evidence | No source audio found |
| spatial-calendar-cubes | Cubeflash-white-eng.swf | 24 / 12 | E 7/0; S 0/0 | Sequence? | Audio gap / inspect content |
| spatial-calendar-cubes | Cubeflash-white.swf | 24 / 12 | E 1/0; S 0/0 | Other audio | Audio gap / inspect content |
| spatial-net-rearrange | Cubenetslide-1.swf | 24 / 1 | E 0/0; S 0/0 | Other audio | Audio gap / inspect content |
| spatial-net-rearrange | Cubenetslide-2.swf | 24 / 1 | E 0/0; S 0/0 | Other audio | Audio gap / inspect content |
| spatial-net-rearrange | Cubenetslide-3.swf | 24 / 1 | E 0/0; S 0/0 | Other audio | Audio gap / inspect content |
| spatial-net-rearrange | Cubenetslide-4.swf | 24 / 1 | E 0/0; S 0/0 | Other audio | Audio gap / inspect content |
| spatial-net-rearrange | Cubenetslide-5.swf | 24 / 1 | E 0/0; S 0/0 | Other audio | Audio gap / inspect content |
| spatial-find-pair | Cubes-findpair-ru.swf | 24 / 275 | E 0/0; S 0/0 | Other audio | Audio gap / inspect content |
| spatial-find-pair | Cubes-findpair.swf | 24 / 275 | E 4/0; S 0/0 | Other audio | Audio gap / inspect content |
| solids-cube-sections | Cubesections-ru.swf | 24 / 1248 | E 0/0; S 0/0 | Other audio | Audio gap / inspect content |
| solids-cube-sections | Cubesections.swf | 24 / 1248 | E 0/0; S 0/0 | Other audio | Audio gap / inspect content |
| spatial-eleven-nets | Cubnet3d.swf | 12 / 1 | E 0/0; S 0/0 | No audio evidence | No source audio found |
| spatial-dodecahedron | Dodecaedr-pictures-center.swf | 24 / 1 | E 0/0; S 0/0 | No audio evidence | No source audio found |
| motion-earth-belt | Earthandbelt-ru.swf | 24 / 1028 | E 7/0; S 0/0 | Sequence? | Audio gap / inspect content |
| motion-earth-belt | Earthandbelt.swf | 24 / 1028 | E 7/0; S 0/0 | Sequence? | Audio gap / inspect content |
| escher-bandf | Escher-BandF-game.swf | 24 / 261 | E 2/0; S 0/0 | Other audio | Partial clips/effects |
| escher-ball-animation | Escher-ball.swf | 24 / 80 | E 0/0; S 0/0 | No audio evidence | Partial clips/effects |
| escher-faces | Escher-faces-game.swf | 24 / 240 | E 2/0; S 0/0 | Other audio | Partial clips/effects |
| escher-hands | Escher-hands-game.swf | 24 / 240 | E 2/0; S 0/0 | Other audio | Partial clips/effects |
| escher-lizards | Escher-lizards-game.swf | 24 / 259 | E 2/0; S 0/0 | Other audio | Partial clips/effects |
| escher-reptiles-animation | Escher-reptilies.swf | 24 / 60 | E 0/0; S 0/0 | No audio evidence | Partial clips/effects |
| escher-stairbig | Escher-stairbig-game.swf | 24 / 320 | E 2/0; S 0/0 | Other audio | Partial clips/effects |
| escher-stairs | Escher-stairs-game.swf | 24 / 260 | E 3/0; S 0/0 | Other audio | Partial clips/effects |
| escher-stairways-animation | Escher-stairsbig.swf | 24 / 140 | E 0/0; S 0/0 | No audio evidence | Partial clips/effects |
| escher-waterfall | Escher-waterfall-game.swf | 24 / 279 | E 3/0; S 0/0 | Other audio | Partial clips/effects |
| falling-figure | FallingFigure.swf | 24 / 424 | E 8/0; S 0/0 | Other audio | Partial clips/effects |
| kids-find-connect | Find and connect.swf | 24 / 600 | E 14/0; S 0/0 | Other audio | Audio gap / inspect content |
| kids-find-improper | Find improper to.swf | 24 / 1870 | E 30/0; S 0/0 | Other audio | Audio gap / inspect content |
| kids-find-couple | Findcouplewithline.swf | 24 / 333 | E 9/0; S 0/0 | Other audio | Audio gap / inspect content |
| kids-find-match | Findmatchandconnect.swf | 24 / 1800 | E 42/0; S 0/0 | Other audio | Audio gap / inspect content |
| kids-find-proper | Findproper.swf | 24 / 2156 | E 57/0; S 0/0 | Sequence? | Audio gap / inspect content |
| kids-find-same | Findsamecoupleline.swf | 24 / 1140 | E 18/0; S 0/0 | Other audio | Audio gap / inspect content |
| films-funnymathmult | Funnymathmult.swf | 25 / 3357 | E 0/0; S 3357/0 | Stream film | Film audio declared |
| reasoning-grandma | Grandmaclimbes-ru.swf | 24 / 1240 | E 19/0; S 0/0 | Sequence? | Audio gap / inspect content |
| reasoning-grandma | Grandmaclimbes.swf | 24 / 1240 | E 19/0; S 0/0 | Sequence? | Audio gap / inspect content |
| calculus-graph-cosine | Graph-cosine.swf | 24 / 1 | E 0/0; S 0/0 | No audio evidence | No source audio found |
| calculus-graph-cubic | Graph-cubic.swf | 24 / 1 | E 0/0; S 0/0 | No audio evidence | No source audio found |
| calculus-graph-gaussian | Graph-gaussian.swf | 24 / 1 | E 0/0; S 0/0 | No audio evidence | No source audio found |
| calculus-graph-linear | Graph-linear.swf | 24 / 1 | E 0/0; S 0/0 | Other audio | Audio gap / inspect content |
| calculus-graph-power | Graph-power.swf | 24 / 1 | E 0/0; S 0/0 | No audio evidence | No source audio found |
| calculus-graph-sine | Graph-sine.swf | 24 / 1 | E 0/0; S 0/0 | No audio evidence | No source audio found |
| calculus-graph-sinecosine | Graph-sinecosine.swf | 24 / 1 | E 0/0; S 0/0 | No audio evidence | No source audio found |
| calculus-graph-square | Graph-square.swf | 24 / 1 | E 0/0; S 0/0 | No audio evidence | No source audio found |
| calculus-graph-tan | Graph-tan.swf | 24 / 1 | E 0/0; S 0/0 | No audio evidence | No source audio found |
| calculus-graphintro | Graphintro.swf | 24 / 3 | E 0/0; S 0/0 | Other audio | Audio gap / inspect content |
| reasoning-hand | Hand1000-ru.swf | 24 / 850 | E 7/0; S 0/0 | Sequence? | Audio gap / inspect content |
| reasoning-hand | Hand1000.swf | 24 / 850 | E 6/0; S 0/0 | Sequence? | Audio gap / inspect content |
| escher-hands-animation | Hands-escher.swf | 24 / 60 | E 0/0; S 0/0 | No audio evidence | Partial clips/effects |
| reasoning-hunter | Hunter-ru.swf | 24 / 1220 | E 14/0; S 0/0 | Sequence? | Audio gap / inspect content |
| reasoning-hunter | Hunter.swf | 24 / 1220 | E 14/0; S 0/0 | Sequence? | Audio gap / inspect content |
| triangles-inscribed-angle | Insangle-ru.swf | 24 / 2577 | E 49/0; S 0/0 | Sequence? | Audio gap / inspect content |
| triangles-inscribed-angle | Insangle.swf | 10 / 2132 | E 57/0; S 0/0 | Sequence? | Audio gap / inspect content |
| motion-kitten-ladder | Kitten and Ladder.swf | 24 / 1 | E 0/0; S 0/0 | No audio evidence | No source audio found |
| kids-kitten | Kitten.swf | 24 / 555 | E 3/0; S 0/0 | Other audio | Video, not probed |
| motion-ladder | Ladder-ru.swf | 24 / 1 | E 0/0; S 0/0 | No audio evidence | No source audio found |
| motion-ladder | Ladder.swf | 24 / 1 | E 0/0; S 0/0 | No audio evidence | No source audio found |
| books-mm-sat-101-f | MM-SAT-101-f.swf | 30 / 2 | E 0/0; S 0/0 | No audio evidence | No source audio found |
| books-mmcircles | MMCircles.swf | 30 / 2 | E 0/0; S 0/0 | No audio evidence | No source audio found |
| books-mmgrade-1-3 | MMGrade-1-3.swf | 30 / 2 | E 0/0; S 0/0 | No audio evidence | No source audio found |
| books-mathbook-satsubstit | Mathbook-SATsubstit.swf | 30 / 2 | E 0/0; S 0/0 | No audio evidence | No source audio found |
| triangles-medians | Mediana-ru.swf | 24 / 2738 | E 40/0; S 0/0 | Sequence? | Audio gap / inspect content |
| triangles-medians | Mediana.swf | 24 / 2721 | E 40/0; S 0/0 | Sequence? | Audio gap / inspect content |
| books-mightymatica-1-1 | Mightymatica-1-1.swf | 30 / 2 | E 0/0; S 0/0 | No audio evidence | No source audio found |
| books-mightymatica-1-2 | Mightymatica-1-2.swf | 30 / 2 | E 0/0; S 0/0 | No audio evidence | No source audio found |
| books-mightymatica-2-1 | Mightymatica-2-1.swf | 30 / 2 | E 0/0; S 0/0 | No audio evidence | No source audio found |
| magic-mindread | Mindread-ru.swf | 24 / 691 | E 4/0; S 0/0 | Other audio | Audio gap / inspect content |
| magic-mindread | Mindread.swf | 24 / 691 | E 4/0; S 0/0 | Other audio | Audio gap / inspect content |
| magic-mistic-subtraction | Mistic substr-ru.swf | 24 / 965 | E 6/0; S 0/0 | Sequence? | Audio gap / inspect content |
| magic-mistic-subtraction | Mistic substr.swf | 24 / 965 | E 6/0; S 0/0 | Sequence? | Audio gap / inspect content |
| films-moeb7 | Moeb7.swf | 25 / 759 | E 0/0; S 759/0 | Stream film | Audio gap / inspect content |
| fractals-mobius-face | Moebius and face.swf | 24 / 685 | E 4/0; S 0/0 | Other audio | Audio gap / inspect content |
| magic-mouse-cheese | Mouse-cheese.swf | 30 / 360 | E 3/0; S 0/0 | Other audio | Audio gap / inspect content |
| magic-mouse-cherry-oppo | Mouse-cherry-oppo.swf | 30 / 890 | E 5/0; S 0/0 | Other audio | Audio gap / inspect content |
| magic-mouse-cherry | Mouse-cherry.swf | 30 / 1048 | E 8/0; S 0/0 | Other audio | Audio gap / inspect content |
| logic-necklace | Necklace.swf | 24 / 706 | E 17/0; S 0/0 | Other audio | Audio gap / inspect content |
| spatial-octahedron | Octa-8.swf | 24 / 1 | E 0/0; S 0/0 | No audio evidence | No source audio found |
| triangles-palm-trig | Palmandtrig.swf | 24 / 3565 | E 57/0; S 0/0 | Sequence? | Audio gap / inspect content |
| reasoning: 9 activities (all mapped in JSON) | Paradox box-ru.swf | 10 / 4122 | E 31/0; S 0/0 | Sequence? | Audio gap / inspect content |
| reasoning: 9 activities (all mapped in JSON) | Paradox box.swf | 10 / 4122 | E 31/0; S 0/0 | Sequence? | Audio gap / inspect content |
| triangles-pythagoras | Pifagor-gl.swf | 24 / 2792 | E 71/0; S 0/0 | Sequence? | Audio gap / inspect content |
| triangles-pythagoras | Pifagoras Theorem - ru.swf | 24 / 3682 | E 76/0; S 0/0 | Sequence? | Audio gap / inspect content |
| stories-pinocchio | Pinoc-game.swf | 24 / 240 | E 3/0; S 0/0 | Other audio | Audio gap / inspect content |
| stories-pinocchio, films-pinoc1 | Pinoc1.swf | 24 / 379 | E 0/0; S 379/0 | Stream film | Film audio declared |
| stories-prostokvashino | Prosto-game.swf | 24 / 240 | E 3/0; S 0/0 | Other audio | Audio gap / inspect content |
| stories-prostokvashino, films-prosto5 | Prosto5.swf | 24 / 390 | E 0/0; S 390/0 | Stream film | Film audio declared |
| kids-put-place | Put in place.swf | 24 / 1190 | E 21/0; S 0/0 | Other audio | Audio gap / inspect content |
| algebra-quadratic | Quadratic eq.swf | 24 / 4288 | E 27/0; S 0/0 | Sequence? | Audio gap / inspect content |
| coloring-hexagonal-prism | Recthexprizm-colorproblem-ru.swf | 24 / 1 | E 1/0; S 0/0 | Other audio | Audio gap / inspect content |
| coloring-hexagonal-prism | Recthexprizm-colorproblem.swf | 24 / 1 | E 1/0; S 0/0 | Other audio | Audio gap / inspect content |
| logic-ripped-necklace | Rippednecklace.swf | 24 / 333 | E 9/0; S 0/0 | Other audio | Audio gap / inspect content |
| fractals-carpet | Serp-carp-intr.swf | 24 / 1144 | E 11/0; S 0/0 | Sequence? | Audio gap / inspect content |
| kids-share-color | Sharecolor-eng.swf | 24 / 1332 | E 18/0; S 0/0 | Other audio | Audio gap / inspect content |
| kids-share-shape | Shareform-eng.swf | 24 / 1332 | E 18/0; S 0/0 | Other audio | Audio gap / inspect content |
| kids-share-size | Sharesize-eng.swf | 24 / 1332 | E 18/0; S 0/0 | Other audio | Audio gap / inspect content |
| triangles-sine-law | Sinlaw-ru.swf | 24 / 784 | E 2/0; S 0/0 | Other audio | Audio gap / inspect content |
| triangles-sine-law | Sinlaw.swf | 24 / 923 | E 4/0; S 0/0 | Other audio | Audio gap / inspect content |
| escher-sliding-4 | Sliding-4.swf | 24 / 24 | E 8/0; S 0/0 | Other audio | Partial clips/effects |
| reasoning-snail | Snail-eng.swf | 24 / 1175 | E 20/0; S 0/0 | Sequence? | Audio gap / inspect content |
| reasoning-snail | Snail.swf | 24 / 1175 | E 20/0; S 0/0 | Sequence? | Audio gap / inspect content |
| stories-snow-white | Snowhite-game.swf | 24 / 703 | E 3/0; S 0/0 | Other audio | Audio gap / inspect content |
| stories-snow-white, films-snowpart-0 | Snowpart-0.swf | 24 / 104 | E 0/0; S 104/0 | Stream film | Film audio declared |
| stories-snow-white, films-snowpart-2 | Snowpart-2.swf | 24 / 510 | E 0/0; S 510/0 | Stream film | Film audio declared |
| reasoning-staruhi | Staruhi-eng.swf | 24 / 1260 | E 15/0; S 0/0 | Sequence? | Audio gap / inspect content |
| reasoning-staruhi | Staruhi.swf | 24 / 1260 | E 15/0; S 0/0 | Sequence? | Audio gap / inspect content |
| logic-count-stones | Stones.swf | 24 / 5217 | E 88/0; S 0/0 | Other audio | Audio gap / inspect content |
| algebra-sum-integers | Sum1n.swf | 24 / 1454 | E 0/0; S 0/0 | No audio evidence | No source audio found |
| algebra-sum-odds | Sum2n-1.swf | 24 / 910 | E 0/0; S 0/0 | No audio evidence | No source audio found |
| solids-tetrahedron-weekdays | Tatrahedron-ru.swf | 24 / 1 | E 1/0; S 0/0 | Other audio | Audio gap / inspect content |
| solids-tetrahedron-weekdays | Tatrahedron.swf | 24 / 1 | E 1/0; S 0/0 | Other audio | Audio gap / inspect content |
| coloring-tetrahedron | Tetra-colorproblem-ru.swf | 24 / 1 | E 1/0; S 0/0 | Other audio | Audio gap / inspect content |
| coloring-tetrahedron | Tetra-colorproblem.swf | 24 / 1 | E 1/0; S 0/0 | Other audio | Audio gap / inspect content |
| coloring-three-plane | Threecolorplane-eng.swf | 24 / 838 | E 5/0; S 0/0 | Other audio | Audio gap / inspect content |
| coloring-three-plane | Threecolorplane-ru.swf | 24 / 838 | E 5/0; S 0/0 | Other audio | Audio gap / inspect content |
| reasoning-tram | Tram-ru.swf | 24 / 1371 | E 23/0; S 0/0 | Sequence? | Audio gap / inspect content |
| reasoning-tram | Tram.swf | 24 / 1371 | E 23/0; S 0/0 | Sequence? | Audio gap / inspect content |
| triangles-trig-addition | Trig-cos-ru.swf | 24 / 1260 | E 17/0; S 0/0 | Sequence? | Audio gap / inspect content |
| triangles-trig-addition | Trig-cos.swf | 24 / 1496 | E 21/0; S 0/0 | Sequence? | Audio gap / inspect content |
| reasoning-turtles | Turtles-ru.swf | 24 / 800 | E 6/0; S 0/0 | Sequence? | Audio gap / inspect content |
| reasoning-turtles | Turtles.swf | 24 / 800 | E 4/0; S 0/0 | Sequence? | Audio gap / inspect content |
| coloring-equilateral | Twocoloreqtri-eng.swf | 24 / 1126 | E 10/0; S 0/0 | Other audio | Audio gap / inspect content |
| coloring-equilateral | Twocoloreqtri-ru.swf | 24 / 1126 | E 10/0; S 0/0 | Other audio | Audio gap / inspect content |
| coloring-two-plane | Twocolorplane-eng.swf | 24 / 651 | E 6/0; S 0/0 | Other audio | Audio gap / inspect content |
| coloring-two-plane | Twocolorplane.swf | 24 / 651 | E 3/0; S 0/0 | Other audio | Audio gap / inspect content |
| coloring-segment | Twocolorplaneseg-en.swf | 24 / 811 | E 4/0; S 0/0 | Other audio | Audio gap / inspect content |
| coloring-segment | Twocolorplaneseg-ru.swf | 24 / 811 | E 4/0; S 0/0 | Other audio | Audio gap / inspect content |
| magic-two-hourglasses | Twohourglasses-ru.swf | 24 / 1530 | E 15/0; S 0/0 | Sequence? | Audio gap / inspect content |
| magic-two-hourglasses | Twohourglasses.swf | 24 / 1530 | E 15/0; S 0/0 | Sequence? | Audio gap / inspect content |
| solids-sphere-volume | Volumeofball-proof-examples -ru.swf | 24 / 5518 | E 80/0; S 0/0 | Sequence? | Parallel restoration |
| solids-sphere-volume | Volumeofball-proof-examples.swf | 24 / 5071 | E 67/0; S 0/0 | Sequence? | Parallel restoration |
| motion-earth-walk | Walk around earth-ru.swf | 24 / 890 | E 15/0; S 0/0 | Sequence? | Audio gap / inspect content |
| motion-earth-walk | Walk around earth.swf | 24 / 890 | E 15/0; S 0/0 | Sequence? | Audio gap / inspect content |
| reasoning-wine | Wineandmilk-ru.swf | 24 / 1239 | E 8/0; S 0/0 | Sequence? | Audio gap / inspect content |
| reasoning-wine | Wineandmilk.swf | 24 / 1239 | E 8/0; S 0/0 | Sequence? | Audio gap / inspect content |
| logic-eight-wisemen | Wisemen 8-ru.swf | 24 / 1176 | E 11/0; S 0/0 | Sequence? | Audio gap / inspect content |
| logic-eight-wisemen | Wisemen 8.swf | 24 / 1137 | E 12/0; S 0/0 | Sequence? | Audio gap / inspect content |
| logic-three-wisemen | Wisemen-ru.swf | 24 / 1140 | E 13/0; S 0/0 | Sequence? | Audio gap / inspect content |
| logic-three-wisemen | Wisemen.swf | 24 / 1140 | E 12/0; S 0/0 | Sequence? | Audio gap / inspect content |
| coloring-brick | brick-colorproblem-ru.swf | 24 / 1 | E 1/0; S 0/0 | Other audio | Audio gap / inspect content |
| coloring-brick | brick-colorproblem.swf | 24 / 1 | E 1/0; S 0/0 | Other audio | Audio gap / inspect content |
| fractals-buffon | byufon-exp-ru.swf | 24 / 1 | E 0/0; S 0/0 | No audio evidence | No source audio found |
| fractals-buffon | byufon-exp.swf | 24 / 1 | E 0/0; S 0/0 | No audio evidence | No source audio found |
| fractals-buffon | byufon-ru.swf | 24 / 3823 | E 39/0; S 0/0 | Sequence? | Audio gap / inspect content |
| fractals-buffon | byufon.swf | 24 / 4214 | E 43/0; S 0/0 | Sequence? | Audio gap / inspect content |
| films-cubesec6x4-f | cubesec6x4-f.swf | 25 / 2777 | E 0/0; S 2777/0 | Stream film | Film audio declared |
| coloring-right-prism | paralele-colorproblem-ru.swf | 24 / 1 | E 1/0; S 0/0 | Other audio | Audio gap / inspect content |
| coloring-right-prism | paralele-colorproblem.swf | 24 / 1 | E 1/0; S 0/0 | Other audio | Audio gap / inspect content |

## Handoff and remaining validation

Task: `inventory-all-interactive-audio`. Only this review and the paired JSON were changed. Source archives and runtime implementations were not edited. Checks performed: parse/read all 207 source records; recursively inspect all original SWFs; scan recovered XFL/ActionScript; resolve all 203 content sources to activity IDs; inspect current audio/video/timeline code. No application checks are appropriate for this data/documentation-only slice.

Before claiming a particular lesson restored, its owner must identify spoken/music/effect tracks, preserve source question gates and nested playback, wire opt-in synchronized audio with pause/seek/restart/hidden-tab teardown, and verify that lesson's locale. Listening/transcription and interactive audiovisual verification remain outstanding. Concurrent sphere/shared-player edits may advance after this audit snapshot. No pre-existing test failure was encountered because tests were not run.

