import test from "node:test";
import assert from "node:assert/strict";
import { createJigsawState, isJigsawComplete, jigsawGroup, moveJigsawGroup, snapJigsawGroup } from "../src/shared/JigsawGroups.ts";
import { readFileSync } from "node:fs";
import { storyPresentation } from "../src/modules/stories/presentation.ts";
import { validateOriginalLesson } from "../src/shared/OriginalLesson.ts";

test("parent story clips stop before companion films and do not duplicate their soundtrack", () => {
  for (const source of ["Pinoc-game", "Prosto-game", "Snowhite-game"]) {
    const recovered = JSON.parse(readFileSync(new URL(`../src/modules/stories/audio-${source}.json`, import.meta.url)));
    const snow = source === "Snowhite-game";
    const intro = storyPresentation(source, false, recovered);
    const victory = storyPresentation(source, true, recovered);
    validateOriginalLesson(intro);
    validateOriginalLesson(victory);
    assert.deepEqual([intro.initialFrame, intro.endFrame], snow ? [106, 169] : [1, 153]);
    assert.deepEqual([victory.initialFrame, victory.endFrame], snow ? [173, 196] : [157, 180]);
    assert.deepEqual(intro.audioCues.map(cue => cue.frame), snow ? [] : [2]);
    assert.deepEqual(victory.audioCues.map(cue => cue.frame), snow ? [173] : [157]);
    assert.equal(victory.audioAssets.some(sound => sound.soundId === 41), false);
    assert.equal(intro.audioAssets.some(sound => sound.soundId === 32), false);
  }
});

test("Pinocchio's slightly uneven authored tile coordinates join into a movable picture away from the original board", () => {
  const layout = Array.from({ length: 9 }, (_, piece) => ({
    row: Math.floor(piece / 3),
    column: piece % 3,
    homeX: [298, 416, 531][piece % 3] + (piece === 5 || piece === 8 ? 1 : 0),
    homeY: 170 + Math.floor(piece / 3) * 88,
  }));
  let state = createJigsawState(layout.map(piece => ({ x: piece.homeX - 100, y: piece.homeY - 50 })));
  for (const piece of [0, 1, 2, 3, 4, 5, 6, 7, 8]) {
    state = snapJigsawGroup(state, layout, piece, 20);
  }
  assert.equal(isJigsawComplete(state), true);
  assert.equal(jigsawGroup(state, 4).length, 9);
  const moved = moveJigsawGroup(state, 4, 17.25, -4.5);
  assert.equal(isJigsawComplete(moved), true);
  moved.positions.forEach((point, index) => {
    assert.equal(point.x, state.positions[index].x + 17.25);
    assert.equal(point.y, state.positions[index].y - 4.5);
  });
});

test("a loose story tile retains an arbitrary wrong placement and remains separate", () => {
  const layout = [
    { row: 0, column: 0, homeX: 298, homeY: 170 },
    { row: 0, column: 1, homeX: 416, homeY: 170 },
  ];
  const state = createJigsawState([{ x: 62, y: 363 }, { x: 63, y: 71 }]);
  const moved = moveJigsawGroup(state, 0, 35.5, -120.25);
  const released = snapJigsawGroup(moved, layout, 0, 20);
  assert.deepEqual(released.positions[0], { x: 97.5, y: 242.75 });
  assert.equal(jigsawGroup(released, 0).length, 1);
  assert.equal(isJigsawComplete(released), false);
});
