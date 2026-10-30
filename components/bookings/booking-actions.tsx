"use client";
import { bookingStatusText, owesPayment } from "../../lib/booking-status";
export { bookingStatusText, owesPayment };
import { useEffect, useRef, useState, type FormEvent } from "react";
import { api } from "../../lib/api/client";
import { money } from "../../lib/api/discovery";
import { adminApiBase } from "../../app/admin/api-base";
import { SlotPicker } from "../discovery/service-booking";
import "./bookings.css";
import { leaveFor } from "../../lib/leave-page";

// Everything someone can do with one service appointment, for the customer (/account/bookings)
// and the provider (/business/appointments). Mirrors mobile components/bookings/BookingList.tsx.

export type ServiceAddress = { line1: string; suburb: string; state: string; postcode: string; notes?: string };
export type ActionBooking = {
  id: number;
  productId: number;
  startsAt: string;
  endsAt: string;
  timezone: string;
  status: string;
  totalCents: number;
  refundedCents?: number;
  applicationFeeCents?: number;
  currency?: string;
  customerNote?: string | null;
  serviceAddress?: ServiceAddress | null;
  payoutStatus?: "held" | "released" | "reversed" | "not_applicable" | null;
  payoutReleasedAt?: string | null;
  paymentDueAt?: string | null;
  requestExpiresAt?: string | null;
  providerMessage?: string | null;
  stripePaymentIntentId?: string | null;
  cancelledBy?: string | null;
  quoteId?: number | null;
  reviewed?: boolean;
  canReschedule?: boolean;
  paymentAvailable?: boolean;
  /** "after_service": confirmed unpaid, payable once completed. */
  paymentTiming?: "upfront" | "after_service";
  /** A completed pay-after-service appointment the customer still has to pay for. */
  paymentDue?: boolean;
};
type Role = "customer" | "provider";
type Outcome = { refund: boolean; refundCents: number; summary: string };

const LIVE = ["requested", "pending_payment", "confirmed"];
export const when = (value: string, timezone: string, options: Intl.DateTimeFormatOptions = { weekday: "short", day: "numeric", month: "short", hour: "numeric", minute: "2-digit" }) => {
  try { return new Intl.DateTimeFormat("en-AU", { ...options, timeZone: timezone }).format(new Date(value)); }
  catch { return new Intl.DateTimeFormat("en-AU", options).format(new Date(value)); }
};
export const isLiveBooking = (booking: ActionBooking) => LIVE.includes(booking.status) && new Date(booking.endsAt) > new Date();
export const addressLine = (address: ServiceAddress) => `${address.line1}, ${address.suburb} ${address.state} ${address.postcode}`;

type Panel = null | "cancel" | "reschedule" | "approve" | "decline" | "review" | "complete";

