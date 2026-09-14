import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? "https://tivorah.com";
  const paths = [
    "",
    "/about",
    "/legal",
    "/privacy",
    "/terms",
    "/community-guidelines",
    "/safety",
    "/cookies",
    "/accessibility",
    "/disclaimer",
    "/contact",
    "/account-deletion",
    "/unsubscribe",
  ];

  return paths.map((path) => ({ url: `${base}${path}`, lastModified: new Date() }));
}
