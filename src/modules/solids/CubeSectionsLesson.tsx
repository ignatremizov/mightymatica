import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { mediaUrl, t, type Locale } from "../../shared/contracts";
import { useAnimation } from "../../shared/useAnimation";
import OriginalLessonPlayer from "../../shared/OriginalLessonPlayer";
import type { OriginalTimelineModule } from "../../shared/OriginalTimeline";
import SourceSoundtrack from "./SourceSoundtrack";
import { cubeDemonstrationState, projectCubePoint, rotateCubePoint, type CubeDemonstration, type Point3 } from "./cubeSectionsLessonRules";
import media from "../../content/cube-sections-media.json";
import "./cube-sections-lesson.css";

// Recovered shape coordinates are in local pixels, before ActionScript's
// per-child transforms. Display-list order is intentional (Flash has no z sort).
type Artwork = {
  points: readonly (readonly number[])[];
  fill: string;
  fillOpacity?: number;
  stroke?: string;
  strokeWidth?: number;
};

function transformedPoint(point: readonly number[], child: number, scene: CubeDemonstration, state: ReturnType<typeof cubeDemonstrationState>): Point3 {
  let x = point[0]!, y = point[1]!;
  let rx = 0, ry = 0, tx = 0, ty = 0, tz = 0;
  if (child === 0) { ry = 90; tx = 75; }
  if (child === 1) { ry = -90; tx = -75; }
  if (child === 2) { rx = -90; ty = scene === 4 ? 0 : -75; tz = scene === 4 ? -75 : 0; }
  if (child === 3) { rx = 90; ty = scene === 4 ? 0 : 75; tz = scene === 4 ? 75 : 0; }
  if (child === 4) tz = 75;
  if (child === 5) tz = -75;
  if (child >= 6) {
    rx = state.sectionRotationX; ry = state.sectionRotationY;
    if (scene === 1) tx = state.offset;
    if (scene === 2) { tz = state.offset; ty = -state.offset; }
    if (scene === 4) { tx = state.offset; tz = -state.offset; }
    if (child === 7) {
      y *= state.sectionScaleY;
      if (scene === 4) x *= state.sectionScaleY;
    }
  }
  const local = rotateCubePoint([x, y, 0], rx, ry, 0);
  return rotateCubePoint([local[0] + tx, local[1] + ty, local[2] + tz], state.rotation, state.rotation, state.rotation);
}

function Demonstration({ scene, locale, reducedMotion, next }: {
  scene: CubeDemonstration; locale: Locale; reducedMotion: boolean; next: () => void;
}) {
  const [playing, setPlaying] = useState(!reducedMotion);
  const [artReady, setArtReady] = useState(false);
  const background = useRef<HTMLCanvasElement>(null);
  const cover = useRef<SVGRectElement>(null);
  const seconds = useRef(0);
  const painted = useRef(-1);
  const paths = useRef<(SVGPolygonElement | null)[]>([]);
  const original = media.languages[locale];
  const artwork: readonly Artwork[] = original.nativeScenes[scene - 1]!.children;
  useEffect(() => { if (reducedMotion) setPlaying(false); }, [reducedMotion]);
  useEffect(() => {
    let disposed = false;
    let owned: Awaited<ReturnType<OriginalTimelineModule["createTimeline"]>> | null = null;
    const load = async () => {
      const module = await import(/* @vite-ignore */ mediaUrl(original.chapters[0]!.module)) as OriginalTimelineModule;
      if (disposed || !background.current) return;
      owned = await module.createTimeline(background.current);
      if (disposed) { owned.dispose(); return; }
      owned.draw(scene * 2 - 1);
      setArtReady(true);
    };
    void load().catch(() => { if (!disposed) setArtReady(false); });
    return () => { disposed = true; owned?.dispose(); };
  }, [original, scene]);
  const paint = (force = false) => {
    const tick = Math.floor(seconds.current * 24 + 1e-7);
    if (!force && painted.current === tick) return;
    painted.current = tick;
    const state = cubeDemonstrationState(scene, tick);
    artwork.forEach((art, child) => {
      const points = art.points.map(point => projectCubePoint(transformedPoint(point, child, scene, state)).join(",")).join(" ");
      paths.current[child]?.setAttribute("points", points);
    });
    cover.current?.setAttribute("opacity", String(reducedMotion ? 0 : state.coverAlpha));
  };
  useLayoutEffect(() => { paint(true); }, [scene, reducedMotion]);
  useAnimation((delta, _elapsed, visible) => {
    seconds.current += delta;
    if (visible) paint();
  }, playing, { preserveElapsed: true });
  return <div className="cube-sections-demonstration">
    <div className="cube-sections-stage">
      <canvas ref={background} width="550" height="400" aria-hidden="true" />
      <svg viewBox="0 0 550 400" role="img" aria-label={t(locale, `Cube section demonstration ${scene} of 4`, `Сечения куба: демонстрация ${scene} из 4`)}>
        <g opacity={.55078125}>
          {artwork.map((art, index) => <polygon key={index} ref={element => { paths.current[index] = element; }}
            fill={art.fill} fillOpacity={art.fillOpacity ?? 1} stroke={art.stroke ?? "#000000"} strokeWidth={art.strokeWidth ?? 1} />)}
        </g>
        {scene === 1 && !artReady && <text x="275" y="365" textAnchor="middle" className="cube-sections-source-title">
          {t(locale, "Explore the cube sections by plane", "Сечения куба плоскостью")}
        </text>}
        <rect ref={cover} width="550" height="400" fill="#66ffff" pointerEvents="none" />
      </svg>
      <button className={`cube-sections-next${artReady ? " cube-sections-next-source" : ""}`}
        style={{ left: `${original.nextBounds[scene - 1]![0]! / 550 * 100}%`, top: `${original.nextBounds[scene - 1]![1]! / 400 * 100}%`,
          width: `${(original.nextBounds[scene - 1]![2]! - original.nextBounds[scene - 1]![0]!) / 550 * 100}%`,
          height: `${(original.nextBounds[scene - 1]![3]! - original.nextBounds[scene - 1]![1]!) / 400 * 100}%` }}
        aria-label={t(locale, "NEXT", "ДАЛЕЕ")} onClick={next}>{artReady ? "" : t(locale, "NEXT", "ДАЛЕЕ")}</button>
    </div>
    <div className="cube-sections-controls">
      <button className="button" onClick={() => setPlaying(value => !value)}>{playing ? t(locale, "Pause", "Пауза") : t(locale, "Play", "Воспроизвести")}</button>
      <button className="button button-secondary" disabled={playing} onClick={() => { seconds.current = (Math.floor(seconds.current * 24 + 1e-7) + 1) / 24; paint(true); }}>{t(locale, "Step", "Шаг")}</button>
      <span role="status">{t(locale, `Demonstration ${scene} of 5`, `Демонстрация ${scene} из 5`)}</span>
    </div>
  </div>;
}

