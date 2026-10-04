"use client";
import { AccountSurfaceLoading } from "../account/surface-loading";
import Link from "next/link";
import { FormEvent, useState } from "react";
import { AccountGate } from "../account/gate";
import { usePrivateResource } from "../../hooks/use-private-resource";
import { useMutation } from "../../hooks/use-mutation";
import { Locality, LocalityField } from "./locality-field";
import { MediaField } from "./media-field";
import { ListingActivity } from "./listing-activity";
import { OfferingVideosEditor } from "./offering-videos";
import { ServiceSettings, ServiceSettingsValue, serviceTimezoneForState } from "./service-settings";
import { SelectField } from "../ui/select-field";
import { HubShareField } from "./hub-share-field";
import { conditionOptions, priceTypeOptions } from "./select-options";
import { money } from '../../lib/api/discovery';
import { centsOrThrow } from "../../lib/money";
type Listing = ServiceSettingsValue & {
  id: number;
  sellerId: number;
  listingType: "item" | "service";
  title: string;
  description: string;
  businessName: string | null;
  category: string;
  images: string[];
  priceCents: number;
  currency: string;
  priceType: string;
  condition: string;
  /** Hubs this listing is shared with (owner view only). */
  communityIds?: number[];
  communityId?: number | null;
  serviceMode: string | null;
  suburb: string | null;
  state: string | null;
  postcode: string | null;
  pickupNotes: string | null;
};
type ListingStats = { enquiries: number; messages: number; upcomingAppointments?: number; appointments?: number; latestEnquiryId?: number | null };
const tabsFor = (service: boolean) => (service ? ["Details", "Photos", "Customers", "Enquiries", "Availability", "Sharing"] : ["Details", "Photos", "Enquiries", "Sharing"]) as string[];

