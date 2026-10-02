"use client";

import { useEffect } from "react";

// Tactile feedback for buttons marked with the `press-fx` class: a ripple grows
// from the exact point that was pressed (styled in refine.css). One delegated
// listener serves every button, so pages only need to add the class.
export function PressEffect() {
  useEffect(() => {
    const onPress = (event: PointerEvent) => {
      if (event.button !== 0) return;
      const target = (event.target as Element | null)?.closest<HTMLElement>(".press-fx");
      if (!target || target.matches(":disabled, [aria-disabled='true']")) return;
      const box = target.getBoundingClientRect();
      const size = Math.hypot(box.width, box.height) * 2;
      target.style.setProperty("--press-x", `${event.clientX - box.left}px`);
      target.style.setProperty("--press-y", `${event.clientY - box.top}px`);
      target.style.setProperty("--press-size", `${size}px`);
      // Restart the ripple even when pressed again quickly.
      target.classList.remove("is-rippling");
      void target.offsetWidth;
      target.classList.add("is-rippling");
    };
    const onEnd = (event: AnimationEvent) => {
      if (event.animationName === "press-ripple") (event.target as HTMLElement).classList.remove("is-rippling");
    };
    document.addEventListener("pointerdown", onPress, { passive: true });
    document.addEventListener("animationend", onEnd);
    return () => { document.removeEventListener("pointerdown", onPress); document.removeEventListener("animationend", onEnd); };
  }, []);
  return null;
}
