export type MeasurementLessonId = "area" | "polygon" | "circle";
export type SourceHotspot = { x: number; y: number; width: number; height: number; sourceArtwork: true };

const areaScale = .6688995361328125;
export const areaPlay: SourceHotspot = {
  x: 16.25 - 5.4 * areaScale, y: 22.95 - 3.35 * areaScale,
  width: 105.9 * areaScale, height: 40.75 * areaScale, sourceArtwork: true,
};
export const polygonPlay: SourceHotspot = { x: 16.6, y: 326, width: 105.9, height: 40.75, sourceArtwork: true };
export const circlePlay: SourceHotspot = { x: 19.05, y: 348.55, width: 90.95, height: 39.35, sourceArtwork: true };
export function circleFeedbackPlay(frame: number): SourceHotspot {
  return { x: frame === 1700 ? 466.75 : 461.7, y: frame === 1700 ? 137.75 : 151.75, width: 90.95, height: 39.35, sourceArtwork: true };
}
const span = (hit: SourceHotspot, firstFrame: number, lastFrame: number) => ({ ...hit, firstFrame, lastFrame });
const feedbackFrames = [1627, 1700, 1772, 1844, 1916, 1988, 2060, 2132];
const circleSpans = [
  span(circlePlay, 127, 1375),
  ...feedbackFrames.flatMap(frame => [
    span(circleFeedbackPlay(frame), frame, frame),
    ...(frame === 2132 ? [] : [span({
      x: 462.55, y: frame === 1700 ? 143.5 : 149.5,
      width: 90.95, height: 39.35, sourceArtwork: true,
    }, frame + 1, frame + 23)]),
  ]),
];

/** Inclusive global ranges from each source's XFL pp/Buttonp placements. */
export const measurementPlaybackHotspots = {
  area: {
    en: [[17, 1092], [1109, 1527], [1544, 2007], [2024, 2553]].map(([first, last]) => span(areaPlay, first!, last!)),
    ru: [[17, 1092], [1109, 1527], [1544, 2008], [2025, 2554]].map(([first, last]) => span(areaPlay, first!, last!)),
  },
  polygon: { en: [span(polygonPlay, 1, 903)], ru: [span(polygonPlay, 1, 904)] },
  circle: { en: circleSpans, ru: circleSpans },
};
