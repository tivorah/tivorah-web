'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import { BrandedQrCode } from '../../branded-qr-code';
import { eventApi, eventDate, ticketMoney } from '../../events/api';
type Booking = { order: { id: number; eventId: number; status: string; quantity: number; totalCents: number; currency: string }; event: { title: string; startsAt: string | null; location: string | null; onlineUrl: string | null }; ticketType: { name: string }; tickets: { publicId: string; shortCode: string | null; status: string; checkedInAt: string | null; qrPayload: string | null }[]; checkoutUrl: string | null };
export default function OrderTickets({ orderId }: { orderId: string }) {
  const [booking, setBooking] = useState<Booking | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const token = useRef('');
  const active = useRef(true);
  const refresh = useCallback(async () => {
    if (!token.current) return;
    setLoading(true);
    try {
      const data = await eventApi<Booking>(`/orders/${encodeURIComponent(orderId)}`, { headers: { Authorization: `Bearer ${token.current}` } });
      if (active.current) { setBooking(data); setError(''); }
    } catch (cause) { if (active.current) setError(cause instanceof Error ? cause.message : 'Could not load your tickets.'); }
    finally { if (active.current) setLoading(false); }
  }, [orderId]);
  useEffect(() => {
    active.current = true;
    const fromLink = new URLSearchParams(window.location.hash.slice(1)).get('access');
    let saved = '';
    try { saved = sessionStorage.getItem(`tivorah-event-access:${orderId}`) || ''; } catch { /* Private link still works. */ }
    token.current = fromLink || saved;
    if (fromLink) { try { sessionStorage.setItem(`tivorah-event-access:${orderId}`, fromLink); } catch { /* Keep token in memory. */ } }
    // The token lives in the fragment, never in server logs or referrer headers.
    if (!/^[A-Za-z0-9_-]{43}$/.test(token.current) || !/^[1-9]\d*$/.test(orderId)) { setError('Open the private ticket link provided after checkout or in your booking email.'); setLoading(false); }
    else void refresh();
    return () => { active.current = false; };
  }, [orderId, refresh]);
  useEffect(() => {
    if (booking?.order.status !== 'pending_payment') return;
    let count = 0;
    const timer = setInterval(() => { if (++count <= 24) void refresh(); else clearInterval(timer); }, 5000);
    return () => clearInterval(timer);
  }, [booking?.order.status, refresh]);
  useEffect(() => {
    if (booking && ['confirmed', 'expired', 'payment_failed'].includes(booking.order.status)) {
      try { sessionStorage.removeItem(`tivorah-event-booking:${booking.order.eventId}`); } catch { /* Optional storage. */ }
    }
  }, [booking]);
  async function copyLink() {
    try { await navigator.clipboard.writeText(`${window.location.origin}/event-orders/${orderId}#access=${token.current}`); setCopied(true); }
    catch { setError('Could not copy the link. Save the address from your browser instead.'); }
  }
  const confirmed = booking?.order.status === 'confirmed';
  const pending = booking?.order.status === 'pending_payment';
  const checkout = booking?.checkoutUrl?.startsWith('https://checkout.stripe.com/') ? booking.checkoutUrl : null;
  return <section className="page-shell event-state">
    <p className="event-eyebrow">TIVORAH TICKETS</p><h1>{confirmed ? 'Your tickets are ready' : pending ? 'Confirming your booking' : booking ? 'Booking status' : loading ? 'Loading your booking…' : 'Find your tickets'}</h1>
    {error ? <div role="alert"><p className="event-error">{error}</p>{token.current ? <button className="event-secondary" onClick={() => void refresh()} disabled={loading}>Try again</button> : null}</div> : null}
    {booking ? <>
      <div className="event-order-status" aria-live="polite"><h2>{booking.event.title}</h2><p>{eventDate(booking.event.startsAt)}</p><p>{booking.event.location}</p><p>Booking #{booking.order.id} · {booking.order.quantity} {booking.order.quantity === 1 ? 'ticket' : 'tickets'} · {ticketMoney(booking.order.totalCents, booking.order.currency)}</p>
        {pending ? <><p>Tickets appear here once Stripe confirms payment. If you left checkout before paying, you can continue below. Do not start another booking while payment is processing.</p>{checkout ? <a className="event-primary" href={checkout}>Continue payment</a> : null}<button className="event-secondary" onClick={() => void refresh()} disabled={loading}>{loading ? 'Checking…' : 'Check payment status'}</button></> : confirmed ? <p>Show one code for each ticket at the entrance. Keep this private link or save your tickets for later.</p> : <><p className="event-status-label">{booking.order.status.replaceAll('_', ' ')}</p><p>{['expired', 'payment_failed'].includes(booking.order.status) ? 'No ticket was issued for this booking. You can return to the event to book again.' : 'These tickets are not currently valid for entry. Contact Tivorah if you need help.'}</p></>}
      </div>
      <div className="event-order-actions"><button className="event-secondary" onClick={() => void copyLink()}>{copied ? 'Private link copied' : 'Copy private ticket link'}</button>{confirmed ? <button className="event-primary" onClick={() => window.print()}>Print or save tickets</button> : null}<a className="event-secondary" href={`/events/${booking.order.eventId}`}>Back to event</a></div>
      <div className="event-pass-grid">{booking.tickets.map((ticket, index) => <article className="event-pass" key={ticket.publicId}><p className="event-eyebrow">TIVORAH EVENT PASS</p><h2>{booking.event.title}</h2><p>{booking.ticketType.name} · Ticket {index + 1} of {booking.tickets.length}</p><p>{eventDate(booking.event.startsAt)}</p><p>{booking.event.location}</p><p className="event-status-label">{ticket.checkedInAt ? 'Checked in' : ticket.status === 'valid' ? 'Ready to use' : ticket.status}</p>{confirmed && ticket.status === 'valid' && !ticket.checkedInAt && ticket.qrPayload ? <BrandedQrCode value={ticket.qrPayload} ariaLabel={`Entry code for ticket ${index + 1}`} size={240} /> : <p>This ticket cannot be used for entry.</p>}<code>{ticket.shortCode || ticket.publicId}</code></article>)}</div>
      {confirmed && booking.event.onlineUrl?.startsWith('https://') ? <a className="event-primary" href={booking.event.onlineUrl} rel="noopener noreferrer">Join online event</a> : null}
      <p>Need help? <a href="/contact">Contact Tivorah</a> with your booking number. Do not share your ticket codes publicly.</p>
    </> : null}
  </section>;
}
