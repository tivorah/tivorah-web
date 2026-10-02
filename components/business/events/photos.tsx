"use client";
import { useState } from "react";
import { MediaField } from "../media-field";
import { useMutation } from "../../../hooks/use-mutation";
import { ManagedEvent } from "./types";
import { OfferingVideosEditor } from "../offering-videos";

export function EventPhotos({ event, refresh }: { event: ManagedEvent; refresh: () => void }) {
  const initial = [...new Set([event.img, ...event.images].filter((url): url is string => !!url))];
  const [images, setImages] = useState(initial);
  const [uploading, setUploading] = useState(false);
  const mutation = useMutation(refresh);
  return <div className="event-photos-tab"><section className="showcase-step">
    <h2>Event photos</h2>
    <p className="showcase-hint">The cover appears first on the event page. Add up to five photos, then choose which one leads the gallery.</p>
    <MediaField context="event" initialUrls={initial} onChange={setImages} onBusy={setUploading} />
    {mutation.error ? <p className="product-error" role="alert">{mutation.error}</p> : null}
    {mutation.notice ? <p className="product-notice" role="status">{mutation.notice}</p> : null}
    <div className="showcase-actions"><span className="showcase-hint">Changes appear on this event&apos;s public page after saving.</span><button type="button" className="product-primary" disabled={mutation.busy || uploading || images.length === 0} onClick={() => void mutation.run(`/events/${event.id}`, "PATCH", { img: images[0], images }, "Event photos updated.")}>{mutation.busy ? "Saving…" : "Save photos"}</button></div>
  </section><OfferingVideosEditor kind="event" id={event.id} /></div>;
}
