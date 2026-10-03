import "../../app/media-gallery.css";
export function DetailLoading({ kind }: { kind: "items" | "services" | "hubs" }) {
  return <div className="product-page page-shell product-detail-loading" role="status" aria-busy="true" aria-label={`Loading ${kind === "items" ? "shop item" : kind === "services" ? "service" : "Hub"} details`}>
    <div className="detail-loading-back tivorah-shimmer" aria-hidden="true" />
    {kind === "hubs" ? <div className="hub-detail" aria-hidden="true">
      <div className="hub-detail-hero detail-loading-hub-hero"><div className="hub-detail-cover tivorah-shimmer" /><div className="hub-detail-identity"><div className="detail-loading-avatar tivorah-shimmer" /><div className="detail-loading-hub-copy"><span className="detail-loading-eyebrow tivorah-shimmer" /><span className="detail-loading-heading tivorah-shimmer" /><span className="detail-loading-line short tivorah-shimmer" /><span className="detail-loading-line tivorah-shimmer" /></div></div></div>
      <div className="hub-detail-columns"><div className="hub-detail-main"><span className="detail-loading-section tivorah-shimmer" /><span className="detail-loading-line tivorah-shimmer" /><span className="detail-loading-line short tivorah-shimmer" /><span className="detail-loading-section tivorah-shimmer" /></div><div className="hub-join-card detail-loading-action"><span className="detail-loading-section tivorah-shimmer" /><span className="detail-loading-line tivorah-shimmer" /><span className="detail-loading-button tivorah-shimmer" /></div></div>
    </div> : <div className={`product-detail product-detail-${kind}`} aria-hidden="true">
      {/* Same footprint as the loaded photo header (media-gallery.tsx) on desktop and phones. */}
      <div className="event-gallery is-single"><div className="event-gallery-tile tivorah-shimmer" /></div>
      <div className="event-carousel"><div className="event-carousel-track"><div className="event-carousel-slide tivorah-shimmer" /></div></div>
      <div className="product-detail-content">
        <div className="product-detail-main">
        <span className="detail-loading-eyebrow tivorah-shimmer" />
        <span className="detail-loading-heading tivorah-shimmer" />
        <span className="detail-loading-price tivorah-shimmer" />
        <div className="product-detail-facts">{[0, 1, 2].map((index) => <div key={index}><span className="detail-loading-label tivorah-shimmer" /><span className="detail-loading-value tivorah-shimmer" /></div>)}</div>
        <div className="product-detail-about"><span className="detail-loading-section tivorah-shimmer" /><span className="detail-loading-line tivorah-shimmer" /><span className="detail-loading-line short tivorah-shimmer" /></div>
        {kind === "services" ? <div className="detail-loading-action detail-loading-booking"><span className="detail-loading-section tivorah-shimmer" /><span className="detail-loading-calendar tivorah-shimmer" /></div> : null}
        </div>
        <div className="product-detail-side">
        <div className="detail-loading-action"><span className="detail-loading-section tivorah-shimmer" /><span className="detail-loading-line tivorah-shimmer" /><span className="detail-loading-button tivorah-shimmer" /></div>
        <div className="detail-loading-card"><span className="detail-loading-card-cover tivorah-shimmer" /><div><span className="detail-loading-card-logo tivorah-shimmer" /><span className="detail-loading-line short tivorah-shimmer" /></div></div>
        </div>
      </div>
    </div>}
  </div>;
}
