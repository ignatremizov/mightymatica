import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { t, type Locale } from "./contracts";
import { useAnimation } from "./useAnimation";
import { LessonAudio, lessonMediaUrl } from "./LessonAudio";
import { advanceLessonClock, createLessonClock, enterLessonFrame, validateOriginalLesson } from "./OriginalLesson";
import type { LessonClock, OriginalLessonDefinition } from "./OriginalLesson";
import type { OriginalTimelineModule } from "./OriginalTimeline";
import { lessonCanvasSize } from "./LessonCanvas";
import "./original-lesson.css";

export interface OriginalLessonPlayerProps {
  lesson: OriginalLessonDefinition;
  locale: Locale;
  reducedMotion: boolean;
  label: string;
  stopLabels?: Readonly<Record<number, string>>;
  stopHotspots?: Readonly<Record<number, {
    x: number; y: number; width: number; height: number;
    /** Keep an existing source-drawn button visible beneath a semantic hit area. */
    sourceArtwork?: boolean;
  }>>;
  /** Source transport artwork stays clickable throughout its authored span. */
  playbackHotspots?: readonly {
    firstFrame: number; lastFrame: number;
    x: number; y: number; width: number; height: number;
  }[];
  /** Authored chapter menus, not generic ways through an answer gate. */
  navigationMenus?: readonly {
    firstFrame: number; lastFrame: number;
    items: readonly {
      label: string; targetFrame: number;
      x: number; y: number; width: number; height: number;
    }[];
  }[];
  onNavigate?: (frame: number) => void;
  /** Source controller actions replace generic Continue at question/retry stops. */
  stopActions?: Readonly<Record<number, readonly {
    label: string;
    targetFrame: number;
    stopSounds?: boolean;
    soundId?: number;
    hotspot?: {
      x: number; y: number; width: number; height: number;
      /** The Canvas already paints this action's source button and label. */
      sourceArtwork?: boolean;
    };
  }[] | undefined>>;
  blockedStopFrames?: readonly number[];
  onStop?: (frame: number) => void;
  /** Optional source-specific dynamic artwork absent from the drawing export. */
  drawOverlay?: (context: CanvasRenderingContext2D, state: Readonly<LessonClock>) => void;
  /** Interactive source-positioned geometry, beneath the semantic controls. */
  stageOverlay?: ReactNode;
  /** Present game artwork in its existing board while keeping controls nearby. */
  stageTarget?: HTMLElement | null;
  onAction?: (frame: number, actionIndex: number) => void;
  onLeaveStop?: () => void;
  initialSound?: boolean;
  onSoundChange?: (enabled: boolean) => void;
  /** Lesson-specific shortcuts sharing the transport toolbar. */
  controlsBefore?: ReactNode;
  /** Only for a continuation mounted by the user's answer/Hint action. */
  autoPlay?: boolean;
  /** Source celebration loop. Existing long sound instances are not stacked. */
  loopToFrame?: number;
  /** Keep source-scripted overlay motion running on a stopped final picture. */
  continueAfterComplete?: boolean;
  onComplete?: () => void;
  onRestart?: () => void;
  /** Games can use their own completion wording without changing lessons. */
  completionLabel?: string;
  /** User-invoked follow-up; never shown before the lesson is complete. */
  completionAction?: { label: string; onClick: () => void };
}

