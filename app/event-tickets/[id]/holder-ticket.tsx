'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import { BrandedQrCode } from '../../branded-qr-code';
import { ticketImage } from '../../event-orders/[id]/ticket-image';
import { eventApi, eventDate } from '../../events/api';

type HolderPass = { event: { id: number; title: string; startsAt: string | null; location: string | null }; ticket: { orderId: number; attendeeName: string | null; name: string; code: string | null; status: string; qrPayload: string | null }; emailSent: boolean };
export default function HolderTicket({ ticketId }: { ticketId: string }) {
  const access = useRef('');
  const [pass, setPass] = useState<HolderPass | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const refresh = useCallback(async () => {
    if (!access.current) return;
    try { setPass(await eventApi<HolderPass>(`/tickets/${ticketId}`, { headers: { Authorization: `Bearer ${access.current}` } })); setError(''); }
    catch (cause) { setError(cause instanceof Error ? cause.message : 'Your ticket could not be opened.'); }
    finally { setLoading(false); }
  }, [ticketId]);
  useEffect(() => {
    access.current = new URLSearchParams(window.location.hash.slice(1)).get('access') || '';
    if (!/^[1-9]\d*$/.test(ticketId) || !/^[A-Za-z0-9_-]{43}$/.test(access.current)) { setError('Open the private ticket link from your email.'); setLoading(false); return; }
    void refresh();
  }, [ticketId, refresh]);
  async function save() {
    if (!pass || busy) return;
    setBusy(true); setMessage('Preparing your download…');
    try {
      const file = await ticketImage({ title: pass.event.title, date: eventDate(pass.event.startsAt), location: pass.event.location || 'See event details', admission: pass.ticket.name, position: 1, count: 1, code: pass.ticket.code || ticketId, orderId: pass.ticket.orderId, qrSvg: pass.ticket.qrPayload ? document.querySelector<SVGElement>('.holder-ticket-page .ticket-entry svg[role="img"]')?.outerHTML || null : null, status: pass.ticket.status });
      const url = URL.createObjectURL(file), link = document.createElement('a');
      link.href = url; link.download = file.name; document.body.appendChild(link); link.click(); link.remove();
      setTimeout(() => URL.revokeObjectURL(url), 60_000); setMessage('Ticket downloaded. Keep it private.');
    } catch { setMessage('Could not download the ticket. You can still show the code on this page.'); }
    finally { setBusy(false); }
  }
  async function resend() {
    if (busy) return;
    setBusy(true); setMessage('Sending your ticket email…');
    try { await eventApi(`/tickets/${ticketId}/resend-confirmation`, { method: 'POST', headers: { Authorization: `Bearer ${access.current}` } }); setPass(current => current ? { ...current, emailSent: true } : current); setMessage('Ticket email sent. Check your inbox and spam folder.'); }
    catch (cause) { setMessage(cause instanceof Error ? cause.message : 'Email could not be sent. Your ticket remains available here.'); }
    finally { setBusy(false); }
  }
  return <main className="page-shell event-state ticket-page holder-ticket-page"><p className="event-eyebrow">TIVORAH EVENT PASS</p><h1>Your ticket</h1>
    {loading ? <div className="ticket-loading" role="status" aria-label="Loading your ticket"><div className="ticket-skeleton ticket-skeleton-pass"><span /><span /><span /></div></div> : null}
    {error ? <div className="ticket-notice" role="alert"><p>{error}</p><button className="event-secondary" type="button" onClick={() => void refresh()}>Try again</button></div> : null}
    {pass ? <article className="event-pass"><div className="ticket-pass-top"><span className="event-eyebrow">TIVORAH EVENT PASS</span></div><h2>{pass.event.title}</h2><p className="ticket-admission">{pass.ticket.name}{pass.ticket.attendeeName ? ` · ${pass.ticket.attendeeName}` : ''}</p><div className="ticket-entry"><p className="event-status-label">{pass.ticket.qrPayload ? 'Ready for entry' : pass.ticket.status.replaceAll('_', ' ')}</p>{pass.ticket.qrPayload ? <><BrandedQrCode value={pass.ticket.qrPayload} ariaLabel="Entry code for your ticket" size={240} /><p className="event-help">Show this code at the entrance</p></> : <p>This ticket cannot currently be used for entry.</p>}<p className="ticket-code-label">Entry code</p><div className="ticket-code"><code>{pass.ticket.code}</code></div></div><div className="ticket-pass-bottom"><p>{eventDate(pass.event.startsAt)}</p><p>{pass.event.location}</p></div><div className="ticket-individual-actions"><button className="event-primary" type="button" onClick={() => void save()} disabled={busy}>{busy ? 'Please wait…' : 'Download ticket'}</button>{!pass.emailSent ? <button className="event-secondary" type="button" onClick={() => void resend()} disabled={busy}>Email my ticket</button> : null}</div></article> : null}
    <p className="ticket-action-feedback" role="status">{message}</p>{pass ? <p className="event-help">Keep this private link and entry code to yourself. If you need help, <a href="/contact">contact Tivorah</a>.</p> : null}
  </main>;
}
