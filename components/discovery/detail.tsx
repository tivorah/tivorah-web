import { LocationMap } from "./location-map";
import Image from "next/image";
import { MediaGallery } from "./media-gallery";
import { OwnerManage } from "./owner-manage";
import { eventPhotos } from "../../lib/event-detail";
import Link from "next/link";
import { PublicOfferingVideos } from "../business/offering-videos";
import { notFound } from "next/navigation";
import { api, ApiError } from "../../lib/api/client";
import {
  DiscoveryItem,
  DiscoveryKind,
  itemPath,
  money,
  sections,
} from "../../lib/api/discovery";
import { ServiceBooking } from "./service-booking";
import { BackLink } from "../ui/back-link";
import { ShowcaseCard } from "../business/showcase/showcase-card";
import { AppHandoff } from "./app-handoff";
import { Enquiry } from "./enquiry";
import { cache } from "react";
import type { Metadata } from "next";
import { pageMetadata } from "../../lib/site";
import { JsonLd, absoluteUrl, summary } from "../../lib/seo";

type DetailKind = Exclude<DiscoveryKind, "events">;
// Shared by generateMetadata and the page so the item is fetched once per request.
const getItem = cache(async (kind: DetailKind, id: string) => {
  if (!/^[1-9]\d*$/.test(id)) notFound();
  try {
    return await api<DiscoveryItem>(`/public/discovery/${kind}/${id}`);
  } catch (cause) {
    if (cause instanceof ApiError && cause.status === 404) notFound();
    throw cause;
  }
});

export async function discoveryMetadata(kind: DetailKind, id: string): Promise<Metadata> {
  const item = await getItem(kind, id);
  const place = [item.locality, item.state].filter(Boolean).join(", ");
  const label = kind === "hubs" ? "Hub" : kind === "services" ? "Service" : "For sale";
  const title = `${item.title}${place ? ` in ${place}` : ""} · ${label}`;
  const description = summary(item.description, `${item.title} on Tivorah${place ? `, ${place}` : ""}.`);
  const metadata = pageMetadata(title, description, itemPath(kind, item.id));
  const image = item.coverImage || item.image;
  const images = image?.startsWith("https://") ? [{ url: image, alt: item.title }] : undefined;
  return images ? { ...metadata, openGraph: { ...metadata.openGraph, images }, twitter: { ...metadata.twitter, images } } : metadata;
}

