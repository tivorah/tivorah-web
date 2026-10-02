"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { AccountGate } from "../../account/gate";
import { usePrivateResource } from "../../../hooks/use-private-resource";
import { api, ApiError } from "../../../lib/api/client";
import { ShopData, ShopSkeleton, ShopTab, ShopView } from "../../shop/shop-view";
import { ShowcaseAsset, ShowcaseRecord } from "./types";

// Owner's preview of their shop with the saved draft, rendered by the same
// ShopView as the public page. Opened in a new tab from the editor.
function Preview({ username }: { username: string }) {
  const params = useSearchParams();
  const tabParam = params.get("tab");
  const tab: ShopTab = tabParam === "items" || tabParam === "services" || tabParam === "events" || tabParam === "gallery" ? tabParam : "all";
  const skip = Math.max(0, Number(params.get("skip")) || 0);
  const own = usePrivateResource<{ showcase: ShowcaseRecord | null; assets: ShowcaseAsset[] }>("/web/business/showcase");
  const [shop, setShop] = useState<Omit<ShopData, "content" | "assets" | "hasShowcase"> | null>(null);
  useEffect(() => {
    const controller = new AbortController();
    const type = tab === "items" ? "&type=item" : tab === "services" ? "&type=service" : "";
    api<ShopData>(`/public/shops/${encodeURIComponent(username)}?skip=${tab === "items" || tab === "services" ? skip : 0}${type}`, { signal: controller.signal })
      .then((data) => setShop({ offerings: data.offerings, events: data.events, nextSkip: data.nextSkip, counts: data.counts }))
      .catch((error) => { if (error instanceof ApiError && error.status === 404) setShop({ offerings: [], events: [], nextSkip: null }); });
    return () => controller.abort();
  }, [username, tab, skip]);

  if ((own.loading && !own.data) || !shop) return <ShopSkeleton />;
  const draft = own.data?.showcase?.draft;
  if (!draft) return <div className="showcase-locked"><h2>Nothing to preview yet</h2><p>Save your shop details first, then open the preview again.</p><Link className="product-primary" href="/business/showcase">Go to the editor</Link></div>;
  const href = (next: ShopTab, nextSkip = 0) => {
    const search = new URLSearchParams();
    if (next !== "all") search.set("tab", next);
    if (nextSkip) search.set("skip", String(nextSkip));
    const value = search.toString();
    return `/business/showcase/preview${value ? `?${value}` : ""}#shop-offerings`;
  };
  const published = own.data?.showcase?.published;
  return <ShopView
    preview
    data={{ ...shop, content: draft, assets: own.data?.assets ?? [], hasShowcase: true }}
    tab={tab}
    skip={skip}
    href={href}
    banner={<div className="shop-preview-bar" role="status">
      <div><strong>Preview</strong><span>This is how customers will see your shop, including draft changes. Media in review shows here only.</span></div>
      <div className="shop-preview-actions">
        {published ? <Link className="product-secondary" href={`/shops/${encodeURIComponent(own.data?.showcase?.slug ?? username)}`} target="_blank" rel="noopener">View live shop</Link> : null}
        <Link className="product-primary" href="/business/showcase">Back to editor</Link>
      </div>
    </div>}
  />;
}

export function ShopPreview() {
  return <AccountGate>{(account) => <Preview username={account.username} />}</AccountGate>;
}
