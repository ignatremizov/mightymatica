import { mediaUrl, t, type ActivityProps } from "../../shared/contracts";
import OriginalTimeline from "../../shared/OriginalTimeline";
import type { Timeline } from "./timelines";

/** Native Canvas playback of the original exported vector timeline. */
export default function TimelinePlayer({ timeline, locale, reducedMotion }: ActivityProps & { timeline: Timeline }) {
  return <div className="activity-layout escher-activity">
    <OriginalTimeline moduleUrl={mediaUrl(`escher/canvas/${timeline.source}.mjs`)}
      startFrame={1} endFrame={timeline.frames} fps={timeline.fps}
      locale={locale} reducedMotion={reducedMotion}
      presentation="loop"
      label={t(locale, "Original animated Escher composition", "Оригинальная анимированная композиция Эшера")} />
    <p className="activity-note">{t(locale, "Artwork: M. C. Escher", "Картина: М. К. Эшер")}</p>
  </div>;
}