export function BookingActions({ booking, role, onChanged, autoOpen }: { booking: ActionBooking; role: Role; onChanged: (message: string) => void; autoOpen?: "review" | "pay" | null }) {
  const [panel, setPanel] = useState<Panel>(autoOpen === "review" ? "review" : null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [outcome, setOutcome] = useState<Outcome | null>(null);
  const [text, setText] = useState("");
  const [slot, setSlot] = useState("");
  const [rating, setRating] = useState(0);
  const payButton = useRef<HTMLButtonElement>(null);
  const future = new Date(booking.startsAt) > new Date();
  const live = LIVE.includes(booking.status) && future;
  const lengthMinutes = Math.round((new Date(booking.endsAt).getTime() - new Date(booking.startsAt).getTime()) / 60000);
  // The API decides for customers (policy window, reschedule limit); providers can move any live booking.
  const canReschedule = live && (role === "provider" || !!booking.canReschedule);
  const paid = !!booking.stripePaymentIntentId && booking.totalCents > 0;
  // Once a confirmed appointment has started, the provider can mark it done (it also completes on its own when it ends).
  const canComplete = role === "provider" && booking.status === "confirmed" && !future;
  const other = role === "provider" ? "the customer" : "the provider";

  useEffect(() => { if (autoOpen === "pay") payButton.current?.focus(); }, [autoOpen]);

  function open(next: Panel) {
    setPanel(panel === next ? null : next); setError(""); setText(""); setSlot(""); setRating(0); setOutcome(null);
    if (next === "cancel" && panel !== "cancel") api<Outcome>(`/market/bookings/${booking.id}/cancellation`).then(setOutcome).catch(() => setOutcome(null));
  }
  // A ref lock: state only blocks a second click after the re-render, so both would send.
  const runLock = useRef(false);
  async function run(path: string, body: unknown, message: string) {
    if (runLock.current) return;
    runLock.current = true;
    try {
      if (busy) return;
      setBusy(true); setError("");
      try {
        await api(path, { method: "POST", body: JSON.stringify(body) });
        setPanel(null); onChanged(message);
      } catch (cause) { setError(cause instanceof Error ? cause.message : "That didn’t work. Please try again."); }
      finally { setBusy(false); }
    } finally { runLock.current = false; }
  }
  const payLock = useRef(false);
  async function pay() {
    if (payLock.current) return;
    payLock.current = true;
    try {
      if (busy) return;
      setBusy(true); setError("");
      try {
        const result = await api<{ checkoutUrl: string | null }>(`/web/account/bookings/${booking.id}/payment`, { method: "POST" });
        if (!result.checkoutUrl) { onChanged("Payment status is updating. Refresh shortly."); return; }
        const target = new URL(result.checkoutUrl);
        if (target.protocol !== "https:" || target.hostname !== "checkout.stripe.com") throw new Error("The payment link could not be verified.");
        await leaveFor(target.href);
      } catch (cause) { setError(cause instanceof Error ? cause.message : "Could not open payment. Please try again."); }
      finally { setBusy(false); }
    } finally { payLock.current = false; }
  }
  const submit = (event: FormEvent, action: () => void) => { event.preventDefault(); action(); };

  return <div className="booking-actions">
    <BookingFacts booking={booking} role={role} />
    <div className="booking-actions-row">
      {role === "provider" && booking.status === "requested" && future ? <>
        <button type="button" className="product-primary" disabled={busy} onClick={() => open("approve")}>Approve</button>
        <button type="button" className="product-secondary" disabled={busy} onClick={() => open("decline")}>Decline</button>
      </> : null}
      {role === "customer" && booking.status === "pending_payment" && future ? (booking.paymentAvailable === false
        ? <p>The provider is finishing payment setup. This appointment is waiting for payment.</p>
        : <button ref={payButton} type="button" className="product-primary" disabled={busy} onClick={() => void pay()}>{busy && panel === null ? "Opening payment…" : `Pay ${money(booking.totalCents, booking.currency || "AUD")}`}</button>) : null}
      {role === "customer" && owesPayment(booking) ? (booking.paymentAvailable === false
        ? <p>The provider is finishing payment setup. We’ll let you know when you can pay.</p>
        : <button ref={payButton} type="button" className="product-primary" disabled={busy} onClick={() => void pay()}>{busy && panel === null ? "Opening payment…" : `Pay ${money(booking.totalCents, booking.currency || "AUD")}`}</button>) : null}
      {role === "customer" && booking.status === "completed" && !booking.reviewed ? <button type="button" className="product-primary" onClick={() => open("review")}>Leave a review</button> : null}
      {canComplete ? <button type="button" className="product-primary" disabled={busy} onClick={() => open("complete")}>Mark complete</button> : null}
      {canReschedule ? <button type="button" className="product-secondary" disabled={busy} onClick={() => open("reschedule")}>{role === "provider" ? "Move appointment" : "Reschedule"}</button> : null}
      {live ? <button type="button" className="booking-actions-danger" disabled={busy} onClick={() => open("cancel")}>{booking.status === "requested" && role === "customer" ? "Withdraw request" : "Cancel appointment"}</button> : null}
      {paid ? <a className="booking-actions-link" href={`${adminApiBase()}/api/v1/market/bookings/${booking.id}/receipt`} download>Download receipt (PDF)</a> : null}
    </div>

    {panel === "approve" ? <form className="booking-actions-panel" onSubmit={(event) => submit(event, () => void run(`/market/bookings/${booking.id}/approve`, { message: text.trim() || undefined }, booking.totalCents > 0 ? "Approved. The customer has been sent an invoice to pay." : "Approved. The customer has been told."))}>
      <p>{booking.totalCents > 0 ? `The customer gets an invoice for ${money(booking.totalCents, booking.currency || "AUD")} to pay within 24 hours (or before the appointment). The time stays held for them.` : "The appointment is confirmed straight away."}</p>
      <label htmlFor={`approve-${booking.id}`}>Message to the customer (optional)<textarea id={`approve-${booking.id}`} rows={2} maxLength={1000} value={text} onChange={(event) => setText(event.target.value)} placeholder="Anything to bring or prepare" /></label>
      <div><button className="product-primary" disabled={busy}>{busy ? "Approving…" : "Approve booking"}</button><button type="button" className="product-secondary" onClick={() => setPanel(null)}>Back</button></div>
    </form> : null}

    {panel === "decline" ? <form className="booking-actions-panel" onSubmit={(event) => submit(event, () => void run(`/market/bookings/${booking.id}/decline`, { message: text.trim() || undefined }, "Request declined. The customer has been told and wasn’t charged."))}>
      <label htmlFor={`decline-${booking.id}`}>Let them know why (optional)<textarea id={`decline-${booking.id}`} rows={2} maxLength={1000} value={text} onChange={(event) => setText(event.target.value)} placeholder="e.g. I’m fully booked that week. Try the following Monday." /></label>
      <div><button className="booking-actions-danger solid" disabled={busy}>{busy ? "Declining…" : "Decline request"}</button><button type="button" className="product-secondary" onClick={() => setPanel(null)}>Back</button></div>
    </form> : null}

    {panel === "cancel" ? <form className="booking-actions-panel" onSubmit={(event) => submit(event, () => void run(`/market/bookings/${booking.id}/cancel`, { reason: text.trim() }, outcome?.refund ? `Cancelled. A refund of ${money(outcome.refundCents, booking.currency || "AUD")} has been submitted.` : "Cancelled. The other person has been told."))}>
      <p role="status"><strong>{outcome ? outcome.summary : "Checking what happens to the payment…"}</strong></p>
      {role === "provider" ? <p>Cancelling as the provider always refunds the customer in full.</p> : null}
      {/* Same as the app: a message is required; it's emailed to both people and pushed to the other. */}
      <label htmlFor={`cancel-${booking.id}`}>Message to {other}<textarea id={`cancel-${booking.id}`} rows={2} maxLength={500} required value={text} onChange={(event) => setText(event.target.value)} placeholder="e.g. Sorry, something came up and I can’t make it" /></label>
      <p className="booking-actions-note">Emailed to you both, and sent to {other} as a notification.</p>
      <div><button className="booking-actions-danger solid" disabled={busy || !outcome || !text.trim()}>{busy ? "Cancelling…" : "Confirm cancellation"}</button><button type="button" className="product-secondary" onClick={() => setPanel(null)}>Keep appointment</button></div>
    </form> : null}

    {panel === "reschedule" ? <form className="booking-actions-panel" onSubmit={(event) => submit(event, () => void run(`/market/bookings/${booking.id}/reschedule`, { startsAt: slot, message: text.trim() }, "Appointment moved. You’ve both been emailed."))}>
      <p>Choose a new time. {role === "customer" ? "You can reschedule inside the cancellation window, up to 3 times." : "The customer is told straight away."}</p>
      <SlotPicker productId={booking.productId} excludeBookingId={booking.id} lengthMinutes={lengthMinutes} selected={slot} onSelect={setSlot} disabled={busy} />
      {slot ? <p role="status">New time: <strong>{when(slot, booking.timezone, { dateStyle: "full", timeStyle: "short" })}</strong></p> : null}
      <label htmlFor={`reschedule-${booking.id}`}>Message to {other}<textarea id={`reschedule-${booking.id}`} rows={2} maxLength={500} required value={text} onChange={(event) => setText(event.target.value)} placeholder="e.g. Could we move this to later in the week?" /></label>
      <p className="booking-actions-note">Emailed to you both with the new time, and sent to {other} as a notification.</p>
      <div><button className="product-primary" disabled={busy || !slot || !text.trim()}>{busy ? "Moving…" : "Confirm new time"}</button><button type="button" className="product-secondary" onClick={() => setPanel(null)}>Back</button></div>
    </form> : null}

    {panel === "complete" ? <form className="booking-actions-panel" onSubmit={(event) => submit(event, () => void run(`/market/bookings/${booking.id}/complete`, {}, "Marked complete. We’ve asked the customer for a review."))}>
      <p>{booking.totalCents > 0 && booking.paymentTiming === "after_service" ? "We’ll ask the customer to pay now, and to leave a review." : "We’ll ask the customer to leave a review."}{paid ? " Your payout follows 24 hours after completion unless they report a problem." : ""}</p>
      <div><button className="product-primary" disabled={busy}>{busy ? "Completing…" : "Mark complete"}</button><button type="button" className="product-secondary" onClick={() => setPanel(null)}>Back</button></div>
    </form> : null}

    {panel === "review" ? <form className="booking-actions-panel" onSubmit={(event) => submit(event, () => void run(`/market/bookings/${booking.id}/review`, { rating, comment: text.trim() || undefined }, "Thanks! Your review is on the service page."))}>
      <fieldset className="booking-stars"><legend>How was it?</legend>{[1, 2, 3, 4, 5].map((value) => <label key={value}><input type="radio" name={`rating-${booking.id}`} value={value} checked={rating === value} onChange={() => setRating(value)} /><span aria-hidden="true">{value <= rating ? "★" : "☆"}</span><span className="product-sr-only">{value} star{value === 1 ? "" : "s"}</span></label>)}</fieldset>
      <label htmlFor={`review-${booking.id}`}>Tell others about it (optional)<textarea id={`review-${booking.id}`} rows={3} maxLength={2000} value={text} onChange={(event) => setText(event.target.value)} placeholder="What went well, anything to know" /></label>
      <p className="booking-actions-note">Shown publicly with your first name. The provider can reply once.</p>
      <div><button className="product-primary" disabled={busy || !rating}>{busy ? "Posting…" : "Post review"}</button><button type="button" className="product-secondary" onClick={() => setPanel(null)}>Not now</button></div>
    </form> : null}

    {error ? <p className="product-error" role="alert">{error}</p> : null}
  </div>;
}

/** Status-specific facts: deadlines, address, messages, refunds and payout state. */
function BookingFacts({ booking, role }: { booking: ActionBooking; role: Role }) {
  const rows: [string, string][] = [];
  const currency = booking.currency || "AUD";
  if (booking.status === "requested" && booking.requestExpiresAt) rows.push([role === "provider" ? "Respond by" : "Provider responds by", when(booking.requestExpiresAt, booking.timezone)]);
  if (booking.status === "pending_payment" && booking.paymentDueAt) rows.push([role === "provider" ? "Customer pays by" : "Pay by", `${when(booking.paymentDueAt, booking.timezone)} · Invoice #B-${booking.id}`]);
  if (owesPayment(booking) && booking.paymentDueAt) rows.push([role === "provider" ? "Customer pays by" : "Pay by", `${when(booking.paymentDueAt, booking.timezone, { day: "numeric", month: "long", year: "numeric" })} · Invoice #B-${booking.id}`]);
  if (booking.paymentTiming === "after_service" && booking.totalCents > 0 && LIVE.includes(booking.status)) rows.push(["Payment", role === "provider" ? "The customer pays online after the appointment" : "You pay online after the appointment"]);
  if (booking.serviceAddress) rows.push(["Address", `${addressLine(booking.serviceAddress)}${booking.serviceAddress.notes ? ` (${booking.serviceAddress.notes})` : ""}`]);
  if (booking.quoteId) rows.push(["From quote", `Q-${booking.quoteId}`]);
  if (booking.providerMessage) rows.push([role === "provider" ? "Your message" : "Provider’s message", booking.providerMessage]);
  if (booking.refundedCents) rows.push(["Refunded", money(booking.refundedCents, currency)]);
  if (["cancelled", "refunded"].includes(booking.status) && booking.cancelledBy) rows.push(["Cancelled by", booking.cancelledBy === role ? "You" : booking.cancelledBy === "provider" ? "The provider" : booking.cancelledBy === "customer" ? "The customer" : "Tivorah"]);
  if (role === "provider" && booking.payoutStatus && booking.payoutStatus !== "not_applicable") rows.push(["Payout", booking.payoutStatus === "held" ? "Held until 24 hours after the appointment, then sent to your bank" : booking.payoutStatus === "released" ? `Sent${booking.payoutReleasedAt ? ` ${when(booking.payoutReleasedAt, booking.timezone, { day: "numeric", month: "short" })}` : ""}` : "Returned to the customer"]);
  if (!rows.length) return null;
  return <dl className="booking-facts">{rows.map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}</dl>;
}
