'use client';
import { FormEvent, useCallback, useEffect, useRef, useState } from 'react';
import { ticketImage } from './ticket-image';
import { BrandedQrCode } from '../../branded-qr-code';
import { eventApi, eventDate, ticketMoney } from '../../events/api';
type Booking = { order: { id: number; eventId: number; status: string; quantity: number; totalCents: number; currency: string; confirmationEmailSent: boolean }; event: { title: string; startsAt: string | null; location: string | null; onlineUrl: string | null }; ticketType: { name: string }; tickets: { publicId: string; shortCode: string | null; attendeeName: string | null; status: string; checkedInAt: string | null; qrPayload: string | null }[]; checkoutUrl: string | null };
export default function OrderTickets({ orderId }: { orderId: string }) {
  const [booking, setBooking] = useState<Booking | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [copiedTicket, setCopiedTicket] = useState('');
  const [ticketShareOpen, setTicketShareOpen] = useState(false);
  const [activeTicket, setActiveTicket] = useState(0);
  const [ticketDirection, setTicketDirection] = useState<'next' | 'previous' | null>(null);
  function switchTicket(index: number) {
    if (index === activeTicket) return;
    setTicketDirection(index > activeTicket ? 'next' : 'previous');
    setActiveTicket(index);
    setActionMessage('');
  }
  const [busyTicket, setBusyTicket] = useState('');
  const [emailBusy, setEmailBusy] = useState(false);
  const [inviteTicket, setInviteTicket] = useState('');
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteBusy, setInviteBusy] = useState(false);
  const [editNameTicket, setEditNameTicket] = useState('');
  const [attendeeName, setAttendeeName] = useState('');
  const [nameBusy, setNameBusy] = useState(false);
  const [allBusy, setAllBusy] = useState(false);
  const [actionMessage, setActionMessage] = useState('');
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
  useEffect(() => {
    const onFocus = () => { if (document.visibilityState === 'visible' && token.current) void refresh(); };
    document.addEventListener('visibilitychange', onFocus);
    return () => document.removeEventListener('visibilitychange', onFocus);
  }, [refresh]);
  async function saveTicket(index: number, share = false) {
    const ticket = booking?.tickets[index];
    if (!booking || !ticket || booking.order.status !== 'confirmed' || busyTicket) return;
    setBusyTicket(ticket.publicId);
    setActionMessage(share ? 'Preparing your ticket to share…' : 'Preparing your download…');
    try {
      const file = await ticketImage({
        title: booking.event.title, date: eventDate(booking.event.startsAt),
        location: booking.event.location || 'See event details', admission: booking.ticketType.name,
        position: index + 1, count: booking.tickets.length,
        code: ticket.shortCode || ticket.publicId, orderId: booking.order.id,
        qrSvg: document.querySelector<SVGElement>(`.event-pass[data-ticket-id="${ticket.publicId}"] .ticket-entry svg[role="img"]`)?.outerHTML || null,
        status: ticket.checkedInAt ? 'Checked in' : ticket.status,
      });
      if (share && navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], title: booking.event.title });
        setActionMessage('Ticket shared.');
      } else {
        const url = URL.createObjectURL(file);
        const link = document.createElement('a');
        link.href = url; link.download = file.name;
        document.body.appendChild(link); link.click(); link.remove();
        setTimeout(() => URL.revokeObjectURL(url), 60_000);
        setActionMessage(share ? 'Ticket downloaded. Attach this image in your messaging or email app to share only this ticket.' : 'Ticket downloaded. Keep the image for entry, even offline.');
      }
    } catch (cause) {
      setActionMessage(cause instanceof DOMException && cause.name === 'AbortError' ? '' : 'Could not prepare or share this ticket. Try Download ticket and attach the image yourself.');
    } finally { setBusyTicket(''); }
  }
  function privateLink() { return `${window.location.origin}/event-orders/${orderId}#access=${token.current}`; }
  function shareTicket(destination: 'whatsapp' | 'email') {
    const text = `Your ticket for ${booking?.event.title || 'this event'}\n\n${privateLink()}\n\nKeep this link private.`;
    if (destination === 'email') window.location.href = `mailto:?subject=${encodeURIComponent('Your Tivorah tickets')}&body=${encodeURIComponent(text)}`;
    else window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank', 'noopener,noreferrer');
  }
  async function nativeShareTicket() {
    try { await navigator.share({ title: booking?.event.title || 'Tivorah tickets', text: 'Your private ticket link. Keep it safe.', url: privateLink() }); }
    catch (cause) { if (!(cause instanceof DOMException && cause.name === 'AbortError')) setError('Sharing could not open. Try copying the private link instead.'); }
  }
  async function copyLink() {
    try { await navigator.clipboard.writeText(privateLink()); setCopied(true); }
    catch { setError('Could not copy the link. Save the address from your browser instead.'); }
  }
  async function resendConfirmation() {
    if (!token.current || emailBusy) return;
    setEmailBusy(true); setActionMessage('Sending your booking email…');
    try {
      await eventApi(`/orders/${encodeURIComponent(orderId)}/resend-confirmation`, { method: 'POST', headers: { Authorization: `Bearer ${token.current}` } });
      setBooking(current => current ? { ...current, order: { ...current.order, confirmationEmailSent: true } } : current);
      setActionMessage('Booking email sent. Check your inbox and spam folder.');
    } catch (cause) { setActionMessage(cause instanceof Error ? cause.message : 'The email could not be sent. Your tickets are still available here.'); }
    finally { setEmailBusy(false); }
  }
  async function inviteFriend(event: FormEvent, publicId: string) {
    event.preventDefault();
    if (inviteBusy || !inviteEmail.trim()) return;
    setInviteBusy(true); setActionMessage('Sending ticket invitation…');
    try {
      await eventApi(`/orders/${encodeURIComponent(orderId)}/tickets/${encodeURIComponent(publicId)}/invite`, { method: 'POST', headers: { Authorization: `Bearer ${token.current}` }, body: JSON.stringify({ email: inviteEmail.trim() }) });
      setActionMessage('Invitation sent. This ticket remains yours until your friend accepts it.');
      setInviteTicket(''); setInviteEmail('');
    } catch (cause) { setActionMessage(cause instanceof Error ? cause.message : 'The invitation could not be sent. Try again.'); }
    finally { setInviteBusy(false); }
  }
  async function saveAttendeeName(event: FormEvent, publicId: string) {
    event.preventDefault();
    if (nameBusy) return;
    setNameBusy(true); setActionMessage('Saving the name on this ticket…');
    try {
      const result = await eventApi<{ attendeeName: string | null }>(`/orders/${encodeURIComponent(orderId)}/tickets/${encodeURIComponent(publicId)}/attendee`, { method: 'PATCH', headers: { Authorization: `Bearer ${token.current}` }, body: JSON.stringify({ name: attendeeName.trim() || null }) });
      setBooking(current => current ? { ...current, tickets: current.tickets.map(item => item.publicId === publicId ? { ...item, attendeeName: result.attendeeName } : item) } : current);
      setActionMessage('Ticket name saved.'); setEditNameTicket('');
    } catch (cause) { setActionMessage(cause instanceof Error ? cause.message : 'Could not save the ticket name.'); }
    finally { setNameBusy(false); }
  }
  async function downloadAll() {
    if (allBusy || !token.current) return;
    setAllBusy(true); setActionMessage('Preparing your PDF…');
    try {
      const base = process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, '');
      if (!base) throw new Error('The download is temporarily unavailable.');
      const response = await fetch(`${base}/api/v1/public/events/orders/${encodeURIComponent(orderId)}/pdf`, { headers: { Authorization: `Bearer ${token.current}` }, cache: 'no-store' });
      if (!response.ok) throw new Error('Could not download your tickets. Try again.');
      const url = URL.createObjectURL(await response.blob());
      const link = document.createElement('a'); link.href = url; link.download = `Tivorah-tickets-${orderId}.pdf`; document.body.appendChild(link); link.click(); link.remove();
      setTimeout(() => URL.revokeObjectURL(url), 60_000);
      setActionMessage('Tickets downloaded. Keep the PDF private.');
    } catch (cause) { setActionMessage(cause instanceof Error ? cause.message : 'The PDF could not be downloaded.'); }
    finally { setAllBusy(false); }
  }
  const confirmed = booking?.order.status === 'confirmed';
  const visibleTickets = booking ? booking.tickets.map((ticket, index) => ({ ticket, index })).filter(({ index }) => index === Math.min(activeTicket, booking.tickets.length - 1)) : [];
  const pending = booking?.order.status === 'pending_payment';
  const checkout = booking?.checkoutUrl?.startsWith('https://checkout.stripe.com/') ? booking.checkoutUrl : null;
  return <section className="page-shell event-state ticket-page">
    <header className="ticket-intro">
      <p className="event-eyebrow">TIVORAH TICKETS</p>
      <h1>{confirmed ? 'You’re going.' : pending ? 'Confirming your booking' : booking ? 'Your booking' : loading ? 'Getting your tickets ready' : 'Find your tickets'}</h1>
      <p>{confirmed ? 'Your plans are set. Keep your ticket handy for the day.' : pending ? 'We’ll update this page when your payment is confirmed.' : loading ? 'Just a moment while we find your booking.' : 'Use your private booking link to view your tickets.'}</p>
    </header>
    {error ? <div className="ticket-notice" role="alert"><p className="event-error">{error}</p>{token.current ? <button className="event-secondary" onClick={() => void refresh()} disabled={loading}>Try again</button> : null}</div> : null}
    {!booking && loading ? <div className="ticket-loading" role="status" aria-label="Loading your booking"><div className="ticket-skeleton"><span /><span /><span /></div><div className="ticket-skeleton ticket-skeleton-pass"><span /><span /><span /></div></div> : null}
    {booking ? <>
      <div className="ticket-layout">
        <div className="ticket-summary">
          <div className="event-order-status" aria-live="polite">
            <span className="ticket-state-badge">{confirmed ? '✓ Booking confirmed' : pending ? 'Payment pending' : booking.order.status.replaceAll('_', ' ')}</span>
            <h2>{booking.event.title}</h2>
            <dl className="ticket-facts"><div><dt>When</dt><dd>{eventDate(booking.event.startsAt)}</dd></div><div><dt>Where</dt><dd>{booking.event.location || 'See event details'}</dd></div></dl>
            <dl className="ticket-receipt"><div><dt>Booking reference</dt><dd>#{booking.order.id}</dd></div><div><dt>Tickets</dt><dd>{booking.order.quantity}</dd></div><div><dt>Total</dt><dd>{booking.order.totalCents ? ticketMoney(booking.order.totalCents, booking.order.currency) : 'Free'}</dd></div></dl>
            {pending ? <div className="ticket-notice"><p>If you left checkout before paying, continue below. If payment is processing, keep this booking open.</p>{checkout ? <a className="event-primary" href={checkout}>Continue payment</a> : null}<button className="event-secondary" onClick={() => void refresh()} disabled={loading}>{loading ? 'Checking…' : 'Check payment status'}</button></div> : !confirmed ? <p>{['expired', 'payment_failed'].includes(booking.order.status) ? 'No ticket was issued. Return to the event to book again.' : 'These tickets are not currently valid for entry. Contact Tivorah if you need help.'}</p> : null}
          </div>
          <div className="event-order-actions" >{confirmed && booking.tickets.length > 0 ? <button className="event-secondary" disabled={allBusy} onClick={() => void downloadAll()}>{allBusy ? 'Preparing PDF…' : 'Download all tickets (PDF)'}</button> : null}<button className="event-secondary" aria-expanded={ticketShareOpen} aria-controls="ticket-share-options" onClick={() => setTicketShareOpen(value => !value)}>Share all tickets</button>{confirmed && !booking.order.confirmationEmailSent ? <button className="event-secondary" disabled={emailBusy} onClick={() => void resendConfirmation()}>{emailBusy ? 'Sending…' : 'Email my tickets'}</button> : null}</div>
          {ticketShareOpen ? <div id="ticket-share-options" className="ticket-share-options" role="group" aria-label="Share private tickets" onKeyDown={e => { if (e.key === 'Escape') { setTicketShareOpen(false); document.querySelector<HTMLButtonElement>('[aria-controls="ticket-share-options"]')?.focus(); } }}><p>This link shares every ticket in this booking. Anyone with it can view and use all tickets. Send it only to someone attending.</p><div><button className="event-secondary" onClick={() => shareTicket('whatsapp')}>WhatsApp</button><button className="event-secondary" onClick={() => shareTicket('email')}>Email</button><button className="event-secondary" onClick={() => void copyLink()}>Copy link</button>{typeof navigator !== 'undefined' && typeof navigator.share === 'function' ? <button className="event-secondary" onClick={() => void nativeShareTicket()}>More options…</button> : null}</div><span role="status">{copied ? 'Private link copied' : ''}</span></div> : null}
          <a className="ticket-back" href={`/events/${booking.order.eventId}`}>← Back to event</a>
          <p className="event-help">Your ticket link is private. Share it only with the people using these tickets.</p>
          {confirmed && booking.event.onlineUrl?.startsWith('https://') ? <a className="event-primary" href={booking.event.onlineUrl} rel="noopener noreferrer">Join online event</a> : null}
        </div>
        <div className="event-pass-grid ticket-wallet" role="region" aria-label="Your tickets">
          {booking.tickets.length > 1 ? <nav className="ticket-navigation" aria-label="Choose a ticket">
            <button className="event-secondary" aria-label="Previous ticket" disabled={activeTicket === 0} onClick={() => switchTicket(activeTicket - 1)}>←</button>
            <label><span className="event-sr">Ticket to display</span><select value={Math.min(activeTicket, booking.tickets.length - 1)} onChange={e => switchTicket(Number(e.target.value))}>{booking.tickets.map((ticket, index) => <option key={ticket.publicId} value={index}>Ticket {index + 1} of {booking.tickets.length}</option>)}</select></label>
            <button className="event-secondary" aria-label="Next ticket" disabled={activeTicket >= booking.tickets.length - 1} onClick={() => switchTicket(activeTicket + 1)}>→</button>
          </nav> : null}
          <div data-switch-direction={ticketDirection || undefined} className={`ticket-stack${booking.tickets.length > 1 ? ' ticket-stack-multiple' : ''}`}>
{visibleTickets.map(({ ticket, index }) => <article className="event-pass" data-ticket-id={ticket.publicId} key={ticket.publicId} aria-label={`Ticket ${index + 1} of ${booking.tickets.length}`}>
          <div className="ticket-pass-top"><span className="event-eyebrow">TIVORAH EVENT PASS</span><span>{index + 1} / {booking.tickets.length}</span></div>
          <h2>{booking.event.title}</h2><p className="ticket-admission">{booking.ticketType.name}{ticket.attendeeName ? ` · ${ticket.attendeeName}` : ''}</p>
          <div className="ticket-entry"><p className="event-status-label">{ticket.checkedInAt ? 'Checked in' : ticket.status === 'valid' && confirmed ? 'Ready for entry' : ticket.status}</p>
          {confirmed && ticket.status === 'valid' && !ticket.checkedInAt && ticket.qrPayload ? <><BrandedQrCode value={ticket.qrPayload} ariaLabel={`Entry code for ticket ${index + 1}`} size={240} /><p className="event-help">Show this code at the entrance</p></> : <p>This ticket cannot be used for entry.</p>}
          <p className="ticket-number">Ticket #{booking.order.id}-{ticket.shortCode || ticket.publicId}</p><p className="ticket-code-label">Entry code</p><div className="ticket-code"><code>{ticket.shortCode || ticket.publicId}</code><button type="button" aria-label={`Copy ticket ${index + 1} code`} title="Copy ticket code" onClick={() => { void navigator.clipboard.writeText(ticket.shortCode || ticket.publicId).then(() => setCopiedTicket(ticket.publicId)).catch(() => setError('Could not copy the code. Select the ticket number to copy it.')); }}><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true"><rect x="8" y="8" width="12" height="12" rx="2" /><path d="M16 8V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h3" /></svg></button></div><span className="ticket-copy-feedback" role="status">{copiedTicket === ticket.publicId ? 'Copied' : ''}</span></div>
          <div className="ticket-pass-bottom"><p>{eventDate(booking.event.startsAt)}</p><p>{booking.event.location}</p><span>Booking reference #{booking.order.id} · {index + 1} of {booking.tickets.length}</span></div>
        <div className="ticket-individual-actions">
            <button className="event-primary" disabled={!confirmed || !!busyTicket} onClick={() => void saveTicket(index)}>{busyTicket === ticket.publicId ? 'Preparing…' : 'Download ticket'}</button>
            <button className="event-secondary" disabled={!confirmed || !!busyTicket} onClick={() => void saveTicket(index, true)}>Share ticket image</button>
            {confirmed && ticket.status === 'valid' && !ticket.checkedInAt ? <button className="event-secondary" type="button" aria-expanded={editNameTicket === ticket.publicId} onClick={() => { setEditNameTicket(current => current === ticket.publicId ? '' : ticket.publicId); setInviteTicket(''); setAttendeeName(ticket.attendeeName || ''); setActionMessage(''); }}>Name on ticket</button> : null}
            {confirmed && ticket.status === 'valid' && !ticket.checkedInAt ? <button className="event-secondary" type="button" aria-expanded={inviteTicket === ticket.publicId} onClick={() => { setInviteTicket(current => current === ticket.publicId ? '' : ticket.publicId); setEditNameTicket(''); setInviteEmail(''); setActionMessage(''); }}>Send to a friend</button> : null}
          </div>
          {editNameTicket === ticket.publicId ? <form className="ticket-invite-form" onSubmit={event => void saveAttendeeName(event, ticket.publicId)}><p>Adding a name is optional. You can leave this blank if you have not decided who will use the ticket.</p><label htmlFor={`attendee-name-${ticket.publicId}`}>Name on ticket</label><input id={`attendee-name-${ticket.publicId}`} autoComplete="name" maxLength={100} value={attendeeName} onChange={event => setAttendeeName(event.target.value)} /><button className="event-primary" type="submit" disabled={nameBusy}>{nameBusy ? 'Saving…' : 'Save name'}</button></form> : null}
          {inviteTicket === ticket.publicId ? <form className="ticket-invite-form" onSubmit={event => void inviteFriend(event, ticket.publicId)}><p>Your friend will receive an email invitation. Once they accept, they get a new entry code and this one stops working.</p><label htmlFor={`invite-email-${ticket.publicId}`}>Friend’s email address</label><input id={`invite-email-${ticket.publicId}`} type="email" autoComplete="email" required maxLength={254} value={inviteEmail} onChange={event => setInviteEmail(event.target.value)} /><button className="event-primary" type="submit" disabled={inviteBusy}>{inviteBusy ? 'Sending…' : 'Send invitation'}</button></form> : null}
        </article>)}</div><p className="ticket-action-feedback" role="status">{actionMessage}</p>{confirmed && !booking.tickets.length ? <div className="ticket-notice" role="status"><h2>Your booking is confirmed</h2><p>Your entry codes are not available yet.</p><button className="event-secondary" disabled={loading} onClick={() => void refresh()}>{loading ? 'Checking…' : 'Refresh tickets'}</button></div> : null}</div>
      </div>
      <p className="ticket-support">Need a hand? <a href="/contact">Contact Tivorah</a> with your booking number.</p>
    </> : null}
  </section>;
}
