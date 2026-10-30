interface Rectangle {
  x: number;
  y: number;
  width: number;
  height: number;
}
export type CalculusActionHotspots = Readonly<Record<number, Readonly<Record<string, Rectangle & { sourceArtwork: true }>>>>;
interface Placement {
  id: string;
  startFrame: number;
  endFrame: number;
  rect?: readonly number[];
  rects?: { play: readonly number[]; pause: readonly number[] };
  target?: { scene: string; frame: number };
  resumeFrames?: readonly number[];
}
interface Scene {
  name: string;
  startFrame: number;
}
interface NavigationMenu {
  firstFrame: number;
  lastFrame: number;
  items: { label: string; targetFrame: number; x: number; y: number; width: number; height: number }[];
}
const rectangle = (bounds: readonly number[]): Rectangle => ({
  x: bounds[0]!, y: bounds[1]!,
  width: bounds[2]! - bounds[0]!, height: bounds[3]! - bounds[1]!,
});

/** Source menu jumps are separate from gated question/answer transitions. */
export function calculusSourceControls(placements: readonly Placement[], scenes: readonly Scene[], locale: "en" | "ru",
  stops: readonly { frame: number; actions: readonly { id: string }[] }[] = []) {
  const navigationMenus: NavigationMenu[] = [];
  const playbackHotspots: (Rectangle & { firstFrame: number; lastFrame: number })[] = [];
  const stopHotspots: Record<number, Rectangle & { sourceArtwork: true }> = {};
  const stopLabels: Record<number, string> = {};
  const actionHotspots: Record<number, Record<string, Rectangle & { sourceArtwork: true }>> = {};
  for (const placement of placements) {
    if (/^(bQuiz[1-4]|bWrongAns)$/.test(placement.id)) {
      if (!placement.rect) continue;
      for (const stop of stops) {
        if (stop.frame < placement.startFrame || stop.frame > placement.endFrame
          || !stop.actions.some(action => action.id === placement.id)) continue;
        const hits = actionHotspots[stop.frame] ??= {};
        if (hits[placement.id]) throw new Error("Overlapping source Calculus answer placements.");
        hits[placement.id] = { ...rectangle(placement.rect), sourceArtwork: true };
      }
      continue;
    }
    if (placement.id === "bNext") {
      for (const frame of placement.resumeFrames ?? []) {
        if (!placement.rect || frame < placement.startFrame || frame > placement.endFrame) continue;
        stopHotspots[frame] = { ...rectangle(placement.rect), sourceArtwork: true };
        stopLabels[frame] = locale === "ru" ? "Дальше" : "Next";
      }
      continue;
    }
    if (placement.id === "pp" && placement.rects) {
      const { play, pause } = placement.rects;
      playbackHotspots.push({
        firstFrame: placement.startFrame, lastFrame: placement.endFrame,
        ...rectangle([
          Math.min(play[0]!, pause[0]!), Math.min(play[1]!, pause[1]!),
          Math.max(play[2]!, pause[2]!), Math.max(play[3]!, pause[3]!),
        ]),
      });
      continue;
    }
    if (!placement.target || !placement.rect) continue;
    // The Part 2 quiz handler names "7" instead of "Scene 7" in both
    // originals. Resolve that one documented menu typo, not arbitrary scenes.
    const destination = placement.id === "bQuiz" && placement.target.scene === "7"
      ? "Scene 7" : placement.target.scene;
    const scene = scenes.find(entry => entry.name === destination);
    if (!scene) throw new Error("Unknown source Calculus menu destination.");
    let menu = navigationMenus.find(entry => entry.firstFrame === placement.startFrame && entry.lastFrame === placement.endFrame);
    if (!menu) {
      menu = { firstFrame: placement.startFrame, lastFrame: placement.endFrame, items: [] };
      navigationMenus.push(menu);
    }
    menu.items.push({
      label: placement.id === "bQuiz" ? (locale === "ru" ? "Тест" : "Quiz")
        : `${locale === "ru" ? "Часть" : "Part"} ${placement.id.slice(-1)}`,
      targetFrame: scene.startFrame + placement.target.frame - 1,
      ...rectangle(placement.rect),
    });
  }
  for (const menu of navigationMenus) menu.items.sort((a, b) => a.y - b.y);
  return { playbackHotspots, navigationMenus, stopHotspots, stopLabels, actionHotspots };
}
