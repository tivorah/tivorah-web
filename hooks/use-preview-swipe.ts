"use client";

import { useRef, useState, type PointerEvent } from "react";

type Gesture = {
  id: number;
  x: number;
  y: number;
  axis: "pending" | "horizontal" | "vertical";
};

/** Leaves vertical gestures and pinch zoom to the browser. */
export function usePreviewSwipe(onMove: (direction: number) => void) {
  const gesture = useRef<Gesture | null>(null);
  const [dragging, setDragging] = useState(false);
  const [offset, setOffset] = useState(0);

  const reset = () => {
    gesture.current = null;
    setDragging(false);
    setOffset(0);
  };

  return {
    dragging,
    offset,
    handlers: {
      onPointerDown(event: PointerEvent<HTMLDivElement>) {
        if (!event.isPrimary || event.button !== 0) return;
        gesture.current = { id: event.pointerId, x: event.clientX, y: event.clientY, axis: "pending" };
        event.currentTarget.setPointerCapture(event.pointerId);
        setDragging(true);
      },
      onPointerMove(event: PointerEvent<HTMLDivElement>) {
        const start = gesture.current;
        if (!start || start.id !== event.pointerId) return;
        const dx = event.clientX - start.x;
        const dy = event.clientY - start.y;
        if (start.axis === "pending" && Math.max(Math.abs(dx), Math.abs(dy)) >= 8) {
          start.axis = Math.abs(dx) > Math.abs(dy) * 1.15 ? "horizontal" : "vertical";
        }
        if (start.axis === "horizontal") {
          setOffset(Math.max(-100, Math.min(100, dx * 0.65)));
        }
      },
      onPointerUp(event: PointerEvent<HTMLDivElement>) {
        const start = gesture.current;
        if (!start || start.id !== event.pointerId) return;
        const dx = event.clientX - start.x;
        const dy = event.clientY - start.y;
        const threshold = Math.max(24, Math.min(40, event.currentTarget.clientWidth * 0.07));
        if (start.axis !== "vertical" && Math.abs(dx) >= threshold && Math.abs(dx) > Math.abs(dy) * 1.15) {
          onMove(dx < 0 ? 1 : -1);
        }
        reset();
        if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
      },
      onPointerCancel: reset,
      onLostPointerCapture: reset,
    },
  };
}
