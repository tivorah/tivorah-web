"use client";
import { useState, type FormEvent } from "react";
import Link from "next/link";
import "../account/booking-help.css";
import "./booking-requests.css";
import { usePrivateResource } from "../../hooks/use-private-resource";
import { api } from "../../lib/api/client";
import { money } from "../../lib/api/discovery";
import { requestKindLabel, sellerStatusLabel, type ManagedBookingRequest, type RequestKind } from "../../lib/booking-requests";
import { LoadingState } from "../ui/loading-state";

const when = (value: string) => new Date(value).toLocaleDateString("en-AU", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" });
const ACTIVE = ["open", "escalated"];

export function useSellerRequests(filter: { eventId?: number; productId?: number } = {}) {
  const query = new URLSearchParams(Object.entries(filter).filter(([, value]) => value).map(([key, value]) => [key, String(value)]));
  return usePrivateResource<ManagedBookingRequest[]>(`/booking-requests/seller${query.size ? `?${query}` : ""}`);
}

/** Open requests needing the seller's reply, for tab badges. */
export const openCount = (requests: ManagedBookingRequest[] | null | undefined, kind: RequestKind) =>
  requests?.filter((request) => request.kind === kind && request.status === "open").length ?? 0;

/**
 * Seller inbox for refund requests or complaints. Open cases come first; each can be approved and
 * refunded through Stripe, declined with a reason, marked resolved, or sent to Tivorah.
 */
export function SellerRequests({ kind, requests, loading, error, retry, showTitle }: {
  kind: RequestKind; requests?: ManagedBookingRequest[] | null; loading: boolean; error?: string | null; retry: () => void; showTitle?: boolean;
}) {
  const [showPast, setShowPast] = useState(false);
  if (loading && !requests) return <LoadingState label={`Loading ${kind === "refund" ? "refund requests" : "complaints"}…`} />;
  if (error) return <div role="alert" className="product-notice"><p>{error}</p><button className="product-secondary" onClick={retry}>Try again</button></div>;
  const mine = (requests ?? []).filter((request) => request.kind === kind);
  const active = mine.filter((request) => ACTIVE.includes(request.status));
  const past = mine.filter((request) => !ACTIVE.includes(request.status));
  return (
    <section className="seller-requests" aria-label={kind === "refund" ? "Refund requests" : "Complaints"}>
      <p className="seller-requests-intro">
        {kind === "refund"
          ? "Buyers can ask for a refund while your refund policy allows it. Approving refunds the full remaining amount to their card through Stripe; the money comes back out of your payouts."
          : "Problems buyers report about their booking. Reply and mark them resolved, or ask Tivorah to step in."}
      </p>
      {active.length ? active.map((request) => <RequestRow key={request.id} request={request} showTitle={showTitle} onDone={retry} />) : (
        <div className="seller-requests-empty"><strong>{kind === "refund" ? "No refund requests" : "No complaints"}</strong><span>{mine.length ? "You’re all caught up." : "When a buyer sends one, it shows up here and we’ll notify you."}</span></div>
      )}
      {past.length ? (
        <div className="seller-requests-past">
          <button type="button" className="booking-help-link" aria-expanded={showPast} onClick={() => setShowPast((value) => !value)}>{showPast ? "Hide" : "Show"} answered ({past.length})</button>
          {showPast ? past.map((request) => <RequestRow key={request.id} request={request} showTitle={showTitle} onDone={retry} />) : null}
        </div>
      ) : null}
    </section>
  );
}

type Mode = "decline" | "resolve" | "approve" | "escalate" | null;

function RequestRow({ request, showTitle, onDone }: { request: ManagedBookingRequest; showTitle?: boolean; onDone: () => void }) {
  const [mode, setMode] = useState<Mode>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const open = request.status === "open";

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const text = String(new FormData(event.currentTarget).get("message") || "").trim();
    setBusy(true); setError("");
    try {
      if (mode === "escalate") await api(`/booking-requests/${request.id}/escalate`, { method: "POST", body: JSON.stringify({ note: text }) });
      else await api(`/booking-requests/${request.id}/respond`, { method: "POST", body: JSON.stringify({ action: mode, message: text || undefined }) });
      setMode(null); onDone();
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Couldn’t update. Try again."); }
    finally { setBusy(false); }
  }

  const formCopy: Record<Exclude<Mode, null>, { label: string; button: string; required: boolean; placeholder: string }> = {
    approve: { label: "Message to the buyer · optional", button: busy ? "Refunding…" : `Refund ${money(request.refundableCents, request.currency)}`, required: false, placeholder: "e.g. Sorry you can’t make it" },
    decline: { label: "Why are you declining?", button: busy ? "Sending…" : "Decline request", required: true, placeholder: "The buyer sees this message" },
    resolve: { label: "Your reply to the buyer", button: busy ? "Sending…" : "Mark resolved", required: true, placeholder: "What did you do about it?" },
    escalate: { label: "What should Tivorah know?", button: busy ? "Sending…" : "Send to Tivorah", required: true, placeholder: "Explain what’s happened so far" },
  };

  return (
    <article className={`seller-request is-${request.status}`}>
      <header>
        <div>
          <strong>{request.buyer.name}</strong>
          <span>{showTitle ? `${request.title} · ` : ""}{request.subjectType === "event_order" ? `Booking #${request.bookingId}${request.quantity ? ` · ${request.quantity} ticket${request.quantity === 1 ? "" : "s"}` : ""}` : `Appointment #${request.bookingId}`} · {money(request.totalCents, request.currency)}</span>
        </div>
        <span className="booking-help-chip">{sellerStatusLabel[request.status]}</span>
      </header>
      <p className="seller-request-reason">{request.reason}</p>
      <p className="seller-request-message">{request.message}</p>
      <p className="booking-help-meta">{requestKindLabel[request.kind]} · {when(request.createdAt)}{request.refundedCents ? ` · ${money(request.refundedCents, request.currency)} refunded` : ""}</p>
      {request.sellerResponse ? <p className="booking-help-reply"><span>You replied</span>{request.sellerResponse}</p> : null}
      {request.escalationNote ? <p className="booking-help-reply"><span>Sent to Tivorah</span>{request.escalationNote}</p> : null}
      {request.staffNote ? <p className="booking-help-reply"><span>Tivorah</span>{request.staffNote}</p> : null}

      {mode ? (
        <form className="booking-help-form" onSubmit={submit}>
          {mode === "approve" ? <p className="seller-request-warning">The buyer gets {money(request.refundableCents, request.currency)} back and {request.subjectType === "event_order" ? "their tickets stop working" : "the appointment is cancelled"}. This can’t be undone.</p> : null}
          <label>{formCopy[mode].label}<textarea name="message" rows={3} maxLength={2000} required={formCopy[mode].required} minLength={formCopy[mode].required ? 5 : undefined} placeholder={formCopy[mode].placeholder} /></label>
          {error ? <p role="alert" className="booking-help-error">{error}</p> : null}
          <div className="booking-help-actions">
            <button className={mode === "decline" ? "product-secondary" : "product-primary"} disabled={busy}>{formCopy[mode].button}</button>
            <button type="button" className="booking-help-link" disabled={busy} onClick={() => { setMode(null); setError(""); }}>Cancel</button>
          </div>
        </form>
      ) : open || request.canEscalate ? (
        <div className="booking-help-actions">
          {open && request.kind === "refund" && request.refundableCents > 0 ? <button type="button" className="product-primary" onClick={() => setMode("approve")}>Approve &amp; refund</button> : null}
          {open && request.kind === "refund" ? <button type="button" className="product-secondary" onClick={() => setMode("decline")}>Decline</button> : null}
          {open && request.kind === "complaint" ? <button type="button" className="product-primary" onClick={() => setMode("resolve")}>Reply &amp; resolve</button> : null}
          {request.canEscalate ? <button type="button" className="booking-help-link" onClick={() => setMode("escalate")}>Ask Tivorah</button> : null}
          {request.eventId && showTitle ? <Link className="booking-help-link" href={`/business/events/${request.eventId}`}>Open event</Link> : null}
        </div>
      ) : null}
    </article>
  );
}

/** Business-wide inbox: every event and service. */
export function BusinessRequests() {
  const { data, loading, error, retry } = useSellerRequests();
  const [kind, setKind] = useState<RequestKind>("refund");
  return (
    <div className="seller-requests-page">
      <nav className="account-ticket-breadcrumb" aria-label="Breadcrumb"><Link href="/business">Business</Link><span aria-hidden="true">›</span><span aria-current="page">Refunds &amp; complaints</span></nav>
      <h1>Refunds &amp; complaints</h1>
      <nav className="event-manage-tabs" aria-label="Request type">
        {(["refund", "complaint"] as const).map((value) => {
          const count = openCount(data, value);
          return <button key={value} type="button" aria-pressed={kind === value} onClick={() => setKind(value)}>{value === "refund" ? "Refund requests" : "Complaints"}{count ? <span className="seller-requests-badge" aria-label={`${count} need a reply`}>{count}</span> : null}</button>;
        })}
      </nav>
      <SellerRequests kind={kind} requests={data} loading={loading} error={error} retry={retry} showTitle />
    </div>
  );
}
