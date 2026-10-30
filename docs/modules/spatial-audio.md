# Spatial source audio

Scope: all 20 original source variants mapped by the eight spatial activities.
The preservation trees remain read-only. This review does not claim listening
verification or exact audiovisual parity.

| Sources | Source evidence | Native handling |
| --- | --- | --- |
| Cube-Nets; Cube-Nets-2 | No root/nested StartSound cues; one 5.016-second button sound definition each | Existing stage menus retained; original button transition sound is not guessed |
| CubeNG-1 through CubeNG-5 | Explicit external Shortbang, AngryMob, Congrats loads and correct/wrong handlers | Opt-in original feedback on choice; source answer gates unchanged |
| Cubenetslide-1 through Cubenetslide-5 | Same three external loads; successful swap and completion handlers | Original swap/completion feedback; no wrong-answer effect invented for an ordinary incomplete swap |
| Cubes-findpair | Root sound 18 at frames 36,96,156,216; external tzoneintro, tzone2, Shortbang, AngryMob, salut | Original root clip available with native controls; opt-in selection/wrong/final feedback; available theme has explicit playback controls |
| Cubes-findpair-ru | No embedded cues; external TZONE11, tzone2, Shortbang, AngryMob, salut | Shared feedback and available theme; no English stage recording substituted |
| Cubeflash-white-eng | Root frames 1:46+47,3:57,5:63,7:68,9:74,11:82; eight MP3 definitions including button sound 44 | Six native audiovisual scenes with exact root cues, background envelope, and separate source Next gates |
| Cubeflash-white | Root frame 1:45; two MP3 definitions including button sound 43 | Same native six-scene explanation, source Russian text and original background track; no English recordings substituted |
| Cubeflash-text; Cubnet3d; Dodecaedr-pictures-center; Octa-8 | No embedded, stream or literal script-audio evidence | No soundtrack invented |

## Evidence and bounded extraction

Read the collection audio matrix and generic recovery-tool contract; inspected
calendar `MainTimeline.as`, all six scenes' source stop/next handlers and XFL
cube-child digit symbols. Existing net/pair ActionScript supplies the feedback
event mapping. The inventory distinguishes root, nested, button and literal
script loads; XFL button-local audio is not flattened into the root clock.

Ran `scripts/recover-lesson-audio.mjs` on only three original SWFs:
Cubeflash-white-eng, Cubeflash-white and Cubes-findpair. Generated metadata and
exact embedded MP3 bytes are under `public/media/spatial/audio/`. These outputs
retain original/source and MP3 hashes, priming samples, cue trims and envelopes.
No frame rendering, transcoding, browser or source ActionScript execution was
performed.

Copied only the five actually available external originals from archived
`raw-site/Movies`: Shortbang.mp3, AngryMob.mp3, Congrats.mp3, salut.MP3 and
tzone2.mp3. `tzoneintro.mp3` and `TZONE11.MP3` were not present in the archived
file listing. They are a preservation gap; a different track is not substituted.

EN calendar background sound 47 and RU sound 45 are byte-identical:
`bf874aacf2cc01b9baede93e551da4bc72bf03fa4cd02943c748564819ec37b6`.
Both root events retain source left/right envelope levels 4252/3252. Sound
durations are measured MP3 packet durations, not a listening classification.
The six additional English events are aligned with the six explanatory scenes;
their spoken/music/effect content has not been independently listened to.

## Calendar interaction and lifecycle

`CalendarLesson.tsx` is now the primary experience. The previous numeric input
puzzle remains a collapsed optional exercise, not a replacement for the lesson.
The source asks a question without requiring a typed quiz answer, then reveals
0, 1, 2, insufficient space, and finally the shared 6/9 face through six manual
scenes at source-global frames 1,3,5,7,9,11.

Play/Pause controls audio and cube motion only: it cannot pass a source Next
gate. Hint/Next changes the source scene and visits its exact root sound cue at
the current active presentation time, preserving source event overlap and the
continuing background track. Start over resets the scene and scheduler. Sound
starts only after explicit Play. Sound failures have retry and silent-use paths.
Reduced motion disables automatic cube rotation while retaining explicit audio
playback and manual drag inspection. Hidden time is not replayed; audio pauses
while hidden and is disposed, including pending requests, on unmount/locale
change. Async activation uses an operation token so a delayed load cannot undo
Pause or Restart.

The native cube face digits follow the inspected XFL display-list order:
cube16,25,48,58,59,64,65,69,75. Native regular cube geometry, readable semantic
text and direct drag inspection replace the source's ActionScript-initialized
planes and fade masks. The old twelve-frame root alone cannot reproduce those
Timer-driven 3D transforms. This is a source-based native interactive audiovisual
lesson, not a claim to exact original perspective, text placement or fade timing.

Feedback is enabled by default by explicit user request, bounded to one audio
element per effect, and begins only in response to an interaction—not mount or
checkbox changes. It stops on reset or unmount. Pair theme playback uses explicit native controls;
the English stage-entry clip uses `LessonAudio` with the exact selected source
event, including the first event's 600/44100-second trim and asymmetric stereo
envelope. Stage audio has explicit Play/Pause/replay, pauses while hidden and is
disposed between stages. Missing intro theme and button-over/down transition
audio remain unimplemented.

## Verification

Focused spatial deterministic rules remain the appropriate unit suite. Additional
read-only checks validate the extracted files against their recorded MP3 hashes,
the six English odd-frame root events and background envelope, and identical
EN/RU background bytes. No integrated compiler, build, full suite, browser,
listening or manual audiovisual verification is claimed. Main owns integrated
checks; the user should compare the six-scene progression, pause/resume,
Next-with-audio overlap, hidden-tab behavior, every cube face and all sound
controls against the originals.
