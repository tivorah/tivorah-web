import type { MetadataRoute } from "next";
import { siteOrigin, indexingDisabled } from "../lib/site";
import { adminApiBase } from "./admin/api-base";

// Search engines: fixed pages plus every public shop, event, item, service and Hub.
// Rebuilt at most once an hour.
export const revalidate = 3600;

type Entry = { id?: number; slug?: string; updatedAt?: string };
type Catalogue = { shops: Entry[]; events: Entry[]; items: Entry[]; services: Entry[]; hubs: Entry[] };

const staticPaths: [string, MetadataRoute.Sitemap[number]["changeFrequency"], number][] = [
  ["/", "daily", 1],
  ["/events", "hourly", 0.9],
  ["/shop", "hourly", 0.9],
  ["/services", "daily", 0.8],
  ["/hubs", "daily", 0.8],
  ["/about", "monthly", 0.6],
  ["/why-tivorah", "monthly", 0.5],
  ["/hub-organisers", "monthly", 0.4],
  ["/service-providers", "monthly", 0.4],
  ["/contact", "yearly", 0.4],
  ["/legal", "monthly", 0.3],
  ["/privacy", "monthly", 0.3],
  ["/terms", "monthly", 0.3],
  ["/marketplace-partner-agreement", "monthly", 0.3],
  ["/community-guidelines", "monthly", 0.3],
  ["/safety", "monthly", 0.3],
  ["/child-safety", "yearly", 0.3],
  ["/cookies", "yearly", 0.2],
  ["/accessibility", "yearly", 0.2],
  ["/disclaimer", "yearly", 0.2],
  ["/account-deletion", "yearly", 0.2],
];

async function catalogue(): Promise<Catalogue | null> {
  const base = adminApiBase();
  if (!base) return null;
  try {
    const response = await fetch(`${base}/api/v1/public/discovery/sitemap`, { next: { revalidate: 3600 }, signal: AbortSignal.timeout(15000) });
    const payload = await response.json();
    return response.ok && payload.status ? payload.data as Catalogue : null;
  } catch {
    return null; // The fixed pages are still listed if the catalogue is unavailable.
  }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  if (indexingDisabled) return [];
  const url = (path: string) => new URL(path, siteOrigin).toString();
  const entries: MetadataRoute.Sitemap = staticPaths.map(([path, changeFrequency, priority]) => ({ url: url(path), changeFrequency, priority }));
  const data = await catalogue();
  if (!data) return entries;
  const add = (rows: Entry[], path: (row: Entry) => string, priority: number, changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"]) =>
    rows.forEach((row) => entries.push({ url: url(path(row)), lastModified: row.updatedAt ? new Date(row.updatedAt) : undefined, changeFrequency, priority }));
  add(data.shops, (row) => `/shops/${encodeURIComponent(row.slug ?? "")}`, 0.8, "weekly");
  add(data.events, (row) => `/events/${row.id}`, 0.8, "daily");
  add(data.items, (row) => `/shop/items/${row.id}`, 0.6, "weekly");
  add(data.services, (row) => `/services/${row.id}`, 0.7, "weekly");
  add(data.hubs, (row) => `/hubs/${row.id}`, 0.6, "weekly");
  return entries;
}
