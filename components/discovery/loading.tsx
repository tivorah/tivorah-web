import { LoadingState } from "../ui/loading-state";
export function DiscoveryLoading({ label = "Loading discovery…" }: { label?: string }) {
  return <>
    <div className="discover-search discover-search-skeleton" aria-hidden="true">
      <div><span className="tivorah-shimmer" /><span className="tivorah-shimmer" /></div>
      <div><span className="tivorah-shimmer" /><span className="tivorah-shimmer" /></div>
    </div>
    <div className="discover-results-heading discover-heading-skeleton" aria-hidden="true"><span className="tivorah-shimmer" /></div>
    <LoadingState label={label} variant="cards" />
  </>;
}
