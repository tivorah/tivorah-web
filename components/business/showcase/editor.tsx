"use client";
import { AccountSurfaceLoading } from "../../account/surface-loading";
import Image from "next/image";
import Link from "next/link";
import { FormEvent, useCallback, useState } from "react";
import { moveItem, useSortable } from "../../ui/use-sortable";
import { AccountGate } from "../../account/gate";
import { usePrivateResource } from "../../../hooks/use-private-resource";
import { api } from "../../../lib/api/client";
import { directUpload, directUploadUnavailable } from "../../../lib/direct-upload";
import {
  ShowcaseAsset,
  ShowcaseContent,
  ShowcaseEligibility,
  ShowcaseRecord,
  defaultPlacements,
  normalizeSectionOrder,
  sectionLabels,
  emptyShowcase,
} from "./types";

// The showcase is the promotional part of a seller's showcase: a name, a short
// introduction and photos, plus where it should also appear (item, service and
// event pages). Everything else is optional and tucked away so it is quick to publish.

const optionalFields = [
  ["story", "Your story", 5000, "What makes your business special?"],
  ["locality", "Area you work in", 120, "e.g. Adelaide CBD and inner suburbs"],
  ["hours", "Opening hours", 500, "e.g. Mon–Fri 9am–5pm"],
  ["serviceArea", "Service area", 500, ""],
  ["fulfilment", "Pickup and delivery", 1000, ""],
  ["bookingPolicy", "Bookings and cancellations", 1000, ""],
] as const;
const placementLabels = [
  ["items", "Item pages", "Shown under your items for sale"],
  ["services", "Service pages", "Shown under your services"],
  ["events", "Event pages", "Shown under events you organise"],
  ["hubs", "Hub pages", "Shown on Hubs you created"],
] as const;

const MAX_MEDIA = 20;
// Direct uploads (phone/browser → storage) allow longer, larger videos; the older form upload is
// kept as a fallback when direct uploads are switched off or storage CORS isn't configured.
const MAX_VIDEO_SECONDS = 180;
const MAX_VIDEO_BYTES = 200 * 1024 * 1024;
const MAX_IMAGE_BYTES = 18 * 1024 * 1024;
const FALLBACK_MAX_BYTES = 25 * 1024 * 1024;
const FALLBACK_VIDEO_SECONDS = 60;
const mb = (bytes: number) => `${Math.round(bytes / 1024 / 1024)} MB`;
function videoDuration(file: File) {
  return new Promise<number>((resolve) => {
    const url = URL.createObjectURL(file);
    const video = document.createElement("video");
    video.preload = "metadata";
    video.onloadedmetadata = () => { URL.revokeObjectURL(url); resolve(video.duration || 0); };
    video.onerror = () => { URL.revokeObjectURL(url); resolve(0); };
    video.src = url;
  });
}
async function uploadFile(file: File, onProgress?: (fraction: number) => void) {
  const kind = file.type.startsWith("video/") ? "video" : "image";
  const seconds = kind === "video" ? await videoDuration(file) : 0;
  try {
    const result = await directUpload<{ asset?: ShowcaseAsset }>(file, { purpose: "showcase", kind, durationSeconds: seconds || undefined, onProgress });
    if (result.asset) return result.asset;
    throw new Error("Upload finished but the file wasn’t added. Please try again.");
  } catch (error) {
    if (!directUploadUnavailable(error)) throw error;
    if (file.size > FALLBACK_MAX_BYTES) throw new Error(`${file.name} is too large to upload right now. Choose a file under ${mb(FALLBACK_MAX_BYTES)}.`);
    if (kind === "video" && seconds > FALLBACK_VIDEO_SECONDS) throw new Error(`${file.name} is too long to upload right now. Keep it under ${FALLBACK_VIDEO_SECONDS} seconds.`);
    const form = new FormData();
    form.set("file", file);
    return (await api<{ asset: ShowcaseAsset }>("/web/business/showcase/media", { method: "POST", body: form })).asset;
  }
}

