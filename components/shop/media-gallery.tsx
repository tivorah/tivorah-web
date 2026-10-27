"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import { ShopVideo } from "../business/shop/video";
import { firstFrame } from "../../lib/video-frame";

// Shop media on the shop page: a swipeable slideshow (Overview), a grid of
// everything (Gallery tab) or a bento grid, plus a full-screen viewer. The viewer is a native modal dialog: focus is trapped,
// Escape closes it, arrow keys move between photos and videos.
export type GalleryMedia = { id: number; kind: "image" | "video"; url: string; alt: string; captions?: string; transcript?: string };

export function MediaGallery({ items, title, layout = "bento" }: { items: GalleryMedia[]; title: string; layout?: "bento" | "grid" | "slideshow" | "strip" }) {
  const [open, setOpen] = useState<number | null>(null);
  // Slideshow: which slide is in view (from the strip's scroll position), moved by swipe or the arrows.
  const strip = useRef<HTMLDivElement>(null);
  const [slide, setSlide] = useState(0);
  // Phones show one slide; wider screens show a row of up to three (shop.css), so a step is one
  // slide's width plus the gap, and "next" stops once the last slide is in view.
  const [perView, setPerView] = useState(1);
  const measure = useCallback(() => {
    const element = strip.current;
    const first = element?.firstElementChild as HTMLElement | null;
    if (!element || !first || !first.offsetWidth) return null;
    const gap = parseFloat(getComputedStyle(element).columnGap) || 0;
    const step = first.offsetWidth + gap;
    return { element, step, perView: Math.max(1, Math.round((element.clientWidth + gap) / step)) };
  }, []);
  const goTo = (index: number) => { const found = measure(); if (found) found.element.scrollTo({ left: index * found.step, behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" }); };
  const onStripScroll = () => { const found = measure(); if (found) { setPerView(found.perView); setSlide(Math.min(items.length - 1, Math.round(found.element.scrollLeft / found.step))); } };
  useEffect(() => {
    if (layout !== "slideshow") return;
    const update = () => { const found = measure(); if (found) setPerView(found.perView); };
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, [layout, measure, items.length]);
  const lastStart = Math.max(0, items.length - perView);
  const dialog = useRef<HTMLDialogElement>(null);
  const opener = useRef<HTMLElement | null>(null);
  const show = (index: number) => { opener.current = document.activeElement as HTMLElement | null; setOpen(index); };
  const close = useCallback(() => { setOpen(null); opener.current?.focus(); }, []);
  const step = useCallback((delta: number) => setOpen((current) => current === null ? current : (current + delta + items.length) % items.length), [items.length]);

  useEffect(() => {
    const element = dialog.current;
    if (!element) return;
    if (open !== null && !element.open) element.showModal();
    if (open === null && element.open) element.close();
  }, [open]);

  if (!items.length) return null;
  // The overview shows a 5-tile bento; the Gallery tab shows every item; the strip above the tabs shows six.
  const tiles = layout === "grid" ? items : layout === "strip" ? items.slice(0, 6) : items.slice(0, 5);
  const current = open === null ? null : items[open];
  const tile = (item: GalleryMedia, index: number, sizes: string, more = 0) => <button key={item.id} type="button" className="shop-media-tile" onClick={() => show(index)} aria-label={`${more ? `View all ${items.length} photos and videos. ` : ""}Open ${item.kind === "video" ? "video" : "photo"}: ${item.alt}${layout === "slideshow" ? `, ${index + 1} of ${items.length}` : ""}`}>
    {item.kind === "video"
      ? <video src={firstFrame(item.url)} muted playsInline preload="metadata" aria-hidden="true" tabIndex={-1} />
      : <Image src={item.url} alt="" fill sizes={sizes} />}
    {item.kind === "video" ? <span className="shop-media-play" aria-hidden="true"><svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5.5v13l11-6.5z" /></svg></span> : null}
    {more ? <span className="shop-media-more" aria-hidden="true">+{more}</span> : null}
  </button>;

  return <>
    {layout === "slideshow" ? <div className={`shop-slideshow slides-${Math.min(items.length, 3)}`} role="region" aria-roledescription="carousel" aria-label={`${title} photos and videos`}>
      <div ref={strip} className="shop-slideshow-strip" onScroll={onStripScroll}>
        {items.map((item, index) => <div key={item.id} className="shop-slideshow-slide">{tile(item, index, "(max-width: 759px) 100vw, 520px")}</div>)}
      </div>
      {items.length > 1 ? <>
        <span className="shop-slideshow-count" aria-live="polite">{perView > 1 ? `${slide + 1}–${Math.min(items.length, slide + perView)}` : slide + 1} / {items.length}</span>
        <button type="button" className="shop-slideshow-nav prev" onClick={() => goTo(Math.max(0, slide - 1))} disabled={slide === 0} aria-label="Previous photo"><svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="m15 6-6 6 6 6" /></svg></button>
        <button type="button" className="shop-slideshow-nav next" onClick={() => goTo(Math.min(lastStart, slide + 1))} disabled={slide >= lastStart} aria-label="Next photo"><svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="m9 6 6 6-6 6" /></svg></button>
        {/* Where you are at a glance; swiping, the arrows and the count are the controls. */}
        <div className="shop-slideshow-dots" aria-hidden="true">{items.map((item, index) => <span key={item.id} className={index === slide ? "is-current" : undefined} />)}</div>
      </> : null}
    </div> : layout === "strip" ? <div className="shop-media-strip" role="list" aria-label={`${title} photos and videos`}>
      {tiles.map((item, index) => <div key={item.id} role="listitem">{tile(item, index, "120px")}</div>)}
    </div> : <div className={layout === "grid" ? "shop-media-all" : `shop-media-grid count-${tiles.length}`}>
      {tiles.map((item, index) => tile(item, index, index === 0 ? "(max-width: 700px) 100vw, 640px" : "(max-width: 700px) 50vw, 320px",
        layout === "bento" && index === tiles.length - 1 && items.length > tiles.length ? items.length - tiles.length : 0))}
    </div>}

    <dialog ref={dialog} className="shop-viewer" aria-label={`${title} photos and videos`} onCancel={(event) => { event.preventDefault(); close(); }} onKeyDown={(event) => { if (event.key === "ArrowRight") step(1); if (event.key === "ArrowLeft") step(-1); }}>
      {current ? <div className="shop-viewer-body">
        <div className="shop-viewer-bar">
          <span aria-live="polite">{(open ?? 0) + 1} of {items.length}</span>
          <button type="button" className="shop-viewer-close" onClick={close} aria-label="Close viewer">
            <svg aria-hidden="true" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><path d="M6 6l12 12M18 6 6 18" /></svg>
          </button>
        </div>
        <figure className="shop-viewer-stage">
          {current.kind === "video"
            ? <ShopVideo key={current.url} src={current.url} title={current.alt} captions={current.captions} />
            : <Image key={current.url} src={current.url} alt={current.alt} fill sizes="100vw" />}
          <figcaption>{current.alt}</figcaption>
        </figure>
        {current.transcript ? <details className="shop-viewer-transcript"><summary>Transcript</summary><p>{current.transcript}</p></details> : null}
        {items.length > 1 ? <>
          <button type="button" className="shop-viewer-nav prev" onClick={() => step(-1)} aria-label="Previous"><svg aria-hidden="true" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="m15 6-6 6 6 6" /></svg></button>
          <button type="button" className="shop-viewer-nav next" onClick={() => step(1)} aria-label="Next"><svg aria-hidden="true" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="m9 6 6 6-6 6" /></svg></button>
        </> : null}
      </div> : null}
    </dialog>
  </>;
}
