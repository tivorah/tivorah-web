import { LoadingState } from "../../components/ui/loading-state";
export default function Loading() {
  return <div className="product-page page-shell shop-page-loading" role="status" aria-busy="true" aria-label="Loading shop">
    <span className="shop-loading-back tivorah-shimmer" aria-hidden="true" />
    <div className="shop-cover tivorah-shimmer" aria-hidden="true" />
    <header className="account-heading" aria-hidden="true"><div><span className="shop-loading-eyebrow tivorah-shimmer" /><span className="shop-loading-title tivorah-shimmer" /><span className="shop-loading-copy tivorah-shimmer" /></div><span className="shop-loading-action tivorah-shimmer" /></header>
    <span className="shop-loading-section tivorah-shimmer" aria-hidden="true" />
    <LoadingState label="Loading available items and services…" variant="cards" count={4} />
  </div>;
}
