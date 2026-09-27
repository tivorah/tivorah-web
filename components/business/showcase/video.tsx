"use client";
import { useEffect, useState } from "react";
export function ShowcaseVideo({ src, title, captions, poster }: { src: string; title: string; captions?: string; poster?: string }) {
  const [trackUrl, setTrackUrl] = useState<string>();
  useEffect(() => {
    if (!captions) { setTrackUrl(undefined); return; }
    const url = URL.createObjectURL(new Blob([captions], { type: "text/vtt" }));
    setTrackUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [captions]);
  return <video controls playsInline preload="metadata" src={src} poster={poster} aria-label={`${title} introduction`}>
    {trackUrl && <track key={trackUrl} kind="captions" src={trackUrl} srcLang="en" label="English" default />}
  </video>;
}
