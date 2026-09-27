"use client";
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
  useEffect(() => {
    store.setState({ query, locality });
  }, [store, query, locality]);
  const { data, loading, error, cooldown, retry, loadMore } = useDiscovery(
    kind,
    query,
    locality,
    params.toString(),
  );
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
        <LocationSearch value={filters.locality} onChange={value => {
          filters.setLocality(value);
          const next = new URLSearchParams(window.location.search);
          ["state", "postcode", "latitude", "longitude", "radiusKm"].forEach(key => next.delete(key));
          window.history.replaceState(null, "", `${pathname}?${next}`);
        }} onSelect={place => {
          store.setState({ locality: place.suburb });
          const next = new URLSearchParams(window.location.search);
          next.set("locality", place.suburb); next.set("state", place.state); next.set("postcode", place.postcode);
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
      </div>
      {!loading && !error && data?.items.length === 0 ? (
        <div className="product-empty">
          <span aria-hidden="true">⌕</span>
          <h3>{sections[kind].empty}</h3>
          <p>Try another search or browse a wider area.</p>
        </div>
      ) : null}
      {data?.nextSkip !== null && data?.nextSkip !== undefined ? (
        <div className="discover-more">
          <button
            className="product-secondary"
            disabled={loading || pending}
            onClick={loadMore}
          >
            {loading ? "Loading…" : "Explore more"}
          </button>
        </div>
      ) : null}
    </>
  );
}
