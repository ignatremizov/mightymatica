import { useEffect, useRef, useState } from "react";
import { useAnimation } from "./useAnimation";

export interface OriginalTimelineModule {
  metadata: { width: number; height: number; frames: number[]; background: string };
  createTimeline(canvas: HTMLCanvasElement): Promise<{
    draw(frame: number, time?: number): void;
    /** Source-owned transport sprites must not loop with the artwork. */
    setPlaybackState?(playing: boolean): void;
    dispose(): void;
  }>;
}
export interface OriginalTimelineProps {
  /** A locally reviewed generated ES module under this app's media directory. */
  moduleUrl: string;
  startFrame: number;
  endFrame: number;
  fps: number;
  reducedMotion: boolean;
  locale?: "en" | "ru";
  label?: string;
  checkpoints?: readonly { frame: number; label: string }[];
  /** Artwork presentations loop; educational timelines retain frame inspection. */
  presentation?: "inspection" | "loop" | "still";
  /** Suspend drawing without changing the user's Play/Pause choice. */
  active?: boolean;
}

/** A native bounded clock; generated code only draws the selected original frame. */
export function OriginalTimeline({
  moduleUrl, startFrame, endFrame, fps, reducedMotion, locale = "en",
  label = locale === "ru" ? "Оригинальная анимация" : "Original animation",
  checkpoints = [],
  presentation = "inspection", active = true,
}: OriginalTimelineProps) {
  const looping = presentation === "loop";
  const still = presentation === "still";
  const canvas = useRef<HTMLCanvasElement>(null);
  const renderer = useRef<Awaited<ReturnType<OriginalTimelineModule["createTimeline"]>> | null>(null);
  const current = useRef(startFrame);
  const accumulator = useRef(0);
  const slider = useRef<HTMLInputElement>(null);
  const [playing, setPlaying] = useState(false);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const ru = locale === "ru";
  const valid = Number.isSafeInteger(startFrame) && Number.isSafeInteger(endFrame)
    && startFrame >= 1 && endFrame >= startFrame && endFrame - startFrame < 5000
    && Number.isFinite(fps) && fps > 0 && fps <= 60;
  const show = (frame: number) => {
    current.current = frame;
    renderer.current?.draw(frame);
    if (slider.current) slider.current.value = String(frame);
  };
  const failPlayback = (error: unknown) => {
    console.error("Original timeline failed to draw:", moduleUrl, error);
    renderer.current?.dispose();
    renderer.current = null;
    setPlaying(false);
    setStatus("error");
  };
  useEffect(() => {
    let disposed = false;
    let owned: typeof renderer.current = null;
    renderer.current = null;
    accumulator.current = 0;
    current.current = startFrame;
    setPlaying(looping && !reducedMotion);
    setStatus("loading");
    async function load() {
      if (!valid || !canvas.current) throw new Error("Invalid timeline range.");
      const url = new URL(moduleUrl, document.baseURI);
      const media = new URL(`${import.meta.env.BASE_URL}media/`, document.baseURI);
      if (url.origin !== media.origin || !url.pathname.startsWith(media.pathname)
        || !url.pathname.endsWith(".mjs") || url.search || url.hash) throw new Error("Expected a reviewed local timeline.");
      const module = await import(/* @vite-ignore */ url.href) as OriginalTimelineModule;
      if (disposed) return;
      const { width, height, frames } = module.metadata;
      if (!Number.isSafeInteger(width) || !Number.isSafeInteger(height)
        || width < 1 || height < 1 || width > 2048 || height > 2048
        || !Array.isArray(frames)) throw new Error("Invalid timeline metadata.");
      const available = new Set(frames);
      for (let frame = startFrame; frame <= endFrame; frame++) {
        if (!available.has(frame)) throw new Error("Timeline range is not fully exported.");
      }
      if (disposed || !canvas.current) return;
      canvas.current.width = width;
      canvas.current.height = height;
      owned = await module.createTimeline(canvas.current);
      if (disposed) { owned.dispose(); owned = null; return; }
      renderer.current = owned;
      show(startFrame);
      setStatus("ready");
    }
    void load().catch((error: unknown) => {
      if (disposed) return;
      console.error("Original timeline failed to load or draw:", moduleUrl, error);
      owned?.dispose();
      if (renderer.current === owned) renderer.current = null;
      owned = null;
      setPlaying(false);
      setStatus("error");
    });
    return () => {
      disposed = true;
      owned?.dispose();
      if (renderer.current === owned) renderer.current = null;
    };
  }, [moduleUrl, startFrame, endFrame, valid, looping]);
  useEffect(() => { if (reducedMotion) setPlaying(false); }, [reducedMotion]);
  useAnimation((delta) => {
    accumulator.current += delta;
    const steps = Math.floor(accumulator.current * fps);
    if (!steps) return;
    accumulator.current -= steps / fps;
    const next = looping
      ? startFrame + (current.current - startFrame + steps) % (endFrame - startFrame + 1)
      : Math.min(current.current + steps, endFrame);
    try {
      show(next);
    } catch (error: unknown) {
      failPlayback(error);
      return;
    }
    if (!looping && next === endFrame) setPlaying(false);
  }, playing && active && status === "ready");
  const seek = (frame: number) => {
    accumulator.current = 0;
    try {
      show(Math.max(startFrame, Math.min(endFrame, frame)));
    } catch (error: unknown) {
      failPlayback(error);
    }
  };
  return <figure className="original-timeline">
    <canvas key={moduleUrl} ref={canvas} role="img" aria-label={label}
      style={{ display: "block", maxWidth: "100%", height: "auto" }}>{label}</canvas>
    <figcaption>{label}</figcaption>
    {status === "loading" && <p role="status">{ru ? "Загрузка…" : "Loading…"}</p>}
    {status === "error" && <p role="alert">{ru ? "Не удалось загрузить оригинальную анимацию." : "The original animation could not be loaded."}</p>}
    {!still && <div role="group" aria-label={ru ? "Управление анимацией" : "Animation controls"}>
      <button type="button" className="source-play-control" disabled={status !== "ready"} onClick={() => {
        if (!looping && current.current === endFrame) seek(startFrame);
        setPlaying(!playing);
      }}>{playing ? (ru ? "Пауза" : "Pause") : (ru ? "Воспроизвести" : "Play")}</button>
      {!looping && <>
      <button type="button" disabled={status !== "ready"} onClick={() => { setPlaying(false); seek(startFrame); }}>{ru ? "Сначала" : "Restart"}</button>
      <label>{ru ? "Положение" : "Position"}{" "}
        <input ref={slider} type="range" min={startFrame} max={endFrame} defaultValue={startFrame}
          disabled={status !== "ready"} onChange={(event) => { setPlaying(false); seek(Number(event.currentTarget.value)); }} />
      </label>{" "}
      {checkpoints.filter((point) => Number.isSafeInteger(point.frame) && point.frame >= startFrame && point.frame <= endFrame).map((point) =>
        <button key={`${point.frame}-${point.label}`} type="button" disabled={status !== "ready"}
          onClick={() => { setPlaying(false); seek(point.frame); }}>{point.label}</button>)}
      </>}
    </div>}
    {reducedMotion && !looping && !still && <p>{ru ? "Используйте ползунок для просмотра кадров." : "Use the slider to inspect individual frames."}</p>}
  </figure>;
}

export default OriginalTimeline;
