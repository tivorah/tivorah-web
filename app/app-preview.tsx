"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";

const previews = [
  {
    label: "Hubs",
    kicker: "Community that feels close",
    title: "Belong somewhere useful.",
    body: "Find a Hub around your interests, culture or city. Share advice, make plans and get to know the people in it.",
    image: "/app-screens/2026-09-22/hubs.png",
    notes: ["Discover Hubs by interest and location", "Conversations, announcements and opportunities", "Clear rules before you join"],
  },
  {
    label: "People",
    kicker: "A first connection",
    title: "Someone worth saying hello to.",
    body: "Discover people nearby, find shared interests and send a connection request. Keep your friends and conversations close.",
    image: "/preview-discover-current-ios.png",
    notes: ["People and public profiles", "Friends and connection requests", "Direct messages when you connect"],
  },
  {
    label: "Events",
    kicker: "Make plans together",
    title: "Find something to do nearby.",
    body: "Browse nearby experiences, filter by mood or date and find reasons to step out with people around you.",
    image: "/app-screens/2026-09-22/events.png",
    notes: ["Local event discovery", "Useful date and category filters", "Tickets and secure QR entry"],
  },
  {
    label: "Shop",
    kicker: "Local finds and skills",
    title: "Buy, sell and book nearby.",
    body: "Buy or sell new and used local items, find a service provider or offer your services. Message directly to arrange the details.",
    image: "/app-screens/2026-09-22/shop.png",
    notes: ["New and used local items", "Find or offer services", "Message buyers and sellers"],
  },
  {
    label: "Messages",
    kicker: "Conversations with context",
    title: "Keep talking.",
    body: "Continue conversations with friends, sellers and people you meet through Tivorah in one calm, private inbox.",
    image: "/app-screens/2026-09-22/messages.png",
    notes: ["Real profile avatars", "Private one-to-one chat", "Friends and connection requests"],
  },
];

