"use client";
import Image from "next/image";
import { useState } from "react";
import { coverVideoSlide } from "../../lib/cover-slides";
import { CoverVideo, CoverVideoControls, useCoverVideoPlayback } from "./cover-video";

/**
 * A Hub page's cover slides, swiped like the app's: its photos, with the approved cover video
 * playing (muted at first, looping) on its own slide over the photo stored there. Its buttons
 * pause it or turn sound on; swiping to another slide starts it muted again. A video with no
 * photos plays over the Hub's colour.
 */
export function HubCoverSlides({ photos, videoUrl, videoPosition }: { photos: string[]; videoUrl?: string | null; videoPosition?: number | null }) {
  const [slide, setSlide] = useState(0);
  const playback = useCoverVideoPlayback();
  const videoAt = videoUrl ? coverVideoSlide(videoPosition, photos.length) : -1;
  const controls = (alone: boolean) => <CoverVideoControls className={`is-hub${alone ? " is-alone" : ""}`} muted={playback.muted} paused={playback.paused} onToggleSound={playback.toggleSound} onTogglePlay={playback.togglePlay} />;
  if (!photos.length) return videoUrl ? <>
    <CoverVideo className="hub-detail-cover-video" src={videoUrl} muted={playback.muted} paused={playback.paused} />
    {controls(true)}
  </> : null;
  return <>
    <div className="hub-cover-track" aria-roledescription={photos.length > 1 ? "carousel" : undefined} aria-label={photos.length > 1 ? "Hub cover" : undefined}
      onScroll={(event) => {
        const element = event.currentTarget;
        const next = Math.min(photos.length - 1, Math.max(0, Math.round(element.scrollLeft / Math.max(element.clientWidth, 1))));
        if (next !== slide && slide === videoAt) playback.reset();
        setSlide(next);
      }}>
      {photos.map((photo, index) => <div key={`${photo}-${index}`} className="hub-cover-slide">
        <Image src={photo} alt="" fill sizes="(max-width: 760px) 100vw, 1280px" priority={index === 0} />
        {index === videoAt && videoUrl ? <>
          {/* Muted once it's swiped off screen, so its sound never plays behind another photo. */}
          <CoverVideo className="hub-detail-cover-video" src={videoUrl} poster={photo} muted={playback.muted || slide !== videoAt} paused={playback.paused} />
          {controls(photos.length < 2)}
        </> : null}
      </div>)}
    </div>
    {photos.length > 1 ? <span className="hub-cover-count" aria-live="polite">{slide + 1} / {photos.length}</span> : null}
  </>;
}
