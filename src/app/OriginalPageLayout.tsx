import { lazy, Suspense, useEffect, useRef, useState, type ReactNode } from "react";
import { mediaUrl, t, type Locale } from "../shared/contracts";
import films from "../content/films.json";
import previews from "../content/previews.json";
import { activityThumbnail } from "./activityThumbnail";
import { activities, getActivityComponent } from "./registry";
import { timelines } from "../modules/escher/timelines";
import "./OriginalPageLayout.css";

const OriginalTimeline = lazy(() => import("../shared/OriginalTimeline"));

export interface OriginalLayoutNode {
  kind: string;
  source?: string;
  image?: string;
  hover?: string;
  href?: string;
  label?: string;
  text?: string;
  width?: number;
  height?: number;
  colspan?: number;
  rowspan?: number;
  children?: OriginalLayoutNode[];
}

interface LayoutProps {
  nodes: OriginalLayoutNode[];
  locale: Locale;
  reducedMotion: boolean;
  activityReducedMotion: boolean;
  renderImage: (node: OriginalLayoutNode, hover?: string) => ReactNode;
}

/** Large original drawing modules load only as their authored slot approaches. */
function EmbeddedPresentation({ node, locale, reducedMotion, pageReducedMotion }: { node: OriginalLayoutNode; locale: Locale; reducedMotion: boolean; pageReducedMotion: boolean }) {
  const container = useRef<HTMLDivElement>(null);
  const video = useRef<HTMLVideoElement>(null);
  const [visible, setVisible] = useState(false);
  const [inView, setInView] = useState(false);
  const manuallyPaused = useRef(false);
  const [opened, setOpened] = useState(false);
  const activity = activities.find((entry) => entry.sources.includes(node.source ?? ""));
  const film = films.find((entry) => entry.source === node.source);
  const silentLoop = film?.key === "Moeb7";
  const timeline = timelines.find((entry) => activity?.id === entry.id);
  const title = activity ? t(locale, activity.title, activity.titleRu) : node.label ?? "";
  const decorativeSolid = activity && [
    "spatial-dodecahedron", "spatial-octahedron", "spatial-illustrated-cube",
  ].includes(activity.id);
  useEffect(() => {
    if (!container.current) return;
    if (!("IntersectionObserver" in window)) { setVisible(true); setInView(true); return; }
    const observer = new IntersectionObserver((entries) => {
      const intersecting = entries.some((entry) => entry.isIntersecting);
      if (intersecting) setVisible(true);
    }, { rootMargin: "200px" });
    const viewportObserver = new IntersectionObserver((entries) => {
      setInView(entries.some((entry) => entry.isIntersecting));
    });
    observer.observe(container.current);
    viewportObserver.observe(container.current);
    return () => { observer.disconnect(); viewportObserver.disconnect(); };
  }, []);
  useEffect(() => {
    const player = video.current;
    const syncPlayback = () => {
      if (!player) return;
      if (!inView || (silentLoop && pageReducedMotion)) {
        player.pause();
      } else if (silentLoop && !manuallyPaused.current) {
        void player.play().catch(() => { /* Native controls remain available. */ });
      }
    };
    syncPlayback();
    return () => { player?.pause(); };
  }, [visible, inView, silentLoop, pageReducedMotion]);
  if (!activity) return null;
  const Component = opened || (visible && activity.id.startsWith("spatial-")) ? getActivityComponent(activity.family) : null;
  const thumbnail = activityThumbnail(activity, locale, previews);
  const waiting = <div style={{ aspectRatio: `${node.width ?? 550} / ${node.height ?? 400}` }}
    role="status">{visible ? t(locale, "Loading artwork…", "Загрузка картины…") : title}</div>;
  return <div ref={container}
    className={`original-embedded-presentation${activity.id === "motion-circle-in-circle" ? " original-embedded-cycloid" : ""}`}
    style={{ width: node.width ?? 550 }}>
    {film ? <video ref={video} controls playsInline muted loop={silentLoop} preload="none"
      width={node.width} height={node.height}
      src={visible ? mediaUrl(film.src) : undefined}
      poster={silentLoop ? mediaUrl("site-design/Moeb7-poster.png") : undefined}
      onPlay={() => { manuallyPaused.current = false; }}
      onPause={() => {
        if (inView && !pageReducedMotion) manuallyPaused.current = true;
      }}
      aria-label={title} />
      : timeline ? <Suspense fallback={waiting}>
        {visible ? <OriginalTimeline moduleUrl={mediaUrl(`escher/canvas/${timeline.source}.mjs`)}
          startFrame={1} endFrame={timeline.frames} fps={timeline.fps}
          locale={locale} reducedMotion={pageReducedMotion} label={title}
          presentation="loop" active={inView} /> : waiting}
      </Suspense>
      : Component ? <Suspense fallback={<div className="original-embedded-loading"
          style={{ aspectRatio: `${node.width ?? 550} / ${node.height ?? 400}` }}
          role="status">{t(locale, "Loading…", "Загрузка…")}</div>}>
        <Component activityId={activity.id} locale={locale}
          reducedMotion={decorativeSolid ? pageReducedMotion : reducedMotion}
          active={inView} embedded />
      </Suspense>
      : <button type="button" className="original-embedded-open" onClick={() => setOpened(true)}
          style={{ aspectRatio: `${node.width ?? 550} / ${node.height ?? 400}` }}>
        {thumbnail && <img src={mediaUrl(thumbnail)} alt="" loading="lazy" />}
        <span>{t(locale, "Open", "Открыть")} · {title}</span>
      </button>}
  </div>;
}

