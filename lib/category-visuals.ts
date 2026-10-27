import data from "./category-icons.json";

// Category and interest icons, the same as the app's (tivorah-mobile constants/categoryVisuals.ts and
// constants/marketplaceCategories.ts). lib/category-icons.json is generated from those files and holds
// each Material Design icon's SVG path, so web needs no icon library.
export type CategoryKind = "events" | "hubs" | "items" | "services";
export type CategoryVisual = { path: string; light: string; dark: string };
type Entry = string[];
const tones = data.tones as Record<string, { light: string; dark: string }>;
const paths = data.paths as Record<string, string>;
const visual = ([name, tone]: Entry): CategoryVisual => ({ path: paths[name], light: tones[tone].light, dark: tones[tone].dark });
const keywords = (data.interestKeywords as Entry[]).map(([pattern, name, tone]) => ({ match: new RegExp(pattern), entry: [name, tone] }));

/** The app's icon for a category or Hub interest; the empty choice ("All …") gets the app's "all" icon. */
export function categoryVisual(kind: CategoryKind, label: string): CategoryVisual {
  if (!label) return visual(data.fallbacks.all);
  if (kind === "events") return visual((data.events as Record<string, Entry>)[label] ?? (data.events as Record<string, Entry>).Other);
  if (kind === "items" || kind === "services") return visual((data[kind] as Record<string, Entry>)[label] ?? data.fallbacks[kind === "items" ? "item" : "service"]);
  const normalized = label.toLowerCase().trim().replace(/’/g, "'");
  const exact = (data.interests as Record<string, Entry>)[normalized];
  return visual(exact ?? keywords.find((item) => item.match.test(normalized))?.entry ?? (data.events as Record<string, Entry>).Other);
}
