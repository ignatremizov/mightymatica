import { useEffect, useMemo, useRef, useState } from "react";
import { useAnimation } from "./useAnimation";
import {
  createWordmarkLayout, wordmarkGlyphFrame, WORDMARK_FPS, splitY,
  upperMaskY, upperMaskScale, lowerMaskY, echoOneScale, echoOneAlpha,
  echoTwoScale, echoTwoAlpha, type WordmarkKind,
} from "./WordmarkTimeline";

export interface OriginalWordmarkProps {
  kind: WordmarkKind;
  reducedMotion: boolean;
  className?: string;
}

function drawLetter(ctx: CanvasRenderingContext2D, character: string, y: number, scale = 1, alpha = 1) {
  ctx.save();
  ctx.translate(0, y);
  ctx.scale(scale * 1.003814697265625, scale * .989593505859375);
  ctx.globalAlpha = alpha;
  // Flash's dynamic-text inset/baseline is approximated in native Arial.
  ctx.fillText(character, -.025, 4.4);
  ctx.restore();
}

/** Decorative companion to the shell's semantic title. No Flash or script VM. */
export function OriginalWordmark({ kind, reducedMotion, className }: OriginalWordmarkProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const clock = useRef(0);
  const lastFrame = useRef(-1);
  const [visible, setVisible] = useState(false);
  const layout = useMemo(() => createWordmarkLayout(kind), [kind]);

  const draw = (movieFrame: number, settled = false) => {
    const ctx = canvasRef.current?.getContext("2d");
    if (!ctx) return;
    ctx.setTransform(2, 0, 0, 2, 0, 0);
    ctx.clearRect(0, 0, 400, 200);
    ctx.fillStyle = "#00008b";
    ctx.font = "bold 10.1px Arial, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "alphabetic";
    for (const glyph of layout.glyphs) {
      const frame = settled ? 24 : wordmarkGlyphFrame(layout, glyph, movieFrame);
      if (frame < 0) continue;
      ctx.save();
      ctx.translate(glyph.x, 100);
      ctx.scale(layout.size / 10, layout.size / 10);
      if (frame < 10) {
        // Symbol 8 rectangle is in twips; Symbols 10/9 scale it into two
        // moving masks. Clip before translating the glyph, as in the source.
        ctx.save();
        const mx = frame < 5 ? 1.3 : 1.25;
        const sy = upperMaskScale[frame]!;
        ctx.beginPath();
        ctx.rect(mx - 16.95, upperMaskY[frame]! - 6.15 * sy, 33.9, 12.25 * sy);
        ctx.clip();
        drawLetter(ctx, glyph.character, splitY[frame]!);
        ctx.restore();
        ctx.save();
        ctx.beginPath();
        ctx.rect(1.35 - 339 * .050147246569395065,
          lowerMaskY[frame]! + .05 - 123 * .067346952855587,
          678 * .050147246569395065, 245 * .067346952855587);
        ctx.clip();
        drawLetter(ctx, glyph.character, -splitY[frame]!);
        ctx.restore();
      }
      if (frame >= 9) drawLetter(ctx, glyph.character, 0);
      if (frame >= 9 && frame <= 18) {
        const i = frame - 9;
        drawLetter(ctx, glyph.character, -.05, echoOneScale[i]!, echoOneAlpha[i]!);
      }
      if (frame >= 12 && frame <= 22) {
        const i = frame - 12;
        drawLetter(ctx, glyph.character, -.05, echoTwoScale[i]!, echoTwoAlpha[i]!);
      }
      ctx.restore();
    }
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    if (typeof IntersectionObserver === "undefined") {
      setVisible(true);
      return;
    }
    const observer = new IntersectionObserver(([entry]) => setVisible(Boolean(entry?.isIntersecting)));
    observer.observe(canvas);
    return () => observer.disconnect();
  }, []);
  useEffect(() => {
    clock.current = 0;
    lastFrame.current = -1;
    draw(0, reducedMotion);
  }, [layout, reducedMotion]);
  useAnimation((delta) => {
    clock.current = (clock.current + delta) % (layout.cycle / WORDMARK_FPS);
    const frame = Math.floor(clock.current * WORDMARK_FPS);
    if (frame === lastFrame.current) return;
    lastFrame.current = frame;
    draw(frame);
  }, visible && !reducedMotion);

  return <canvas ref={canvasRef} width={800} height={400} className={className}
    aria-hidden="true" style={{ display: "block", width: "100%", height: "auto", aspectRatio: "2 / 1" }} />;
}
