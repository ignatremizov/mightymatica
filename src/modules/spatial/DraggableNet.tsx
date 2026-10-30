import { useEffect, useRef, useState } from "react";
import type { PointerEvent } from "react";
import { t } from "../../shared/contracts";
import type { Locale } from "../../shared/contracts";
import type { Cell } from "./rules";
import { netFaceUrl } from "./NetArtwork";
import type { NetFaceArtwork } from "./NetArtwork";

interface Props {
  cells: Cell[];
  labels: number[];
  colors: string[];
  artwork: NetFaceArtwork[];
  locale: Locale;
  selected: number | null;
  onSelect: (index: number) => void;
  onSwap: (first: number, second: number) => void;
}

/** The recovered Cubenetslide interaction swaps the dragged face with its drop slot. */
export function DraggableNet({ cells, labels, colors, artwork, locale, selected, onSelect, onSwap }: Props) {
  const root = useRef<HTMLDivElement>(null);
  const drag = useRef<{ id: number; index: number; x: number; y: number; moved: boolean; node: HTMLButtonElement } | null>(null);
  const suppressClick = useRef(false);
  const [dragging, setDragging] = useState(false);
  const clear = () => {
    const current = drag.current;
    drag.current = null;
    if (current) {
      current.node.style.transform = "";
      current.node.style.zIndex = "";
      if (current.node.hasPointerCapture(current.id)) current.node.releasePointerCapture(current.id);
    }
    setDragging(false);
  };
  useEffect(() => {
    const cancel = () => { if (document.hidden) clear(); };
    document.addEventListener("visibilitychange", cancel);
    return () => {
      document.removeEventListener("visibilitychange", cancel);
      const current = drag.current;
      drag.current = null;
      if (current?.node.hasPointerCapture(current.id)) current.node.releasePointerCapture(current.id);
    };
  }, []);
  const move = (event: PointerEvent<HTMLButtonElement>) => {
    const current = drag.current;
    if (!current || current.id !== event.pointerId) return;
    const dx = event.clientX - current.x, dy = event.clientY - current.y;
    if (!current.moved && Math.hypot(dx, dy) < 6) return;
    current.moved = true;
    current.node.style.transform = `translate(${dx}px, ${dy}px)`;
    current.node.style.zIndex = "1";
    setDragging(true);
  };
  const release = (event: PointerEvent<HTMLButtonElement>) => {
    const current = drag.current;
    if (!current || current.id !== event.pointerId) return;
    if (current.moved) {
      suppressClick.current = true;
      // Test stationary slot bounds, not the translated face under the pointer.
      const buttons = root.current?.querySelectorAll<HTMLButtonElement>("[data-net-face]");
      const target = buttons && [...buttons].find(node => {
        if (node === current.node) return false;
        const rect = node.getBoundingClientRect();
        return event.clientX >= rect.left && event.clientX <= rect.right &&
          event.clientY >= rect.top && event.clientY <= rect.bottom;
      });
      if (target) onSwap(current.index, Number(target.dataset.netFace));
    }
    clear();
  };
  return <div ref={root} className={`spatial-net spatial-draggable-net${dragging ? " is-dragging" : ""}`}
    style={{ gridTemplateColumns: `repeat(${Math.max(...cells.map(c => c[0])) + 1}, 2.8rem)`, gridTemplateRows: `repeat(${Math.max(...cells.map(c => c[1])) + 1}, 2.8rem)` }}
    onKeyDown={event => { if (event.key === "Escape") { suppressClick.current = true; clear(); } }}>
    {cells.map(([x, y], index) => <button key={index} type="button" data-net-face={index}
      className="spatial-face" style={{ gridColumn: x + 1, gridRow: y + 1, background: colors[labels[index] - 1] }}
      aria-label={t(locale, `Face ${labels[index]}, column ${x + 1}, row ${y + 1}`, `Грань ${labels[index]}, столбец ${x + 1}, строка ${y + 1}`)}
      aria-pressed={selected === index}
      onPointerDown={event => {
        if (drag.current || !event.isPrimary || event.button !== 0) return;
        suppressClick.current = false;
        drag.current = { id: event.pointerId, index, x: event.clientX, y: event.clientY, moved: false, node: event.currentTarget };
        event.currentTarget.setPointerCapture(event.pointerId);
      }}
      onPointerMove={move} onPointerUp={release}
      onPointerCancel={() => { suppressClick.current = true; clear(); }}
      onLostPointerCapture={() => { if (drag.current) clear(); }}
      onClick={event => {
        if (suppressClick.current && event.detail !== 0) { suppressClick.current = false; return; }
        onSelect(index);
      }}>{(() => {
        const face=artwork[labels[index]-1];
        return <img src={netFaceUrl(face)} alt="" draggable={false} style={{
          left:`${(face.origin.x+20)*2.5}%`,top:`${(face.origin.y+20)*2.5}%`,
          width:`${face.bounds.width*2.5}%`,height:`${face.bounds.height*2.5}%`,
        }}/>;
      })()}</button>)}
  </div>;
}
