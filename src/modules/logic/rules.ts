/** Lattice coordinates: a unit y step is sqrt(3) times an x step. */
export const coinStart: ReadonlyArray<readonly [number, number]> = [
  [0, 0], [-1, 1], [1, 1], [-2, 2], [0, 2],
  [2, 2], [-3, 3], [-1, 3], [1, 3], [3, 3],
];
export const coinTargets: ReadonlyArray<readonly [number, number]> = [
  [0, 4], [-3, 1], [3, 1],
];
export const movableCoins = [0, 6, 9] as const;

/** Mirrors the source's p1/p7/p10 destination and one-occupant checks. */
export function placeCoin(placements: readonly (number | null)[], coin: number, target: number): (number | null)[] | null {
  if (!movableCoins.some((value) => value === coin) ||
      !Number.isInteger(target) || target < 0 || target >= 3 ||
      placements.length !== 10 || placements[coin] !== null ||
      placements.includes(target)) return null;
  return placements.map((value, index) => index === coin ? target : value);
}

/** Synchronous stops after a truthful public announcement of at least one dirty face. */
export function washingAtStop(dirtyFaces: number, stop: number): boolean {
  return Number.isInteger(dirtyFaces) && dirtyFaces >= 1 && dirtyFaces <= 8 &&
    Number.isInteger(stop) && stop === dirtyFaces;
}

/** Native selection counterpart of the original drop/matching checks. */
export function canMatchBead(
  family: "Completechain" | "Rippednecklace",
  selected: string,
  destination: string,
  placements: Readonly<Record<string, string>>,
): boolean {
  if (Object.hasOwn(placements, selected) || Object.values(placements).includes(destination)) return false;
  return family === "Completechain"
    ? /^[br]\d+$/.test(selected) && /^[br]\d+$/.test(destination) && selected[0] === destination[0]
    : /^nlef[1-6]$/.test(selected) && selected === destination;
}
