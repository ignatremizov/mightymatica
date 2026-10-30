import { patchReviewedPlaybackControl } from "./reviewed-playback-control.mjs";

/** Reviewed pp_26 / pp_9 only; the remaining lesson animation stays time-driven. */
export function patchCalculusPlaybackControl(source, locale) {
  if (locale !== "en" && locale !== "ru") throw new Error("Expected reviewed English or Russian Calculus source.");
  return patchReviewedPlaybackControl(source, {
    spriteNames: [locale === "en" ? "sprite190" : "sprite117"],
    stateName: "calculusPlaybackPlaying",
    marker: "// Calculus playback control v1: source pp follows native transport.\n",
  });
}
