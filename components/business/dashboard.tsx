"use client";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { AvailabilityDropdown } from "./availability-dropdown";
import { AccountGate } from "../account/gate";
import { usePrivateResource } from "../../hooks/use-private-resource";
import { api } from "../../lib/api/client";
import { BusinessOverview } from "./overview";
import { DetailPane, useCompactLayout } from "../account/detail-pane";
import { SelectField } from "../ui/select-field";
type Entry = {
  id: number;
  title: string;
  status: string;
  listingType?: string;
};
type EventSummaryData = { bookings: number; ticketsBooked: number; enquiries: number; messages: number; latestEnquiryId: number | null };
type ListingSummaryData = { appointments: number; upcomingAppointments: number; enquiries: number; messages: number; latestEnquiryId: number | null };
function ActivitySkeleton({ label, cells = 4 }: { label: string; cells?: number }) {
  return <div className="business-event-summary-loading" role="status" aria-label={label}>{Array.from({ length: cells }, (_, index) => <span className="tivorah-shimmer" key={index} />)}</div>;
}
function EventSummary({ id }: { id: number }) {
  const { data, loading, error, retry } = usePrivateResource<EventSummaryData>(`/events/${id}/business-summary`);
  if (loading && !data) return <ActivitySkeleton label="Loading event activity" />;
  if (error && !data) return <div className="business-event-summary-error" role="alert"><span>Event activity is unavailable.</span><button type="button" onClick={retry}>Retry</button></div>;
  if (!data) return null;
  return <div className="business-event-summary" aria-label="Event activity">
    <div><strong>{data.ticketsBooked}</strong><span>Tickets booked</span></div>
    <div><strong>{data.bookings}</strong><span>Bookings</span></div>
    <div><strong>{data.enquiries}</strong><span>Enquiries</span></div>
    <div><strong>{data.messages}</strong><span>Messages received</span></div>
    {data.latestEnquiryId ? <Link className="business-event-summary-link" href={`/account/messages/${data.latestEnquiryId}`}>Open latest enquiry <span aria-hidden="true">↗</span></Link> : null}
  </div>;
}
function ListingSummary({ id, service }: { id: number; service: boolean }) {
  const { data, loading, error, retry } = usePrivateResource<ListingSummaryData>(`/market/products/${id}/business-summary`);
  if (loading && !data) return <ActivitySkeleton label="Loading listing activity" cells={service ? 4 : 2} />;
  if (error && !data) return <div className="business-event-summary-error" role="alert"><span>Listing activity is unavailable.</span><button type="button" onClick={retry}>Retry</button></div>;
  if (!data) return null;
  return <div className="business-event-summary" aria-label="Listing activity">
    {service ? <><div><strong>{data.upcomingAppointments}</strong><span>Upcoming appointments</span></div><div><strong>{data.appointments}</strong><span>Appointments booked</span></div></> : null}
    <div><strong>{data.enquiries}</strong><span>Enquiries</span></div>
    <div><strong>{data.messages}</strong><span>Messages received</span></div>
    {data.latestEnquiryId ? <Link className="business-event-summary-link" href={`/account/messages/${data.latestEnquiryId}`}>Open latest enquiry <span aria-hidden="true">↗</span></Link> : null}
  </div>;
}
function BusinessListSkeleton({ kind }: { kind: "events" | "products" }) {
  return <div className="business-board business-list-loading" role="status" aria-busy="true" aria-label="Loading your business"><div className="business-list" aria-hidden="true">{Array.from({ length: 5 }, (_, index) => <div className="business-list-row" key={index}><span className="business-loading-avatar tivorah-shimmer" /><span className="business-loading-lines"><span className="tivorah-shimmer" /><span className="tivorah-shimmer" /></span><span className="business-loading-status tivorah-shimmer" /></div>)}</div><div className="business-preview-wrap" aria-hidden="true"><span className="business-loading-preview-label tivorah-shimmer" /><div className="business-preview"><span className="business-loading-preview-band tivorah-shimmer" /><div className="business-loading-preview-body"><span className="tivorah-shimmer" /><span className="tivorah-shimmer" /></div><div className="business-event-summary-loading">{Array.from({ length: kind === "events" ? 4 : 2 }, (_, index) => <span className="tivorah-shimmer" key={index} />)}</div><span className="business-loading-preview-action tivorah-shimmer" /></div></div></div>;
}
function BusinessList({ kind }: { kind: "events" | "products" }) {
  const [skip, setSkip] = useState(0);
  const [searchText, setSearchText] = useState("");
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("");
  const [listingType, setListingType] = useState("");
  const [sort, setSort] = useState("newest");
  const filterRef = useRef<HTMLDetailsElement>(null);
  useEffect(() => {
    const timer = window.setTimeout(() => {
      const next = searchText.trim();
      if (next !== query) { setSkip(0); setSelectedId(null); setQuery(next); }
    }, 250);
    return () => window.clearTimeout(timer);
  }, [searchText, query]);
  useEffect(() => {
    const outside = (event: PointerEvent) => { if (filterRef.current?.open && !filterRef.current.contains(event.target as Node)) filterRef.current.open = false; };
    const escape = (event: KeyboardEvent) => { if (event.key === "Escape" && filterRef.current?.open) { filterRef.current.open = false; filterRef.current.querySelector("summary")?.focus(); } };
    document.addEventListener("pointerdown", outside);
    document.addEventListener("keydown", escape);
    return () => { document.removeEventListener("pointerdown", outside); document.removeEventListener("keydown", escape); };
  }, []);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const previewRef = useRef<HTMLElement>(null);
  // Phones/tablets open the chosen listing or event in a bottom sheet.
  const compact = useCompactLayout();
  const [sheetOpen, setSheetOpen] = useState(false);
  const params = new URLSearchParams({ take: "10", skip: String(skip), query, status, sort });
  if (kind === "products") params.set("listingType", listingType);
  const path = `${kind === "events" ? "/events/mine" : "/market/products/mine"}?${params}`;
  const { data, loading, error, retry } = usePrivateResource<{
    events?: Entry[];
    products?: Entry[];
    pagination: { isMoreData: boolean };
  }>(path);
  const [pending, setPending] = useState<number | null>(null);
  const [notice, setNotice] = useState("");
  async function update(item: Entry, action: string) {
    setPending(item.id);
    setNotice("");
    try {
      await api(
        kind === "events"
          ? `/events/${item.id}/${action}`
          : `/market/products/${item.id}/status`,
        {
          method: kind === "events" ? "POST" : "PATCH",
          ...(kind === "products"
            ? { body: JSON.stringify({ status: action }) }
            : {}),
        },
      );
      retry();
    } catch (cause) {
      setNotice(cause instanceof Error ? cause.message : "Could not save.");
    } finally {
      setPending(null);
    }
  }
  const items = kind === "events" ? data?.events : data?.products;
  const selected = items?.find(item => item.id === selectedId) ?? items?.[0];
  return (
    <section className="business-section">
      <div className="business-section-heading">
        <div><p className="product-eyebrow">{kind === "events" ? "EVENTS" : "SHOP & SERVICES"}</p><h2>{kind === "events" ? "Your events" : "Your listings"}</h2></div>
      </div>
      <div className="business-list-controls">
        <div className="business-list-search" role="search">
          <label className="sr-only" htmlFor={`business-${kind}-search`}>Search {kind === "events" ? "events" : "listings"}</label>
          <input id={`business-${kind}-search`} type="search" value={searchText} onChange={(event) => setSearchText(event.target.value)} placeholder={kind === "events" ? "Search your events" : "Search your listings"} />
          <span className="business-list-search-icon" aria-hidden="true"><svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="11" cy="11" r="7" /><path d="m16 16 5 5" /></svg></span>
        </div>
        <details ref={filterRef} className="business-list-filter-menu">
          <summary>Filters{status || listingType || sort !== "newest" ? <><span className="business-filter-active" aria-hidden="true" /><span className="sr-only"> (active)</span></> : null}</summary>
          <div className="business-list-filter-panel">
            {kind === "products" ? <label>Type<SelectField label="Listing type" value={listingType} onChange={(value) => { setListingType(value); setSkip(0); setSelectedId(null); }} options={[{ value: "", label: "All listings" }, { value: "item", label: "Items" }, { value: "service", label: "Services" }]} /></label> : null}
            <label>Status<SelectField label="Status" value={status} onChange={(value) => { setStatus(value); setSkip(0); setSelectedId(null); }} options={kind === "events" ? [{ value: "", label: "All statuses" }, { value: "draft", label: "Draft" }, { value: "published", label: "Published" }, { value: "cancelling", label: "Cancelling" }, { value: "cancelled", label: "Cancelled" }] : [{ value: "", label: "All statuses" }, { value: "active", label: "Active" }, { value: "reserved", label: "Reserved" }, { value: "sold", label: "Sold" }]} /></label>
            <label>Sort by<SelectField label="Sort by" value={sort} onChange={(value) => { setSort(value); setSkip(0); setSelectedId(null); }} options={[{ value: "newest", label: "Newest first" }, { value: "oldest", label: "Oldest first" }, { value: "title", label: "Name A–Z" }, ...(kind === "events" ? [{ value: "event_date", label: "Event date" }] : [])]} /></label>
          </div>
        </details>
        {loading && data ? <span className="business-list-refresh" role="status">Updating…</span> : null}
      </div>
      {loading && !data ? <BusinessListSkeleton kind={kind} /> : null}
      {error ? (
        <div className="product-notice" role="alert">
          <p>{error}</p>
          <button onClick={retry} className="product-secondary">
            Try again
          </button>
        </div>
      ) : null}
      {notice ? <p role="alert">{notice}</p> : null}
      {!loading || data ? <div className="business-board">
      <div className="business-list" role="list" aria-label={kind === "events" ? "Your events" : "Your listings"}>
        {items?.map((item) => (
          <div role="listitem" key={item.id}><button type="button" className="business-list-row" aria-pressed={selected?.id === item.id && (!compact || sheetOpen)} onClick={() => { setSelectedId(item.id); if (compact) setSheetOpen(true); }}>
            <span className="business-list-mark" aria-hidden="true">{kind === "events" ? "E" : item.listingType === "service" ? "S" : "I"}</span>
            <span className="business-list-copy"><strong>{item.title}</strong><small>{kind === "events" ? "Event" : item.listingType === "service" ? "Service" : "Shop item"}</small></span>
            <span className="business-list-status">{item.status}</span>
          </button></div>
        ))}
      </div>
      {selected ? <DetailPane compact={compact} open={sheetOpen} onClose={() => setSheetOpen(false)} label={kind === "events" ? "Event details" : "Listing details"} className="business-preview-wrap"><p className="business-preview-label">{kind === "events" ? "EVENT DETAILS" : "LISTING DETAILS"}</p><aside ref={previewRef} tabIndex={-1} className="business-preview" aria-label={`${selected.title} details`}>
        <div className="business-preview-head"><span>{kind === "events" ? "TIVORAH EVENT" : selected.listingType === "service" ? "TIVORAH SERVICE" : "TIVORAH SHOP"}</span><span>{selected.status}</span></div>
        <div className="business-preview-body"><h3>{selected.title}</h3><p>{kind === "events" ? "Tickets, enquiries and event settings at a glance." : selected.listingType === "service" ? "Appointments and customer enquiries at a glance." : "See interest in your item and manage its availability."}</p></div>
        {kind === "events" ? <EventSummary key={selected.id} id={selected.id} /> : <ListingSummary key={selected.id} id={selected.id} service={selected.listingType === "service"} />}
        <div className="business-preview-actions">
              {kind === "events" ? (
                <>
                  {selected.status === "draft"
                    ? <button className="product-primary press-fx" disabled={pending !== null} onClick={() => update(selected, "publish")}>{pending === selected.id ? "Publishing…" : "Publish event"}</button>
                    : <Link className="product-primary press-fx" href={`/business/events/${selected.id}`}>Manage event</Link>}
                  <nav className="preview-action-list" aria-label="More for this event">
                    {selected.status === "draft" ? <Link href={`/business/events/${selected.id}`}><span>Edit event details</span><span aria-hidden="true">→</span></Link> : null}
                    {selected.status === "published" ? <Link href={`/events/${selected.id}`}><span>View public page</span><span aria-hidden="true">↗</span></Link> : null}
                    <Link href="/account/messages"><span>Messages</span><span aria-hidden="true">→</span></Link>
                    {selected.status === "published" ? <button type="button" disabled={pending !== null} onClick={() => update(selected, "unpublish")}><span>{pending === selected.id ? "Updating…" : "Unpublish"}</span></button> : null}
                  </nav>
                </>
              ) : (
                <>
                  <Link
                    className="product-primary"
                    href={`/business/listings/${selected.id}`}
                  >
                    {selected.listingType === "service" ? "Manage service" : "Manage listing"}
                  </Link>
                  <div className="business-preview-links"><Link href={selected.listingType === "service" ? `/services/${selected.id}` : `/shop/items/${selected.id}`}>View public listing</Link><Link href="/account/messages">View messages</Link></div>
                  {selected.listingType !== "service" ? <AvailabilityDropdown key={selected.id} status={selected.status} disabled={pending !== null} onChange={status => update(selected, status)} /> : null}
                </>
              )}
        </div>
      </aside></DetailPane> : null}
      </div> : null}
      {!loading && !error && !items?.length ? (
        <div className="product-empty"><p>{query || status || listingType ? "No results match these filters. Change a filter or search again." : kind === "events" ? "Your events will appear here." : "Your items and services will appear here."}</p>{!query && !status && !listingType ? <Link className="product-primary" href={kind === 'events' ? '/business/create?type=event' : '/business/create?type=item'}>{kind === 'events' ? 'Create your first event' : 'Create your first listing'}</Link> : null}</div>
      ) : null}
      {(skip > 0 || data?.pagination.isMoreData) ? <nav className="business-pagination" aria-label={`${kind === "events" ? "Event" : "Listing"} pages`}>
        {skip > 0 ? (
          <button
            className="product-secondary"
            disabled={loading}
            onClick={() => { setSelectedId(null); setSkip(Math.max(0, skip - 10)); }}
          >
            Previous
          </button>
        ) : null}
        <span>Page {Math.floor(skip / 10) + 1}</span>
        {data?.pagination.isMoreData ? (
          <button
            className="product-secondary"
            disabled={loading}
            onClick={() => { setSelectedId(null); setSkip(skip + 10); }}
          >
            Next
          </button>
        ) : null}
      </nav> : null}
    </section>
  );
}
export function BusinessDashboard() {
  const params = useSearchParams();
  const view = params.get("view") === "events" ? "events" : "products";
  return <AccountGate>{(account) => <>
    <BusinessOverview firstName={account.firstName || account.username} />
    <BusinessList key={view} kind={view} />
  </>}</AccountGate>;
}
