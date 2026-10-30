import sourceControls from "./source-controls.json";
import sourceInteractions from "./source-interactions.json";
import type { OriginalLessonDefinition } from "../../shared/OriginalLesson";

/** Source-stage hit areas only: no replacement artwork, seeks or new stops. */
export function triangleSourceControls(title: string, language: string, lesson: OriginalLessonDefinition) {
  const source = sourceControls.find(entry => entry.key === `${title}:${language}`);
  if (!source) throw new Error("Missing reviewed triangle source controls.");
  const stopHotspots: Record<number, { x: number; y: number; width: number; height: number; sourceArtwork: true }> = {};
  const interactions = sourceInteractions[`${title}:${language}` as keyof typeof sourceInteractions];
  for (const stop of lesson.stops) {
    if (stop.kind !== "manual") continue;
    const placement = source.placements.find(entry => stop.frame >= entry.firstFrame && stop.frame <= entry.lastFrame);
    if (placement) stopHotspots[stop.frame] = { ...placement.play, sourceArtwork: true };
    const continuation = interactions?.continuation.find(entry => entry.resumeFrames.includes(stop.frame));
    if (continuation) stopHotspots[stop.frame] = { ...continuation.rect, sourceArtwork: true };
  }
  return {
    stopHotspots,
    playbackHotspots: source.placements
      .filter(placement => placement.firstFrame <= lesson.endFrame && placement.lastFrame >= lesson.initialFrame)
      .map(placement => ({
        firstFrame: Math.max(lesson.initialFrame, placement.firstFrame),
        lastFrame: Math.min(lesson.endFrame, placement.lastFrame),
        ...placement.transport,
      })),
  };
}
