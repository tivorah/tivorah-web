import { siteOrigin } from "./site";

// Structured data (JSON-LD) so search engines understand shops, events and listings.
// Only public information is included; the operator's location is "Adelaide, SA" only.
export const absoluteUrl = (path: string) => new URL(path, siteOrigin).toString();

export function JsonLd({ data }: { data: Record<string, unknown> }) {
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, "\\u003c") }} />;
}

/** First 160 characters of text, cut at a word, for meta descriptions. */
export function summary(text: string | null | undefined, fallback: string) {
  const clean = (text || "").replace(/\s+/g, " ").trim();
  if (!clean) return fallback;
  return clean.length > 160 ? `${clean.slice(0, 157).replace(/\s+\S*$/, "")}…` : clean;
}
