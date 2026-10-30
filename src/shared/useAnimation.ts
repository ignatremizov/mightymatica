import { useEffect, useLayoutEffect, useRef } from "react";

/**
 * One owned animation loop per active activity. Playback continues across tabs.
 * Callbacks should draw/update refs rather than set React state per particle.
 */
export function useAnimation(
  callback: (deltaSeconds: number, elapsedSeconds: number, visible: boolean) => void,
  enabled = true,
  { preserveElapsed = false }: { preserveElapsed?: boolean } = {},
): void {
  const callbackRef = useRef(callback);
  useLayoutEffect(() => { callbackRef.current = callback; });
  useEffect(() => {
    if (!enabled) return;
    let frame = 0;
    let timer: ReturnType<typeof setTimeout> | undefined;
    let previous = 0;
    let elapsed = 0;
    let disposed = false;
    let wasHidden = document.hidden;
    const cancel = () => {
      cancelAnimationFrame(frame);
      frame = 0;
      if (timer !== undefined) clearTimeout(timer);
      timer = undefined;
    };
    const schedule = () => {
      if (disposed) return;
      if (document.hidden) timer = setTimeout(() => tick(performance.now()), 250);
      else frame = requestAnimationFrame(tick);
    };
    const tick = (now: number) => {
      if (disposed) return;
      frame = 0;
      timer = undefined;
      const hidden = document.hidden;
      const actualDelta = previous ? Math.max(0, (now - previous) / 1000) : 0;
      // Physics/decorative loops keep their bounded step. Audio-backed films
      // must retain visible time: discarding it makes narration run ahead and
      // forces the audio synchronizer to replay recently spoken words.
      const delta = preserveElapsed || hidden || wasHidden ? actualDelta : Math.min(actualDelta, 0.05);
      previous = now;
      wasHidden = hidden;
      elapsed += delta;
      callbackRef.current(delta, elapsed, !hidden);
      schedule();
    };
    const visibility = () => {
      cancel();
      // Do not throw away elapsed time or the user's Play choice. A hidden
      // tick also prepares narration ahead of background timer throttling.
      if (!disposed) tick(performance.now());
    };
    document.addEventListener("visibilitychange", visibility);
    visibility();
    return () => {
      disposed = true;
      cancel();
      document.removeEventListener("visibilitychange", visibility);
    };
  }, [enabled, preserveElapsed]);
}
