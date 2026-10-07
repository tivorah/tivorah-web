"use client";
import { useState } from 'react';
import { usePrivateResource } from '../../hooks/use-private-resource';
import { money } from '../../lib/api/discovery';

type Source = 'all' | 'event' | 'service';
type Currency = { currency: string; collectedCents: number; payments: number };
type Payment = { source: 'event' | 'service'; id: number; title: string; reference: string; createdAt: string; currency: string; totalCents: number; status: string };
type Summary = { totals: Record<Source, Currency[]>; recentPayments?: Record<Source, Payment[]>; updatedAt: string };
const labels = { all: 'All booking payments', event: 'Event ticket payments', service: 'Service payments' };
export function SellerEarnings({ testMode = false }: { testMode?: boolean }) {
  const { data, error, loading, retry } = usePrivateResource<Summary>('/payments/connect/earnings-summary');
  const [source, setSource] = useState<Source>('all');
  const recent = data?.recentPayments?.[source] ?? [];
  return <section className="booking-payments" aria-label="Booking payments">
    <header className="payouts-statistics-header"><h2>Customer payments</h2><button type="button" className="product-secondary" disabled={loading} onClick={retry}>{loading && data ? 'Refreshing…' : 'Refresh payments'}</button></header>
    <p className="payouts-statistics-note">Before fees and refunds.</p>
    <nav className="event-manage-tabs" aria-label="Booking payment category">{([{ key: 'all', label: 'All' }, { key: 'event', label: 'Events' }, { key: 'service', label: 'Services' }] as const).map(tab => <button type="button" key={tab.key} aria-pressed={source === tab.key} onClick={() => setSource(tab.key)}>{tab.label}</button>)}</nav>
    {testMode ? <p className="payouts-statistics-note">Sandbox bookings · These amounts are test payments.</p> : null}
    <h3 aria-live="polite">{labels[source]}</h3>
    {loading && !data ? <div className="payouts-card" role="status" aria-label="Loading booking payments"><span className="tivorah-shimmer payouts-skeleton-label" /><span className="tivorah-shimmer payouts-skeleton-status" /></div> : data ? data.totals[source].length ? data.totals[source].map(row => <div className="payouts-card" key={row.currency}>
      <p className="payouts-amount">{money(row.collectedCents, row.currency)}</p><p>{row.payments} paid {row.payments === 1 ? 'booking' : 'bookings'} · {row.currency}</p>
      {source === 'all' ? <dl className="booking-payment-breakdown">{(['event', 'service'] as const).map(kind => <div key={kind}><dt>{kind === 'event' ? 'Event tickets' : 'Services'}</dt><dd>{money(data.totals[kind].find(item => item.currency === row.currency)?.collectedCents ?? 0, row.currency)}</dd></div>)}</dl> : null}
    </div>) : <p>No paid {source === 'all' ? 'event or service' : source === 'event' ? 'event' : 'service'} bookings yet.</p> : null}
    {error ? <div role="alert"><p>{data ? 'Could not refresh payments. Showing the last update.' : 'Booking payments couldn’t load.'}</p><button type="button" className="product-secondary" disabled={loading} onClick={retry}>Retry booking payments</button></div> : null}
    {recent.length ? <section aria-label="Recent booking payments"><h3>Recent {source === 'all' ? 'bookings' : source === 'event' ? 'event bookings' : 'service bookings'}</h3><div className="booking-payment-table-wrap"><table className="booking-payment-table"><caption className="sr-only">Recent customer payments, before fees and refunds</caption><thead><tr><th scope="col">Booking</th><th scope="col">Type</th><th scope="col">Booked</th><th scope="col">Status</th><th scope="col">Customer paid</th></tr></thead><tbody>{recent.map(payment => <tr key={`${payment.source}-${payment.id}`}>
      <th scope="row"><strong>{payment.title}</strong><span className="payouts-statistics-note">{payment.reference}</span></th>
      <td data-label="Type">{payment.source === 'event' ? 'Event tickets' : 'Service booking'}</td>
      <td data-label="Booked">{new Date(payment.createdAt).toLocaleDateString('en-AU')}</td>
      <td data-label="Status">{payment.status === 'refunded' ? 'Refunded' : 'Paid'}</td>
      <td data-label="Customer paid"><strong>{money(payment.totalCents, payment.currency)}</strong></td>
    </tr>)}</tbody></table></div></section> : null}
  </section>;
}
