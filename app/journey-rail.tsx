"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";

export type JourneyStep = {
  step: string;
  title: string;
  body: string;
  shot?: string;
  glyph?: string;
};

// The rail is a sequence, so it needs the controls a sequence implies: arrows to step
// through it, a progress bar showing how far along you are, and dots to jump. Native
// scrolling stays the source of truth — the buttons drive scrollTo, so trackpad, touch
// and keyboard all keep working without a second state machine to fall out of sync.
export function JourneyRail({ steps }: { steps: JourneyStep[] }) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);
  const [progress, setProgress] = useState(0);
  const [atStart, setAtStart] = useState(true);
  const [atEnd, setAtEnd] = useState(false);

  const sync = useCallback(() => {
    const track = trackRef.current;
    if (!track) return;
    const max = track.scrollWidth - track.clientWidth;
    setProgress(max > 0 ? track.scrollLeft / max : 0);
    setAtStart(track.scrollLeft < 8);
    setAtEnd(track.scrollLeft > max - 8);
    const card = track.querySelector<HTMLElement>("[data-card]");
    if (!card) return;
    const stride = card.offsetWidth + 22;
    setActive(Math.min(steps.length - 1, Math.round(track.scrollLeft / stride)));
  }, [steps.length]);

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;
    sync();
    track.addEventListener("scroll", sync, { passive: true });
    window.addEventListener("resize", sync);
    return () => {
      track.removeEventListener("scroll", sync);
      window.removeEventListener("resize", sync);
    };
  }, [sync]);

  const scrollToCard = (index: number) => {
    const track = trackRef.current;
    const card = track?.querySelector<HTMLElement>("[data-card]");
    if (!track || !card) return;
    track.scrollTo({ left: index * (card.offsetWidth + 22), behavior: "smooth" });
  };

  const nudge = (direction: 1 | -1) =>
    scrollToCard(Math.max(0, Math.min(steps.length - 1, active + direction)));

  return (
    <div className="journey">
      <div className="journey-controls page-shell">
        <div className="journey-progress" role="presentation">
          <span style={{ transform: `scaleX(${Math.max(0.06, progress || 0.06)})` }} />
        </div>
        <div className="journey-buttons">
          <button type="button" aria-label="Previous step" onClick={() => nudge(-1)} disabled={atStart}>←</button>
          <button type="button" aria-label="Next step" onClick={() => nudge(1)} disabled={atEnd}>→</button>
        </div>
      </div>

      <div className="journey-track" ref={trackRef}>
        {steps.map((item, i) => (
          <article
            className={`journey-card${i === active ? " is-active" : ""}`}
            data-card
            key={item.title}
            aria-current={i === active ? "step" : undefined}
          >
            <div className="journey-art">
              {item.shot
                ? <Image src={item.shot} alt="" width={1179} height={2556} sizes="(max-width: 850px) 78vw, 340px" />
                : <span className="journey-glyph" aria-hidden="true">{item.glyph}</span>}
            </div>
            <div className="journey-copy">
              {item.step ? <span className="journey-badge">{item.step}</span> : null}
              <span className="journey-number">{String(i + 1).padStart(2, "0")}</span>
              <h3>{item.title}</h3>
              <p>{item.body}</p>
            </div>
          </article>
        ))}
      </div>

      <div className="journey-dots page-shell">
        {steps.map((item, i) => (
          <button
            type="button"
            key={item.title}
            className={i === active ? "is-active" : undefined}
            aria-label={`Step ${i + 1}: ${item.title}`}
            aria-current={i === active ? "step" : undefined}
            onClick={() => scrollToCard(i)}
          />
        ))}
      </div>
    </div>
  );
}
