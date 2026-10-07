import type { ReactNode } from "react";

export function PayoutsLayout({ children }: { children: ReactNode }) {
  return <section className="business-payouts">
    <header className="business-payouts-heading"><p className="product-eyebrow">YOUR BUSINESS</p><h1>Payouts</h1></header>
    {children}
  </section>;
}

export function PayoutsLoading() {
  return <PayoutsLayout><div className="payouts-loading" role="status" aria-label="Loading payout settings" aria-busy="true">
    <div className="payouts-loading-tabs" aria-hidden="true">{[0, 1, 2].map(key => <span key={key} className="tivorah-shimmer" />)}</div>
    <div className="payouts-amount-grid" aria-hidden="true">{[0, 1, 2, 3].map(key => <div className="payouts-card" key={key}><span className="tivorah-shimmer payouts-skeleton-label" /><span className="tivorah-shimmer payouts-skeleton-status" /></div>)}</div>
    <div className="payouts-card payouts-account-card" aria-hidden="true"><span className="tivorah-shimmer payouts-skeleton-title" /><span className="tivorah-shimmer payouts-skeleton-button" /></div>
  </div></PayoutsLayout>;
}
