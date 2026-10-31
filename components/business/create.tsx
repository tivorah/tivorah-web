"use client";
import { randomId } from "../../lib/random-id";
import { BookingSetupNotice, type BookingSetupIssue } from "./booking-setup-notice";
import { LoadingState } from "../ui/loading-state";
import Link from "next/link";
import { ServiceSettings, defaultServiceSettings, serviceSettingsPayload, serviceTimezoneForState } from "./service-settings";
import { refundPolicyOptions } from "../../lib/refund-policy";
import { FormEvent, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { AccountGate } from "../account/gate";
import { usePrivateResource } from "../../hooks/use-private-resource";
import { ApiError, api } from "../../lib/api/client";
import { creationPayload, CreationKind } from "./create-payload";
import { Locality, LocalityField } from "./locality-field";
import type { PlaceCountry } from "../../lib/api/places";
import { CoverSlidesField } from "./cover-slides-field";
import { coverUploadOrder, type CoverSlide } from "../../lib/cover-slides";
import { SelectField } from "../ui/select-field";
import { HubShareField } from "./hub-share-field";
import { TicketPackageList, newPackage, packagesPayload, type PackageDraft } from "./events/packages-editor";
import { EventWhenField } from "./events/event-when-field";
import { AU_STATE_NAMES, EventVenueField, type Venue } from "./events/event-venue-field";
import { Sheet } from "../ui/sheet";
import { conditionOptions, priceTypeOptions } from "./select-options";
import { asksCondition, createCopy } from "./listing-kinds";
import type { ShopRecord } from "./shop/types";
import { ServiceMenuEditor, useServiceTemplate } from "./service-menu-editor";
import { hasMenuItems, menuPayload, type ServiceMenuValue } from "../../lib/service-menu";
import categories from "../../lib/discovery-categories.json";
import { ItemOrderingFields } from "./item-ordering-fields";
import { useFeature } from "../discovery/features";
const CURRENCIES = ["AUD", "NZD", "USD", "CAD", "GBP", "EUR", "SGD"];
/** A ticket type with no quantity of its own and no event capacity (as in the app). */
const NO_LIMIT = 1000000;
function CreationForm({ kind }: { kind: CreationKind }) {
  // Admin → Features → Paid tickets off: new ticket types are free only, as in the app.
  const paidTicketsOn = useFeature()("paid_tickets");
  const [settings, setSettings] = useState(defaultServiceSettings);
  const [mode, setMode] = useState(kind === "event" ? "venue" : "at_provider");
  const [locality, setLocality] = useState<Locality | null>(null);
  const [placeCountry, setPlaceCountry] = useState<PlaceCountry | null>(null);
  // Tivorah tickets are sold only where Tivorah payments work (e.g. Australia, set by admins).
  // Elsewhere, people get tickets from the organiser's link, by messaging them, or both.
  const tivorahTicketing = kind !== "event" || mode === "online" || (placeCountry?.payments ?? true);
  const [ticketContact, setTicketContact] = useState<"link" | "message" | "both">("link");
  // The cover: up to four slides, photos and one video (cover-slides-field.tsx), uploaded on submit.
  const [covers, setCovers] = useState<CoverSlide[]>([]);
  const uploadedCovers = useRef(new Map<File, string>());
  const [uploading, setUploading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [hubIds, setHubIds] = useState<number[]>([]);
  const [hubsMissing, setHubsMissing] = useState(false);
  // Tickets, in the app's order: currency, group bookings, free, capacity, then the ticket types
  // (the only ticket list; it starts with General admission and always keeps one).
  const [packages, setPackages] = useState<PackageDraft[]>(() => [newPackage({ name: "General admission", quantity: "", price: "" })]);
  const [currency, setCurrency] = useState("AUD");
  const [allowGroups, setAllowGroups] = useState(false);
  const [free, setFree] = useState(true);
  const isFree = free || !paidTicketsOn;
  const [limitCapacity, setLimitCapacity] = useState(false);
  const [capacityText, setCapacityText] = useState("");
  // Australia: the state or territory first, then the venue search inside it.
  const [auState, setAuState] = useState("");
  const [venue, setVenue] = useState<Venue | null>(null);
  const [setupIssues, setSetupIssues] = useState<BookingSetupIssue[]>([]);
  const [error, setError] = useState("");
  const [created, setCreated] = useState(false);
  const [accepted, setAccepted] = useState(false);
  // Wording follows the seller's shop type (e.g. a food shop's service is "Add your menu").
  const ownShop = usePrivateResource<{ shop: ShopRecord | null }>("/web/business/shop");
  const businessType = ownShop.data?.shop?.published?.businessType ?? ownShop.data?.shop?.draft?.businessType ?? null;
  const [draft, setDraft] = useState<DraftFields>({ title: "", description: "", category: "", price: "", onlineUrl: "", externalTicketUrl: "", startsAt: "", endsAt: "" });
  const [prompts, setPrompts] = useState(["", "", ""]);
  const [menu, setMenu] = useState<ServiceMenuValue>([]);
  // Menu categories (food, hairstyles, packages) ask what's on the list; the rest keep one price.
  const template = useServiceTemplate(kind === "service" ? draft.category : null);
  const usesMenu = !!template && hasMenuItems(menu);
  // A category with its own options (e.g. food: Pickup / I deliver) starts on one of them.
  const [modeTemplate, setModeTemplate] = useState(template);
  if (template !== modeTemplate) {
    setModeTemplate(template);
    if (template && !(mode in template.modeLabels)) setMode(Object.keys(template.modeLabels)[0]);
  }
  const [promptsOpen, setPromptsOpen] = useState(false);
  const [activeStage, setActiveStage] = useState("create-basics");
  // Highlight the step being read: the last section whose top has passed just below the sticky tracker.
  useEffect(() => {
    const sections = Array.from(document.querySelectorAll<HTMLElement>(".create-main > section[id]"));
    if (!sections.length) return;
    let frame = 0;
    const update = () => {
      frame = 0;
      const line = Math.min(180, window.innerHeight * 0.35);
      const current = sections.filter((section) => section.getBoundingClientRect().top <= line).pop() ?? sections[0];
      setActiveStage(current.id);
    };
    const onScroll = () => { if (!frame) frame = requestAnimationFrame(update); };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (frame) cancelAnimationFrame(frame);
    };
  }, [kind, created]);
  const key = useRef<string | null>(null);
  // A ref, not busy: a second click before the re-render would upload and create twice.
  const submitting = useRef(false);
  const {
    data: terms,
    loading: termsLoading,
    error: termsError,
    retry,
  } = usePrivateResource<{ version: string; agreements: { kind: string }[] }>(
    "/user/participant-agreements",
  );
  const agreementKind = kind === "event" ? "organizer" : "service_provider";
  const agreed =
    kind === "item" ||
    terms?.agreements.some((item) => item.kind === agreementKind);
  /** The ticket types for the API (and the capacity, when limited), or a message to show. */
  function ticketSetup() {
    let capacity: number | undefined;
    if (limitCapacity) {
      capacity = Number(capacityText);
      if (!capacityText.trim() || !Number.isInteger(capacity) || capacity < 1 || capacity > NO_LIMIT) throw new Error("Enter the total capacity: how many tickets are available in all.");
    }
    // A ticket type without its own quantity is limited by the event's capacity (or not at all).
    const tickets = packagesPayload(packages, { currency, paidAllowed: !isFree, unlimited: capacity ?? NO_LIMIT });
    if (!isFree && !tickets.some((ticket) => ticket.priceCents > 0)) throw new Error("Give at least one ticket type a price of $0.50 or more, or switch on Free tickets.");
    // The capacity is one pool shared by the ticket types (as in the app and API): none can be bigger.
    if (capacity != null && tickets.some((ticket) => ticket.quantity > capacity!)) throw new Error(`A ticket type can’t have more than ${capacity.toLocaleString("en-AU")} tickets, the event’s capacity.`);
    return { tickets, capacity };
  }
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy || uploading || (!agreed && !accepted)) return;
    if (!hubIds.length) {
      setHubsMissing(true);
      setError(`Choose at least one Hub to share this ${kind === "event" ? "event" : kind === "service" ? "service" : "listing"} with.`);
      document.getElementById("create-hubs")?.scrollIntoView({ behavior: "smooth", block: "start" });
      return;
    }
    if (kind === "event") {
      const fail = (message: string, section: string) => {
        setError(message);
        document.getElementById(section)?.scrollIntoView({ behavior: "smooth", block: "start" });
      };
      if (mode === "venue" && placeCountry?.code === "AU" && !auState) return fail("Choose the state or territory, then search for the venue.", "create-place");
      if (mode === "venue" && placeCountry?.code === "AU" && !venue) return fail("Search for the venue’s address and choose it, or enter it manually.", "create-place");
      if (!draft.startsAt) return fail("Choose the start date and time.", "create-when");
      if (!draft.endsAt) return fail("Choose the end date and time.", "create-when");
      if (tivorahTicketing) {
        try { ticketSetup(); } catch (cause) { return fail(cause instanceof Error ? cause.message : "Check your ticket types.", "create-tickets"); }
      }
    }
    if (submitting.current) return;
    submitting.current = true;
    setBusy(true);
    setError("");
    setSetupIssues([]);
    try {
      key.current ??= randomId();
      const fields = new FormData(event.currentTarget);
      // One photo per slide (a video's first frame on its slide); kept if a later step fails.
      const cover = coverUploadOrder(covers);
      const pending = cover.photos.filter((file) => !uploadedCovers.current.has(file));
      if (pending.length) {
        const body = new FormData();
        body.set("context", kind);
        for (const file of pending) body.append("files", file);
        const result = await api<{ images: { url: string }[] }>("/utility/uploads/images", { method: "POST", body, signal: AbortSignal.timeout(120000) });
        pending.forEach((file, index) => { const url = result.images[index]?.url; if (url) uploadedCovers.current.set(file, url); });
      }
      const images = cover.photos.map((file) => uploadedCovers.current.get(file)).filter((url): url is string => !!url);
      const videoUploadId = cover.videoUpload ? await cover.videoUpload.catch(() => { throw new Error("Your cover video didn’t upload. Remove it, or choose it again."); }) : undefined;
      const tickets = kind === "event" && tivorahTicketing ? ticketSetup() : undefined;
      const payload = creationPayload(
        fields,
        kind,
        locality,
        images,
        key.current,
        tickets?.tickets,
        kind === "event" && !tivorahTicketing ? { contact: ticketContact } : undefined,
        kind === "event" ? { capacity: tickets?.capacity, latitude: venue?.latitude, longitude: venue?.longitude } : undefined,
      );
      if (!agreed) {
        if (!terms)
          throw new Error("Load the participation rules before continuing.");
        await api("/user/participant-agreements", {
          method: "POST",
          body: JSON.stringify({
            kind: agreementKind,
            version: terms.version,
            accepted: true,
          }),
        });
      }
      await api(kind === "event" ? "/events" : "/market/products", {
        method: "POST",
        // The same key on every try of this create (listings also send it in the body), so a
        // retry after a lost response returns the event instead of making a second one.
        headers: { "Idempotency-Key": key.current },
        body: JSON.stringify({
          ...payload,
          communityIds: hubIds,
          ...(videoUploadId ? kind === "event" ? { coverVideoUploadId: videoUploadId, coverVideoPosition: cover.videoPosition } : { coverUploadIds: [videoUploadId], coverVideoPosition: cover.videoPosition } : {}),
          ...(kind === "service" ? { ...serviceSettingsPayload(settings), availabilityTimezone: settings.availabilityTimezone || serviceTimezoneForState(locality?.state, locality?.countryCode ?? placeCountry?.code), ...menuPayload(menu, !!template) } : {}),
        }),
      });
      setCreated(true);
    } catch (cause) {
      // An answer that wasn't a server failure (e.g. finish payment setup): the next try is a new
      // request, so it isn't given the stored answer again.
      if (cause instanceof ApiError && cause.status < 500) key.current = null;
      setSetupIssues(cause instanceof ApiError ? cause.setupIssues : []);
      setError(
        cause instanceof Error
          ? cause.message
          : "Could not save. Please try again.",
      );
    } finally {
      submitting.current = false;
      setBusy(false);
    }
  }
  // What this kind is for, in plain words, so nobody wonders where something goes (listing-kinds.ts).
  const copy = { ...createCopy(kind, businessType), noun: kind };
  const header = <header className="shop-editor-head">
    <div>
      <Link className="shop-editor-back" href="/business">← Your business</Link>
      <h1>{created ? (kind === "event" ? "Your event draft is ready" : "Your listing is live") : copy.title}</h1>
      <p>{created ? (kind === "event" ? "Review it and publish from your business workspace." : "Customers can now find it in your shop and on Tivorah.") : copy.intro}</p>
      {!created && copy.hint ? <p className="create-kind-hint">{copy.hint.text} <Link href={copy.hint.href}>{copy.hint.link}</Link>.</p> : null}
    </div>
  </header>;
  if (created)
    return <div className={`shop-editor-page business-create-page create-${kind}`}>
      {header}
      <div className="shop-actions business-create-done"><span><Link className="product-primary" href="/business">Back to your business</Link></span></div>
    </div>;
  // Live summary: what's filled in so far (drives the preview card and the checklist).
  const ticketsReady = kind === "event" && tivorahTicketing ? (() => { try { ticketSetup(); return true; } catch { return false; } })() : false;
  const checklist = checklistFor(kind, { ...draft, mode, images: covers.map((slide) => slide.id), locality, ticketsReady, ticketContact: tivorahTicketing ? null : ticketContact, menuItems: usesMenu ? menu.filter((item) => item.name.trim() && item.price.trim()).length : null, hubs: hubIds.length });
  const doneCount = checklist.filter((item) => item.done).length;
  const allDone = doneCount === checklist.length;
  const priceLabel = kind === "event"
    ? !tivorahTicketing ? (ticketContact === "message" ? "Message for tickets" : "Tickets via link")
    : isFree ? "Free"
    : (() => { const prices = packages.map((item) => Number(item.price || 0) * (item.kind === "group" ? Number(item.groupSize) || 1 : 1)).filter((value) => Number.isFinite(value) && value > 0); if (!prices.length) return ""; const min = Math.min(...prices); const shown = new Intl.NumberFormat("en-AU", { style: "currency", currency }).format(min).replace(/\.00$/, ""); return packages.length > prices.length ? `From free · ${shown}` : `From ${shown}`; })()
    : usesMenu ? (() => { const prices = menu.map((item) => Number(item.price)).filter((value) => Number.isFinite(value) && value > 0); return prices.length ? `From $${Math.min(...prices).toFixed(2).replace(/\.00$/, "")}` : ""; })()
    : draft.price && Number(draft.price) > 0 ? `$${Number(draft.price).toFixed(2).replace(/\.00$/, "")}` : draft.price === "0" ? "Free" : "";
  const when = draft.startsAt ? new Date(draft.startsAt).toLocaleString("en-AU", { weekday: "short", day: "numeric", month: "short", hour: "numeric", minute: "2-digit" }) : "";
  const where = kind !== "item" && mode === "online" ? "Online" : locality ? [locality.suburb, locality.state].filter(Boolean).join(", ") : "";
  const jump = (id: string) => {
    const section = document.getElementById(id);
    section?.scrollIntoView({ behavior: "smooth", block: "start" });
    window.setTimeout(() => section?.querySelector<HTMLElement>("input:not([type=hidden]), textarea, button")?.focus({ preventScroll: true }), 350);
  };
  const submitLabel = busy ? "Saving…" : uploading ? "Reading your video…" : kind === "event" ? "Create draft" : "Publish listing";
  const submitDisabled = busy || uploading || (!agreed && (!accepted || !terms));
  const promptCount = prompts.filter((item) => item.trim()).length;
  // Phones: the checklist becomes a sticky stage tracker (one step per section).
  const stageLabels: Record<string, string> = { "create-hubs": "Hubs", "create-basics": "Basics", "create-media": kind === "event" ? "Cover" : "Photos", "create-place": kind === "item" ? "Pickup" : "Where", "create-when": "When", "create-tickets": "Tickets", "create-price": "Price" };
  const stages = [...new Set(checklist.map((item) => item.section))].map((section) => ({ section, label: stageLabels[section], done: checklist.filter((item) => item.section === section).every((item) => item.done) }));

  return (
    <div className={`shop-editor-page business-create-page create-${kind}`}>
      {header}
      <nav className="create-stages" aria-label="Steps">
        <ol>{stages.map((stage, index) => <li key={stage.section} className={`${stage.done ? "is-done" : ""}${activeStage === stage.section ? " is-active" : ""}`}>
          <button type="button" onClick={() => jump(stage.section)} aria-current={activeStage === stage.section ? "step" : undefined}>
            <span className="create-stage-dot" aria-hidden="true">{stage.done ? "✓" : index + 1}</span>
            <span>{stage.label}</span>
            <span className="sr-only">{stage.done ? "(done)" : "(to do)"}</span>
          </button>
        </li>)}</ol>
      </nav>
      <form className="create-shell" onSubmit={submit} aria-busy={busy || uploading}
        onInput={(event) => {
          const field = event.target as HTMLInputElement;
          if (["title", "description", "price", "onlineUrl", "externalTicketUrl"].includes(field.name)) setDraft((current) => ({ ...current, [field.name]: field.value }));
        }}>
        <div className="create-main">
          {/* Listings, services and events reach people through Hubs (the Shop tab is out of the
              bottom nav), so choosing at least one comes first. The API enforces it too. */}
          <section id="create-hubs" className="shop-step create-section">
            <h2><span className="create-step-no" aria-hidden="true">1</span>Hubs</h2>
            <HubShareField required quickPick={kind === "event"} invalid={hubsMissing} kind={kind === "event" ? "event" : kind === "service" ? "service" : "listing"} value={hubIds} onChange={(ids) => { setHubIds(ids); if (ids.length) setHubsMissing(false); }} disabled={busy} />
          </section>
          <section id="create-basics" className="shop-step create-section">
            <h2><span className="create-step-no" aria-hidden="true">2</span>Basics</h2>
            <label>
              {kind === "event" ? "Event name" : kind === "service" ? "Service title" : "Item title"}
              <input name="title" required minLength={3} maxLength={160} placeholder={kind === "event" ? "Give your event a clear name" : kind === "service" ? "What service do you offer?" : "What are you selling?"} />
            </label>
            <label>
              {kind === "event" ? "About the event (optional)" : "Description"}
              <textarea name="description" required={kind !== "event"} minLength={kind === "event" ? undefined : 10} maxLength={10000} rows={4} placeholder={kind === "event" ? "What can people expect?" : kind === "service" ? "What is included, and how should customers prepare?" : "Condition, size, age and anything buyers should know"} />
            </label>
            {kind === 'event' && <label>Refund policy<SelectField name="refundPolicyPreset" label="Refund policy" placeholder="Choose a refund policy" options={[...refundPolicyOptions]} /><span className="shop-hint">Buyers can request a refund from their booking while your policy allows it.</span></label>}
            {kind === 'event' && <details className="shop-more event-visit-fields"><summary>Plan your visit · optional</summary>{(['agePolicy','arrival','accessibility','refundPolicy'] as const).map(key => <label key={key}>{({agePolicy:'Age and ID requirements',arrival:'Arrival, parking and doors',accessibility:'Accessibility',refundPolicy:'Refund details'})[key]}<textarea name={key} rows={3} maxLength={key === 'agePolicy' ? 200 : 1200} /></label>)}<p className="shop-hint">Refund instructions cannot remove applicable consumer rights.</p>{Array.from({length:3},(_, index) => <div key={index}><label>Question {index + 1}<input name={`faq-question-${index}`} maxLength={200} minLength={3} /></label><label>Answer {index + 1}<textarea name={`faq-answer-${index}`} rows={3} maxLength={1600} minLength={2} /></label></div>)}</details>}

            <div className="shop-row">
              <label>
                Category
                <SelectField key={kind} name="category" label="Category" required placeholder="Choose a category" requiredMessage="Choose a category." onChange={(value) => setDraft((current) => ({ ...current, category: value }))} options={(kind === "event" ? categories.events : kind === "service" ? categories.services : categories.items).map((category) => ({ value: category, label: category }))} />
              </label>
              {kind === "item" && asksCondition(draft.category) ? <label>
                Condition
                <SelectField name="condition" label="Condition" defaultValue="new" options={conditionOptions} />
              </label> : kind === "item" ? <input type="hidden" name="condition" value="new" /> : <label><span className="shop-label">Display name <span className="shop-optional">Optional</span></span>
                <input name="businessName" maxLength={100} placeholder="Shown instead of your username" />
              </label>}
            </div>
            {kind === "item" ? <label><span className="shop-label">Display name <span className="shop-optional">Optional</span></span><input name="businessName" maxLength={100} placeholder="Shown instead of your username" /></label> : null}
          </section>

          <section id="create-media" className="shop-step create-section">
            <h2><span className="create-step-no" aria-hidden="true">3</span>{kind === "event" ? "Cover" : "Photos"}</h2>
            <p className="shop-hint">Add up to 4 photos and one video of up to 30 seconds.</p>
            <CoverSlidesField id="create-cover" purpose={kind === "event" ? "event-cover" : "listing"} slides={covers} onChange={setCovers} onBusy={setUploading} compact />
          </section>

          <section id="create-place" className="shop-step create-section">
            <h2><span className="create-step-no" aria-hidden="true">4</span>{kind === "event" ? "Where" : kind === "service" ? "Where you work" : "Pickup & delivery"}</h2>
            {template ? <p className="create-question">{template.modeQuestion}</p> : null}
            {kind !== "item" ? <div className="create-segmented" role="radiogroup" aria-label={kind === "event" ? "Location type" : template?.modeQuestion ?? "How do you provide this service?"}>
              {(kind === "event"
                ? [{ value: "venue", label: "In person" }, { value: "online", label: "Online" }]
                : template
                  ? (Object.entries(template.modeLabels) as [string, string][]).map(([value, label]) => ({ value, label }))
                  : [{ value: "at_provider", label: "At my place" }, { value: "mobile", label: "I travel" }, { value: "flexible", label: "Either" }, { value: "online", label: "Online" }]
              ).map((option) => <button key={option.value} type="button" role="radio" aria-checked={mode === option.value} className={mode === option.value ? "is-selected" : ""} onClick={() => setMode(option.value)}>{option.label}</button>)}
              <input type="hidden" name="mode" value={mode} />
            </div> : null}
            {kind === "item" || mode !== "online" ? <LocalityField required onChange={setLocality}
              onCountryChange={(country) => { setPlaceCountry(country); if (country.code !== "AU") { setAuState(""); setVenue(null); } }}
              australia={kind === "event" ? <div className="event-place-au">
                <label>State or territory
                  <SelectField label="State or territory" value={auState} placeholder="Choose first, then search the venue" disabled={busy}
                    options={Object.entries(AU_STATE_NAMES).map(([code, name]) => ({ value: code, label: name }))}
                    onChange={(code) => {
                      // A venue in another state no longer fits: search again in this one.
                      if (venue && venue.locality.state !== code) { setVenue(null); setLocality(null); }
                      setAuState(code);
                    }} />
                </label>
                {auState ? <EventVenueField key={auState} state={auState} value={venue} disabled={busy} onChange={(next) => { setVenue(next); setLocality(next?.locality ?? null); }} />
                  : <p className="shop-hint">Choose the state or territory first, then search for the venue.</p>}
              </div> : undefined} /> : null}
            {kind === "service" && (mode === "mobile" || mode === "flexible") ? <label>Travel distance (km)<input name="serviceAreaKm" type="number" min={1} max={500} required placeholder="e.g. 15" /></label> : null}
            {kind === "event" ? (mode === "venue" ? placeCountry?.code === "AU" ? <>
              <label><span className="shop-label">Venue name <span className="shop-optional">Optional</span></span><input name="venueName" maxLength={160} placeholder="e.g. Adelaide Town Hall" /></label>
              <input type="hidden" name="address" value={venue?.address ?? ""} />
            </> : <div className="shop-row">
              <label><span className="shop-label">Venue name <span className="shop-optional">Optional</span></span><input name="venueName" maxLength={160} placeholder="e.g. Adelaide Town Hall" /></label>
              <label><span className="shop-label">Street address <span className="shop-optional">Optional</span></span><input name="address" maxLength={300} placeholder="e.g. 128 King William St" /></label>
            </div> : <label>Online joining link<input name="onlineUrl" type="url" placeholder="https://" required /></label>) : null}
            {kind === "item" ? <label><span className="shop-label">Pickup details <span className="shop-optional">Optional</span></span><textarea name="pickupNotes" maxLength={1000} rows={2} placeholder="When and where buyers can collect it" /></label> : null}
            {kind === "item" ? <ItemOrderingFields key={draft.category} category={draft.category} /> : null}
          </section>

          {kind === "event" ? <>
            <section id="create-when" className="shop-step create-section">
              <h2><span className="create-step-no" aria-hidden="true">5</span>When</h2>
              <EventWhenField disabled={busy} onChange={({ startsAt, endsAt }) => setDraft((current) => ({ ...current, startsAt, endsAt }))} />
              <p className="shop-hint">Times are in your local time.</p>
            </section>
            <section id="create-tickets" className="shop-step create-section">
              <h2><span className="create-step-no" aria-hidden="true">6</span>Tickets</h2>
              {tivorahTicketing ? <>
                {/* First what shapes the ticket types: their currency and whether one can be a group. */}
                <div className="create-extras-list create-ticket-options">
                  <div className="create-extra-row">
                    <span className="create-extra-text"><strong>Currency</strong><small>Used for every ticket type</small></span>
                    <span className="create-ticket-currency"><SelectField label="Ticket currency" value={currency} onChange={setCurrency} disabled={busy} options={CURRENCIES.map((value) => ({ value, label: value }))} /></span>
                  </div>
                  <label className="create-extra-row create-extra-switch">
                    <span className="create-extra-text"><strong>Allow group bookings</strong><small>{allowGroups ? "Ticket types can be Group tickets" : "Switch on to add Group tickets"}</small></span>
                    <span className="shop-switch"><input type="checkbox" role="switch" name="allowGroupBookings" checked={allowGroups} disabled={busy}
                      onChange={(event) => {
                        setAllowGroups(event.target.checked);
                        // Off: Group tickets become single tickets again.
                        if (!event.target.checked) setPackages((current) => current.map((item) => item.kind === "group" ? { ...item, kind: "standard" } : item));
                      }} /><span className="shop-switch-track" aria-hidden="true" /></span>
                  </label>
                  <label className="create-extra-row create-extra-switch">
                    <span className="create-extra-text"><strong>Free tickets</strong><small>{paidTicketsOn ? "Switch off for paid entry" : "Paid entry is currently unavailable"}</small></span>
                    <span className="shop-switch"><input type="checkbox" role="switch" checked={isFree} disabled={busy || !paidTicketsOn} onChange={(event) => setFree(event.target.checked)} /><span className="shop-switch-track" aria-hidden="true" /></span>
                  </label>
                  <label className="create-extra-row create-extra-switch">
                    <span className="create-extra-text"><strong>Limit capacity</strong><small>{limitCapacity ? "Bookings stop when full" : "Unlimited by default"}</small></span>
                    <span className="shop-switch"><input type="checkbox" role="switch" checked={limitCapacity} disabled={busy} onChange={(event) => setLimitCapacity(event.target.checked)} /><span className="shop-switch-track" aria-hidden="true" /></span>
                  </label>
                </div>
                {limitCapacity ? <label>Total capacity<input type="number" inputMode="numeric" min={1} max={NO_LIMIT} step={1} required value={capacityText} placeholder="100" onChange={(event) => setCapacityText(event.target.value)} /></label> : null}
                <h3 className="create-subheading">Ticket types</h3>
                <p className="shop-hint">Name each ticket and set its {isFree ? "" : `price (${currency}), `}quantity and limit per person.</p>
                <TicketPackageList value={packages} onChange={setPackages} paidAllowed={!isFree} currency={currency} allowGroups={allowGroups}
                  unlimited={limitCapacity && Number.isInteger(Number(capacityText)) && Number(capacityText) > 0 ? Number(capacityText) : NO_LIMIT} />
                <p className="shop-hint">{isFree ? "Free tickets are issued instantly." : <>Paid tickets need <Link href="/business/payouts">payout setup</Link> before you publish.</>}</p>
              </> : <>
                <p className="create-ticket-region" role="note">Tivorah tickets aren’t available in your region at the moment.</p>
                <p className="create-question">How do people get tickets?</p>
                <div className="create-segmented" role="radiogroup" aria-label="How do people get tickets?">
                  {([["link", "Ticket link"], ["message", "Message me"], ["both", "Both"]] as const).map(([value, label]) => <button key={value} type="button" role="radio" aria-checked={ticketContact === value} className={ticketContact === value ? "is-selected" : ""} onClick={() => setTicketContact(value)}>{label}</button>)}
                </div>
                {ticketContact !== "message" ? <label>Ticket link<input name="externalTicketUrl" type="url" required placeholder="https://" maxLength={2000} /></label> : null}
                <p className="shop-hint">{ticketContact === "link" ? "People open your ticket website from the event page." : ticketContact === "message" ? "People message you on Tivorah; enquiries arrive in your messages." : "People can open your ticket website or message you on Tivorah."}</p>
              </>}
            </section>
          </> : <section id="create-price" className="shop-step create-section">
            <h2><span className="create-step-no" aria-hidden="true">5</span>{kind === "service" ? "Price & bookings" : "Price"}</h2>
            {/* Menu categories: the items carry the prices. Other categories keep a single price. */}
            {template ? <ServiceMenuEditor template={template} value={menu} onChange={setMenu} disabled={busy} /> : null}
            {usesMenu ? <><input type="hidden" name="price" value="0" /><input type="hidden" name="priceType" value="fixed" /></> : null}
            <div className="shop-row">
              {usesMenu ? null : <label>Price<input name="price" type="number" min={0} max={1000000} step="0.01" required placeholder="0.00" /></label>}
              <label>Currency<SelectField name="currency" label="Currency" defaultValue="AUD" options={["AUD", "NZD", "USD", "CAD", "GBP", "EUR", "SGD"].map(value => ({ value, label: value }))} /></label>
              {kind === "service" && !usesMenu ? <label>Pricing<SelectField name="priceType" label="Pricing" defaultValue="fixed" options={priceTypeOptions} /></label> : null}
            </div>
            {kind === "service" ? <>
              <p className="shop-hint">Customers can discuss custom quotes with you in messages.</p>
              <div className="business-create-appointments"><ServiceSettings localityState={locality?.state} localityCountry={locality?.countryCode ?? placeCountry?.code} value={settings} onChange={setSettings} /></div>
              <label><span className="shop-label">Booking notes <span className="shop-optional">Optional</span></span><textarea name="pickupNotes" maxLength={1000} rows={2} placeholder="Availability, notice or anything customers should know" /></label>
            </> : null}
          </section>}

          <section id="create-extras" className="create-extras" aria-labelledby="create-extras-title">
            <h2 id="create-extras-title">Extras <span className="shop-optional">Optional</span></h2>
            <div className="create-extras-list">
              <div className="create-extra-row">
                <span className="create-extra-icon" aria-hidden="true">💬</span>
                <span className="create-extra-text">
                  <strong>Questions for {kind === "event" ? "attendees" : "customers"}</strong>
                  <small>{promptCount ? `${promptCount} suggested ${promptCount === 1 ? "question" : "questions"}` : "Help people start a useful conversation"}</small>
                </span>
                <button type="button" className="create-extra-action" onClick={() => setPromptsOpen(true)}>{promptCount ? "Edit" : "Add"}</button>
              </div>
            </div>
            {prompts.map((value, index) => <input key={index} type="hidden" name={`prompt${index + 1}`} value={value.trim()} />)}
          </section>

          {kind !== "item" && !agreed ? <section className="create-rules-row">
            {termsLoading ? <LoadingState label="Loading participation rules…" variant="compact" /> : termsError ? <>
              <p role="alert">{termsError}</p>
              <button className="product-secondary" type="button" onClick={retry}>Retry rules</button>
            </> : <label className="product-checkbox">
              <input type="checkbox" checked={accepted} onChange={(e) => setAccepted(e.target.checked)} required />
              <span>I accept the <Link href={kind === "event" ? "/hub-organisers" : "/service-providers"} target="_blank">{kind === "event" ? "organiser" : "service provider"} rules</Link>.</span>
            </label>}
          </section> : null}
          {error ? <p className="product-error create-error-mobile" role="alert">{error}</p> : null}
        </div>

        <aside className="create-summary" aria-label="Summary">
          <div className="create-preview">
            <div className="create-preview-media">
              {covers[0] ? <PreviewImage src={covers[0].kind === "photo" ? covers[0].preview : covers[0].framePreview} /> : <span aria-hidden="true">{kind === "event" ? "🎟️" : kind === "service" ? "🛠️" : "🛍️"}</span>}
            </div>
            <div className="create-preview-body">
              <span className="create-preview-kind">{kind === "event" ? "Event" : kind === "service" ? "Service" : "For sale"}{draft.category ? ` · ${draft.category}` : ""}</span>
              <strong>{draft.title.trim() || (kind === "event" ? "Your event name" : kind === "service" ? "Your service" : "Your item")}</strong>
              {kind === "event" ? <span>{when || "Date and time"}</span> : null}
              <span>{where || (kind === "item" ? "Pickup suburb" : "Location")}</span>
              {priceLabel ? <span className="create-preview-price">{priceLabel}</span> : null}
            </div>
          </div>

          <div className="create-progress">
            <div className="create-progress-head">
              <strong>{allDone ? "Ready to go" : `${doneCount} of ${checklist.length} done`}</strong>
              <span className="create-progress-bar" aria-hidden="true"><span style={{ width: `${(doneCount / checklist.length) * 100}%` }} /></span>
            </div>
            <ul className="create-checklist">
              {checklist.map((item) => <li key={item.id} className={item.done ? "is-done" : ""}>
                <button type="button" onClick={() => jump(item.section)}>
                  <span className="create-check" aria-hidden="true">{item.done ? "✓" : ""}</span>
                  <span>{item.label}</span>
                  <span className="sr-only">{item.done ? "(done)" : "(to do)"}</span>
                </button>
              </li>)}
            </ul>
          </div>

          <BookingSetupNotice issues={setupIssues} />
          {error ? <p className="product-error" role="alert">{error}</p> : null}
          <button className="product-primary press-fx create-submit" disabled={submitDisabled}>
            {busy ? <span className="button-progress" aria-hidden="true" /> : null}{submitLabel}
          </button>
          <p className="create-submit-hint">{kind === "event" ? "Saved as a draft — publish when you're ready." : "Goes live in your shop straight away."}</p>
          <Link className="create-cancel" href="/business">Cancel</Link>
        </aside>

        {/* Phones: a slim bar with progress and the one primary action. */}
        <div className="create-mobile-bar" data-sticky-save="">
          <span className="create-mobile-progress"><strong>{doneCount}/{checklist.length}</strong> done</span>
          <button className="product-primary press-fx" disabled={submitDisabled}>{submitLabel}</button>
        </div>
      </form>

      <Sheet open={promptsOpen} onClose={() => setPromptsOpen(false)} title={`Questions for ${kind === "event" ? "attendees" : "customers"}`} description="Suggested questions appear when people message you, so conversations start well."
        footer={<><span /><span className="tv-sheet-foot-actions"><button type="button" className="product-primary press-fx" onClick={() => setPromptsOpen(false)}>Done</button></span></>}>
        <div className="create-prompts-fields">
          {prompts.map((value, index) => <label key={index}>Question {index + 1}
            <input value={value} maxLength={160} placeholder={index === 0 ? (kind === "event" ? "e.g. Is there parking nearby?" : "e.g. Is this still available?") : "Optional"}
              onChange={(e) => setPrompts((current) => current.map((item, i) => i === index ? e.target.value : item))} />
          </label>)}
        </div>
      </Sheet>
    </div>
  );
}

