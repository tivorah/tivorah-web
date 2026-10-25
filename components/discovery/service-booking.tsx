"use client";
import { randomId } from "../../lib/random-id";
import { LoadingState } from "../ui/loading-state";

import Link from "next/link";
import { FormEvent, useEffect, useRef, useState } from "react";
import "./service-highlights.css";
import { useAccount } from "../../hooks/use-account";
import { usePrivateResource } from "../../hooks/use-private-resource";
import { api } from "../../lib/api/client";
import { money } from "../../lib/api/discovery";
import { SelectField } from "../ui/select-field";
import { menuSubtotal, type ServiceMenuItem, type ServiceTemplate } from "../../lib/service-menu";

type Availability = {
  slots: { startsAt: string; endsAt: string }[];
  timezone: string;
  currency?: string;
  paymentRequired: boolean;
  /** When the provider takes payment; with "customer_choice" the customer picks below. */
  paymentTiming?: "upfront" | "after_service" | "customer_choice";
  paymentAvailable: boolean;
  bookingApproval?: "instant" | "request";
  priceType?: string;
  requiresAddress?: boolean;
  acceptsAddress?: boolean;
  refundPolicyLabel?: string;
  /** The category's wording (menu categories only), and the priced items customers pick from. */
  template?: ServiceTemplate | null;
  menu?: ServiceMenuItem[];
  /** Health and care services ask the customer to agree to share health details. */
  healthConsentRequired?: boolean;
  quote: {
    subtotalCents: number;
    buyerTotalCents: number;
    platformFeeCents: number;
    chargedTo: string;
  };
};

const AU_TIMEZONES = [
  ["Australia/Perth", "Perth"], ["Australia/Darwin", "Darwin"],
  ["Australia/Adelaide", "Adelaide"], ["Australia/Brisbane", "Brisbane"],
  ["Australia/Sydney", "Sydney"], ["Australia/Melbourne", "Melbourne"],
  ["Australia/Hobart", "Hobart"], ["Australia/Lord_Howe", "Lord Howe Island"],
] as const;

function dateKey(value: Date, timeZone: string) {
  const parts = new Intl.DateTimeFormat("en-AU", { timeZone, year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(value);
  const part = (type: string) => parts.find((item) => item.type === type)?.value ?? "";
  return `${part("year")}-${part("month")}-${part("day")}`;
}

function monthKey(key: string) { return key.slice(0, 7); }
function shiftMonth(key: string, amount: number) {
  const [year, month] = key.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1 + amount, 1)).toISOString().slice(0, 7);
}

