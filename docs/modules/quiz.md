# Math Olympics / permutations quizzes

## Rendering/performance review (2026-10-31)

Both `quiz-permutations` and `quiz-permutations-more` were reviewed through
`index.tsx`, `rules.ts`, `questions.json`, `useQuizMusic.ts` and the family CSS.
These two activities render event-driven semantic question/choice/feedback
markup; neither ships a generated Canvas painter or runs full-canvas text
glow/shadow loops. Their only recurring work is the finite active music owner;
selection, lifelines, answer confirmation and terminal feedback do not request
per-frame React state updates. No concrete bounded rendering defect requiring
a change was found. All questions, choices, source scoring exceptions, gates,
music transitions and feedback remain unchanged.

The combined focused logic/magic/quiz check passed 27 tests, including the quiz
question keys, defective urn handling, loss milestones and lifeline invariants.
No browser, audio listening, FPS or pixel-parity verification was performed;
integrated checks remain Main's responsibility. Manual review should retain
both full quiz flows, keyboard focus, long-question wrapping and terminal
feedback as acceptance checks.

## Source-stage presentation review

Both recovered quiz `DOMDocument.xml` files specify a white stage. Their XFL
text/vector attributes use Arial/Impact and prominent black, white and
`#ffcc00` gold artwork. The native practice interface now has a scoped white
stage, black square answer frames, Arial question text, and gold selected
answers instead of inheriting green rounded controls and cream explanation
cards. Answer options stay semantic radios, with visible keyboard focus and a
single-column narrow-screen layout. Introductory copy now explains the action;
the mathematically necessary unscored-question annotation remains in feedback.

No question strings, scoring, source answer keys or confirmation flow changed.
This source-informed layout does not reproduce the illustrated host, stage
composition or original animation. This pass used direct XFL/vector/text and
code inspection only, without browser, compiler or build execution. Manually
check both quizzes' long questions, gold selection, disabled submitted choices,
focus contrast and restart/completion at narrow widths.

Completed task: quiz family restoration.

| Activity ID | Exact original sources |
| --- | --- |
| `quiz-permutations` | `Mil-perm-2.swf`, `setup.xml` |
| `quiz-permutations-more` | `Millionaire-Perm-more/millionaire.swf`, `Millionaire-Perm-more/setup.xml` |

Both entries are **adaptations**, not frame-exact restorations. All 30 question
strings, all 120 choice strings, original answer indices and fixed order are
imported without editorial rewriting. Source XML says `Random=no`. Both SWFs'
`frame_1/DoAction.as` files are byte-identical and construct the same Question
record; `__Packages/Question.as` and `frame_3/DoAction.as` establish the one-based
answer convention, choice selection and confirmation. Frame scripts 11, 25,
36, 46, 47, 56, 57, 67, 68 and 81, plus extracted texts 9, 36 and 105,
were inspected for progression, restart, cash and lifeline behavior.

## Current native behavior and restoration gaps

Semantic radio choices, explicit confirmation, feedback, question progress,
correct-answer totals, completion and restart work without Flash. A wrong
answer ends the game; replay clears answers and lifelines. The original virtual
prize ladder, $1,000/$32,000 loss checkpoints, and post-correct-answer walk-away
option are restored. Fifty-fifty, audience polling, and a choice of Galileo or
Benjamin telephone help each work once per game. Telephone probabilities and
audience allocations follow the recovered scripts, so help is not guaranteed
to be correct. Original theme/question music is opt-in; no timer, cheques,
animated host or original timeline art is ported. The two original embedded
MP3s are copied without any new licensing claim.
The interface has Russian labels, but original question content is English;
no verified Russian source questions were found or claimed.

The question, confirmation, failure/restart and prize/lifeline sequence is now
the primary flow. The source illustrated stage, host animation, timed spoken
telephone dialogue and animated audience chart remain fidelity gaps requiring
original-art timeline work; semantic controls do not establish visual parity.
The mathematical corrections below remain explicit rather than silently
accepting defective source answers.

The source has educational defects. In each quiz question 12 has no correct
choice: with replacement the count is 512 (source key says 544); without
replacement it is 336 (source key says “All abover”). They retain the original
choices and expose that original key, but are explicitly unscored with a
mathematical explanation. Original Disney / Pinocchio trivia retains the
original answer-key scoring; a non-mathematical topic alone is not treated as
a source defect. Scores therefore cover 14 questions per quiz. The root quiz's question 7 depends on question 6;
feedback restores that context. Question 13's distinct-ball assumption is
explained rather than silently changing the wording.

## Repeatable import and verification

From the standalone project root:

```sh
node src/modules/quiz/import-questions.mjs /home/ignat/code/mightymatica-archive-2026-08-09/raw-site
node --experimental-strip-types --test tests/quiz.test.mjs
```

