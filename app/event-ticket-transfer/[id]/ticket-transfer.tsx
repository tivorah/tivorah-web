'use client';
import { FormEvent, useEffect, useRef, useState } from 'react';
import { eventApi, eventDate } from '../../events/api';

type Invitation = { eventTitle: string; startsAt: string | null; location: string | null; email: string; ticketUrl: string | null };
export default function TicketTransfer({ ticketId }: { ticketId: string }) {
  const access = useRef('');
  const [invitation, setInvitation] = useState<Invitation | null>(null);
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  useEffect(() => {
    access.current = new URLSearchParams(window.location.hash.slice(1)).get('access') || '';
    if (!/^[1-9]\d*$/.test(ticketId) || !/^[A-Za-z0-9_-]{43}$/.test(access.current)) { setError('Open the private invitation link from your email.'); setLoading(false); return; }
    const controller = new AbortController();
    eventApi<Invitation>(`/transfers/${ticketId}`, { headers: { Authorization: `Bearer ${access.current}` }, signal: controller.signal })
      .then(setInvitation).catch(cause => { if (!controller.signal.aborted) setError(cause instanceof Error ? cause.message : 'This invitation could not be opened.'); })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [ticketId]);
  async function accept(event: FormEvent) {
    event.preventDefault();
    if (busy || !invitation || invitation.ticketUrl) return;
    setBusy(true); setError('');
    try {
      const result = await eventApi<{ ticketUrl: string }>(`/transfers/${ticketId}/claim`, { method: 'POST', headers: { Authorization: `Bearer ${access.current}` }, body: JSON.stringify({ ...(name.trim() ? { name: name.trim() } : {}) }) });
      window.location.assign(result.ticketUrl);
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'This ticket could not be accepted. Try again.'); setBusy(false); }
  }
  return <main className="page-shell event-state ticket-page ticket-transfer-page">
    <p className="event-eyebrow">TIVORAH TICKETS</p><h1>A ticket is waiting for you.</h1>
    {loading ? <div className="ticket-loading" role="status" aria-label="Loading ticket invitation"><div className="ticket-skeleton"><span /><span /><span /></div></div> : null}
    {error ? <div className="ticket-notice" role="alert"><p>{error}</p><p>Ask the person who sent the ticket to invite you again if the link has expired.</p></div> : null}
    {invitation ? <div className="ticket-transfer-card"><h2>{invitation.eventTitle}</h2><p>{eventDate(invitation.startsAt)}</p><p>{invitation.location}</p><p>This invitation was sent to <strong>{invitation.email}</strong>. Accepting gives you your own entry code and makes the previous code unusable.</p>
      {invitation.ticketUrl ? <a className="event-primary" href={invitation.ticketUrl}>Open your ticket</a> : <form onSubmit={accept}><label htmlFor="transfer-name">Your name <span className="event-help">(optional)</span></label><input id="transfer-name" autoComplete="name" minLength={2} maxLength={100} value={name} onChange={event => setName(event.target.value)} /><button className="event-primary" type="submit" disabled={busy}>{busy ? 'Preparing your ticket…' : 'Accept ticket'}</button></form>}
      <p className="event-help">A Tivorah account is not required. Keep your new ticket link private.</p>
    </div> : null}
  </main>;
}
