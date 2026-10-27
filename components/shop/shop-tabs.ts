import { normalizeSectionOrder, type ShopBlock } from "../business/shop/types";
import type { ShopData, ShopTab } from "./shop-view";

// Which tabs a shop page shows, and which one it opens on (pure, so it can be tested on its own).

/** The shop's photos and videos as shown (the introduction video first, with its captions). */
export function shopMedia(data: ShopData, preview = false) {
  const asset = (id: number | null | undefined) => data.assets.find((item) => item.id === id && (preview || item.status === "approved"));
  const shop = data.hasShop ? data.content : null;
  if (!shop || (shop.hiddenSections ?? []).includes("gallery")) return [];
  const introVideo = asset(shop.videoId);
  const galleryMedia = shop.gallery.map((item) => { const found = asset(item.assetId); return found?.url ? { id: found.id, kind: found.kind, url: found.url, alt: item.alt || `${shop.name} media` } : null; }).filter((item): item is NonNullable<typeof item> => !!item);
  return introVideo?.url && galleryMedia.some((item) => item.id === introVideo.id)
    ? galleryMedia.map((item) => item.id === introVideo.id ? { ...item, captions: shop.videoCaptions || "", transcript: shop.videoTranscript || "" } : item)
    : introVideo?.url
    ? [{ id: introVideo.id, kind: "video" as const, url: introVideo.url, alt: `${shop.name} introduction`, captions: shop.videoCaptions || "", transcript: shop.videoTranscript || "" }, ...galleryMedia]
    : galleryMedia;
}

/**
 * The section tabs after Overview, in the seller's order: hidden ones and empty ones left out, as in
 * the app. A section whose feature is switched off arrives empty from the API, so its tab (under
 * any name the seller gave it, e.g. "Menu") goes too.
 */
export function shopTabKeys(data: ShopData, preview = false): ShopBlock[] {
  const shop = data.hasShop ? data.content : null;
  const hidden = new Set(shop?.hiddenSections ?? []);
  const counts: Record<ShopBlock, number> = {
    gallery: shopMedia(data, preview).length,
    hubs: hidden.has("hubs") ? 0 : data.counts?.hubs ?? data.hubs?.length ?? 0,
    items: data.counts?.items ?? 0,
    services: data.counts?.services ?? 0,
    events: data.counts?.events ?? data.events?.length ?? 0,
  };
  return normalizeSectionOrder(shop?.sectionOrder).filter((key) => !hidden.has(key) && counts[key] > 0);
}

/** The tab the shop opens on: the seller's choice when that tab is showing and has something in it, otherwise Overview. */
export function shopOpeningTab(data: ShopData): ShopTab {
  const chosen = data.hasShop ? data.content.openTab : undefined;
  if (!chosen || chosen === "overview" || !shopTabKeys(data).includes(chosen)) return "all";
  const empty = (chosen === "items" || chosen === "services" || chosen === "events") && !(data.counts?.[chosen] ?? 0);
  return empty ? "all" : chosen;
}
