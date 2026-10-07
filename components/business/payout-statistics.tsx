"use client";
import { SellerEarnings } from "./seller-earnings";
import { usePrivateResource } from '../../hooks/use-private-resource';

type CurrencySummary = { currency: string; minorUnitExponent: number; paidOutAmount: number; paidOutCount: number; availableAmount: number; pendingAmount: number; inTransitAmount: number };
type PayoutSummary = { connected: boolean; livemode?: boolean; updatedAt?: string; currencies: CurrencySummary[] };
const metrics = [
  { key: 'paidOutAmount', label: 'In your bank' },
  { key: 'availableAmount', label: 'Ready for payout' },
  { key: 'pendingAmount', label: 'Clearing' },
  { key: 'inTransitAmount', label: 'On the way' },
] as const;

export default function PayoutStatistics({ view = 'payouts', connected = true }: { view?: 'payouts' | 'payments'; connected?: boolean }) {
  const { data, loading, error, retry } = usePrivateResource<PayoutSummary>('/payments/connect/payout-summary');
  return <><div id="payout-view-payments" hidden={view !== 'payments'}><SellerEarnings testMode={data?.livemode === false} /></div><section id="payout-view-payouts" hidden={view !== 'payouts' || !connected} className="payouts-statistics" aria-labelledby="payout-overview-title">
    <header className="payouts-statistics-header"><h2 id="payout-overview-title">Your bank payouts</h2><button type="button" className="product-secondary" disabled={loading} onClick={retry}>{loading && data ? 'Refreshing…' : 'Refresh amounts'}</button></header>
    {loading && !data ? <div className="payouts-amount-grid" role="status" aria-label="Loading payout amounts" aria-busy="true">{metrics.map(metric => <div className="payouts-card" key={metric.key} aria-hidden="true"><span className="tivorah-shimmer payouts-skeleton-label" /><span className="tivorah-shimmer payouts-skeleton-status" /></div>)}</div> : data?.connected ? <>
      {!data.livemode ? <p className="payouts-statistics-note">Test mode · These amounts are not real bank payouts.</p> : null}
      {data.currencies.length ? data.currencies.map(currency => <div key={currency.currency}>
        <h3 className="payouts-currency">{currency.currency}</h3>
        <dl className="payouts-amount-grid">{metrics.map(metric => <div className="payouts-card" key={metric.key}>
          <dt>{metric.label}</dt>
          <dd className="payouts-amount">{new Intl.NumberFormat('en-AU', { style: 'currency', currency: currency.currency, currencyDisplay: 'code' }).format(currency[metric.key] / 10 ** currency.minorUnitExponent)}</dd>
        </div>)}</dl>
      </div>) : <p>No payout activity yet. Your amounts will appear here once Stripe has a balance or payout.</p>}
      <p className="payouts-statistics-note">After Stripe fees and refunds. For sales, open Payments.</p>
      {data.updatedAt ? <p className="payouts-statistics-note">Updated {new Date(data.updatedAt).toLocaleString('en-AU')}</p> : null}
    </> : data ? <p>Connect Stripe to see payout amounts.</p> : null}
    {error ? <div className="product-notice" role="alert"><p>{data ? 'Could not refresh amounts. Showing the last update.' : 'Payout amounts could not load. Try again or open Stripe.'}</p><button type="button" className="product-secondary" disabled={loading} onClick={retry}>Try again</button></div> : null}
  </section></>;
}
