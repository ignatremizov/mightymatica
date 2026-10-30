import { useEffect, useRef, useState } from "react";
import { LessonAudio } from "../../shared/LessonAudio";
import { useAnimation } from "../../shared/useAnimation";
import source from "./audio-music.json";

type Track = "theme" | "question";
// Original binary ExportAssets: question=1, theme=2 in both quiz SWFs.
const linkage = source.bindings;

export function useQuizMusic() {
  const [enabled, setEnabled] = useState(false);
  const [status, setStatus] = useState<"idle" | "loading" | "playing" | "error">("idle");
  const owner = useRef<LessonAudio | null>(null);
  const elapsed = useRef(0);
  const duration = useRef(0);
  const stop = () => {
    const old = owner.current;
    owner.current = null;
    old?.dispose();
    setStatus("idle");
  };
  useEffect(() => {
    return () => {
      const old = owner.current;
      owner.current = null;
      old?.dispose();
    };
  }, []);
  useAnimation(delta => {
    elapsed.current += delta;
    if (elapsed.current >= duration.current) { stop(); return; }
    owner.current?.sync(elapsed.current, true);
  }, enabled && status === "playing", { preserveElapsed: true });

  const start = (track: Track) => {
    stop();
    const asset = source.audioAssets.find(sound => sound.soundId === linkage[track])!;
    duration.current = asset.sampleCount / asset.sampleRate;
    elapsed.current = 0;
    const current: LessonAudio = new LessonAudio({
      fps: source.fps, stops: [], audioAssets: [asset],
      audioCues: [{ frame: 1, soundId: asset.soundId, sync: "event", loops: 1,
        inPoint44: 0, outPoint44: null, envelope: [] }],
    }, () => {
      if (owner.current !== current) return;
      current.dispose(); owner.current = null; setStatus("error");
    });
    owner.current = current;
    setStatus("loading");
    void current.activate().then(() => current.prepareRange(1, 1)).then(() => {
      if (owner.current !== current) return;
      current.visit(1, 0); setStatus("playing");
    }).catch(() => {
      if (owner.current !== current) return;
      current.dispose(); owner.current = null; setStatus("error");
    });
  };
  return {
    enabled, status, stop,
    play(track: Track) { if (enabled) start(track); },
    toggle(value: boolean, track: Track | null) {
      setEnabled(value);
      if (value && track) start(track);
      else stop();
    },
  };
}
