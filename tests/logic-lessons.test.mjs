import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { createLessonClock, advanceLessonClock, validateOriginalLesson } from "../src/shared/OriginalLesson.ts";

const lessons = JSON.parse(await readFile(new URL("../src/modules/logic/wisemen-lessons.json", import.meta.url), "utf8"));

test("Wisemen narrative playback ends at the question and cannot enter the optional hint", () => {
  for (const [name, { story, hint }] of Object.entries(lessons)) {
    validateOriginalLesson(story);
    validateOriginalLesson(hint);
    const clock = createLessonClock(story);
    assert.equal(clock.waiting?.kind, "manual", name);
    advanceLessonClock(clock, .25, story, story.endFrame, () => assert.fail("Story started without Play"));
    assert.equal(clock.frame, story.initialFrame, name);
    clock.waiting = null; // Explicit original Play, not a question-gate bypass.
    for (let step = 0; step < 250; step++) {
      advanceLessonClock(clock, .25, story, story.chapters[0].endFrame, () => {});
    }
    assert.equal(clock.complete, true, name);
    assert.equal(clock.frame, 1097, name);
    assert.equal(hint.initialFrame, 1098, name);
    assert.ok(story.chapters.every(chapter => chapter.endFrame < hint.initialFrame), name);
    advanceLessonClock(clock, .25, story, story.endFrame, () => assert.fail("Narrative entered another frame after the question"));
    assert.equal(clock.frame, 1097, name);
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