export function CalendarPicker({ slots, timeZone, selectedDate, selected, onSelectDate, onSelect }: { slots: Availability["slots"]; timeZone: string; selectedDate: string; selected: string; onSelectDate: (value: string) => void; onSelect: (value: string) => void }) {
  const byDate = new Map<string, Availability["slots"]>();
  for (const slot of slots) {
    const key = dateKey(new Date(slot.startsAt), timeZone);
    byDate.set(key, [...(byDate.get(key) ?? []), slot]);
  }
  const first = [...byDate.keys()].sort()[0];
  const last = [...byDate.keys()].sort().at(-1);
  const [month, setMonth] = useState(() => monthKey(first));
  const activeMonth = month < monthKey(first) ? monthKey(first) : month > monthKey(last!) ? monthKey(last!) : month;
  const activeDate = selectedDate && byDate.has(selectedDate) ? selectedDate : "";
  const [year, monthNumber] = activeMonth.split("-").map(Number);
  const firstWeekday = (new Date(Date.UTC(year, monthNumber - 1, 1)).getUTCDay() + 6) % 7;
  const days = new Date(Date.UTC(year, monthNumber, 0)).getUTCDate();
  const monthLabel = new Intl.DateTimeFormat("en-AU", { month: "long", year: "numeric", timeZone: "UTC" }).format(new Date(Date.UTC(year, monthNumber - 1, 1)));
  const times = activeDate ? byDate.get(activeDate) ?? [] : [];
  return <div className="appointment-picker">
    <div className="appointment-month-nav">
      <h3>{monthLabel}</h3>
      <div><button type="button" aria-label="Previous month" disabled={activeMonth <= monthKey(first)} onClick={() => setMonth(shiftMonth(activeMonth, -1))}>‹</button><button type="button" aria-label="Next month" disabled={activeMonth >= monthKey(last!)} onClick={() => setMonth(shiftMonth(activeMonth, 1))}>›</button></div>
    </div>
    <div className="appointment-calendar" role="group" aria-label={`Available dates in ${monthLabel}`}>
      {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day) => <span className="appointment-weekday" key={day}>{day}</span>)}
      {Array.from({ length: firstWeekday }, (_, index) => <span key={`gap-${index}`} />)}
      {Array.from({ length: days }, (_, index) => {
        const key = `${activeMonth}-${String(index + 1).padStart(2, "0")}`;
        const count = byDate.get(key)?.length ?? 0;
        return <button key={key} type="button" className={key === activeDate ? "selected" : ""} disabled={!count} aria-pressed={key === activeDate} aria-label={`${new Intl.DateTimeFormat("en-AU", { dateStyle: "full", timeZone: "UTC" }).format(new Date(`${key}T12:00:00Z`))}${count ? `, ${count} available ${count === 1 ? "time" : "times"}` : ", unavailable"}`} onClick={() => onSelectDate(key)}><span>{index + 1}</span>{count ? <i aria-hidden="true" /> : null}</button>;
      })}
    </div>
    <div className="appointment-times" aria-live="polite">
      <h3>{activeDate ? new Intl.DateTimeFormat("en-AU", { weekday: "long", day: "numeric", month: "long", timeZone }).format(new Date(times[0].startsAt)) : "Choose an available day"}</h3>
      {activeDate ? <div className="appointment-time-grid">{times.map((item) => <button type="button" key={item.startsAt} className={selected === item.startsAt ? "selected" : ""} aria-pressed={selected === item.startsAt} onClick={() => onSelect(item.startsAt)}>{new Intl.DateTimeFormat("en-AU", { timeStyle: "short", timeZone }).format(new Date(item.startsAt))}</button>)}</div> : <p>Days with a dot have available appointments.</p>}
    </div>
  </div>;
}

export type ServiceAddress = { line1: string; suburb: string; state: string; postcode: string; notes?: string };
export const emptyAddress: ServiceAddress = { line1: "", suburb: "", state: "", postcode: "", notes: "" };
const STATES = ["ACT", "NSW", "NT", "QLD", "SA", "TAS", "VIC", "WA"];
export const addressComplete = (address: ServiceAddress) => address.line1.trim().length >= 3 && address.suburb.trim().length >= 2 && STATES.includes(address.state) && /^\d{4}$/.test(address.postcode.trim());
const addressBlank = (address: ServiceAddress) => !address.line1.trim() && !address.suburb.trim() && !address.state && !address.postcode.trim();
export const addressPayload = (address: ServiceAddress) => ({ line1: address.line1.trim(), suburb: address.suburb.trim(), state: address.state, postcode: address.postcode.trim(), ...(address.notes?.trim() ? { notes: address.notes.trim() } : {}) });

