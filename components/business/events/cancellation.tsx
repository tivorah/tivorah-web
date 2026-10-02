"use client";
import { useEffect, useRef, useState } from "react";
import { api } from "../../../lib/api/client";
import { money } from "../../../lib/api/discovery";
import { usePrivateResource } from "../../../hooks/use-private-resource";
import { useMutation } from "../../../hooks/use-mutation";

// Cancelling an event with refunds (see the API's services/eventCancellation.ts).
// Every paid order is refunded by default. The organiser may leave someone out only
// with a reason, and that buyer is then asked by email to confirm — no answer within
// 7 days means they're refunded. The organiser can't remove a refund on their own.

type Order = { id: number; buyerName: string; ticketName: string; quantity: number; totalCents: number; status: string };
type Reason = "refunded_directly" | "new_date_agreed";
const reasons: { value: Reason; label: string }[] = [
  { value: "refunded_directly", label: "I already refunded them directly" },
  { value: "new_date_agreed", label: "They agreed to move to a new date" },
];

export function CancelEventDialog({ eventId, title, open, onClose, onCancelled }: { eventId: number; title: string; open: boolean; onClose: () => void; onCancelled: () => void }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [orders, setOrders] = useState<Order[] | null>(null);
  const [loadError, setLoadError] = useState("");
  const [waivers, setWaivers] = useState<Record<number, Reason | "">>({});
  const [typed, setTyped] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const element = dialog.current;
    if (!element) return;
    if (open && !element.open) element.showModal();
    if (!open && element.open) element.close();
    if (!open) { setTyped(""); setWaivers({}); setError(""); return; }
    setOrders(null); setLoadError("");
    api<{ orders: Order[] }>(`/events/${eventId}/orders`)
      .then((data) => setOrders(data.orders.filter((order) => order.status === "confirmed")))
      .catch((cause) => setLoadError(cause instanceof Error ? cause.message : "Orders couldn’t load."));
  }, [open, eventId]);

  const paid = (orders ?? []).filter((order) => order.totalCents > 0);
  const free = (orders ?? []).filter((order) => order.totalCents === 0);
  const leftOut = paid.filter((order) => order.id in waivers);
  const refundTotal = paid.filter((order) => !(order.id in waivers)).reduce((sum, order) => sum + order.totalCents, 0);
  const missingReason = leftOut.some((order) => !waivers[order.id]);

  async function confirm() {
    setBusy(true); setError("");
    try {
      await api(`/events/${eventId}/cancel`, { method: "POST", body: JSON.stringify({ waivers: leftOut.map((order) => ({ orderId: order.id, reason: waivers[order.id] })) }) });
      onCancelled();
      onClose();
    } catch (cause) { setError(cause instanceof Error ? cause.message : "The event couldn’t be cancelled."); }
    finally { setBusy(false); }
  }

  return <dialog ref={dialog} className="event-cancel-dialog is-wide" aria-labelledby="cancel-event-title" onCancel={(event) => { event.preventDefault(); onClose(); }}>
    <header className="event-cancel-head">
      <h2 id="cancel-event-title">Cancel “{title}”</h2>
      <button type="button" className="event-cancel-close" onClick={onClose} aria-label="Close">×</button>
    </header>
    <ul className="event-cancel-points">
      <li>Every ticket stops working and every ticket holder is emailed.</li>
      <li>Paid orders are refunded in full to the original payment method, automatically.</li>
      <li>The event stays in your list until refunds finish. It can’t be booked again.</li>
    </ul>

    {loadError ? <p className="field-error" role="alert">{loadError}</p> : !orders ? <p className="showcase-hint" role="status">Loading orders…</p> : <>
      <div className="event-cancel-summary">
        <div><span>Paid orders</span><strong>{paid.length}</strong></div>
        <div><span>Refunding now</span><strong>{money(refundTotal)}</strong></div>
        <div><span>Free bookings</span><strong>{free.length}</strong></div>
      </div>
      {paid.length ? <>
        <h3>Refunds</h3>
        <p className="showcase-hint">Everyone is refunded. Untick someone only if you already refunded them yourself or they agreed to a new date — we’ll email them to confirm, and refund them if they don’t agree within 7 days.</p>
        <ul className="event-cancel-orders">
          {paid.map((order) => {
            const refunding = !(order.id in waivers);
            return <li key={order.id} className={refunding ? "" : "is-left-out"}>
              <label className="event-cancel-order">
                <input type="checkbox" checked={refunding} onChange={(event) => setWaivers((current) => {
                  const next = { ...current };
                  if (event.target.checked) delete next[order.id]; else next[order.id] = "";
                  return next;
                })} />
                <span><strong>{order.buyerName}</strong><small>#{order.id} · {order.quantity} × {order.ticketName}</small></span>
                <span className="event-cancel-amount">{money(order.totalCents)}</span>
              </label>
              {!refunding ? <select aria-label={`Why ${order.buyerName} isn't being refunded`} value={waivers[order.id]} onChange={(event) => setWaivers((current) => ({ ...current, [order.id]: event.target.value as Reason }))}>
                <option value="">Choose a reason…</option>
                {reasons.map((reason) => <option key={reason.value} value={reason.value}>{reason.label}</option>)}
              </select> : null}
            </li>;
          })}
        </ul>
        {leftOut.length ? <p className="event-cancel-note">{leftOut.length} {leftOut.length === 1 ? "buyer" : "buyers"} will be asked to confirm by email. If they don’t agree, they’ll be refunded.</p> : null}
      </> : <p className="showcase-hint">There are no paid orders, so nothing needs refunding.</p>}
    </>}

    <label className="event-cancel-confirm"><span>Type <strong>CANCEL</strong> to confirm</span><input value={typed} onChange={(event) => setTyped(event.target.value)} autoComplete="off" autoCapitalize="characters" /></label>
    {error ? <p className="field-error" role="alert">{error}</p> : null}
    <div className="event-cancel-actions">
      <button type="button" className="product-secondary" onClick={onClose}>Keep event</button>
      <button type="button" className="product-primary is-danger" disabled={busy || !orders || missingReason || typed.trim().toUpperCase() !== "CANCEL"} onClick={() => void confirm()}>
        {busy ? "Cancelling…" : paid.length ? "Cancel event and refund" : "Cancel event"}
      </button>
    </div>
  </dialog>;
}

