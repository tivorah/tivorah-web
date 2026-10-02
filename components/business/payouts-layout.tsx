import type { ReactNode } from "react";

export function PayoutsLayout({ children }: { children: ReactNode }) {
  return <section className="business-payouts">
    <header className="business-payouts-heading"><p className="product-eyebrow">YOUR BUSINESS</p><h1>Payout settings</h1><p>Manage payments, payouts and your connected Stripe account.</p></header>
    {children}
  </section>;
}

export function PayoutsLoading() {
  return <PayoutsLayout><div className="payouts-loading" role="status" aria-label="Loading payout settings" aria-busy="true">
    <div className="payouts-status-grid" aria-hidden="true">{[0, 1].map(key => <div className="payouts-card" key={key}><span className="tivorah-shimmer payouts-skeleton-label" /><span className="tivorah-shimmer payouts-skeleton-status" /><span className="tivorah-shimmer payouts-skeleton-copy" /></div>)}</div>
    <div className="payouts-card payouts-account-card" aria-hidden="true"><span className="tivorah-shimmer payouts-skeleton-title" /><span className="tivorah-shimmer payouts-skeleton-copy" /><span className="tivorah-shimmer payouts-skeleton-button" /></div>
    <div className="payouts-card" aria-hidden="true"><span className="tivorah-shimmer payouts-skeleton-title" /><span className="tivorah-shimmer payouts-skeleton-copy" /></div>
  </div></PayoutsLayout>;
}
