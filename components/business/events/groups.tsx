"use client";
import { LoadingState } from "../../ui/loading-state";
import { FormEvent, useState } from "react";
import { Pagination, usePagedList } from "../../ui/pagination";
import { usePrivateResource } from "../../../hooks/use-private-resource";
import { useMutation } from "../../../hooks/use-mutation";
import { ManagedEvent } from "./types";
import { SelectField } from "../../ui/select-field";

// Group bookings: large orders (21–120 tickets) that go beyond the normal
// per-person limit, e.g. a school, company or club. The organiser emails the
// buyer a private payment link; the tickets are set aside while they pay and go
// back on sale if the link expires.
type Group = { id: number; buyerEmail: string; quantity: number; status: string; expiresAt: string };
type GroupRequest = { id: number; name: string; email: string; organisation: string | null; quantity: number; message: string | null; status: string; ticketTypeId: number | null; createdAt: string };

// Requests sent from "Book as a group" on the event page.
function GroupRequests({ event, onChanged }: { event: ManagedEvent; onChanged: () => void }) {
  const { data, retry } = usePrivateResource<{ requests: GroupRequest[] }>(`/events/${event.id}/group-requests`);
  const mutation = useMutation(() => { retry(); onChanged(); });
  const [answering, setAnswering] = useState<number | null>(null);
  const open = (data?.requests ?? []).filter((request) => request.status === "new");
  if (!open.length) return null;
  return <div className="group-requests">
    <h3>New requests <span>{open.length}</span></h3>
    <ul>{open.map((request) => <li key={request.id}>
      <div className="group-request-main">
        <strong>{request.name}{request.organisation ? <span> · {request.organisation}</span> : null}</strong>
        <span>{request.quantity} people · {request.email} · {new Date(request.createdAt).toLocaleDateString("en-AU", { day: "numeric", month: "short" })}</span>
        {request.message ? <p>“{request.message}”</p> : null}
      </div>
      {answering === request.id ? <form className="group-request-answer event-group-fields" onSubmit={(e) => {
        e.preventDefault();
        const form = new FormData(e.currentTarget);
        void mutation.run(`/events/${event.id}/group-requests/${request.id}/invite`, "POST", { ticketTypeId: Number(form.get("ticket")), quantity: Number(form.get("quantity")), expiresInHours: Number(form.get("hours")) }, `Payment link sent to ${request.email}.`).then((ok) => { if (ok) setAnswering(null); });
      }}>
        <p className="showcase-hint">Confirm the ticket package and quantity before emailing {request.email}.</p>
        <div className="showcase-row">
          <label>Ticket package<SelectField name="ticket" label="Ticket package" defaultValue={String(request.ticketTypeId ?? event.ticketTypes[0]?.id ?? "")} options={event.ticketTypes.map((t) => ({ value: String(t.id), label: t.name }))} /></label>
          <label>Tickets<input type="number" name="quantity" min={21} max={120} defaultValue={Math.min(120, Math.max(21, request.quantity))} required /></label>
        </div>
        <details className="event-group-timing"><summary>Payment link timing</summary><label>Link expires after<SelectField name="hours" label="Link expires after" defaultValue="24" options={[{ value: "12", label: "12 hours" }, { value: "24", label: "24 hours" }, { value: "48", label: "48 hours" }]} /></label></details>
        <div className="event-group-form-actions">
          <button type="button" className="showcase-link" onClick={() => setAnswering(null)}>Cancel</button>
          <button className="product-primary press-fx" disabled={mutation.busy}>{mutation.busy ? "Sending…" : "Email the payment link"}</button>
        </div>
      </form> : <div className="event-group-actions">
        <button type="button" className="product-primary press-fx" onClick={() => setAnswering(request.id)}>Send payment link</button>
        <button type="button" className="showcase-link" disabled={mutation.busy} onClick={() => void mutation.run(`/events/${event.id}/group-requests/${request.id}/decline`, "POST", undefined, "Request declined.")}>Decline</button>
      </div>}
    </li>)}</ul>
    {mutation.error ? <p className="product-error" role="alert">{mutation.error}</p> : null}
    {mutation.notice ? <p className="product-notice" role="status">{mutation.notice}</p> : null}
  </div>;
}

