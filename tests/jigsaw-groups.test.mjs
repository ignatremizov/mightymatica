import assert from 'node:assert/strict';
import test from 'node:test';
import {
  createJigsawState, isJigsawComplete, jigsawGroup, moveJigsawGroup, snapJigsawGroup,
} from '../src/shared/JigsawGroups.ts';

const row = Array.from({ length: 4 }, (_, column) => ({
  row: 0, column, homeX: column * 10, homeY: 0,
}));
const points = (...xs) => xs.map((x) => ({ x, y: 100 }));

test('loose pieces retain arbitrary wrong positions without joining or board anchoring', () => {
  const state = createJigsawState(points(400, 900));
  assert.equal(snapJigsawGroup(state, row.slice(0, 2), 0, 3), state);
  assert.equal(isJigsawComplete(state), false);
});

test('relative neighbours join far from the original picture origin', () => {
  const state = createJigsawState([{ x: 400, y: -200 }, { x: 412, y: -199 }]);
  const snapped = snapJigsawGroup(state, row.slice(0, 2), 0, 3);
  assert.deepEqual(snapped.positions, [{ x: 402, y: -199 }, { x: 412, y: -199 }]);
  assert.deepEqual(snapped.groups, [0, 0]);
  assert.equal(isJigsawComplete(snapped), true);
});

test('dragging either member translates the entire joined group without splitting it', () => {
  const state = snapJigsawGroup(createJigsawState(points(400, 410)), row.slice(0, 2), 1, 0);
  for (const member of [0, 1]) {
    const moved = moveJigsawGroup(state, member, -25, 12);
    assert.deepEqual(moved.positions, [{ x: 375, y: 112 }, { x: 385, y: 112 }]);
    assert.deepEqual(jigsawGroup(moved, member), [0, 1]);
    assert.equal(isJigsawComplete(moved), true);
  }
});

test('a newly joined neighbour exposes further neighbours for bounded chain joins', () => {
  const state = createJigsawState(points(400, 411, 422, 433));
  const result = snapJigsawGroup(state, row, 0, 1);
  assert.deepEqual(result.positions, points(403, 413, 423, 433));
  assert.deepEqual(result.groups, [0, 0, 0, 0]);
  assert.equal(isJigsawComplete(result), true);
});

test('whole groups snap together and preserve every existing relative offset', () => {
  let state = createJigsawState(points(400, 410, 423, 433));
  state = snapJigsawGroup(state, row, 0, 0);
  state = snapJigsawGroup(state, row, 3, 0);
  assert.deepEqual(state.groups, [0, 0, 2, 2]);
  const result = snapJigsawGroup(state, row, 1, 3);
  assert.deepEqual(result.positions, points(403, 413, 423, 433));
  assert.deepEqual(jigsawGroup(result, 3), [0, 1, 2, 3]);
});

test('diagonal and non-neighbour pieces never join despite perfect relative alignment', () => {
  for (const second of [
    { row: 1, column: 1, homeX: 10, homeY: 10 },
    { row: 0, column: 2, homeX: 20, homeY: 0 },
  ]) {
    const layout = [row[0], second];
    const state = createJigsawState([
      { x: 400, y: 100 }, { x: 400 + second.homeX, y: 100 + second.homeY },
    ]);
    assert.equal(snapJigsawGroup(state, layout, 0, 10), state);
  }
});

test('snap tolerance is Euclidean and includes its exact boundary', () => {
  const state = createJigsawState([{ x: 400, y: 100 }, { x: 413, y: 104 }]);
  assert.equal(snapJigsawGroup(state, row.slice(0, 2), 0, 4.99), state);
  assert.equal(isJigsawComplete(snapJigsawGroup(state, row.slice(0, 2), 0, 5)), true);
});

test('smallest correction wins; equal corrections use stable source and target order', () => {
  const layout = [row[0], row[1], { row: 1, column: 0, homeX: 0, homeY: 10 }];
  for (const [rightX, belowX, tolerance, expected] of [
    [407, 402, 2, [0, 1, 0]],
    [409, 401, 1, [0, 0, 2]],
  ]) {
    const state = createJigsawState([
      { x: 400, y: 100 }, { x: rightX, y: 100 }, { x: belowX, y: 110 },
    ]);
    // Opposite corrections ensure that the unchosen neighbour is then too far.
    assert.deepEqual(snapJigsawGroup(state, layout, 0, tolerance).groups, expected);
  }
});

test('vertical neighbours support irregular original piece registration coordinates', () => {
  const layout = [
    { row: 0, column: 0, homeX: 17, homeY: 23 },
    { row: 1, column: 0, homeX: 21, homeY: 111 },
  ];
  const state = createJigsawState([{ x: 300, y: 400 }, { x: 305, y: 490 }]);
  const result = snapJigsawGroup(state, layout, 1, 3);
  assert.deepEqual(result.positions, [{ x: 300, y: 400 }, { x: 304, y: 488 }]);
  assert.equal(isJigsawComplete(result), true);
});

test('creation, moves, and snaps leave caller-owned inputs and prior states unchanged', () => {
  const initial = points(400, 412);
  const state = createJigsawState(initial);
  initial[0].x = -999;
  const before = structuredClone(state);
  Object.freeze(state);
  state.positions.forEach(Object.freeze);
  Object.freeze(state.positions);
  Object.freeze(state.groups);
  moveJigsawGroup(state, 0, 1, 2);
  snapJigsawGroup(state, row.slice(0, 2), 0, 2);
  assert.deepEqual(state, before);
});

test('completion requires a nonempty connected group, including a single-piece puzzle', () => {
  assert.equal(isJigsawComplete(createJigsawState([])), false);
  assert.equal(isJigsawComplete(createJigsawState(points(777))), true);
  assert.deepEqual(jigsawGroup(createJigsawState(points(1)), 4), []);
});
