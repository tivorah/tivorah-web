"use client";

import { useEffect, useRef, useState } from "react";
import { rollAmount } from "../../lib/ticket-pricing";

const DURATION_MS = 260;

// Rolls a price to its new value when it changes. Only the number moves; the layout stays still.
// Reduced-motion users see the new value immediately.
export function AnimatedMoney({ cents, format }: { cents: number; format: (cents: number) => string }) {
  const [shown, setShown] = useState(cents);
  // Restarts the brief emphasis each time the amount changes.
  const [bump, setBump] = useState(0);
  // The value on screen, so a change mid-roll continues from where the number is.
  const current = useRef(cents);
  const frame = useRef<number | null>(null);

  useEffect(() => {
    const start = current.current;
    if (start === cents) return;
    setBump((value) => value + 1);
    const show = (value: number) => { current.current = value; setShown(value); };
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) { show(cents); return; }
    const began = performance.now();
    const step = (now: number) => {
      const progress = (now - began) / DURATION_MS;
      show(rollAmount(start, cents, progress));
      if (progress < 1) frame.current = requestAnimationFrame(step);
    };
    frame.current = requestAnimationFrame(step);
    return () => { if (frame.current) cancelAnimationFrame(frame.current); };
  }, [cents]);

  // Screen readers hear only the final amount, never the intermediate roll.
  return <span className="animated-money"><span key={bump} className={bump ? "animated-money-value is-changed" : "animated-money-value"} aria-hidden="true">{format(shown)}</span><span className="sr-only">{format(cents)}</span></span>;
}
