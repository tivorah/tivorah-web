import type { MetadataRoute } from "next";
import { siteOrigin, indexingDisabled } from "../lib/site";

export default function robots(): MetadataRoute.Robots {

  return {
    rules: indexingDisabled ? [{ userAgent: "*", disallow: "/" }] : [{ userAgent: "*", allow: "/", disallow: ["/admin", "/connect", "/event-orders/", "/event-groups/", "/event-ticket-transfer", "/auth/", "/account", "/business"] }],
    sitemap: new URL("/sitemap.xml", siteOrigin).toString(),
  };
}