const statusLabel: Record<string, [string, string]> = {
  held: ["Waiting for payment", "is-waiting"],
  used: ["Booked", "is-booked"],
  expired: ["Link expired", "is-ended"],
  cancelled: ["Cancelled", "is-ended"],
};
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export function EventGroups({ event }: { event: ManagedEvent }) {
  const { data, loading, error, retry } = usePrivateResource<{ allocations: Group[] }>(`/events/${event.id}/group-allocations`);
  const mutation = useMutation(retry);
  const [email, setEmail] = useState("");
  const [touched, setTouched] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const emailValid = emailPattern.test(email.trim());

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setTouched(true);
    if (!emailValid) return;
    const form = new FormData(e.currentTarget);
    const saved = await mutation.run(
      `/events/${event.id}/group-allocations`,
      "POST",
      { ticketTypeId: Number(form.get("ticket")), buyerEmail: email.trim().toLowerCase(), quantity: Number(form.get("quantity")), expiresInHours: Number(form.get("hours")) },
      `Payment link sent to ${email.trim().toLowerCase()}.`,
    );
    if (saved) { setEmail(""); setTouched(false); setShowForm(false); }
  }

  const groups = data?.allocations ?? [];
  const pages = usePagedList(groups);

  return (
    <section className="event-groups">
      <header className="event-tab-head">
        <div>
          <h2>Group bookings</h2>
          <p>Reserve 21–120 tickets and send one payment link to a school, company or club.</p>
        </div>
        {!showForm ? <button type="button" className="product-primary press-fx" onClick={() => setShowForm(true)} disabled={!event.ticketTypes.length}>Send a group payment link</button> : null}
      </header>

      {showForm ? <form className="showcase-step event-group-form" onSubmit={submit}>
        <div className="event-group-form-head">
          <h3>Send a group payment link</h3>
          <p className="showcase-hint">The buyer gets one private link. Their tickets are reserved until the link expires.</p>
        </div>
        <div className="event-group-fields">
        <label>Buyer’s email
          <span className={`email-field${touched && !emailValid ? " is-invalid" : ""}`}>
            <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="5" width="18" height="14" rx="2.5" /><path d="m4 7 8 6 8-6" /></svg>
            <input type="email" name="email" inputMode="email" autoComplete="email" autoCapitalize="none" spellCheck={false} maxLength={254} placeholder="name@company.com.au" value={email}
              onChange={(e) => setEmail(e.target.value.replace(/\s/g, ""))} onBlur={() => setTouched(true)} aria-invalid={touched && !emailValid} aria-describedby="group-email-hint" required />
          </span>
          <span id="group-email-hint" className={touched && !emailValid ? "field-error" : "showcase-hint"}>{touched && !emailValid ? "Enter a full email address, like name@company.com.au." : "The buyer signs in with this address to pay."}</span>
        </label>
        <div className="showcase-row">
          <label>Ticket package<SelectField name="ticket" label="Ticket package" required defaultValue={event.ticketTypes[0] ? String(event.ticketTypes[0].id) : ""} options={event.ticketTypes.map((t) => ({ value: String(t.id), label: t.name }))} /></label>
          <label>Number of tickets<input type="number" name="quantity" min={21} max={120} defaultValue={21} required /></label>
        </div>
        <details className="event-group-timing"><summary>Payment link timing <span>24 hours by default</span></summary>
          <label>Link expires after<SelectField name="hours" label="Link expires after" defaultValue="24" options={[{ value: "12", label: "12 hours" }, { value: "24", label: "24 hours" }, { value: "48", label: "48 hours" }]} /></label>
          <p className="showcase-hint">Unpaid tickets return to sale when the link expires.</p>
        </details>
        </div>
        <div className="event-group-form-actions">
          <button type="button" className="showcase-link" onClick={() => setShowForm(false)}>Cancel</button>
          <button className="product-primary press-fx" disabled={mutation.busy}>{mutation.busy ? "Sending…" : "Email the payment link"}</button>
        </div>
      </form> : null}

      <GroupRequests event={event} onChanged={retry} />
      {mutation.error ? <p className="product-error" role="alert">{mutation.error}</p> : null}
      {mutation.notice ? <p className="product-notice" role="status">{mutation.notice}</p> : null}
      {loading ? <LoadingState label="Loading group bookings…" refreshing={!!data} /> : null}
      {error ? <p role="alert">{error} <button onClick={retry}>Try again</button></p> : null}

      {data && !error ? (groups.length ? <>
        <ul className="event-group-list">
          {pages.visible.map((group) => {
            const [label, tone] = statusLabel[group.status] ?? [group.status, "is-ended"];
            return <li key={group.id}>
              <div className="event-group-main">
                <strong>{group.buyerEmail}</strong>
                <span>{group.quantity} tickets{group.status === "held" ? ` · link expires ${new Date(group.expiresAt).toLocaleString("en-AU", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" })}` : ""}</span>
              </div>
              <span className={`event-group-status ${tone}`}>{label}</span>
              {group.status === "held" ? <div className="event-group-actions">
                <button type="button" className="showcase-link" disabled={mutation.busy} onClick={() => mutation.run(`/events/${event.id}/group-allocations/${group.id}/resend`, "POST", undefined, "Payment link sent again.")}>Resend link</button>
                <button type="button" className="showcase-link is-danger" disabled={mutation.busy} onClick={() => { if (window.confirm(`Cancel this group booking? The ${group.quantity} tickets go back on sale.`)) void mutation.run(`/events/${event.id}/group-allocations/${group.id}/cancel`, "POST", undefined, "Group booking cancelled. The tickets are back on sale."); }}>Cancel</button>
              </div> : null}
            </li>;
          })}
        </ul>
        <Pagination page={pages.page} pageCount={pages.pageCount} label="Group booking" onChange={pages.setPage} />
      </> : !showForm ? <div className="event-empty event-groups-empty">
        <span className="event-groups-empty-icon" aria-hidden="true">✉</span>
        <strong>No group bookings yet</strong>
        <p>Payment links you send will appear here. Buyer requests appear above.</p>
      </div> : null) : null}
    </section>
  );
}
