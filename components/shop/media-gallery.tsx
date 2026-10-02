"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import { ShowcaseVideo } from "../business/showcase/video";

// Showcase media on the shop page: a bento grid (one large tile + four) and a
// full-screen viewer. The viewer is a native modal dialog: focus is trapped,
// Escape closes it, arrow keys move between photos and videos.
export type GalleryMedia = { id: number; kind: "image" | "video"; url: string; alt: string; captions?: string; transcript?: string };

export function MediaGallery({ items, title, layout = "bento" }: { items: GalleryMedia[]; title: string; layout?: "bento" | "grid" }) {
  const [open, setOpen] = useState<number | null>(null);
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
  // The overview shows a 5-tile bento; the Gallery tab shows every item.
  const tiles = layout === "grid" ? items : items.slice(0, 5);
  const current = open === null ? null : items[open];

  return <>
    <div className={layout === "grid" ? "shop-media-all" : `shop-media-grid count-${tiles.length}`}>
      {tiles.map((item, index) => {
        const more = layout === "bento" && index === tiles.length - 1 && items.length > tiles.length ? items.length - tiles.length : 0;
        return <button key={item.id} type="button" className="shop-media-tile" onClick={() => show(index)} aria-label={`${more ? `View all ${items.length} photos and videos. ` : ""}Open ${item.kind === "video" ? "video" : "photo"}: ${item.alt}`}>
          {item.kind === "video"
            ? <video src={item.url} muted playsInline preload="metadata" aria-hidden="true" tabIndex={-1} />
            : <Image src={item.url} alt="" fill sizes={index === 0 ? "(max-width: 700px) 100vw, 640px" : "(max-width: 700px) 50vw, 320px"} />}
          {item.kind === "video" ? <span className="shop-media-play" aria-hidden="true"><svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5.5v13l11-6.5z" /></svg></span> : null}
          {more ? <span className="shop-media-more" aria-hidden="true">+{more}</span> : null}
        </button>;
      })}
    </div>

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
            ? <ShowcaseVideo key={current.url} src={current.url} title={current.alt} captions={current.captions} />
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
