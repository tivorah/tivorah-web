"use client";
import { BookingSetupNotice, type BookingSetupIssue } from "./booking-setup-notice";
import { LoadingState } from "../ui/loading-state";
import Link from "next/link";
import { ServiceSettings, defaultServiceSettings, serviceTimezoneForState } from "./service-settings";
import { refundPolicyOptions } from "../../lib/refund-policy";
import { FormEvent, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { AccountGate } from "../account/gate";
import { usePrivateResource } from "../../hooks/use-private-resource";
import { ApiError, api } from "../../lib/api/client";
import { creationPayload, CreationKind } from "./create-payload";
import { Locality, LocalityField } from "./locality-field";
import { MediaField } from "./media-field";
import { DateField } from "../ui/date-field";
import { SelectField } from "../ui/select-field";
import { HubShareField } from "./hub-share-field";
import { TicketPackageList, newPackage, packagesPayload, type PackageDraft } from "./events/packages-editor";
import { Sheet } from "../ui/sheet";
import { conditionOptions, priceTypeOptions } from "./select-options";
import categories from "../../lib/discovery-categories.json";
function CreationForm({ kind }: { kind: CreationKind }) {
  const [settings, setSettings] = useState(defaultServiceSettings);
  const [mode, setMode] = useState(kind === "event" ? "venue" : "at_provider");
  const [locality, setLocality] = useState<Locality | null>(null);
  const [images, setImages] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [hubIds, setHubIds] = useState<number[]>([]);
  const [packages, setPackages] = useState<PackageDraft[]>(() => [newPackage({ name: "General admission" })]);
  const [setupIssues, setSetupIssues] = useState<BookingSetupIssue[]>([]);
  const [error, setError] = useState("");
  const [created, setCreated] = useState(false);
  const [accepted, setAccepted] = useState(false);
  const [draft, setDraft] = useState<DraftFields>({ title: "", description: "", category: "", price: "", onlineUrl: "", startsAt: "", endsAt: "" });
  const [prompts, setPrompts] = useState(["", "", ""]);
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
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy || uploading || (!agreed && !accepted)) return;
    setBusy(true);
    setError("");
    setSetupIssues([]);
    try {
      key.current ??= crypto.randomUUID();
      const payload = creationPayload(
        new FormData(event.currentTarget),
        kind,
        locality,
        images,
        key.current,
        kind === "event" ? packagesPayload(packages) : undefined,
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
        body: JSON.stringify({
          ...payload,
          communityIds: hubIds,
          ...(kind === "service" ? { ...settings, availabilityTimezone: settings.availabilityTimezone || serviceTimezoneForState(locality?.state) } : {}),
        }),
      });
      setCreated(true);
    } catch (cause) {
      setSetupIssues(cause instanceof ApiError ? cause.setupIssues : []);
      setError(
        cause instanceof Error
          ? cause.message
          : "Could not save. Please try again.",
      );
    } finally {
      setBusy(false);
    }
  }
  const copy = {
    item: { title: "Sell an item", intro: "Add clear photos, a fair price and where to collect it. Your item appears in your shop and on Tivorah Shop.", noun: "item" },
    service: { title: "Offer a service", intro: "Explain what you do, where you work and how customers book. Your service appears in your shop and on Tivorah Services.", noun: "service" },
    event: { title: "Create an event", intro: "Set the details, place and tickets. Your event is saved as a draft so you can review it before publishing.", noun: "event" },
  }[kind];
  const header = <header className="showcase-editor-head">
    <div>
      <Link className="showcase-editor-back" href="/business">← Your business</Link>
      <h1>{created ? (kind === "event" ? "Your event draft is ready" : "Your listing is live") : copy.title}</h1>
      <p>{created ? (kind === "event" ? "Review it and publish from your business workspace." : "Customers can now find it in your shop and on Tivorah.") : copy.intro}</p>
    </div>
  </header>;
  if (created)
    return <div className={`showcase-page business-create-page create-${kind}`}>
      {header}
      <div className="showcase-actions business-create-done"><span><Link className="product-primary" href="/business">Back to your business</Link></span></div>
    </div>;
  // Live summary: what's filled in so far (drives the preview card and the checklist).
  const checklist = checklistFor(kind, { ...draft, mode, images, locality, packages });
  const doneCount = checklist.filter((item) => item.done).length;
  const allDone = doneCount === checklist.length;
  const priceLabel = kind === "event"
    ? (() => { const prices = packages.map((item) => Number(item.price || 0)); if (!prices.length) return ""; const min = Math.min(...prices); return min ? `From $${min.toFixed(2).replace(/\.00$/, "")}` : prices.every((value) => !value) ? "Free" : "From free"; })()
    : draft.price && Number(draft.price) > 0 ? `$${Number(draft.price).toFixed(2).replace(/\.00$/, "")}` : draft.price === "0" ? "Free" : "";
  const when = draft.startsAt ? new Date(draft.startsAt).toLocaleString("en-AU", { weekday: "short", day: "numeric", month: "short", hour: "numeric", minute: "2-digit" }) : "";
  const where = kind !== "item" && mode === "online" ? "Online" : locality ? `${locality.suburb}, ${locality.state}` : "";
  const jump = (id: string) => {
    const section = document.getElementById(id);
    section?.scrollIntoView({ behavior: "smooth", block: "start" });
    window.setTimeout(() => section?.querySelector<HTMLElement>("input:not([type=hidden]), textarea, button")?.focus({ preventScroll: true }), 350);
  };
  const submitLabel = busy ? "Saving…" : uploading ? "Photos are uploading…" : kind === "event" ? "Create draft" : "Publish listing";
  const submitDisabled = busy || uploading || (!agreed && (!accepted || !terms));
  const promptCount = prompts.filter((item) => item.trim()).length;
  // Phones: the checklist becomes a sticky stage tracker (one step per section).
  const stageLabels: Record<string, string> = { "create-basics": "Basics", "create-media": kind === "event" ? "Cover" : "Photos", "create-place": kind === "item" ? "Pickup" : "Where", "create-when": "When", "create-tickets": "Tickets", "create-price": "Price" };
  const stages = [...new Set(checklist.map((item) => item.section))].map((section) => ({ section, label: stageLabels[section], done: checklist.filter((item) => item.section === section).every((item) => item.done) }));

  return (
    <div className={`showcase-page business-create-page create-${kind}`}>
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
          if (["title", "description", "price", "onlineUrl"].includes(field.name)) setDraft((current) => ({ ...current, [field.name]: field.value }));
        }}>
        <div className="create-main">
          <section id="create-basics" className="showcase-step create-section">
            <h2><span className="create-step-no" aria-hidden="true">1</span>Basics</h2>
            <label>
              {kind === "event" ? "Event name" : kind === "service" ? "Service title" : "Item title"}
              <input name="title" required minLength={3} maxLength={160} placeholder={kind === "event" ? "Give your event a clear name" : kind === "service" ? "What service do you offer?" : "What are you selling?"} />
            </label>
            <label>
              Description
              <textarea name="description" required minLength={10} maxLength={10000} rows={4} placeholder={kind === "event" ? "What can people expect?" : kind === "service" ? "What is included, and how should customers prepare?" : "Condition, size, age and anything buyers should know"} />
            </label>
            {kind === 'event' && <label>Refund policy<SelectField name="refundPolicyPreset" label="Refund policy" placeholder="Choose a refund policy" options={[...refundPolicyOptions]} /><span className="showcase-hint">Buyers can request a refund from their booking while your policy allows it.</span></label>}
            {kind === 'event' && <details className="showcase-more event-visit-fields"><summary>Plan your visit · optional</summary>{(['agePolicy','arrival','accessibility','refundPolicy'] as const).map(key => <label key={key}>{({agePolicy:'Age and ID requirements',arrival:'Arrival, parking and doors',accessibility:'Accessibility',refundPolicy:'Refund details'})[key]}<textarea name={key} rows={3} maxLength={key === 'agePolicy' ? 200 : 1200} /></label>)}<p className="showcase-hint">Refund instructions cannot remove applicable consumer rights.</p>{Array.from({length:3},(_, index) => <div key={index}><label>Question {index + 1}<input name={`faq-question-${index}`} maxLength={200} minLength={3} /></label><label>Answer {index + 1}<textarea name={`faq-answer-${index}`} rows={3} maxLength={1600} minLength={2} /></label></div>)}</details>}

            <div className="showcase-row">
              <label>
                Category
                <SelectField key={kind} name="category" label="Category" required placeholder="Choose a category" requiredMessage="Choose a category." onChange={(value) => setDraft((current) => ({ ...current, category: value }))} options={(kind === "event" ? categories.events : kind === "service" ? categories.services : categories.items).map((category) => ({ value: category, label: category }))} />
              </label>
              {kind === "item" ? <label>
                Condition
                <SelectField name="condition" label="Condition" defaultValue="new" options={conditionOptions} />
              </label> : <label><span className="showcase-label">Display name <span className="showcase-optional">Optional</span></span>
                <input name="businessName" maxLength={100} placeholder="Shown instead of your username" />
              </label>}
            </div>
            {kind === "item" ? <label><span className="showcase-label">Display name <span className="showcase-optional">Optional</span></span><input name="businessName" maxLength={100} placeholder="Shown instead of your username" /></label> : null}
          </section>

          <section id="create-media" className="showcase-step create-section">
            <h2><span className="create-step-no" aria-hidden="true">2</span>{kind === "event" ? "Cover photo" : "Photos"}</h2>
            <p className="showcase-hint">{kind === "event" ? "The first photo is your event cover." : "The first photo is the one customers see first."} Up to five photos, 10 MB each, checked before publishing.</p>
            <MediaField context={kind} onChange={setImages} onBusy={setUploading} />
          </section>

          <section id="create-place" className="showcase-step create-section">
            <h2><span className="create-step-no" aria-hidden="true">3</span>{kind === "event" ? "Where" : kind === "service" ? "Where you work" : "Pickup"}</h2>
            {kind !== "item" ? <div className="create-segmented" role="radiogroup" aria-label={kind === "event" ? "Location type" : "How do you provide this service?"}>
              {(kind === "event"
                ? [{ value: "venue", label: "In person" }, { value: "online", label: "Online" }]
                : [{ value: "at_provider", label: "At my place" }, { value: "mobile", label: "I travel" }, { value: "flexible", label: "Either" }, { value: "online", label: "Online" }]
              ).map((option) => <button key={option.value} type="button" role="radio" aria-checked={mode === option.value} className={mode === option.value ? "is-selected" : ""} onClick={() => setMode(option.value)}>{option.label}</button>)}
              <input type="hidden" name="mode" value={mode} />
            </div> : null}
            {kind === "item" || mode !== "online" ? <LocalityField required onChange={setLocality} /> : null}
            {kind === "service" && (mode === "mobile" || mode === "flexible") ? <label>Travel distance (km)<input name="serviceAreaKm" type="number" min={1} max={500} required placeholder="e.g. 15" /></label> : null}
            {kind === "event" ? (mode === "venue" ? <div className="showcase-row">
              <label><span className="showcase-label">Venue name <span className="showcase-optional">Optional</span></span><input name="venueName" maxLength={160} placeholder="e.g. Adelaide Town Hall" /></label>
              <label><span className="showcase-label">Street address <span className="showcase-optional">Optional</span></span><input name="address" maxLength={300} placeholder="e.g. 128 King William St" /></label>
            </div> : <label>Online joining link<input name="onlineUrl" type="url" placeholder="https://" required /></label>) : null}
            {kind === "item" ? <label><span className="showcase-label">Pickup details <span className="showcase-optional">Optional</span></span><textarea name="pickupNotes" maxLength={1000} rows={2} placeholder="When and where buyers can collect it" /></label> : null}
          </section>

          {kind === "event" ? <>
            <section id="create-when" className="showcase-step create-section">
              <h2><span className="create-step-no" aria-hidden="true">4</span>When</h2>
              <div className="showcase-row">
                <label>Starts<DateField name="startsAt" label="Starts at" kind="datetime" requiredMessage="Choose when the event starts." required onChange={(value) => setDraft((current) => ({ ...current, startsAt: value }))} /></label>
                <label>Ends<DateField name="endsAt" label="Ends at" kind="datetime" requiredMessage="Choose when the event ends." required onChange={(value) => setDraft((current) => ({ ...current, endsAt: value }))} /></label>
              </div>
              <p className="showcase-hint">Times are in your local time.</p>
            </section>
            <section id="create-tickets" className="showcase-step create-section">
              <h2><span className="create-step-no" aria-hidden="true">5</span>Tickets</h2>
              <p className="showcase-hint">Use $0 for free tickets. Paid tickets need <Link href="/business/payouts">payout setup</Link>.</p>
              <TicketPackageList value={packages} onChange={setPackages} />
            </section>
          </> : <section id="create-price" className="showcase-step create-section">
            <h2><span className="create-step-no" aria-hidden="true">4</span>{kind === "service" ? "Price & bookings" : "Price"}</h2>
            <div className="showcase-row">
              <label>Price<input name="price" type="number" min={0} max={1000000} step="0.01" required placeholder="0.00" /></label>
              <label>Currency<SelectField name="currency" label="Currency" defaultValue="AUD" options={["AUD", "NZD", "USD", "CAD", "GBP", "EUR", "SGD"].map(value => ({ value, label: value }))} /></label>
              {kind === "service" ? <label>Pricing<SelectField name="priceType" label="Pricing" defaultValue="fixed" options={priceTypeOptions} /></label> : null}
            </div>
            {kind === "service" ? <>
              <p className="showcase-hint">Customers can discuss custom quotes with you in messages.</p>
              <div className="business-create-appointments"><ServiceSettings localityState={locality?.state} value={settings} onChange={setSettings} /></div>
              <label><span className="showcase-label">Booking notes <span className="showcase-optional">Optional</span></span><textarea name="pickupNotes" maxLength={1000} rows={2} placeholder="Availability, notice or anything customers should know" /></label>
            </> : null}
          </section>}

          <section id="create-extras" className="create-extras" aria-labelledby="create-extras-title">
            <h2 id="create-extras-title">Extras <span className="showcase-optional">Optional</span></h2>
            <div className="create-extras-list">
              <HubShareField kind={kind === "event" ? "event" : "listing"} value={hubIds} onChange={setHubIds} disabled={busy} />
              <div className="create-extra-row">
                <span className="create-extra-icon" aria-hidden="true">💬</span>
                <span className="create-extra-text">
                  <strong>Questions for {kind === "event" ? "attendees" : "customers"}</strong>
                  <small>{promptCount ? `${promptCount} suggested ${promptCount === 1 ? "question" : "questions"}` : "Help people start a useful conversation"}</small>
                </span>
                <button type="button" className="create-extra-action" onClick={() => setPromptsOpen(true)}>{promptCount ? "Edit" : "Add"}</button>
              </div>
              {kind === "event" ? <label className="create-extra-row create-extra-switch">
                <span className="create-extra-icon" aria-hidden="true">👯</span>
                <span className="create-extra-text"><strong>Allow group bookings</strong><small>Show “Book as a group” on your event page</small></span>
                <span className="showcase-switch"><input type="checkbox" role="switch" name="allowGroupBookings" /><span className="showcase-switch-track" aria-hidden="true" /></span>
              </label> : null}
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
              {images[0] ? <PreviewImage src={images[0]} /> : <span aria-hidden="true">{kind === "event" ? "🎟️" : kind === "service" ? "🛠️" : "🛍️"}</span>}
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
        <div className="create-mobile-bar">
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