/** Semantic reconstruction from inert, allowlisted source layout data. */
export function OriginalPageLayout({ nodes, locale, reducedMotion, activityReducedMotion, renderImage }: LayoutProps) {
  const render = (node: OriginalLayoutNode, key: number, hover?: string): ReactNode => {
    const children = node.children?.map((child, index) => render(child, index, node.hover ?? hover));
    switch (node.kind) {
      case "text": return node.text;
      case "break": return <br key={key} />;
      case "image": return <span key={key} className="original-authored-image">{renderImage(node, hover)}</span>;
      case "embed": return <EmbeddedPresentation key={`${key}-${node.source}`} node={node} locale={locale} reducedMotion={activityReducedMotion} pageReducedMotion={reducedMotion} />;
      case "link": {
        const activity = activities.find((entry) => entry.sources.includes(node.source ?? ""));
        const href = activity ? `#/activity/${activity.id}` : node.href;
        // A second runtime guard: neither legacy JS nor unrecognized local files
        // can become a navigation target if generated content is malformed.
        if (!href || (!activity && !/^https:\/\/[^/]+(?:\/|$)/i.test(href))) return <span key={key}>{children}</span>;
        return <a key={key} href={href} target={activity ? undefined : "_blank"}
          aria-label={activity ? t(locale, activity.title, activity.titleRu) : undefined}
          rel={activity ? undefined : "noopener noreferrer"}>{children}</a>;
      }
      case "table": return <table key={key} role="presentation" style={{ width: node.width }}><tbody>{children}</tbody></table>;
      case "tr": return <tr key={key}>{children}</tr>;
      case "td":
      case "th": return <td key={key} colSpan={node.colspan} rowSpan={node.rowspan} style={{ width: node.width }}>{children}</td>;
      case "h1": return <h1 key={key}>{children}</h1>;
      case "h2": return <h2 key={key}>{children}</h2>;
      case "h3": return <h3 key={key}>{children}</h3>;
      case "h4": return <h4 key={key}>{children}</h4>;
      case "p": return <div key={key} className="original-authored-paragraph">{children}</div>;
      default: return <div key={key}>{children}</div>;
    }
  };
  return <div className="original-authored-layout">{nodes.map((node, index) => render(node, index))}</div>;
}