/** Where a mobile service happens. Shared with the quote request and quote acceptance forms. */
export function AddressFields({ value, onChange, required, disabled, idPrefix, legend }: { value: ServiceAddress; onChange: (next: ServiceAddress) => void; required: boolean; disabled?: boolean; idPrefix: string; legend?: string }) {
  const set = (patch: Partial<ServiceAddress>) => onChange({ ...value, ...patch });
  return <fieldset className="service-address" disabled={disabled}>
    <legend>{legend ? (required ? legend : `${legend} (optional)`) : required ? "Where should they come?" : "Your address (optional)"}</legend>
    <p className="service-section-note">Only shared with the provider for this booking.</p>
    <label htmlFor={`${idPrefix}-line1`}>Street address<input id={`${idPrefix}-line1`} autoComplete="address-line1" value={value.line1} maxLength={160} required={required} onChange={(event) => set({ line1: event.target.value })} /></label>
    <div className="service-address-row">
      <label htmlFor={`${idPrefix}-suburb`}>Suburb<input id={`${idPrefix}-suburb`} autoComplete="address-level2" value={value.suburb} maxLength={80} required={required} onChange={(event) => set({ suburb: event.target.value })} /></label>
      <label htmlFor={`${idPrefix}-state`}>State<SelectField id={`${idPrefix}-state`} label="State" value={value.state} disabled={disabled} onChange={(state) => set({ state })} options={[{ value: "", label: "Choose" }, ...STATES.map((state) => ({ value: state, label: state }))]} /></label>
      <label htmlFor={`${idPrefix}-postcode`}>Postcode<input id={`${idPrefix}-postcode`} autoComplete="postal-code" inputMode="numeric" pattern="[0-9]{4}" value={value.postcode} maxLength={4} required={required} onChange={(event) => set({ postcode: event.target.value.replace(/\D/g, "") })} /></label>
    </div>
    <label htmlFor={`${idPrefix}-notes`}>Access notes (optional)<input id={`${idPrefix}-notes`} value={value.notes ?? ""} maxLength={300} placeholder="Gate code, parking, unit buzzer" onChange={(event) => set({ notes: event.target.value })} /></label>
  </fieldset>;
}

/** Times for an existing booking or quote, from the provider-wide calendar (signed in only). */
export function SlotPicker({ productId, excludeBookingId, lengthMinutes, selected, onSelect, disabled }: { productId: number; excludeBookingId?: number; lengthMinutes?: number | null; selected: string; onSelect: (value: string) => void; disabled?: boolean }) {
  const params = new URLSearchParams({ days: "45" });
  if (excludeBookingId) params.set("excludeBookingId", String(excludeBookingId));
  if (lengthMinutes) params.set("lengthMinutes", String(lengthMinutes));
  const { data, loading, error, retry } = usePrivateResource<{ slots: Availability["slots"]; timezone: string | null }>(`/market/products/${productId}/slots?${params}`);
  const [selectedDate, setSelectedDate] = useState("");
  const timeZone = data?.timezone || "Australia/Sydney";
  if (loading && !data) return <LoadingState label="Loading available times…" variant="compact" />;
  if (error) return <div role="alert"><p>{error}</p><button type="button" className="product-secondary" onClick={retry}>Retry</button></div>;
  if (!data?.slots.length) return <p>No times are free in the next 45 days. Message the provider to arrange one.</p>;
  return <fieldset disabled={disabled} className="appointment-picker-fieldset"><legend className="product-sr-only">Available dates and times</legend><p className="service-section-note">Times shown in {timeZone.replaceAll("_", " ")}</p><CalendarPicker slots={data.slots} timeZone={timeZone} selectedDate={selectedDate} selected={selected} onSelectDate={(date) => { setSelectedDate(date); onSelect(""); }} onSelect={onSelect} /></fieldset>;
}

