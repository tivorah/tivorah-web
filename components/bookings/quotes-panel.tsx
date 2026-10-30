"use client";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { usePrivateResource } from "../../hooks/use-private-resource";
import { api } from "../../lib/api/client";
import { money } from "../../lib/api/discovery";
import { LoadingState } from "../ui/loading-state";
import { SlotPicker } from "../discovery/service-booking";
import { addressLine, type ServiceAddress } from "./booking-actions";
import "./bookings.css";
import { leaveFor } from "../../lib/leave-page";

// Quotes for "on quote" services (mirrors mobile components/bookings/QuotesList.tsx).
// Customer: accept a quote by choosing a time, or withdraw. Provider: send/update a quote or decline.

export type ServiceQuote = {
  id: number; productId: number; title: string; status: "requested" | "quoted" | "accepted" | "declined" | "expired" | "withdrawn";
  message: string; preferredTimes: string | null; serviceAddress: ServiceAddress | null; amountCents: number | null; currency: string;
  durationMinutes: number | null; providerMessage: string | null; validUntil: string | null; bookingId: number | null; createdAt: string;
  perspective: "provider" | "customer"; counterparty: { name: string };
};
const statusText: Record<ServiceQuote["status"], string> = { requested: "Waiting for a quote", quoted: "Quote received", accepted: "Booked", declined: "Declined", expired: "Expired", withdrawn: "Withdrawn" };
const providerStatus: Partial<Record<ServiceQuote["status"], string>> = { requested: "Needs a quote", quoted: "Quote sent" };
const day = (value: string) => new Intl.DateTimeFormat("en-AU", { day: "numeric", month: "short", year: "numeric" }).format(new Date(value));

export function QuotesPanel({ perspective, focusId }: { perspective: "customer" | "provider"; focusId?: number | null }) {
  const { data, loading, error, retry } = usePrivateResource<{ quotes: ServiceQuote[] }>("/market/quotes");
  const [notice, setNotice] = useState("");
  const rows = (data?.quotes ?? []).filter((quote) => quote.perspective === perspective);
  const open = rows.filter((quote) => ["requested", "quoted"].includes(quote.status));
  const closed = rows.filter((quote) => !["requested", "quoted"].includes(quote.status));
  if (loading && !data) return <LoadingState label="Loading quotes…" variant="compact" />;
  if (error) return <div role="alert" className="product-notice"><p>{error}</p><button type="button" className="product-secondary" onClick={retry}>Try again</button></div>;
  return <section className="quotes-panel" aria-label="Quotes">
    {notice ? <p role="status" className="product-notice">{notice}</p> : null}
    {!rows.length ? <div className="product-empty"><h2>No quotes yet</h2><p>{perspective === "provider" ? "When a customer asks for a quote on one of your services, it appears here." : "Ask for a quote on any service priced “by agreement”."}</p></div> : null}
    {open.length ? <h2 className="bookings-subheading">Open <span>{open.length}</span></h2> : null}
    {open.map((quote) => <QuoteCard key={quote.id} quote={quote} perspective={perspective} focused={focusId === quote.id} onChanged={(message) => { setNotice(message); retry(); }} />)}
    {closed.length ? <details className="bookings-history"><summary>Past quotes <span>{closed.length}</span></summary>{closed.map((quote) => <QuoteCard key={quote.id} quote={quote} perspective={perspective} focused={focusId === quote.id} onChanged={(message) => { setNotice(message); retry(); }} />)}</details> : null}
  </section>;
}

