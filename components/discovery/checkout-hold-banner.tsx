'use client';
import { useEffect, useRef, useState } from 'react';
import './checkout-hold-banner.css';
import { ticketMoney, type ActiveCheckout } from '../../app/events/api';
import { formatHoldRemaining, holdFractionLeft, holdRemainingMs, verifiedStripeCheckoutUrl } from '../../lib/checkout-hold';

/**
 * Shown while the buyer's paid tickets are held for them: a live countdown, a draining progress line,
 * and a way back into the same Stripe checkout (or to release the tickets early). When it ends the
 * API closes that checkout and returns the tickets to sale.
 */
export function CheckoutHoldBanner({ checkout, onExpire, onCancel }: { checkout: ActiveCheckout; onExpire: () => void; onCancel: () => Promise<void> }) {
  const [now, setNow] = useState(() => Date.now());
  const [cancelling, setCancelling] = useState(false);
  const [error, setError] = useState('');
  const remaining = holdRemainingMs(checkout.expiresAt, now);
  const expireRef = useRef(onExpire);
  const expiredFor = useRef<string | null>(null);

  useEffect(() => { expireRef.current = onExpire; }, [onExpire]);
  useEffect(() => {
    const tick = () => setNow(Date.now());
    const timer = window.setInterval(tick, 1000);
    // Background tabs throttle timers; re-read the clock as soon as the page is visible again.
    const onVisible = () => { if (document.visibilityState === 'visible') tick(); };
    document.addEventListener('visibilitychange', onVisible);
    return () => { window.clearInterval(timer); document.removeEventListener('visibilitychange', onVisible); };
  }, [checkout.expiresAt]);
  useEffect(() => {
    if (remaining > 0 || expiredFor.current === checkout.expiresAt) return;
    expiredFor.current = checkout.expiresAt;
    expireRef.current();
  }, [remaining, checkout.expiresAt]);

  function resume() {
    const url = verifiedStripeCheckoutUrl(checkout.checkoutUrl);
    if (!url) { setError('The payment link could not be verified. Refresh the page and try again.'); return; }
    window.location.assign(url);
  }

  async function release() {
    setCancelling(true); setError('');
    try { await onCancel(); }
    catch (cause) { setError(cause instanceof Error ? cause.message : 'Could not release the tickets. Try again; they stay held until that is confirmed.'); }
    finally { setCancelling(false); }
  }

  const minutesLeft = Math.max(1, Math.ceil(remaining / 60000));
  const detail = [checkout.ticketSummary, checkout.totalCents ? ticketMoney(checkout.totalCents, checkout.currency) : null].filter(Boolean).join(' · ');
  const left = holdFractionLeft(checkout.startedAt, checkout.expiresAt, remaining);
  return <div className={`checkout-hold${remaining < 60_000 ? ' is-urgent' : ''}`} role="region" aria-label="Tickets held for you">
    <div className="checkout-hold-row">
      <span className="checkout-hold-badge" aria-hidden="true"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9a2 2 0 0 0 0 6v3a1 1 0 0 0 1 1h16a1 1 0 0 0 1-1v-3a2 2 0 0 0 0-6V6a1 1 0 0 0-1-1H4a1 1 0 0 0-1 1Z" /><path d="M13 5v2M13 11v2M13 17v2" /></svg></span>
      <div className="checkout-hold-copy">
        <strong>Tickets held for you</strong>
        <p>{detail || 'Finish paying to keep them'}</p>
        <span className="checkout-hold-sr">About {minutesLeft} {minutesLeft === 1 ? 'minute' : 'minutes'} left to pay.</span>
      </div>
      <time aria-hidden="true" className="checkout-hold-timer">{formatHoldRemaining(remaining)}</time>
    </div>
    <div className="checkout-hold-track" aria-hidden="true"><span style={{ width: `${left * 100}%` }} /></div>
    <div className="checkout-hold-actions">
      <button type="button" className="checkout-hold-release" disabled={cancelling} onClick={() => void release()}>{cancelling ? 'Cancelling…' : 'Cancel hold'}</button>
      <button type="button" className="checkout-hold-resume" disabled={cancelling || remaining === 0} onClick={resume}>Resume checkout</button>
    </div>
    {error ? <p role="alert">{error}</p> : null}
  </div>;
}