function itemJsonLd(kind: DetailKind, item: DiscoveryItem) {
  const url = absoluteUrl(itemPath(kind, item.id));
  const image = [item.image, ...(item.images ?? [])].filter((value): value is string => !!value && value.startsWith("https://"));
  const area = item.locality ? { "@type": "Place", address: { "@type": "PostalAddress", addressLocality: item.locality, addressRegion: item.state, addressCountry: "AU" } } : undefined;
  if (kind === "hubs") return { "@context": "https://schema.org", "@type": "Organization", name: item.title, description: item.description, url, logo: image[0], ...(area ? { location: area } : {}) };
  const seller = item.businessName || item.ownerName || (item.sellerUsername ? `@${item.sellerUsername}` : undefined);
  const offers = item.priceCents != null && item.priceType !== "quote"
    ? { "@type": "Offer", url, price: (item.priceCents / 100).toFixed(2), priceCurrency: item.currency || "AUD", availability: "https://schema.org/InStock", ...(seller ? { seller: { "@type": "Organization", name: seller } } : {}) }
    : undefined;
  return kind === "services"
    ? { "@context": "https://schema.org", "@type": "Service", name: item.title, description: item.description, url, image, serviceType: item.category, ...(area ? { areaServed: area } : {}), ...(seller ? { provider: { "@type": "Organization", name: seller } } : {}), ...(offers ? { offers } : {}) }
    : { "@context": "https://schema.org", "@type": "Product", name: item.title, description: item.description, url, image, category: item.category, ...(offers ? { offers } : {}) };
}
export async function DiscoveryDetail({
  kind,
  id,
}: {
  kind: DetailKind;
  id: string;
}) {
  const item = await getItem(kind, id);
  const href = itemPath(kind, item.id);
  const photos = eventPhotos(item.image, item.images);
  const structured = <JsonLd data={itemJsonLd(kind, item)} />;
  if (kind === "hubs") return <div className="product-page page-shell">
    {structured}
    <BackLink className="product-secondary" fallback="/hubs" />
    <OwnerManage ownerUsername={item.creatorUsername} appPath={`hubs/invite/${id}`} label="Manage Hub in the app" />
    <article className="hub-detail">
      <div className="hub-detail-hero">
        <div className="hub-detail-cover">{item.coverImage ? <Image src={item.coverImage} alt="" fill sizes="(max-width: 760px) 100vw, 1280px" priority /> : null}</div>
        <div className="hub-detail-identity">
          <div className="hub-detail-avatar">{item.image ? <Image src={item.image} alt="" fill sizes="(max-width: 760px) 76px, 108px" /> : <span aria-hidden="true">◎</span>}</div>
          <div className="hub-detail-identity-copy"><p className="product-eyebrow">TIVORAH HUB</p><h1>{item.title}</h1><p className="hub-detail-location">{[item.locality, item.state].filter(Boolean).join(", ") || "Australia"}</p><div className="hub-detail-stats">{item.creatorUsername ? <span>Created by <strong>@{item.creatorUsername}</strong></span> : null}{item.memberCount != null ? <span><strong>{item.memberCount}</strong> {item.memberCount === 1 ? "person" : "people"}</span> : null}</div></div>
        </div>
      </div>
      <div className="hub-detail-columns"><div className="hub-detail-main"><h2>About this Hub</h2><p>{item.description || "Meet people who share your interests."}</p>{item.interests?.length ? <section><h2>Interests</h2><div className="hub-interest-list">{item.interests.map((interest) => <span key={interest}>{interest}</span>)}</div></section> : null}{item.guidelines?.length ? <section className="hub-guidelines"><h2>Before you join</h2><ul>{item.guidelines.map((rule, index) => <li key={index}>{rule.text}</li>)}</ul></section> : null}</div><aside className="hub-join-card"><AppHandoff title="Join this Hub in the app" appPath={`hubs/invite/${id}`} webPath={href} /><Link href={`/contact?${new URLSearchParams({ subject: `Report hubs ${id}` })}`}>Report a concern</Link></aside></div>
    </article>
  </div>;
  return (
    <div className="product-page page-shell">
      {structured}
      <BackLink className="product-secondary" fallback={sections[kind].path} />
      <OwnerManage ownerUsername={item.sellerUsername} href={`/business/listings/${item.id}`} label={kind === "items" ? "Manage item" : "Manage service"} />
      <article className={`product-detail product-detail-${kind}`}>
        {/* Same photo header as event pages (components/discovery/media-gallery.tsx). */}
        {photos.length ? <MediaGallery photos={photos} title={item.title} /> : (
          <div className="product-detail-visual product-detail-empty">
            <span className="discover-image-fallback" aria-hidden="true">✳</span>
          </div>
        )}
        <div className="product-detail-content">
          <div className="product-detail-main">
          <p className="product-eyebrow">
            {item.category || sections[kind].label}
          </p>
          <h1>{item.title}</h1>
          {item.priceCents != null ? (
            <p className="product-detail-price">
              {item.priceType === "quote"
                ? "Price by agreement"
                : `${item.priceType === "from" ? "From " : ""}${money(item.priceCents, item.currency)}${item.priceType === "hourly" ? " / hour" : ""}`}
            </p>
          ) : null}
          <div className="product-detail-facts">
            <div><span>Location</span><strong>{[item.locality, item.state].filter(Boolean).join(", ") || "Australia"}</strong></div>
            {item.condition && kind === "items" ? (
              <div><span>Condition</span><strong>{item.condition.replaceAll("_", " ")}</strong></div>
            ) : null}
            {item.sellerUsername ? (
              <div className="product-detail-seller"><span>{kind === "items" ? "Seller" : "Provider"}</span><strong>{item.businessName || item.ownerName || `@${item.sellerUsername}`}</strong>{item.sellerShopOnline !== false ? <Link href={`/shops/${encodeURIComponent(item.sellerUsername)}`}>View shop <span aria-hidden="true">→</span></Link> : null}</div>
            ) : null}
          </div>
          {item.locality && item.serviceMode !== "online" ? <section className="event-location"><h2>Area</h2><LocationMap key={item.id} destination={[item.locality, item.state].filter(Boolean).join(", ")} approximate /></section> : null}
          <section className="product-detail-about"><h2>{kind === "items" ? "About this item" : "About this service"}</h2><p className="product-detail-description">{item.description || "More details will be added soon."}</p></section>
          {/* Booking gets the full main column so the calendar and times have room. */}
          {kind === "services" && item.bookingEnabled ? <div id="book" className="product-detail-booking-main"><ServiceBooking id={item.id} /></div> : null}
          {(kind === "items" || kind === "services") ? <PublicOfferingVideos kind={kind === "items" ? "item" : "service"} id={item.id} /> : null}
          {item.guidelines?.length ? (
            <section>
              <h2>Before you join</h2>
              <ul>
                {item.guidelines.map((rule, index) => (
                  <li key={index}>{rule.text}</li>
                ))}
              </ul>
            </section>
          ) : null}
          </div>
          <aside className="product-detail-side" aria-label={kind === "items" ? "Contact seller" : "Book or enquire"}>
          <Enquiry id={item.id} kind={kind} primary={kind === "items" || !item.bookingEnabled} />
          {item.sellerUsername && item.sellerShopOnline !== false && (kind === "items" || kind === "services") ? <ShowcaseCard username={item.sellerUsername} surface={kind} /> : null}
          <p className="product-detail-report">
            <Link
              href={`/contact?${new URLSearchParams({ subject: `Report ${kind} ${id}` })}`}
            >
              Report a concern
            </Link>
          </p>
          </aside>
        </div>
      </article>
    </div>
  );
}
