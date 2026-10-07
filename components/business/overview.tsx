"use client";

import Link from "next/link";
import { usePrivateResource } from "../../hooks/use-private-resource";

// Top of the business dashboard: greeting, quick create actions, key numbers and
// the two setup statuses sellers care about (shop showcase, payouts).
type Summary = {
  listings: { items: number; services: number };
  events: { upcoming: number; drafts: number };
  appointments: { upcoming: number };
  showcase: { status: "locked" | "none" | "draft" | "live" | "offline"; slug: string | null };
  payouts: { status: "not_started" | "incomplete" | "ready" };
};

const greeting = () => {
  const hour = new Date().getHours();
  return hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";
};

/** Loading state with the overview's exact shape: heading, actions, stats, status cards. */
export function BusinessOverviewSkeleton() {
  const bar = (name: string) => <span className={`${name} tivorah-shimmer`} />;
  return <section className="biz-overview biz-overview-skeleton" aria-hidden="true">
    <header className="biz-overview-head">
      <div>{bar("biz-skel-eyebrow")}{bar("biz-skel-title")}{bar("biz-skel-intro")}</div>
      <div className="biz-quick-actions">{bar("biz-skel-action is-primary")}{bar("biz-skel-action")}{bar("biz-skel-action")}</div>
    </header>
    <div className="biz-stats">{Array.from({ length: 4 }, (_, index) => <div key={index} className="biz-stat">{bar("biz-skel-label")}{bar("biz-skel-value")}</div>)}</div>
    <div className="biz-status-grid">{Array.from({ length: 2 }, (_, index) => <div key={index} className="biz-status"><div className="biz-status-top">{bar("biz-skel-heading")}{bar("biz-skel-pill")}</div>{bar("biz-skel-line")}{bar("biz-skel-button")}</div>)}</div>
  </section>;
}

export function BusinessOverview({ firstName }: { firstName: string }) {
  const { data } = usePrivateResource<Summary>("/web/business/summary");
  const stats: { label: string; value: number | undefined; note?: string; href: string }[] = [
    { label: "Items for sale", value: data?.listings.items, href: "/business?view=listings" },
    { label: "Services", value: data?.listings.services, href: "/business?view=listings" },
    { label: "Upcoming events", value: data?.events.upcoming, note: data?.events.drafts ? `${data.events.drafts} draft${data.events.drafts === 1 ? "" : "s"}` : undefined, href: "/business?view=events" },
    { label: "Upcoming appointments", value: data?.appointments.upcoming, href: "/account/bookings?role=provider" },
  ];
  const showcase = data?.showcase;
  const payouts = data?.payouts;
  const showcaseCopy = {
    live: ["Live", "Your shop is live with photos, videos and your introduction.", "Edit your shop"],
    draft: ["Draft", "Finish and publish your shop page so customers can meet you.", "Finish your shop"],
    offline: ["Offline", "Your shop is hidden from customers. Put it back online when you’re ready.", "Manage your shop"],
    none: ["Not set up", "Add photos, short videos and an introduction to stand out.", "Set up your shop"],
    locked: ["Locked", "Add your first item, service or event to open your shop page.", "Sell an item"],
  } as const;
  const payoutCopy = {
    ready: ["Ready", "You can receive payments for paid tickets and bookings.", "Manage payouts"],
    incomplete: ["Action needed", "Finish your Stripe setup to receive payments.", "Finish setup"],
    not_started: ["Not set up", "Set up payouts before offering paid tickets or bookings.", "Set up payouts"],
  } as const;

  return <section className="biz-overview" aria-label="Business overview">
    <header className="biz-overview-head">
      <div>
        <p className="product-eyebrow">YOUR BUSINESS</p>
        <h1>{greeting()}, {firstName}</h1>
        <p>Here’s what’s happening across your shop, services and events.</p>
      </div>
      <div className="biz-quick-actions" aria-label="Create">
        <Link className="product-primary" href="/business/create?type=item">+ Sell an item</Link>
        <Link className="product-secondary" href="/business/create?type=service">Offer a service</Link>
        <Link className="product-secondary" href="/business/create?type=event">Create an event</Link>
      </div>
    </header>

    <div className="biz-stats" aria-busy={!data || undefined}>
      {stats.map((stat) => <Link key={stat.label} className="biz-stat" href={stat.href}>
        <span className="biz-stat-label">{stat.label}</span>
        {stat.value === undefined ? <span className="biz-stat-value tivorah-shimmer biz-stat-loading" aria-hidden="true" /> : <strong className="biz-stat-value">{stat.value}</strong>}
        {stat.note ? <span className="biz-stat-note">{stat.note}</span> : null}
      </Link>)}
    </div>

    <div className="biz-status-grid">
      <article className="biz-status">
        <div className="biz-status-top"><h2>Your shop</h2>{showcase ? <span className={`biz-pill is-${showcase.status}`}>{showcaseCopy[showcase.status][0]}</span> : null}</div>
        {showcase ? <p>{showcaseCopy[showcase.status][1]}</p> : <span className="biz-skel-line tivorah-shimmer" aria-label="Checking your shop" role="status" />}
        <div className="biz-status-actions">
          <Link className="product-secondary" href={showcase?.status === "locked" ? "/business/create?type=item" : "/business/showcase"}>{showcase ? showcaseCopy[showcase.status][2] : "Open your shop"}</Link>
          {showcase?.status === "live" && showcase.slug ? <Link className="biz-text-link" href={`/shops/${encodeURIComponent(showcase.slug)}`}>View your shop ↗</Link> : null}
        </div>
      </article>
      <article className="biz-status">
        <div className="biz-status-top"><h2>Payouts</h2>{payouts ? <span className={`biz-pill is-${payouts.status}`}>{payoutCopy[payouts.status][0]}</span> : null}</div>
        {payouts ? <p>{payoutCopy[payouts.status][1]}</p> : <span className="biz-skel-line tivorah-shimmer" aria-label="Checking your payout setup" role="status" />}
        <div className="biz-status-actions"><Link className="product-secondary" href="/business/payouts">{payouts ? payoutCopy[payouts.status][2] : "Open payouts"}</Link></div>
      </article>
    </div>
  </section>;
}
