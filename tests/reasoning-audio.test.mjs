import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { reasoningSegment } from "../src/modules/reasoning/lessonFlow.ts";
import { reasoningQuestions } from "../src/modules/reasoning/questionGate.ts";
import { advanceLessonClock, createLessonClock, validateOriginalLesson } from "../src/shared/OriginalLesson.ts";

const audio = JSON.parse(readFileSync(new URL("../src/modules/reasoning/lesson-audio.json", import.meta.url)));
const timelines = JSON.parse(readFileSync(new URL("../src/modules/reasoning/native-timelines.json", import.meta.url)));

test("all seven source-audio questions end before answer branches and correct playback excludes wrong feedback", () => {
  for (const [family, question] of Object.entries(reasoningQuestions)) {
    for (const locale of ["en", "ru"]) {
      const source = audio[family][locale];
      const native = timelines[family][locale];
      const intro = reasoningSegment(source, native.module, 1, question.frame, native.fps);
      const wrong = reasoningSegment(source, native.module, question.wrongFrame, question.solutionFrame - 1, native.fps);
      const end = family === "snail" ? 1160 : family === "bacteria" && locale === "ru" ? 1052 : native.frames;
      const correct = reasoningSegment(source, native.module, question.solutionFrame, end, native.fps);
      for (const branch of [intro, wrong, correct]) validateOriginalLesson(branch);
      assert.equal(intro.stops.at(-1).kind, "complete");
      assert.equal(intro.endFrame, question.frame);
      assert.ok(intro.audioCues.every(cue => cue.frame < question.wrongFrame));
      assert.ok(wrong.audioCues.some(cue => cue.frame === question.solutionFrame - 1));
      assert.ok(correct.audioCues.some(cue => cue.frame === question.solutionFrame));
      assert.ok(correct.audioCues.every(cue => cue.frame >= question.solutionFrame));
      assert.deepEqual(new Set(correct.audioAssets.map(sound => sound.soundId)),
        new Set(correct.audioCues.map(cue => cue.soundId)));
    }
  }
});

test("the three ungated illustrated lessons wait at their authored hint action without visiting reveal frames", () => {
  for (const [family, hint] of Object.entries({ burninghouse: 515, turtles: 722, wine: 940 })) {
    for (const locale of ["en", "ru"]) {
      const native = timelines[family][locale];
      const lesson = reasoningSegment(audio[family][locale], native.module, 1, native.frames,
        native.fps, [{ frame: hint, kind: "manual" }]);
      validateOriginalLesson(lesson);
      const clock = createLessonClock(lesson);
      const visited = [];
      for (let i = 0; i < 250; i++) advanceLessonClock(clock, .25, lesson, lesson.endFrame, frame => visited.push(frame));
      assert.equal(clock.frame, hint);
      assert.equal(clock.waiting.frame, hint);
      assert.ok(visited.every(frame => frame <= hint));
      clock.waiting = null;
      for (let i = 0; i < 250; i++) advanceLessonClock(clock, .25, lesson, lesson.endFrame, () => {});
      assert.equal(clock.frame, lesson.endFrame);
      assert.equal(clock.complete, true);
    }
  }
});

test("paradox scene audio cannot reconstruct an event from a previously selected scene", () => {
  const scenes = JSON.parse(readFileSync(new URL("../src/modules/reasoning/paradox-scenes.json", import.meta.url)));
  for (const scene of scenes) {
    for (const locale of ["en", "ru"]) {
      const lesson = reasoningSegment(audio.paradox[locale], timelines.paradox[locale].module,
        scene.first, scene.last, scene.key === "triangle" ? 10 : 24);
      validateOriginalLesson(lesson);
      assert.ok(lesson.audioCues.every(cue => cue.frame >= scene.first && cue.frame <= scene.last));
      assert.ok(lesson.audioCues.length > 0, scene.key);
    }
  }
});
