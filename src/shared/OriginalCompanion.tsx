import { useEffect, useRef } from "react";
import { useAnimation } from "./useAnimation";

/** Authored Pifagor-silent atlas rectangles; the remaining 20 frames hold #49. */
const frames: readonly (readonly [number, number, number])[] = [
  [0,0,113],[113,0,114],[227,0,114],[341,0,114],[455,0,114],[569,0,114],[683,0,114],[797,0,113],[910,0,113],
  [0,132,113],[113,132,113],[226,132,113],[339,132,113],[452,132,114],[566,132,114],[680,132,114],[794,132,114],[908,132,115],
  [0,264,115],[115,264,114],[229,264,114],[343,264,114],[457,264,115],[572,264,114],[686,264,114],[800,264,113],
  [0,396,114],[114,396,114],[228,396,114],[342,396,115],[457,396,115],[572,396,115],[687,396,114],[801,396,114],
  [0,528,114],[114,528,114],[228,528,115],[343,528,115],[458,528,115],[573,528,115],[688,528,115],[803,528,114],
  [0,660,114],[114,660,114],[228,660,114],[342,660,114],[456,660,115],[571,660,114],[685,660,114],[799,660,114],
];

export interface OriginalCompanionProps {
  playing?: boolean;
  reducedMotion: boolean;
  label?: string;
}

/** Original silent idle only: this does not emulate the Flash talking states. */
export function OriginalCompanion({
  playing = true,
  reducedMotion,
  label = "Pythagoras",
}: OriginalCompanionProps) {
  const image = useRef<SVGImageElement>(null);
  const lastFrame = useRef(-1);
  const draw = (index: number) => {
    if (!image.current || lastFrame.current === index) return;
    const [x, y, width] = frames[Math.min(index, 49)]!;
    // Restore the plist's trimmed source rectangle to the 115×132 stage.
    image.current.setAttribute("x", String(-x));
    image.current.setAttribute("y", String(-y));
    image.current.parentElement?.setAttribute("width", String(width));
    image.current.parentElement?.setAttribute("x", String(115 - width));
    lastFrame.current = index;
  };
  useEffect(() => { draw(0); }, [playing, reducedMotion]);
  useAnimation((_delta, elapsed) => {
    draw(Math.floor(elapsed * 24) % 70);
  }, playing && !reducedMotion);
  return (
    <svg viewBox="0 0 115 132" width="115" height="132" role="img"
      aria-label={label} style={{ display: "inline-block", maxWidth: "100%", height: "auto" }}>
      <svg x="2" width="113" height="132" overflow="hidden">
        <image ref={image} x="0" y="0" width="1024" height="1024"
          href={`${import.meta.env.BASE_URL}media/companions/pifagor-idle.png`} />
      </svg>
    </svg>
  );
}

export default OriginalCompanion;
