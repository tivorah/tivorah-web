import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const siteOrigin = new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "https://tivorah.com").origin;

  return {
    rules: [{ userAgent: "*", allow: "/", disallow: ["/admin", "/connect"] }],
    sitemap: new URL("/sitemap.xml", siteOrigin).toString(),
  };
}
