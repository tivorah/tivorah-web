"use client";
import { useCallback, useEffect, useRef, useState, type CSSProperties, type KeyboardEvent, type PointerEvent } from "react";

// Drag-to-reorder for a vertical list, by touch or mouse, from a drag handle. The picked-up row
// follows the finger while the others slide out of its way; letting go drops it there. Arrow keys
// on the handle move a row too, and every move is announced for screen readers.

type Drag = { from: number; to: number; offset: number; room: number };
type Session = { from: number; startY: number; tops: number[]; heights: number[]; gap: number; pointerY: number };

const EDGE = 72;

export function useSortable({ count, onMove, describe }: { count: number; onMove: (from: number, to: number) => void; describe: (index: number) => string }) {
  const listRef = useRef<HTMLOListElement | null>(null);
  const session = useRef<Session | null>(null);
  const frame = useRef(0);
  const focusAfterMove = useRef<number | null>(null);
  const [drag, setDragState] = useState<Drag | null>(null);
  const dragRef = useRef<Drag | null>(null);
  const setDrag = useCallback((next: Drag | null) => { dragRef.current = next; setDragState(next); }, []);
  const [announcement, setAnnouncement] = useState("");

  const target = useCallback((current: Session, y: number) => {
    const offset = y - current.startY;
    const centre = current.tops[current.from] + offset + current.heights[current.from] / 2;
    let to = current.from;
    for (let index = 0; index < current.tops.length; index += 1) {
      const middle = current.tops[index] + current.heights[index] / 2;
      if (index < current.from && centre < middle) { to = index; break; }
      if (index > current.from && centre > middle) to = index;
    }
    return { offset, to };
  }, []);

  const update = useCallback(() => {
    const current = session.current;
    if (!current) return;
    const { offset, to } = target(current, current.pointerY + window.scrollY);
    setDrag({ from: current.from, to, offset, room: current.heights[current.from] + current.gap });
  }, [setDrag, target]);

  // Scrolls the page while a row is held near the top or bottom edge of the screen.
  const autoScroll = useCallback(() => {
    const current = session.current;
    if (!current) return;
    const { pointerY } = current;
    const speed = pointerY < EDGE ? -(EDGE - pointerY) / 4 : pointerY > window.innerHeight - EDGE ? (pointerY - (window.innerHeight - EDGE)) / 4 : 0;
    if (speed) { window.scrollBy(0, speed); update(); }
    frame.current = requestAnimationFrame(autoScroll);
  }, [update]);

  const finish = useCallback((commit: boolean) => {
    const state = dragRef.current;
    cancelAnimationFrame(frame.current);
    session.current = null;
    setDrag(null);
    if (commit && state && state.to !== state.from) {
      onMove(state.from, state.to);
      setAnnouncement(`${describe(state.from)} moved to position ${state.to + 1} of ${count}.`);
    }
  }, [count, describe, onMove, setDrag]);

  useEffect(() => () => cancelAnimationFrame(frame.current), []);
  // iPhone Safari starts scrolling the page under a finger (and cancels the drag) unless touch
  // events are stopped by a non-passive listener; React's touch handlers are passive.
  useEffect(() => {
    const onHandle = (event: TouchEvent) => event.target instanceof Element && !!event.target.closest("[data-sort-handle]") && !!listRef.current?.contains(event.target);
    const start = (event: TouchEvent) => { if (onHandle(event)) event.preventDefault(); };
    const move = (event: TouchEvent) => { if (session.current) event.preventDefault(); };
    document.addEventListener("touchstart", start, { passive: false });
    document.addEventListener("touchmove", move, { passive: false });
    return () => { document.removeEventListener("touchstart", start); document.removeEventListener("touchmove", move); };
  }, []);
  useEffect(() => {
    if (focusAfterMove.current === null) return;
    listRef.current?.querySelectorAll<HTMLElement>("[data-sort-handle]")[focusAfterMove.current]?.focus();
    focusAfterMove.current = null;
  });

  const handleProps = (index: number) => ({
    "data-sort-handle": "",
    "aria-label": `Reorder ${describe(index)}. Drag, or use the arrow keys.`,
    "aria-roledescription": "drag handle",
    onPointerDown: (event: PointerEvent<HTMLElement>) => {
      if (event.button !== 0 || !listRef.current) return;
      event.preventDefault();
      event.currentTarget.setPointerCapture(event.pointerId);
      const rows = [...listRef.current.children].filter((row): row is HTMLElement => row instanceof HTMLElement && row.dataset.sortItem !== undefined);
      const rects = rows.map((row) => row.getBoundingClientRect());
      session.current = {
        from: index,
        startY: event.clientY + window.scrollY,
        tops: rects.map((rect) => rect.top + window.scrollY),
        heights: rects.map((rect) => rect.height),
        gap: rects.length > 1 ? rects[1].top - rects[0].bottom : 0,
        pointerY: event.clientY,
      };
      navigator.vibrate?.(8);
      setDrag({ from: index, to: index, offset: 0, room: session.current.heights[index] + session.current.gap });
      frame.current = requestAnimationFrame(autoScroll);
    },
    onPointerMove: (event: PointerEvent<HTMLElement>) => {
      if (!session.current) return;
      session.current.pointerY = event.clientY;
      update();
    },
    onPointerUp: () => finish(true),
    onPointerCancel: () => finish(false),
    onKeyDown: (event: KeyboardEvent<HTMLElement>) => {
      const to = event.key === "ArrowUp" ? index - 1 : event.key === "ArrowDown" ? index + 1 : null;
      if (to === null) return;
      event.preventDefault();
      if (to < 0 || to >= count) return;
      onMove(index, to);
      focusAfterMove.current = to;
      setAnnouncement(`${describe(index)} moved to position ${to + 1} of ${count}.`);
    },
  });

  // Where each row sits during a drag: the held row follows the pointer, rows it passes make room.
  const itemStyle = (index: number): CSSProperties | undefined => {
    if (!drag) return undefined;
    if (index === drag.from) return { transform: `translateY(${drag.offset}px)`, transition: "none", zIndex: 2, position: "relative" };
    if (drag.from < drag.to && index > drag.from && index <= drag.to) return { transform: `translateY(${-drag.room}px)` };
    if (drag.from > drag.to && index < drag.from && index >= drag.to) return { transform: `translateY(${drag.room}px)` };
    return { transform: "translateY(0)" };
  };

  return {
    listRef,
    dragging: drag?.from ?? null,
    itemProps: (index: number) => ({ "data-sort-item": "", style: itemStyle(index), "data-dragging": drag?.from === index ? "" : undefined }),
    handleProps,
    announcement,
  };
}

/** Moves one entry of a list to a new position. */
export const moveItem = <T,>(list: T[], from: number, to: number) => {
  const next = [...list];
  const [item] = next.splice(from, 1);
  next.splice(to, 0, item);
  return next;
};
