"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { eventApi, ticketMoney } from "../../events/api";

// A buyer chooses after the organiser asked not to refund them. A refund is always
// their right: if they don't choose within 7 days, they're refunded automatically.
type Details = { eventTitle: string; orderId: number; totalCents: number; reason: "refunded_directly" | "new_date_agreed" | null; status: string; decision: "refund" | "waive" | null; deadline: string | null };
const reasonText = {
  refunded_directly: "The organiser says they have already refunded you directly.",
  new_date_agreed: "The organiser says you agreed to move your booking to a new date.",
};

export function RefundDecision({ token }: { token: string }) {
  const [details, setDetails] = useState<Details | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState<"refund" | "waive" | null>(null);

  useEffect(() => {
    eventApi<Details>(`/refund-decisions/${encodeURIComponent(token)}`).then(setDetails).catch((cause) => setError(cause instanceof Error ? cause.message : "This link is invalid or has expired."));
  }, [token]);

  async function decide(decision: "refund" | "waive") {
    setBusy(decision); setError("");
    try { setDetails(await eventApi<Details>(`/refund-decisions/${encodeURIComponent(token)}`, { method: "POST", body: JSON.stringify({ decision }) })); }
    catch (cause) { setError(cause instanceof Error ? cause.message : "Your choice couldn’t be saved. Please try again."); }
    finally { setBusy(null); }
  }

  if (error && !details) return <section className="refund-card"><h1>This link isn’t working</h1><p>{error}</p><Link className="product-secondary" href="/contact">Contact Tivorah</Link></section>;
  if (!details) return <section className="refund-card" aria-busy="true"><span className="refund-skel tivorah-shimmer" /><span className="refund-skel short tivorah-shimmer" /></section>;

  const decided = details.status !== "awaiting_buyer";
  return <section className="refund-card">
    <p className="product-eyebrow">EVENT CANCELLED</p>
    <h1>{details.eventTitle}</h1>
    <p className="refund-amount">Booking #{details.orderId} · {ticketMoney(details.totalCents)}</p>
    {decided ? <div className={`refund-result ${details.status === "waived" ? "is-waived" : "is-refund"}`} role="status">
      <strong>{details.status === "waived" ? "Thanks — you won’t be refunded through Tivorah" : "Your refund is on its way"}</strong>
      <p>{details.status === "waived" ? "You confirmed the organiser’s arrangement. If anything changes, contact the organiser or Tivorah support." : "We’re refunding your original payment method. Banks usually take 5–10 business days to show it."}</p>
    </div> : <>
      <p>You’re entitled to a full refund because the event was cancelled. {details.reason ? reasonText[details.reason] : null}</p>
      <p className="refund-deadline">Please choose by {details.deadline ? new Date(details.deadline).toLocaleDateString("en-AU", { weekday: "long", day: "numeric", month: "long" }) : "the deadline"}. If you don’t choose, we’ll refund you automatically.</p>
      <div className="refund-actions">
        <button type="button" className="product-primary press-fx" disabled={!!busy} onClick={() => void decide("refund")}>{busy === "refund" ? "Saving…" : "Refund me"}</button>
        <button type="button" className="product-secondary press-fx" disabled={!!busy} onClick={() => void decide("waive")}>{busy === "waive" ? "Saving…" : "I agree — no refund"}</button>
      </div>
      {error ? <p className="field-error" role="alert">{error}</p> : null}
    </>}
  </section>;
}
