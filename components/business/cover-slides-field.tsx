"use client";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { directUpload } from "../../lib/direct-upload";
import "./cover-slides.css";
import { COVER_VIDEO_MAX_BYTES, coverRoom, coverVideoMaxSeconds, hasCoverVideo, moveCoverSlide, type CoverSlide, type CoverVideoPurpose } from "../../lib/cover-slides";
import { CoverVideo, CoverVideoControls, useCoverVideoPlayback } from "../discovery/cover-video";

const PHOTO_TYPES = "image/jpeg,image/png,image/webp";
const VIDEO_TYPES = "video/mp4,video/quicktime,video/webm";
const PHOTO_MAX_BYTES = 10 * 1024 * 1024;
let nextId = 0;
const slideId = () => `slide-${++nextId}`;

/** A picked video's length and first frame (a JPEG), read in the browser. */
function readVideo(file: File): Promise<{ seconds: number; frame: File }> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const video = document.createElement("video");
    const fail = () => { URL.revokeObjectURL(url); reject(new Error("This video couldn’t be read. Try an MP4 or MOV file.")); };
    video.muted = true;
    video.playsInline = true;
    video.preload = "auto";
    video.onerror = fail;
    video.onloadedmetadata = () => { video.currentTime = Math.min(0.1, (video.duration || 0) / 2); };
    video.onseeked = () => {
      const scale = Math.min(1, 1600 / Math.max(video.videoWidth, 1));
      const canvas = document.createElement("canvas");
      canvas.width = Math.round(video.videoWidth * scale);
      canvas.height = Math.round(video.videoHeight * scale);
      canvas.getContext("2d")?.drawImage(video, 0, 0, canvas.width, canvas.height);
      canvas.toBlob((blob) => {
        URL.revokeObjectURL(url);
        if (!blob) { reject(new Error("This video couldn’t be read. Try an MP4 or MOV file.")); return; }
        resolve({ seconds: video.duration, frame: new File([blob], "cover-video-frame.jpg", { type: "image/jpeg" }) });
      }, "image/jpeg", 0.85);
    };
    video.src = url;
  });
}

/**
 * The cover for Create Hub, Create event and Create listing on the web, like the app's: up to four
 * slides, e.g. three photos and a short video. The video uploads as soon as it's picked; its first
 * frame becomes the photo on its slide. Reorder or remove slides in the strip under the cover.
 * `children` sits over the cover's bottom edge (the Hub's round photo).
 * Without a `purpose` the cover is photos only (items and services).
 */
