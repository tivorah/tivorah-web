"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import type { ReactNode } from "react";

export function BusinessShell({ children }: { children: ReactNode }) {
  const path = usePathname();
  const params = useSearchParams();
  const view = params.get("view") === "events" || path.startsWith("/business/events/") ? "events" : "products";
  const createType = path === "/business/create" ? params.get("type") : null;
  const active = (name: string) => name === "events" ? view === "events" && !createType && (path === "/business" || path.startsWith("/business/events/")) : view === "products" && !createType && (path === "/business" || path.startsWith("/business/listings/"));
  if (path.startsWith("/business/events/") || path.startsWith("/business/listings/")) return <div className="product-page page-shell event-manage-shell">{children}</div>;
  // The shop preview is a full page, exactly like the public shop.
  if (path === "/business/showcase/preview") return <>{children}</>;
  return <div className="product-page page-shell business-shell"><div className="business-workspace">
    <aside className="business-sidebar" aria-label="Business navigation">
      <Link className="business-sidebar-account" href="/account">← Your account</Link>
      <div className="business-sidebar-title"><p className="product-eyebrow">YOUR TIVORAH</p><strong>Business</strong></div>
      <nav className="business-sidebar-nav" aria-label="Manage business">
        <Link href="/business?view=listings" aria-current={active("products") ? "page" : undefined}>Listings</Link>
        <Link href="/business?view=events" aria-current={active("events") ? "page" : undefined}>Events</Link>
      </nav>
      <div className="business-sidebar-group"><p>Create</p>
        <Link href="/business/create?type=event" aria-current={createType === "event" ? "page" : undefined}>Create an event</Link>
        <Link href="/business/create?type=service" aria-current={createType === "service" ? "page" : undefined}>Offer a service</Link>
        <Link href="/business/create?type=item" aria-current={createType === "item" ? "page" : undefined}>Sell an item</Link>
      </div>
      <div className="business-sidebar-group"><p>Tools</p>
        <Link href="/account/bookings">Customer appointments</Link>
        <Link href="/business/showcase" aria-current={path === "/business/showcase" ? "page" : undefined}>Your shop</Link>
        <Link href="/business/payouts" aria-current={path === "/business/payouts" ? "page" : undefined}>Payout settings</Link>
      </div>
    </aside>
    <div className="business-workspace-main">
      <nav className="business-mobile-controls" aria-label="Business navigation on phones">
        <div className="business-mobile-tabs">
          <Link href="/business?view=listings" aria-current={active("products") ? "page" : undefined}>Listings</Link>
          <Link href="/business?view=events" aria-current={active("events") ? "page" : undefined}>Events</Link>
        </div>
        <details className="business-mobile-create"><summary>Create on Tivorah</summary><div>
          <Link href="/business/create?type=event">Create an event</Link>
          <Link href="/business/create?type=service">Offer a service</Link>
          <Link href="/business/create?type=item">Sell an item</Link>
        </div></details>
        <details className="business-mobile-create business-mobile-tools-menu"><summary>Business tools</summary><div>
          <Link href="/account/bookings">Customer appointments</Link>
          <Link href="/business/showcase">Your shop</Link>
          <Link href="/business/payouts">Payout settings</Link>
        </div></details>
      </nav>
      {children}
    </div>
  </div></div>;
}

export function BusinessShellFallback({ children }: { children: ReactNode }) {
  const path = usePathname();
  if (path.startsWith("/business/events/") || path.startsWith("/business/listings/")) return <div className="product-page page-shell event-manage-shell">{children}</div>;
  if (path === "/business/showcase/preview") return <>{children}</>;
  return <div className="product-page page-shell business-shell"><div className="business-workspace"><aside className="business-sidebar" aria-label="Business navigation"><Link className="business-sidebar-account" href="/account">← Your account</Link><div className="business-sidebar-title"><p className="product-eyebrow">YOUR TIVORAH</p><strong>Business</strong></div></aside><div className="business-workspace-main">{children}</div></div></div>;
}
