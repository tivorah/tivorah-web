/**
 * Paid-ticket checkout holds. The API reserves the tickets for a few minutes while the buyer pays,
 * returns when the hold ends, and closes the checkout itself once it runs out.
 */

/** Milliseconds left on a hold (never negative); 0 for a missing or invalid time. */
export function holdRemainingMs(expiresAt: string | null | undefined, now = Date.now()): number {
  const end = expiresAt ? Date.parse(expiresAt) : NaN;
  return Number.isFinite(end) ? Math.max(0, end - now) : 0;
}

/** "9:05" style countdown, rounded up so it reaches 0:00 exactly when the hold ends. */
export function formatHoldRemaining(ms: number): string {
  const totalSeconds = Math.ceil(Math.max(0, ms) / 1000);
  return `${Math.floor(totalSeconds / 60)}:${String(totalSeconds % 60).padStart(2, '0')}`;
}

/** Only ever send the browser to Stripe's own hosted checkout. */
export function verifiedStripeCheckoutUrl(value: string): string | null {
  try {
    const url = new URL(value);
    return url.protocol === 'https:' && url.hostname === 'checkout.stripe.com' ? url.href : null;
  } catch {
    return null;
  }
}

/** Share of the hold still left, 0–1, for a draining progress line (assumes 10 minutes if unknown). */
export function holdFractionLeft(startedAt: string | null | undefined, expiresAt: string, remainingMs: number): number {
  const start = startedAt ? Date.parse(startedAt) : NaN;
  const end = Date.parse(expiresAt);
  const total = Number.isFinite(start) && Number.isFinite(end) && end > start ? end - start : 10 * 60 * 1000;
  return Math.min(1, Math.max(0, remainingMs / total));
}
