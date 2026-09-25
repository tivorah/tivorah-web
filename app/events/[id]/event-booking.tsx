'use client';
import Image from 'next/image';
import { FormEvent, useEffect, useRef, useState } from 'react';
import { BookingQuote, EventApiError, eventApi, eventDate, PublicEvent, ticketMoney } from '../api';

export default function EventBookingPage({ event }: { event: PublicEvent }) {
  const [ticketId, setTicketId] = useState(event.ticketTypes.find(ticket => ticket.available)?.id ?? 0);
  const [quantity, setQuantity] = useState(1);
  const [quote, setQuote] = useState<BookingQuote | null>(null);
  const [quoteError, setQuoteError] = useState('');
  const [quoteAttempt, setQuoteAttempt] = useState(0);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [adult, setAdult] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [shared, setShared] = useState('');
  const [shareOpen, setShareOpen] = useState(false);
  const shareArea = useRef<HTMLDivElement>(null);
  const shareButton = useRef<HTMLButtonElement>(null);
  const shareUrl = `https://tivorah.com/events/${event.id}`;
  useEffect(() => {
    if (!shareOpen) return;
    function close(e: PointerEvent) { if (!shareArea.current?.contains(e.target as Node)) setShareOpen(false); }
    function escape(e: KeyboardEvent) { if (e.key === 'Escape') { setShareOpen(false); shareButton.current?.focus(); } }
    document.addEventListener('pointerdown', close); document.addEventListener('keydown', escape);
    return () => { document.removeEventListener('pointerdown', close); document.removeEventListener('keydown', escape); };
  }, [shareOpen]);
  const [ticketsVisible, setTicketsVisible] = useState(false);
  useEffect(() => {
    const section = document.getElementById('tickets');
    if (!section) return;
    const observer = new IntersectionObserver(entries => setTicketsVisible(entries[0].isIntersecting));
    observer.observe(section);
    return () => observer.disconnect();
  }, []);
  const key = useRef<{ fingerprint: string; value: string } | null>(null);
  const ticket = event.ticketTypes.find(item => item.id === ticketId);
  const selectedQuote = useRef('');
  const selectionKey = `${ticketId}:${quantity}`;
  const currentQuote = selectedQuote.current === selectionKey ? quote : null;
  useEffect(() => {
    setQuote(null); setQuoteError('');
    if (!ticketId) return;
    const controller = new AbortController();
    eventApi<BookingQuote>(`/${event.id}/quote`, { method: 'POST', body: JSON.stringify({ ticketTypeId: ticketId, quantity }), signal: controller.signal })
      .then(value => { selectedQuote.current = `${ticketId}:${quantity}`; setQuote(value); })
      .catch(cause => { if (!controller.signal.aborted) setQuoteError(cause instanceof Error ? cause.message : 'Could not load the total.'); });
    return () => controller.abort();
  }, [event.id, ticketId, quantity, quoteAttempt]);
  async function submit(e: FormEvent) {
    e.preventDefault();
    if (!event.guestBookingAvailable || busy || !currentQuote || !ticket?.available || !adult) return;
    setBusy(true); setError('');
    const fingerprint = JSON.stringify([event.id, ticketId, quantity, name.trim(), email.trim().toLowerCase()]);
    try {
      if (key.current?.fingerprint !== fingerprint) {
        const storageKey = `tivorah-event-booking:${event.id}`;
        let saved: { fingerprint: string; value: string } | null = null;
        try { saved = JSON.parse(sessionStorage.getItem(storageKey) || 'null'); } catch { /* Storage is optional. */ }
        key.current = saved?.fingerprint === fingerprint ? saved : { fingerprint, value: crypto.randomUUID() };
        try { sessionStorage.setItem(storageKey, JSON.stringify(key.current)); } catch { /* Keep the in-memory retry key. */ }
      }
      const result = await eventApi<{ checkoutUrl: string | null; ticketUrl: string; order: { id: number; status: string } }>(`/${event.id}/orders`, { method: 'POST', body: JSON.stringify({ ticketTypeId: ticketId, quantity, name: name.trim(), email: email.trim(), adultConfirmed: adult, idempotencyKey: key.current!.value }) });
      const ticketUrl = new URL(result.ticketUrl);
      // Keep the private link on this device before leaving for payment.
      try { sessionStorage.setItem(`tivorah-event-access:${result.order.id}`, new URLSearchParams(ticketUrl.hash.slice(1)).get('access') || ''); } catch { /* The return URL also carries the token. */ }
      const destination = result.checkoutUrl ? new URL(result.checkoutUrl) : ticketUrl;
      if (result.checkoutUrl && (destination.protocol !== 'https:' || destination.hostname !== 'checkout.stripe.com')) throw new Error('The payment link could not be verified. Please try again.');
      window.location.assign(destination.toString());
    } catch (cause) {
      if (cause instanceof EventApiError && cause.code === 'ORDER_CLOSED') { key.current = null; try { sessionStorage.removeItem(`tivorah-event-booking:${event.id}`); } catch { /* Optional storage. */ } }
      setError(cause instanceof Error ? cause.message : 'Checkout could not open. Please try again.'); setBusy(false);
    }
  }
  async function share() {
    const url = shareUrl;
    try { if (navigator.share) await navigator.share({ title: event.title, url }); else { await navigator.clipboard.writeText(url); setShared('Link copied'); } }
    catch (cause) { if (!(cause instanceof DOMException && cause.name === 'AbortError')) setShared('Copy the page address to share this event.'); }
  }
  const location = [event.venueName, event.address, event.suburb, event.state, event.postcode].filter(Boolean).join(', ') || event.location;
  const imageCandidate = event.images.find(value => /\.(png|jpe?g|webp|avif)(\?|$)/i.test(value)) || event.img;
  const image = imageCandidate && /^https?:\/\//.test(imageCandidate) ? imageCandidate : null;
  const minPrice = event.ticketTypes.length ? Math.min(...event.ticketTypes.map(item => item.priceCents)) : null;
  return <article className="page-shell event-page">
    {image ? <div className="event-hero"><Image src={image} alt={event.title} fill sizes="(max-width: 760px) 100vw, 1200px" unoptimized style={{ objectFit: 'contain' }} priority /></div> : null}
    <div className="event-tools"><a href={`tivorah://events/${event.id}`}>Open in Tivorah</a><div className="event-share" ref={shareArea}><button ref={shareButton} type="button" aria-expanded={shareOpen} aria-controls="event-share-options" onClick={() => setShareOpen(value => !value)}>Share event</button>{shareOpen ? <div id="event-share-options" className="event-share-options" role="group" aria-label="Share this event"><p>Invite someone along</p><a href={`https://wa.me/?text=${encodeURIComponent(event.title + ' ' + shareUrl)}`} target="_blank" rel="noopener noreferrer">WhatsApp</a><a href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`} target="_blank" rel="noopener noreferrer">Facebook</a><a href={`mailto:?subject=${encodeURIComponent(event.title)}&body=${encodeURIComponent('Join me at ' + event.title + '\n\n' + shareUrl)}`}>Email</a>{typeof navigator !== 'undefined' && typeof navigator.share === 'function' ? <button type="button" onClick={() => void share()}>More options…</button> : null}<label htmlFor="event-share-url">Event link</label><div className="event-share-link"><input id="event-share-url" readOnly value={shareUrl} onFocus={e => e.target.select()} /><button type="button" aria-label="Copy event link" title="Copy event link" onClick={() => { void navigator.clipboard.writeText(shareUrl).then(() => setShared('Event link copied')).catch(() => setShared('Could not copy the link. Select the event link to copy it manually.')); }}><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true"><rect x="8" y="8" width="12" height="12" rx="2" /><path d="M16 8V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h3" /></svg></button></div></div> : null}</div><span role="status">{shared}</span></div>
    <div className="event-layout"><div className="event-details">
      <p className="event-eyebrow">TIVORAH EVENTS</p><h1>{event.title}</h1><p className="event-organizer">Organised by <strong>{event.organizerName}</strong></p>
      <dl className="event-facts"><div><dt>When</dt><dd>{eventDate(event.startsAt)}</dd></div><div><dt>Where</dt><dd>{event.locationType === 'online' ? 'Online. Joining details are provided with your ticket.' : location || 'See the organiser for location details.'}</dd></div></dl>
      <section><h2>About this event</h2><p className="event-description">{event.description || 'The organiser has not added a description yet.'}</p></section>
      {event.locationType !== 'online' && location ? <section><h2>Location</h2><p>{location}</p><a className="event-secondary" target="_blank" rel="noopener noreferrer" href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(location)}`}>Get directions</a></section> : null}
      <section><h2>Booking information</h2><p>You can book here without downloading Tivorah. Keep your private ticket link so you can show your tickets at the entrance.</p><p>For cancellation or refund questions, <a href={`/contact?eventId=${event.id}`}>contact Tivorah</a> with the event name and booking number.</p></section>
    </div>
    <section id="tickets" className="event-booking" aria-labelledby="ticket-heading"><h2 id="ticket-heading">Get tickets</h2>
      {event.externalTicketUrl ? <><p>The organiser sells tickets through another website.</p><a className="event-primary" href={event.externalTicketUrl} rel="noopener noreferrer">Continue to ticket website</a></> : !event.ticketTypes.some(item => item.available) ? <p role="status">Tickets are not available right now. They may be sold out, outside the sale period, or still being set up by the organiser.</p> : <form onSubmit={submit}>
        <fieldset disabled={busy}><legend className="event-sr">Choose your tickets</legend><label htmlFor="event-ticket">Ticket type</label><select id="event-ticket" value={ticketId} onChange={e => { setTicketId(Number(e.target.value)); setQuantity(1); setError(''); }}>
          {event.ticketTypes.map(item => <option key={item.id} value={item.id} disabled={!item.available}>{item.name} · {item.priceCents ? ticketMoney(item.priceCents, item.currency) : 'Free'}{item.available ? '' : ' · Unavailable'}</option>)}
        </select>{ticket?.description ? <p>{ticket.description}</p> : null}
        <label htmlFor="event-quantity">Quantity</label><select id="event-quantity" value={quantity} onChange={e => { setQuantity(Number(e.target.value)); setError(''); }}>{Array.from({ length: Math.min(20, ticket?.maxTicketsPerBuyer || 1, ticket?.remaining || 1) }, (_, i) => <option key={i} value={i + 1}>{i + 1}</option>)}</select>{ticket ? <p className="event-help">Limit: {ticket.maxTicketsPerBuyer} {ticket.maxTicketsPerBuyer === 1 ? 'ticket' : 'tickets'} per buyer for this ticket type. You can book for friends without entering their names now.</p> : null}
        <div className="event-total" aria-live="polite">{currentQuote ? <><div><span>Tickets</span><span>{ticketMoney(currentQuote.subtotalCents)}</span></div>{currentQuote.chargedTo === 'buyer' && currentQuote.platformFeeCents > 0 ? <div><span>Booking fee</span><span>{ticketMoney(currentQuote.platformFeeCents)}</span></div> : null}<div><strong>Total</strong><strong>{currentQuote.buyerTotalCents ? ticketMoney(currentQuote.buyerTotalCents) : 'Free'}</strong></div></> : <div role="status"><p>{quoteError || 'Calculating total…'}</p>{!quoteError ? <div className="tivorah-shimmer" aria-hidden="true" style={{ height: 20, borderRadius: 6 }} /> : null}</div>}</div>
        {quoteError ? <button type="button" className="event-secondary" onClick={() => setQuoteAttempt(value => value + 1)}>Retry total</button> : null}
        <h3>Your details</h3><label htmlFor="event-name">Full name</label><input id="event-name" autoComplete="name" required minLength={2} maxLength={100} value={name} onChange={e => setName(e.target.value)} />
        <label htmlFor="event-email">Email address</label><input id="event-email" type="email" autoComplete="email" required maxLength={254} value={email} onChange={e => setEmail(e.target.value)} /><p className="event-help">Your ticket link will be sent to this address.</p>
        <label className="event-check"><input type="checkbox" checked={adult} onChange={e => setAdult(e.target.checked)} required /><span>I am 18 or older and agree to the <a href="/terms" target="_blank" rel="noopener noreferrer">Terms</a> and <a href="/privacy" target="_blank" rel="noopener noreferrer">Privacy Policy</a>.</span></label>
        <p role="status" className="event-help">{!event.guestBookingAvailable ? 'Online booking is temporarily unavailable. Please try again later.' : ''}</p>
        <button className="event-primary" disabled={!event.guestBookingAvailable || !currentQuote || busy || !adult} type="submit">{busy ? 'Opening your booking…' : currentQuote?.buyerTotalCents ? `Continue to payment · ${ticketMoney(currentQuote.buyerTotalCents)}` : 'Get free tickets'}</button>
        </fieldset>{error ? <p role="alert" className="event-error">{error}</p> : null}<p className="event-help">{ticket?.priceCents ? 'Payment is processed securely by Stripe.' : 'No payment is needed.'} No Tivorah account needed.</p>
      </form>}
    </section></div>
    {!ticketsVisible ? <div className="event-ticket-dock"><span>{minPrice === null ? 'Event tickets' : minPrice === 0 ? 'Free tickets available' : `From ${ticketMoney(minPrice)}`}</span><a className="event-primary" href="#tickets">Get tickets</a></div> : null}
  </article>;
}
