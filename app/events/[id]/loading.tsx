import '../events.css';
export default function Loading() { return <section className="page-shell event-state" role="status" aria-busy="true" aria-label="Loading event"><div className="event-placeholder tivorah-shimmer" aria-hidden="true" /><div className="page-skeleton" aria-hidden="true"><span /><span /><span /></div><p>Getting your event ready…</p></section>; }
