"use client";
import { Suspense, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { useDiscoveryFeatures } from "./features";
import type { DiscoveryKind } from "../../lib/api/discovery";
import { BottomBar, BottomSheet, type BarIconName } from "../ui/bottom-bar";
import { openCount, useSellerRequests } from "../business/booking-requests";

// Phone bottom bar, by context:
// - public pages (events, shop, services, hubs, shops): explore Tivorah
// - Your account: tickets, appointments, messages, business
// - Business dashboard: listings, events, create, requests, more
// - Manage event / Manage listing render their own tab bar (workspace-bottom-bar.tsx)
const destinations: [string, string, BarIconName][] = [
  ["/events", "Events", "events"],
  ["/shop", "Shop", "shop"],
  ["/services", "Services", "services"],
  ["/hubs", "Hubs", "hubs"],
  ["/account", "Account", "account"],
];

export function MobileProductNav() {
  return <Suspense fallback={null}><ContextNav /></Suspense>;
}

function ContextNav() {
  const path = usePathname();
  if (path.startsWith("/auth") || path.startsWith("/admin")) return null;
  if (path.startsWith("/business/events/") || path.startsWith("/business/listings/") || path === "/business/showcase/preview") return null;
  if (path.startsWith("/business")) return <BusinessNav path={path} />;
  if (path === "/account" || path.startsWith("/account/")) return <AccountNav path={path} />;
  if (destinations.some(([href]) => path === href || path.startsWith(`${href}/`)) || path.startsWith("/shops/")) return <ExploreNav path={path} />;
  return null;
}

function ExploreNav({ path }: { path: string }) {
  const { enabled } = useDiscoveryFeatures();
  const items = destinations
    .filter(([href]) => href === "/account" || enabled((href === "/shop" ? "items" : href.slice(1)) as DiscoveryKind))
    .map(([href, label, icon]) => ({ key: href, href, label, icon, current: path === href || path.startsWith(`${href}/`) || (href === "/shop" && path.startsWith("/shops/")) }));
  return <BottomBar label="Explore and account" items={items} />;
}

function AccountNav({ path }: { path: string }) {
  const at = (href: string) => path === href || path.startsWith(`${href}/`);
  return <BottomBar label="Your account" items={[
    { key: "home", href: "/account", label: "Overview", icon: "home", current: path === "/account" || at("/account/settings") || at("/account/notifications") },
    { key: "tickets", href: "/account/tickets", label: "Tickets", icon: "ticket", current: at("/account/tickets") || at("/account/orders") },
    { key: "bookings", href: "/account/bookings", label: "Bookings", icon: "appointments", current: at("/account/bookings") },
    { key: "messages", href: "/account/messages", label: "Messages", icon: "messages", current: at("/account/messages") },
    { key: "business", href: "/business", label: "Business", icon: "business" },
  ]} />;
}

function BusinessNav({ path }: { path: string }) {
  const params = useSearchParams();
  const [sheet, setSheet] = useState<"create" | "more" | null>(null);
  const requests = useSellerRequests();
  const waiting = openCount(requests.data, "refund") + openCount(requests.data, "complaint");
  const view = params.get("view") === "events" ? "events" : "listings";
  const moreCurrent = ["/business/payouts", "/business/showcase"].includes(path);
  return (
    <>
      <BottomBar label="Manage business" items={[
        { key: "listings", href: "/business?view=listings", label: "Listings", icon: "listings", current: path === "/business" && view === "listings" },
        { key: "events", href: "/business?view=events", label: "Events", icon: "events", current: path === "/business" && view === "events" },
        { key: "create", label: "Create", icon: "create", accent: true, current: path === "/business/create", expanded: sheet === "create", onClick: () => setSheet("create") },
        { key: "requests", href: "/business/requests", label: "Inbox", icon: "requests", badge: waiting, current: path === "/business/requests" },
        { key: "more", label: "More", icon: "more", current: moreCurrent, expanded: sheet === "more", onClick: () => setSheet("more") },
      ]} />
      <BottomSheet open={sheet === "create"} title="Create on Tivorah" onClose={() => setSheet(null)} items={[
        { key: "event", href: "/business/create?type=event", label: "Create an event", hint: "Sell tickets or take free RSVPs", icon: "events" },
        { key: "service", href: "/business/create?type=service", label: "Offer a service", hint: "Take bookings and payments", icon: "services" },
        { key: "item", href: "/business/create?type=item", label: "Sell an item", hint: "List something for local buyers", icon: "shop" },
      ]} />
      <BottomSheet open={sheet === "more"} title="Business tools" onClose={() => setSheet(null)} items={[
        { key: "appointments", href: "/account/bookings?role=provider", label: "Customer appointments", icon: "appointments" },
        { key: "shop", href: "/business/showcase", label: "Your shop", icon: "shop", current: path === "/business/showcase" },
        { key: "payouts", href: "/business/payouts", label: "Payout settings", icon: "payouts", current: path === "/business/payouts" },
        { key: "account", href: "/account", label: "Your account", hint: "Tickets, bookings and messages", icon: "account" },
        { key: "explore", href: "/events", label: "Explore Tivorah", icon: "explore" },
      ]} />
    </>
  );
}
