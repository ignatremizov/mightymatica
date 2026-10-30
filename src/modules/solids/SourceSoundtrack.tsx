import { useEffect, useRef, useState } from "react";
import { mediaUrl, t, type Locale } from "../../shared/contracts";

const tracks = {
  cube: { src: "solids/audio/cube/Swinger-Singers.mp3", mono: false, left: .4, right: .4, loop: true },
  tetrahedron: { src: "solids/audio/tetrahedron/25.mp3", mono: true, left: 9755 / 32768, right: 11506 / 32768, loop: false },
} as const;
type Track = keyof typeof tracks;
type Graph = { context: AudioContext; nodes: AudioNode[] };

/** Original soundtrack with source gains; playback is always user initiated. */
export default function SourceSoundtrack({ track, locale }: { track: Track; locale: Locale }) {
  const element = useRef<HTMLAudioElement>(null);
  const graph = useRef<Graph | null>(null);
  const request = useRef(0);
  const [state, setState] = useState<"idle" | "loading" | "playing" | "paused" | "error">("idle");
  const source = tracks[track];

  useEffect(() => {
    const audio = element.current;
    setState("idle");
    return () => {
      request.current++;
      audio?.pause();
      audio?.removeAttribute("src");
      audio?.load();
      const owned = graph.current;
      graph.current = null;
      owned?.nodes.forEach(node => node.disconnect());
      void owned?.context.close().catch(() => {});
    };
  }, [track]);

  const pause = () => {
    request.current++;
    element.current?.pause();
    setState("paused");
    void graph.current?.context.suspend().catch(() => {});
  };
  const play = async (restart = false) => {
    const audio = element.current;
    if (!audio) return;
    const token = ++request.current;
    setState("loading");
    try {
      if (!graph.current) {
        const context = new AudioContext();
        graph.current = { context, nodes: [] };
        const input = context.createMediaElementSource(audio);
        const left = context.createGain(), right = context.createGain();
        const merger = context.createChannelMerger(2);
        graph.current.nodes.push(input, left, right, merger);
        left.gain.value = source.left; right.gain.value = source.right;
        if (source.mono) {
          input.connect(left); input.connect(right);
        } else {
          const splitter = context.createChannelSplitter(2);
          graph.current.nodes.push(splitter);
          input.connect(splitter); splitter.connect(left, 0); splitter.connect(right, 1);
        }
        left.connect(merger, 0, 0); right.connect(merger, 0, 1);
        merger.connect(context.destination);
      }
      await graph.current.context.resume();
      if (token !== request.current) return;
      if (restart) audio.currentTime = 0;
      await audio.play();
      if (token !== request.current) return;
      setState("playing");
    } catch {
      if (token !== request.current) return;
      audio.pause();
      setState("error");
    }
  };
  return <div className="solids-soundtrack">
    <audio key={track} ref={element} src={mediaUrl(source.src)} preload="none" loop={source.loop}
      onEnded={() => setState("paused")} onError={() => { request.current++; setState("error"); }} />
    <button className="button button-secondary" onClick={() => {
      if (state === "playing" || state === "loading") pause();
      else void play();
    }}>{state === "playing" || state === "loading"
        ? t(locale, "Pause soundtrack", "Пауза звуковой дорожки")
        : t(locale, "Play original soundtrack", "Включить исходную звуковую дорожку")}</button>
    {state !== "idle" && <button className="button button-secondary" onClick={() => { void play(true); }}>{t(locale, "Replay soundtrack", "Звуковая дорожка сначала")}</button>}
    <span role="status">{state === "loading" ? t(locale, "Loading sound…", "Загрузка звука…") : state === "error" ? t(locale, "Sound could not be played. Try again.", "Не удалось воспроизвести звук. Попробуйте ещё раз.") : ""}</span>
  </div>;
}
