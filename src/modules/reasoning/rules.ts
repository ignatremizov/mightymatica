/** Finger indices: thumb 0 through pinkie 4, without duplicated endpoints. */
export function fingerAt(count: number): number {
  const phase = (count - 1) % 8;
  return phase <= 4 ? phase : 8 - phase;
}
/** Half-steps: day ascent, then night descent; stop permanently at the top. */
export function snailHeight(halfStep: number): number {
  const completed = Math.min(halfStep, 17);
  return Math.min(10, Math.floor(completed / 2) + (completed % 2 ? 2 : 0));
}
export function ageTriples(product: number): [number, number, number][] {
  const result: [number, number, number][] = [];
  for (let a = 1; a * a * a <= product; a++)
    for (let b = a; a * b * b <= product; b++)
      if (product % (a * b) === 0) result.push([a, b, product / (a * b)]);
  return result;
}
/** Illustrative river y=0, A=(1,3), B=(9,2). */
export function waterRoute(stop: number): number {
  return Math.hypot(stop - 1, 3) + Math.hypot(stop - 9, 2);
}
export function mixedTransfer(wine: number, milk: number, transfer: number) {
  const wineReturned = transfer * transfer / (milk + transfer);
  const milkReturned = transfer * milk / (milk + transfer);
  return { wineInGlass: transfer - wineReturned, milkInBarrel: milkReturned };
}