type Progress = {
  eventStatus: string; total: number; done: number; refunded: number; waived: number; awaitingBuyer: number; failed: number; refundedCents: number;
  jobs: { id: number; orderId: number; buyerName: string; quantity: number; totalCents: number; status: string; waiverReason: string | null; decisionDeadline: string | null; lastError: string | null }[];
};
const jobLabel: Record<string, string> = { queued: "Refund queued", processing: "Refunding…", succeeded: "Refunded", failed: "Refund failed", awaiting_buyer: "Waiting for buyer", waived: "Buyer agreed — no refund" };

/** Shown on a cancelled event: refund progress, buyers still deciding, and failed refunds. */
export function RefundProgress({ eventId }: { eventId: number }) {
  const { data, retry } = usePrivateResource<Progress>(`/events/${eventId}/refunds`);
  const mutation = useMutation(retry);
  useEffect(() => {
    if (!data || data.eventStatus !== "cancelling") return;
    const timer = window.setInterval(retry, 10000); // live progress while refunds run
    return () => window.clearInterval(timer);
  }, [data, retry]);
  if (!data || !data.total) return null;
  const percent = Math.round((data.done / data.total) * 100);
  return <section className="refund-progress" aria-label="Refund progress">
    <div className="refund-progress-head">
      <div>
        <strong>{data.eventStatus === "cancelled" ? "Cancellation complete" : `Refunds ${data.done}/${data.total} done`}</strong>
        <span>{money(data.refundedCents)} refunded{data.awaitingBuyer ? ` · ${data.awaitingBuyer} waiting for the buyer’s answer` : ""}{data.failed ? ` · ${data.failed} need attention` : ""}</span>
      </div>
      <span className="refund-progress-percent">{percent}%</span>
    </div>
    <div className="refund-progress-bar" role="progressbar" aria-valuenow={percent} aria-valuemin={0} aria-valuemax={100}><span style={{ width: `${percent}%` }} /></div>
    <details className="refund-progress-list">
      <summary>See every refund</summary>
      <ul>{data.jobs.map((job) => <li key={job.id} className={`is-${job.status}`}>
        <span><strong>{job.buyerName}</strong><small>#{job.orderId} · {job.quantity} tickets · {money(job.totalCents)}</small></span>
        <span className="refund-job-status">{jobLabel[job.status] ?? job.status}{job.status === "awaiting_buyer" && job.decisionDeadline ? ` (until ${new Date(job.decisionDeadline).toLocaleDateString("en-AU", { day: "numeric", month: "short" })})` : ""}</span>
        {job.status === "failed" ? <button type="button" className="showcase-link" disabled={mutation.busy} onClick={() => void mutation.run(`/events/${eventId}/refunds/${job.id}/retry`, "POST", undefined, "Refund queued again.")}>Retry</button> : null}
      </li>)}</ul>
    </details>
    {mutation.error ? <p className="field-error" role="alert">{mutation.error}</p> : null}
  </section>;
}