export function CoverSlidesField({ id, purpose, slides, onChange, onBusy, invalid = false, compact = false, children }: {
  id: string;
  purpose: CoverVideoPurpose | null;
  slides: CoverSlide[];
  onChange: (slides: CoverSlide[]) => void;
  onBusy?: (busy: boolean) => void;
  invalid?: boolean;
  /** Events and listings: a shorter banner for photos, which grows to 16:9 when a video is added. */
  compact?: boolean;
  children?: ReactNode;
}) {
  const [error, setError] = useState("");
  const [reading, setReading] = useState(false);
  const [failed, setFailed] = useState<string[]>([]);
  const [shown, setShown] = useState(0);
  const playback = useCoverVideoPlayback();
  const current = Math.min(shown, Math.max(0, slides.length - 1));
  const latest = useRef(slides);
  useEffect(() => { latest.current = slides; }, [slides]);
  const room = coverRoom(slides);
  const video = hasCoverVideo(slides);
  const seconds = coverVideoMaxSeconds(purpose ?? "listing");

  // Free the previews when the form goes away.
  useEffect(() => () => { for (const slide of latest.current) { URL.revokeObjectURL(slide.preview); if (slide.kind === "video") URL.revokeObjectURL(slide.framePreview); } }, []);

  // Picked photos (and a video, if one gets through), added in the order they were picked.
  const addFiles = async (files: FileList | null) => {
    setError("");
    const picked = Array.from(files ?? []);
    if (!picked.length) return;
    if (!purpose && picked.some((file) => !file.type.startsWith("image/"))) { setError("Item and service covers are photos only. Choose JPG, PNG or WebP photos."); return; }
    if (picked.some((file) => !file.type.startsWith("image/") && !file.type.startsWith("video/"))) { setError("Choose photos (JPG, PNG or WebP) or a video (MP4 or MOV)."); return; }
    if (picked.some((file) => file.type.startsWith("image/") && file.size > PHOTO_MAX_BYTES)) { setError("Choose JPG, PNG or WebP photos under 10 MB each."); return; }
    const videos = picked.filter((file) => file.type.startsWith("video/"));
    const chosen = picked.filter((file) => !file.type.startsWith("video/") || (!video && file === videos[0])).slice(0, room);
    const notes: string[] = [];
    if (videos.length && (video || videos.length > 1)) notes.push(video ? "Your cover has its video already, so only photos were added." : "A cover has one video, so the first one was added.");
    if (picked.filter((file) => !file.type.startsWith("video/") || (!video && file === videos[0])).length > room) notes.push(`Only ${room} more slide${room === 1 ? "" : "s"} fit${room === 1 ? "s" : ""}, so the first ${room} were added.`);
    const built: CoverSlide[] = [];
    for (const file of chosen) {
      if (file.type.startsWith("image/")) { built.push({ id: slideId(), kind: "photo", file, preview: URL.createObjectURL(file) }); continue; }
      const slide = await videoSlide(file);
      if (typeof slide === "string") notes.push(slide);
      else built.push(slide);
    }
    if (notes.length) setError(notes.join(" "));
    if (built.length) { onChange([...latest.current, ...built]); }
  };

  // A picked video as a slide (uploading straight away), or why it can't be used.
  const videoSlide = async (file: File): Promise<CoverSlide | string> => {
    if (!purpose) return "Item and service covers are photos only.";
    if (file.size > COVER_VIDEO_MAX_BYTES) return "Choose a video under 100 MB.";
    setReading(true);
    onBusy?.(true);
    try {
      const { seconds: length, frame } = await readVideo(file);
      // A little leeway: phones round, and a "30 second" clip can be 30.4.
      if (length > seconds + 1) return `Cover videos can be up to ${seconds} seconds. Trim it first, then choose it again.`;
      const slide = { id: slideId(), kind: "video" as const, file, preview: URL.createObjectURL(file), frame, framePreview: URL.createObjectURL(frame), seconds: Math.max(1, Math.ceil(length)),
        upload: directUpload(file, { purpose, kind: "video", durationSeconds: length }).then((result) => result.id) };
      slide.upload.catch(() => setFailed((current) => [...current, slide.id]));
      return slide;
    } catch (cause) {
      return cause instanceof Error ? cause.message : "This video couldn’t be added.";
    } finally {
      setReading(false);
      onBusy?.(false);
    }
  };

  const changeVideo = async (file: File | undefined) => {
    setError("");
    if (!file) return;
    if (!file.type.startsWith("video/")) { setError("Choose a video file (MP4 or MOV)."); return; }
    const slide = await videoSlide(file);
    if (typeof slide === "string") { setError(slide); return; }
    const current = latest.current;
    const at = current.findIndex((item) => item.kind === "video");
    onChange(at >= 0 ? current.map((item, index) => (index === at ? slide : item)) : [...current, slide]);
  };

  const remove = (index: number) => {
    const slide = slides[index];
    URL.revokeObjectURL(slide.preview);
    if (slide.kind === "video") URL.revokeObjectURL(slide.framePreview);
    onChange(slides.filter((_, position) => position !== index));
    setShown(0);
  };

  const pick = (kind: "media" | "video", label: string) => <label className="cover-slides-pick">
    <svg aria-hidden="true" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">{kind === "media"
      ? <><path d="M4 8.5A2.5 2.5 0 0 1 6.5 6h1.7l1.3-2h5l1.3 2h1.7A2.5 2.5 0 0 1 20 8.5v8a2.5 2.5 0 0 1-2.5 2.5h-11A2.5 2.5 0 0 1 4 16.5z" /><circle cx="12" cy="12.5" r="3.2" /></>
      : <><rect x="3" y="6" width="13" height="12" rx="2.5" /><path d="m16 10 5-3v10l-5-3z" /></>}</svg>
    <span>{label}</span>
    {kind === "media"
      ? <input id={slides.length ? undefined : id} type="file" multiple accept={PHOTO_TYPES} disabled={reading} aria-label={label} aria-invalid={invalid || undefined} onChange={(event) => { void addFiles(event.currentTarget.files); event.currentTarget.value = ""; }} />
      : <input type="file" accept={VIDEO_TYPES} disabled={reading} aria-label={`${label}, up to ${seconds} seconds`} onChange={(event) => { void changeVideo(event.currentTarget.files?.[0]); event.currentTarget.value = ""; }} />}
  </label>;

  return <div className={`cover-slides${invalid ? " is-invalid" : ""}${compact && !video ? " is-compact" : ""}`}>
    <div className="cover-slides-stage">
      {slides.length ? <div className="cover-slides-track" onScroll={(event) => {
        const element = event.currentTarget;
        const next = Math.round(element.scrollLeft / Math.max(element.clientWidth, 1));
        // Swiped off the video: it starts muted and playing again next time.
        if (next !== shown) playback.reset();
        setShown(next);
      }}>
        {slides.map((slide, index) => <div key={slide.id} className="cover-slides-slide">
          {slide.kind === "photo"
            // eslint-disable-next-line @next/next/no-img-element -- local preview of a picked file
            ? <img src={slide.preview} alt={`Cover slide ${index + 1}`} />
            : <>
              <CoverVideo src={slide.preview} poster={slide.framePreview} muted={playback.muted || index !== current} paused={playback.paused} label={`Cover slide ${index + 1}: video, ${slide.seconds} seconds`} />
              {/* Like the page will allow: it starts muted; pause it or turn sound on to check it. */}
              {index === current ? <CoverVideoControls className="is-gallery is-editor" muted={playback.muted} paused={playback.paused} onToggleSound={playback.toggleSound} onTogglePlay={playback.togglePlay} /> : null}
            </>}
        </div>)}
      </div> : null}
      {slides.length > 1 ? <span className="cover-slides-count" aria-hidden="true">{Math.min(shown, slides.length - 1) + 1} / {slides.length}</span> : null}
      <div className="cover-slides-picks">
        {/* Photos and a video in any order: photos after a video, or a video after photos. */}
        {room ? pick("media", slides.length ? "Add photos" : "Add cover") : null}
        {!purpose ? null : video ? pick("video", "Change video") : room ? pick("video", "Add video") : null}
      </div>
    </div>
    {children}
    {slides.length ? <ol className="cover-slides-strip" aria-label="Cover slides, in order">
      {slides.map((slide, index) => <li key={slide.id} className={failed.includes(slide.id) ? "is-failed" : undefined}>
        {/* eslint-disable-next-line @next/next/no-img-element -- local preview of a picked file */}
        <img src={slide.kind === "photo" ? slide.preview : slide.framePreview} alt="" />
        <span className="cover-slides-tag">{slide.kind === "video" ? (failed.includes(slide.id) ? "Upload failed" : `Video · ${slide.seconds}s`) : index === 0 ? "First" : `Photo`}</span>
        <span className="cover-slides-tools">
          <button type="button" disabled={index === 0} onClick={() => onChange(moveCoverSlide(slides, index, index - 1))} aria-label={`Move slide ${index + 1} earlier`}>‹</button>
          <button type="button" disabled={index === slides.length - 1} onClick={() => onChange(moveCoverSlide(slides, index, index + 1))} aria-label={`Move slide ${index + 1} later`}>›</button>
          <button type="button" onClick={() => remove(index)} aria-label={`Remove slide ${index + 1}`}>✕</button>
        </span>
        {index > 0 ? <button type="button" className="cover-slides-first" onClick={() => { onChange(moveCoverSlide(slides, index, 0)); setShown(0); }} aria-label={`Make slide ${index + 1} the first`}>Make first</button> : null}
      </li>)}
    </ol> : null}
    {reading ? <p className="shop-hint" role="status">Reading your video…</p> : null}
    {error ? <p className="hub-field-error" role="alert">{error}</p> : null}
  </div>;
}
