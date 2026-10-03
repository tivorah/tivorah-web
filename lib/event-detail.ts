import type { DiscoveryItem } from "./api/discovery";

export type GalleryLayout = "none" | "single" | "pair" | "mosaic";

/** Cover and extra photos, deduplicated, in display order, http(s) only. */
export function eventPhotos(cover: string | null, images: readonly string[] | null | undefined): string[] {
  return [...new Set([cover, ...(images ?? [])].filter((value): value is string => !!value && /^https?:\/\//.test(value)))];
}

/** One photo fills a framed hero, two split the hero, three or more form a mosaic. */
export function galleryLayout(count: number): GalleryLayout {
  if (count <= 0) return "none";
  if (count === 1) return "single";
  if (count === 2) return "pair";
  return "mosaic";
}

/** The mosaic shows three tiles; the last one carries a "+N" count for the rest. */
export const MOSAIC_TILES = 3;
export const hiddenPhotoCount = (count: number) => Math.max(0, count - MOSAIC_TILES);

/** Wraps an index for previous/next navigation in the lightbox. */
export const wrapIndex = (index: number, count: number) => (count ? ((index % count) + count) % count : 0);

/** First listed category of an event ("Music | Food" → "Music"). */
export const primaryCategory = (category: string | null | undefined) =>
  category?.split("|").map((part) => part.trim()).find(Boolean) ?? null;

/**
 * "More events like this": same-category events first, topped up with other upcoming
 * events, never the event being viewed and never duplicates.
 */
export function relatedEvents(currentId: number, sameCategory: readonly DiscoveryItem[], upcoming: readonly DiscoveryItem[], limit = 4): DiscoveryItem[] {
  const seen = new Set<number>([currentId]);
  const picked: DiscoveryItem[] = [];
  for (const item of [...sameCategory, ...upcoming]) {
    if (picked.length >= limit) break;
    if (seen.has(item.id)) continue;
    seen.add(item.id);
    picked.push(item);
  }
  return picked;
}

/**
 * Whether the signed-in member organises this event. Used only to show the manage
 * link; the business workspace authorises every read and change on the server.
 */
export const isEventOrganiser = (accountUsername: string | null | undefined, organizerUsername: string | null | undefined) =>
  !!accountUsername && !!organizerUsername && accountUsername.toLowerCase() === organizerUsername.toLowerCase();

/**
 * Google Maps directions from the person's position (when they shared it) to the venue.
 * Without an origin, Google Maps starts from the device's own location.
 */
export function directionsUrl(destination: string, origin?: { latitude: number; longitude: number } | null) {
  const params = new URLSearchParams({ api: "1", destination });
  if (origin && Number.isFinite(origin.latitude) && Number.isFinite(origin.longitude))
    params.set("origin", `${origin.latitude.toFixed(5)},${origin.longitude.toFixed(5)}`);
  return `https://www.google.com/maps/dir/?${params}`;
}