function QuoteCard({ quote, perspective, focused, onChanged }: { quote: ServiceQuote; perspective: "customer" | "provider"; focused: boolean; onChanged: (message: string) => void }) {
  const [panel, setPanel] = useState<null | "accept" | "quote" | "decline">(focused && perspective === "customer" && quote.status === "quoted" ? "accept" : null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [slot, setSlot] = useState("");
  const [amount, setAmount] = useState(quote.amountCents ? String(quote.amountCents / 100) : "");
  const [duration, setDuration] = useState(String(quote.durationMinutes ?? 60));
  const [validDays, setValidDays] = useState("7");
  const [message, setMessage] = useState("");
  const card = useRef<HTMLElement>(null);
  useEffect(() => { if (focused) card.current?.scrollIntoView({ block: "center" }); }, [focused]);
  const expired = !!quote.validUntil && new Date(quote.validUntil) < new Date();
  const cents = Math.round(Number(amount.replace(/[^0-9.]/g, "")) * 100);
  const minutes = Number(duration);
  const quoteReady = Number.isFinite(cents) && cents >= 50 && minutes >= 15 && minutes <= 720 && Number(validDays) >= 1 && Number(validDays) <= 30;

  // A ref lock: state only blocks a second click after the re-render, so both would send.
  const postLock = useRef(false);
  async function post(path: string, body: unknown, done: string, onResult?: (result: any) => boolean | Promise<boolean>) {
    if (postLock.current) return;
    postLock.current = true;
    try {
      if (busy) return;
      setBusy(true); setError("");
      try {
        const result = await api<any>(path, { method: "POST", body: JSON.stringify(body) });
        if (await onResult?.(result)) return;
        setPanel(null); onChanged(done);
      } catch (cause) { setError(cause instanceof Error ? cause.message : "That didn’t work. Please try again."); }
      finally { setBusy(false); }
    } finally { postLock.current = false; }
  }
  const accept = (event: FormEvent) => { event.preventDefault(); if (!slot) return; void post(`/market/quotes/${quote.id}/accept`, { startsAt: slot, checkoutPlatform: "web" }, "Booked! Your appointment is confirmed.", async (result: { checkoutUrl: string | null }) => {
    if (!result.checkoutUrl) return false;
    const target = new URL(result.checkoutUrl);
    if (target.protocol !== "https:" || target.hostname !== "checkout.stripe.com") throw new Error("The payment link could not be verified.");
    await leaveFor(target.href); return true;
  }); };
  const sendQuote = (event: FormEvent) => { event.preventDefault(); if (!quoteReady) return; void post(`/market/quotes/${quote.id}/respond`, { action: "quote", amountCents: cents, durationMinutes: minutes, validDays: Number(validDays), message: message.trim() || undefined }, "Quote sent. The customer has been emailed and can accept it and book a time."); };
  const decline = (event: FormEvent) => { event.preventDefault(); void post(`/market/quotes/${quote.id}/respond`, { action: "decline", message: message.trim() || undefined }, "Request declined. The customer has been told."); };

  return <article ref={card} className={`quote-card${focused ? " focused" : ""}`}>
    <header><div><h3>{quote.title}</h3><p>{perspective === "provider" ? "From" : "Provider"}: {quote.counterparty.name} · Q-{quote.id} · {day(quote.createdAt)}</p></div><span className="booking-chip">{perspective === "provider" ? providerStatus[quote.status] ?? statusText[quote.status] : expired && quote.status === "quoted" ? "Expired" : statusText[quote.status]}</span></header>
    <p className="quote-message">{quote.message}</p>
    <dl className="booking-facts">
      {quote.preferredTimes ? <div><dt>Preferred times</dt><dd>{quote.preferredTimes}</dd></div> : null}
      {quote.serviceAddress ? <div><dt>Address</dt><dd>{addressLine(quote.serviceAddress)}</dd></div> : null}
    </dl>
    {quote.amountCents != null && quote.status !== "requested" ? <div className="quote-amount"><strong>{money(quote.amountCents, quote.currency)}</strong><span>{quote.durationMinutes} min{quote.validUntil ? ` · valid until ${day(quote.validUntil)}` : ""}</span>{quote.providerMessage ? <p>“{quote.providerMessage}”</p> : null}</div> : null}
    {quote.bookingId ? <p className="booking-actions-note">Booked as appointment #{quote.bookingId}.</p> : null}

    <div className="booking-actions-row">
      {perspective === "customer" && quote.status === "quoted" && !expired ? <button type="button" className="product-primary" onClick={() => setPanel(panel === "accept" ? null : "accept")}>Accept &amp; choose a time</button> : null}
      {perspective === "customer" && ["requested", "quoted"].includes(quote.status) ? <button type="button" className="booking-actions-danger" disabled={busy} onClick={() => void post(`/market/quotes/${quote.id}/withdraw`, {}, "Quote request withdrawn.")}>Withdraw</button> : null}
      {perspective === "provider" && ["requested", "quoted"].includes(quote.status) ? <>
        <button type="button" className="product-primary" onClick={() => setPanel(panel === "quote" ? null : "quote")}>{quote.status === "quoted" ? "Update quote" : "Send quote"}</button>
        <button type="button" className="booking-actions-danger" onClick={() => setPanel(panel === "decline" ? null : "decline")}>Decline</button>
      </> : null}
    </div>

    {panel === "accept" ? <form className="booking-actions-panel" onSubmit={accept}>
      <p>Choose a time for this {quote.durationMinutes}-minute job. {quote.amountCents ? `You’ll pay ${money(quote.amountCents, quote.currency)} (plus any booking fee shown at checkout) to confirm.` : ""}</p>
      <SlotPicker productId={quote.productId} lengthMinutes={quote.durationMinutes} selected={slot} onSelect={setSlot} disabled={busy} />
      <div><button className="product-primary" disabled={busy || !slot}>{busy ? "Booking…" : quote.amountCents ? "Book and pay" : "Book this time"}</button><button type="button" className="product-secondary" onClick={() => setPanel(null)}>Back</button></div>
    </form> : null}

    {panel === "quote" ? <form className="booking-actions-panel quote-form" onSubmit={sendQuote}>
      <label htmlFor={`q-amount-${quote.id}`}>Price ({quote.currency}, including GST if you charge it)<input id={`q-amount-${quote.id}`} inputMode="decimal" required value={amount} onChange={(event) => setAmount(event.target.value)} placeholder="e.g. 180" /></label>
      <div className="quote-form-row">
        <label htmlFor={`q-duration-${quote.id}`}>Time needed (minutes)<input id={`q-duration-${quote.id}`} type="number" min={15} max={720} step={15} required value={duration} onChange={(event) => setDuration(event.target.value)} /></label>
        <label htmlFor={`q-valid-${quote.id}`}>Valid for (days)<input id={`q-valid-${quote.id}`} type="number" min={1} max={30} required value={validDays} onChange={(event) => setValidDays(event.target.value)} /></label>
      </div>
      <label htmlFor={`q-message-${quote.id}`}>What’s included (optional)<textarea id={`q-message-${quote.id}`} rows={3} maxLength={1000} value={message} onChange={(event) => setMessage(event.target.value)} placeholder="Materials, what to prepare, anything not included" /></label>
      {!quoteReady && amount ? <p className="booking-actions-note">Price at least $0.50, 15–720 minutes, valid 1–30 days.</p> : null}
      <p className="booking-actions-note">The customer gets an emailed quote (Q-{quote.id}). When they accept, the time is booked and paid like any appointment.</p>
      <div><button className="product-primary" disabled={busy || !quoteReady}>{busy ? "Sending…" : "Send quote"}</button><button type="button" className="product-secondary" onClick={() => setPanel(null)}>Back</button></div>
    </form> : null}

    {panel === "decline" ? <form className="booking-actions-panel" onSubmit={decline}>
      <label htmlFor={`q-decline-${quote.id}`}>Let them know why (optional)<textarea id={`q-decline-${quote.id}`} rows={2} maxLength={1000} value={message} onChange={(event) => setMessage(event.target.value)} /></label>
      <div><button className="booking-actions-danger solid" disabled={busy}>{busy ? "Declining…" : "Decline request"}</button><button type="button" className="product-secondary" onClick={() => setPanel(null)}>Back</button></div>
    </form> : null}
    {error ? <p className="product-error" role="alert">{error}</p> : null}
  </article>;
}
