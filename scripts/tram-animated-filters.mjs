// Exact original Tram character/effect contracts, separately verified by locale.
import { patchBoundedCharacterFilters } from "./bounded-character-filters.mjs";

export function patchTramAnimation(source, bounds, locale) {
  if (!["en", "ru"].includes(locale)) throw new Error("Unknown Tram source language.");
  return patchBoundedCharacterFilters(source, bounds, {
    marker: "// Tram animated shadows v1: bounded original poses and clocks.",
    cacheName: "_tramAnimatedFilters",
    targets: locale === "en"
      ? { sprite17: 50, sprite45: 49, sprite57: 49, sprite59: 49, sprite71: 49 }
      : { sprite17: 50, sprite45: 49, sprite56: 49, sprite58: 49, sprite66: 49 },
    shadow: [4, 4, 44, 4, [0, 0, 0, 1], false, 1, 1, false],
  });
}
