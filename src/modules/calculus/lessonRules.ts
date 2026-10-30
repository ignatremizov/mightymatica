import type { CalculusActionHotspots } from "./sourceControls";

export interface SourceAction {
  id: string;
  targetFrame: number;
  x?: number;
  y?: number;
  buttonSound?: { soundId: number; inPoint44: number; outPoint44: number | null } | null;
}
export interface SourceStop {
  frame: number;
  kind: string;
  actions: readonly SourceAction[];
}

/** Only source-declared branches may leave a question or its retry screen. */
export function sourceStopActions(stops: readonly SourceStop[], locale: "en" | "ru", actionHotspots: CalculusActionHotspots = {}) {
  return Object.fromEntries(stops.filter(stop => stop.actions.length).map(stop => [
    stop.frame,
    [...stop.actions].sort((a, b) => a.id.localeCompare(b.id)).map(action => ({
      label: action.id === "bWrongAns" ? (locale === "ru" ? "Ещё раз" : "Try again") : action.id.slice(-1),
      targetFrame: action.targetFrame,
      ...(action.buttonSound && action.buttonSound.inPoint44 === 0 && action.buttonSound.outPoint44 === null
        ? { soundId: action.buttonSound.soundId } : {}),
      ...(actionHotspots[stop.frame]?.[action.id] ? {
        hotspot: actionHotspots[stop.frame]![action.id]!,
      } : action.x !== undefined && action.y !== undefined ? {
        hotspot: { x: action.x, y: action.y, width: action.id === "bWrongAns" ? 285 : 34, height: 32 },
      } : {}),
    })),
  ]));
}

