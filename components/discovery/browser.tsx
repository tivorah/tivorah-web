"use client";
import Link from "next/link";
import { OpenInApp } from "../ui/open-in-app";
import { DiscoveryFilters } from "./filters";
import { LocationSearch } from "./location-search";
import { LoadingState } from "../ui/loading-state";
import { DiscoveryLoading } from "./loading";
import { useEffect, useMemo, useState } from "react";
import { useSearchParams, usePathname } from "next/navigation";
import { useStore } from "zustand";
import { createDiscoveryStore } from "../../stores/discovery-store";
import { useDiscovery } from "../../hooks/use-discovery";
import { DiscoveryKind, sections } from "../../lib/api/discovery";
import { DiscoveryCard } from "./card";
import { useDiscoveryFeatures } from "./features";
export function DiscoveryBrowser({ kind }: { kind: DiscoveryKind }) {
  const { enabled, loading, error, retry } = useDiscoveryFeatures();
  if (loading)
    return <DiscoveryLoading label="Checking availability…" />;
  if (error)
    return (
      <div className="product-notice" role="alert">
        <p>We couldn’t connect to Tivorah. Please try again shortly.</p>
        <button className="product-secondary" onClick={retry}>
          Try again
        </button>
      </div>
    );
  if (!enabled(kind))
    return (
      <p className="product-notice">This section is currently unavailable.</p>
    );
  return <EnabledBrowser kind={kind} />;
}
function EnabledBrowser({ kind }: { kind: DiscoveryKind }) {
  const params = useSearchParams();
  const pathname = usePathname();
  const query = params.get("query") || "";
  const locality = params.get("locality") || "";
  const [store] = useState(() => createDiscoveryStore(query, locality));
  const filters = useStore(store);
  const [locationInput, setLocationInput] = useState(locality);
  useEffect(() => {
    store.setState({ query, locality });
  }, [store, query, locality]);
  useEffect(() => setLocationInput(locality), [locality]);
  const { data, loading, error, cooldown, retry, loadMore } = useDiscovery(
    kind,
    query,
    locality,
    params.toString(),
  );
  // "Explore more" fills the next rows with card-shaped placeholders while the
  // next batch loads; a new search keeps the "Updating…" treatment instead.
  const [loadingMore, setLoadingMore] = useState(false);
  useEffect(() => { if (!loading) setLoadingMore(false); }, [loading]);
  const cards = useMemo(
    () =>
      data?.items.map((item) => (
        <DiscoveryCard key={item.id} item={item} kind={kind} />
      )),
    [data?.items, kind],
  );
  const [composing, setComposing] = useState(false);
  useEffect(() => {
    if (composing || (filters.query.trim() === query && filters.locality.trim() === locality)) return;
    const timer = window.setTimeout(() => {
      const next = new URLSearchParams(window.location.search);
      next.delete("query"); next.delete("locality");
      if (filters.query.trim()) next.set("query", filters.query.trim());
      if (filters.locality.trim()) next.set("locality", filters.locality.trim());
      // Replace rather than push: typing must not fill browser history.
      window.history.replaceState(null, "", `${pathname}${next.size ? `?${next}` : ""}`);
    }, 350);
    return () => window.clearTimeout(timer);
  }, [filters.query, filters.locality, query, locality, pathname, composing]);
  const pending = filters.query.trim() !== query || filters.locality.trim() !== locality;
  const hasSearch = Boolean(query || locality || params.get('state') || params.get('latitude') || params.get('category') || params.get('radiusKm'));
  const create = { events: { label: 'Create an event', href: '/business/create?type=event' }, items: { label: 'Sell an item', href: '/business/create?type=item' }, services: { label: 'Offer a service', href: '/business/create?type=service' } } as const;
  return (
    <>
      <form className="discover-search" onSubmit={(event) => event.preventDefault()} onCompositionStart={() => setComposing(true)} onCompositionEnd={() => setComposing(false)} role="search">
        <label>
          <span className="search-field-label">What are you looking for?</span>
          <svg className="search-field-icon" aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="10.5" cy="10.5" r="6.5" /><path d="m16 16 5 5" /></svg>
          <input
            maxLength={100}
            type="search"
            value={filters.query}
            onChange={(e) => filters.setQuery(e.target.value)}
            placeholder={`Search ${sections[kind].label.toLowerCase()}`}
          />
        </label>
        <LocationSearch value={locationInput} onChange={value => {
          setLocationInput(value);
          if (value.trim()) return;
          store.setState({ locality: "" });
          const next = new URLSearchParams(window.location.search);
          ["locality", "state", "latitude", "longitude", "radiusKm"].forEach(key => next.delete(key));
          window.history.replaceState(null, "", `${pathname}${next.size ? `?${next}` : ""}`);
        }} onSelect={place => {
          setLocationInput(place.suburb);
          store.setState({ locality: place.suburb });
          const next = new URLSearchParams(window.location.search);
          next.set("locality", place.suburb); next.set("state", place.state);
          if (place.latitude != null && place.longitude != null) {
            next.set("latitude", String(place.latitude)); next.set("longitude", String(place.longitude)); next.set("radiusKm", "10");
          } else ["latitude", "longitude", "radiusKm"].forEach(key => next.delete(key));
          window.history.replaceState(null, "", `${pathname}?${next}`);
        }} />
      </form>
      <DiscoveryFilters kind={kind} />
      <div className="discover-results-heading">
        <h2>
          {query
            ? `Results for “${query}”`
            : `Explore ${sections[kind].label.toLowerCase()}`}
        </h2>
        <span role="status">
          {loading || pending
            ? "Updating…"
            : data
              ? `${data.items.length}${data.nextSkip !== null ? "+" : ""} to explore`
              : ""}
        </span>
      </div>
      {error ? (
        <div className="product-notice" role="alert">
          <p>{error}</p>
          <button className="product-secondary" onClick={retry} disabled={cooldown > 0}>
            {cooldown > 0 ? `Try again in ${cooldown}s` : "Try again"}
          </button>
        </div>
      ) : null}
      {loading && !data ? (
        <LoadingState label="Loading results…" variant="cards" />
      ) : null}
      <div className="discover-grid" aria-busy={loading}>
        {cards}
        {loadingMore && loading ? Array.from({ length: 8 }, (_, index) => (
          <div key={`more-${index}`} className={`discover-card discover-card-skeleton${kind === "hubs" ? " discover-card-hub" : ""}`} aria-hidden="true">
            <div className="discover-card-image tivorah-shimmer" />
            <div className="discover-card-copy">
              <span className="tivorah-shimmer discover-skeleton-meta" />
              <span className="tivorah-shimmer discover-skeleton-title" />
              <span className="tivorah-shimmer discover-skeleton-title short" />
              <span className="tivorah-shimmer discover-skeleton-line" />
              <div className="discover-card-bottom"><span className="tivorah-shimmer discover-skeleton-price" /></div>
            </div>
          </div>
        )) : null}
      </div>
      {loadingMore && loading ? <p className="product-sr-only" role="status">Loading more {sections[kind].label.toLowerCase()}…</p> : null}
      {!loading && !pending && !error && data?.items.length === 0 ? (
        <div className="product-empty">
          <span aria-hidden="true">⌕</span>
          <h3>{hasSearch ? sections[kind].empty : kind === 'hubs' ? 'No Hubs yet' : kind === 'events' ? 'No events yet' : kind === 'services' ? 'No services yet' : 'No items yet'}</h3>
          <p>{hasSearch ? 'Try another search or browse a wider area.' : kind === 'hubs' ? 'Bring people together around something you share.' : 'Be the first to add one to Tivorah.'}</p>
          <div className="discover-empty-actions">{kind === 'hubs' ? <OpenInApp className={hasSearch ? 'product-secondary' : 'product-primary'} appPath="hubs/create-hub">Create a Hub in the app</OpenInApp> : <Link className={hasSearch ? 'product-secondary' : 'product-primary'} href={create[kind].href}>{create[kind].label}</Link>}</div>
        </div>
      ) : null}
      {data?.nextSkip !== null && data?.nextSkip !== undefined ? (
        <div className="discover-more">
          <button
            className="product-secondary"
            disabled={loading || pending}
            onClick={() => { setLoadingMore(true); loadMore(); }}
          >
            {loadingMore && loading ? "Loading more…" : "Explore more"}
          </button>
        </div>
      ) : null}
    </>
  );
}
