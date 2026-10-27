import Link from "next/link";
import { notFound } from "next/navigation";
import { api, ApiError } from "../../../lib/api/client";
import { ShopData, ShopTab, ShopView, shopOpeningTab } from "../../../components/shop/shop-view";
import { shopTabKeys } from "../../../components/shop/shop-tabs";
import { pageMetadata } from "../../../lib/site";
import { BackLink } from "../../../components/ui/back-link";
import { cache } from "react";
import type { Metadata } from "next";
import { JsonLd, absoluteUrl, summary } from "../../../lib/seo";

// One cached fetch of the shop's first page for metadata and structured data.
const getShopIdentity = cache(async (slug: string) => {
  try { return await api<ShopData>(`/public/shops/${encodeURIComponent(slug)}?skip=0`); }
  catch (error) { if (error instanceof ApiError && error.status === 404) notFound(); throw error; }
});
const publicImage = (data: ShopData, id: number | null | undefined) => {
  const url = data.assets.find((asset) => asset.id === id && asset.status === "approved")?.url;
  return url?.startsWith("https://") ? url : undefined;
};

// A seller's shop: items, services and upcoming events, with their shop on
// the Overview tab when they have published one.

// Each shop is indexed like a profile page: its own name, introduction and images,
// so searching for the business on Google can find its Tivorah shop.
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const data = await getShopIdentity(slug);
  const name = data.content.name;
  const place = data.content.locality;
  const description = summary(data.content.about || data.content.story, `Items, services and events from ${name} on Tivorah.`);
  const metadata = pageMetadata(`${name}${place ? ` · ${place}` : ""} | Shop`, description, `/shops/${encodeURIComponent(slug)}`);
  const image = publicImage(data, data.content.coverId) || publicImage(data, data.content.logoId);
  const images = image ? [{ url: image, alt: name }] : undefined;
  return images ? { ...metadata, openGraph: { ...metadata.openGraph, type: "profile", images }, twitter: { ...metadata.twitter, images } } : { ...metadata, openGraph: { ...metadata.openGraph, type: "profile" } };
}

export default async function Page({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ skip?: string; tab?: string }>;
}) {
  const { slug } = await params;
  const query = await searchParams;
  const skip = Math.max(0, Math.min(10000, Number(query.skip) || 0));
  const identity = await getShopIdentity(slug);
  // Without ?tab= the shop opens where the seller chose (Overview unless they picked a section).
  const opening = shopOpeningTab(identity);
  // A link to a tab that isn't showing (hidden, empty, or its feature switched off) opens Overview.
  const requested = query.tab === "items" || query.tab === "services" || query.tab === "events" || query.tab === "gallery" || query.tab === "hubs" ? query.tab : null;
  const tab: ShopTab = requested ? (shopTabKeys(identity).includes(requested) ? requested : "all") : query.tab === "overview" ? "all" : opening;
  const type = tab === "items" ? "&type=item" : tab === "services" ? "&type=service" : tab === "events" ? "&type=event" : tab === "hubs" ? "&type=hub" : "";
  let data: ShopData;
  try {
    data = await api(`/public/shops/${encodeURIComponent(slug)}?skip=${tab === "all" || tab === "gallery" ? 0 : skip}${type}`);
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) notFound();
    throw error;
  }
  const href = (next: ShopTab, nextSkip = 0) => {
    const search = new URLSearchParams();
    // Overview needs naming when the shop opens on another tab.
    if (next !== "all") search.set("tab", next);
    else if (opening !== "all") search.set("tab", "overview");
    if (nextSkip) search.set("skip", String(nextSkip));
    const value = search.toString();
    return `/shops/${encodeURIComponent(slug)}${value ? `?${value}` : ""}#shop-offerings`;
  };
  const shopUrl = absoluteUrl(`/shops/${encodeURIComponent(slug)}`);
  const logo = publicImage(identity, identity.content.logoId);
  const cover = publicImage(identity, identity.content.coverId);
  const structured = {
    "@context": "https://schema.org", "@type": "ProfilePage", url: shopUrl,
    mainEntity: {
      "@type": "Organization", name: identity.content.name, url: shopUrl,
      description: identity.content.about || undefined,
      ...(logo ? { logo } : {}), ...(logo || cover ? { image: [logo, cover].filter(Boolean) } : {}),
      ...(identity.content.locality ? { address: { "@type": "PostalAddress", addressLocality: identity.content.locality, addressCountry: "AU" } } : {}),
    },
  };
  return (
    <div className="product-page page-shell shop-page">
      <JsonLd data={structured} />
      <ShopView
        data={data}
        tab={tab}
        skip={skip}
        href={href}
        contactSlug={slug}
        banner={<BackLink className="shop-back" fallback="/shop" />}
        footer={<p className="shop-report"><Link href={`/contact?${new URLSearchParams({ subject: `Report shop ${slug}` })}`}>Report a concern</Link></p>}
      />
    </div>
  );
}
