"use client";
import { BookingSetupNotice } from "./booking-setup-notice";
import { AccountSurfaceLoading } from "../account/surface-loading";
import Link from "next/link";
import { FormEvent, useEffect, useRef, useState } from "react";
import { Sheet } from "../ui/sheet";
import { AccountGate } from "../account/gate";
import { usePrivateResource } from "../../hooks/use-private-resource";
import { useMutation } from "../../hooks/use-mutation";
import { Locality, LocalityField } from "./locality-field";
import { MediaField } from "./media-field";
import { ListingActivity } from "./listing-activity";
import { OfferingVideosEditor } from "./offering-videos";
import { ServiceSettings, ServiceSettingsValue, serviceSettingsPayload, serviceTimezoneForState } from "./service-settings";
import { SelectField } from "../ui/select-field";
import { HubShareField } from "./hub-share-field";
import { conditionOptions, priceTypeOptions } from "./select-options";
import { asksCondition } from "./listing-kinds";
import categories from "../../lib/discovery-categories.json";
import { ServiceMenuEditor, useServiceTemplate } from "./service-menu-editor";
import { draftFromMenu, hasMenuItems, menuPayload, type ServiceMenuItem, type ServiceMenuValue } from "../../lib/service-menu";
import { money } from '../../lib/api/discovery';
import { centsOrThrow } from "../../lib/money";
import { ItemOrderingFields } from "./item-ordering-fields";
import { itemOrderingPayload } from "./item-ordering";
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
  /** Items: how buyers order and get it (item-ordering-fields.tsx). */
  orderMode?: "message" | "request";
  offersPickup?: boolean;
  offersDelivery?: boolean;
  deliveryFeeCents?: number | null;
  deliveryAreaKm?: number | null;
  readyInMinutes?: number | null;
  inventory?: number | null;
  /** Hubs this listing is shared with (owner view only). */
  communityIds?: number[];
  communityId?: number | null;
  serviceMode: string | null;
  serviceMenu?: ServiceMenuItem[];
  suburb: string | null;
  state: string | null;
  postcode: string | null;
  /** ISO country code (Australia when not set). */
  countryCode?: string | null;
  pickupNotes: string | null;
};
type ListingStats = { enquiries: number; messages: number; upcomingAppointments?: number; appointments?: number; latestEnquiryId?: number | null };
// Sharing isn't a tab: it's the Share sheet (public page, copy link, share, Hubs), opened from the summary card.
const tabsFor = (service: boolean) => (service ? ["Details", "Photos", "Customers", "Enquiries", "Availability"] : ["Details", "Photos", "Enquiries"]) as string[];

