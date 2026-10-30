"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import "../../app/cover-video.css";

/**
 * Cover videos (lib/cover-slides.ts), like the app's: they start playing muted. Detail pages
 * (event gallery, Hub cover) add CoverVideoControls for play/pause and sound; cards use
 * CardCoverVideo, silent with no controls.
 */
export function useCoverVideoPlayback() {
  const [muted, setMuted] = useState(true);
  const [paused, setPaused] = useState(false);
  const toggleSound = useCallback(() => setMuted((value) => !value), []);
  const togglePlay = useCallback(() => setPaused((value) => !value), []);
  // Swiped away from the video: it starts muted and playing again next time.
  const reset = useCallback(() => { setMuted(true); setPaused(false); }, []);
  return { muted, paused, toggleSound, togglePlay, reset };
}

const reducedMotion = () => typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

/**
 * The video itself, over the photo stored on its slide (its first frame). A copy that isn't shown
 * (e.g. the desktop gallery on a phone, or any detail-page video with reduced motion, hidden by
 * CSS) stays muted and paused, so sound never plays twice or unseen.
 */
export function CoverVideo({ src, poster, className, muted, paused, label }: { src: string; poster?: string; className?: string; muted: boolean; paused: boolean; label?: string }) {
  const video = useRef<HTMLVideoElement>(null);
  useEffect(() => {
    const element = video.current;
    if (!element) return;
    const apply = () => {
      const hidden = element.getClientRects().length === 0;
      element.muted = muted || hidden;
      if (paused || hidden) element.pause();
      else void element.play().catch(() => undefined);
    };
    apply();
    window.addEventListener("resize", apply);
    return () => window.removeEventListener("resize", apply);
  }, [muted, paused]);
  return <video ref={video} className={className} src={src} poster={poster} autoPlay muted loop playsInline preload="metadata" aria-label={label} aria-hidden={label ? undefined : true} tabIndex={-1} />;
}

const PlayIcon = () => <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5.5v13a1 1 0 0 0 1.52.85l10.4-6.5a1 1 0 0 0 0-1.7L9.52 4.65A1 1 0 0 0 8 5.5Z" /></svg>;
const PauseIcon = () => <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="5" width="4" height="14" rx="1.2" /><rect x="14" y="5" width="4" height="14" rx="1.2" /></svg>;
const SoundOffIcon = () => <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 5 6 9H3v6h3l5 4V5Z" fill="currentColor" /><path d="m16 9 5 6M21 9l-5 6" /></svg>;
const SoundOnIcon = () => <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 5 6 9H3v6h3l5 4V5Z" fill="currentColor" /><path d="M15.5 8.5a5 5 0 0 1 0 7M18.5 5.5a9 9 0 0 1 0 13" /></svg>;

/** Play/pause and sound for a cover video on a detail page: two 44px round buttons. */
export function CoverVideoControls({ muted, paused, onToggleSound, onTogglePlay, className = "" }: { muted: boolean; paused: boolean; onToggleSound: () => void; onTogglePlay: () => void; className?: string }) {
  return <div className={`cover-video-controls ${className}`.trim()}>
    <button type="button" onClick={onTogglePlay} aria-label={paused ? "Play the cover video" : "Pause the cover video"}>{paused ? <PlayIcon /> : <PauseIcon />}</button>
    <button type="button" onClick={onToggleSound} aria-label={muted ? "Turn the cover video sound on" : "Mute the cover video"}>{muted ? <SoundOffIcon /> : <SoundOnIcon />}</button>
  </div>;
}

/**
 * A card's cover video when it opens the cover (its first frame is the card's photo): muted, no
 * controls, and only while most of the card is on screen. Reduced motion keeps the still photo.
 */
export function CardCoverVideo({ src, poster }: { src: string; poster?: string | null }) {
  const video = useRef<HTMLVideoElement>(null);
  useEffect(() => {
    const element = video.current;
    if (!element || reducedMotion() || typeof IntersectionObserver === "undefined") return;
    const observer = new IntersectionObserver(([entry]) => {
      if (entry?.isIntersecting) void element.play().catch(() => undefined);
      else element.pause();
    }, { threshold: 0.6 });
    observer.observe(element);
    return () => { observer.disconnect(); element.pause(); };
  }, [src]);
  return <video ref={video} className="card-cover-video" src={src} poster={poster ?? undefined} muted loop playsInline preload="metadata" aria-hidden="true" tabIndex={-1} />;
}
