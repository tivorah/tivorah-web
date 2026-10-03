import "../events.css";

export default function Loading() {
  return <article className="page-shell event-page event-detail-loading" role="status" aria-busy="true" aria-label="Loading event details">
    <div className="event-loading-back tivorah-shimmer" aria-hidden="true" />
    <div className="event-hero tivorah-shimmer" aria-hidden="true" />
    <div className="event-tools event-loading-tools" aria-hidden="true"><span className="tivorah-shimmer" /><span className="tivorah-shimmer" /></div>
    <div className="event-layout" aria-hidden="true">
      <div className="event-details">
        <div className="event-loading-eyebrow tivorah-shimmer" />
        <div className="event-loading-title tivorah-shimmer" />
        <div className="event-loading-organizer tivorah-shimmer" />
        <div className="event-facts"><div><span className="event-loading-label tivorah-shimmer" /><span className="event-loading-fact tivorah-shimmer" /></div><div><span className="event-loading-label tivorah-shimmer" /><span className="event-loading-fact tivorah-shimmer" /></div></div>
        <section><span className="event-loading-section-title tivorah-shimmer" /><span className="event-loading-line tivorah-shimmer" /><span className="event-loading-line short tivorah-shimmer" /></section>
        <section><span className="event-loading-section-title tivorah-shimmer" /><span className="event-loading-line short tivorah-shimmer" /><span className="event-loading-map tivorah-shimmer" /></section>
        <section><span className="event-loading-section-title tivorah-shimmer" /><span className="event-loading-line tivorah-shimmer" /><span className="event-loading-line short tivorah-shimmer" /></section>
        <div className="event-loading-showcase"><div className="event-loading-showcase-cover tivorah-shimmer" /><div className="event-loading-showcase-body"><span className="event-loading-showcase-logo tivorah-shimmer" /><span className="event-loading-section-title tivorah-shimmer" /><span className="event-loading-line short tivorah-shimmer" /><span className="event-loading-line tivorah-shimmer" /><div className="event-loading-showcase-gallery"><span className="tivorah-shimmer" /><span className="tivorah-shimmer" /><span className="tivorah-shimmer" /></div><span className="event-loading-line short tivorah-shimmer" /></div></div>
      </div>
      <div className="event-booking-column"><div className="event-booking event-loading-booking">
        <span className="event-loading-section-title tivorah-shimmer" />
        <span className="event-loading-label tivorah-shimmer" /><span className="event-loading-control tivorah-shimmer" />
        <span className="event-loading-label tivorah-shimmer" /><span className="event-loading-control tivorah-shimmer" />
        <span className="event-loading-help tivorah-shimmer" />
        <span className="event-loading-total tivorah-shimmer" />
        <span className="event-loading-section-title event-loading-guest tivorah-shimmer" />
        <span className="event-loading-line tivorah-shimmer" />
        <span className="event-loading-label tivorah-shimmer" /><span className="event-loading-control tivorah-shimmer" />
        <span className="event-loading-label tivorah-shimmer" /><span className="event-loading-control tivorah-shimmer" />
        <span className="event-loading-check tivorah-shimmer" /><span className="event-loading-button tivorah-shimmer" />
      </div></div>
    </div>
  </article>;
}
