"use client";
import { useEffect, useRef, useState } from "react";
import { LoadingState } from "../../ui/loading-state";
import { usePrivateResource } from "../../../hooks/use-private-resource";
import { api } from "../../../lib/api/client";
import { money } from "../../../lib/api/discovery";
import { BrandedQrCode } from "../../../app/branded-qr-code";
import { PAGE_SIZE, Pagination } from "../../ui/pagination";

type Order = { id: number; buyerName: string; ticketName: string; quantity: number; totalCents: number; status: string; checkedIn: number; createdAt: string };
type Orders = { orders: Order[]; pagination: { total: number; isMoreData: boolean } };
type OrderDetail = { id: number; buyerName: string; email: string | null; previewEmail: boolean; ticketName: string; quantity: number; totalCents: number; status: string; createdAt: string; confirmationEmailSentAt: string | null; canResend: boolean; tickets: { id: number; attendeeName: string; code: string | null; qrPayload: string | null; status: string; checkedInAt: string | null; transferred: boolean }[] };
const initials = (name: string) => name.split(/\s+/).slice(0, 2).map(part => part[0]?.toUpperCase()).join("");
const plural = (count: number, word: string) => `${count} ${word}${count === 1 ? "" : "s"}`;

function BookingDetail({ eventId, orderId, onClose }: { eventId: number; orderId: number; onClose: () => void }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const { data, loading, error, retry } = usePrivateResource<OrderDetail>(`/events/${eventId}/orders/${orderId}`);
  const [sending, setSending] = useState(false);
  const [notice, setNotice] = useState("");
  const [sendError, setSendError] = useState("");
  const [openTicket, setOpenTicket] = useState<number | null>(null);
  useEffect(() => { const node = dialog.current; if (node && !node.open) node.showModal(); }, []);
  async function resend() {
    setSending(true); setNotice(""); setSendError("");
    try {
      const result = await api<{ sent: boolean; email: string }>(`/events/${eventId}/orders/${orderId}/resend-confirmation`, { method: "POST" });
      setNotice(`Ticket email sent to ${result.email}.`); retry();
    } catch (cause) { setSendError(cause instanceof Error ? cause.message : "The email could not be sent."); }
    finally { setSending(false); }
  }
  return <dialog ref={dialog} className="event-booking-dialog" onClose={onClose} onClick={(event) => { if (event.target === dialog.current) dialog.current.close(); }} aria-labelledby="booking-detail-title">
    <div className="event-booking-dialog-inner">
      <header><div><span className="product-eyebrow">ORDER #{orderId}</span><h2 id="booking-detail-title">Booking details</h2></div><button type="button" className="event-booking-close" aria-label="Close booking details" onClick={() => dialog.current?.close()}>×</button></header>
      {loading ? <LoadingState label="Loading booking…" refreshing={!!data} /> : null}
      {error ? <p role="alert">{error} <button className="product-secondary" onClick={retry}>Retry</button></p> : null}
      {data ? <>
        <div className="event-booking-person"><span className="event-order-avatar" aria-hidden="true">{initials(data.buyerName)}</span><div><strong>{data.buyerName}</strong><span>{data.email || "Email not recorded"}</span></div></div>
        <dl className="event-booking-facts"><div><dt>Package</dt><dd>{data.ticketName}</dd></div><div><dt>Booking</dt><dd>{plural(data.quantity, "ticket")} · {money(data.totalCents)}</dd></div><div><dt>Status</dt><dd className="event-booking-capitalize">{data.status}</dd></div><div><dt>Email</dt><dd>{data.previewEmail ? "Demo address" : data.confirmationEmailSentAt ? "Previously sent" : "Not yet sent"}</dd></div></dl>
        <div className="event-booking-tickets"><h3>Tickets</h3><ul>{data.tickets.map((ticket, index) => <li key={ticket.id}>
          <div className="event-booking-ticket-row"><span className="event-booking-ticket-number">{index + 1}</span><div><strong>{ticket.attendeeName}</strong><span>{ticket.transferred ? "Transferred to another holder" : ticket.checkedInAt ? "Checked in" : ticket.status === "valid" ? "Ready for entry" : ticket.status}</span></div><button type="button" className="event-booking-ticket-view" aria-expanded={openTicket === ticket.id} onClick={() => setOpenTicket(openTicket === ticket.id ? null : ticket.id)}>{openTicket === ticket.id ? "Hide ticket" : "View ticket"}</button></div>
          {openTicket === ticket.id ? <div className="event-booking-pass"><span className="product-eyebrow">TIVORAH EVENT PASS</span><strong>{ticket.attendeeName}</strong><span>{data.ticketName} · {ticket.checkedInAt ? "Checked in" : ticket.transferred ? "Transferred" : ticket.status === "valid" ? "Ready for entry" : ticket.status}</span>{ticket.qrPayload ? <BrandedQrCode value={ticket.qrPayload} ariaLabel={`Entry QR code for ${ticket.attendeeName}`} size={190} /> : null}<span>Entry code</span><code>{ticket.code || "Unavailable"}</code></div> : null}
        </li>)}</ul></div>
        <div className="event-booking-delivery"><div><strong>Ticket email</strong><p>{data.previewEmail ? `Demo address: ${data.email}. Email sending is disabled for this booking.` : data.email ? `Resend the booking confirmation and available tickets to ${data.email}.` : "No email was recorded for this booking. Ask the buyer to contact support."}</p></div><button type="button" className="product-secondary" disabled={!data.canResend || sending} onClick={() => void resend()}>{sending ? "Sending…" : "Resend tickets"}</button></div>
        {notice ? <p className="event-booking-notice" role="status">{notice}</p> : null}{sendError ? <p className="event-booking-error" role="alert">{sendError}</p> : null}
      </> : null}
    </div>
  </dialog>;
}

