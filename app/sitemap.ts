import type { MetadataRoute } from "next";
import { siteOrigin, indexingDisabled } from "../lib/site";

export default function sitemap(): MetadataRoute.Sitemap {
  if (indexingDisabled) return [];
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
