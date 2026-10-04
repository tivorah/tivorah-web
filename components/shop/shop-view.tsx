import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import { DiscoveryItem } from "../../lib/api/discovery";
import { DiscoveryCard } from "../discovery/card";
import { ShopBlock, ShopSection, ShowcaseAsset, ShowcaseContent, normalizeSectionOrder } from "../business/showcase/types";
import { AboutSummary } from "./about-summary";
import { MediaGallery } from "./media-gallery";
import { MessageShopLink } from "./message-shop-link";

// A seller's shop, shared by the public page (/shops/[slug]) and the owner's
// preview (/business/showcase/preview) so both look exactly the same.
// Overview: hero → short About (read more) → photos & videos → the seller's
// sections in the order they chose. Gallery has every photo and video.

export type ShopTab = "all" | ShopBlock;
export type ShopHub = { id: number; name: string; avatar: string | null; description: string | null; suburb: string | null; state: string | null };
export type ShopData = {
  username?: string;
  content: ShowcaseContent;
  assets: ShowcaseAsset[];
  offerings: (DiscoveryItem & { listingType: string })[];
  events?: DiscoveryItem[];
  nextSkip: number | null;
  hasShowcase?: boolean;
  counts?: { items: number; services: number; events: number; hubs?: number };
  hubs?: ShopHub[];
};

const plural = (count: number, word: string) => `${count} ${word}${count === 1 ? "" : "s"}`;
const details = [
  ["locality", "Area"],
  ["hours", "Opening hours"],
  ["serviceArea", "Service area"],
  ["fulfilment", "Pickup & delivery"],
  ["bookingPolicy", "Bookings & cancellations"],
] as const;
const sectionTitles: Record<ShopSection, string> = { items: "Items for sale", services: "Services", events: "Upcoming events" };
const tabTitles: Record<ShopBlock, string> = { gallery: "Gallery", items: "Items", services: "Services", events: "Events", hubs: "Hubs" };

// Hub avatars are user uploads on varied hosts, so next/image is not used.
function HubAvatar({ src }: { src: string }) {
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={src} alt="" />;
}