// Item/service workspace: same pattern as the event workspace — header with status,
// key numbers, tabs of step cards, an at-a-glance panel and one sticky save bar.
function Editor({ item, refresh }: { item: Listing & { status?: string }; refresh: () => void }) {
  const service = item.listingType === "service";
  const [images, setImages] = useState(item.images);
  const [uploading, setUploading] = useState(false);
  const [locality, setLocality] = useState<Locality | null>(null);
  const [tab, setTab] = useState("Details");
  const [menuOpen, setMenuOpen] = useState(false);
  const [settings, setSettings] = useState<ServiceSettingsValue>({
    availabilityTimezone: item.availabilityTimezone || serviceTimezoneForState(item.state),
    bookingEnabled: item.bookingEnabled,
    paymentRequired: item.paymentRequired,
    slotDurationMinutes: item.slotDurationMinutes,
    bookingNoticeHours: item.bookingNoticeHours,
    weeklyAvailability: item.weeklyAvailability,
  });
  const mutation = useMutation(refresh);
  const { data: stats } = usePrivateResource<ListingStats>(`/market/products/${item.id}/business-summary`);
  const [hubIds, setHubIds] = useState<number[]>(item.communityIds ?? (item.communityId ? [item.communityId] : []));
  const publicPath = service ? `/services/${item.id}` : `/shop/items/${item.id}`;
  const status = item.status ?? "active";
  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    await mutation.run(
      `/market/products/${item.id}`,
      "PATCH",
      {
        title: f.get("title"),
        description: f.get("description"),
        businessName: f.get("businessName"),
        category: f.get("category"),
        categories: [f.get("category")],
        images,
        communityIds: hubIds,
        priceCents: centsOrThrow(f.get("price")),
        currency: String(f.get("currency") || item.currency || "AUD"),
        priceType: f.get("priceType"),
        ...(locality || {}),
        ...(service
          ? { ...settings, serviceMode: f.get("serviceMode"), availableOnline: f.get("serviceMode") === "online" }
          : { condition: f.get("condition"), pickupNotes: f.get("pickupNotes") }),
      },
      service ? "Service updated." : "Listing updated.",
    );
  }
  const statCells: [string, number | undefined][] = service
    ? [["Upcoming appointments", stats?.upcomingAppointments], ["Appointments booked", stats?.appointments], ["Enquiries", stats?.enquiries], ["Messages", stats?.messages]]
    : [["Enquiries", stats?.enquiries], ["Messages", stats?.messages]];
  return (
    <div className="event-manage listing-workspace">
      <nav className="account-ticket-breadcrumb" aria-label="Breadcrumb"><Link href="/business?view=listings">Your listings</Link><span aria-hidden="true">›</span><span aria-current="page">{service ? "Manage service" : "Manage item"}</span></nav>
      <header className="event-manage-header">
        <div>
          <p className="product-eyebrow">{service ? "SERVICE WORKSPACE" : "ITEM WORKSPACE"} <span className="event-manage-status">{status === "active" ? (service ? "Live" : "On sale") : status}</span></p>
          <h1>{item.title}</h1>
          <p className="event-manage-meta">{item.priceCents ? `${money(item.priceCents, item.currency)}${item.priceType === "hourly" ? " / hour" : item.priceType === "from" ? " (from)" : ""}` : item.priceType === "quote" ? "Price on quote" : "Free"} · {[item.suburb, item.state].filter(Boolean).join(", ") || "Online"}</p>
        </div>
        <div className="event-manage-actions">
          <Link className="product-secondary press-fx" href={publicPath}>View public page <span aria-hidden="true">↗</span></Link>
          {!service ? <div className="event-more">
            <button type="button" className="event-more-trigger" aria-haspopup="menu" aria-expanded={menuOpen} aria-label="More listing options" onClick={() => setMenuOpen((value) => !value)}>
              <svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><circle cx="5" cy="12" r="2" /><circle cx="12" cy="12" r="2" /><circle cx="19" cy="12" r="2" /></svg>
            </button>
            {menuOpen ? <div className="event-more-menu" role="menu">
              {(["active", "reserved", "sold"] as const).filter((next) => next !== status).map((next) => <button key={next} type="button" role="menuitem" disabled={mutation.busy} onClick={() => { setMenuOpen(false); void mutation.run(`/market/products/${item.id}/status`, "PATCH", { status: next }, next === "active" ? "Back on sale." : next === "reserved" ? "Marked as reserved." : "Marked as sold."); }}>
                <strong>{next === "active" ? "Back on sale" : next === "reserved" ? "Mark as reserved" : "Mark as sold"}</strong>
                <span>{next === "active" ? "Show it as available again." : next === "reserved" ? "Someone is collecting it — hold it for them." : "It’s gone. It stops showing in search."}</span>
              </button>)}
            </div> : null}
          </div> : null}
        </div>
      </header>

      <dl className="event-stats listing-stats" aria-busy={!stats || undefined}>
        {statCells.map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value === undefined ? <span className="event-stat-skel tivorah-shimmer" aria-hidden="true" /> : value}</dd></div>)}
      </dl>
      {stats?.latestEnquiryId ? <p className="listing-latest"><Link href={`/account/messages/${stats.latestEnquiryId}`}>Open the latest enquiry <span aria-hidden="true">→</span></Link></p> : null}

      <nav className="event-manage-tabs" aria-label={service ? "Manage service" : "Manage item"}>
        {tabsFor(service).map((value) => <button key={value} type="button" aria-pressed={tab === value} onClick={() => setTab(value)}>{value}</button>)}
      </nav>

      <div className="event-manage-content">
        {tab === "Customers" && service ? <ListingActivity id={item.id} kind="bookings" /> : null}
        {tab === "Enquiries" ? <ListingActivity id={item.id} kind="enquiries" /> : null}
        <div className={`event-details-layout ${tab === "Availability" || tab === "Photos" ? "listing-availability-layout" : ""}`}>
          <form className="showcase-form event-details-form" onSubmit={submit} aria-busy={mutation.busy || uploading} hidden={tab === "Customers" || tab === "Enquiries"}>
            <fieldset disabled={mutation.busy || uploading} className="event-details-fieldset">
              {/* Every tab's fields stay in one form (hidden ones are still saved). */}
              <div hidden={tab !== "Details"} className="listing-tab">
                <section className="showcase-step">
                  <h2>Basics</h2>
                  <label>Title<input name="title" defaultValue={item.title} minLength={3} maxLength={160} required /></label>
                  <label>Description<textarea name="description" defaultValue={item.description} minLength={10} maxLength={10000} rows={6} required /></label>
                  <div className="showcase-row">
                    <label>Category<input name="category" defaultValue={item.category} minLength={2} maxLength={100} required /></label>
                    <label><span className="showcase-label">Business name <span className="showcase-optional">Optional</span></span><input name="businessName" defaultValue={item.businessName || ""} maxLength={100} /></label>
                  </div>
                </section>
                <section className="showcase-step">
                  <h2>Price</h2>
                  <div className="showcase-row">
                    <label>Price<input name="price" type="number" min={0} max={1000000} step="0.01" defaultValue={item.priceCents / 100} required /></label>
                    <label>Currency<SelectField name="currency" label="Currency" defaultValue={item.currency || "AUD"} options={["AUD", "NZD", "USD", "CAD", "GBP", "EUR", "SGD"].map(value => ({ value, label: value }))} /></label>
                    <label>Price basis<SelectField name="priceType" label="Price basis" defaultValue={item.priceType || "fixed"} options={service ? priceTypeOptions : priceTypeOptions.slice(0, 1)} /></label>
                  </div>
                </section>
                <section className="showcase-step">
                  <h2>{service ? "Where you work" : "Condition & pickup"}</h2>
                  {service ? <label>Service location<SelectField name="serviceMode" label="Service location" defaultValue={item.serviceMode || "at_provider"} options={[{ value: "at_provider", label: "At my location" }, { value: "mobile", label: "I travel to customers" }, { value: "online", label: "Online" }, { value: "flexible", label: "In person or online" }]} /></label>
                    : <label>Condition<SelectField name="condition" label="Condition" defaultValue={item.condition || "new"} options={conditionOptions} /></label>}
                  <p className="event-current-locality"><span>Suburb</span><strong>{[item.suburb, item.state, item.postcode].filter(Boolean).join(", ") || "Online"}</strong></p>
                  <details className="showcase-more event-change-locality"><summary>Change suburb</summary><LocalityField required={false} onChange={setLocality} /></details>
                  {!service ? <label><span className="showcase-label">Pickup details <span className="showcase-optional">Optional</span></span><textarea name="pickupNotes" maxLength={1000} rows={3} defaultValue={item.pickupNotes || ""} placeholder="When and where buyers can collect it" /></label> : null}
                </section>
              </div>
              <div hidden={tab !== "Photos"} className="listing-tab">
                <section className="showcase-step">
                  <h2>Photos</h2>
                  <p className="showcase-hint">The first photo is the one customers see first. Up to five photos, 10 MB each, checked before publishing.</p>
                  <MediaField initialUrls={item.images} context={item.listingType} onChange={setImages} onBusy={setUploading} />
                </section>
                {tab === "Photos" ? <OfferingVideosEditor kind={item.listingType} id={item.id} /> : null}
              </div>
              {service ? <div hidden={tab !== "Availability"} className="listing-tab">
                <section className="showcase-step business-create-appointments">
                  <h2>Bookings &amp; availability</h2>
                  <ServiceSettings localityState={locality?.state ?? item.state} value={settings} onChange={setSettings} />
                </section>
              </div> : null}
              <div hidden={tab !== "Sharing"} className="listing-tab">
                <section className="showcase-step"><HubShareField value={hubIds} onChange={setHubIds} disabled={mutation.busy} /></section>
              </div>
            </fieldset>
            {mutation.error ? <p className="product-error" role="alert">{mutation.error}</p> : null}
            {mutation.notice ? <p className="product-notice" role="status">{mutation.notice}</p> : null}
            {!images.length ? <p className="field-error" role="alert">Add at least one photo before saving.</p> : null}
            <div className="showcase-actions">
              <span className="showcase-hint">Changes show on your {service ? "service" : "item"} page straight away.</span>
              <span><button className="product-primary press-fx" disabled={mutation.busy || uploading || !images.length}>{mutation.busy ? "Saving…" : uploading ? "Uploading…" : "Save changes"}</button></span>
            </div>
          </form>
          {tab === "Details" || tab === "Sharing" ? <aside className="event-glance" aria-label="At a glance">
            <div className="event-glance-card listing-glance-photo">
              {/* Listing photos are user uploads on varied hosts. */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              {images[0] ? <img src={images[0]} alt="" /> : <span>No photo yet</span>}
            </div>
            <div className="event-glance-card">
              <span className="event-glance-label">Your public page</span>
              <Link className="event-glance-link" href={publicPath}>{`tivorah.com${publicPath}`} <span aria-hidden="true">↗</span></Link>
              <button type="button" className="product-secondary press-fx" onClick={() => void navigator.clipboard?.writeText(`${window.location.origin}${publicPath}`)}>Copy link</button>
            </div>
            <div className="event-glance-card">
              <span className="event-glance-label">Sharing</span>
              <p>{hubIds.length ? `Also shown in ${hubIds.length} ${hubIds.length === 1 ? "Hub" : "Hubs"}.` : "Only on your shop and Tivorah search."}</p>
              {service ? <p>{settings.bookingEnabled ? "Customers can book appointments online." : "Customers send you an enquiry to book."}</p> : null}
            </div>
          </aside> : null}
        </div>
      </div>
    </div>
  );
}
function LoadEditor({ id, accountId }: { id: string; accountId: number }) {
  const { data, loading, error, retry } = usePrivateResource<{
    product: Listing;
  }>(`/market/products/${id}`);
  if (loading && !data) return <AccountSurfaceLoading embedded />;
  if (error || !data)
    return (
      <div role="alert">
        <p>{error || "Listing unavailable."}</p>
        <button className="product-secondary" onClick={retry}>
          Try again
        </button>
      </div>
    );
  if (data.product.sellerId !== accountId)
    return <p>You can edit only your own listings.</p>;
  return <Editor item={data.product as Listing & { status?: string }} refresh={retry} />;
}
export function ListingEditor({ id }: { id: string }) {
  return (
    <AccountGate>
      {(account) => <LoadEditor id={id} accountId={account.id} />}
    </AccountGate>
  );
}
