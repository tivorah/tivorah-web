import { Suspense } from "react";
import { ShopPreview } from "../../../../components/business/showcase/shop-preview";

export default function Page() {
  return <div className="product-page page-shell shop-page"><Suspense fallback={null}><ShopPreview /></Suspense></div>;
}
