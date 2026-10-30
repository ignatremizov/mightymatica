import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { sourceStopActions } from "../src/modules/calculus/lessonRules.ts";
import { calculusSourceControls } from "../src/modules/calculus/sourceControls.ts";
import { advanceLessonClock, createLessonClock } from "../src/shared/OriginalLesson.ts";

const controls = JSON.parse(readFileSync(new URL("../src/modules/calculus/source-controls.json", import.meta.url)));

for (const locale of ["en", "ru"]) {
  const flow = JSON.parse(readFileSync(new URL(`../src/modules/calculus/${locale}-flow.json`, import.meta.url)));
  const audio = JSON.parse(readFileSync(new URL(`../src/modules/calculus/${locale}-audio.json`, import.meta.url)));
  test(`${locale}: all 23 source questions retain four branches and wrong-answer retry`, () => {
    const actions = sourceStopActions(flow.stops, locale);
    const questions = flow.stops.filter(stop => stop.kind === "question");
    assert.equal(questions.length, 23);
    assert.equal(flow.stops.filter(stop => stop.kind === "retry").length, 23);
    for (const question of questions) {
      const choices = actions[question.frame];
      assert.deepEqual(choices.map(choice => choice.label), ["1", "2", "3", "4"]);
      const wrongFrame = question.frame + 1;
      assert.equal(choices.filter(choice => choice.targetFrame === wrongFrame).length, 3);
      const correct = choices.find(choice => choice.targetFrame !== wrongFrame);
      assert.ok(correct.targetFrame > wrongFrame);
      const retry = flow.stops.find(stop => stop.kind === "retry"
        && stop.frame > question.frame && stop.frame < correct.targetFrame);
      assert.ok(retry, `Retry screen before correct branch for ${question.frame}`);
      assert.equal(actions[retry.frame].length, 1);
      assert.equal(actions[retry.frame][0].targetFrame, question.frame);
      for (const choice of choices) {
        assert.ok(Number.isFinite(choice.hotspot.x) && Number.isFinite(choice.hotspot.y));
        assert.ok(audio.audioAssets.some(sound => sound.soundId === choice.soundId));
      }
    }
  });
  test(`${locale}: manual teaching stops do not acquire invented answer gates`, () => {
    const actions = sourceStopActions(flow.stops, locale);
    for (const stop of flow.stops.filter(stop => stop.kind === "manual")) {
      assert.equal(actions[stop.frame], undefined);
    }
  });
  test(`${locale}: all answer and retry gates use source Hit regions without changing branches or sound`, () => {
    const { actionHotspots } = calculusSourceControls(controls[locale].placements, flow.scenes, locale, flow.stops);
    const original = sourceStopActions(flow.stops, locale);
    const recovered = sourceStopActions(flow.stops, locale, actionHotspots);
    const gates = flow.stops.filter(stop => stop.kind === "question" || stop.kind === "retry");
    assert.equal(gates.length, 46);
    assert.equal(Object.keys(actionHotspots).length, 46);
    for (const stop of gates) {
      assert.equal(Object.keys(actionHotspots[stop.frame]).length, stop.actions.length);
      for (const [index, action] of recovered[stop.frame].entries()) {
        const hit = action.hotspot;
        assert.equal(hit.sourceArtwork, true);
        assert.ok([hit.x, hit.y, hit.width, hit.height].every(Number.isFinite));
        assert.ok(hit.width > 0 && hit.height > 0);
        const { hotspot: ignoredOriginal, ...branch } = original[stop.frame][index];
        const { hotspot: ignoredRecovered, ...sourceBranch } = action;
        assert.deepEqual(sourceBranch, branch);
      }
      for (const action of stop.actions) {
        const matching = controls[locale].placements.filter(placement => placement.id === action.id
          && stop.frame >= placement.startFrame && stop.frame <= placement.endFrame);
        assert.equal(matching.length, 1);
        const rect = matching[0].rect;
        assert.deepEqual(actionHotspots[stop.frame][action.id], {
          x: rect[0], y: rect[1], width: rect[2]-rect[0], height: rect[3]-rect[1], sourceArtwork: true,
        });
      }
    }
  });
  test(`${locale}: painted NEXT resumes only its four authored teaching stops and cannot pass the next question`, () => {
    const expected = locale === "en" ? [2852, 4833, 6894, 8853] : [1984, 3965, 6032, 7991];
    const { stopHotspots, stopLabels } = calculusSourceControls(controls[locale].placements, flow.scenes, locale);
    const actions = sourceStopActions(flow.stops, locale);
    assert.deepEqual(Object.keys(stopHotspots).map(Number), expected);
    assert.deepEqual(Object.keys(stopLabels).map(Number), expected);
    for (const frame of expected) {
      const placement = controls[locale].placements.find(item => item.id === "bNext" && item.resumeFrames.includes(frame));
      const hit = stopHotspots[frame];
      assert.equal(hit.sourceArtwork, true);
      assert.ok(hit.width > 0 && hit.height > 0);
      assert.ok(frame >= placement.startFrame && frame <= placement.endFrame);
      assert.equal(flow.stops.find(stop => stop.frame === frame).kind, "manual");
      assert.equal(actions[frame], undefined);
      assert.equal(stopLabels[frame], locale === "ru" ? "Дальше" : "Next");
      const firstStop = flow.stops.find(stop => stop.frame > frame);
      const next = flow.stops.find(stop => stop.frame > frame && stop.kind === "question");
      assert.ok(next);
      const definition = {
        width: audio.width, height: audio.height, fps: audio.fps,
        initialFrame: frame, endFrame: audio.frameCount, chapters: [],
        stops: flow.stops.map(stop => ({ frame: stop.frame, kind: "manual" })),
        audioAssets: [], audioCues: [],
      };
      const clock = createLessonClock(definition);
      assert.equal(clock.waiting.frame, frame);
      // Same resume semantics as the player's Continue handler: no seek/jump.
      clock.waiting = null;
      advanceLessonClock(clock, audio.frameCount / audio.fps, definition, audio.frameCount, () => {});
      assert.equal(clock.frame, firstStop.frame, "NEXT must retain even intervening teaching stops");
      while (clock.frame < next.frame) {
        assert.equal(flow.stops.find(stop => stop.frame === clock.frame).kind, "manual");
        clock.waiting = null;
        advanceLessonClock(clock, audio.frameCount / audio.fps, definition, audio.frameCount, () => {});
      }
      assert.equal(clock.frame, next.frame);
      assert.equal(clock.waiting.frame, next.frame);
      advanceLessonClock(clock, 60, definition, audio.frameCount, () => assert.fail("Question gate bypassed"));
      assert.equal(clock.frame, next.frame);
    }
    for (const stop of flow.stops.filter(stop => stop.kind === "question" || stop.kind === "retry")) {
      assert.equal(stopHotspots[stop.frame], undefined);
      assert.equal(stopLabels[stop.frame], undefined);
      assert.ok(actions[stop.frame].length > 0);
    }
  });
  test(`${locale}: painted menus select source chapters without changing question gates`, () => {
    const { playbackHotspots, navigationMenus } = calculusSourceControls(controls[locale].placements, flow.scenes, locale);
    assert.equal(navigationMenus.length, 6);
    const parts = flow.scenes.filter(scene => scene.name !== "Scene 1");
    for (const menu of navigationMenus) {
      const current = parts.find(part => menu.firstFrame >= part.startFrame && menu.lastFrame <= part.endFrame);
      assert.ok(current);
      assert.equal(menu.items.length, 5);
      assert.equal(new Set(menu.items.map(item => item.targetFrame)).size, 5);
      assert.ok(menu.items.every(item => parts.some(part => part.startFrame === item.targetFrame)
        && item.targetFrame !== current.startFrame));
    }
    for (const hit of playbackHotspots) {
      assert.ok(hit.width > 0 && hit.height > 0 && hit.firstFrame <= hit.lastFrame);
    }
    const question = flow.stops.find(stop => stop.kind === "question");
    const definition = {
      width: audio.width, height: audio.height, fps: audio.fps,
      initialFrame: question.frame, endFrame: audio.frameCount,
      chapters: [], stops: [{ frame: question.frame, kind: "manual" }],
      audioAssets: [], audioCues: [],
    };
    const clock = createLessonClock(definition);
    advanceLessonClock(clock, 20, definition, audio.frameCount);
    assert.equal(clock.frame, question.frame);
    assert.equal(clock.waiting.frame, question.frame);
  });
}