function QuoteRequestForm({ id, data }: { id: number; data: Availability }) {
  const [message, setMessage] = useState("");
  const [preferredTimes, setPreferredTimes] = useState("");
  const [address, setAddress] = useState(emptyAddress);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");
  const [sent, setSent] = useState(false);
  const [healthConsent, setHealthConsent] = useState(false);
  const needsAddress = !!data.requiresAddress;
  const addressOk = needsAddress ? addressComplete(address) : addressBlank(address) || addressComplete(address);
  const ready = message.trim().length >= 10 && addressOk && (!data.healthConsentRequired || healthConsent);
  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!ready || busy) return;
    setBusy(true); setNotice("");
    try {
      await api(`/market/products/${id}/quotes`, { method: "POST", body: JSON.stringify({ message: message.trim(), preferredTimes: preferredTimes.trim() || undefined, address: addressBlank(address) ? undefined : addressPayload(address), ...(data.healthConsentRequired ? { healthConsent } : {}) }) });
      setSent(true);
    } catch (cause) { setNotice(cause instanceof Error ? cause.message : "Could not send your request. Please try again."); }
    finally { setBusy(false); }
  }
  if (sent) return <div className="service-booking-done" role="status"><h3>Quote requested</h3><p>The provider will reply with a price and how long the job takes. We’ll email you, and you can accept it and choose a time from your appointments.</p><Link className="product-primary" href="/account/bookings?tab=quotes">View your quotes</Link></div>;
  return <form onSubmit={submit} className="service-quote-form">
    <p>This service is priced on quote. Describe the job and the provider will send you a price. Nothing is charged until you accept a quote and book a time.</p>
    <label htmlFor="quote-message">What do you need?<textarea id="quote-message" rows={5} maxLength={2000} required value={message} disabled={busy} onChange={(event) => setMessage(event.target.value)} placeholder="Size of the job, what’s included, photos you can share later, any deadlines" /></label>
    {message.trim().length > 0 && message.trim().length < 10 ? <p className="service-section-note">Add a little more detail (at least 10 characters).</p> : null}
    <label htmlFor="quote-times">Preferred days or times (optional)<input id="quote-times" maxLength={300} value={preferredTimes} disabled={busy} onChange={(event) => setPreferredTimes(event.target.value)} placeholder="e.g. weekday mornings, after 15 March" /></label>
    {data.requiresAddress || data.acceptsAddress ? <AddressFields idPrefix="quote-address" value={address} onChange={setAddress} required={needsAddress} disabled={busy} /> : null}
    {data.healthConsentRequired ? <HealthConsent checked={healthConsent} onChange={setHealthConsent} disabled={busy} kind="request" /> : null}
    <button className="product-primary" disabled={!ready || busy}>{busy ? "Sending…" : "Request a quote"}</button>
    {notice ? <p className="product-error" role="alert">{notice}</p> : null}
  </form>;
}

