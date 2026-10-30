import { useEffect, useRef, useState } from "react";
import { LessonAudio } from "../../shared/LessonAudio";
import { useAnimation } from "../../shared/useAnimation";
import source from "./mindread-en-audio.json";

/** Source reveal feedback starts only on a reveal/retry interaction. */
export function useMindreadSound() {
  const [enabled, setEnabled] = useState(true);
  const [status, setStatus] = useState<"idle" | "loading" | "playing" | "error">("idle");
  const owner = useRef<LessonAudio | null>(null);
  const elapsed = useRef(0);
  const finishAt = useRef(0);

  const stop = () => {
    const previous = owner.current;
    owner.current = null;
    previous?.dispose();
    setStatus("idle");
  };
  useEffect(() => {
    return () => {
      const previous = owner.current;
      owner.current = null;
      previous?.dispose();
    };
  }, []);

  useAnimation(delta => {
    elapsed.current += delta;
    if (elapsed.current >= finishAt.current) { stop(); return; }
    owner.current?.sync(elapsed.current, true);
  }, enabled && status === "playing", { preserveElapsed: true });

  const reveal = (round: number) => {
    if (!enabled) return;
    stop();
    const cue = source.audioCues[round % source.audioCues.length]!;
    // The original final envelope point stays silent thereafter. Retire the
    // effect then instead of running a silent 67-second source to completion.
    finishAt.current = cue.envelope[cue.envelope.length - 1]!.mark44 / 44100;
    elapsed.current = 0;
    const current = new LessonAudio({
      fps: source.fps, audioAssets: source.audioAssets, audioCues: [cue], stops: [],
    }, () => {
      if (owner.current !== current) return;
      current.dispose(); owner.current = null; setStatus("error");
    });
    owner.current = current;
    setStatus("loading");
    // Unlock synchronously in the ball/retry click; loading remains abortable.
    void current.activate().then(() => current.prepareRange(cue.frame, cue.frame)).then(() => {
      if (owner.current !== current) return;
      current.visit(cue.frame, 0);
      setStatus("playing");
    }).catch(() => {
      if (owner.current !== current) return;
      current.dispose(); owner.current = null; setStatus("error");
    });
  };
  return {
    enabled, status, reveal, stop,
    toggle(value: boolean) { stop(); setEnabled(value); },
  };
}
