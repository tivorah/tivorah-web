"use client";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import type { ReactNode } from "react";
import { featuresForPath, useFeature } from "../discovery/features";
import { openCount, useSellerRequests } from "../business/booking-requests";
import { BarIcon, type BarIconName } from "./nav-icons";
import "./section-nav.css";

// Side navigation for Your account and the business workspace. Wider screens show it as a sidebar
// beside the page (SectionSidebar); phones and tablets get the same links, with their icons, at the
// top of the header's slide-out menu (SectionMenuLinks in app/site-header.tsx). There is no bottom
// bar on the web.

type SectionLink = { href: string; label: string; icon: BarIconName; current: boolean; badge?: "seller-requests" };
type SectionGroup = { label: string; links: SectionLink[] };
export type Section = { key: "account" | "business"; title: string; groups: SectionGroup[]; footer: { href: string; label: string; icon: BarIconName } };

/** The nav for the area this page is in, or null on pages that have none (public pages, Manage event…). */
export function useSection(): Section | null {
  const path = usePathname();
  const params = useSearchParams();
  const on = useFeature();
  const available = (links: SectionLink[]) => links.filter((link) => featuresForPath(link.href).every(on));
  const at = (href: string) => path === href || path.startsWith(`${href}/`);
  const tidy = (groups: SectionGroup[]) => groups.map((group) => ({ ...group, links: available(group.links) })).filter((group) => group.links.length);

  if (path === "/account" || path.startsWith("/account/")) return {
    key: "account",
    title: "Your account",
    groups: tidy([{ label: "Your account", links: [
      { href: "/account", label: "Overview", icon: "home", current: path === "/account" },
      { href: "/account/tickets", label: "Tickets", icon: "ticket", current: at("/account/tickets") || at("/account/orders") },
      { href: "/account/bookings", label: "Appointments", icon: "appointments", current: at("/account/bookings") },
      { href: "/account/item-orders", label: "Your orders", icon: "orders", current: at("/account/item-orders") },
      { href: "/account/messages", label: "Messages", icon: "messages", current: at("/account/messages") },
      { href: "/account/notifications", label: "Notifications", icon: "notifications", current: at("/account/notifications") },
      { href: "/account/settings", label: "Settings", icon: "settings", current: at("/account/settings") },
    ] }]),
    footer: { href: "/business", label: "Manage your business", icon: "business" },
  };

  if (path.startsWith("/business") && !path.startsWith("/business/events/") && !path.startsWith("/business/listings/") && path !== "/business/shop/preview") {
    const createType = path === "/business/create" ? params.get("type") : null;
    const view = params.get("view") === "events" ? "events" : "listings";
    return {
      key: "business",
      title: "Business workspace",
      groups: tidy([
        { label: "Manage", links: [
          { href: "/business?view=listings", label: "Listings", icon: "listings", current: path === "/business" && view === "listings" },
          { href: "/business?view=events", label: "Events", icon: "events", current: path === "/business" && view === "events" },
          { href: "/business/hubs", label: "Hubs", icon: "hubs", current: at("/business/hubs") && path !== "/business/hubs/new" },
        ] },
        { label: "Create", links: [
          { href: "/business/create?type=event", label: "Create an event", icon: "event-add", current: createType === "event" },
          { href: "/business/create?type=service", label: "Offer a service", icon: "services", current: createType === "service" },
          { href: "/business/create?type=item", label: "Sell an item", icon: "item", current: createType === "item" },
          { href: "/business/hubs/new", label: "Create a Hub", icon: "hub-add", current: path === "/business/hubs/new" },
          { href: "/business/shop", label: "Your shop", icon: "shop", current: path === "/business/shop" },
        ] },
        { label: "Tools", links: [
          { href: "/business/orders", label: "Item orders", icon: "orders", current: path === "/business/orders" },
          { href: "/business/appointments", label: "Appointments", icon: "availability", current: path === "/business/appointments" },
          { href: "/business/requests", label: "Refunds & complaints", icon: "requests", current: path === "/business/requests", badge: "seller-requests" },
          { href: "/business/payouts", label: "Payout settings", icon: "payouts", current: path === "/business/payouts" },
        ] },
      ]),
      footer: { href: "/account", label: "Your account", icon: "back" },
    };
  }
  return null;
}

/** Refunds and complaints waiting for the seller's reply. */
function SellerRequestsBadge() {
  const requests = useSellerRequests();
  const waiting = openCount(requests.data, "refund") + openCount(requests.data, "complaint");
  return waiting ? <span className="section-nav-badge" aria-label={`${waiting} waiting`}>{waiting}</span> : null;
}

function Links({ section, onNavigate }: { section: Section; onNavigate?: () => void }) {
  return <>
    {section.groups.map((group) => <div className="section-nav-group" key={group.label}>
      <p>{group.label}</p>
      {group.links.map((link) => <Link key={link.href} href={link.href} onClick={onNavigate} aria-current={link.current ? "page" : undefined}>
        <BarIcon name={link.icon} /><span>{link.label}</span>{link.badge === "seller-requests" ? <SellerRequestsBadge /> : null}
      </Link>)}
    </div>)}
  </>;
}

/** Sidebar beside the page on wider screens (hidden on phones and tablets, where the header menu has it). */
export function SectionSidebar({ section, identity }: { section: Section; identity?: ReactNode }) {
  const label = section.key === "account" ? "Your account" : "Manage business";
  return <aside className="section-sidebar" aria-label={`${section.title} navigation`}>
    {identity}
    <nav className="section-nav" aria-label={label}><Links section={section} /></nav>
    <Link className="section-sidebar-footer" href={section.footer.href}><BarIcon name={section.footer.icon} /><span>{section.footer.label}</span></Link>
  </aside>;
}

/** The same links at the top of the header's slide-out menu. */
export function SectionMenuLinks({ section, onNavigate }: { section: Section; onNavigate: () => void }) {
  return <nav className="section-nav section-nav-menu" aria-label={section.key === "account" ? "Your account" : "Manage business"}>
    <Links section={section} onNavigate={onNavigate} />
    <Link className="section-sidebar-footer" href={section.footer.href} onClick={onNavigate}><BarIcon name={section.footer.icon} /><span>{section.footer.label}</span></Link>
  </nav>;
}