export function ShopView({ data, tab, skip, href, banner, footer, contactSlug, preview = false }: {
  data: ShopData;
  tab: ShopTab;
  skip: number;
  href: (tab: ShopTab, skip?: number) => string;
  banner?: ReactNode;
  footer?: ReactNode;
  contactSlug?: string;
  /** Draft preview: show media that is still in review. */
  preview?: boolean;
}) {
  const counts = data.counts ?? { items: 0, services: 0, events: data.events?.length ?? 0 };
  const asset = (id: number | null | undefined) => data.assets.find((item) => item.id === id && (preview || item.status === "approved"));
  const showcase = data.hasShowcase ? data.content : null;
  const cover = showcase ? asset(showcase.coverId) : undefined;
  const logo = showcase ? asset(showcase.logoId) : undefined;
  const introVideo = showcase ? asset(showcase.videoId) : undefined;
  const galleryMedia = showcase ? showcase.gallery.map((item) => { const found = asset(item.assetId); return found?.url ? { id: found.id, kind: found.kind, url: found.url, alt: item.alt || `${showcase.name} media` } : null; }).filter((item): item is NonNullable<typeof item> => !!item) : [];
  // The introduction video leads the photos & videos (with its captions).
  const media = introVideo?.url && galleryMedia.some((item) => item.id === introVideo.id)
    ? galleryMedia.map((item) => item.id === introVideo.id ? { ...item, captions: showcase?.videoCaptions || "", transcript: showcase?.videoTranscript || "" } : item)
    : introVideo?.url && !galleryMedia.some((item) => item.id === introVideo.id)
    ? [{ id: introVideo.id, kind: "video" as const, url: introVideo.url, alt: `${data.content.name} introduction`, captions: showcase?.videoCaptions || "", transcript: showcase?.videoTranscript || "" }, ...galleryMedia]
    : galleryMedia;
  const name = data.content.name;
  // The seller's chosen order, without the sections they hid.
  const hidden = new Set(showcase?.hiddenSections ?? []);
  const blocks = normalizeSectionOrder(showcase?.sectionOrder).filter((key) => !hidden.has(key));
  const order = blocks.filter((key): key is ShopSection => key === "items" || key === "services" || key === "events");
  const hubs = hidden.has("hubs") ? [] : data.hubs ?? [];
  const shownMedia = hidden.has("gallery") ? [] : null;
  const lists: Record<ShopSection, DiscoveryItem[]> = {
    items: data.offerings.filter((item) => item.listingType !== "service"),
    services: data.offerings.filter((item) => item.listingType === "service"),
    events: data.events ?? [],
  };
  const filledDetails = showcase ? details.filter(([key]) => showcase[key]) : [];
  const gallery = shownMedia ?? media;
  const blockCount = (key: ShopBlock) => key === "gallery" ? gallery.length : key === "hubs" ? hubs.length : counts[key];
  const tabs: [ShopTab, string, number | null][] = [
    ["all", "Overview", null],
    ...blocks.filter((key) => key === "gallery" || key === "hubs" ? blockCount(key) > 0 : true).map((key) => [key, tabTitles[key], blockCount(key)] as [ShopTab, string, number]),
  ];
  const hubCards = (list: ShopHub[]) => <div className="shop-hub-grid">{list.map((hub) => <Link key={hub.id} href={`/hubs/${hub.id}`} className="shop-hub-card">
    <span className="shop-hub-avatar" aria-hidden="true">{hub.avatar ? <HubAvatar src={hub.avatar} /> : hub.name.trim().charAt(0).toUpperCase()}</span>
    <span className="shop-hub-copy"><strong>{hub.name}</strong>{hub.description ? <span>{hub.description}</span> : null}{hub.suburb ? <small>{[hub.suburb, hub.state].filter(Boolean).join(", ")}</small> : null}</span>
    <span className="shop-hub-join">Join <span aria-hidden="true">→</span></span>
  </Link>)}</div>;
  const page = Math.floor(skip / 10) + 1;
  const pagination = skip > 0 || data.nextSkip !== null ? <nav className="account-ticket-pagination" aria-label="Shop pages">
    {skip > 0 ? <Link href={href(tab, Math.max(0, skip - 10))}>Previous</Link> : <span aria-hidden="true" />}
    <span>Page {page}</span>
    {data.nextSkip !== null ? <Link href={href(tab, data.nextSkip)}>Next</Link> : <span aria-hidden="true" />}
  </nav> : null;
  const kindFor = (item: DiscoveryItem, section: ShopSection) => section === "events" ? "events" as const : (item as { listingType?: string }).listingType === "service" ? "services" as const : "items" as const;
  const grid = (list: DiscoveryItem[], section: ShopSection) => <div className="discover-grid">{list.map((item) => <DiscoveryCard key={`${section}-${item.id}`} kind={kindFor(item, section)} item={item} />)}</div>;

  return <div className="shop-view">
    {banner}
    <header className={`shop-hero${cover?.url ? " has-cover" : ""}`}>
      <div className="shop-hero-cover">{cover?.url ? <Image src={cover.url} alt="" fill priority sizes="(max-width: 700px) 100vw, 1280px" /> : null}</div>
      <div className="shop-hero-body">
        <span className="shop-hero-logo">{logo?.url ? <Image src={logo.url} alt={`${name} logo`} width={104} height={104} /> : name.replace(/^@/, "").trim().charAt(0).toUpperCase()}</span>
        <div className="shop-hero-copy">
          {data.content.locality ? <p className="shop-hero-locality"><svg aria-hidden="true" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="M12 21s-7-6.2-7-11.5A7 7 0 0 1 19 9.5C19 14.8 12 21 12 21Z" /><circle cx="12" cy="9.5" r="2.5" /></svg>{data.content.locality}</p> : null}
          <h1>{name}</h1>
          {data.content.about ? <p className="shop-hero-about">{data.content.about}</p> : null}
          <div className="shop-hero-meta"><p className="shop-hero-counts">{order.map((key) => counts[key] ? plural(counts[key], key === "items" ? "item" : key === "services" ? "service" : "upcoming event") : "").filter(Boolean).join(" · ") || "New on Tivorah"}</p>{contactSlug ? <MessageShopLink slug={contactSlug} ownerUsername={data.username} /> : null}</div>
        </div>
      </div>
    </header>

    <nav className="shop-tabs" aria-label="Shop sections" id="shop-offerings">
      {tabs.map(([key, label, count]) => <Link key={key} href={href(key)} aria-current={tab === key ? "page" : undefined}>{label}{count !== null ? <span>{count}</span> : null}</Link>)}
    </nav>

    {tab === "all" ? <>
      {showcase && (showcase.story || filledDetails.length) ? <AboutSummary story={showcase.story} details={filledDetails.map(([key, label]) => [label, showcase[key]] as [string, string])} /> : null}
      {blocks.map((key) => {
        if (key === "gallery") return gallery.length ? <section key={key} className="shop-section" aria-labelledby="shop-media">
          <div className="shop-section-head"><h2 id="shop-media">Gallery</h2><Link href={href("gallery")}>View all {gallery.length} <span aria-hidden="true">→</span></Link></div>
          <MediaGallery items={gallery} title={name} />
        </section> : null;
        if (key === "hubs") return hubs.length ? <section key={key} className="shop-section" aria-labelledby="shop-hubs">
          <div className="shop-section-head"><h2 id="shop-hubs">Hubs</h2>{hubs.length > 3 ? <Link href={href("hubs")}>See all {hubs.length} <span aria-hidden="true">→</span></Link> : null}</div>
          {hubCards(hubs.slice(0, 3))}
        </section> : null;
        return lists[key].length ? <section key={key} className="shop-section" aria-labelledby={`shop-${key}`}>
          <div className="shop-section-head"><h2 id={`shop-${key}`}>{sectionTitles[key]}</h2>{counts[key] > Math.min(lists[key].length, 4) ? <Link href={href(key)}>See all {counts[key]} <span aria-hidden="true">→</span></Link> : null}</div>
          {grid(lists[key].slice(0, 4), key)}
        </section> : null;
      })}
      {!lists.items.length && !lists.services.length && !lists.events.length ? <p className="shop-empty">Nothing is listed here yet. Check back soon.</p> : null}
    </> : tab === "gallery" ? <section className="shop-section" aria-label="Photos and videos">
      {gallery.length ? <MediaGallery items={gallery} title={name} layout="grid" /> : <p className="shop-empty">No photos or videos yet.</p>}
    </section> : tab === "hubs" ? <section className="shop-section" aria-label="Hubs">
      {hubs.length ? hubCards(hubs) : <p className="shop-empty">No Hubs to show.</p>}
      {pagination}
    </section> : tab === "events" ? <section className="shop-section" aria-label="Upcoming events">
      {lists.events.length ? grid(lists.events, "events") : <p className="shop-empty">No upcoming events right now.</p>}
      {pagination}
    </section> : <section className="shop-section" aria-label={tab === "items" ? "Items for sale" : "Services"}>
      {data.offerings.length ? grid(data.offerings, tab) : <p className="shop-empty">{tab === "services" ? "No services right now." : "No items for sale right now."}</p>}
      {pagination}
    </section>}
    {footer}
  </div>;
}

