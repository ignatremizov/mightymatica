import { patchReviewedPlaybackControl } from "./reviewed-playback-control.mjs";

const sprites = {
  area: { en: ["sprite15"], ru: ["sprite15", "sprite114"] },
  polygon: { en: ["sprite16"], ru: ["sprite16"] },
  circle: { en: ["sprite21", "sprite195"], ru: ["sprite21", "sprite176"] },
};

export function patchMeasurementPlaybackControl(source, id, locale) {
  const spriteNames = (locale === "en" || locale === "ru") && Object.hasOwn(sprites, id) && sprites[id][locale];
  if (!spriteNames) throw new Error("Expected a reviewed measurement lesson and language.");
  return patchReviewedPlaybackControl(source, {
    spriteNames,
    stateName: "measurementPlaybackPlaying",
    marker: "// Measurement playback control v1: reviewed source pp sprites follow native transport.\n",
  });
}
