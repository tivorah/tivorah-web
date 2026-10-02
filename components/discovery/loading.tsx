import { LoadingState } from "../ui/loading-state";
import { DiscoveryKind, sections } from "../../lib/api/discovery";

export function DiscoveryPageLoading({ kind }: { kind: DiscoveryKind }) {
  const section = sections[kind];
  return <div className="product-page discovery-page page-shell" role="status" aria-busy="true" aria-label={`Loading ${section.label.toLowerCase()}`}>
    <section className={`discover-hero discover-hero-${kind}`}><div><p className="product-eyebrow">TIVORAH {section.label.toUpperCase()}</p><h1>{section.title}</h1><p>{section.description}</p>{kind !== "hubs" ? <span className="create-promo-trigger create-promo-skeleton tivorah-shimmer" aria-hidden="true" /> : null}</div></section>
    <DiscoveryLoading label={`Loading ${section.label.toLowerCase()}…`} />
  </div>;
}

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
