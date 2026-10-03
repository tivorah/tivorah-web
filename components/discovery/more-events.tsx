"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { api } from "../../lib/api/client";
import type { DiscoveryItem, DiscoveryPage } from "../../lib/api/discovery";
import { primaryCategory, relatedEvents } from "../../lib/event-detail";
import { DiscoveryCard } from "./card";

const LIMIT = 4;

// Web counterpart of "More events like this" on tivorah-mobile/app/event/event-details.tsx.
// Uses the same public discovery projection as /events, so private or draft events never appear.
export function MoreEvents({ eventId }: { eventId: number }) {
  const [state, setState] = useState<{ status: "loading" | "ready" | "error"; items: DiscoveryItem[] }>({ status: "loading", items: [] });
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    const signal = controller.signal;
    setState((previous) => ({ status: "loading", items: previous.items }));
    (async () => {
      const detail = await api<DiscoveryItem>(`/public/discovery/events/${eventId}`, { signal }).catch(() => null);
      const category = primaryCategory(detail?.category);
      const take = String(LIMIT + 2);
      const [sameCategory, upcoming] = await Promise.all([
        category ? api<DiscoveryPage>(`/public/discovery/events?${new URLSearchParams({ category, take })}`, { signal }).then((page) => page.items).catch(() => []) : Promise.resolve([]),
        api<DiscoveryPage>(`/public/discovery/events?${new URLSearchParams({ take: String(LIMIT * 2) })}`, { signal }).then((page) => page.items),
      ]);
      if (!signal.aborted) setState({ status: "ready", items: relatedEvents(eventId, sameCategory, upcoming, LIMIT) });
    })().catch(() => { if (!signal.aborted) setState((previous) => ({ status: "error", items: previous.items })); });
    return () => controller.abort();
  }, [eventId, attempt]);

  if (state.status === "ready" && !state.items.length) return null;

  return <section className="more-events" aria-labelledby="more-events-heading">
    <div className="more-events-head">
      <h2 id="more-events-heading">More events like this</h2>
      <Link href="/events" className="more-events-all">See all events</Link>
    </div>
    {state.status === "error" && !state.items.length ? <p className="more-events-error" role="alert">
      Couldn’t load other events. <button type="button" onClick={() => setAttempt((value) => value + 1)}>Try again</button>
    </p> : <div className="discover-grid more-events-grid" aria-busy={state.status === "loading"}>
      {state.items.length ? state.items.map((item) => <DiscoveryCard key={item.id} item={item} kind="events" />)
        : Array.from({ length: LIMIT }, (_, index) => <div key={index} className="discover-card discover-card-skeleton" aria-hidden="true">
          <div className="discover-card-image tivorah-shimmer" />
          <div className="discover-card-copy">
            <span className="tivorah-shimmer discover-skeleton-meta" />
            <span className="tivorah-shimmer discover-skeleton-title" />
            <span className="tivorah-shimmer discover-skeleton-line" />
          </div>
        </div>)}
    </div>}
    {state.status === "loading" ? <p className="product-sr-only" role="status">Loading more events…</p> : null}
  </section>;
}
