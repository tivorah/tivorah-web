"use client";
import Image from "next/image";
import { useState } from "react";

/** A Hub page's cover slides, swiped like the app's: its photos, one at a time, with a counter. */
export function HubCoverSlides({ photos }: { photos: string[] }) {
  const [slide, setSlide] = useState(0);
  if (!photos.length) return null;
  return <>
    <div className="hub-cover-track" aria-roledescription={photos.length > 1 ? "carousel" : undefined} aria-label={photos.length > 1 ? "Hub cover" : undefined}
      onScroll={(event) => {
        const element = event.currentTarget;
        setSlide(Math.min(photos.length - 1, Math.max(0, Math.round(element.scrollLeft / Math.max(element.clientWidth, 1)))));
      }}>
      {photos.map((photo, index) => <div key={`${photo}-${index}`} className="hub-cover-slide">
        <Image src={photo} alt="" fill sizes="(max-width: 760px) 100vw, 1280px" priority={index === 0} />
      </div>)}
    </div>
    {photos.length > 1 ? <span className="hub-cover-count" aria-live="polite">{slide + 1} / {photos.length}</span> : null}
  </>;
}