/** Native source artwork, event narration and authored interaction stops. */
export default function OriginalLessonPlayer({
  lesson, locale, reducedMotion, label, stopLabels = {}, stopHotspots = {}, playbackHotspots = [], navigationMenus = [], stopActions = {},
  blockedStopFrames = [], onStop, drawOverlay, stageOverlay, stageTarget, onComplete, onRestart,
  onAction, onLeaveStop, onNavigate, initialSound = true, onSoundChange, controlsBefore, autoPlay = false, loopToFrame, continueAfterComplete = false, completionAction, completionLabel,
}: OriginalLessonPlayerProps) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const renderer = useRef<Awaited<ReturnType<OriginalTimelineModule["createTimeline"]>> | null>(null);
  const audio = useRef<LessonAudio | null>(null);
  const clock = useRef(createLessonClock(lesson));
  const callback = useRef(onComplete);
  callback.current = onComplete;
  const [chapterIndex, setChapterIndex] = useState(() =>
    lesson.chapters.findIndex(chapter => chapter.startFrame <= lesson.initialFrame && chapter.endFrame >= lesson.initialFrame));
  const [retry, setRetry] = useState(0);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [playing, setPlaying] = useState(false);
  const [sound, setSound] = useState(initialSound);
  const [buffering, setBuffering] = useState(false);
  const [audioError, setAudioError] = useState(false);
  const [waiting, setWaiting] = useState(clock.current.waiting);
  const [complete, setComplete] = useState(false);
  const [playbackHotspot, setPlaybackHotspot] = useState(() =>
    playbackHotspots.find(hit => lesson.initialFrame >= hit.firstFrame && lesson.initialFrame <= hit.lastFrame));
  const [navigationMenu, setNavigationMenu] = useState(() =>
    navigationMenus.find(menu => lesson.initialFrame >= menu.firstFrame && lesson.initialFrame <= menu.lastFrame));
  const notified = useRef(false);
  const started = useRef(false);
  const autoStarted = useRef(false);
  const prefetchedThrough = useRef(0);
  const plannedUntil = useRef(0);
  const lastDraw = useRef(-1);
  const drawnFrame = useRef(-1);
  const callbackStop = useRef(onStop);
  const redraw = useRef<() => void>(() => {});
  callbackStop.current = onStop;
  const chapter = lesson.chapters[chapterIndex];
  const actions = waiting ? stopActions[waiting.frame] : undefined;
  const blocked = !!waiting && (blockedStopFrames.includes(waiting.frame) || !!actions?.length);
  const draw = (isPlaying = playing) => {
    renderer.current?.setPlaybackState?.(isPlaying && !clock.current.waiting);
    // FFDec's `time` is an integer animation tick, not fractional seconds.
    renderer.current?.draw(clock.current.frame, Math.floor(clock.current.elapsed * lesson.fps));
    const target = canvas.current;
    const context = target?.getContext("2d");
    if (context && target && drawOverlay) {
      context.save();
      context.setTransform(target.width / lesson.width, 0, 0, target.height / lesson.height, 0, 0);
      drawOverlay(context, clock.current);
      context.restore();
    }
    lastDraw.current = clock.current.elapsed;
    drawnFrame.current = clock.current.frame;
    if (playbackHotspots.length) {
      const hit = playbackHotspots.find(entry =>
        clock.current.frame >= entry.firstFrame && clock.current.frame <= entry.lastFrame);
      if (hit !== playbackHotspot) setPlaybackHotspot(hit);
    }
    if (navigationMenus.length) {
      const menu = navigationMenus.find(entry =>
        clock.current.frame >= entry.firstFrame && clock.current.frame <= entry.lastFrame);
      if (menu !== navigationMenu) setNavigationMenu(menu);
    }
  };
  const sizeCanvas = () => {
    const target = canvas.current;
    if (!target) return false;
    const size = lessonCanvasSize(lesson.width, lesson.height,
      target.getBoundingClientRect().width, window.devicePixelRatio);
    if (target.width === size.width && target.height === size.height) return false;
    target.width = size.width;
    target.height = size.height;
    return true;
  };
  useLayoutEffect(() => { redraw.current = draw; });
  useEffect(() => {
    const target = canvas.current;
    if (!target) return;
    const resize = () => {
      if (sizeCanvas() && renderer.current) {
        try { redraw.current(); } catch (error: unknown) { fail(error); }
      }
    };
    const observer = typeof ResizeObserver === "undefined" ? null : new ResizeObserver(resize);
    observer?.observe(target);
    window.addEventListener("resize", resize);
    resize();
    return () => { observer?.disconnect(); window.removeEventListener("resize", resize); };
  }, [lesson]);

  const fail = (error: unknown) => {
    console.error("Native lesson failed:", label, error);
    audio.current?.pause();
    renderer.current?.dispose();
    renderer.current = null;
    setPlaying(false);
    setStatus("error");
  };

  useEffect(() => {
    const owner = new LessonAudio(lesson, (error: unknown) => {
      console.error("Original lesson audio failed:", label, error);
      setAudioError(true);
    });
    audio.current = owner;
    clock.current = createLessonClock(lesson);
    owner.reset(lesson.initialFrame);
    started.current = false;
    autoStarted.current = false;
    prefetchedThrough.current = 0;
    plannedUntil.current = 0;
    notified.current = false;
    setPlaying(false);
    setComplete(false);
    setWaiting(clock.current.waiting);
    setPlaybackHotspot(playbackHotspots.find(hit =>
      lesson.initialFrame >= hit.firstFrame && lesson.initialFrame <= hit.lastFrame));
    setNavigationMenu(navigationMenus.find(menu =>
      lesson.initialFrame >= menu.firstFrame && lesson.initialFrame <= menu.lastFrame));
    setAudioError(false);
    return () => { owner.dispose(); if (audio.current === owner) audio.current = null; };
  }, [lesson]);

  useEffect(() => {
    let disposed = false;
    let owned: typeof renderer.current = null;
    renderer.current = null;
    setStatus("loading");
    audio.current?.pause();
    async function load() {
      validateOriginalLesson(lesson);
      if (!chapter || !canvas.current) throw new Error("Missing lesson chapter.");
      const module = await import(/* @vite-ignore */ lessonMediaUrl(chapter.module, ".mjs")) as OriginalTimelineModule;
      if (disposed) return;
      if (module.metadata.width !== lesson.width || module.metadata.height !== lesson.height
        || !Array.isArray(module.metadata.frames)) throw new Error("Unexpected lesson drawing metadata.");
      const frames = new Set(module.metadata.frames);
      for (let frame = chapter.startFrame; frame <= chapter.endFrame; frame++) {
        if (!frames.has(frame)) throw new Error("Incomplete native lesson chapter.");
      }
      if (disposed || !canvas.current) return;
      sizeCanvas();
      owned = await module.createTimeline(canvas.current);
      if (disposed) { owned.dispose(); owned = null; return; }
      renderer.current = owned;
      if (clock.current.frame < chapter.startFrame) {
        enterLessonFrame(clock.current, chapter.startFrame, lesson,
          (frame, elapsed) => audio.current?.visit(frame, elapsed));
      }
      setWaiting(clock.current.waiting);
      draw();
      setStatus("ready");
      if (clock.current.waiting) callbackStop.current?.(clock.current.waiting.frame);
      if (clock.current.complete && !notified.current) {
        notified.current = true;
        setComplete(true);
        callback.current?.();
      }
    }
    void load().catch((error: unknown) => {
      if (!disposed) fail(error);
    });
    return () => {
      disposed = true;
      owned?.dispose();
      if (renderer.current === owned) renderer.current = null;
    };
  }, [lesson, chapterIndex, retry]);

  useEffect(() => {
    if (reducedMotion) {
      audio.current?.pause();
      setPlaying(false);
      try { draw(false); } catch (error: unknown) { fail(error); }
    }
  }, [reducedMotion]);
  useEffect(() => {
    if (!playing || !sound || status !== "ready" || buffering) audio.current?.pause();
  }, [playing, sound, status, buffering]);

  const readyAudio = () => {
    const owner = audio.current;
    if (!owner || !sound) return;
    // The AudioContext is unlocked during this user gesture, before lazy decode.
    setBuffering(true);
    const through = Math.min(lesson.endFrame, clock.current.frame + Math.ceil(lesson.fps * 4));
    prefetchedThrough.current = through;
    plannedUntil.current = 0;
    void owner.activate().then(() =>
      owner.prepareRange(started.current ? clock.current.frame : 1, through)
    ).then(() => {
      if (audio.current !== owner) return;
      started.current = true;
      setBuffering(false);
    }).catch((error: unknown) => {
      if (audio.current !== owner) return;
      console.error("Original lesson sound could not start:", error);
      setAudioError(true);
      setSound(false);
      setBuffering(false);
    });
  };

  useEffect(() => {
    if (!autoPlay || autoStarted.current || status !== "ready") return;
    autoStarted.current = true;
    if (clock.current.waiting && !blocked) { clock.current.waiting = null; setWaiting(null); }
    readyAudio();
    setPlaying(true);
  }, [autoPlay, lesson, status]);

  useAnimation((delta, _elapsed, visible) => {
    const owner = audio.current;
    const state = clock.current;
    if (!chapter) return;
    // Quietly warm the next few seconds, rather than waiting until a new cue
    // is two frames away and flashing a loading strip for each short recording.
    if (sound && owner && state.frame + Math.ceil(lesson.fps * 2) >= prefetchedThrough.current) {
      const ahead = Math.min(lesson.endFrame, state.frame + Math.ceil(lesson.fps * 4));
      if (ahead > prefetchedThrough.current) {
        prefetchedThrough.current = ahead;
        void owner.prepareRange(state.frame, ahead);
      }
    }
    // Sound already scheduled on the audio clock has consumed this interval,
    // even if a new recording is still decoding. Catch the authorized picture
    // clock up before buffering; retaining the old time would replay speech.
    const from = state.frame;
    const through = Math.min(chapter.endFrame, state.frame + Math.max(2, Math.ceil(delta * lesson.fps)));
    const needsAudio = !!sound && !!owner && !owner.ready(from, through);
    const oldWaiting = state.waiting;
    advanceLessonClock(state, delta, lesson, chapter.endFrame,
      (frame, elapsed) => owner?.visit(frame, elapsed));
    if (needsAudio) {
      owner.sync(state.elapsed, false);
      setBuffering(true);
      const ahead = Math.min(lesson.endFrame, Math.max(through, from + Math.ceil(lesson.fps * 4)));
      prefetchedThrough.current = Math.max(prefetchedThrough.current, ahead);
      void owner.prepareRange(from, ahead).then(() => {
        if (audio.current === owner) setBuffering(false);
      });
    }
    // Web Audio can start/stop sounds accurately even when an inactive tab's
    // JavaScript timers are throttled. Project only the authorized chapter:
    // manual questions and timed holds are retained by the same pure clock.
    const horizon = state.elapsed + (visible ? 4 : 30);
    if (sound && owner && plannedUntil.current < horizon - 2) {
      const projected = { ...state };
      const throughFrame = Math.min(chapter.endFrame,
        state.frame + Math.ceil((horizon - state.elapsed) * lesson.fps));
      void owner.prepareRange(state.frame, throughFrame);
      advanceLessonClock(projected, horizon - state.elapsed, lesson, chapter.endFrame,
        (frame, elapsed) => owner.schedule(frame, elapsed));
      plannedUntil.current = horizon;
    }
    try {
      // Anchor sound at the animation timestamp, before potentially expensive
      // Canvas/filter work. Drawing cost must not look like fresh audio drift.
      if (!needsAudio) owner?.sync(state.elapsed, sound);
      if (visible && (drawnFrame.current !== state.frame || (drawOverlay && state.elapsed - lastDraw.current >= 1 / lesson.fps))) draw();
    } catch (error: unknown) { fail(error); return; }
    if (state.waiting !== oldWaiting) {
      setWaiting(state.waiting);
      if (state.waiting) callbackStop.current?.(state.waiting.frame);
    }
    if (state.complete && !notified.current) {
      notified.current = true;
      setComplete(true);
      callback.current?.();
    }
    if (state.complete && loopToFrame !== undefined && Number.isSafeInteger(loopToFrame)
      && loopToFrame >= lesson.initialFrame && loopToFrame < lesson.endFrame) {
      state.complete = false;
      state.waiting = null;
      state.hold = 0;
      plannedUntil.current = 0;
      enterLessonFrame(state, loopToFrame, lesson, (frame, elapsed) => owner?.visit(frame, elapsed, true));
      setWaiting(state.waiting);
      const index = lesson.chapters.findIndex(entry => loopToFrame >= entry.startFrame && loopToFrame <= entry.endFrame);
      if (index !== chapterIndex) { owner?.pause(); setStatus("loading"); setChapterIndex(index); }
      else { try { draw(); } catch (error: unknown) { fail(error); } }
    }
    if (state.complete && !continueAfterComplete && !owner?.activeCount) setPlaying(false);
    if (state.frame === chapter.endFrame && state.untilNextFrame <= 1e-9 && !state.complete
      && !state.waiting && !state.hold && chapterIndex < lesson.chapters.length - 1) {
      owner?.pause();
      setStatus("loading");
      setChapterIndex(index => index + 1);
    }
  }, playing && status === "ready" && !buffering, { preserveElapsed: true });

  const play = () => {
    if (clock.current.waiting && !blocked) { onLeaveStop?.(); clock.current.waiting = null; setWaiting(null); }
    readyAudio();
    try { draw(true); } catch (error: unknown) { fail(error); return; }
    setPlaying(true);
  };
  const pause = () => {
    audio.current?.pause();
    setPlaying(false);
    try { draw(false); } catch (error: unknown) { fail(error); }
  };
  const restart = () => {
    pause();
    clock.current = createLessonClock(lesson);
    audio.current?.reset(lesson.initialFrame);
    started.current = false;
    prefetchedThrough.current = 0;
    plannedUntil.current = 0;
    notified.current = false;
    setComplete(false);
    setBuffering(false);
    setWaiting(clock.current.waiting);
    setPlaybackHotspot(playbackHotspots.find(hit =>
      lesson.initialFrame >= hit.firstFrame && lesson.initialFrame <= hit.lastFrame));
    setNavigationMenu(navigationMenus.find(menu =>
      lesson.initialFrame >= menu.firstFrame && lesson.initialFrame <= menu.lastFrame));
    const first = lesson.chapters.findIndex(entry => entry.startFrame <= lesson.initialFrame && entry.endFrame >= lesson.initialFrame);
    if (first !== chapterIndex) { setStatus("loading"); setChapterIndex(first); }
    else {
      try { draw(false); } catch (error: unknown) { fail(error); }
    }
    onRestart?.();
  };
  const continueLabel = waiting ? stopLabels[waiting.frame] ?? t(locale,
    waiting.frame === lesson.initialFrame ? "Play" : "Continue",
    waiting.frame === lesson.initialFrame ? "Воспроизвести" : "Продолжить") : "";
  const hotspot = waiting ? stopHotspots[waiting.frame] : undefined;
  const hotspotStyle = (hit: { x: number; y: number; width: number; height: number }) => ({
    left: `${hit.x / lesson.width * 100}%`, top: `${hit.y / lesson.height * 100}%`,
    width: `${hit.width / lesson.width * 100}%`, height: `${hit.height / lesson.height * 100}%`,
    bottom: "auto", fontSize: "clamp(.65rem, 2vw, 1rem)",
  });
  const choose = (action: NonNullable<typeof actions>[number], actionIndex: number) => {
    if (!waiting || status !== "ready" || !Number.isSafeInteger(action.targetFrame)
      || action.targetFrame < lesson.initialFrame || action.targetFrame > lesson.endFrame) return;
    audio.current?.pause();
    if (action.stopSounds) audio.current?.stopAll();
    onAction?.(waiting.frame, actionIndex);
    if (action.soundId !== undefined && sound) {
      const owner = audio.current;
      void owner?.activate().catch(() => { if (audio.current === owner) setAudioError(true); });
      owner?.playSound(action.soundId, clock.current.elapsed);
    }
    if (action.targetFrame === clock.current.frame) {
      // Wrong-answer buttons in some originals stay on the same question.
      // Do not re-enter its root audio events or consume its answer gate.
      readyAudio();
      setPlaying(true);
      return;
    }
    onLeaveStop?.();
    clock.current.waiting = null;
    clock.current.hold = 0;
    clock.current.complete = false;
    notified.current = false;
    setComplete(false);
    enterLessonFrame(clock.current, action.targetFrame, lesson,
      (frame, elapsed) => audio.current?.visit(frame, elapsed));
    setWaiting(clock.current.waiting);
    const destinationStop = lesson.stops.find(stop => stop.frame === action.targetFrame && stop.kind === "manual");
    if (destinationStop) callbackStop.current?.(destinationStop.frame);
    const index = lesson.chapters.findIndex(entry => action.targetFrame >= entry.startFrame && action.targetFrame <= entry.endFrame);
    if (index !== chapterIndex) { setStatus("loading"); setChapterIndex(index); }
    else {
      try { draw(); } catch (error: unknown) { fail(error); return; }
    }
    readyAudio();
    setPlaying(true);
  };
  const stage = <div className="original-lesson__stage" style={{ aspectRatio: `${lesson.width}/${lesson.height}` }}>
      <canvas ref={canvas} width={lesson.width} height={lesson.height} role="img" aria-label={label}>{label}</canvas>
      {stageOverlay && <div className="original-lesson__stage-overlay">{stageOverlay}</div>}
      {waiting && !blocked && !playbackHotspot && <button type="button"
        className={hotspot?.sourceArtwork ? "original-lesson__source-hotspot" : "original-lesson__continue source-play-control"}
        style={hotspot ? hotspotStyle(hotspot) : undefined}
        aria-label={continueLabel}
        title={hotspot?.sourceArtwork ? continueLabel : undefined}
        disabled={status !== "ready" || buffering} onClick={play}>
        {!hotspot?.sourceArtwork && continueLabel}
      </button>}
      {playbackHotspot && <button type="button" className="original-lesson__transport"
        style={hotspotStyle(playbackHotspot)}
        aria-label={t(locale, playing && !waiting ? "Pause" : "Play", playing && !waiting ? "Пауза" : "Воспроизвести")}
        title={t(locale, playing && !waiting ? "Pause" : "Play", playing && !waiting ? "Пауза" : "Воспроизвести")}
        disabled={status !== "ready" || buffering}
        onClick={playing && !waiting ? pause : play} />}
      {onNavigate && navigationMenu?.items.map(item => <button type="button"
        key={item.targetFrame} className="original-lesson__source-hotspot"
        style={hotspotStyle(item)} aria-label={item.label} title={item.label}
        disabled={status !== "ready"} onClick={() => onNavigate(item.targetFrame)} />)}
      {actions?.filter(action => action.hotspot).map((action, index) => <button type="button"
        className={action.hotspot?.sourceArtwork ? "original-lesson__source-hotspot" : "original-lesson__action"}
        key={index} style={hotspotStyle(action.hotspot!)}
        aria-label={action.label} title={action.hotspot?.sourceArtwork ? action.label : undefined}
        disabled={status !== "ready" || buffering} onClick={() => choose(action, actions.indexOf(action))}>
        {!action.hotspot?.sourceArtwork && action.label}
      </button>)}
      {status === "loading" && <p className="original-lesson__loading" role="status">
        {t(locale, "Loading lesson…", "Загрузка урока…")}
      </p>}
      {complete && completionAction && <button type="button" className="original-lesson__explore"
        onClick={completionAction.onClick}>
        <span aria-hidden="true">↗</span> {completionAction.label}
      </button>}
    </div>;
  return <figure className="original-lesson">
    {stageTarget ? createPortal(stage, stageTarget) : stage}
    {!!actions?.length && <div className="original-lesson__actions" role="group" aria-label={t(locale, "Choose an answer", "Выберите ответ")}>
      {actions.filter(action => !action.hotspot).map((action, index) => <button type="button" key={index}
        disabled={status !== "ready" || buffering} onClick={() => choose(action, actions.indexOf(action))}>{action.label}</button>)}
    </div>}
    <div className="original-lesson__controls" role="group" aria-label={t(locale, "Lesson controls", "Управление уроком")}>
      {controlsBefore}
      <button type="button" className="source-play-control" disabled={status !== "ready" || buffering}
        onClick={playing ? pause : play}>{t(locale, playing ? "Pause" : "Play", playing ? "Пауза" : "Воспроизвести")}</button>
      <button type="button" onClick={restart}>{t(locale, "Restart", "Сначала")}</button>
      <label><input type="checkbox" checked={sound} onChange={event => {
        const value = event.currentTarget.checked;
        setSound(value);
        onSoundChange?.(value);
        if (!value) { audio.current?.pause(); setBuffering(false); }
        else if (playing) {
          setBuffering(true);
          const owner = audio.current;
          const through = Math.min(lesson.endFrame, clock.current.frame + Math.ceil(lesson.fps * 4));
          prefetchedThrough.current = through;
          void owner?.activate().then(() => owner.prepareRange(1, through))
            .then(() => { if (audio.current === owner) setBuffering(false); })
            .catch(() => { if (audio.current === owner) { setAudioError(true); setSound(false); setBuffering(false); } });
        }
      }} /> {t(locale, "Sound", "Звук")}</label>
      {complete && <span role="status">{completionLabel ?? t(locale, "Lesson complete", "Урок завершён")}</span>}
    </div>
    {audioError && <p role="status">{t(locale, "Some sound could not be played. You can continue without sound.", "Не удалось воспроизвести часть звука. Можно продолжить без него.")}{" "}
      <button type="button" onClick={() => { audio.current?.retry(); setAudioError(false); readyAudio(); }}>{t(locale, "Retry sound", "Загрузить звук ещё раз")}</button>
    </p>}
    {status === "error" && <p role="alert">{t(locale, "The lesson could not be loaded.", "Не удалось загрузить урок.")}{" "}
      <button type="button" onClick={() => setRetry(value => value + 1)}>{t(locale, "Try again", "Попробовать ещё раз")}</button>
    </p>}
  </figure>;
}
