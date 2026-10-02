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
  /** Name printed on downloads: the name on the ticket, else the account holder. */
  holderName?: string | null;
  /** An invitation sent to a friend that has not been accepted yet. */
  pendingTransfer?: { email: string; expiresAt: string } | null;
  event: { title: string; startsAt: string; endsAt?: string | null; location: string | null };
  ticketType: { name: string };
};

export function TicketPass({ ticket, refresh, disabled, past = false }: { ticket: AccountTicket; refresh: () => void; disabled: boolean; past?: boolean }) {
  const pass = useRef<HTMLElement>(null);
  const lock = useRef(false);
  const [saving, setSaving] = useState(false);
  const [exportError, setExportError] = useState("");
  const [copyState, setCopyState] = useState("");
  const [action, setAction] = useState<"name" | "invite" | null>(null);
  // Transfers are permanent once accepted, so the email is confirmed before anything is sent.
  const [confirmEmail, setConfirmEmail] = useState<string | null>(null);
  const mutation = useMutation(refresh);
  const valid = !past && ticket.status === "valid" && !ticket.checkedInAt && !!ticket.qrPayload;
  const entryCode = /^\d{6}$/.test(ticket.shortCode || "") ? ticket.shortCode : null;
  const status = ticket.checkedInAt ? past ? "Attended" : "Checked in" : past ? "Event ended" : valid ? "Ready for entry" : "Not valid for entry";
  const date = new Date(ticket.event.startsAt).toLocaleString("en-AU", { dateStyle: "full", timeStyle: "short" });
  async function download() {
    if (lock.current || disabled || !valid) return;
    lock.current = true;
    setSaving(true);
    setExportError("");
    try {
      const qrSvg = pass.current?.querySelector<SVGElement>('svg[role="img"]')?.outerHTML;
      if (!qrSvg) throw new Error("Your entry code is still loading. Please try again.");
      if (!entryCode) throw new Error("Your entry code is not ready. Refresh your tickets and try again.");
      const file = await ticketImage({ title: ticket.event.title, date, location: ticket.event.location || "See event details", admission: ticket.ticketType.name, position: 1, count: 1, code: entryCode, orderId: ticket.orderId, qrSvg, status, holderName: ticket.holderName ?? ticket.attendeeName });
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
      {valid ? <><BrandedQrCode value={ticket.qrPayload!} ariaLabel={`Entry code for ${ticket.event.title}`} size={240} /><p className="event-help">Show this code at the entrance</p></> : <p>{past && ticket.checkedInAt ? "You checked in and attended this event. Your booking stays here briefly for your records." : past ? "This event has ended. Your booking stays here for your records." : "This ticket cannot be used for entry."}</p>}
      <p className="ticket-code-label">Entry code</p><div className="ticket-code"><code>{entryCode || "Unavailable"}</code>{entryCode ? <button type="button" aria-label="Copy entry code" title="Copy entry code" onClick={() => void navigator.clipboard.writeText(entryCode).then(() => setCopyState("Copied")).catch(() => setCopyState("Could not copy. Select the code to copy it."))}><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true"><rect x="8" y="8" width="12" height="12" rx="2" /><path d="M16 8V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h3" /></svg></button> : null}</div><span className="ticket-copy-feedback" role="status">{copyState}</span>
    </div>
    <div className="ticket-pass-bottom"><p>{date}</p><p>{ticket.event.location}</p><span>Booking reference #{ticket.orderId}</span></div>
    <div className="ticket-individual-actions">
      <button className="event-primary" disabled={disabled || saving || !valid || !entryCode} onClick={() => void download()}>{saving ? "Preparing…" : "Download ticket"}</button>
      {ticket.canManage && !past && <>
        <button className="event-secondary" disabled={disabled || mutation.busy} aria-expanded={action === "name"} onClick={() => setAction(action === "name" ? null : "name")}>Name on ticket</button>
        <button className="event-secondary" disabled={disabled || mutation.busy} aria-expanded={action === "invite"} onClick={() => { setConfirmEmail(null); setAction(action === "invite" ? null : "invite"); }}>{ticket.pendingTransfer ? "Change transfer" : "Send to a friend"}</button>
      </>}
    </div>
    {ticket.pendingTransfer && !past && <div className="ticket-transfer-pending" role="status">
      <strong>Transfer pending</strong>
      <p>Waiting for {ticket.pendingTransfer.email} to accept. You can still use this ticket until they do. The invitation expires {new Date(ticket.pendingTransfer.expiresAt).toLocaleString("en-AU", { dateStyle: "medium", timeStyle: "short" })}.</p>
    </div>}
    {action === "invite" && confirmEmail && ticket.canManage && !past && <div className="ticket-transfer-confirm" role="alertdialog" aria-labelledby={`transfer-title-${ticket.publicId}`} aria-describedby={`transfer-body-${ticket.publicId}`}>
      <h3 id={`transfer-title-${ticket.publicId}`}>Transfer this ticket to {confirmEmail}?</h3>
      <ul id={`transfer-body-${ticket.publicId}`}>
        <li>We’ll email your friend a private link to accept it within 48 hours.</li>
        <li>When they accept, the ticket <strong>moves out of your account</strong> and they get their own entry code.</li>
        <li>Your QR code and entry code, <strong>including any copy you downloaded</strong>, will stop working.</li>
        <li>Until they accept, you can still use this ticket.</li>
      </ul>
      <div className="ticket-transfer-actions">
        <button type="button" className="event-secondary" disabled={mutation.busy} onClick={() => setConfirmEmail(null)}>Change email</button>
        <button type="button" className="event-primary" disabled={disabled || mutation.busy} autoFocus onClick={async () => {
          const success = await mutation.run(`/events/tickets/${ticket.publicId}/invite`, "POST", { email: confirmEmail }, `Transfer sent to ${confirmEmail}. We’ll let you know here and by email when they accept.`);
          if (success) { setAction(null); setConfirmEmail(null); }
        }}>{mutation.busy ? "Sending…" : "Yes, transfer ticket"}</button>
      </div>
    </div>}
    {action && !(action === "invite" && confirmEmail) && ticket.canManage && !past && <form className="ticket-invite-form" key={action} onSubmit={async event => {
      event.preventDefault();
      const value = String(new FormData(event.currentTarget).get("value") || "").trim();
      if (action === "invite") { setConfirmEmail(value); return; }
      const success = await mutation.run(`/events/tickets/${ticket.publicId}/${action === "name" ? "attendee" : "invite"}`, action === "name" ? "PATCH" : "POST", action === "name" ? { name: value || null } : { email: value }, action === "name" ? "Ticket name updated." : "Invitation sent. Your friend will receive an email to accept the ticket.");
      if (success) setAction(null);
    }}>
      <p>{action === "invite" ? "Sending a ticket transfers it. Once your friend accepts, it leaves your account and your copy stops working." : "Adding a name is optional. Leave it blank to remove the name."}</p>
      <label htmlFor={`ticket-input-${ticket.publicId}`}>{action === "name" ? "Name on ticket" : "Friend’s email"}</label>
      <input id={`ticket-input-${ticket.publicId}`} name="value" type={action === "name" ? "text" : "email"} required={action === "invite"} minLength={action === "name" ? 2 : undefined} maxLength={action === "name" ? 100 : 254} defaultValue={action === "name" ? ticket.attendeeName || "" : ticket.pendingTransfer?.email || ""} disabled={disabled || mutation.busy} />
      <button className="event-primary" disabled={disabled || mutation.busy}>{mutation.busy ? "Saving…" : action === "name" ? "Save name" : "Continue"}</button>
    </form>}
    {mutation.notice && <p className="ticket-invite-form" role="status">{mutation.notice}</p>}
    {(mutation.error || exportError) && <p className="ticket-invite-form" role="alert">{mutation.error || exportError}</p>}
  </article>;
}
