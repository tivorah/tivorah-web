"use client";

import Image from "next/image";
import { useEffect, useState, type CSSProperties } from "react";

const previews = [
  {
    label: "Discover",
    kicker: "People and communities",
    title: "A warmer way to find your people.",
    body: "Meet people nearby, reconnect with friends and discover welcoming hubs built around interests, identity and place.",
    image: "/preview-discover-ios.png",
    accent: "#8f5fed",
    notes: ["Suggested local people", "Hubs matched to your interests", "Friend profiles and direct messages"],
  },
  {
    label: "Hubs",
    kicker: "Community that feels close",
    title: "Belong somewhere useful.",
    body: "Join local communities, swap advice, share plans and keep up with people who understand your journey.",
    image: "/preview-hubs-ios.png",
    accent: "#7550b3",
    notes: ["Interest and location-based hubs", "Community conversations", "Simple joining and discovery"],
  },
  {
    label: "Events",
    kicker: "Make plans together",
    title: "Turn discovery into a real day out.",
    body: "Browse nearby experiences, filter by mood or date and find reasons to step out with people around you.",
    image: "/preview-events-ios.png",
    accent: "#ff8d75",
    notes: ["Local event discovery", "Useful date and category filters", "Tickets and secure QR entry"],
  },
  {
    label: "Shop",
    kicker: "Local finds and skills",
    title: "Buy, sell and book nearby.",
    body: "Find useful items and trusted independent services, then message directly to arrange the details.",
    image: "/preview-shop-ios-v2.png",
    accent: "#c16eb4",
    notes: ["Items and local services", "Direct seller conversations", "Pickup-friendly discovery"],
  },
  {
    label: "Messages",
    kicker: "Conversations with context",
    title: "Keep every connection moving.",
    body: "Continue conversations with friends, sellers and people you meet through Tivorah in one calm, private inbox.",
    image: "/preview-messages-ios.png",
    accent: "#8f5fed",
    notes: ["Real profile avatars", "Private one-to-one chat", "Friends and connection requests"],
  },
];

export function AppPreview() {
  const [activeIndex, setActiveIndex] = useState(0);
  const active = previews[activeIndex];

  useEffect(() => {
    const timer = window.setInterval(() => {
      setActiveIndex((current) => (current + 1) % previews.length);
    }, 5500);
    return () => window.clearInterval(timer);
  }, []);

  return <section className="product-tour" id="preview">
    <div className="tour-heading">
      <div><span className="eyebrow">The app, in action</span><h2>One place for local life.</h2></div>
      <p>Captured directly from Tivorah on iPhone. Move through the app to see how discovery becomes community, plans and conversation.</p>
    </div>

    <div className="tour-tabs" role="tablist" aria-label="Tivorah app previews">
      {previews.map((preview, index) => <button key={preview.label} type="button" role="tab" aria-selected={activeIndex === index} className={activeIndex === index ? "tour-tab active" : "tour-tab"} onClick={() => setActiveIndex(index)}><span>{String(index + 1).padStart(2, "0")}</span>{preview.label}</button>)}
    </div>

    <div className="tour-layout">
      <div className="tour-copy" key={`${active.label}-copy`}>
        <span className="tour-kicker" style={{ color: active.accent }}>{active.kicker}</span>
        <h3>{active.title}</h3>
        <p>{active.body}</p>
        <ul>{active.notes.map((note) => <li key={note}><span style={{ backgroundColor: active.accent }}>✓</span>{note}</li>)}</ul>
        <div className="tour-progress" aria-hidden="true">{previews.map((preview, index) => <i key={preview.label} className={index === activeIndex ? "active" : ""} style={index === activeIndex ? { backgroundColor: active.accent } : undefined} />)}</div>
      </div>

      <div className="phone-stage" style={{ "--preview-accent": active.accent } as CSSProperties}>
        <div className="stage-orbit orbit-one" /><div className="stage-orbit orbit-two" />
        <div className="phone-shadow" />
        <div className="iphone-frame" key={active.image}>
          <Image src={active.image} alt={`${active.label} screen in the Tivorah iPhone app`} width={1179} height={2556} priority={activeIndex === 0} />
        </div>
        <div className="stage-badge badge-live"><b>Live app</b><small>iPhone capture</small></div>
        <div className="stage-badge badge-local"><b>Local first</b><small>Made for connection</small></div>
      </div>
    </div>
  </section>;
}
