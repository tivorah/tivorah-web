import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? "https://tivorah.com";
  const paths = [
    "",
    "/about",
    "/why-tivorah",
    "/hub-organisers",
    "/service-providers",
    "/legal",
    "/privacy",
    "/terms",
    "/marketplace-partner-agreement",
    "/community-guidelines",
    "/safety",
    "/child-safety",
    "/cookies",
    "/accessibility",
    "/disclaimer",
    "/contact",
    "/account-deletion",
    "/unsubscribe",
  ];

  return paths.map((path) => ({ url: `${base}${path}`, lastModified: new Date() }));
}
