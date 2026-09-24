import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const siteOrigin = new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "https://tivorah.com").origin;
  const paths = [
    "/",
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
  ];

  return paths.map((path) => ({ url: new URL(path, siteOrigin).toString() }));
}
