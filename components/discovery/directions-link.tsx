"use client";

import { useState } from "react";
import { directionsUrl } from "../../lib/event-detail";

// "Get directions" that starts from where the person is. Location is read only after they
// click, is used once to build the Google Maps link, and is never sent to Tivorah.
export function DirectionsLink({ destination, className }: { destination: string; className?: string }) {
  const [locating, setLocating] = useState(false);
  const fallback = directionsUrl(destination);

  function open(event: React.MouseEvent<HTMLAnchorElement>) {
    if (!("geolocation" in navigator) || event.metaKey || event.ctrlKey || event.shiftKey) return;
    event.preventDefault();
    // Open the tab synchronously so pop-up blockers allow it, then point it at the route.
    const tab = window.open("about:blank", "_blank");
    if (tab) tab.opener = null;
    const go = (url: string) => { setLocating(false); if (tab) tab.location.href = url; else window.location.href = url; };
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (position) => go(directionsUrl(destination, position.coords)),
      () => go(fallback),
      { enableHighAccuracy: false, timeout: 8000, maximumAge: 120000 },
    );
  }

  return <a className={className} href={fallback} target="_blank" rel="noopener noreferrer" onClick={open} aria-busy={locating}>
    {locating ? "Finding your location…" : "Get directions"}
  </a>;
}
