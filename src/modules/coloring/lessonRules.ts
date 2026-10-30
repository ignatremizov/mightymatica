// Global one-based source frames. The second scene starts at global 91.
export function cubeLessonStops(locale: "en" | "ru") {
  const holds = [
    [91, 2500], [92, 3000], [93, 4000], [94, locale === "ru" ? 6000 : 5000],
    [95, 4000], [96, 4000], [97, 4000], [98, 5000],
    [159, 10000], [160, 3000], [161, 5000], [162, 3000], [163, 4500],
    // Initial 45 ticks, then four 20-tick holds and three 45-tick turns.
    [164, 26000], [165, locale === "ru" ? 3000 : 6000], [166, 15000],
  ];
  return [
    { frame: 1, kind: "manual" },
    ...holds.map(([frame, delayMs]) => ({ frame: frame!, kind: "timed", delayMs: delayMs! })),
    { frame: 167, kind: "complete" },
  ];
}

export function coloringHintFrame(id: string): number {
  return id === "coloring-three-plane" ? 347 : 321;
}

/** DefineButtonSoundTag's over-to-down sound, not a guessed root cue. */
export function coloringHintSound(id: string, locale: "en" | "ru"): number {
  if (id === "coloring-three-plane") return locale === "ru" ? 30 : 31;
  if (id === "coloring-two-plane") return locale === "ru" ? 29 : 31;
  return locale === "ru" ? 29 : 30;
}
