import "../events.css";

export default function Loading() {
  return <article className="page-shell event-page event-detail-loading" role="status" aria-busy="true" aria-label="Loading event details">
    <div className="event-hero tivorah-shimmer" aria-hidden="true" />
    <div className="event-tools event-loading-tools" aria-hidden="true"><span className="tivorah-shimmer" /><span className="tivorah-shimmer" /></div>
    <div className="event-layout" aria-hidden="true">
      <div className="event-details">
        <div className="event-loading-title tivorah-shimmer" />
        <div className="event-loading-organizer tivorah-shimmer" />
        <div className="event-facts"><div><span className="event-loading-label tivorah-shimmer" /><span className="event-loading-fact tivorah-shimmer" /></div><div><span className="event-loading-label tivorah-shimmer" /><span className="event-loading-fact tivorah-shimmer" /></div></div>
        <section><span className="event-loading-section-title tivorah-shimmer" /><span className="event-loading-line tivorah-shimmer" /><span className="event-loading-line short tivorah-shimmer" /></section>
        <section><span className="event-loading-section-title tivorah-shimmer" /><span className="event-loading-line short tivorah-shimmer" /></section>
      </div>
      <div className="event-booking event-loading-booking"><span className="event-loading-section-title tivorah-shimmer" /><span className="event-loading-label tivorah-shimmer" /><span className="event-loading-control tivorah-shimmer" /><span className="event-loading-label tivorah-shimmer" /><span className="event-loading-control tivorah-shimmer" /><span className="event-loading-total tivorah-shimmer" /><span className="event-loading-control tivorah-shimmer" /></div>
    </div>
  </article>;
}
