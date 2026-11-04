import type { MetadataRoute } from "next";
import { siteOrigin, indexingDisabled } from "../lib/site";

// Private areas end in "/" (or "$" for the bare page) so public pages that share the prefix,
// such as /account-deletion, stay crawlable. The account and business layouts are also noindex.
export default function robots(): MetadataRoute.Robots {

  return {
    rules: indexingDisabled ? [{ userAgent: "*", disallow: "/" }] : [{ userAgent: "*", allow: "/", disallow: ["/admin", "/connect", "/event-orders/", "/event-groups/", "/event-ticket-transfer", "/auth/", "/account$", "/account/", "/business$", "/business/"] }],
    sitemap: new URL("/sitemap.xml", siteOrigin).toString(),
  };
}
