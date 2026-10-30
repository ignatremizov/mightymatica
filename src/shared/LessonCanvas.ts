/** Keep authored vector artwork sharp without unbounded filter/backbuffer work. */
export function lessonCanvasSize(width: number, height: number, cssWidth: number, pixelRatio: number) {
  const density = Number.isFinite(pixelRatio) && pixelRatio > 0 ? pixelRatio : 1;
  const requested = Number.isFinite(cssWidth) && cssWidth > 0 ? cssWidth * density / width : 1;
  const scale = Math.min(Math.max(1, requested), 2048 / width, 2048 / height,
    Math.sqrt(2_097_152 / (width * height)));
  return { width: Math.max(1, Math.floor(width * scale)), height: Math.max(1, Math.floor(height * scale)) };
}
