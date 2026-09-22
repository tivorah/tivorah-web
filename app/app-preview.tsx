"use client";

import Image from "next/image";
import { useRef, useState } from "react";

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
    image: "/app-screens/2026-09-22/discover.png",
    notes: ["People and public profiles", "Friends and connection requests", "Direct messages when you connect"],
  },
  {
    label: "Events",
    kicker: "Make plans together",
    title: "Turn discovery into a real day out.",
    body: "Browse nearby experiences, filter by mood or date and find reasons to step out with people around you.",
    image: "/app-screens/2026-09-22/events.png",
    notes: ["Local event discovery", "Useful date and category filters", "Tickets and secure QR entry"],
  },
  {
    label: "Shop",
    kicker: "Local finds and skills",
    title: "Buy, sell and book nearby.",
    body: "Find useful items and independent local services, then message directly to arrange the details.",
    image: "/app-screens/2026-09-22/shop.png",
    notes: ["Items and local services", "Direct seller conversations", "Pickup-friendly discovery"],
  },
  {
    label: "Messages",
    kicker: "Conversations with context",
    title: "Keep every connection moving.",
    body: "Continue conversations with friends, sellers and people you meet through Tivorah in one calm, private inbox.",
    image: "/app-screens/2026-09-22/messages.png",
    notes: ["Real profile avatars", "Private one-to-one chat", "Friends and connection requests"],
  },
];

export function AppPreview() {
  const [activeIndex, setActiveIndex] = useState(0);
  const active = previews[activeIndex];

  const tabs = useRef<(HTMLButtonElement | null)[]>([]);
  const selectTab = (index: number) => {
    setActiveIndex(index);
    tabs.current[index]?.focus();
  };

  return <section className="product-tour" id="preview">
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
        onClick={() => setActiveIndex(index)}
        onKeyDown={(event) => {
          const next = event.key === "ArrowRight" ? (index + 1) % previews.length
            : event.key === "ArrowLeft" ? (index + previews.length - 1) % previews.length
            : event.key === "Home" ? 0 : event.key === "End" ? previews.length - 1 : null;
          if (next !== null) { event.preventDefault(); selectTab(next); }
        }}
      >{preview.label}</button>)}
    </div>

    <div className="tour-layout" id="preview-panel" role="tabpanel" aria-labelledby={`preview-tab-${activeIndex}`} tabIndex={0}>
      <div className="tour-copy" key={`${active.label}-copy`}>
        <span className="tour-kicker">{active.kicker}</span>
        <h3>{active.title}</h3>
        <p>{active.body}</p>
        <ul>{active.notes.map((note) => <li key={note}><span aria-hidden="true">✓</span>{note}</li>)}</ul>
      </div>

      <div className="phone-stage">
        <div className="iphone-frame" key={active.image}>
          <Image src={active.image} alt={`${active.label} screen in the Tivorah iPhone app`} width={1206} height={2622} sizes="(max-width: 600px) 65vw, 275px" />
        </div>
        <p className="capture-caption">From the Tivorah app · Sample content</p>
      </div>
    </div>
  </section>;
}
