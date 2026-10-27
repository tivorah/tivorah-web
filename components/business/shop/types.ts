export type ShopContent = {
  name: string;
  slug: string;
  about: string;
  story: string;
  locality: string;
  hours: string;
  serviceArea: string;
  fulfilment: string;
  bookingPolicy: string;
  logoId: number | null;
  coverId: number | null;
  gallery: { assetId: number; alt: string }[];
  videoId: number | null;
  videoTranscript: string;
  videoCaptions: string;
  /** Where the shop card also appears: the seller's item, service and event pages. */
  placements?: { items: boolean; services: boolean; events: boolean; hubs?: boolean; gallery?: boolean };
  /** Order of the sections on the shop page (Gallery, Items, Services, Events, Hubs). */
  sectionOrder?: ShopBlock[];
  /** Sections the seller hid from their shop. */
  hiddenSections?: ShopBlock[];
  /** Taken offline by the seller: no public shop page, cards or links. */
  offline?: boolean;
  /** Kind of business; its template (templates.ts) set the starting layout and section names. */
  businessType?: "drinks" | "food" | "beauty" | "fitness" | "creative" | "tutoring" | "trades" | "retail" | "events" | "other";
  /** One of Tivorah's accent colours (templates.ts). */
  accent?: "violet" | "coral" | "amber" | "emerald" | "ocean" | "rose" | "graphite";
  /** The seller's own section names, e.g. { items: "Menu" }. */
  sectionTitles?: Partial<Record<ShopBlock, string>>;
  /** The tab the shop page opens on (web and app). Missing, hidden or empty = Overview. */
  openTab?: "overview" | ShopBlock;
};
export type ShopSection = "items" | "services" | "events";
export type ShopBlock = "gallery" | ShopSection | "hubs";
export const defaultSectionOrder: ShopBlock[] = ["gallery", "items", "services", "events", "hubs"];
/** Older shops saved only Items/Services/Events: keep their order and add the rest. */
export const normalizeSectionOrder = (order?: string[] | null): ShopBlock[] => {
  const known = (order ?? []).filter((key): key is ShopBlock => (defaultSectionOrder as string[]).includes(key));
  const unique = [...new Set(known)];
  return [...(unique.includes("gallery") ? [] : ["gallery" as const]), ...unique, ...defaultSectionOrder.filter((key) => key !== "gallery" && !unique.includes(key))];
};
export const sectionLabels: Record<ShopBlock, string> = { gallery: "Gallery", items: "Items for sale", services: "Services", events: "Events", hubs: "Hubs" };
export const defaultPlacements: { items: boolean; services: boolean; events: boolean; hubs?: boolean; gallery?: boolean } = { items: true, services: true, events: true, hubs: true, gallery: true };
export type ShopEligibility = { items: number; services: number; events?: number; eligible: boolean };
export type ShopAsset = {
  id: number;
  kind: "image" | "video";
  status: string;
  url: string | null;
  mimeType: string;
  reviewNote?: string | null;
};
export type ShopRecord = {
  draft: ShopContent;
  published: ShopContent | null;
  version: number;
  slug: string;
};
export const emptyShop = (username: string): ShopContent => ({
  name: "",
  slug: username
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, ""),
  about: "",
  story: "",
  locality: "",
  hours: "",
  serviceArea: "",
  fulfilment: "",
  bookingPolicy: "",
  logoId: null,
  coverId: null,
  gallery: [],
  videoId: null,
  videoTranscript: "",
  videoCaptions: "",
  placements: defaultPlacements,
  sectionOrder: defaultSectionOrder,
});
