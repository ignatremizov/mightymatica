import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  advanceLessonClock, createLessonClock, enterLessonFrame,
  lessonEnvelopeGain, lessonSegment, validateOriginalLesson,
} from "../src/shared/OriginalLesson.ts";

const lesson = {
  width: 550, height: 400, fps: 10, initialFrame: 1, endFrame: 12,
  chapters: [{ id: "one", startFrame: 1, endFrame: 6, module: "one.mjs" },
    { id: "two", startFrame: 7, endFrame: 12, module: "two.mjs" }],
  stops: [{ frame: 1, kind: "manual" }, { frame: 3, kind: "timed", delayMs: 400 },
    { frame: 8, kind: "manual" }, { frame: 12, kind: "complete" }],
  audioAssets: [], audioCues: [],
};
const advance = (clock, seconds, end = 12, events = []) => {
  while (seconds > 1e-8) {
    const step = Math.min(.05, seconds);
    advanceLessonClock(clock, step, lesson, end, (frame, elapsed) => events.push({ frame, elapsed }));
    seconds -= step;
  }
  return events;
};

test("authored timed holds freeze the picture while event narration continues", () => {
  const clock = createLessonClock(lesson);
  clock.waiting = null;
  const events = advance(clock, .4);
  assert.equal(clock.frame, 3);
  assert.ok(Math.abs(clock.hold - .2) < 1e-8);
  assert.ok(Math.abs(clock.elapsed - .4) < 1e-8);
  advance(clock, .4, 12, events);
  assert.equal(clock.frame, 5);
  assert.deepEqual(events.map(event => event.frame), [2, 3, 4, 5]);
  assert.ok(Math.abs(events[2].elapsed - .7) < 1e-8);
});

test("a manual stop cannot be skipped and a chapter load consumes no source time", () => {
  const clock = createLessonClock(lesson);
  clock.waiting = null;
  const events = advance(clock, 1, 6);
  assert.equal(clock.frame, 6);
  assert.ok(Math.abs(clock.elapsed - 1) < 1e-8);
  // The caller suspends transport while loading, then enters the next chapter.
  const time = clock.elapsed;
  enterLessonFrame(clock, 7, lesson, (frame, elapsed) => events.push({ frame, elapsed }));
  assert.equal(clock.elapsed, time);
  advance(clock, .5, 12, events);
  assert.equal(clock.frame, 8);
  assert.equal(clock.waiting.frame, 8);
  const atStop = clock.elapsed;
  advance(clock, .2);
  assert.equal(clock.frame, 8);
  assert.ok(Math.abs(clock.elapsed - atStop - .2) < 1e-8);
  clock.waiting = null;
  advance(clock, .4, 12, events);
  assert.equal(clock.frame, 12);
  assert.equal(clock.complete, true);
  assert.equal(events.filter(event => event.frame === 8).length, 1);
});

test("slow visible frames retain narration time without skipping an authored hold or question", () => {
  const clock = createLessonClock(lesson);
  clock.waiting = null;
  const events = [];
  advanceLessonClock(clock, 1.5, lesson, 12, (frame, elapsed) => events.push({ frame, elapsed }));
  assert.equal(clock.frame, 8);
  assert.equal(clock.waiting.frame, 8);
  assert.ok(Math.abs(clock.elapsed - 1.5) < 1e-8);
  assert.deepEqual(events.map(event => event.frame), [2, 3, 4, 5, 6, 7, 8]);
  assert.ok(Math.abs(events.find(event => event.frame === 4).elapsed - .7) < 1e-8);
  assert.ok(Math.abs(events.at(-1).elapsed - 1.1) < 1e-8);
  advanceLessonClock(clock, 10, lesson, 12, () => assert.fail("the question must still block playback"));
  assert.equal(clock.frame, 8);
  assert.ok(Math.abs(clock.elapsed - 11.5) < 1e-8);
});

test("source stereo envelopes use absolute sound positions, including cropped cues", () => {
  const cue = { envelope: [{ mark44: 44100, left: 0, right: 32768 },
    { mark44: 88200, left: 32768, right: 0 }] };
  assert.equal(lessonEnvelopeGain(cue, 0, "right"), 1);
  assert.equal(lessonEnvelopeGain(cue, 1.5, "left"), .5);
  assert.equal(lessonEnvelopeGain(cue, 1.5, "right"), .5);
  assert.equal(lessonEnvelopeGain(cue, 3, "left"), 1);
  assert.equal(lessonEnvelopeGain({ envelope: [] }, 2, "left"), 1);
});

test("a static correct-answer branch completes without drawing a later wrong-answer frame", () => {
  const branch = lessonSegment(lesson, 8, 8);
  validateOriginalLesson(branch);
  const clock = createLessonClock(branch);
  assert.equal(clock.complete, true);
  advanceLessonClock(clock, .1, branch, 8, () => assert.fail("must not leave the correct card"));
  assert.equal(clock.frame, 8);
});

test("a completed picture can keep its overlay clock without replaying source frames or sounds", () => {
  const branch = lessonSegment(lesson, 11, 12);
  const clock = createLessonClock(branch);
  const events = [];
  advanceLessonClock(clock, .2, branch, 12, (frame, elapsed) => events.push({ frame, elapsed }));
  assert.equal(clock.complete, true);
  const completedAt = clock.elapsed;
  advanceLessonClock(clock, 3, branch, 12, () => assert.fail("a stopped celebration must not repeat frame cues"));
  assert.equal(clock.frame, 12);
  assert.equal(clock.elapsed, completedAt + 3);
  assert.deepEqual(events.map(event => event.frame), [12]);
});

test("an out-of-order final fade remains silent rather than being sorted before its peak", () => {
  const cue = { envelope: [{ mark44: 0, left: 0, right: 0 },
    { mark44: 30000, left: 32768, right: 32768 },
    { mark44: 29912, left: 0, right: 0 }] };
  assert.equal(lessonEnvelopeGain(cue, 1, "left"), 0);
  assert.ok(lessonEnvelopeGain(cue, .5, "left") > 0);
});

test("both recovered Sphere lessons have complete bounded chapters and sound references", () => {
  const manifest = JSON.parse(readFileSync(new URL("../src/content/sphere-lesson.json", import.meta.url), "utf8"));
  for (const data of Object.values(manifest.languages)) validateOriginalLesson(data);
  const english = manifest.languages.en;
  assert.throws(() => validateOriginalLesson({ ...english,
    chapters: english.chapters.map((chapter, i) => i === 1 ? { ...chapter, startFrame: chapter.startFrame + 1 } : chapter),
  }), /chapters/);
  assert.throws(() => validateOriginalLesson({ ...english,
    audioCues: [{ ...english.audioCues[0], soundId: -1 }],
  }), /cue/);
});
