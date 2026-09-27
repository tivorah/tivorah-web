"use client";
import { useRef, useState } from "react";
import { BrandedQrCode } from "../../app/branded-qr-code";
import { ticketImage } from "../../app/event-orders/[id]/ticket-image";
import { useMutation } from "../../hooks/use-mutation";

export type AccountTicket = {
  publicId: string;
  orderId: number;
  shortCode: string;
  status: string;
  checkedInAt: string | null;
  qrPayload: string | null;
  canManage: boolean;
  attendeeName: string | null;
  event: { title: string; startsAt: string; location: string | null };
  ticketType: { name: string };
};

export function TicketPass({ ticket, refresh, disabled }: { ticket: AccountTicket; refresh: () => void; disabled: boolean }) {
  const pass = useRef<HTMLElement>(null);
  const lock = useRef(false);
  const [saving, setSaving] = useState(false);
  const [exportError, setExportError] = useState("");
  const [action, setAction] = useState<"name" | "invite" | null>(null);
  const mutation = useMutation(refresh);
  const valid = ticket.status === "valid" && !ticket.checkedInAt && !!ticket.qrPayload;
  const status = ticket.checkedInAt ? "Checked in" : valid ? "Ready for entry" : "Not valid for entry";
  const date = new Date(ticket.event.startsAt).toLocaleString("en-AU", { dateStyle: "full", timeStyle: "short" });
  async function download() {
    if (lock.current || disabled || !valid) return;
    lock.current = true;
    setSaving(true);
    setExportError("");
    try {
      const qrSvg = pass.current?.querySelector<SVGElement>('svg[role="img"]')?.outerHTML;
      if (!qrSvg) throw new Error("Your entry code is still loading. Please try again.");
      const file = await ticketImage({ title: ticket.event.title, date, location: ticket.event.location || "See event details", admission: ticket.ticketType.name, position: 1, count: 1, code: ticket.shortCode || ticket.publicId, orderId: ticket.orderId, qrSvg, status });
      const url = URL.createObjectURL(file);
      const link = document.createElement("a");
      link.href = url;
      link.download = file.name;
      link.click();
      window.setTimeout(() => URL.revokeObjectURL(url), 10000);
    } catch (error) {
      setExportError(error instanceof Error ? error.message : "Could not download your ticket.");
    } finally { lock.current = false; setSaving(false); }
  }
  return <article className="event-pass" ref={pass}>
    <div className="ticket-pass-top"><span className="event-eyebrow">TIVORAH EVENT PASS</span></div>
    <h2>{ticket.event.title}</h2>
    <p className="ticket-admission">{ticket.ticketType.name}{ticket.attendeeName ? ` · ${ticket.attendeeName}` : ""}</p>
    <div className="ticket-entry">
      <p className="event-status-label">{status}</p>
      {valid ? <><BrandedQrCode value={ticket.qrPayload!} ariaLabel={`Entry code for ${ticket.event.title}`} size={240} /><p className="event-help">Show this code at the entrance</p></> : <p>This ticket cannot be used for entry.</p>}
      <p className="ticket-code-label">Entry code</p><div className="ticket-code"><code>{ticket.shortCode || ticket.publicId}</code></div>
    </div>
    <div className="ticket-pass-bottom"><p>{date}</p><p>{ticket.event.location}</p><span>Booking reference #{ticket.orderId}</span></div>
    <div className="ticket-individual-actions">
      <button className="event-primary" disabled={disabled || saving || !valid} onClick={() => void download()}>{saving ? "Preparing…" : "Download ticket"}</button>
      {ticket.canManage && <>
        <button className="event-secondary" disabled={disabled || mutation.busy} aria-expanded={action === "name"} onClick={() => setAction(action === "name" ? null : "name")}>Name on ticket</button>
        <button className="event-secondary" disabled={disabled || mutation.busy} aria-expanded={action === "invite"} onClick={() => setAction(action === "invite" ? null : "invite")}>Send to a friend</button>
      </>}
    </div>
    {action && ticket.canManage && <form className="ticket-invite-form" key={action} onSubmit={async event => {
      event.preventDefault();
      const value = String(new FormData(event.currentTarget).get("value") || "").trim();
      const success = await mutation.run(`/events/tickets/${ticket.publicId}/${action === "name" ? "attendee" : "invite"}`, action === "name" ? "PATCH" : "POST", action === "name" ? { name: value || null } : { email: value }, action === "name" ? "Ticket name updated." : "Invitation sent. Your friend will receive an email to accept the ticket.");
      if (success) setAction(null);
    }}>
      <p>{action === "invite" ? "Once your friend accepts, they receive a new entry code and this ticket stops working." : "Adding a name is optional. Leave it blank to remove the name."}</p>
      <label htmlFor={`ticket-input-${ticket.publicId}`}>{action === "name" ? "Name on ticket" : "Friend’s email"}</label>
      <input id={`ticket-input-${ticket.publicId}`} name="value" type={action === "name" ? "text" : "email"} required={action === "invite"} minLength={action === "name" ? 2 : undefined} maxLength={action === "name" ? 100 : 254} defaultValue={action === "name" ? ticket.attendeeName || "" : ""} disabled={disabled || mutation.busy} />
      <button className="event-primary" disabled={disabled || mutation.busy}>{mutation.busy ? "Saving…" : action === "name" ? "Save name" : "Send invitation"}</button>
    </form>}
    {mutation.notice && <p className="ticket-invite-form" role="status">{mutation.notice}</p>}
    {(mutation.error || exportError) && <p className="ticket-invite-form" role="alert">{mutation.error || exportError}</p>}
  </article>;
}