function AppointmentForm({ id, accountId }: { id: number; accountId: number }) {
  const { data, loading, error, retry } = usePrivateResource<Availability>(
    `/web/account/services/${id}/availability`,
  );
  const [selected, setSelected] = useState("");
  const [selectedDate, setSelectedDate] = useState("");
  const [timeZone, setTimeZone] = useState(() => Intl.DateTimeFormat().resolvedOptions().timeZone || "Australia/Sydney");
  const [note, setNote] = useState("");
  const [noteOpen, setNoteOpen] = useState(false);
  const [zoneOpen, setZoneOpen] = useState(false);
  const [picks, setPicks] = useState<Record<string, number>>({});
  const [healthConsent, setHealthConsent] = useState(false);
  const [address, setAddress] = useState(emptyAddress);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");
  const lock = useRef(false);
  const request = useRef<{ fingerprint: string; key: string } | null>(null);
  const slot = data?.slots.find((item) => item.startsAt === selected);
  const isRequest = data?.bookingApproval === "request";
  const [payChoice, setPayChoice] = useState<"upfront" | "after_service">("upfront");
  const timingSetting = data?.paymentRequired ? data.paymentTiming ?? "upfront" : "upfront";
  const paymentTiming: "upfront" | "after_service" = timingSetting === "customer_choice" ? payChoice : timingSetting === "after_service" ? "after_service" : "upfront";
  const showAddress = !!(data?.requiresAddress || data?.acceptsAddress);
  const menu = data?.menu ?? [];
  const selections = menu.filter((item) => (picks[item.id] ?? 0) > 0).map((item) => ({ itemId: item.id, quantity: picks[item.id] }));
  const picked = selections.length > 0;
  const pickKey = JSON.stringify(selections);
  // With a menu, the server prices the picks (fees included); before it answers, show the subtotal.
  const [menuQuote, setMenuQuote] = useState<{ key: string; quote: Availability["quote"] } | null>(null);
  useEffect(() => {
    if (!menu.length || !picked) return;
    const timer = window.setTimeout(() => {
      void api<{ quote: Availability["quote"] }>(`/market/products/${id}/booking-quote`, { method: "POST", body: JSON.stringify({ selections: JSON.parse(pickKey) }) })
        .then((result) => setMenuQuote({ key: pickKey, quote: result.quote }))
        .catch(() => undefined);
    }, 250);
    return () => window.clearTimeout(timer);
  }, [id, menu.length, picked, pickKey]);
  const quote = menu.length
    ? (menuQuote?.key === pickKey ? menuQuote.quote : null) ?? { subtotalCents: menuSubtotal(menu, picks), buyerTotalCents: menuSubtotal(menu, picks), platformFeeCents: 0, chargedTo: "provider" }
    : data?.quote;
  const paysNow = !!data?.paymentRequired && paymentTiming === "upfront" && (quote?.buyerTotalCents ?? 0) > 0;
  const addressOk = data?.requiresAddress ? addressComplete(address) : addressBlank(address) || addressComplete(address);

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!slot || !data || error || !data.paymentAvailable || !addressOk || (menu.length && !picked) || (data.healthConsentRequired && !healthConsent) || lock.current) return;
    lock.current = true;
    setBusy(true);
    setNotice("");
    const sendAddress = showAddress && !addressBlank(address) ? addressPayload(address) : undefined;
    const fingerprint = `${accountId}:${id}:${slot.startsAt}:${note.trim()}:${JSON.stringify(sendAddress ?? null)}:${paymentTiming}:${pickKey}`;
    const storageKey = `tivorah-service-booking:${accountId}:${id}`;
    try {
      if (request.current?.fingerprint !== fingerprint) {
        let saved: typeof request.current = null;
        try {
          saved = JSON.parse(sessionStorage.getItem(storageKey) || "null");
        } catch {
          /* Storage is optional. */
        }
        request.current =
          saved?.fingerprint === fingerprint
            ? saved
            : { fingerprint, key: randomId() };
        try {
          sessionStorage.setItem(storageKey, JSON.stringify(request.current));
        } catch {
          /* Retry key remains in memory. */
        }
      }
      const result = await api<{
        booking: { id: number; status: string };
        checkoutUrl: string | null;
      }>(`/market/products/${id}/bookings`, {
        method: "POST",
        body: JSON.stringify({
          startsAt: slot.startsAt,
          note: note.trim() || undefined,
          address: sendAddress,
          idempotencyKey: request.current!.key,
          checkoutPlatform: "web",
          // Counts only where the provider lets the customer choose; the API decides otherwise.
          ...(data.paymentRequired ? { paymentTiming } : {}),
          ...(menu.length ? { selections } : {}),
          ...(data.healthConsentRequired ? { healthConsent } : {}),
        }),
      });
      if (result.checkoutUrl) {
        const target = new URL(result.checkoutUrl);
        if (
          target.protocol !== "https:" ||
          target.hostname !== "checkout.stripe.com"
        )
          throw new Error("The payment link could not be verified.");
        window.location.assign(target.href);
      } else {
        if (result.booking.status !== "pending_payment") {
          try {
            sessionStorage.removeItem(storageKey);
          } catch {}
        }
        window.location.assign(result.booking.status === "requested" ? "/account/bookings?requested=1" : "/account/bookings");
      }
    } catch (cause) {
      setNotice(
        cause instanceof Error
          ? cause.message
          : "Could not book. Retry to check this appointment.",
      );
    } finally {
      lock.current = false;
      setBusy(false);
    }
  }

  const heading = data?.priceType === "quote" ? "Request a quote" : isRequest ? "Request a booking" : "Book";
  return (
    <section className="product-form product-detail-booking">
      <h2>{heading}</h2>
      {loading ? <LoadingState label="Loading available times…" variant="compact" refreshing={!!data} /> : null}
      {error ? (
        <div role="alert">
          <p>{error}</p>
          <button className="product-secondary" onClick={retry}>
            Retry availability
          </button>
        </div>
      ) : null}
      {data && !error && data.priceType === "quote" ? <QuoteRequestForm id={id} data={data} /> : null}
      {data && !error && data.priceType !== "quote" ? (
        data.slots.length ? (
          <form onSubmit={submit}>
            {isRequest ? <p className="service-booking-callout">This provider approves each booking, usually within 48 hours. {data.paymentRequired ? "You’ll only be charged once they approve." : ""}</p> : null}
            {menu.length ? <fieldset className="service-menu" disabled={busy}>
              <legend>{data.template?.menuLabel ?? "Menu"}</legend>
              {menu.map((item) => {
                const count = picks[item.id] ?? 0;
                const setCount = (next: number) => setPicks((current) => ({ ...current, [item.id]: Math.max(0, Math.min(20, next)) }));
                return <div key={item.id} className={`service-menu-item${count ? " is-picked" : ""}`}>
                  <span><strong>{item.name}</strong>{item.description ? <small>{item.description}</small> : null}<em>{money(item.priceCents, data.currency || "AUD")}</em></span>
                  {count ? <span className="service-menu-stepper">
                    <button type="button" aria-label={`One less ${item.name}`} onClick={() => setCount(count - 1)}>−</button>
                    <output aria-label={`${item.name} quantity`}>{count}</output>
                    <button type="button" aria-label={`One more ${item.name}`} disabled={count >= 20} onClick={() => setCount(count + 1)}>+</button>
                  </span> : <button type="button" className="service-menu-add" aria-label={`Add ${item.name}`} onClick={() => setCount(1)}>Add</button>}
                </div>;
              })}
            </fieldset> : null}
            <fieldset disabled={busy} className="appointment-picker-fieldset"><legend className="service-booking-legend">Date and time</legend><CalendarPicker slots={data.slots} timeZone={timeZone} selectedDate={selectedDate} selected={selected} onSelectDate={(date) => { setSelectedDate(date); setSelected(""); }} onSelect={setSelected} /></fieldset>
            <div className="service-zone">
              <span>Times in {timeZone.replace("Australia/", "").replaceAll("_", " ")}</span>
              <button type="button" className="service-link" aria-expanded={zoneOpen} onClick={() => setZoneOpen((open) => !open)}>{zoneOpen ? "Done" : "Change"}</button>
            </div>
            {zoneOpen ? <label htmlFor="appointment-timezone" className="service-zone-select">Show times in<SelectField id="appointment-timezone" label="Show times in" value={timeZone} disabled={busy} onChange={(zone) => { setTimeZone(zone); setSelectedDate(""); setSelected(""); setZoneOpen(false); }} options={[{ value: data.timezone, label: `Provider time (${data.timezone.replace("Australia/", "")})` }, ...(timeZone !== data.timezone && !AU_TIMEZONES.some(([zone]) => zone === timeZone) ? [{ value: timeZone, label: `My time zone (${timeZone})` }] : []), ...AU_TIMEZONES.filter(([zone]) => zone !== data.timezone).map(([zone, city]) => ({ value: zone, label: city }))]} /></label> : null}
            {showAddress ? <AddressFields idPrefix="booking-address" legend={data.template?.addressLabel} value={address} onChange={setAddress} required={!!data.requiresAddress} disabled={busy} /> : null}
            {noteOpen || note ? <label className="service-booking-note" htmlFor="booking-note">Note for the provider<textarea id="booking-note" rows={2} maxLength={500} value={note} disabled={busy} autoFocus={!note} onChange={(event) => setNote(event.target.value)} placeholder="Anything they should know" /></label>
              : <button type="button" className="service-link service-note-toggle" onClick={() => setNoteOpen(true)}>+ Add a note</button>}
            {timingSetting === "customer_choice" ? (
              <fieldset className="service-pay-choice" disabled={busy}>
                <legend>When would you like to pay?</legend>
                <label><input type="radio" name="pay-when" checked={payChoice === "upfront"} onChange={() => setPayChoice("upfront")} /><span><strong>Pay now</strong><small>Pay securely online to confirm your booking.</small></span></label>
                <label><input type="radio" name="pay-when" checked={payChoice === "after_service"} onChange={() => setPayChoice("after_service")} /><span><strong>Pay after the service</strong><small>Book now. We’ll send a Pay link once the appointment is completed.</small></span></label>
              </fieldset>
            ) : timingSetting === "after_service" ? (
              <p className="service-booking-callout">You’ll pay online after the appointment. We’ll send you a Pay link once it’s completed.</p>
            ) : null}
            {data.paymentRequired && quote ? (
              <div className="service-booking-summary">
                {menu.length ? selections.map((selection) => { const item = menu.find((row) => row.id === selection.itemId)!; return <p key={item.id}><span>{selection.quantity} × {item.name}</span><span>{money(item.priceCents * selection.quantity, data.currency || "AUD")}</span></p>; })
                  : <p><span>Service</span><span>{money(quote.subtotalCents, data.currency || "AUD")}</span></p>}
                {quote.chargedTo === "buyer" && quote.platformFeeCents > 0 ? <p><span>Tivorah booking fee</span><span>{money(quote.platformFeeCents, data.currency || "AUD")}</span></p> : null}
                <p><strong>{paymentTiming === "after_service" ? "Total, paid after the service" : "Total"}</strong><strong>{menu.length && !picked ? "—" : money(quote.buyerTotalCents, data.currency || "AUD")}</strong></p>
              </div>
            ) : <p className="service-section-note">No payment is taken online. Settle any charges with the provider.</p>}
            {data.healthConsentRequired ? <HealthConsent checked={healthConsent} onChange={setHealthConsent} disabled={busy} kind="booking" /> : null}
            {data.refundPolicyLabel ? <p className="service-section-note"><strong>Cancellation:</strong> {data.refundPolicyLabel}</p> : null}
            {data.paymentRequired && !data.paymentAvailable ? (
              <p role="status">The provider is finishing payment setup. You can enquire about this service while online booking is unavailable.</p>
            ) : <button
              className="product-primary"
              disabled={!slot || busy || loading || !addressOk || (!!menu.length && !picked) || (!!data.healthConsentRequired && !healthConsent)}
            >
              {busy
                ? "Opening your booking…"
                : isRequest
                  ? "Send booking request"
                  : paysNow
                    ? "Continue to payment"
                    : "Book appointment"}
            </button>}
            {menu.length && !picked ? <p className="service-section-note">Add at least one item from the {(data.template?.menuLabel ?? "menu").toLowerCase()}.</p> : null}
            {slot && !addressOk ? <p className="service-section-note">{data.requiresAddress ? `Add the ${(data.template?.addressLabel ?? "address").toLowerCase()}.` : "Finish the address, or clear it."}</p> : null}
          </form>
        ) : (
          <>
            <p>No appointments are available in the next 30 days.</p>
            <button className="product-secondary" onClick={retry}>
              Refresh times
            </button>
          </>
        )
      ) : null}
      {notice ? (
        <p className="product-error" role="alert">
          {notice}
        </p>
      ) : null}
    </section>
  );
}