/** Loading state shaped like the shop (hero, tabs, about, media, cards). */
export function ShopSkeleton() {
  return <div className="shop-view shop-skeleton" role="status" aria-busy="true" aria-label="Loading shop">
    <span className="shop-skel-back tivorah-shimmer" aria-hidden="true" />
    <div className="shop-hero" aria-hidden="true">
      <div className="shop-hero-cover tivorah-shimmer" />
      <div className="shop-hero-body">
        <span className="shop-hero-logo tivorah-shimmer" />
        <div className="shop-hero-copy">
          <span className="shop-skel-line w20 tivorah-shimmer" />
          <span className="shop-skel-title tivorah-shimmer" />
          <span className="shop-skel-line w70 tivorah-shimmer" />
          <span className="shop-skel-line w30 tivorah-shimmer" />
        </div>
      </div>
    </div>
    <div className="shop-tabs shop-skel-tabs" aria-hidden="true">{[64, 56, 48, 64, 52].map((width, index) => <span key={index} className="tivorah-shimmer" style={{ width }} />)}</div>
    <div className="shop-about-summary" aria-hidden="true">
      <div className="shop-about-text"><span className="shop-skel-line w20 tivorah-shimmer" /><span className="shop-skel-line w90 tivorah-shimmer" /><span className="shop-skel-line w90 tivorah-shimmer" /><span className="shop-skel-line w60 tivorah-shimmer" /></div>
      <div className="shop-about-facts"><span className="shop-skel-line w30 tivorah-shimmer" />{Array.from({ length: 3 }, (_, index) => <div key={index} className="shop-skel-fact"><span className="shop-skel-line w30 tivorah-shimmer" /><span className="shop-skel-line w80 tivorah-shimmer" /></div>)}</div>
    </div>
    <div className="shop-section" aria-hidden="true">
      <span className="shop-skel-line w20 tivorah-shimmer" />
      <div className="shop-media-grid count-5">{Array.from({ length: 5 }, (_, index) => <span key={index} className="shop-media-tile tivorah-shimmer" />)}</div>
    </div>
    <div className="shop-section" aria-hidden="true">
      <span className="shop-skel-line w20 tivorah-shimmer" />
      <div className="discover-grid">{Array.from({ length: 4 }, (_, index) => <div key={index} className="discover-card shop-skel-card"><div className="discover-card-image tivorah-shimmer" /><div className="discover-card-copy"><span className="shop-skel-line w80 tivorah-shimmer" /><span className="shop-skel-line w40 tivorah-shimmer" /></div></div>)}</div>
    </div>
  </div>;
}
