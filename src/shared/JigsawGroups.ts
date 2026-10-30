export interface JigsawPoint {
  x: number;
  y: number;
}

export interface JigsawPiece {
  row: number;
  column: number;
  homeX: number;
  homeY: number;
}

export interface JigsawState {
  positions: readonly JigsawPoint[];
  groups: readonly number[];
}

export function createJigsawState(initialPositions: readonly JigsawPoint[]): JigsawState {
  return {
    positions: initialPositions.map(({ x, y }) => ({ x, y })),
    groups: initialPositions.map((_, index) => index),
  };
}

export function jigsawGroup(state: JigsawState, pieceIndex: number): readonly number[] {
  const group = state.groups[pieceIndex];
  if (group === undefined) return [];
  return state.groups.flatMap((candidate, index) => candidate === group ? [index] : []);
}

export function moveJigsawGroup(
  state: JigsawState,
  pieceIndex: number,
  dx: number,
  dy: number,
): JigsawState {
  const group = state.groups[pieceIndex];
  if (group === undefined || !Number.isFinite(dx) || !Number.isFinite(dy)) return state;
  return {
    positions: state.positions.map((position, index) =>
      state.groups[index] === group
        ? { x: position.x + dx, y: position.y + dy }
        : position),
    groups: state.groups,
  };
}

/**
 * Join original edge-neighbours by their relative solved offsets, anywhere on
 * the stage. Each join translates the moving group, never individual members.
 * Layout and positions use matching indices and the same coordinate units.
 */
export function snapJigsawGroup(
  state: JigsawState,
  layout: readonly JigsawPiece[],
  pieceIndex: number,
  tolerance: number,
): JigsawState {
  if (state.groups[pieceIndex] === undefined || layout.length !== state.positions.length
    || !Number.isFinite(tolerance) || tolerance < 0) return state;

  let result = state;
  // Every successful pass removes one group, so cascades are bounded.
  for (let pass = 0; pass < layout.length - 1; pass += 1) {
    const movingGroup = result.groups[pieceIndex];
    let best: { dx: number; dy: number; distance: number; targetGroup: number } | undefined;
    for (let source = 0; source < layout.length; source += 1) {
      if (result.groups[source] !== movingGroup) continue;
      for (let target = 0; target < layout.length; target += 1) {
        if (result.groups[target] === movingGroup) continue;
        const a = layout[source]!;
        const b = layout[target]!;
        if (Math.abs(a.row - b.row) + Math.abs(a.column - b.column) !== 1) continue;
        const dx = result.positions[target]!.x - result.positions[source]!.x - (b.homeX - a.homeX);
        const dy = result.positions[target]!.y - result.positions[source]!.y - (b.homeY - a.homeY);
        const distance = Math.hypot(dx, dy);
        // Strict comparison keeps index-order ties deterministic.
        if (distance <= tolerance && (!best || distance < best.distance)) {
          best = { dx, dy, distance, targetGroup: result.groups[target]! };
        }
      }
    }
    if (!best) break;
    const moved = moveJigsawGroup(result, pieceIndex, best.dx, best.dy);
    const canonical = Math.min(movingGroup!, best.targetGroup);
    result = {
      positions: moved.positions,
      groups: moved.groups.map((group) =>
        group === movingGroup || group === best.targetGroup ? canonical : group),
    };
  }
  return result;
}

export function isJigsawComplete(state: JigsawState): boolean {
  return state.groups.length > 0 && state.groups.every((group) => group === state.groups[0]);
}