/**
 * Health and care services: what people share is health information (sensitive under the Privacy
 * Act), so booking asks for express consent. The API refuses the booking without it.
 */
function HealthConsent({ checked, onChange, disabled, kind }: { checked: boolean; onChange: (value: boolean) => void; disabled?: boolean; kind: "booking" | "request" }) {
  return <div className="service-health-consent">
    <p><strong>Health details stay private.</strong> This is a health or care service. Anything you share about your health, disability or care needs goes only to this provider, to arrange and deliver this {kind}. Share only what they need to know.</p>
    <label><input type="checkbox" checked={checked} disabled={disabled} onChange={(event) => onChange(event.target.checked)} /> <span>I agree to share health or care details with this provider for this {kind}.</span></label>
  </div>;
}

export function ServiceBooking({ id, quote = false }: { id: number; quote?: boolean }) {
  const { account, loading, signedOut, error, retry } = useAccount();
  if (loading) return <LoadingState label="Checking your account…" variant="compact" />;
  if (signedOut)
    return (
      <section className="product-form product-detail-booking">
        <h2>{quote ? "Request a quote" : "Book an appointment"}</h2>
        <p>
          {quote ? "Sign in to describe the job and get a price from the provider." : "Sign in to see available times and keep your booking in your account."}
        </p>
        <Link
          className="product-primary"
          href={`/auth/signin?returnTo=${encodeURIComponent(`/services/${id}`)}`}
        >
          {quote ? "Sign in to request a quote" : "Sign in to book"}
        </Link>
      </section>
    );
  if (!account)
    return (
      <section role="alert">
        <p>{error}</p>
        <button className="product-secondary" onClick={retry}>
          Retry account
        </button>
      </section>
    );
  return <AppointmentForm key={account.id} id={id} accountId={account.id} />;
}