export function AppPreview() {
  const [activeIndex, setActiveIndex] = useState(0);
  const active = previews[activeIndex];
  const sectionRef = useRef<HTMLElement>(null);
  const gesture = useRef<{ id: number; x: number; y: number } | null>(null);
  const [paused, setPaused] = useState(false);
  const [focused, setFocused] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [visible, setVisible] = useState(false);
  const [pageVisible, setPageVisible] = useState(true);
  const [reducedMotion, setReducedMotion] = useState(true);
  const [direction, setDirection] = useState(1);

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const updateMotion = () => setReducedMotion(media.matches);
    const updateVisibility = () => setPageVisible(!document.hidden);
    updateMotion(); updateVisibility();
    media.addEventListener("change", updateMotion);
    document.addEventListener("visibilitychange", updateVisibility);
    const observer = new IntersectionObserver(([entry]) => setVisible(entry.isIntersecting), { threshold: 0.15 });
    if (sectionRef.current) observer.observe(sectionRef.current);
    return () => {
      media.removeEventListener("change", updateMotion);
      document.removeEventListener("visibilitychange", updateVisibility);
      observer.disconnect();
    };
  }, []);

  const rotating = !paused && !focused && !dragging && visible && pageVisible && !reducedMotion;
  useEffect(() => {
    if (!rotating) return;
    const timer = window.setTimeout(() => {
      setDirection(1);
      setActiveIndex(index => (index + 1) % previews.length);
    }, 7000);
    return () => window.clearTimeout(timer);
  }, [activeIndex, rotating]);

  const move = (delta: number) => {
    setDirection(delta);
    setActiveIndex(index => (index + delta + previews.length) % previews.length);
  };

  const tabs = useRef<(HTMLButtonElement | null)[]>([]);
  const selectTab = (index: number) => {
    setDirection(index >= activeIndex ? 1 : -1);
    setActiveIndex(index);
    tabs.current[index]?.focus({ preventScroll: true });
    tabs.current[index]?.scrollIntoView({ block: "nearest", inline: "center", behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth" });
  };

  return <section className="product-tour" id="preview" ref={sectionRef}
    aria-label="Explore Tivorah app screens" aria-roledescription="carousel"
    onFocusCapture={event => setFocused(event.target.matches(":focus-visible"))}
    onBlurCapture={event => { if (!event.currentTarget.contains(event.relatedTarget)) setFocused(false); }}
  >
    <div className="tour-heading">
      <div><span className="eyebrow">Take a look inside</span><h2>Meet your everyday app.</h2></div>
      <p>Your Hubs, plans, local finds and conversations. Explore the screens to see how it all fits together.</p>
    </div>

    <div className="tour-tabs" role="tablist" aria-label="Tivorah app previews">
      {previews.map((preview, index) => <button
        key={preview.label}
        ref={(node) => { tabs.current[index] = node; }}
        id={`preview-tab-${index}`}
        aria-controls="preview-panel"
        type="button"
        role="tab"
        tabIndex={activeIndex === index ? 0 : -1}
        aria-selected={activeIndex === index}
        className={activeIndex === index ? "tour-tab active" : "tour-tab"}
        onClick={() => selectTab(index)}
        onKeyDown={(event) => {
          const next = event.key === "ArrowRight" ? (index + 1) % previews.length
            : event.key === "ArrowLeft" ? (index + previews.length - 1) % previews.length
            : event.key === "Home" ? 0 : event.key === "End" ? previews.length - 1 : null;
          if (next !== null) { event.preventDefault(); selectTab(next); }
        }}
      >{preview.label}</button>)}
    </div>

    <div className="tour-layout" data-direction={direction > 0 ? "next" : "previous"} id="preview-panel" role="tabpanel" aria-labelledby={`preview-tab-${activeIndex}`} tabIndex={0}
      aria-describedby="preview-motion-help"
      onKeyDown={event => {
        if (event.target !== event.currentTarget) return;
        if (event.key === " ") { event.preventDefault(); setPaused(value => !value); }
        if (event.key === "Escape") setPaused(true);
      }}>
      <span className="tour-sr-only" id="preview-motion-help">Swipe the phone to change screens. Automatic previews pause while using the keyboard. Press Space to toggle automatic rotation, or Escape to stop it.</span>
      <div className="tour-copy" key={`${active.label}-copy`}>
        <span className="tour-kicker">{active.kicker}</span>
        <h3>{active.title}</h3>
        <p>{active.body}</p>
        <ul>{active.notes.map((note) => <li key={note}><span aria-hidden="true">✓</span>{note}</li>)}</ul>
      </div>

      <div className="phone-stage"
        onPointerDown={event => {
          if (!event.isPrimary || event.button !== 0 || (event.target as HTMLElement).closest("button")) return;
          gesture.current = { id: event.pointerId, x: event.clientX, y: event.clientY };
          event.currentTarget.setPointerCapture(event.pointerId);
          setDragging(true);
        }}
        onPointerUp={event => {
          const start = gesture.current;
          gesture.current = null;
          setDragging(false);
          if (!start || start.id !== event.pointerId) return;
          const dx = event.clientX - start.x;
          const dy = event.clientY - start.y;
          if (Math.abs(dx) >= 45 && Math.abs(dx) > Math.abs(dy) * 1.3) move(dx < 0 ? 1 : -1);
        }}
        onPointerCancel={() => { gesture.current = null; setDragging(false); }}
        onLostPointerCapture={() => { gesture.current = null; setDragging(false); }}
        onDragStart={event => event.preventDefault()}
      >
        <div className="tour-phone-shadow" aria-hidden="true" />
        {previews.map((preview, index) => {
          const offset = (index - activeIndex + previews.length + 2) % previews.length - 2;
          return <div className="iphone-frame tour-phone" key={preview.image}
            data-position={offset === 0 ? "current" : offset < 0 ? "left" : "right"}
            aria-hidden={offset !== 0}
            style={{
              transform: `translate3d(calc(${offset} * var(--tour-phone-spacing, 205px)), ${offset === 0 ? -8 : 22}px, ${offset === 0 ? "65px" : `calc(${Math.abs(offset)} * var(--tour-side-depth, -150px))`}) rotateY(${offset === 0 ? "-6deg" : `calc(${offset < 0 ? 1 : -1} * var(--tour-side-angle, 48deg))`})`,
              opacity: Math.abs(offset) > 1 ? 0 : offset === 0 ? 1 : "var(--tour-side-opacity, 0.48)",
              zIndex: offset === 0 ? 3 : 1,
            }}>
            <Image draggable={false} src={preview.image} alt={offset === 0 ? `${preview.label} screen in the Tivorah iPhone app` : ""} width={1206} height={2622} sizes="(max-width: 600px) 54vw, 275px" />
          </div>;
        })}
      </div>
    </div>
  </section>;
}