The narrow importer accepts this known simple XML format, decodes predefined
entities, validates keys, and rejects DTD/entity declarations; it never evaluates
source code or performs remote calls. It writes only generated `questions.json`
in this family. Original archives remain read-only.

Manual checks still needed: confirm/reveal/next with keyboard and touch, restart
before and after completion, long question wrapping on mobile, and both locale
settings. No browser verification was performed; integrated compilation and
build belong to Main.

## Original quiz music

Both original AS1 controllers use two class-linked sounds rather than root
StartSound cues. `frame_2/DoAction.as` attaches `theme` and starts it once on the
intro. `frame_3/DoAction.as` stops the prior sound, attaches `question`, and
starts it once whenever a question is entered. `frame_25/DoAction.as` restarts
directly at the question rather than replaying the intro.

Binary ExportAssets tags in **both** source variants establish
`question → sound 1` and `theme → sound 2`. This is important: the approximately
29.127-second track is question music; the approximately 18.573-second track is
the intro theme. The generic audio inventory order alone is not a naming rule.
MP3 packet-duration estimates differ slightly from these source sample lengths.
Both quiz variants contain the same two byte-identical payloads; only one copy
of each ships, under `public/media/quiz/audio/`, totaling about 264 KiB.

`useQuizMusic.ts` adapts these source events through the shared cue-only audio
owner. Music is off initially. The initial source Start quiz gate is restored;
opting into music on that intro plays theme. Starting the quiz stops theme and
starts question music; each Next question and Restart begins a fresh one-shot
question track, with no invented loop. Lifeline, selection and confirmation
actions do not restart it. Terminal results, loss, walk-away, disabling music
and unmount stop/dispose the owned sound; this terminal stop is an accessibility
and lifecycle adaptation (the original can let its one-shot music finish).
Hidden tabs suspend both the active clock and sound. Loading/error retry is
bounded to the current owner and cannot revive an abandoned question.

Both complete recovered AS1 trees were searched for `attachSound`, `loadSound`
and `new Sound`: only the theme/question bindings occur. The binary inventory
also has zero root/nested StartSound cues and only two sound definitions.
Therefore no separate lifeline, correct/incorrect, or narrated-question sound
was invented. These are original music tracks, not synthesized narration.

`audio-source.json` and `audio-more-inventory.json` preserve offline source
evidence. `build-audio.mjs` verifies both original binary linkage maps, checks
that variant hashes match, verifies the extracted MP3 hashes and writes the
small runtime-only `audio-music.json` with media-relative paths. It reads both
preservation trees without modifying them. Run with:

```sh
node src/modules/quiz/build-audio.mjs
```

Checks for this followup: the linkage/hash builder passed; its syntax check
passed; the existing six focused quiz rule tests passed. No browser, listening,
compiler, build, full suite or additional platform-behavior tests were run.
Manual checks: music is silent until opted in; intro theme switches to question
music on Start; Next/Restart replace rather than overlap sound; lifelines do not
change tracks; loss/walk-away/results stop music; hidden-tab/off/navigation
silence it; retry cannot resurrect an abandoned intro/question. Scoring,
prizes, all lifeline rules and the explicitly unscored urn remain unchanged.

## Quiz flow review

Final sharded review covered both complete fifteen-question sequences (all
thirty preserved questions and 120 choices), their metadata and primary UI.
Source evidence: both `setup.xml` files, both quiz XFL `DOMDocument.xml` stage
attributes; root frames 1, 3, 11, 25, 36, 46, 47, 56, 57, 67, 68, 81;
`DefineSprite_218/frame_23` (walk away) and `frame_40` (loss payout);
`DefineSprite_196/frame_2` (phone probabilities). The two frame-3 scripts were
compared byte-for-byte. The defective twelfth questions disable lifelines,
explain the missing correct choice before answering, and allow neutral
progression without a scored correct/incorrect result.

Focused check:
`node --experimental-strip-types --test tests/quiz.test.mjs tests/magic.test.mjs tests/magic-mouse.test.mjs`
passed 15 tests. New quiz cases protect secured loss floors, fifty-fifty
survivors, poll conservation and unreliable telephone advice. No browser,
devserver, integrated compiler or build was run. Manual acceptance should
include early/late failure and payouts, walk-away focus, all lifelines and
their restart reset, and neutral advancement through each defective urn.

The first quiz's seventh question uses “they” for the preceding question's
three boys and two girls (`raw-site/setup.xml`, questions 6–7). That context is
now visible before selecting an answer, not only in feedback. The preserved
question strings and answer keys are unchanged.

Explicitly advancing or restarting moves keyboard focus to the new question,
and completion moves it to the results paragraph. Opening an activity, selecting
an answer, and other renders do not independently move focus.
The section label also follows the selected interface language.
These changes were checked by source inspection, not browser automation.
Manual acceptance should include keyboard-only confirmation, next, restart,
and final results, checking focus and screen-reader announcements.
