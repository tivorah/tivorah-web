/**
 * Who is behind a listing or event: the business or display name they chose, otherwise their own
 * name, otherwise their @username. Mobile counterpart: tivorah-mobile/utils/byline.ts.
 */
const clean = (value: unknown) => (typeof value === "string" ? value.trim() : "");

export function discoveryByline(kind: "events" | "items" | "services" | "hubs", item: { businessName?: unknown; displayName?: unknown; ownerName?: unknown; sellerUsername?: unknown; ownerUsername?: unknown }): string {
  if (kind === "hubs") return "";
  const chosen = kind === "events" ? clean(item.displayName) || clean(item.ownerName) : clean(item.businessName) || clean(item.ownerName);
  if (chosen) return chosen;
  const handle = clean(item.sellerUsername) || clean(item.ownerUsername);
  return handle ? `@${handle}` : "";
}
