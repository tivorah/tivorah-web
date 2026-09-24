'use client';
export default function EventError({ reset }: { reset: () => void }) {
  return <section className="page-shell event-state" role="alert"><h1>Event unavailable</h1><p>We could not load this event. Check your connection and try again.</p><button className="event-primary" onClick={reset}>Try again</button></section>;
}
