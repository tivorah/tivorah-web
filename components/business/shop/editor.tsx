"use client";
import { AccountSurfaceLoading } from "../../account/surface-loading";
import { firstFrame } from "../../../lib/video-frame";
import Image from "next/image";
import Link from "next/link";
import { FormEvent, useCallback, useState, type CSSProperties } from "react";
import { moveItem, useSortable } from "../../ui/use-sortable";
import { BUSINESS_TEMPLATES, SHOP_ACCENTS, templateFor, type BusinessType, type ShopAccent } from "./templates";
import { AccountGate } from "../../account/gate";
import { usePrivateResource } from "../../../hooks/use-private-resource";
import { api } from "../../../lib/api/client";
import { directUpload, directUploadUnavailable } from "../../../lib/direct-upload";
import {
  ShopAsset,
  ShopContent,
  ShopEligibility,
  ShopRecord,
  defaultPlacements,
  normalizeSectionOrder,
  sectionLabels,
  emptyShop,
} from "./types";

// The shop is the promotional part of a seller's shop: a name, a short
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
    const result = await directUpload<{ asset?: ShopAsset }>(file, { purpose: "shop", kind, durationSeconds: seconds || undefined, onProgress });
    if (result.asset) return result.asset;
    throw new Error("Upload finished but the file wasn’t added. Please try again.");
  } catch (error) {
    if (!directUploadUnavailable(error)) throw error;
    if (file.size > FALLBACK_MAX_BYTES) throw new Error(`${file.name} is too large to upload right now. Choose a file under ${mb(FALLBACK_MAX_BYTES)}.`);
    if (kind === "video" && seconds > FALLBACK_VIDEO_SECONDS) throw new Error(`${file.name} is too long to upload right now. Keep it under ${FALLBACK_VIDEO_SECONDS} seconds.`);
    const form = new FormData();
    form.set("file", file);
    return (await api<{ asset: ShopAsset }>("/web/business/shop/media", { method: "POST", body: form })).asset;
  }
}

