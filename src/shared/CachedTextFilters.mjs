/**
 * Bounded source-resolution effects for reviewed, source-bounded drawings.
 * Generated drawing modules embed this function; it has no external runtime.
 */
export function createCachedTextFilters({ place, filters, enhanceContext, createCanvas,
  bounds, width, height, maxPixels = 2_097_152, maxEntries = 24 }) {
  const cache = new Map();
  let pixels = 0;
  const release = image => { image.width = 0; image.height = 0; };
  const dispose = () => {
    for (const entry of cache.values()) release(entry.image);
    cache.clear();
    pixels = 0;
  };
  const numberKey = value => Math.round(value * 1e7) / 1e7;
  return {
    dispose,
    draw(symbol, canvas, context, matrix, color, chain, sample = null) {
      if (sample !== null && (!Array.isArray(sample) || sample.length !== 3
        || !sample.every(Number.isFinite))) throw new Error("Invalid drawing sample.");
      // The legacy enhancer does not track native scale()/rotate() calls.
      // Read the real CTM so high-DPI root scaling cannot misplace the ink.
      const actual = context.getTransform?.();
      const parent = actual ? [actual.a, actual.b, actual.c, actual.d, actual.e, actual.f] : context._matrix;
      // Preserve sharp ordinary vectors. Only filtered bitmaps stay at the
      // authored density, rather than multiplying CPU pixel work by DPR².
      const density = Math.max(1, Math.min(canvas.width / width, canvas.height / height));
      const scale = 1 / density;
      const transform = [
        parent[0] * matrix[0] + parent[2] * matrix[1],
        parent[1] * matrix[0] + parent[3] * matrix[1],
        parent[0] * matrix[2] + parent[2] * matrix[3],
        parent[1] * matrix[2] + parent[3] * matrix[3],
        parent[0] * matrix[4] + parent[2] * matrix[5] + parent[4],
        parent[1] * matrix[4] + parent[3] * matrix[5] + parent[5],
      ].map(value => value * scale);
      const [xmin, ymin, xmax, ymax] = bounds[symbol];
      const corners = [[xmin, ymin], [xmax, ymin], [xmin, ymax], [xmax, ymax]]
        .map(([x, y]) => [transform[0] * x + transform[2] * y + transform[4],
          transform[1] * x + transform[3] * y + transform[5]]);
      let padX = 2, padY = 2; // Keep antialiased ink away from artificial edges.
      for (const [kind, ...args] of chain) {
        const quality = args[6];
        padX += Math.floor(args[0] / 2) * quality;
        padY += Math.floor(args[1] / 2) * quality;
        if (kind === "dropShadow") {
          const angle = args[2] / 180 * Math.PI;
          padX += Math.ceil(Math.abs(args[3] * Math.cos(angle))) + 1;
          padY += Math.ceil(Math.abs(args[3] * Math.sin(angle))) + 1;
        }
      }
      const left = Math.max(0, Math.floor(Math.min(...corners.map(point => point[0])) - padX));
      const top = Math.max(0, Math.floor(Math.min(...corners.map(point => point[1])) - padY));
      const right = Math.min(Math.ceil(canvas.width * scale),
        Math.ceil(Math.max(...corners.map(point => point[0])) + padX));
      const bottom = Math.min(Math.ceil(canvas.height * scale),
        Math.ceil(Math.max(...corners.map(point => point[1])) + padY));
      if (right <= left || bottom <= top) return;
      const cropWidth = right - left, cropHeight = bottom - top;
      // Local fractional placement, true edge clipping, scale, colors and
      // filter order all participate. Moving by whole pixels can reuse ink;
      // moving by a fractional pixel cannot silently reuse different coverage.
      const local = [...transform.slice(0, 4), transform[4] - left, transform[5] - top];
      const identity = [symbol, cropWidth, cropHeight, local.map(numberKey), color, chain];
      // An explicitly reviewed animated subtree must retain all three original
      // clock arguments. Never reuse a different pose, morph ratio or time.
      if (sample !== null) identity.push(sample);
      const key = JSON.stringify(identity);
      let entry = cache.get(key);
      if (entry) {
        cache.delete(key);
        cache.set(key, entry);
      } else {
        let image = createCanvas(cropWidth, cropHeight);
        const target = image.getContext("2d");
        enhanceContext(target);
        target.applyTransforms([
          parent[0] * scale, parent[1] * scale, parent[2] * scale,
          parent[3] * scale, parent[4] * scale - left, parent[5] * scale - top,
        ]);
        // Static callers retain their original zero-clock contract. Animated
        // callers require a separately verified finite subtree and bounds.
        place(symbol, canvas, target, matrix, color, 1,
          sample?.[0] ?? 0, sample?.[1] ?? 0, sample?.[2] ?? 0);
        for (const [kind, ...args] of chain) {
          image = filters[kind](image, image.getContext("2d"), ...args);
        }
        entry = { image, pixels: cropWidth * cropHeight };
        if (entry.pixels <= maxPixels) {
          cache.set(key, entry);
          pixels += entry.pixels;
          while (pixels > maxPixels || cache.size > maxEntries) {
            const oldest = cache.keys().next().value;
            const evicted = cache.get(oldest);
            cache.delete(oldest);
            pixels -= evicted.pixels;
            release(evicted.image);
          }
        }
      }
      context.save();
      try {
        context.setTransform(1, 0, 0, 1, 0, 0);
        context.drawImage(entry.image, left / scale, top / scale,
          cropWidth / scale, cropHeight / scale);
      } finally {
        context.restore();
        if (entry.pixels > maxPixels) release(entry.image);
      }
    },
  };
}