/** The four source timer scenes precede the authored root9–1248 animation. */
export default function CubeSectionsLesson({ locale, reducedMotion, explorer }: {
  locale: Locale; reducedMotion: boolean; explorer: ReactNode;
}) {
  const [scene, setScene] = useState(1);
  const [complete, setComplete] = useState(false);
  const [explore, setExplore] = useState(false);
  const [focusRequest, setFocusRequest] = useState(0);
  const heading = useRef<HTMLHeadingElement>(null);
  const focused = useRef(0);
  const reveal = () => { setExplore(true); setFocusRequest(value => value + 1); };
  const restart = () => { setScene(1); setComplete(false); setExplore(false); };
  useLayoutEffect(() => {
    if (!complete || !explore || focusRequest === focused.current || !heading.current) return;
    focused.current = focusRequest;
    heading.current.scrollIntoView({ behavior: reducedMotion ? "auto" : "smooth", block: "start" });
    heading.current.focus({ preventScroll: true });
  }, [complete, explore, focusRequest, reducedMotion]);
  return <section className="cube-sections-lesson" aria-label={t(locale, "Cube sections", "Сечения куба")}>
    {scene < 5 ? <Demonstration key={`${locale}-${scene}`} scene={scene as CubeDemonstration} locale={locale} reducedMotion={reducedMotion} next={() => setScene(value => value + 1)} />
      : <OriginalLessonPlayer lesson={media.languages[locale]} locale={locale} reducedMotion={reducedMotion}
        label={t(locale, "Cube sections — final demonstration", "Сечения куба — заключительная демонстрация")}
        initialSound={false}
        stopLabels={{ 9: t(locale, "Play", "Воспроизвести") }}
        stopHotspots={{ 9: media.languages[locale].playbackHotspot }}
        playbackHotspots={[{ ...media.languages[locale].playbackHotspot, firstFrame: 9, lastFrame: 1248 }]}
        onComplete={() => setComplete(true)} onRestart={() => { setComplete(false); setExplore(false); }}
        completionAction={{ label: t(locale, "Try it yourself", "Попробовать самостоятельно"), onClick: reveal }} />}
    <div className="cube-sections-controls">
      <button className="button button-secondary" onClick={restart}>{t(locale, "Restart all demonstrations", "Все демонстрации сначала")}</button>
    </div>
    <SourceSoundtrack track="cube" locale={locale} />
    {complete && <details open={explore} onToggle={event => setExplore(event.currentTarget.open)}>
      <summary>{t(locale, "Explore the mathematics", "Исследовать математику")}</summary>
      {explore && <div><h2 ref={heading} tabIndex={-1}>{t(locale, "Try it yourself", "Попробовать самостоятельно")}</h2>{explorer}</div>}
    </details>}
  </section>;
}
