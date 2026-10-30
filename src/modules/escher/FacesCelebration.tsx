import { useEffect, useRef, useState } from "react";
import { mediaUrl } from "../../shared/contracts";
import type { LessonClock } from "../../shared/OriginalLesson";

interface Particle { x: number; y: number; scale: number; alpha: number; speed: number; ball: boolean }

/** Source frame181 + Snow/Ball rules, drawn into the existing victory artwork. */
export function useFacesCelebration(enabled: boolean) {
  const image = useRef<HTMLImageElement | null>(null);
  const particles = useRef<Particle[]>([]);
  const start = useRef<number | null>(null);
  const ticks = useRef(0);
  const [error, setError] = useState(false);
  function reset() {
    start.current = null;
    ticks.current = 0;
    particles.current = Array.from({ length: 43 }, (_, index) => ({
      x: Math.random() * 550, y: Math.random() * 400, alpha: Math.random(),
      scale: index < 11 ? Math.random() + 1 : index < 22 ? Math.random() + 2 : Math.random() * .3,
      speed: (Math.random() + .2) * 4, ball: index >= 22,
    }));
  }
  useEffect(() => {
    if (!enabled) return;
    let disposed = false;
    const particle = new Image();
    particle.src = mediaUrl("escher/faces-celebration/particle.svg");
    reset();
    setError(false);
    void particle.decode().then(() => { if (!disposed) image.current = particle; })
      .catch(() => { if (!disposed) setError(true); });
    return () => {
      disposed = true;
      image.current = null;
      particles.current = [];
      particle.removeAttribute("src");
    };
  }, [enabled]);
  function step() {
    for (const item of particles.current) {
      if (!item.ball) {
        item.y += item.speed;
        if (item.y > 420) item.y = -10;
      } else {
        item.scale += .01;
        if (item.x < 275 && item.y < 200) { item.x--; item.y--; }
        else if (item.x < 275 && item.y > 200) { item.x--; item.y++; }
        else if (item.x > 275 && item.y < 200) { item.x++; item.y--; }
        else if (item.x > 275 && item.y > 200) { item.x++; item.y++; }
        if (item.x > 580 || item.x < -10 || item.y < -10 || item.y > 420) {
          item.scale = Math.random() * .3;
          item.y = 100 + Math.random() * 200;
          item.x = 130 + Math.random() * 270;
        }
      }
    }
  }
  function draw(context: CanvasRenderingContext2D, clock: Readonly<LessonClock>) {
    if (!enabled || clock.frame < 181 || !image.current) return;
    start.current ??= clock.elapsed;
    const target = Math.floor((clock.elapsed - start.current) * 24);
    // Hidden-time catch-up is bounded; do not replay an unbounded particle history.
    const steps = Math.min(6, Math.max(0, target - ticks.current));
    for (let tick = 0; tick < steps; tick++) step();
    ticks.current = target;
    context.save();
    for (const item of particles.current) {
      context.globalAlpha = item.alpha;
      const size = 22.6 * item.scale;
      context.drawImage(image.current, item.x - size / 2, item.y - size / 2, size, size);
    }
    context.restore();
  }
  return { draw, reset, error };
}
