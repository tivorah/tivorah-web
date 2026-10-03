"use client";
import { useEffect, type RefObject } from "react";
import { keyboardInset, shouldDismissSheet } from "../lib/sheet-gesture";

const isPhoneSheet = () => window.matchMedia("(max-width: 760px)").matches;

/**
 * Instagram-style behaviour for bottom sheets on phone widths:
 * - drag the grab handle down to close (springs back otherwise);
 * - keep the sheet above the on-screen keyboard where the browser does not resize
 *   the layout viewport (iOS Safari), so focused fields stay visible.
 */
export function useSheetGestures(sheet: RefObject<HTMLElement | null>, handle: RefObject<HTMLElement | null>, open: boolean, onClose: () => void) {
  useEffect(() => {
    const element = sheet.current;
    const grip = handle.current;
    if (!open || !element || !grip) return;
    let start: { y: number; at: number } | null = null;
    let dy = 0;
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const down = (event: PointerEvent) => {
      if (!isPhoneSheet() || event.button !== 0) return;
      start = { y: event.clientY, at: performance.now() };
      dy = 0;
      grip.setPointerCapture(event.pointerId);
      element.style.transition = "none";
    };
    const move = (event: PointerEvent) => {
      if (!start) return;
      dy = Math.max(0, event.clientY - start.y);
      element.style.transform = `translateY(${dy}px)`;
    };
    const up = () => {
      if (!start) return;
      const velocity = dy / Math.max(1, performance.now() - start.at);
      start = null;
      element.style.transition = reduceMotion ? "none" : "transform .22s cubic-bezier(.2,.8,.2,1)";
      if (shouldDismissSheet(dy, velocity)) {
        element.style.transform = "translateY(100%)";
        window.setTimeout(onClose, reduceMotion ? 0 : 180);
      } else {
        element.style.transform = "";
      }
    };

    const viewport = window.visualViewport;
    const lift = () => {
      if (!viewport || !isPhoneSheet()) { element.style.bottom = ""; return; }
      const inset = keyboardInset(window.innerHeight, viewport.height, viewport.offsetTop);
      element.style.bottom = inset ? `${inset}px` : "";
    };

    grip.addEventListener("pointerdown", down);
    grip.addEventListener("pointermove", move);
    grip.addEventListener("pointerup", up);
    grip.addEventListener("pointercancel", up);
    viewport?.addEventListener("resize", lift);
    viewport?.addEventListener("scroll", lift);
    lift();
    return () => {
      grip.removeEventListener("pointerdown", down);
      grip.removeEventListener("pointermove", move);
      grip.removeEventListener("pointerup", up);
      grip.removeEventListener("pointercancel", up);
      viewport?.removeEventListener("resize", lift);
      viewport?.removeEventListener("scroll", lift);
      element.style.transform = "";
      element.style.transition = "";
      element.style.bottom = "";
    };
  }, [sheet, handle, open, onClose]);
}
