export type DiscoveryKind = "events" | "items" | "services" | "hubs";
export type DiscoveryItem = {
  id: number;
  title: string;
  description: string | null;
  image: string | null;
  coverImage?: string | null;
  images?: string[];
  category?: string | null;
  locality: string | null;
  state: string | null;
  startsAt?: string | null;
  locationType?: string;
  priceCents?: number | null;
  currency?: string;
  ownerName?: string | null;
  ownerUsername?: string | null;
  externalTicketUrl?: string | null;
  hasPaidTickets?: boolean;
  priceType?: string;
  condition?: string;
  businessName?: string | null;
  sellerUsername?: string;
  /** False when the seller has taken their shop offline. */
  sellerShopOnline?: boolean;
  bookingEnabled?: boolean;
  serviceMode?: string;
  guidelines?: { key: string; text: string }[];
  creatorUsername?: string;
  memberCount?: number;
  interests?: string[];
};
export type DiscoveryPage = { items: DiscoveryItem[]; nextSkip: number | null };
export const sections = {
  events: {
    path: "/events",
    label: "Events",
    title: "Make room for a good time.",
    description:
      "Find your next outing, shared interest or reason to get together.",
    empty: "No upcoming events match this search.",
  },
  items: {
    path: "/shop",
    label: "Shop",
    title: "A good find, closer to home.",
    description:
      "Discover new and pre-loved items from people and businesses nearby.",
    empty: "No items match this search.",
  },
  services: {
    path: "/services",
    label: "Services",
    title: "Find someone for the job.",
    description:
      "Explore local skills, useful services and people who can help.",
    empty: "No services match this search.",
  },
  hubs: {
    path: "/hubs",
    label: "Hubs",
    title: "Your people are out there.",
    description:
      "Discover Hubs around your interests and your area. Join the conversation in the app.",
    empty: "No public Hubs match this search.",
  },
} satisfies Record<
  DiscoveryKind,
  {
    path: string;
    label: string;
    title: string;
    description: string;
    empty: string;
  }
>;
export const itemPath = (kind: DiscoveryKind, id: number) =>
  `${sections[kind].path}${kind === "items" ? "/items" : ""}/${id}`;
export const money = (value: number, currency = "AUD") =>
  new Intl.NumberFormat("en-AU", { style: "currency", currency, currencyDisplay: "code" }).format(value / 100);
