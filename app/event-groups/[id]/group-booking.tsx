'use client';
import { FormEvent, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { BookingTermsConsent } from '../../../components/discovery/booking-terms-consent';
import { useAccount } from '../../../hooks/use-account';
import { eventApi, eventDate, ticketMoney } from '../../events/api';

type Group = { event: { id: number; title: string; startsAt: string | null; location: string | null; img: string | null }; ticket: { id: number; name: string; currency: string; priceCents: number }; group: { quantity: number; buyerEmail: string; expiresAt: string; status: string; available: boolean }; quote: { subtotalCents: number; platformFeeCents: number; buyerTotalCents: number; chargedTo: string } | null };
export default function GroupBooking({ groupId }: { groupId: string }) {
  const { account, loading: accountLoading, signedOut, error: accountError, retry: retryAccount } = useAccount();
  const token = useRef('');
  const retry = useRef<{ key: string; name: string } | null>(null);
  const [group, setGroup] = useState<Group | null>(null);
  const [name, setName] = useState('');
  const [adult, setAdult] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [canResume, setCanResume] = useState(false);
  useEffect(() => {
    token.current = new URLSearchParams(window.location.hash.slice(1)).get('access') || '';
    try { token.current ||= sessionStorage.getItem(`tivorah-group-access:${groupId}`) || ''; if (token.current) sessionStorage.setItem(`tivorah-group-access:${groupId}`, token.current); } catch { /* The original email link remains the recovery path. */ }
    if (!/^[1-9]\d*$/.test(groupId) || !/^[A-Za-z0-9_-]{43}$/.test(token.current)) { setError('Open the private group booking link from your email.'); setLoading(false); return; }
    try { const saved = JSON.parse(sessionStorage.getItem(`tivorah-group-booking:${groupId}`) || 'null'); if (saved?.key && saved?.name) { retry.current = saved; setName(saved.name); setCanResume(true); } } catch { /* A fresh booking can still proceed. */ }
    const controller = new AbortController();
    eventApi<Group>(`/groups/${groupId}`, { headers: { Authorization: `Bearer ${token.current}` }, signal: controller.signal })
      .then(setGroup).catch(cause => { if (!controller.signal.aborted) setError(cause instanceof Error ? cause.message : 'This group booking could not be opened.'); })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [groupId]);
  async function book(event: FormEvent) {
    event.preventDefault();
    if (!(group?.group.available || (group?.group.status === 'used' && canResume)) || !adult || !termsAccepted || busy || !account) return;
    setBusy(true); setError('');
    const storageKey = `tivorah-group-booking:${groupId}`;
    if (!retry.current) { try { retry.current = JSON.parse(sessionStorage.getItem(storageKey) || 'null'); } catch { /* Keep the retry in memory. */ } }
    if (!retry.current) { retry.current = { key: crypto.randomUUID(), name: name.trim() }; try { sessionStorage.setItem(storageKey, JSON.stringify(retry.current)); } catch { /* Keep the retry in memory. */ } }
    try {
      const result = await eventApi<{ checkoutUrl: string | null; ticketUrl: string; order: { id: number } }>(`/groups/${groupId}/orders`, { method: 'POST', headers: { Authorization: `Bearer ${token.current}` }, body: JSON.stringify({ idempotencyKey: retry.current.key, name: retry.current.name, adultConfirmed: adult, termsAccepted }) });
      const ticketUrl = new URL(result.ticketUrl);
      try { sessionStorage.setItem(`tivorah-event-access:${result.order.id}`, new URLSearchParams(ticketUrl.hash.slice(1)).get('access') || ''); } catch { /* The private return URL contains access. */ }
      const destination = result.checkoutUrl ? new URL(result.checkoutUrl) : ticketUrl;
      if (result.checkoutUrl && (destination.protocol !== 'https:' || destination.hostname !== 'checkout.stripe.com')) throw new Error('The payment link could not be verified. Try again.');
      window.location.assign(destination.toString());
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'The booking could not be completed. Try again.'); setBusy(false); }
  }
  return <main className="page-shell event-page group-booking-page"><div className="group-booking-heading"><p className="event-eyebrow">TIVORAH GROUP TICKETS</p><h1>Bring everyone along.</h1><p>Your organiser has set aside tickets for your group. Complete one booking, then give each person their own ticket.</p></div>
    {loading ? <div className="ticket-loading" role="status" aria-label="Loading group booking"><div className="ticket-skeleton"><span /><span /><span /></div></div> : null}
    {group ? <div className="event-layout"><div className="event-details"><h2>{group.event.title}</h2><dl className="event-facts"><div><dt>When</dt><dd>{eventDate(group.event.startsAt)}</dd></div><div><dt>Where</dt><dd>{group.event.location || 'See event details'}</dd></div><div><dt>Reserved for</dt><dd>{group.group.buyerEmail}</dd></div><div><dt>Complete by</dt><dd>{new Date(group.group.expiresAt).toLocaleString('en-AU', { dateStyle: 'full', timeStyle: 'short', timeZone: 'Australia/Adelaide' })} (Adelaide time)</dd></div></dl><p>Only the buyer’s details are needed now. You can add names or email individual tickets to friends after booking.</p><a className="event-secondary" href={`/events/${group.event.id}`}>View event details</a></div>
      <section className="event-booking" aria-labelledby="group-ticket-heading"><h2 id="group-ticket-heading">Your group booking</h2><p>{group.group.quantity} × {group.ticket.name}</p>{group.quote ? <div className="event-total"><div><span>Tickets</span><span>{ticketMoney(group.quote.subtotalCents, group.ticket.currency)}</span></div>{group.quote.chargedTo === 'buyer' && group.quote.platformFeeCents > 0 ? <div><span>Booking fee</span><span>{ticketMoney(group.quote.platformFeeCents, group.ticket.currency)}</span></div> : null}<div><strong>Total</strong><strong>{group.quote.buyerTotalCents ? ticketMoney(group.quote.buyerTotalCents, group.ticket.currency) : 'Free'}</strong></div></div> : null}
        {accountLoading ? <p role="status">Checking your account…</p> : signedOut ? <p><Link className="event-primary" href={`/auth/signin?returnTo=${encodeURIComponent(`/event-groups/${groupId}`)}`}>Sign in to book</Link></p> : accountError ? <div role="alert"><p>{accountError}</p><button type="button" onClick={retryAccount}>Retry account</button></div> : null}
        {group.group.available || (group.group.status === 'used' && canResume) ? <form onSubmit={book}><fieldset disabled={busy || !account || accountLoading}><h3>Your details</h3><label htmlFor="group-buyer-name">Full name</label><input id="group-buyer-name" autoComplete="name" required minLength={2} maxLength={100} value={name} onChange={event => setName(event.target.value)} /><p className="event-help">Tickets will be emailed to {group.group.buyerEmail}. Large groups use a private download page instead of an oversized attachment.</p><BookingTermsConsent confirmAge checked={adult && termsAccepted} onChange={value => { setAdult(value); setTermsAccepted(value); }} /><button className="event-primary" disabled={!adult || !termsAccepted || busy} type="submit">{busy ? 'Opening your booking…' : group.group.status === 'used' ? 'Continue your booking' : group.quote?.buyerTotalCents ? `Continue to payment · ${ticketMoney(group.quote.buyerTotalCents, group.ticket.currency)}` : 'Get group tickets'}</button></fieldset></form> : <div className="ticket-notice" role="status"><p>This group hold is no longer available. Ask the organiser for a new invitation.</p></div>}
        {error ? <p className="event-error" role="alert">{error}</p> : null}<p className="event-help">Sign in with the email this invitation was sent to. Paid bookings are processed by Stripe.</p>
      </section></div> : error ? <div className="ticket-notice" role="alert"><p>{error}</p></div> : null}
  </main>;
}
