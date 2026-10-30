import { useEffect, useLayoutEffect, useRef, useState } from "react";
import type { ActivityProps } from "../../shared/contracts";
import { mediaUrl, t } from "../../shared/contracts";
import content from "./content.json";
import { manifest } from "./manifest";
import "./reader.css";

export default function Books(props: ActivityProps) {
  const book = content.find(item => `books-${item.key.toLowerCase()}` === props.activityId);
  if (!book || !manifest.some(item => item.id === props.activityId)) {
    return <p className="activity-note">{t(props.locale, "This book is not available in the reader.", "Эта книга недоступна для чтения.")}</p>;
  }
  return <Reader key={book.key} book={book} locale={props.locale} />;
}

function Reader({ book, locale }: { book: typeof content[number]; locale: ActivityProps["locale"] }) {
  const [pageIndex, setPageIndex] = useState(0);
  const [zoom, setZoom] = useState(100);
  const [failedImage, setFailedImage] = useState<string | null>(null);
  const [loadedImage, setLoadedImage] = useState<string | null>(null);
  const [fullscreen, setFullscreen] = useState(false);
  const [fullscreenPending, setFullscreenPending] = useState(false);
  const [fullscreenError, setFullscreenError] = useState(false);
  const [viewportSize, setViewportSize] = useState({ width: 0, height: 0 });
  const [imageSize, setImageSize] = useState({ width: 3, height: 4 });
  const reader = useRef<HTMLElement>(null);
  const fullscreenButton = useRef<HTMLButtonElement>(null);
  const viewport = useRef<HTMLDivElement>(null);
  const pageBody = useRef<HTMLDivElement>(null);
  const savedScroll = useRef<{ top: number; left: number; fullscreen: boolean } | null>(null);
  const normalScroll = useRef({ top: 0, left: 0 });
  const wasFullscreen = useRef(false);
  const reservedHeight = useRef(0);
  const preloaded = useRef(new Map<string, HTMLImageElement>());
  const pointer = useRef<{ x: number; y: number; dragged: boolean } | null>(null);
  const page = book.pages[pageIndex];
  useEffect(() => {
    // Retain only three scans in either direction, not the entire book.
    const wanted = new Set(book.pages
      .slice(Math.max(0, pageIndex - 3), pageIndex + 4)
      .map(item => item.image)
      .filter(image => image && image !== page.image));
    for (const [source, image] of preloaded.current) {
      if (!wanted.has(source)) {
        image.removeAttribute("src");
        preloaded.current.delete(source);
      }
    }
    for (const source of wanted) {
      if (preloaded.current.has(source)) continue;
      const image = new Image();
      image.decoding = "async";
      image.fetchPriority = "low";
      image.src = mediaUrl(source);
      preloaded.current.set(source, image);
    }
  }, [book, pageIndex, page.image]);
  useEffect(() => {
    const images = preloaded.current;
    return () => {
      for (const image of images.values()) image.removeAttribute("src");
      images.clear();
    };
  }, []);
  useEffect(() => {
    const element = reader.current;
    const changed = () => {
      pointer.current = null;
      setFullscreen(document.fullscreenElement === element);
    };
    document.addEventListener("fullscreenchange", changed);
    return () => {
      document.removeEventListener("fullscreenchange", changed);
      if (element && document.fullscreenElement === element) {
        void document.exitFullscreen().catch(() => { /* The browser may already be exiting. */ });
      }
    };
  }, []);
  useLayoutEffect(() => {
    if (fullscreen) {
      viewport.current?.focus({ preventScroll: true });
    } else if (wasFullscreen.current) {
      fullscreenButton.current?.focus({ preventScroll: true });
      window.scrollTo({ ...normalScroll.current, behavior: "instant" });
    }
    wasFullscreen.current = fullscreen;
  }, [fullscreen]);
  useLayoutEffect(() => {
    if (!fullscreen || !viewport.current) return;
    const element = viewport.current;
    const measure = () => {
      const width = element.clientWidth, height = element.clientHeight;
      setViewportSize(previous => previous.width === width && previous.height === height
        ? previous : { width, height });
    };
    const observer = new ResizeObserver(measure);
    observer.observe(element);
    measure();
    return () => observer.disconnect();
  }, [fullscreen]);
  const toggleFullscreen = async () => {
    const element = reader.current;
    if (!element || fullscreenPending) return;
    setFullscreenError(false);
    setFullscreenPending(true);
    try {
      if (document.fullscreenElement === element) {
        await document.exitFullscreen();
      } else {
        normalScroll.current = { top: window.scrollY, left: window.scrollX };
        await element.requestFullscreen();
      }
    } catch {
      if (reader.current === element) setFullscreenError(true);
    } finally {
      if (reader.current === element) setFullscreenPending(false);
    }
  };
  const move = (index: number) => {
    const next = Math.max(0, Math.min(book.pages.length - 1, index));
    if (next === pageIndex) return;
    savedScroll.current = fullscreen
      ? { top: viewport.current?.scrollTop ?? 0, left: viewport.current?.scrollLeft ?? 0, fullscreen: true }
      : { top: window.scrollY, left: window.scrollX, fullscreen: false };
    // Retain page extent during loading without putting normal reading in a scroll box.
    reservedHeight.current = pageBody.current?.getBoundingClientRect().height ?? 0;
    setPageIndex(next);
  };
  useLayoutEffect(() => {
    const saved = savedScroll.current;
    if (!saved) return;
    if (saved.fullscreen === fullscreen) {
      const options = { top: saved.top, left: saved.left, behavior: "instant" as const };
      if (fullscreen) viewport.current?.scrollTo(options);
      else window.scrollTo(options);
    }
    if (loadedImage === page.image || failedImage === page.image) savedScroll.current = null;
  }, [pageIndex, loadedImage, failedImage, fullscreen, page.image]);
  const fitWidth = Math.min(viewportSize.width, viewportSize.height * imageSize.width / imageSize.height);
  const pageWidth = fullscreen && fitWidth > 0 ? fitWidth * zoom / 100 : `${zoom}%`;
  const pageWord = t(locale, "Page", "Страница");
  const pageLabel = (index: number) => {
    if (index === 0) return t(locale, "Cover", "Обложка");
    // These four folios were verified in the recovered nested documents.
    if (book.key === "Mathbook-SATsubstit") {
      return `${t(locale, "Printed page", "Печатная страница")} ${[13, 14, 15, 20][index - 1]}`;
    }
    // Other scans do not have consistently verified printed folios: use reader order.
    return `${pageWord} ${index + 1}`;
  };
  return <section ref={reader} className="activity-layout books-reader" aria-label={t(locale, "Book reader", "Чтение книги")}>
    <nav className="controls" aria-label={t(locale, "Reading controls", "Управление чтением")}>
      <button className="button button-secondary" disabled={pageIndex === 0} onClick={() => move(pageIndex - 1)}>{t(locale, "← Previous", "← Назад")}</button>
      <label className="control">{pageWord}
        <select value={pageIndex} onChange={event => move(Number(event.target.value))}>
          {book.pages.map((_, index) => <option key={index} value={index}>{pageLabel(index)}</option>)}
        </select>
      </label>
      <button className="button" disabled={pageIndex === book.pages.length - 1} onClick={() => move(pageIndex + 1)}>{t(locale, "Next →", "Вперёд →")}</button>
      <label className="control">{t(locale, "Zoom", "Масштаб")}
        <select value={zoom} onChange={event => setZoom(Number(event.target.value))}>
          {[100, 125, 150, 200, 250].map(value => <option key={value} value={value}>{value}%</option>)}
        </select>
      </label>
      <button ref={fullscreenButton} type="button" className="button button-secondary"
        aria-pressed={fullscreen} disabled={fullscreenPending} onClick={() => void toggleFullscreen()}>
        <span aria-hidden="true">{fullscreen ? "⤡" : "⛶"}</span>
        {fullscreen ? t(locale, "Exit full screen", "Выйти из полного экрана") : t(locale, "Full screen", "На весь экран")}
      </button>
    </nav>
    <p className="activity-status" role="status">{pageWord} {pageIndex + 1} / {book.pages.length}{pageIndex === 0 || book.key === "Mathbook-SATsubstit" ? ` · ${pageLabel(pageIndex)}` : ""}</p>
    <p className="books-reader__hint">{t(locale,
      "Click the left or right half of a page to turn it. Keyboard: ← / →, Home / End.",
      "Нажмите левую или правую половину страницы, чтобы перелистнуть. Клавиши: ← / →, Home / End.")}</p>
    {fullscreenError && <p className="activity-note" role="alert">{t(locale,
      "Full screen is unavailable. You can still zoom and scroll the page here.",
      "Полноэкранный режим недоступен. Здесь по-прежнему можно увеличить и прокрутить страницу.")}</p>}
    <div ref={viewport} className="books-reader__viewport" tabIndex={0} role="region"
      aria-label={t(locale, "Scanned page; arrow keys turn pages", "Скан страницы; стрелки листают страницы")}
      onKeyDown={event => {
        if (event.altKey || event.ctrlKey || event.metaKey) return;
        const destination = event.key === "ArrowLeft" ? pageIndex - 1 : event.key === "ArrowRight" ? pageIndex + 1 :
          event.key === "Home" ? 0 : event.key === "End" ? book.pages.length - 1 : null;
        if (destination !== null) { event.preventDefault(); move(destination); }
      }}
      onPointerDown={event => {
        pointer.current = event.isPrimary && event.button === 0
          ? { x: event.clientX, y: event.clientY, dragged: false } : null;
      }}
      onPointerMove={event => {
        const start = pointer.current;
        if (start && Math.hypot(event.clientX - start.x, event.clientY - start.y) > 8) start.dragged = true;
      }}
      onPointerCancel={() => { pointer.current = null; }}
      onClick={event => {
        const start = pointer.current;
        pointer.current = null;
        if (!start || start.dragged || !event.detail || !(event.target instanceof HTMLImageElement)
          || Math.hypot(event.clientX - start.x, event.clientY - start.y) > 8
          || window.getSelection()?.toString()) return;
        const bounds = event.target.getBoundingClientRect();
        move(pageIndex + (event.clientX < bounds.left + bounds.width / 2 ? -1 : 1));
      }}>
      <div ref={pageBody} className="books-reader__page" style={{
        width: pageWidth,
        minHeight: loadedImage !== page.image && failedImage !== page.image ? reservedHeight.current : undefined,
      }}>
        {page.image && failedImage !== page.image ? <img key={page.image}
          src={mediaUrl(page.image)} style={{ aspectRatio: `auto ${imageSize.width} / ${imageSize.height}` }}
          alt={`${pageLabel(pageIndex)}. ${t(locale, "Original scanned mathematics page; text transcription is unavailable.", "Оригинальный скан математической страницы; текстовая расшифровка недоступна.")}`}
          draggable={false} decoding="async" onLoad={event => {
            const image = event.currentTarget;
            setImageSize({ width: image.naturalWidth, height: image.naturalHeight });
            setLoadedImage(page.image);
          }}
          onError={() => { setFailedImage(page.image); setLoadedImage(page.image); }} /> :
          <p role="alert">{t(locale, "This page image could not be loaded.", "Не удалось загрузить страницу.")}{" "}
            <button type="button" onClick={() => setFailedImage(null)}>{t(locale, "Try again", "Попробовать ещё раз")}</button>
          </p>}
      </div>
    </div>
  </section>;
}
