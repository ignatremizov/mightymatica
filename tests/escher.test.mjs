import test from "node:test";
import assert from "node:assert/strict";
import { neighbors, originalDeal, originalDeals, shuffle, slide, solvedBoard } from "../src/modules/escher/rules.ts";
import { readFileSync } from "node:fs";
import { escherPresentation } from "../src/modules/escher/presentation.ts";
import { validateOriginalLesson } from "../src/shared/OriginalLesson.ts";
import { celebrationViewport } from "../src/modules/escher/celebrationGeometry.ts";

test("in-place celebrations use source artwork viewports, including the clipped Faces zoom", () => {
  const viewports = JSON.parse(readFileSync(new URL("../src/modules/escher/celebration-viewports.json", import.meta.url)));
  for (const [key, source] of Object.entries(viewports)) {
    assert.equal(source.transition.length, 24);
    const height = key === "waterfall" ? 550 : 420;
    for (let frame = 157; frame <= 181; frame++) {
      const crop = celebrationViewport(frame, source, 600, height);
      assert.ok(crop.width > 0 && crop.height > 0);
      assert.ok(crop.x >= 0 && crop.y >= 0);
      assert.ok(crop.x + crop.width <= 600 && crop.y + crop.height <= height);
    }
    assert.deepEqual(celebrationViewport(182, source, 600, height), celebrationViewport(181, source, 600, height));
  }
  const face = celebrationViewport(180, viewports.faces, 600, 420);
  assert.equal(face.x, 0);
  assert.equal(face.y, 0);
});

test("Escher presentations retain source sound cues without bypassing the picture gate", () => {
  for (const artwork of ["BandF", "faces", "hands", "lizards", "stairbig", "stairs", "waterfall"]) {
    const recovered = JSON.parse(readFileSync(new URL(`../src/modules/escher/audio-${artwork}.json`, import.meta.url)));
    const intro = escherPresentation(artwork, false, recovered);
    const victory = escherPresentation(artwork, true, recovered);
    validateOriginalLesson(intro);
    validateOriginalLesson(victory);
    assert.equal(intro.endFrame, 153);
    assert.deepEqual(intro.audioCues.map(cue => cue.frame), [2]);
    assert.equal(victory.initialFrame, 157);
    assert.deepEqual(victory.audioCues.map(cue => cue.frame),
      artwork === "stairs" || artwork === "waterfall" ? [157, 181] : [157]);
    for (const cue of [...intro.audioCues, ...victory.audioCues]) {
      assert.deepEqual(cue, recovered.audioCues.find(source => source.frame === cue.frame));
    }
    if (artwork === "faces") assert.equal(victory.endFrame, 181);
    if (artwork === "stairs") assert.equal(victory.endFrame, 259);
    if (artwork === "lizards") assert.equal(victory.endFrame, 240);
  }
});

test("colored and numbered three-by-three boards retain their separate source deals", () => {
  assert.deepEqual(originalDeal(3, true), [3, 7, 4, 8, 5, 1, 6, 2, 0]);
  assert.deepEqual(originalDeal(3, false), [5, 4, 7, 8, 3, 1, 6, 2, 0]);
  for (const size of [2, 4, 5]) {
    assert.deepEqual(originalDeal(size, true), originalDeal(size, false));
  }
  const deal = originalDeal(3, false);
  deal[0] = 0;
  assert.equal(originalDeal(3, false)[0], 5);
});

test("all preserved original starting arrangements are legally solvable", () => {
  for (const [key, board] of Object.entries(originalDeals)) {
    const size = Number(key);
    assert.deepEqual([...board].sort((a, b) => a - b), Array.from({ length: size * size }, (_, i) => i));
    const numbered = board.filter(Boolean);
    let inversions = 0;
    numbered.forEach((value, i) => {
      for (let j = i + 1; j < numbered.length; j++) if (numbered[j] < value) inversions++;
    });
    const blankFromBottom = size - Math.floor(board.indexOf(0) / size);
    assert.equal(size % 2 ? inversions % 2 : (inversions + blankFromBottom) % 2, size % 2 ? 0 : 1);
  }
});

test("a slide cannot wrap a row or move diagonally", () => {
  const board = [1, 2, 3, 0, 4, 5, 6, 7, 8];
  assert.equal(slide(board, 2, 3), null);
  assert.equal(slide(board, 1, 3), null);
  assert.deepEqual(slide(board, 4, 3), [1, 2, 3, 4, 0, 5, 6, 7, 8]);
  assert.deepEqual(board, [1, 2, 3, 0, 4, 5, 6, 7, 8]);
});

test("every shuffle can be undone using only legal neighboring slides", () => {
  for (const size of [2, 3, 4, 5]) {
    const choices = [];
    let seed = 17;
    const random = () => {
      seed = (seed * 16807) % 2147483647;
      const result = seed / 2147483647;
      choices.push(result);
      return result;
    };
    let replay = solvedBoard(size);
    let previous = -1;
    const history = [];
    const shuffled = shuffle(size, 73, random);
    for (const choice of choices) {
      const blank = replay.indexOf(0);
      const options = neighbors(blank, size).filter(index => index !== previous);
      history.push(blank);
      replay = slide(replay, options[Math.floor(choice * options.length)], size);
      previous = blank;
    }
    if (replay.every((value, index) => value === solvedBoard(size)[index])) {
      const blank = replay.indexOf(0);
      history.push(blank);
      replay = slide(replay, neighbors(blank, size)[0], size);
    }
    assert.deepEqual(shuffled, replay);
    assert.notDeepEqual(shuffled, solvedBoard(size));
    for (const position of history.reverse()) replay = slide(replay, position, size);
    assert.deepEqual(replay, solvedBoard(size));
  }
});
