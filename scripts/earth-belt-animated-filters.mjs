// Exact reviewed Earthandbelt contract; the artwork proof is shared with Tram.
import { patchBoundedCharacterFilters } from "./bounded-character-filters.mjs";

export function patchEarthBeltAnimation(source, bounds) {
  const result = patchBoundedCharacterFilters(source, bounds, {
    marker: "// Earth-belt animated shadow v1: bounded original poses and clock.",
    cacheName: "_earthBeltAnimatedFilters",
    targets: { sprite57: 49 },
    shadow: [5, 5, 44, 5, [0, 0, 0, 1], false, 1, 1, false],
  });
  return { ...result, bounds: result.bounds.sprite57, poseBounds: result.poseBounds.sprite57 };
}
