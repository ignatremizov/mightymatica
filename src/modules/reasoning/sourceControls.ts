import data from "./source-controls.json";
import type { OriginalLessonPlayerProps } from "../../shared/OriginalLessonPlayer";
import type { Locale } from "../../shared/contracts";

type Controls = Pick<OriginalLessonPlayerProps, "playbackHotspots" | "stopHotspots">;
const variants: Readonly<Record<string, Controls>> = data;

/** Stable source-derived hit areas; they never authorize an answer transition. */
export function reasoningSourceControls(family: string, locale: Locale): Controls {
  return variants[`${family}:${locale}`] ?? {};
}
