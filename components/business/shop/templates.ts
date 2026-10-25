import type { ShopBlock, ShopContent } from "./types";
import { sectionLabels } from "./types";

/**
 * Business types: picking one sets up the shop for that kind of business (section order, which
 * sections show, their names, and prompts for the text). Nothing is filled in for them, and
 * everything stays editable. Keys match tivorah-api/src/data/shopTemplates.ts.
 */
export type BusinessType = NonNullable<ShopContent["businessType"]>;
export type ShopAccent = NonNullable<ShopContent["accent"]>;
export type BusinessTemplate = {
  key: BusinessType;
  label: string;
  emoji: string;
  order: ShopBlock[];
  hidden: ShopBlock[];
  titles: Partial<Record<ShopBlock, string>>;
  prompts: { name: string; about: string; story: string; fulfilment?: string; hours?: string; serviceArea?: string; bookingPolicy?: string };
};

export const BUSINESS_TEMPLATES: BusinessTemplate[] = [
  { key: "drinks", label: "Drinks brand or café", emoji: "🥤", order: ["items", "gallery", "events", "services", "hubs"], hidden: ["services"], titles: { items: "Our drinks" },
    prompts: { name: "e.g. Zobo & Co", about: "What makes your drinks different, in a sentence or two.", story: "How your brand started, and what goes into every bottle.", fulfilment: "Pickup spots, delivery areas and stockists.", hours: "When people can order or pick up." } },
  // Dishes are items (sold, ready in a set time); catering booked for a date is a service.
  { key: "food", label: "Food & catering", emoji: "🍲", order: ["items", "gallery", "services", "events", "hubs"], hidden: [], titles: { items: "Menu", services: "Catering" },
    prompts: { name: "e.g. Ada’s Kitchen", about: "Your kind of food, in a sentence or two.", story: "The dishes you grew up with, and how you cook them.", fulfilment: "Pickup, delivery and order notice (e.g. order by Thursday for Saturday).", hours: "Kitchen hours or order days." } },
  { key: "beauty", label: "Hair, beauty & wellbeing", emoji: "💇🏾", order: ["services", "gallery", "items", "events", "hubs"], hidden: [], titles: { services: "Treatments", gallery: "Our work" },
    prompts: { name: "e.g. Crown Braids Studio", about: "What you do and who you do it for.", story: "Your training, your style and your space.", hours: "Your opening hours.", bookingPolicy: "Deposits, lateness and cancellations." } },
  { key: "fitness", label: "Fitness & sport", emoji: "🏋🏾", order: ["services", "events", "gallery", "items", "hubs"], hidden: [], titles: { services: "Classes & sessions", events: "Upcoming classes" },
    prompts: { name: "e.g. Riverside Run Club", about: "The training you offer and who it suits.", story: "Why you coach, and how sessions run.", serviceArea: "Where you train (gyms, parks, online).", bookingPolicy: "Bookings, passes and cancellations." } },
  { key: "creative", label: "Creative & photography", emoji: "🎨", order: ["gallery", "services", "items", "events", "hubs"], hidden: [], titles: { gallery: "Portfolio", services: "Commissions", items: "Prints & products" },
    prompts: { name: "e.g. Lumi Studio", about: "Your style and what you make.", story: "How you work with clients, from brief to finished piece.", bookingPolicy: "Deposits, timelines and revisions." } },
  { key: "tutoring", label: "Tutoring & lessons", emoji: "📚", order: ["services", "events", "gallery", "items", "hubs"], hidden: ["items"], titles: { services: "Lessons", events: "Workshops" },
    prompts: { name: "e.g. Maths with Mira", about: "What you teach and who you teach.", story: "Your experience and how lessons run.", serviceArea: "In person (where) or online.", bookingPolicy: "Bookings, packages and cancellations." } },
  { key: "trades", label: "Trades & home services", emoji: "🛠️", order: ["services", "gallery", "items", "events", "hubs"], hidden: ["events"], titles: { gallery: "Our work" },
    prompts: { name: "e.g. Bright Spark Electrical", about: "The jobs you take on.", story: "Your experience, licences and how you quote.", serviceArea: "Suburbs or regions you cover.", bookingPolicy: "Quotes, call-out fees and cancellations." } },
  { key: "retail", label: "Shop or market stall", emoji: "🛍️", order: ["items", "gallery", "events", "services", "hubs"], hidden: ["services"], titles: { items: "Products", events: "Markets & pop-ups" },
    prompts: { name: "e.g. Kente & Kin", about: "What you sell, in a sentence or two.", story: "Where your products come from.", fulfilment: "Pickup, postage and returns.", hours: "Opening hours or market days." } },
  { key: "events", label: "Events & entertainment", emoji: "🎉", order: ["events", "gallery", "services", "items", "hubs"], hidden: [], titles: { events: "Upcoming events", services: "Bookings" },
    prompts: { name: "e.g. Afrobeats Adelaide", about: "The events you run or perform at.", story: "How it started and what a night with you is like.", bookingPolicy: "Private bookings, deposits and cancellations." } },
  { key: "other", label: "Something else", emoji: "✨", order: ["gallery", "items", "services", "events", "hubs"], hidden: [], titles: {},
    prompts: { name: "e.g. Ada’s Kitchen", about: "What you offer, in one or two sentences.", story: "Tell people about you and how you work." } },
];

export const templateFor = (type?: BusinessType | null) => BUSINESS_TEMPLATES.find((item) => item.key === type) ?? BUSINESS_TEMPLATES[BUSINESS_TEMPLATES.length - 1]!;

/** Tivorah's accent colours, each checked for readable contrast (4.5:1 or more on white). */
export const SHOP_ACCENTS: Record<ShopAccent, { label: string; color: string }> = {
  violet: { label: "Violet", color: "#6840AD" },
  coral: { label: "Coral", color: "#C2410C" },
  amber: { label: "Amber", color: "#92400E" },
  emerald: { label: "Emerald", color: "#047857" },
  ocean: { label: "Ocean", color: "#1D4ED8" },
  rose: { label: "Rose", color: "#BE185D" },
  graphite: { label: "Graphite", color: "#374151" },
};

/** The seller's own name for a section, or the usual one. */
export const sectionTitle = (key: ShopBlock, content?: Pick<ShopContent, "sectionTitles"> | null, fallback = sectionLabels[key]) =>
  content?.sectionTitles?.[key]?.trim() || fallback;
