"use client";
import { AccountSurfaceLoading } from "../../account/surface-loading";
import Image from "next/image";
import Link from "next/link";
import { FormEvent, useState } from "react";
import { AccountGate } from "../../account/gate";
import { usePrivateResource } from "../../../hooks/use-private-resource";
import { api } from "../../../lib/api/client";
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

// The showcase is the promotional part of a seller's shop: a name, a short
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
const MAX_VIDEO_SECONDS = 60;
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
async function uploadFile(file: File) {
  const form = new FormData();
  form.set("file", file);
  return (await api<{ asset: ShowcaseAsset }>("/web/business/showcase/media", { method: "POST", body: form })).asset;
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
      if (file.size > 25 * 1024 * 1024) { setError(`${file.name} is larger than 25 MB.`); continue; }
      if (file.type.startsWith("video/")) {
        const seconds = await videoDuration(file);
        if (seconds > MAX_VIDEO_SECONDS) { setError(`${file.name} is ${Math.round(seconds)} seconds long. Keep videos to ${MAX_VIDEO_SECONDS} seconds or less.`); continue; }
      }
      setUploading(`Uploading ${index + 1} of ${list.length}…`);
      try {
        const uploaded = await uploadFile(file);
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
    if (file.size > 25 * 1024 * 1024) { setError("Choose a photo smaller than 25 MB."); return; }
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
  function moveSection(index: number, delta: number) {
    setContent((current) => {
      const order = normalizeSectionOrder(current.sectionOrder);
      const target = index + delta;
      if (target < 0 || target >= order.length) return current;
      [order[index], order[target]] = [order[target], order[index]];
      return { ...current, sectionOrder: order };
    });
  }
  async function addVideo(file: File | undefined) {
    if (!file) return;
    if (file.size > 25 * 1024 * 1024) { setError("Choose a video smaller than 25 MB."); return; }
    setUploading("Uploading video…");
    setError("");
    try { const uploaded = await uploadFile(file); setAssets((rows) => [uploaded, ...rows]); set({ videoId: uploaded.id }); }
    catch (cause) { setError(cause instanceof Error ? cause.message : "Upload failed. Please try again."); }
    finally { setUploading(""); }
  }
  function removePhoto(id: number) {
    setContent((current) => ({ ...current, gallery: current.gallery.filter((item) => item.assetId !== id) }));
  }

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await persist((event.nativeEvent as SubmitEvent).submitter?.getAttribute("value") || "publish");
  }

  // "unpublish" takes the whole shop offline; "publish" puts it (back) online.
  async function persist(action: string) {
    if (busy || uploading) return;
    setBusy(true); setError(""); setNotice("");
    // Photos get a simple description from the shop name unless one was written.
    const ready = { ...content, gallery: content.gallery.map((item, index) => ({ ...item, alt: item.alt.trim().length >= 2 ? item.alt : `${content.name || "Shop"} photo ${index + 1}` })) };
    try {
      const result = await api<{ showcase: ShowcaseRecord }>("/web/business/showcase", { method: "PUT", body: JSON.stringify({ version, content: ready, action }) });
      setContent(ready);
      setVersion(result.showcase.version);
      setPublished(!!result.showcase.published);
      setPublishedSlug(result.showcase.published?.slug || "");
      setOffline(!!result.showcase.draft?.offline && !result.showcase.published);
      setConfirmOffline(false);
      setNotice(action === "publish" ? "Your shop is live." : action === "unpublish" ? "Your shop is offline. Customers can no longer see it." : "Draft saved.");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not save your shop.");
    } finally { setBusy(false); }
  }

  // Saves the current draft, then shows it in a new tab. The tab opens first so
  // browsers do not treat it as a blocked pop-up.
  async function openPreview() {
    if (busy || uploading) return;
    const tab = window.open("about:blank", "_blank");
    setBusy(true); setError("");
    const ready = { ...content, gallery: content.gallery.map((item, index) => ({ ...item, alt: item.alt.trim().length >= 2 ? item.alt : `${content.name || "Shop"} photo ${index + 1}` })) };
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
    <div>
      <Link className="showcase-editor-back" href="/business">← Your business</Link>
      <h1>Your shop</h1>
      <p>Your shop shows your items, services and events. Add photos, short videos and an introduction so customers get to know you.</p>
    </div>
    <div className="showcase-editor-head-actions">
      <span className={`showcase-status${published ? " is-live" : offline ? " is-offline" : ""}`}>{published ? "Live" : offline ? "Offline" : "Draft"}</span>
      {published ? <>
        <Link className="product-secondary" href={`/shops/${encodeURIComponent(publishedSlug)}`}>View shop</Link>
        <button type="button" className="showcase-link" aria-expanded={confirmOffline} aria-controls="shop-offline-confirm" onClick={() => setConfirmOffline((value) => !value)} disabled={busy}>Take offline</button>
      </> : null}
    </div>
  </header>;
  const offlinePanels = <>
    {confirmOffline && published ? <section id="shop-offline-confirm" className="shop-offline-panel" role="region" aria-label="Take your shop offline">
      <div>
        <strong>Take your shop offline?</strong>
        <p>Customers won’t be able to open your shop page, and shop links and cards are removed from your items, services and events. Your listings stay on Tivorah. You can put your shop back online at any time.</p>
      </div>
      <span>
        <button type="button" className="product-secondary" onClick={() => setConfirmOffline(false)} disabled={busy}>Cancel</button>
        <button type="button" className="product-primary is-danger" onClick={() => void persist("unpublish")} disabled={busy}>{busy ? "Taking offline…" : "Take shop offline"}</button>
      </span>
    </section> : null}
    {offline ? <p className="shop-offline-note" role="status"><strong>Your shop is offline.</strong> Customers can’t see your shop page or links to it. Preview is visible only to you. Choose “Put shop back online” when you’re ready.</p> : null}
  </>;

  if (!eligibility.eligible) return <>
    {header}
    <section className="showcase-locked">
      <h2>Add something to unlock your shop</h2>
      <p>Your shop shows what you offer, so it opens once you have at least one item, service or event on Tivorah.</p>
      <div><Link className="product-primary" href="/business/create?type=item">Sell an item</Link><Link className="product-secondary" href="/business/create?type=service">Offer a service</Link><Link className="product-secondary" href="/business/create?type=event">Create an event</Link></div>
    </section>
  </>;

  return <>
    {header}
    {offlinePanels}
    <form className="showcase-form" onSubmit={save} aria-busy={busy || !!uploading}>
      <section className="showcase-step">
        <h2>Cover image &amp; logo</h2>
        <p className="showcase-hint">Without a cover, your shop uses Tivorah’s colours. Without a logo, it shows your first initial.</p>
        <div className="showcase-brand">
          {(["coverId", "logoId"] as const).map((key) => {
            const image = asset(content[key]);
            const label = key === "coverId" ? "Cover image" : "Logo";
            return <div key={key} className={`showcase-brand-slot ${key === "coverId" ? "is-cover" : "is-logo"}`}>
              <span className="showcase-brand-label">{label}</span>
              <div className="showcase-brand-frame">
                {image?.url ? <Image src={image.url} alt={`Your ${label.toLowerCase()}`} fill sizes={key === "coverId" ? "480px" : "120px"} /> : <span aria-hidden="true">{key === "coverId" ? "1600 × 400 recommended" : content.name.trim().charAt(0).toUpperCase() || "+"}</span>}
              </div>
              <div className="showcase-brand-actions">
                <label className="showcase-link-button">{image ? "Change" : `Add ${label.toLowerCase()}`}<input type="file" accept="image/jpeg,image/png,image/webp,image/avif" aria-label={image ? `Change ${label.toLowerCase()}` : `Add ${label.toLowerCase()}`} onChange={(e) => { void setBrandImage(key, e.target.files?.[0]); e.target.value = ""; }} disabled={!!uploading || busy} /></label>
                {image ? <button type="button" className="showcase-link-button" onClick={() => set({ [key]: null })}>Remove</button> : null}
              </div>
            </div>;
          })}
        </div>
      </section>

      <section className="showcase-step">
        <h2>Basics</h2>
        <label>Shop name<input value={content.name} onChange={(e) => set({ name: e.target.value })} required minLength={2} maxLength={100} placeholder="e.g. Ada’s Kitchen" /></label>
        <label>Short introduction
          <textarea rows={3} value={content.about} onChange={(e) => set({ about: e.target.value })} required maxLength={240} placeholder="What you offer, in one or two sentences." />
          <span className="showcase-hint">{content.about.length}/240</span>
        </label>
        <label>Shop address
          <span className="showcase-slug"><span aria-hidden="true">tivorah.com/shops/</span><input aria-label="Shop address" value={content.slug} onChange={(e) => set({ slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "") })} required minLength={3} maxLength={60} pattern="[a-z0-9]+(-[a-z0-9]+)*" /></span>
        </label>
      </section>

      <section className="showcase-step">
        <h2>Gallery <span>{content.gallery.length}/{MAX_MEDIA}</span></h2>
        <p className="showcase-hint">Show your products, your space or a quick ad for your business. Videos can be up to {MAX_VIDEO_SECONDS} seconds and appear once Tivorah has reviewed them.</p>
        <div className="showcase-photos">
          {galleryMedia.map((item) => <figure key={item.id} className={content.coverId === item.id ? "is-cover" : ""}>
            {item.kind === "video"
              ? (item.url ? <video src={item.url} muted playsInline preload="metadata" aria-hidden="true" /> : <span className="showcase-video-placeholder" aria-hidden="true">Video</span>)
              : item.url ? <Image src={item.url} alt="" width={240} height={180} /> : null}
            {item.kind === "video" ? <span className="showcase-badge">{item.status === "approved" ? "Video" : "Video · in review"}</span> : null}
            <button type="button" className="showcase-remove" aria-label={item.kind === "video" ? "Remove video" : "Remove photo"} onClick={() => removePhoto(item.id)}>×</button>
          </figure>)}
          {content.gallery.length < MAX_MEDIA ? <label className="showcase-add-photo">
            <input type="file" multiple accept="image/jpeg,image/png,image/webp,image/avif,video/mp4,video/webm,video/quicktime" onChange={(e) => { void addMedia(e.target.files); e.target.value = ""; }} disabled={!!uploading || busy} />
            <span aria-hidden="true">+</span>Add photos or videos
          </label> : null}
        </div>
        {uploading ? <p className="showcase-hint" role="status">{uploading}</p> : null}
      </section>

      <section className="showcase-step">
        <h2>Also show my shop card on</h2>
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
        <h2>Shop layout</h2>
        <p className="showcase-hint">Choose what customers see first, and switch off anything you don’t want to show.</p>
        <ol className="showcase-order">
          {normalizeSectionOrder(content.sectionOrder).map((key, index, order) => {
            const hidden = (content.hiddenSections ?? []).includes(key);
            return <li key={key} className={hidden ? "is-hidden" : ""}>
            <span className="showcase-order-index" aria-hidden="true">{index + 1}</span>
            <strong>{sectionLabels[key]}{hidden ? <small> · Hidden</small> : null}</strong>
            <label className="showcase-switch showcase-order-show">
              <input type="checkbox" role="switch" checked={!hidden} aria-label={`Show ${sectionLabels[key]} on my shop`} onChange={(event) => set({ hiddenSections: event.target.checked ? (content.hiddenSections ?? []).filter((item) => item !== key) : [...(content.hiddenSections ?? []), key] })} />
              <span className="showcase-switch-track" aria-hidden="true" />
            </label>
            <span className="showcase-order-actions">
              <button type="button" aria-label={`Move ${key} up`} disabled={index === 0} onClick={() => moveSection(index, -1)}><svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="m6 15 6-6 6 6" /></svg></button>
              <button type="button" aria-label={`Move ${key} down`} disabled={index === order.length - 1} onClick={() => moveSection(index, 1)}><svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6" /></svg></button>
            </span>
          </li>; })}
        </ol>
      </section>

      <details className="showcase-step showcase-more">
        <summary>More details <span>Optional</span></summary>
        {optionalFields.map(([key, label, max, placeholder]) => <label key={key}>{label}
          {max > 120 ? <textarea rows={key === "story" ? 4 : 2} maxLength={max} value={content[key]} placeholder={placeholder} onChange={(e) => set({ [key]: e.target.value })} /> : <input maxLength={max} value={content[key]} placeholder={placeholder} onChange={(e) => set({ [key]: e.target.value })} />}
        </label>)}
        <div className="showcase-video">
          <strong>Introduction video</strong>
          <p className="showcase-hint">Up to 25 MB. Videos are reviewed by Tivorah before they appear, and need captions and a transcript.</p>
          {content.videoId ? <p className="showcase-hint">Video #{content.videoId} · {asset(content.videoId)?.status ?? "uploaded"} <button type="button" className="showcase-link" onClick={() => set({ videoId: null })}>Remove</button></p> : null}
          {!content.videoId && videos.length ? <p className="showcase-hint">Earlier uploads: {videos.map((video) => <button key={video.id} type="button" className="showcase-link" onClick={() => set({ videoId: video.id })}>Use video #{video.id} ({video.status})</button>)}</p> : null}
          <label className="product-secondary showcase-video-upload">Upload a video<input type="file" accept="video/mp4,video/webm,video/quicktime" onChange={(e) => { void addVideo(e.target.files?.[0]); e.target.value = ""; }} disabled={!!uploading || busy} /></label>
          {content.videoId ? <>
            <label>Video transcript<textarea rows={4} required maxLength={10000} value={content.videoTranscript} onChange={(e) => set({ videoTranscript: e.target.value })} /></label>
            <label>Timed captions (WebVTT)<textarea rows={4} maxLength={100000} value={content.videoCaptions || ""} placeholder={"WEBVTT\n\n00:00:00.000 --> 00:00:03.000\nWelcome to our shop."} onChange={(e) => set({ videoCaptions: e.target.value })} /></label>
          </> : null}
        </div>
      </details>

      {error ? <p className="product-error" role="alert">{error}</p> : null}
      {notice ? <p className="product-notice" role="status">{notice}</p> : null}
      <div className="showcase-actions">
        <button type="button" className="showcase-link" disabled={busy || !!uploading} onClick={() => void openPreview()}>Preview <span aria-hidden="true">↗</span></button>
        <span>
          {published ? null : <button className="product-secondary" value="draft" disabled={busy || !!uploading}>Save draft</button>}
          <button className="product-primary" value="publish" disabled={busy || !!uploading}>{busy ? <><span className="button-progress" aria-hidden="true" />Saving…</> : published ? "Update shop" : offline ? "Put shop back online" : "Publish shop"}</button>
        </span>
      </div>
    </form>
  </>;
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
