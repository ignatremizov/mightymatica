import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { createLessonClock, advanceLessonClock, validateOriginalLesson } from "../src/shared/OriginalLesson.ts";
import { createWisemenLesson } from "../src/modules/logic/wisemenSequence.ts";

const lessons = JSON.parse(await readFile(new URL("../src/modules/logic/wisemen-lessons.json", import.meta.url), "utf8"));

test("Wisemen waits at its question and continues the hint in the same lesson only after explicit activation", () => {
  for (const [name, parts] of Object.entries(lessons)) {
    const { story, hint } = parts;
    const lesson = createWisemenLesson(parts);
    validateOriginalLesson(lesson);
    const clock = createLessonClock(lesson);
    assert.equal(clock.waiting?.kind, "manual", name);
    advanceLessonClock(clock, .25, lesson, story.endFrame, () => assert.fail("Story started without Play"));
    assert.equal(clock.frame, story.initialFrame, name);
    clock.waiting = null; // Explicit original Play, not a question-gate bypass.
    for (let step = 0; step < 250; step++) {
      advanceLessonClock(clock, .25, lesson, story.endFrame, () => {});
    }
    assert.equal(clock.complete, false, "the question is a pause, not lesson completion");
    assert.equal(clock.frame, 1097, name);
    assert.equal(clock.waiting?.frame, 1097, name);
    assert.equal(hint.initialFrame, 1098, name);
    assert.ok(story.chapters.every(chapter => chapter.endFrame < hint.initialFrame), name);
    advanceLessonClock(clock, 30, lesson, story.endFrame, () => assert.fail("Hint started without activation"));
    assert.equal(clock.frame, 1097, name);
    const elapsed = clock.elapsed;
    clock.waiting = null; // Click the source Hint; preserve this same clock.
    const visited = [];
    advanceLessonClock(clock, .25, lesson, story.endFrame, frame => visited.push(frame));
    assert.equal(clock.frame, 1097, "load the next drawing chapter before advancing");
    assert.equal(clock.complete, false);
    advanceLessonClock(clock, 10, lesson, hint.endFrame, frame => visited.push(frame));
    assert.equal(clock.complete, true, name);
    assert.equal(clock.frame, hint.endFrame, name);
    assert.equal(visited[0], 1098, "continue from the next original frame, not a second question picture");
    assert.ok(visited.every(frame => frame > story.endFrame));
    assert.ok(clock.elapsed > elapsed);
    const restarted = createLessonClock(lesson);
    assert.equal(restarted.frame, story.initialFrame);
    assert.equal(restarted.waiting?.frame, story.initialFrame);
  }
});

test("one Wisemen player retains the original audio events and unique sound definitions across the hint", () => {
  for (const parts of Object.values(lessons)) {
    const lesson = createWisemenLesson(parts);
    assert.deepEqual(lesson.audioCues, [...parts.story.audioCues, ...parts.hint.audioCues]);
    assert.equal(new Set(lesson.audioAssets.map(sound => sound.soundId)).size, lesson.audioAssets.length);
    assert.deepEqual(lesson.chapters, [...parts.story.chapters, ...parts.hint.chapters]);
  }
});

test("Wisemen event audio stays in its source-language finite segment", async () => {
  for (const [name, parts] of Object.entries(lessons)) {
    const source = JSON.parse(await readFile(new URL(`../src/modules/logic/${name}-audio.json`, import.meta.url), "utf8"));
    for (const lesson of Object.values(parts)) {
      assert.deepEqual(lesson.audioCues, source.audioCues.filter(cue =>
        cue.frame >= lesson.chapters[0].startFrame && cue.frame <= lesson.endFrame), name);
      for (const sound of lesson.audioAssets) {
        assert.equal(sound.sha256, source.audioAssets.find(asset => asset.soundId === sound.soundId)?.sha256, name);
        assert.ok(sound.src.startsWith(`logic/native/${name}/`), name);
      }
    }
    assert.ok(source.source.includes(name.includes("eight") ? "Wisemen 8" : "Wisemen"), name);
    assert.equal(source.source.includes("-ru"), name.endsWith("-ru"), name);
  }
});