function Editor({ record, media, username, eligibility }: { record: ShopRecord | null; media: ShopAsset[]; username: string; eligibility: ShopEligibility }) {
  const [content, setContent] = useState<ShopContent>({ ...(record?.draft ?? emptyShop(username)), placements: record?.draft?.placements ?? defaultPlacements });
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
  const set = (patch: Partial<ShopContent>) => setContent((current) => ({ ...current, ...patch }));
  // A business type sets up the layout and section names for that kind of business; the seller's
  // text, photos and listings are never touched, and everything stays editable below.
  const template = templateFor(content.businessType);
  const chooseBusiness = (key: BusinessType) => {
    const next = templateFor(key);
    set({ businessType: key, sectionOrder: next.order, hiddenSections: next.hidden, sectionTitles: next.titles });
  };
  const asset = (id: number | null) => assets.find((item) => item.id === id);
  const galleryMedia = content.gallery.map((item) => asset(item.assetId)).filter((item): item is ShopAsset => !!item);
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

  // "unpublish" takes the whole shop offline; "publish" puts it (back) online.
  async function persist(action: string) {
    if (busy || uploading) return;
    setBusy(true); setError(""); setNotice("");
    // Photos get a simple description from the shop name unless one was written.
    const ready = { ...content, gallery: content.gallery.map((item, index) => ({ ...item, alt: item.alt.trim().length >= 2 ? item.alt : `${content.name || "Shop"} photo ${index + 1}` })) };
    try {
      const result = await api<{ shop: ShopRecord }>("/web/business/shop", { method: "PUT", body: JSON.stringify({ version, content: ready, action }) });
      setContent(ready);
      setVersion(result.shop.version);
      setPublished(!!result.shop.published);
      setPublishedSlug(result.shop.published?.slug || "");
      setOffline(!!result.shop.draft?.offline && !result.shop.published);
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
      const result = await api<{ shop: ShopRecord }>("/web/business/shop", { method: "PUT", body: JSON.stringify({ version, content: ready, action: "draft" }) });
      setVersion(result.shop.version);
      if (tab) tab.location.href = "/business/shop/preview";
      else window.location.href = "/business/shop/preview";
    } catch (cause) {
      tab?.close();
      setError(cause instanceof Error ? cause.message : "Could not save your draft for the preview.");
    } finally { setBusy(false); }
  }

  const header = <header className="shop-editor-head">
    <Link className="shop-editor-back" href="/business"><span aria-hidden="true">‹</span> Your business</Link>
    <p className="product-eyebrow">YOUR SHOP</p>
    <div className="shop-editor-title">
      <h1>Your shop</h1>
      <span className={`shop-status${published ? " is-live" : offline ? " is-offline" : ""}`}>{published ? "Live" : offline ? "Offline" : "Draft"}</span>
    </div>
    <p className="shop-editor-intro">One page for everything you offer: your look, what kind of business you are, and how your shop is laid out.</p>
    {published ? <div className="shop-editor-head-actions">
      <Link className="shop-chip" href={`/shops/${encodeURIComponent(publishedSlug)}`}>View shop <span aria-hidden="true">↗</span></Link>
      <button type="button" className="shop-chip is-quiet" aria-expanded={confirmOffline} aria-controls="shop-offline-confirm" onClick={() => setConfirmOffline((value) => !value)} disabled={busy}>Take offline</button>
    </div> : null}
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
    <section className="product-empty shop-locked">
      <h2>Add something to unlock your shop</h2>
      <p>Your shop shows what you offer, so it opens once you have at least one item, service or event on Tivorah.</p>
      <div><Link className="product-primary" href="/business/create?type=item">Sell an item</Link><Link className="product-secondary" href="/business/create?type=service">Offer a service</Link><Link className="product-secondary" href="/business/create?type=event">Create an event</Link></div>
    </section>
  </>;

  // Same layout as Sell an item / Create an event: numbered steps, sections, and a live summary.
  const checklist = [
    { id: "name", label: "Shop name and introduction", section: "shop-basics", done: content.name.trim().length >= 2 && content.about.trim().length > 0 },
    { id: "type", label: "Kind of business", section: "shop-business", done: !!content.businessType },
    { id: "cover", label: "Cover image", section: "shop-look", done: !!content.coverId },
    { id: "logo", label: "Logo", section: "shop-look", done: !!content.logoId },
    { id: "gallery", label: "At least 3 photos", section: "shop-gallery", done: content.gallery.length >= 3 },
    { id: "details", label: "Opening hours or pickup", section: "shop-details", done: !!(content.hours.trim() || content.fulfilment.trim() || content.serviceArea.trim()) },
  ];
  const doneCount = checklist.filter((item) => item.done).length;
  const stages = [["shop-look", "Look"], ["shop-basics", "Basics"], ["shop-business", "Business"], ["shop-gallery", "Gallery"], ["shop-layout", "Layout"], ["shop-details", "Details"], ["shop-placements", "Cards"]] as const;
  const jump = (id: string) => {
    const section = document.getElementById(id);
    section?.scrollIntoView({ behavior: "smooth", block: "start" });
    window.setTimeout(() => section?.querySelector<HTMLElement>("input:not([type=hidden]), textarea, button")?.focus({ preventScroll: true }), 350);
  };
  const step = (n: number) => <span className="create-step-no" aria-hidden="true">{n}</span>;
  const previewCover = asset(content.coverId);
  const previewLogo = asset(content.logoId);
  const accentColor = SHOP_ACCENTS[content.accent ?? "violet"].color;

  return <div className="shop-editor-page business-create-page create-shop">
    {header}
    {offlinePanels}
    <nav className="create-stages" aria-label="Steps">
      <ol>{stages.map(([id, label], index) => { const done = checklist.filter((item) => item.section === id); const isDone = done.length > 0 && done.every((item) => item.done); return <li key={id} className={isDone ? "is-done" : ""}>
        <button type="button" onClick={() => jump(id)}>
          <span className="create-stage-dot" aria-hidden="true">{isDone ? "✓" : index + 1}</span>
          <span>{label}</span>
        </button>
      </li>; })}</ol>
    </nav>
    <form className="create-shell shop-form" onSubmit={save} aria-busy={busy || !!uploading}>
      <div className="create-main">
      {/* Looks like the top of the shop itself: the cover banner with the logo overlapping it. */}
      <section id="shop-look" className="shop-step create-section shop-brand-step" aria-labelledby="shop-look-title">
        <h2 id="shop-look-title">{step(1)}Cover &amp; logo</h2>
        {(() => {
          const cover = asset(content.coverId);
          const logo = asset(content.logoId);
          const picker = (key: "coverId" | "logoId", label: string, has: boolean) => <label className={`shop-brand-pick is-${key === "coverId" ? "cover" : "logo"}`}>
            <svg aria-hidden="true" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 8.5A2.5 2.5 0 0 1 6.5 6h1.7l1.3-2h5l1.3 2h1.7A2.5 2.5 0 0 1 20 8.5v8a2.5 2.5 0 0 1-2.5 2.5h-11A2.5 2.5 0 0 1 4 16.5z" /><circle cx="12" cy="12.5" r="3.2" /></svg>
            {key === "coverId" ? <span>{has ? "Change cover" : "Add cover"}</span> : null}
            <input type="file" accept="image/jpeg,image/png,image/webp,image/avif" aria-label={has ? `Change ${label}` : `Add ${label}`} onChange={(e) => { void setBrandImage(key, e.target.files?.[0]); e.target.value = ""; }} disabled={!!uploading || busy} />
          </label>;
          return <>
            <div className="shop-brand-cover">
              {cover?.url ? <Image src={cover.url} alt="Your cover image" fill sizes="(max-width: 760px) 100vw, 760px" /> : <span className="shop-brand-empty">Cover image · 1600 × 400 works best</span>}
              {picker("coverId", "cover image", !!cover)}
            </div>
            <div className="shop-brand-row">
              <div className="shop-brand-logo">
                {logo?.url ? <Image src={logo.url} alt="Your logo" fill sizes="96px" /> : <span aria-hidden="true">{content.name.trim().charAt(0).toUpperCase() || "+"}</span>}
                {picker("logoId", "logo", !!logo)}
              </div>
              <div className="shop-brand-remove">
                {cover ? <button type="button" className="shop-link-button" onClick={() => set({ coverId: null })}>Remove cover</button> : null}
                {logo ? <button type="button" className="shop-link-button" onClick={() => set({ logoId: null })}>Remove logo</button> : null}
              </div>
            </div>
            <p className="shop-hint">No cover? Your shop uses Tivorah’s colours. No logo? It shows your first initial.</p>
          </>;
        })()}
      </section>

      <section id="shop-basics" className="shop-step create-section">
        <h2>{step(2)}Basics</h2>
        <label>Shop name<input value={content.name} onChange={(e) => set({ name: e.target.value })} required minLength={2} maxLength={100} placeholder={template.prompts.name} /></label>
        <label>Short introduction
          <textarea rows={3} value={content.about} onChange={(e) => set({ about: e.target.value })} required maxLength={240} placeholder={template.prompts.about} />
          <span className="shop-hint">{content.about.length}/240</span>
        </label>
        <label>Shop address
          <span className="shop-slug"><span aria-hidden="true">tivorah.com/shops/</span><input aria-label="Shop address" value={content.slug} onChange={(e) => set({ slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "") })} required minLength={3} maxLength={60} pattern="[a-z0-9]+(-[a-z0-9]+)*" /></span>
        </label>
      </section>

      <section id="shop-business" className="shop-step create-section" aria-labelledby="shop-business-title">
        <h2 id="shop-business-title">{step(3)}Your business</h2>
        <p className="shop-hint">Pick the closest match. It sets up your sections and their names for you; you can change anything below.</p>
        <div className="shop-business-grid" role="radiogroup" aria-label="Kind of business">
          {BUSINESS_TEMPLATES.map((item) => <button key={item.key} type="button" role="radio" aria-checked={content.businessType === item.key} className={`shop-business-option${content.businessType === item.key ? " is-selected" : ""}`} onClick={() => chooseBusiness(item.key)}>
            <span aria-hidden="true">{item.emoji}</span>{item.label}
          </button>)}
        </div>
        <fieldset className="shop-accent-field">
          <legend>Accent colour</legend>
          <div className="shop-accent-row">
            {(Object.entries(SHOP_ACCENTS) as [ShopAccent, { label: string; color: string }][]).map(([key, accent]) => <label key={key} className={`shop-accent-swatch${(content.accent ?? "violet") === key ? " is-selected" : ""}`} title={accent.label}>
              <input type="radio" name="shop-accent" value={key} checked={(content.accent ?? "violet") === key} onChange={() => set({ accent: key })} />
              <span style={{ background: accent.color }} aria-hidden="true" />
              <span className="shop-sr">{accent.label}</span>
            </label>)}
          </div>
          <span className="shop-hint">Used for your shop’s tabs, links and highlights.</span>
        </fieldset>
      </section>

      <section id="shop-gallery" className="shop-step create-section">
        <h2>{step(4)}Gallery <span>{content.gallery.length}/{MAX_MEDIA}</span></h2>
        <p className="shop-hint">Drag <GripIcon /> to reorder. Videos (up to 3 min) appear once reviewed.</p>
        {galleryMedia.length ? <ol className="shop-sort-list shop-media-list" ref={mediaSort.listRef} aria-label="Gallery order">
          {galleryMedia.map((item, index) => {
            const video = item.kind === "video";
            const tags = [index === 0 ? "First" : null, content.coverId === item.id ? "Cover" : null, content.videoId === item.id ? "Intro video" : null, video && item.status !== "approved" ? "In review" : null].filter(Boolean);
            return <li key={item.id} className="shop-sort-row shop-media-row" {...mediaSort.itemProps(index)}>
              <button type="button" className="shop-sort-handle" {...mediaSort.handleProps(index)}><GripIcon /></button>
              <span className="shop-media-thumb">
                {video ? (item.url ? <video src={firstFrame(item.url)} muted playsInline preload="metadata" aria-hidden="true" /> : <span aria-hidden="true">▶</span>) : item.url ? <Image src={item.url} alt="" width={128} height={128} /> : null}
                {video ? <span className="shop-editor-media-play" aria-hidden="true">▶</span> : null}
              </span>
              <span className="shop-media-copy">
                <span className="shop-media-title">
                  <strong>{video ? "Video" : "Photo"} {index + 1}</strong>
                  {tags.map((tag) => <em key={tag}>{tag}</em>)}
                  {!video && content.coverId !== item.id ? <button type="button" className="shop-row-action" onClick={() => set({ coverId: item.id })}>Set as cover</button> : null}
                  {video && content.videoId !== item.id ? <button type="button" className="shop-row-action" onClick={() => set({ videoId: item.id })}>Use as intro</button> : null}
                </span>
                <input aria-label={`Describe ${video ? "video" : "photo"} ${index + 1} for screen readers`} placeholder="Add a description" maxLength={160} value={altFor(item.id)} onChange={(e) => setAlt(item.id, e.target.value)} />
              </span>
              <button type="button" className="shop-row-remove" aria-label={`Remove ${video ? "video" : "photo"} ${index + 1}`} onClick={() => removePhoto(item.id)}>
                <svg aria-hidden="true" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M6 6l12 12M18 6 6 18" /></svg>
              </button>
            </li>;
          })}
        </ol> : null}
        {content.gallery.length < MAX_MEDIA ? <label className="shop-add-media">
          <input type="file" multiple accept="image/jpeg,image/png,image/webp,image/avif,video/mp4,video/webm,video/quicktime" onChange={(e) => { void addMedia(e.target.files); e.target.value = ""; }} disabled={!!uploading || busy} />
          <span aria-hidden="true">+</span>
          <span><strong>Add photos or videos</strong><small>{MAX_MEDIA - content.gallery.length} left · photos up to {mb(MAX_IMAGE_BYTES)}</small></span>
        </label> : null}
        {uploading ? <p className="shop-upload-status" role="status"><span className="shop-upload-spinner" aria-hidden="true" />{uploading}</p> : null}
        <p className="shop-sr" aria-live="polite">{mediaSort.announcement}</p>
      </section>


      <section id="shop-layout" className="shop-step create-section">
        <h2>{step(5)}Shop layout</h2>
        {/* Folded by default: the order at a glance; open it to reorder, rename or hide sections. */}
        <details className="shop-layout-fold">
          <summary>
            <span className="shop-layout-summary">{sectionOrder.filter((key) => !(content.hiddenSections ?? []).includes(key)).map((key) => content.sectionTitles?.[key]?.trim() || sectionLabels[key]).join(" · ") || "No sections shown"}</span>
            <span className="shop-layout-edit">Edit<svg aria-hidden="true" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6" /></svg></span>
          </summary>
        <p className="shop-hint">Drag to set the order, rename a section (e.g. “Menu”), and switch off what you don’t want to show.</p>
        <ol className="shop-sort-list shop-order" ref={sectionSort.listRef} aria-label="Shop section order">
          {sectionOrder.map((key, index) => {
            const hidden = (content.hiddenSections ?? []).includes(key);
            return <li key={key} className={`shop-sort-row${hidden ? " is-hidden" : ""}`} {...sectionSort.itemProps(index)}>
              <button type="button" className="shop-sort-handle" {...sectionSort.handleProps(index)}><GripIcon /></button>
              <span className="shop-order-index" aria-hidden="true">{index + 1}</span>
              <span className="shop-order-name">
                <strong>{sectionLabels[key]}{hidden ? <small>Hidden</small> : null}</strong>
                <input aria-label={`Name for ${sectionLabels[key]} on your shop`} maxLength={40} value={content.sectionTitles?.[key] ?? ""} placeholder={`Shown as “${sectionLabels[key]}”`} onChange={(event) => set({ sectionTitles: { ...content.sectionTitles, [key]: event.target.value } })} />
              </span>
              <label className="shop-switch shop-order-show">
                <input type="checkbox" role="switch" checked={!hidden} aria-label={`Show ${sectionLabels[key]} on my shop`} onChange={(event) => set({ hiddenSections: event.target.checked ? (content.hiddenSections ?? []).filter((item) => item !== key) : [...(content.hiddenSections ?? []), key] })} />
                <span className="shop-switch-track" aria-hidden="true" />
              </label>
            </li>;
          })}
        </ol>
        <p className="shop-sr" aria-live="polite">{sectionSort.announcement}</p>
        </details>
        {/* Which tab people land on. A hidden or empty choice falls back to Overview on the shop. */}
        <fieldset className="shop-open-tab">
          <legend>Shop opens on</legend>
          <div className="shop-open-tab-options">
            {(["overview", ...sectionOrder.filter((key) => !(content.hiddenSections ?? []).includes(key))] as const).map((key) => {
              const chosen = (content.openTab && (content.openTab === "overview" || !(content.hiddenSections ?? []).includes(content.openTab)) ? content.openTab : "overview") === key;
              const label = key === "overview" ? "Overview" : content.sectionTitles?.[key]?.trim() || sectionLabels[key];
              return <label key={key} className={`shop-open-tab-option${chosen ? " is-chosen" : ""}`}>
                <input type="radio" name="shop-open-tab" value={key} checked={chosen} onChange={() => set({ openTab: key })} />
                <span>{label}</span>
              </label>;
            })}
          </div>
          <p className="shop-hint">People see this tab first on your shop, on the web and in the app.</p>
        </fieldset>
      </section>

      <section id="shop-details" className="shop-step create-section shop-details-step">
        <h2>{step(6)}Details</h2>
        <p className="shop-hint">All optional. Fill in what helps customers: your story, when you’re open and how they get their order.</p>
        <div className="shop-details-grid">
        {optionalFields.map(([key, label, max, placeholder]) => <label key={key}>{label}
          {max > 120 ? <textarea rows={key === "story" ? 3 : 1} maxLength={max} value={content[key]} placeholder={(template.prompts as Record<string, string | undefined>)[key] || placeholder} onChange={(e) => set({ [key]: e.target.value })} /> : <input maxLength={max} value={content[key]} placeholder={(template.prompts as Record<string, string | undefined>)[key] || placeholder} onChange={(e) => set({ [key]: e.target.value })} />}
        </label>)}
        <div className="shop-video">
          <strong>Introduction video</strong>
          <p className="shop-hint">Up to 3 minutes and {mb(MAX_VIDEO_BYTES)}. Shown once Tivorah has reviewed it.</p>
          {content.videoId && asset(content.videoId)?.url ? <video className="shop-intro-preview" src={firstFrame(asset(content.videoId)!.url!)} controls preload="metadata" aria-label="Introduction video preview" /> : null}
          {content.videoId ? <p className="shop-hint">Video #{content.videoId} · {asset(content.videoId)?.status === "approved" ? "approved" : asset(content.videoId)?.status === "rejected" ? "not approved — upload a revised video" : "in review"} <button type="button" className="shop-link" onClick={() => set({ videoId: null })}>Remove</button></p> : null}
          {!content.videoId && videos.length ? <p className="shop-hint">Earlier uploads: {videos.map((video) => <button key={video.id} type="button" className="shop-link" onClick={() => set({ videoId: video.id })}>Use video #{video.id} ({video.status})</button>)}</p> : null}
          <label className="product-secondary shop-video-upload">Upload a video<input type="file" accept="video/mp4,video/webm,video/quicktime" onChange={(e) => { void addVideo(e.target.files?.[0]); e.target.value = ""; }} disabled={!!uploading || busy} /></label>
        </div>
        </div>
      </section>

      <section id="shop-placements" className="shop-step create-section">
        <h2>{step(7)}Also show my shop card on</h2>
        <div className="shop-switches">
          {placementLabels.map(([key, label, hint]) => <label key={key} className="shop-switch">
            <input type="checkbox" role="switch" checked={placements[key]} onChange={(e) => set({ placements: { ...placements, [key]: e.target.checked } })} />
            <span className="shop-switch-track" aria-hidden="true" />
            <span><strong>{label}</strong><small>{hint}</small></span>
          </label>)}
        </div>
        <div className="shop-switches shop-card-content">
          <p className="shop-hint">On the card</p>
          <label className="shop-switch">
            <input type="checkbox" role="switch" checked={placements.gallery !== false} onChange={(e) => set({ placements: { ...placements, gallery: e.target.checked } })} />
            <span className="shop-switch-track" aria-hidden="true" />
            <span><strong>Show my gallery</strong><small>Up to 6 photos and videos from your gallery</small></span>
          </label>
        </div>
      </section>

      {error ? <p className="product-error" role="alert">{error}</p> : null}
      {notice ? <p className="product-notice" role="status">{notice}</p> : null}
      <div className="shop-actions" data-sticky-save="">
        <button type="button" className="shop-link" disabled={busy || !!uploading} onClick={() => void openPreview()}>Preview <span aria-hidden="true">↗</span></button>
        <span>
          {published ? null : <button className="product-secondary" value="draft" disabled={busy || !!uploading}>Save draft</button>}
          <button className="product-primary" value="publish" disabled={busy || !!uploading}>{busy ? <><span className="button-progress" aria-hidden="true" />Saving…</> : published ? "Update" : offline ? "Put shop back online" : "Publish shop"}</button>
        </span>
      </div>
      </div>

      <aside className="create-summary" aria-label="Summary">
        <div className="create-preview shop-summary-preview" style={{ "--shop-accent": accentColor } as CSSProperties}>
          <div className="create-preview-media">
            {previewCover?.url ? <Image src={previewCover.url} alt="" fill sizes="320px" /> : <span aria-hidden="true">{template.emoji}</span>}
          </div>
          <div className="create-preview-body">
            <span className="create-preview-kind">{content.businessType ? template.label : "Shop"}</span>
            <span className="shop-summary-identity">
              <span className="shop-summary-logo" aria-hidden="true">{previewLogo?.url ? <Image src={previewLogo.url} alt="" fill sizes="40px" /> : content.name.trim().charAt(0).toUpperCase() || "+"}</span>
              <strong>{content.name.trim() || "Your shop name"}</strong>
            </span>
            <span>{content.about.trim() || "Your short introduction"}</span>
            <span className="shop-summary-sections">{sectionOrder.filter((key) => !(content.hiddenSections ?? []).includes(key)).map((key) => content.sectionTitles?.[key]?.trim() || sectionLabels[key]).join(" · ")}</span>
          </div>
        </div>
        <div className="create-progress">
          <div className="create-progress-head">
            <strong>{doneCount === checklist.length ? "Ready to go" : `${doneCount} of ${checklist.length} done`}</strong>
            <span className="create-progress-bar" aria-hidden="true"><span style={{ width: `${(doneCount / checklist.length) * 100}%` }} /></span>
          </div>
          <ul className="create-checklist">
            {checklist.map((item) => <li key={item.id} className={item.done ? "is-done" : ""}>
              <button type="button" onClick={() => jump(item.section)}>
                <span className="create-check" aria-hidden="true">{item.done ? "✓" : ""}</span>
                <span>{item.label}</span>
                <span className="sr-only">{item.done ? "(done)" : "(to do)"}</span>
              </button>
            </li>)}
          </ul>
        </div>
        {published ? <Link className="shop-link" href={`/shops/${encodeURIComponent(publishedSlug)}`}>View your live shop <span aria-hidden="true">↗</span></Link> : null}
      </aside>
    </form>
  </div>;
}

function GripIcon() {
  return <svg className="shop-grip" aria-hidden="true" viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><circle cx="9" cy="6" r="1.6" /><circle cx="15" cy="6" r="1.6" /><circle cx="9" cy="12" r="1.6" /><circle cx="15" cy="12" r="1.6" /><circle cx="9" cy="18" r="1.6" /><circle cx="15" cy="18" r="1.6" /></svg>;
}

function Load({ username }: { username: string }) {
  const { data, loading, error, retry } = usePrivateResource<{ shop: ShopRecord | null; assets: ShopAsset[]; eligibility?: ShopEligibility }>("/web/business/shop");
  if (loading && !data) return <AccountSurfaceLoading embedded />;
  if (error || !data) return <div className="product-notice" role="alert"><p>{error || "Shop unavailable."}</p><button className="product-secondary" onClick={retry}>Try again</button></div>;
  return <Editor record={data.shop} media={data.assets} username={username} eligibility={data.eligibility ?? { items: 0, services: 0, eligible: true }} />;
}
export function ShopEditor() {
  return <AccountGate>{(account) => <Load username={account.username} />}</AccountGate>;
}
