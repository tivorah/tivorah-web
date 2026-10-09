"use client";
import { useState } from "react";
import { BottomBar, BottomSheet, type BarIconName } from "../ui/bottom-bar";

const icons: Record<string, BarIconName> = {
  Details: "details", Photos: "photos", Tickets: "ticket", "Orders & attendees": "orders", Groups: "groups", "Check-in": "checkin",
  "Refund requests": "requests", Complaints: "requests", Customers: "customers", Enquiries: "messages", Availability: "availability", Sharing: "share",
};
const shortLabel: Record<string, string> = { "Orders & attendees": "Orders", "Refund requests": "Refunds" };

/**
 * Phone bottom bar for Manage event / Manage listing: the workspace's own tabs replace the
 * global bar. Up to four tabs sit in the bar; the rest, plus the way back, live under More.
 */
export function WorkspaceBottomBar<Tab extends string>({ label, tabs, primary, active, badge, onSelect, back }: {
  label: string; tabs: readonly Tab[]; primary: readonly Tab[]; active: Tab; badge?: (tab: Tab) => number;
  onSelect: (tab: Tab) => void; back: { href: string; label: string };
}) {
  const [moreOpen, setMoreOpen] = useState(false);
  const count = (tab: Tab) => badge?.(tab) ?? 0;
  const more = tabs.filter((tab) => !primary.includes(tab));
  const moreActive = more.includes(active);
  const choose = (tab: Tab) => { onSelect(tab); window.scrollTo({ top: 0, behavior: "smooth" }); };
  return (
    <>
      <BottomBar label={label} items={[
        ...tabs.filter((tab) => primary.includes(tab)).map((tab) => ({ key: tab, label: shortLabel[tab] ?? tab, icon: icons[tab] ?? "details", current: active === tab, badge: count(tab), onClick: () => choose(tab) })),
        { key: "more", label: moreActive ? shortLabel[active] ?? active : "More", icon: moreActive ? icons[active] ?? "more" : "more", current: moreActive, expanded: moreOpen, badge: more.reduce((sum, tab) => sum + count(tab), 0), onClick: () => setMoreOpen(true) },
      ]} />
      <BottomSheet open={moreOpen} title={label} onClose={() => setMoreOpen(false)} items={[
        ...more.map((tab) => ({ key: tab, label: tab, icon: icons[tab] ?? "details", current: active === tab, badge: count(tab), onClick: () => choose(tab) })),
        { key: "back", href: back.href, label: back.label, icon: "back" as const },
        { key: "account", href: "/account", label: "Your account", icon: "account" as const },
      ]} />
    </>
  );
}
