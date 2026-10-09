"use client";
import { FormEvent, useCallback, useEffect, useState } from "react";
import { money } from "../../lib/api/discovery";
import { requestKindLabel, requestStatusLabel, type ManagedBookingRequest } from "../../lib/booking-requests";

const when = (value: string | null) => value ? new Date(value).toLocaleString("en-AU", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" }) : "—";

/**
 * Refund requests and complaints that a buyer or seller sent to Tivorah. Staff can refund the
 * remaining amount through Stripe (same path as a seller approval) or close the case with a note.
 * Both outcomes notify the buyer and seller and are written to the audit log.
 */
export function Escalations({ request }: { request: (path: string, init?: RequestInit) => Promise<ManagedBookingRequest[] | ManagedBookingRequest> }) {
  const [filter, setFilter] = useState<"escalated" | "all">("escalated");
  const [rows, setRows] = useState<ManagedBookingRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState<number | null>(null);
  const load = useCallback(async () => {
    setLoading(true); setError("");
    try { setRows(await request(`/api/v1/admin/booking-requests?status=${filter}`) as ManagedBookingRequest[]); }
    catch (cause) { setError(cause instanceof Error ? cause.message : "Could not load cases."); }
    finally { setLoading(false); }
  }, [request, filter]);
  useEffect(() => { void load(); }, [load]);

  async function resolve(event: FormEvent<HTMLFormElement>, row: ManagedBookingRequest) {
    event.preventDefault();
    const submitter = (event.nativeEvent as SubmitEvent).submitter as HTMLButtonElement | null;
    const action = submitter?.value === "refund" ? "refund" : "close";
    const note = String(new FormData(event.currentTarget).get("note") || "").trim();
    if (action === "refund" && !window.confirm(`Refund ${money(row.refundableCents, row.currency)} to ${row.buyer.name}? This can’t be undone.`)) return;
    setBusy(row.id); setError("");
    try { await request(`/api/v1/admin/booking-requests/${row.id}/resolve`, { method: "POST", body: JSON.stringify({ action, note }) }); await load(); }
    catch (cause) { setError(cause instanceof Error ? cause.message : "Could not update this case."); }
    finally { setBusy(null); }
  }

  return (
    <section className="panel escalations">
      <h3>Refund &amp; complaint escalations</h3>
      <p>Cases a buyer or seller asked Tivorah to review. Refunding pulls the money back from the seller’s connected account.</p>
      <div className="escalations-filter" role="group" aria-label="Show">
        <button type="button" aria-pressed={filter === "escalated"} onClick={() => setFilter("escalated")}>Needs review</button>
        <button type="button" aria-pressed={filter === "all"} onClick={() => setFilter("all")}>All requests</button>
      </div>
      {error ? <p role="alert" className="escalations-error">{error}</p> : null}
      {loading ? <p className="admin-empty">Loading cases…</p> : rows.length === 0 ? <p className="admin-empty">{filter === "escalated" ? "No cases waiting for Tivorah." : "No refund requests or complaints yet."}</p> : rows.map((row) => (
        <article key={row.id} className="escalation">
          <header>
            <div>
              <strong>{requestKindLabel[row.kind]} #{row.id} · {row.title}</strong>
              <small>{row.subjectType === "event_order" ? "Ticket order" : "Service appointment"} #{row.bookingId} · {money(row.totalCents, row.currency)} paid · {money(row.refundableCents, row.currency)} refundable · booking {row.bookingStatus?.replaceAll("_", " ")}</small>
            </div>
            <span>{requestStatusLabel[row.status]}</span>
          </header>
          <dl>
            <div><dt>Buyer</dt><dd>{row.buyer.name} · {row.buyer.email}</dd></div>
            <div><dt>Reason</dt><dd>{row.reason}</dd></div>
            <div><dt>Buyer’s message · {when(row.createdAt)}</dt><dd>{row.message}</dd></div>
            {row.sellerResponse ? <div><dt>Seller’s reply · {when(row.respondedAt)}</dt><dd>{row.sellerResponse}</dd></div> : null}
            {row.escalationNote ? <div><dt>Escalation note · {when(row.escalatedAt)}</dt><dd>{row.escalationNote}</dd></div> : null}
            {row.staffNote ? <div><dt>Tivorah decision · {when(row.resolvedAt)}</dt><dd>{row.staffNote}</dd></div> : null}
          </dl>
          {row.status === "escalated" ? (
            <form onSubmit={(event) => void resolve(event, row)}>
              <label>Decision note (sent to buyer and seller)<textarea name="note" required minLength={5} maxLength={2000} rows={3} /></label>
              <div className="escalation-actions">
                {row.refundableCents > 0 ? <button name="action" value="refund" disabled={busy !== null}>{busy === row.id ? "Working…" : `Refund ${money(row.refundableCents, row.currency)}`}</button> : null}
                <button name="action" value="close" className="secondary" disabled={busy !== null}>Close without refund</button>
              </div>
            </form>
          ) : null}
        </article>
      ))}
    </section>
  );
}
