export const symbols = ["☀", "☾", "★", "◆", "✿", "♜", "♞", "♣", "♠", "♥", "⚓", "⚑"] as const;

export function mindSymbol(number: number, round: number): string {
  return symbols[number % 9 === 0 && number >= 9 && number <= 81
    ? round % symbols.length
    : (number * 7 + round * 3 + 1) % symbols.length];
}

export function subtraction(number: number) {
  if (!Number.isInteger(number) || number < 100 || number > 999 ||
      Math.floor(number / 100) - number % 10 < 2) return null;
  const reverse = Number(String(number).split("").reverse().join(""));
  const difference = number - reverse;
  const reversedDifference = Number(String(difference).split("").reverse().join(""));
  return { reverse, difference, reversedDifference, sum: difference + reversedDifference };
}

/** Source final example timer: first update at 500 ms, twenty updates total. */
export function subtractionExampleIndex(elapsed: number): number | null {
  const index = Math.floor((elapsed + 1e-7) / .5) - 1;
  return index < 0 ? null : Math.min(19, index);
}

export interface GlassState { time: number; remaining: [number, number] }
export function flipGlass(state: GlassState, index: 0 | 1): GlassState {
  const remaining: [number, number] = [...state.remaining];
  remaining[index] = [11, 7][index] - remaining[index];
  return { ...state, remaining };
}
export function nextEmpty(state: GlassState): GlassState {
  const running = state.remaining.filter(value => value > 0);
  if (!running.length) return state;
  const delta = Math.min(...running);
  return { time: state.time + delta, remaining: [
    Math.max(0, state.remaining[0] - delta), Math.max(0, state.remaining[1] - delta),
  ] };
}
