"use client";
import { useEffect, useRef, useState, type ReactNode } from "react";
import "./cover-slides.css";
import { coverRoom, MAX_COVER_SLIDES, moveCoverSlide, type CoverSlide } from "../../lib/cover-slides";

const PHOTO_TYPES = "image/jpeg,image/png,image/webp";
const PHOTO_MAX_BYTES = 10 * 1024 * 1024;
let nextId = 0;
const slideId = () => `slide-${++nextId}`;

/**
 * The cover for Create Hub, Create event and Create listing on the web, like the app's: a row of
 * photo slides, swiped like the page will be. Reorder or remove slides in the strip under the cover.
 * `maxSlides` is how many fit (events and listings take MAX_COVER_SLIDES, Hubs HUB_COVER_SLIDES).
 * `children` sits over the cover's bottom edge (the Hub's round photo).
 */
export function CoverSlidesField({ id, slides, onChange, maxSlides = MAX_COVER_SLIDES, invalid = false, compact = false, children }: {
  id: string;
  slides: CoverSlide[];
  onChange: (slides: CoverSlide[]) => void;
  maxSlides?: number;
  invalid?: boolean;
  /** Events and listings: a shorter banner. */
  compact?: boolean;
  children?: ReactNode;
}) {
  const [error, setError] = useState("");
  const [shown, setShown] = useState(0);
  const latest = useRef(slides);
  useEffect(() => { latest.current = slides; }, [slides]);
  const room = coverRoom(slides, maxSlides);

  // Free the previews when the form goes away.
  useEffect(() => () => { for (const slide of latest.current) URL.revokeObjectURL(slide.preview); }, []);

  // Picked photos, added in the order they were picked.
  const addFiles = (files: FileList | null) => {
    setError("");
    const picked = Array.from(files ?? []);
    if (!picked.length) return;
    if (picked.some((file) => !file.type.startsWith("image/"))) { setError("Covers are photos. Choose JPG, PNG or WebP photos."); return; }
    if (picked.some((file) => file.size > PHOTO_MAX_BYTES)) { setError("Choose JPG, PNG or WebP photos under 10 MB each."); return; }
    const chosen = picked.slice(0, room);
    if (picked.length > room) setError(`Only ${room} more slide${room === 1 ? "" : "s"} fit${room === 1 ? "s" : ""}, so the first ${room} were added.`);
    if (chosen.length) onChange([...latest.current, ...chosen.map((file): CoverSlide => ({ id: slideId(), kind: "photo", file, preview: URL.createObjectURL(file) }))]);
  };

  const remove = (index: number) => {
    URL.revokeObjectURL(slides[index].preview);
    onChange(slides.filter((_, position) => position !== index));
    setShown(0);
  };

  const label = slides.length ? "Add photos" : "Add cover";

  return <div className={`cover-slides${invalid ? " is-invalid" : ""}${compact ? " is-compact" : ""}`}>
    <div className="cover-slides-stage">
      {slides.length ? <div className="cover-slides-track" onScroll={(event) => {
        const element = event.currentTarget;
        setShown(Math.round(element.scrollLeft / Math.max(element.clientWidth, 1)));
      }}>
        {slides.map((slide, index) => <div key={slide.id} className="cover-slides-slide">
          {/* eslint-disable-next-line @next/next/no-img-element -- local preview of a picked file */}
          <img src={slide.preview} alt={`Cover slide ${index + 1}`} />
        </div>)}
      </div> : null}
      {slides.length > 1 ? <span className="cover-slides-count" aria-hidden="true">{Math.min(shown, slides.length - 1) + 1} / {slides.length}</span> : null}
      <div className="cover-slides-picks">
        {room ? <label className="cover-slides-pick">
          <svg aria-hidden="true" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 8.5A2.5 2.5 0 0 1 6.5 6h1.7l1.3-2h5l1.3 2h1.7A2.5 2.5 0 0 1 20 8.5v8a2.5 2.5 0 0 1-2.5 2.5h-11A2.5 2.5 0 0 1 4 16.5z" /><circle cx="12" cy="12.5" r="3.2" /></svg>
          <span>{label}</span>
          <input id={slides.length ? undefined : id} type="file" multiple accept={PHOTO_TYPES} aria-label={label} aria-invalid={invalid || undefined} onChange={(event) => { addFiles(event.currentTarget.files); event.currentTarget.value = ""; }} />
        </label> : null}
      </div>
    </div>
    {children}
    {slides.length ? <ol className="cover-slides-strip" aria-label="Cover slides, in order">
      {slides.map((slide, index) => <li key={slide.id}>
        {/* eslint-disable-next-line @next/next/no-img-element -- local preview of a picked file */}
        <img src={slide.preview} alt="" />
        <span className="cover-slides-tag">{index === 0 ? "First" : "Photo"}</span>
        <span className="cover-slides-tools">
          <button type="button" disabled={index === 0} onClick={() => onChange(moveCoverSlide(slides, index, index - 1))} aria-label={`Move slide ${index + 1} earlier`}>‹</button>
          <button type="button" disabled={index === slides.length - 1} onClick={() => onChange(moveCoverSlide(slides, index, index + 1))} aria-label={`Move slide ${index + 1} later`}>›</button>
          <button type="button" onClick={() => remove(index)} aria-label={`Remove slide ${index + 1}`}>✕</button>
        </span>
        {index > 0 ? <button type="button" className="cover-slides-first" onClick={() => { onChange(moveCoverSlide(slides, index, 0)); setShown(0); }} aria-label={`Make slide ${index + 1} the first`}>Make first</button> : null}
      </li>)}
    </ol> : null}
    {error ? <p className="hub-field-error" role="alert">{error}</p> : null}
  </div>;
}
