"use client";
import { useState, type FormEvent } from "react";
import "./booking-help.css";
import { usePrivateResource } from "../../hooks/use-private-resource";
import { api } from "../../lib/api/client";
import { money } from "../../lib/api/discovery";
import { requestKindLabel, requestStatusLabel, type BookingRequest, type RequestKind, type RequestOptions } from "../../lib/booking-requests";
import { SelectField } from "../ui/select-field";

const dateText = (value: string) => new Date(value).toLocaleDateString("en-AU", { day: "numeric", month: "short", year: "numeric" });

/**
 * Buyer side of refunds and complaints for one booking: the seller's refund policy, buttons to
 * request a refund (only while the policy allows it) or report a problem, and the status of
 * anything already sent, with "Ask Tivorah to review" when the buyer isn't happy with the answer.
 */
export function BookingHelp({ subjectType, id }: { subjectType: "event_order" | "service_booking"; id: number }) {
  const { data, error, retry } = usePrivateResource<RequestOptions>(`/booking-requests/options?subjectType=${subjectType}&id=${id}`);
  const [form, setForm] = useState<RequestKind | null>(null);
  const [notice, setNotice] = useState("");
  if (error || !data) return null;

  const done = (message: string) => { setForm(null); setNotice(message); retry(); };
  return (
    <section className="booking-help" aria-labelledby={`booking-help-${id}`}>
      <h3 id={`booking-help-${id}`}>Refunds &amp; problems</h3>
      <p className="booking-help-policy">
        <strong>{data.policy.label ?? "No refund policy set"}</strong>
        <span>{data.policy.deadline && data.canRequestRefund ? `Request by ${dateText(data.policy.deadline)}` : data.policy.summary}</span>
      </p>
      {data.policy.note ? <p className="booking-help-note">{data.policy.note}</p> : null}

      {data.requests.map((request) => <RequestCard key={request.id} request={request} onChange={done} />)}

      {form ? <RequestForm kind={form} options={data} subjectType={subjectType} id={id} onCancel={() => setForm(null)} onSent={done} /> : (
        <div className="booking-help-actions">
          {data.canRequestRefund ? <button type="button" className="product-secondary" onClick={() => { setNotice(""); setForm("refund"); }}>Request a refund</button> : null}
          {data.canComplain ? <button type="button" className="booking-help-link" onClick={() => { setNotice(""); setForm("complaint"); }}>Report a problem</button> : null}
        </div>
      )}
      {notice ? <p role="status" className="booking-help-status">{notice}</p> : null}
    </section>
  );
}

function RequestForm({ kind, options, subjectType, id, onCancel, onSent }: {
  kind: RequestKind; options: RequestOptions; subjectType: string; id: number; onCancel: () => void; onSent: (message: string) => void;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const values = new FormData(event.currentTarget);
    setBusy(true); setError("");
    try {
      await api("/booking-requests", { method: "POST", body: JSON.stringify({ kind, subjectType, id, reason: values.get("reason"), message: values.get("message") }) });
      onSent(kind === "refund" ? "Refund request sent. The seller will reply here and by email." : "Thanks — the seller has been told and will reply here.");
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Couldn’t send. Try again."); }
    finally { setBusy(false); }
  }
  return (
    <form className="booking-help-form" onSubmit={submit}>
      <h4>{kind === "refund" ? `Request a refund of ${money(options.refundableCents, options.currency)}` : "Report a problem"}</h4>
      <label>Reason<SelectField name="reason" label="Reason" required placeholder="Choose a reason" requiredMessage="Choose a reason." options={options.reasons[kind].map((reason) => ({ value: reason, label: reason }))} /></label>
      <label>{kind === "refund" ? "Message to the seller" : "What happened?"}<textarea name="message" required minLength={10} maxLength={2000} rows={3} placeholder={kind === "refund" ? "A short note helps the seller decide" : "Tell the seller what went wrong"} /></label>
      {error ? <p role="alert" className="booking-help-error">{error}</p> : null}
      <div className="booking-help-actions">
        <button className="product-primary" disabled={busy}>{busy ? "Sending…" : kind === "refund" ? "Send refund request" : "Send to seller"}</button>
        <button type="button" className="booking-help-link" disabled={busy} onClick={onCancel}>Cancel</button>
      </div>
    </form>
  );
}

function RequestCard({ request, onChange }: { request: BookingRequest; onChange: (message: string) => void }) {
  const [escalating, setEscalating] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  async function act(path: string, body: unknown, message: string) {
    setBusy(true); setError("");
    try { await api(`/booking-requests/${request.id}/${path}`, { method: "POST", body: JSON.stringify(body) }); onChange(message); }
    catch (cause) { setError(cause instanceof Error ? cause.message : "Couldn’t update. Try again."); }
    finally { setBusy(false); }
  }
  return (
    <article className={`booking-help-request is-${request.status}`}>
      <div className="booking-help-request-head">
        <strong>{requestKindLabel[request.kind]} · {request.reason}</strong>
        <span className="booking-help-chip">{requestStatusLabel[request.status]}</span>
      </div>
      <p className="booking-help-meta">Sent {dateText(request.createdAt)}{request.refundedCents ? ` · ${money(request.refundedCents)} refunded` : ""}</p>
      {request.sellerResponse ? <p className="booking-help-reply"><span>Seller</span>{request.sellerResponse}</p> : null}
      {request.staffNote ? <p className="booking-help-reply"><span>Tivorah</span>{request.staffNote}</p> : null}
      {escalating ? (
        <form className="booking-help-form" onSubmit={(event) => { event.preventDefault(); void act("escalate", { note: new FormData(event.currentTarget).get("note") }, "Sent to Tivorah. We’ll review it and reply by email."); }}>
          <label>What should Tivorah know?<textarea name="note" required minLength={10} maxLength={2000} rows={3} /></label>
          <div className="booking-help-actions">
            <button className="product-primary" disabled={busy}>{busy ? "Sending…" : "Send to Tivorah"}</button>
            <button type="button" className="booking-help-link" disabled={busy} onClick={() => setEscalating(false)}>Cancel</button>
          </div>
        </form>
      ) : (request.canEscalate || request.canWithdraw) ? (
        <div className="booking-help-actions">
          {request.canEscalate && request.status !== "open" ? <button type="button" className="booking-help-link" onClick={() => setEscalating(true)}>Ask Tivorah to review</button> : null}
          {request.canWithdraw ? <button type="button" className="booking-help-link" disabled={busy} onClick={() => void act("withdraw", {}, "Request withdrawn.")}>Withdraw</button> : null}
        </div>
      ) : null}
      {error ? <p role="alert" className="booking-help-error">{error}</p> : null}
    </article>
  );
}
