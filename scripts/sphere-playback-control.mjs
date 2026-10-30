import { patchReviewedPlaybackControl } from "./reviewed-playback-control.mjs";

/** Only the recovered Sphere transport sprites are stateful; this is not an AS interpreter. */
export function patchSpherePlaybackControl(source, locale) {
  if (locale !== "en" && locale !== "ru") throw new Error("Expected the reviewed English or Russian Sphere source.");
  return patchReviewedPlaybackControl(source, {
    spriteNames: [locale === "en" ? "sprite32" : "sprite40"],
    stateName: "spherePlaybackPlaying",
    marker: "// Sphere playback control v1: source pp_11/pp_12 follow native transport.\n",
  });
}
