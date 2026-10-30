"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import "../../app/media-gallery.css";
import { galleryLayout, hiddenPhotoCount, MOSAIC_TILES, wrapIndex } from "../../lib/event-detail";
import { coverVideoSlide } from "../../lib/cover-slides";
import { CoverVideo, CoverVideoControls, useCoverVideoPlayback } from "./cover-video";

// Photo header for event, item and service pages, in the same tile style as the
// organiser card ("Meet the organiser"): rounded tiles with cover-cropped photos.
//  - one photo: a single wide tile
//  - two photos: two tiles side by side
//  - three or more: three equal 4:3 tiles, the last showing "+N"
// Phones get a swipeable 4:3 carousel with a counter. Every photo opens a full-size viewer
// that shows the whole, uncropped image. An approved cover video (events) plays on its own slide,
// over the photo stored there (its first frame), like in the app; older events: the first. It
// starts muted; its buttons pause it or turn sound on (muted again when swiped away or viewing photos).
export function MediaGallery({ photos, title, coverVideoUrl, coverVideoPosition }: { photos: string[]; title: string; coverVideoUrl?: string | null; coverVideoPosition?: number | null }) {
  const layout = galleryLayout(photos.length);
  const [viewer, setViewer] = useState<number | null>(null);
  const [slide, setSlide] = useState(0);
  const playback = useCoverVideoPlayback();
  const dialog = useRef<HTMLDialogElement>(null);
  const opener = useRef<HTMLElement | null>(null);

  const open = (index: number, trigger: HTMLElement) => { opener.current = trigger; setViewer(index); };
  const close = useCallback(() => setViewer(null), []);

  useEffect(() => {
    const element = dialog.current;
    if (!element) return;
    if (viewer !== null && !element.open) element.showModal();
    if (viewer === null && element.open) { element.close(); opener.current?.focus(); }
  }, [viewer]);

  useEffect(() => {
    if (viewer === null) return;
    const key = (event: KeyboardEvent) => {
      if (event.key === "ArrowRight") setViewer((value) => wrapIndex((value ?? 0) + 1, photos.length));
      if (event.key === "ArrowLeft") setViewer((value) => wrapIndex((value ?? 0) - 1, photos.length));
    };
    document.addEventListener("keydown", key);
    return () => document.removeEventListener("keydown", key);
  }, [viewer, photos.length]);

  if (layout === "none") return null;
  const tiles = photos.slice(0, MOSAIC_TILES);
  const more = hiddenPhotoCount(photos.length);
  const videoSlide = coverVideoSlide(coverVideoPosition, photos.length);
  // The desktop tiles and the phone carousel each have a copy; only the one on screen plays sound.
  const coverVideo = (carousel: boolean) => coverVideoUrl
    ? <CoverVideo className="gallery-cover-video" src={coverVideoUrl} poster={photos[videoSlide]} paused={playback.paused}
      muted={playback.muted || viewer !== null || (carousel && slide !== videoSlide)} />
    : null;
  // Beside the tile, never inside it: the tile is the button that opens the photo viewer.
  const withControls = (tile: ReactNode, key: string, cell: string) => <div key={key} className={cell}>
    {tile}
    <CoverVideoControls className="is-gallery" muted={playback.muted} paused={playback.paused} onToggleSound={playback.toggleSound} onTogglePlay={playback.togglePlay} />
  </div>;

  return <>
    <div className={`event-gallery is-${layout}`}>
      {tiles.slice(0, layout === "single" ? 1 : layout === "pair" ? 2 : MOSAIC_TILES).map((photo, index) => {
        const isLast = layout === "mosaic" && index === MOSAIC_TILES - 1 && more > 0;
        const tile = <button key={photo} type="button" className="event-gallery-tile" onClick={(event) => open(index, event.currentTarget)}
          aria-label={isLast ? `View all ${photos.length} photos` : `View photo ${index + 1} of ${photos.length}`}>
          <Image src={photo} alt={index === 0 ? title : ""} fill priority={index === 0} unoptimized
            sizes={layout === "mosaic" && index > 0 ? "(max-width: 760px) 100vw, 33vw" : "(max-width: 760px) 100vw, 1200px"}
            className="event-gallery-cover" />
          {index === videoSlide && !isLast ? coverVideo(false) : null}
          {isLast ? <span className="event-gallery-more" aria-hidden="true">+{more}</span> : null}
        </button>;
        return coverVideoUrl && index === videoSlide && !isLast ? withControls(tile, photo, "event-gallery-video-cell") : tile;
      })}
      {photos.length > MOSAIC_TILES ? <button type="button" className="event-gallery-all" onClick={(event) => open(0, event.currentTarget)}>
        <svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7" rx="1.5" /><rect x="14" y="3" width="7" height="7" rx="1.5" /><rect x="3" y="14" width="7" height="7" rx="1.5" /><rect x="14" y="14" width="7" height="7" rx="1.5" /></svg>
        All {photos.length} photos
      </button> : null}
    </div>

    {/* Phone carousel: one swipeable photo at a time with a live counter. */}
    <div className="event-carousel" aria-roledescription="carousel" aria-label="Event photos">
      <div className="event-carousel-track" onScroll={(event) => {
        const element = event.currentTarget;
        const next = wrapIndex(Math.round(element.scrollLeft / Math.max(element.clientWidth, 1)), photos.length);
        if (next !== slide && slide === videoSlide) playback.reset();
        setSlide(next);
      }}>
        {photos.map((photo, index) => {
          const tile = <button key={photo} type="button" className="event-carousel-slide" aria-label={`View photo ${index + 1} of ${photos.length}`} onClick={(event) => open(index, event.currentTarget)}>
            <Image src={photo} alt={index === 0 ? title : ""} fill sizes="100vw" unoptimized priority={index === 0} className="event-gallery-cover" />
            {index === videoSlide ? coverVideo(true) : null}
          </button>;
          return coverVideoUrl && index === videoSlide ? withControls(tile, photo, "event-carousel-video-cell") : tile;
        })}
      </div>
      {photos.length > 1 ? <span className="event-carousel-count" aria-live="polite">{slide + 1} / {photos.length}</span> : null}
    </div>

    <dialog ref={dialog} className="event-viewer" aria-label={`${title} photos`} onClose={close} onClick={(event) => { if (event.target === event.currentTarget) close(); }}>
      {viewer !== null ? <>
        <div className="event-viewer-bar">
          <span aria-live="polite">{viewer + 1} / {photos.length}</span>
          <button type="button" className="event-viewer-close" onClick={close} aria-label="Close photos">
            <svg aria-hidden="true" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M6 6l12 12M18 6 6 18" /></svg>
          </button>
        </div>
        <div className="event-viewer-stage">
          <Image key={photos[viewer]} src={photos[viewer]} alt={`${title}, photo ${viewer + 1} of ${photos.length}`} fill sizes="100vw" unoptimized className="event-gallery-contain" />
        </div>
        {photos.length > 1 ? <>
          <button type="button" className="event-viewer-nav is-prev" onClick={() => setViewer(wrapIndex(viewer - 1, photos.length))} aria-label="Previous photo">
            <svg aria-hidden="true" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 5-7 7 7 7" /></svg>
          </button>
          <button type="button" className="event-viewer-nav is-next" onClick={() => setViewer(wrapIndex(viewer + 1, photos.length))} aria-label="Next photo">
            <svg aria-hidden="true" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="m9 5 7 7-7 7" /></svg>
          </button>
          <div className="event-viewer-thumbs" role="group" aria-label="Choose a photo">
            {photos.map((photo, index) => <button key={photo} type="button" aria-label={`Show photo ${index + 1}`} aria-current={index === viewer} onClick={() => setViewer(index)}>
              <Image src={photo} alt="" fill sizes="72px" unoptimized />
            </button>)}
          </div>
        </> : null}
      </> : null}
    </dialog>
  </>;
}
