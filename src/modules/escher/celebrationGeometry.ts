/** Source rectangles are [left, top, right, bottom] in authored stage units. */
export function celebrationViewport(
  frame: number,
  viewports: { transition: readonly (readonly number[])[]; celebration: readonly number[] },
  width: number,
  height: number,
): { x: number; y: number; width: number; height: number } {
  const rect = frame < 181 ? viewports.transition[Math.max(0, frame - 157)]! : viewports.celebration;
  const left = Math.max(0, Math.min(width, rect[0]!));
  const top = Math.max(0, Math.min(height, rect[1]!));
  const right = Math.max(left, Math.min(width, rect[2]!));
  const bottom = Math.max(top, Math.min(height, rect[3]!));
  return { x: left, y: top, width: right - left, height: bottom - top };
}