// Item/service workspace: same pattern as the event workspace — header with status,
// key numbers, tabs of step cards, an at-a-glance panel and one sticky save bar.
function Editor({ item, refresh }: { item: Listing & { status?: string }; refresh: () => void }) {
  const service = item.listingType === "service";
  const [images, setImages] = useState(item.images);
  const [uploading, setUploading] = useState(false);
  const [locality, setLocality] = useState<Locality | null>(null);
  const [tab, setTab] = useState("Details");
  const [menuOpen, setMenuOpen] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);
  // The phone's own share menu, where the browser has one (read after mount: no server mismatch).
  const [canShare, setCanShare] = useState(false);
  useEffect(() => { setCanShare(typeof navigator !== "undefined" && typeof navigator.share === "function"); }, []);
  const [settings, setSettings] = useState<ServiceSettingsValue>({
    availabilityTimezone: item.availabilityTimezone || serviceTimezoneForState(item.state, item.countryCode),
    bookingEnabled: item.bookingEnabled,
    paymentRequired: item.paymentRequired,
    paymentTiming: item.paymentTiming ?? "upfront",
    refundPolicy: item.refundPolicy ?? null,
    refundPolicyNote: item.refundPolicyNote ?? null,
    slotDurationMinutes: item.slotDurationMinutes,
    bookingNoticeHours: item.bookingNoticeHours,
    weeklyAvailability: item.weeklyAvailability,
    bookingApproval: item.bookingApproval ?? "instant",
    bufferMinutes: item.bufferMinutes ?? 0,
    maxBookingsPerDay: item.maxBookingsPerDay ?? null,
    gstTreatment: item.gstTreatment ?? "unspecified",
    testimonials: item.testimonials ?? [],
  });
  const [category, setCategory] = useState(item.category);
  const [menu, setMenu] = useState<ServiceMenuValue>(() => draftFromMenu(item.serviceMenu));
  // Menu categories (food, hairstyles, packages) take a list of priced items; others keep one price.
  const template = useServiceTemplate(service ? category : null);
  const usesMenu = !!template && hasMenuItems(menu);
  const [menuError, setMenuError] = useState("");
  const mutation = useMutation(refresh);
  const { data: stats } = usePrivateResource<ListingStats>(`/market/products/${item.id}/business-summary`);
  const [hubIds, setHubIds] = useState<number[]>(item.communityIds ?? (item.communityId ? [item.communityId] : []));
  const publicPath = service ? `/services/${item.id}` : `/shop/items/${item.id}`;
  const status = item.status ?? "active";
  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    let menuFields: ReturnType<typeof menuPayload> | null = null;
    setMenuError("");
    if (service) {
      try { menuFields = menuPayload(menu, !!template); } catch (cause) { setMenuError(cause instanceof Error ? cause.message : "Check your menu."); setTab("Details"); return; }
    }
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
        // With a menu, the API prices the service from its items ("from" the cheapest).
        ...(usesMenu ? {} : { priceCents: centsOrThrow(f.get("price")), priceType: f.get("priceType") }),
        currency: String(f.get("currency") || item.currency || "AUD"),
        ...(menuFields ?? {}),
        ...(locality || {}),
        ...(service
          ? { ...serviceSettingsPayload(settings), serviceMode: f.get("serviceMode"), availableOnline: f.get("serviceMode") === "online" }
          : { condition: f.get("condition"), pickupNotes: f.get("pickupNotes"), ...itemOrderingPayload(f) }),
      },
      service ? "Service updated." : "Listing updated.",
    );
  }
  const statCells: [string, number | undefined][] = service
    ? [["Upcoming appointments", stats?.upcomingAppointments], ["Appointments booked", stats?.appointments], ["Enquiries", stats?.enquiries], ["Messages", stats?.messages]]
    : [["Enquiries", stats?.enquiries], ["Messages", stats?.messages]];
  return (
    <div className="event-manage listing-workspace">
      <nav className="account-ticket-breadcrumb listing-breadcrumb" aria-label="Breadcrumb"><Link href="/business?view=listings">Your listings</Link><span aria-hidden="true">›</span><span aria-current="page">{service ? "Manage service" : "Manage item"}</span></nav>
      {/* One summary card: photo, status, title, price and place; View and ⋯ as small buttons. */}
      <header className="listing-summary">
        {item.images?.[0] ? <span className="listing-summary-thumb" style={{ backgroundImage: `url(${JSON.stringify(item.images[0])})` }} aria-hidden="true" /> : null}
        <div className="listing-summary-body">
          <span className={`listing-summary-status is-${status}`}>{status === "active" ? (service ? "Live" : "On sale") : status === "reserved" ? (service ? "Paused" : "Reserved") : status === "sold" ? (service ? "Completed" : "Sold") : status}</span>
          <h1>{item.title}</h1>
          <p>{item.priceCents ? `${money(item.priceCents, item.currency)}${item.priceType === "hourly" ? " / hour" : item.priceType === "from" ? " (from)" : ""}` : item.priceType === "quote" ? "Price on quote" : "Free"} · {[item.suburb, item.state].filter(Boolean).join(", ") || "Online"}</p>
        </div>
        <div className="listing-summary-actions">
          <button type="button" className="listing-icon-button" aria-label="Share and view public page" aria-haspopup="dialog" onClick={() => setShareOpen(true)}>
            <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3v12" /><path d="m7 8 5-5 5 5" /><path d="M5 13v6a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-6" /></svg>
          </button>
            {!service ? <div className="event-more">
            <button type="button" className="event-more-trigger listing-icon-button" aria-haspopup="menu" aria-expanded={menuOpen} aria-label="More listing options" onClick={() => setMenuOpen((value) => !value)}>
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

      {/* The numbers that matter, in one slim row. */}
      <dl className="listing-pulse" aria-busy={!stats || undefined}>
        {statCells.map(([label, value]) => <div key={label}><dd>{value === undefined ? <span className="event-stat-skel tivorah-shimmer" aria-hidden="true" /> : value}</dd><dt>{label}</dt></div>)}
        {stats?.latestEnquiryId ? <Link className="listing-pulse-link" href={`/account/messages/${stats.latestEnquiryId}`}>Open latest enquiry <span aria-hidden="true">→</span></Link> : null}
      </dl>

      <nav className="event-manage-tabs" aria-label={service ? "Manage service" : "Manage item"}>
        {tabsFor(service).map((value) => <button key={value} type="button" aria-pressed={tab === value} onClick={() => setTab(value)}>{value}</button>)}
      </nav>
      {/* Share: everything about where this listing appears, in one sheet instead of a tab and side panels. */}
      <Sheet open={shareOpen} onClose={() => setShareOpen(false)} title="Share" description={`tivorah.com${publicPath}`}
        footer={<button type="button" className="product-primary press-fx listing-share-save" disabled={mutation.busy} onClick={() => { formRef.current?.requestSubmit(); setShareOpen(false); }}>{mutation.busy ? "Saving…" : "Save Hubs"}</button>}>
        <div className="listing-share-actions">
          <Link className="listing-share-action" href={publicPath}><span aria-hidden="true">↗</span>Open page</Link>
          <button type="button" className="listing-share-action" onClick={() => { void navigator.clipboard?.writeText(`${window.location.origin}${publicPath}`); setCopied(true); }}><span aria-hidden="true">⧉</span>{copied ? "Copied" : "Copy link"}</button>
          {canShare ? <button type="button" className="listing-share-action" onClick={() => { void navigator.share?.({ title: item.title, url: `${window.location.origin}${publicPath}` }).catch(() => undefined); }}><span aria-hidden="true">⇪</span>Share…</button> : null}
        </div>
        <HubShareField required kind={service ? "service" : "listing"} value={hubIds} onChange={setHubIds} disabled={mutation.busy} />
      </Sheet>

      <div className="event-manage-content">
        {tab === "Customers" && service ? <ListingActivity id={item.id} kind="bookings" /> : null}
        {tab === "Enquiries" ? <ListingActivity id={item.id} kind="enquiries" /> : null}
        <div className={`event-details-layout ${tab === "Availability" || tab === "Photos" ? "listing-availability-layout" : ""}`}>
          <form ref={formRef} className="shop-form event-details-form" onSubmit={submit} aria-busy={mutation.busy || uploading} hidden={tab === "Customers" || tab === "Enquiries"}>
            <fieldset disabled={mutation.busy || uploading} className="event-details-fieldset">
              {/* Every tab's fields stay in one form (hidden ones are still saved). */}
              <div hidden={tab !== "Details"} className="listing-tab">
                <section className="shop-step">
                  <h2>Basics</h2>
                  <label>Title<input name="title" defaultValue={item.title} minLength={3} maxLength={160} required /></label>
                  <label>Description<textarea name="description" defaultValue={item.description} minLength={10} maxLength={10000} rows={6} required /></label>
                  <div className="shop-row">
                    <label>Category<SelectField name="category" label="Category" required value={category} onChange={setCategory} placeholder="Choose a category" options={[...new Set([...(service ? categories.services : categories.items), category].filter(Boolean))].map((value) => ({ value, label: value }))} /></label>
                    <label><span className="shop-label">Business name <span className="shop-optional">Optional</span></span><input name="businessName" defaultValue={item.businessName || ""} maxLength={100} /></label>
                  </div>
                </section>
                <section className="shop-step">
                  <h2>{template ? template.menuLabel : "Price"}</h2>
                  {template ? <ServiceMenuEditor template={template} value={menu} onChange={setMenu} disabled={mutation.busy} /> : null}
                  {menuError ? <p className="field-error" role="alert">{menuError}</p> : null}
                  <div className="shop-row">
                    {usesMenu ? null : <label>Price<input name="price" type="number" min={0} max={1000000} step="0.01" defaultValue={item.priceCents / 100} required /></label>}
                    <label>Currency<SelectField name="currency" label="Currency" defaultValue={item.currency || "AUD"} options={["AUD", "NZD", "USD", "CAD", "GBP", "EUR", "SGD"].map(value => ({ value, label: value }))} /></label>
                    {usesMenu ? null : <label>Price basis<SelectField name="priceType" label="Price basis" defaultValue={item.serviceMenu?.length ? "fixed" : item.priceType || "fixed"} options={service ? priceTypeOptions : priceTypeOptions.slice(0, 1)} /></label>}
                  </div>
                </section>
                <section className="shop-step">
                  <h2>{service ? "Where you work" : asksCondition(category) ? "Condition & pickup" : "Pickup & delivery"}</h2>
                  {service ? <label>{template?.modeQuestion ?? "Service location"}<SelectField key={template ? category : "default"} name="serviceMode" label={template?.modeQuestion ?? "Service location"} defaultValue={template && !(String(item.serviceMode) in template.modeLabels) ? Object.keys(template.modeLabels)[0] : item.serviceMode || "at_provider"} options={template ? (Object.entries(template.modeLabels) as [string, string][]).map(([value, label]) => ({ value, label })) : [{ value: "at_provider", label: "At my location" }, { value: "mobile", label: "I travel to customers" }, { value: "online", label: "Online" }, { value: "flexible", label: "In person or online" }]} /></label>
                    : asksCondition(category) ? <label>Condition<SelectField name="condition" label="Condition" defaultValue={item.condition || "new"} options={conditionOptions} /></label> : <input type="hidden" name="condition" value="new" />}
                  <p className="event-current-locality"><span>Location</span><strong>{[item.suburb, item.state, item.postcode].filter(Boolean).join(", ") || "Online"}</strong></p>
                  <details className="shop-more event-change-locality"><summary>Change location</summary><LocalityField required={false} defaultCountry={item.countryCode || "AU"} onChange={setLocality} /></details>
                  {!service ? <label><span className="shop-label">Pickup details <span className="shop-optional">Optional</span></span><textarea name="pickupNotes" maxLength={1000} rows={3} defaultValue={item.pickupNotes || ""} placeholder="When and where buyers can collect it" /></label> : null}
                  {!service ? <ItemOrderingFields key={category} category={category} defaults={item} /> : null}
                </section>
              </div>
              <div hidden={tab !== "Photos"} className="listing-tab">
                <section className="shop-step">
                  <h2>Photos</h2>
                  <p className="shop-hint">The first photo is the one customers see first. Up to five photos, 10 MB each, checked before publishing.</p>
                  <MediaField initialUrls={item.images} context={item.listingType} onChange={setImages} onBusy={setUploading} />
                </section>
                {tab === "Photos" ? <OfferingVideosEditor kind={item.listingType} id={item.id} /> : null}
              </div>
              {service ? <div hidden={tab !== "Availability"} className="listing-tab">
                <section className="shop-step business-create-appointments">
                  <h2>Bookings &amp; availability</h2>
                  <ServiceSettings localityState={locality?.state ?? item.state} localityCountry={locality?.countryCode ?? item.countryCode} value={settings} onChange={setSettings} />
                </section>
              </div> : null}
            </fieldset>
            <BookingSetupNotice issues={mutation.setupIssues} />
      {mutation.error ? <p className="product-error" role="alert">{mutation.error}</p> : null}
            {mutation.notice ? <p className="product-notice" role="status">{mutation.notice}</p> : null}
            {!images.length ? <p className="field-error" role="alert">Add at least one photo before saving.</p> : null}
            <div className="shop-actions">
              <span className="shop-hint">Changes show on your {service ? "service" : "item"} page straight away.</span>
              <span><button className="product-primary press-fx" disabled={mutation.busy || uploading || !images.length}>{mutation.busy ? "Saving…" : uploading ? "Uploading…" : "Save changes"}</button></span>
            </div>
          </form>
          {tab === "Details" ? <aside className="event-glance listing-glance" aria-label="At a glance">
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
              <button type="button" className="product-secondary press-fx" onClick={() => setShareOpen(true)}>Share &amp; Hubs</button>
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
