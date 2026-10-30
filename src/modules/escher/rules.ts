export function solvedBoard(size: number): number[] {
  return Array.from({ length: size * size }, (_, i) => (i + 1) % (size * size));
}

export function neighbors(index: number, size: number): number[] {
  return [index - size, index + size, index - 1, index + 1].filter(
    candidate => candidate >= 0 && candidate < size * size &&
      Math.abs(Math.floor(candidate / size) - Math.floor(index / size)) +
      Math.abs(candidate % size - index % size) === 1,
  );
}

export function slide(board: readonly number[], index: number, size: number): number[] | null {
  const blank = board.indexOf(0);
  if (!neighbors(blank, size).includes(index)) return null;
  const result = [...board];
  [result[blank], result[index]] = [result[index]!, result[blank]!];
  return result;
}

/** A walk through legal moves preserves solvability, unlike a random permutation. */
export function shuffle(size: number, steps: number, random: () => number = Math.random): number[] {
  let board = solvedBoard(size);
  let previous = -1;
  for (let i = 0; i < steps; i++) {
    const blank = board.indexOf(0);
    const options = neighbors(blank, size).filter(index => index !== previous);
    const target = options[Math.min(options.length - 1, Math.floor(random() * options.length))]!;
    board = slide(board, target, size)!;
    previous = blank;
  }
  if (board.every((tile, i) => tile === solvedBoard(size)[i])) {
    board = slide(board, neighbors(board.indexOf(0), size)[0]!, size)!;
  }
  return board;
}

/** XFL scene starts, indexed by board size; AS Checkresult defines row-major goals. */
export const originalDeals: Readonly<Record<number, readonly number[]>> = {
  2: [2, 3, 1, 0],
  3: [3, 7, 4, 8, 5, 1, 6, 2, 0],
  4: [11, 15, 5, 12, 10, 2, 4, 7, 14, 8, 13, 1, 9, 6, 3, 0],
  5: [21, 15, 5, 12, 16, 10, 2, 22, 7, 4, 14, 23, 18, 1, 20, 9, 3, 24, 8, 13, 6, 11, 19, 17, 0],
};

/** Scene 4's numbered 3×3 deal differs from Scene 3's colored board. */
export function originalDeal(size: number, colors: boolean): number[] {
  return [...(size === 3 && !colors
    ? [5, 4, 7, 8, 3, 1, 6, 2, 0]
    : originalDeals[size]!)];
}