function Editor({ record, media, username, eligibility }: { record: ShowcaseRecord | null; media: ShowcaseAsset[]; username: string; eligibility: ShowcaseEligibility }) {
  const [content, setContent] = useState<ShowcaseContent>({ ...(record?.draft ?? emptyShowcase(username)), placements: record?.draft?.placements ?? defaultPlacements });
  const [assets, setAssets] = useState(media);
  const [version, setVersion] = useState(record?.version ?? 0);
  const [published, setPublished] = useState(!!record?.published);
  const [publishedSlug, setPublishedSlug] = useState(record?.published?.slug || "");
  const [offline, setOffline] = useState(!!record?.draft?.offline && !record?.published);
  const [confirmOffline, setConfirmOffline] = useState(false);
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState("");
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const set = (patch: Partial<ShowcaseContent>) => setContent((current) => ({ ...current, ...patch }));
  const asset = (id: number | null) => assets.find((item) => item.id === id);
  const galleryMedia = content.gallery.map((item) => asset(item.assetId)).filter((item): item is ShowcaseAsset => !!item);
  const videos = assets.filter((item) => item.kind === "video");
  const placements = content.placements ?? defaultPlacements;

  // Photos and short videos (up to 60 seconds), 20 in total. Videos are added
  // straight away but only appear publicly once Tivorah has reviewed them.
  async function addMedia(files: FileList | null) {
    const list = [...(files ?? [])].filter((file) => file.type.startsWith("image/") || file.type.startsWith("video/")).slice(0, MAX_MEDIA - content.gallery.length);
    if (!list.length) return;
    setError("");
    for (const [index, file] of list.entries()) {
      const video = file.type.startsWith("video/");
      if (file.size > (video ? MAX_VIDEO_BYTES : MAX_IMAGE_BYTES)) { setError(`${file.name} is larger than ${mb(video ? MAX_VIDEO_BYTES : MAX_IMAGE_BYTES)}.`); continue; }
      if (video) {
        const seconds = await videoDuration(file);
        if (seconds > MAX_VIDEO_SECONDS) { setError(`${file.name} is ${Math.round(seconds)} seconds long. Keep videos to 3 minutes or less.`); continue; }
      }
      const label = `Uploading ${list.length > 1 ? `${index + 1} of ${list.length}` : file.name}`;
      setUploading(`${label}…`);
      try {
        const uploaded = await uploadFile(file, (fraction) => setUploading(`${label}… ${Math.round(fraction * 100)}%`));
        setAssets((rows) => [uploaded, ...rows]);
        if (uploaded.kind === "video" || uploaded.status === "approved") setContent((current) => ({
          ...current,
          gallery: current.gallery.length >= MAX_MEDIA ? current.gallery : [...current.gallery, { assetId: uploaded.id, alt: "" }],
        }));
        else setError("A photo didn’t pass our safety check and wasn’t added.");
      } catch (cause) { setError(cause instanceof Error ? cause.message : "Upload failed. Please try again."); }
    }
    setUploading("");
  }
  // Cover image and logo have their own uploads (they are not part of the gallery).
  async function setBrandImage(key: "coverId" | "logoId", file: File | undefined) {
    if (!file) return;
    if (!file.type.startsWith("image/")) { setError("Choose a photo (JPG, PNG, WebP or AVIF)."); return; }
    if (file.size > MAX_IMAGE_BYTES) { setError(`Choose a photo smaller than ${mb(MAX_IMAGE_BYTES)}.`); return; }
    setUploading(key === "coverId" ? "Uploading cover image…" : "Uploading logo…");
    setError("");
    try {
      const uploaded = await uploadFile(file);
      if (uploaded.status !== "approved") { setError("That photo didn’t pass our safety check."); return; }
      setAssets((rows) => [uploaded, ...rows]);
      set({ [key]: uploaded.id });
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Upload failed. Please try again."); }
    finally { setUploading(""); }
  }
  const sectionOrder = normalizeSectionOrder(content.sectionOrder);
  const moveSection = useCallback((from: number, to: number) => setContent((current) => ({ ...current, sectionOrder: moveItem(normalizeSectionOrder(current.sectionOrder), from, to) })), []);
  const sectionSort = useSortable({ count: sectionOrder.length, onMove: moveSection, describe: useCallback((index: number) => sectionLabels[sectionOrder[index]] ?? "Section", [sectionOrder]) });
  async function addVideo(file: File | undefined) {
    if (!file) return;
    if (file.size > MAX_VIDEO_BYTES) { setError(`Choose a video smaller than ${mb(MAX_VIDEO_BYTES)}.`); return; }
    if (await videoDuration(file) > MAX_VIDEO_SECONDS) { setError("Keep your introduction video to 3 minutes or less."); return; }
    setUploading("Uploading video…");
    setError("");
    try { const uploaded = await uploadFile(file, (fraction) => setUploading(`Uploading video… ${Math.round(fraction * 100)}%`)); setAssets((rows) => [uploaded, ...rows]); set({ videoId: uploaded.id }); }
    catch (cause) { setError(cause instanceof Error ? cause.message : "Upload failed. Please try again."); }
    finally { setUploading(""); }
  }
  // Rows follow the gallery order; ids keep the move right even if an upload is still missing.
  const moveMedia = useCallback((from: number, to: number) => setContent((current) => {
    const ids = current.gallery.map((item) => item.assetId);
    const fromIndex = ids.indexOf(galleryMedia[from]?.id ?? -1);
    const toIndex = ids.indexOf(galleryMedia[to]?.id ?? -1);
    if (fromIndex < 0 || toIndex < 0) return current;
    return { ...current, gallery: moveItem(current.gallery, fromIndex, toIndex) };
  }), [galleryMedia]);
  const mediaSort = useSortable({ count: galleryMedia.length, onMove: moveMedia, describe: useCallback((index: number) => `${galleryMedia[index]?.kind === "video" ? "Video" : "Photo"} ${index + 1}`, [galleryMedia]) });
  const altFor = (id: number) => content.gallery.find((item) => item.assetId === id)?.alt ?? "";
  const setAlt = (id: number, alt: string) => setContent((current) => ({ ...current, gallery: current.gallery.map((item) => item.assetId === id ? { ...item, alt } : item) }));
  function removePhoto(id: number) {
    setContent((current) => ({ ...current, gallery: current.gallery.filter((item) => item.assetId !== id) }));
  }

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await persist((event.nativeEvent as SubmitEvent).submitter?.getAttribute("value") || "publish");
  }

  // "unpublish" takes the whole showcase offline; "publish" puts it (back) online.
  async function persist(action: string) {
    if (busy || uploading) return;
    setBusy(true); setError(""); setNotice("");
    // Photos get a simple description from the showcase name unless one was written.
    const ready = { ...content, gallery: content.gallery.map((item, index) => ({ ...item, alt: item.alt.trim().length >= 2 ? item.alt : `${content.name || "Showcase"} photo ${index + 1}` })) };
    try {
      const result = await api<{ showcase: ShowcaseRecord }>("/web/business/showcase", { method: "PUT", body: JSON.stringify({ version, content: ready, action }) });
      setContent(ready);
      setVersion(result.showcase.version);
      setPublished(!!result.showcase.published);
      setPublishedSlug(result.showcase.published?.slug || "");
      setOffline(!!result.showcase.draft?.offline && !result.showcase.published);
      setConfirmOffline(false);
      setNotice(action === "publish" ? "Your showcase is live." : action === "unpublish" ? "Your showcase is offline. Customers can no longer see it." : "Draft saved.");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not save your showcase.");
    } finally { setBusy(false); }
  }

  // Saves the current draft, then shows it in a new tab. The tab opens first so
  // browsers do not treat it as a blocked pop-up.
  async function openPreview() {
    if (busy || uploading) return;
    const tab = window.open("about:blank", "_blank");
    setBusy(true); setError("");
    const ready = { ...content, gallery: content.gallery.map((item, index) => ({ ...item, alt: item.alt.trim().length >= 2 ? item.alt : `${content.name || "Showcase"} photo ${index + 1}` })) };
    try {
      const result = await api<{ showcase: ShowcaseRecord }>("/web/business/showcase", { method: "PUT", body: JSON.stringify({ version, content: ready, action: "draft" }) });
      setVersion(result.showcase.version);
      if (tab) tab.location.href = "/business/showcase/preview";
      else window.location.href = "/business/showcase/preview";
    } catch (cause) {
      tab?.close();
      setError(cause instanceof Error ? cause.message : "Could not save your draft for the preview.");
    } finally { setBusy(false); }
  }

  const header = <header className="showcase-editor-head">
    <Link className="showcase-editor-back" href="/business"><span aria-hidden="true">‹</span> Your business</Link>
    <div className="showcase-editor-title">
      <h1>Your showcase</h1>
      <span className={`showcase-status${published ? " is-live" : offline ? " is-offline" : ""}`}>{published ? "Live" : offline ? "Offline" : "Draft"}</span>
    </div>
    {published ? <div className="showcase-editor-head-actions">
      <Link className="showcase-chip" href={`/showcase/${encodeURIComponent(publishedSlug)}`}>View showcase <span aria-hidden="true">↗</span></Link>
      <button type="button" className="showcase-chip is-quiet" aria-expanded={confirmOffline} aria-controls="shop-offline-confirm" onClick={() => setConfirmOffline((value) => !value)} disabled={busy}>Take offline</button>
    </div> : null}
  </header>;
  const offlinePanels = <>
    {confirmOffline && published ? <section id="shop-offline-confirm" className="shop-offline-panel" role="region" aria-label="Take your showcase offline">
      <div>
        <strong>Take your showcase offline?</strong>
        <p>Customers won’t be able to open your showcase page, and showcase links and cards are removed from your items, services and events. Your listings stay on Tivorah. You can put your showcase back online at any time.</p>
      </div>
      <span>
        <button type="button" className="product-secondary" onClick={() => setConfirmOffline(false)} disabled={busy}>Cancel</button>
        <button type="button" className="product-primary is-danger" onClick={() => void persist("unpublish")} disabled={busy}>{busy ? "Taking offline…" : "Take showcase offline"}</button>
      </span>
    </section> : null}
    {offline ? <p className="shop-offline-note" role="status"><strong>Your showcase is offline.</strong> Customers can’t see your showcase page or links to it. Preview is visible only to you. Choose “Put showcase back online” when you’re ready.</p> : null}
  </>;

  if (!eligibility.eligible) return <>
    {header}
    <section className="showcase-locked">
      <h2>Add something to unlock your showcase</h2>
      <p>Your showcase shows what you offer, so it opens once you have at least one item, service or event on Tivorah.</p>
      <div><Link className="product-primary" href="/business/create?type=item">Sell an item</Link><Link className="product-secondary" href="/business/create?type=service">Offer a service</Link><Link className="product-secondary" href="/business/create?type=event">Create an event</Link></div>
    </section>
  </>;

  return <>
    {header}
    {offlinePanels}
    <form className="showcase-form" onSubmit={save} aria-busy={busy || !!uploading}>
      {/* Looks like the top of the showcase itself: the cover banner with the logo overlapping it. */}
      <section className="showcase-step showcase-brand-step" aria-label="Cover image and logo">
        {(() => {
          const cover = asset(content.coverId);
          const logo = asset(content.logoId);
          const picker = (key: "coverId" | "logoId", label: string, has: boolean) => <label className={`showcase-brand-pick is-${key === "coverId" ? "cover" : "logo"}`}>
            <svg aria-hidden="true" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 8.5A2.5 2.5 0 0 1 6.5 6h1.7l1.3-2h5l1.3 2h1.7A2.5 2.5 0 0 1 20 8.5v8a2.5 2.5 0 0 1-2.5 2.5h-11A2.5 2.5 0 0 1 4 16.5z" /><circle cx="12" cy="12.5" r="3.2" /></svg>
            {key === "coverId" ? <span>{has ? "Change cover" : "Add cover"}</span> : null}
            <input type="file" accept="image/jpeg,image/png,image/webp,image/avif" aria-label={has ? `Change ${label}` : `Add ${label}`} onChange={(e) => { void setBrandImage(key, e.target.files?.[0]); e.target.value = ""; }} disabled={!!uploading || busy} />
          </label>;
          return <>
            <div className="showcase-brand-cover">
              {cover?.url ? <Image src={cover.url} alt="Your cover image" fill sizes="(max-width: 760px) 100vw, 760px" /> : <span className="showcase-brand-empty">Cover image · 1600 × 400 works best</span>}
              {picker("coverId", "cover image", !!cover)}
            </div>
            <div className="showcase-brand-row">
              <div className="showcase-brand-logo">
                {logo?.url ? <Image src={logo.url} alt="Your logo" fill sizes="96px" /> : <span aria-hidden="true">{content.name.trim().charAt(0).toUpperCase() || "+"}</span>}
                {picker("logoId", "logo", !!logo)}
              </div>
              <div className="showcase-brand-remove">
                {cover ? <button type="button" className="showcase-link-button" onClick={() => set({ coverId: null })}>Remove cover</button> : null}
                {logo ? <button type="button" className="showcase-link-button" onClick={() => set({ logoId: null })}>Remove logo</button> : null}
              </div>
            </div>
            <p className="showcase-hint">No cover? Your showcase uses Tivorah’s colours. No logo? It shows your first initial.</p>
          </>;
        })()}
      </section>

      <section className="showcase-step">
        <h2>Basics</h2>
        <label>Showcase name<input value={content.name} onChange={(e) => set({ name: e.target.value })} required minLength={2} maxLength={100} placeholder="e.g. Ada’s Kitchen" /></label>
        <label>Short introduction
          <textarea rows={3} value={content.about} onChange={(e) => set({ about: e.target.value })} required maxLength={240} placeholder="What you offer, in one or two sentences." />
          <span className="showcase-hint">{content.about.length}/240</span>
        </label>
        <label>Showcase address
          <span className="showcase-slug"><span aria-hidden="true">tivorah.com/showcase/</span><input aria-label="Showcase address" value={content.slug} onChange={(e) => set({ slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "") })} required minLength={3} maxLength={60} pattern="[a-z0-9]+(-[a-z0-9]+)*" /></span>
        </label>
      </section>

      <section className="showcase-step">
        <h2>Gallery <span>{content.gallery.length}/{MAX_MEDIA}</span></h2>
        <p className="showcase-hint">Drag <GripIcon /> to reorder. Videos (up to 3 min) appear once reviewed.</p>
        {galleryMedia.length ? <ol className="showcase-sort-list showcase-media-list" ref={mediaSort.listRef} aria-label="Gallery order">
          {galleryMedia.map((item, index) => {
            const video = item.kind === "video";
            const tags = [index === 0 ? "First" : null, content.coverId === item.id ? "Cover" : null, content.videoId === item.id ? "Intro video" : null, video && item.status !== "approved" ? "In review" : null].filter(Boolean);
            return <li key={item.id} className="showcase-sort-row showcase-media-row" {...mediaSort.itemProps(index)}>
              <button type="button" className="showcase-sort-handle" {...mediaSort.handleProps(index)}><GripIcon /></button>
              <span className="showcase-media-thumb">
                {video ? (item.url ? <video src={item.url} muted playsInline preload="metadata" aria-hidden="true" /> : <span aria-hidden="true">▶</span>) : item.url ? <Image src={item.url} alt="" width={128} height={128} /> : null}
                {video ? <span className="showcase-media-play" aria-hidden="true">▶</span> : null}
              </span>
              <span className="showcase-media-copy">
                <span className="showcase-media-title">
                  <strong>{video ? "Video" : "Photo"} {index + 1}</strong>
                  {tags.map((tag) => <em key={tag}>{tag}</em>)}
                  {!video && content.coverId !== item.id ? <button type="button" className="showcase-row-action" onClick={() => set({ coverId: item.id })}>Set as cover</button> : null}
                  {video && content.videoId !== item.id ? <button type="button" className="showcase-row-action" onClick={() => set({ videoId: item.id })}>Use as intro</button> : null}
                </span>
                <input aria-label={`Describe ${video ? "video" : "photo"} ${index + 1} for screen readers`} placeholder="Add a description" maxLength={160} value={altFor(item.id)} onChange={(e) => setAlt(item.id, e.target.value)} />
              </span>
              <button type="button" className="showcase-row-remove" aria-label={`Remove ${video ? "video" : "photo"} ${index + 1}`} onClick={() => removePhoto(item.id)}>
                <svg aria-hidden="true" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M6 6l12 12M18 6 6 18" /></svg>
              </button>
            </li>;
          })}
        </ol> : null}
        {content.gallery.length < MAX_MEDIA ? <label className="showcase-add-media">
          <input type="file" multiple accept="image/jpeg,image/png,image/webp,image/avif,video/mp4,video/webm,video/quicktime" onChange={(e) => { void addMedia(e.target.files); e.target.value = ""; }} disabled={!!uploading || busy} />
          <span aria-hidden="true">+</span>
          <span><strong>Add photos or videos</strong><small>{MAX_MEDIA - content.gallery.length} left · photos up to {mb(MAX_IMAGE_BYTES)}</small></span>
        </label> : null}
        {uploading ? <p className="showcase-upload-status" role="status"><span className="showcase-upload-spinner" aria-hidden="true" />{uploading}</p> : null}
        <p className="showcase-sr" aria-live="polite">{mediaSort.announcement}</p>
      </section>

      <section className="showcase-step">
        <h2>Also show my showcase card on</h2>
        <div className="showcase-switches">
          {placementLabels.map(([key, label, hint]) => <label key={key} className="showcase-switch">
            <input type="checkbox" role="switch" checked={placements[key]} onChange={(e) => set({ placements: { ...placements, [key]: e.target.checked } })} />
            <span className="showcase-switch-track" aria-hidden="true" />
            <span><strong>{label}</strong><small>{hint}</small></span>
          </label>)}
        </div>
        <div className="showcase-switches showcase-card-content">
          <p className="showcase-hint">On the card</p>
          <label className="showcase-switch">
            <input type="checkbox" role="switch" checked={placements.gallery !== false} onChange={(e) => set({ placements: { ...placements, gallery: e.target.checked } })} />
            <span className="showcase-switch-track" aria-hidden="true" />
            <span><strong>Show my gallery</strong><small>Up to 6 photos and videos from your gallery</small></span>
          </label>
        </div>
      </section>

      <section className="showcase-step">
        <h2>Showcase layout</h2>
        <p className="showcase-hint">Drag to set the order. Switch off what you don’t want to show.</p>
        <ol className="showcase-sort-list showcase-order" ref={sectionSort.listRef} aria-label="Showcase section order">
          {sectionOrder.map((key, index) => {
            const hidden = (content.hiddenSections ?? []).includes(key);
            return <li key={key} className={`showcase-sort-row${hidden ? " is-hidden" : ""}`} {...sectionSort.itemProps(index)}>
              <button type="button" className="showcase-sort-handle" {...sectionSort.handleProps(index)}><GripIcon /></button>
              <span className="showcase-order-index" aria-hidden="true">{index + 1}</span>
              <strong>{sectionLabels[key]}{hidden ? <small>Hidden</small> : null}</strong>
              <label className="showcase-switch showcase-order-show">
                <input type="checkbox" role="switch" checked={!hidden} aria-label={`Show ${sectionLabels[key]} on my showcase`} onChange={(event) => set({ hiddenSections: event.target.checked ? (content.hiddenSections ?? []).filter((item) => item !== key) : [...(content.hiddenSections ?? []), key] })} />
                <span className="showcase-switch-track" aria-hidden="true" />
              </label>
            </li>;
          })}
        </ol>
        <p className="showcase-sr" aria-live="polite">{sectionSort.announcement}</p>
      </section>

      <details className="showcase-step showcase-more">
        <summary><span><strong>More details</strong><small>Story, hours, service area, intro video</small></span><svg aria-hidden="true" viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6" /></svg></summary>
        <div className="showcase-more-body">
        {optionalFields.map(([key, label, max, placeholder]) => <label key={key}>{label}
          {max > 120 ? <textarea rows={key === "story" ? 3 : 1} maxLength={max} value={content[key]} placeholder={placeholder} onChange={(e) => set({ [key]: e.target.value })} /> : <input maxLength={max} value={content[key]} placeholder={placeholder} onChange={(e) => set({ [key]: e.target.value })} />}
        </label>)}
        <div className="showcase-video">
          <strong>Introduction video</strong>
          <p className="showcase-hint">Up to 3 minutes and {mb(MAX_VIDEO_BYTES)}. Shown once Tivorah has reviewed it.</p>
          {content.videoId && asset(content.videoId)?.url ? <video className="showcase-intro-preview" src={asset(content.videoId)!.url!} controls preload="metadata" aria-label="Introduction video preview" /> : null}
          {content.videoId ? <p className="showcase-hint">Video #{content.videoId} · {asset(content.videoId)?.status === "approved" ? "approved" : asset(content.videoId)?.status === "rejected" ? "not approved — upload a revised video" : "in review"} <button type="button" className="showcase-link" onClick={() => set({ videoId: null })}>Remove</button></p> : null}
          {!content.videoId && videos.length ? <p className="showcase-hint">Earlier uploads: {videos.map((video) => <button key={video.id} type="button" className="showcase-link" onClick={() => set({ videoId: video.id })}>Use video #{video.id} ({video.status})</button>)}</p> : null}
          <label className="product-secondary showcase-video-upload">Upload a video<input type="file" accept="video/mp4,video/webm,video/quicktime" onChange={(e) => { void addVideo(e.target.files?.[0]); e.target.value = ""; }} disabled={!!uploading || busy} /></label>
          {content.videoId ? <>
            <label>Video transcript (optional)<textarea rows={4} maxLength={10000} value={content.videoTranscript} onChange={(e) => set({ videoTranscript: e.target.value })} /></label>
            <label>Timed captions (WebVTT, optional)<textarea rows={4} maxLength={100000} value={content.videoCaptions || ""} placeholder={"WEBVTT\n\n00:00:00.000 --> 00:00:03.000\nWelcome to our shop."} onChange={(e) => set({ videoCaptions: e.target.value })} /></label>
          </> : null}
        </div>
        </div>
      </details>

      {error ? <p className="product-error" role="alert">{error}</p> : null}
      {notice ? <p className="product-notice" role="status">{notice}</p> : null}
      <div className="showcase-actions" data-sticky-save="">
        <button type="button" className="showcase-link" disabled={busy || !!uploading} onClick={() => void openPreview()}>Preview <span aria-hidden="true">↗</span></button>
        <span>
          {published ? null : <button className="product-secondary" value="draft" disabled={busy || !!uploading}>Save draft</button>}
          <button className="product-primary" value="publish" disabled={busy || !!uploading}>{busy ? <><span className="button-progress" aria-hidden="true" />Saving…</> : published ? "Update" : offline ? "Put showcase back online" : "Publish showcase"}</button>
        </span>
      </div>
    </form>
  </>;
}

function GripIcon() {
  return <svg className="showcase-grip" aria-hidden="true" viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><circle cx="9" cy="6" r="1.6" /><circle cx="15" cy="6" r="1.6" /><circle cx="9" cy="12" r="1.6" /><circle cx="15" cy="12" r="1.6" /><circle cx="9" cy="18" r="1.6" /><circle cx="15" cy="18" r="1.6" /></svg>;
}

function Load({ username }: { username: string }) {
  const { data, loading, error, retry } = usePrivateResource<{ showcase: ShowcaseRecord | null; assets: ShowcaseAsset[]; eligibility?: ShowcaseEligibility }>("/web/business/showcase");
  if (loading && !data) return <AccountSurfaceLoading embedded />;
  if (error || !data) return <div className="product-notice" role="alert"><p>{error || "Showcase unavailable."}</p><button className="product-secondary" onClick={retry}>Try again</button></div>;
  return <Editor record={data.showcase} media={data.assets} username={username} eligibility={data.eligibility ?? { items: 0, services: 0, eligible: true }} />;
}
export function ShowcaseEditor() {
  return <AccountGate>{(account) => <Load username={account.username} />}</AccountGate>;
}