type DraftFields = { title: string; description: string; category: string; price: string; onlineUrl: string; startsAt: string; endsAt: string };
type ChecklistInput = DraftFields & { mode: string; images: string[]; locality: Locality | null; packages: PackageDraft[] };
// What must be done before this listing can be saved, in the order of the form.
function checklistFor(kind: CreationKind, data: ChecklistInput) {
  const online = kind !== "item" && data.mode === "online";
  const items = [
    { id: "title", section: "create-basics", label: kind === "event" ? "Event name" : "Title", done: data.title.trim().length >= 3 },
    { id: "description", section: "create-basics", label: "Description", done: data.description.trim().length >= 10 },
    { id: "category", section: "create-basics", label: "Category", done: !!data.category },
    { id: "photos", section: "create-media", label: kind === "event" ? "Cover photo" : "Photos", done: data.images.length > 0 },
    { id: "place", section: "create-place", label: kind === "event" ? "Location" : kind === "service" ? "Where you work" : "Pickup suburb", done: online ? (kind === "event" ? /^https:\/\/\S+\.\S+/.test(data.onlineUrl) : true) : !!data.locality },
  ];
  if (kind === "event") items.push(
    { id: "date", section: "create-when", label: "Date and time", done: !!data.startsAt && !!data.endsAt && new Date(data.endsAt) > new Date(data.startsAt) },
    { id: "tickets", section: "create-tickets", label: "Tickets", done: data.packages.length > 0 },
  );
  else items.push({ id: "price", section: "create-price", label: "Price", done: data.price !== "" && Number(data.price) >= 0 });
  return items;
}
export function BusinessCreate() {
  const params = useSearchParams();
  const type = params.get("type");
  const kind: CreationKind = type === "event" || type === "service" ? type : "item";
  return <AccountGate redirectOnSignedOut>{() => <CreationForm key={kind} kind={kind} />}</AccountGate>;
}