export function EventRecords({ id }: { id: number }) {
  const [page, setPage] = useState(1);
  const [searchText, setSearchText] = useState("");
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<number | null>(null);
  const trigger = useRef<HTMLButtonElement | null>(null);
  useEffect(() => { const timer = window.setTimeout(() => { setQuery(searchText.trim()); setPage(1); }, 250); return () => window.clearTimeout(timer); }, [searchText]);
  const { data, loading, error, retry } = usePrivateResource<Orders>(`/events/${id}/orders?skip=${(page - 1) * PAGE_SIZE}&take=${PAGE_SIZE}&query=${encodeURIComponent(query)}`);
  const pageCount = Math.max(1, Math.ceil((data?.pagination.total ?? 0) / PAGE_SIZE));
  function closeDetail() { setSelected(null); requestAnimationFrame(() => trigger.current?.focus()); }
  return <section className="event-records">
    <header className="event-tab-head"><div><h2>Bookings</h2></div></header>
    <div className="event-records-toolbar"><label htmlFor="event-order-search">Search bookings</label><div><input id="event-order-search" type="search" value={searchText} onChange={(event) => setSearchText(event.target.value)} placeholder="Buyer, email, package or order number" /><svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="7"/><path d="m16 16 5 5"/></svg></div>{data ? <span role="status">{data.pagination.total} {data.pagination.total === 1 ? "booking" : "bookings"}</span> : null}</div>
    {loading ? <LoadingState label="Loading bookings…" refreshing={!!data} /> : null}
    {error ? <p className="event-records-error" role="alert">{error} <button className="product-secondary" onClick={retry}>Retry bookings</button></p> : null}
    {data ? <div className="event-records-orders">
      {data.orders.length ? <div className="event-order-list"><div className="event-order-columns" aria-hidden="true"><span>Buyer</span><span>Tickets</span><span>Check-in</span><span /></div>{data.orders.map(order => {
        const complete = order.checkedIn >= order.quantity;
        return <button type="button" className="event-order-row" key={order.id} onClick={(event) => { trigger.current = event.currentTarget; setSelected(order.id); }} aria-label={`View order ${order.id} for ${order.buyerName}`}>
          <span className="event-order-main"><strong>{order.buyerName}</strong><span>Order #{order.id} · {order.ticketName}</span></span>
          <span className="event-order-ticket"><strong>{plural(order.quantity, "ticket")}</strong><span>{money(order.totalCents)}</span></span>
          <span className={`event-order-status-text ${order.status === "confirmed" ? complete ? "is-arrived" : "is-pending" : "is-muted"}`}>{order.status === "confirmed" ? complete ? "✓ Checked in" : order.checkedIn ? `${order.checkedIn} of ${order.quantity} checked in` : "Not checked in" : order.status}</span>
          <span className="event-order-view">View tickets <span aria-hidden="true">›</span></span>
        </button>;
      })}</div> : <div className="event-records-empty"><strong>{query ? "No matching bookings" : "No bookings yet"}</strong><p>{query ? "Try a buyer name, email, or order number." : "Bookings will appear here after guests reserve tickets."}</p></div>}
      <Pagination page={page} pageCount={pageCount} label="Booking" busy={loading} onChange={setPage} />
    </div> : null}
    {selected !== null ? <BookingDetail eventId={id} orderId={selected} onClose={closeDetail} /> : null}
  </section>;
}
