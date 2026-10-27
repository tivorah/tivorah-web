"use client";
import Image from "next/image";
import { useState } from "react";
import { coverVideoSlide } from "../../lib/cover-slides";

/**
 * A Hub page's cover slides, swiped like the app's: its photos, with the approved cover video
 * playing (silently, looping) on its own slide over the photo stored there.
 */
export function HubCoverSlides({ photos, videoUrl, videoPosition }: { photos: string[]; videoUrl?: string | null; videoPosition?: number | null }) {
  const [slide, setSlide] = useState(0);
  const videoAt = videoUrl ? coverVideoSlide(videoPosition, photos.length) : -1;
  return <>
    <div className="hub-cover-track" aria-roledescription={photos.length > 1 ? "carousel" : undefined} aria-label={photos.length > 1 ? "Hub cover" : undefined}
      onScroll={(event) => { const element = event.currentTarget; setSlide(Math.min(photos.length - 1, Math.max(0, Math.round(element.scrollLeft / Math.max(element.clientWidth, 1))))); }}>
      {photos.map((photo, index) => <div key={`${photo}-${index}`} className="hub-cover-slide">
        <Image src={photo} alt="" fill sizes="(max-width: 760px) 100vw, 1280px" priority={index === 0} />
        {index === videoAt ? <video className="hub-detail-cover-video" src={videoUrl ?? undefined} poster={photo} autoPlay muted loop playsInline preload="metadata" aria-hidden="true" tabIndex={-1} /> : null}
      </div>)}
    </div>
    {photos.length > 1 ? <span className="hub-cover-count" aria-live="polite">{slide + 1} / {photos.length}</span> : null}
  </>;
}
