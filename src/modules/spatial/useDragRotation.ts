import { useEffect, useRef } from "react";
import type { PointerEvent } from "react";

/** Direct inspection gesture; animation and angle state remain owned by the view. */
export function useDragRotation(turn: number, tilt: number, rotate: (turn: number, tilt: number) => void, currentAngles?: () => { turn: number; tilt: number }) {
  const gesture = useRef<{ id: number; x: number; y: number; turn: number; tilt: number; node: Element } | null>(null);
  const finish = () => {
    const current = gesture.current;
    gesture.current = null;
    if (current?.node.hasPointerCapture(current.id)) current.node.releasePointerCapture(current.id);
  };
  useEffect(() => {
    const visibility = () => { if (document.hidden) finish(); };
    document.addEventListener("visibilitychange", visibility);
    return () => { document.removeEventListener("visibilitychange", visibility); finish(); };
  }, []);
  return {
    onPointerDown: (event: PointerEvent<Element>) => {
      if (gesture.current || !event.isPrimary || event.button !== 0) return;
      const angles = currentAngles?.() ?? { turn, tilt };
      gesture.current = { id: event.pointerId, x: event.clientX, y: event.clientY, ...angles, node: event.currentTarget };
      event.currentTarget.setPointerCapture(event.pointerId);
      rotate(angles.turn, angles.tilt);
    },
    onPointerMove: (event: PointerEvent<Element>) => {
      const current = gesture.current;
      if (!current || current.id !== event.pointerId) return;
      rotate(current.turn + (event.clientX - current.x) * .6, current.tilt - (event.clientY - current.y) * .6);
    },
    onPointerUp: (event: PointerEvent<Element>) => { if (gesture.current?.id === event.pointerId) finish(); },
    onPointerCancel: finish,
    onLostPointerCapture: finish,
  };
}