function PreviewImage({ src }: { src: string }) {
  // Uploaded photos come from varied hosts, so next/image is not used here.
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={src} alt="" />;
}

type DraftFields = { title: string; description: string; category: string; price: string; onlineUrl: string; externalTicketUrl: string; startsAt: string; endsAt: string };
type ChecklistInput = DraftFields & { mode: string; images: string[]; locality: Locality | null; ticketsReady: boolean; ticketContact: "link" | "message" | "both" | null; menuItems: number | null; hubs: number };
// What must be done before this listing can be saved, in the order of the form.
function checklistFor(kind: CreationKind, data: ChecklistInput) {
  const online = kind !== "item" && data.mode === "online";
  const items = [
    { id: "hubs", section: "create-hubs", label: "Hubs", done: data.hubs > 0 },
    { id: "title", section: "create-basics", label: kind === "event" ? "Event name" : "Title", done: data.title.trim().length >= 3 },
    // An event's description is optional.
    ...(kind === "event" ? [] : [{ id: "description", section: "create-basics", label: "Description", done: data.description.trim().length >= 10 }]),
    { id: "category", section: "create-basics", label: "Category", done: !!data.category },
    { id: "photos", section: "create-media", label: kind === "event" ? "Cover photo" : "Photos", done: data.images.length > 0 },
    { id: "place", section: "create-place", label: kind === "event" ? "Location" : kind === "service" ? "Where you work" : "Pickup suburb", done: online ? (kind === "event" ? /^https:\/\/\S+\.\S+/.test(data.onlineUrl) : true) : !!data.locality },
  ];
  if (kind === "event") items.push(
    { id: "date", section: "create-when", label: "Date and time", done: !!data.startsAt && !!data.endsAt && new Date(data.endsAt) > new Date(data.startsAt) },
    { id: "tickets", section: "create-tickets", label: "Tickets", done: data.ticketContact ? data.ticketContact === "message" || /^https:\/\/\S+\.\S+/.test(data.externalTicketUrl) : data.ticketsReady },
  );
  else items.push(data.menuItems !== null
    ? { id: "price", section: "create-price", label: "Menu items", done: data.menuItems > 0 }
    : { id: "price", section: "create-price", label: "Price", done: data.price !== "" && Number(data.price) >= 0 });
  return items;
}
export function BusinessCreate() {
  const params = useSearchParams();
  const type = params.get("type");
  const kind: CreationKind = type === "event" || type === "service" ? type : "item";
  return <AccountGate redirectOnSignedOut>{() => <CreationForm key={kind} kind={kind} />}</AccountGate>;
}
