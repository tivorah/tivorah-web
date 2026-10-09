"use client";
import Link from "next/link";
import { useEffect, type ReactNode } from "react";
import "./bottom-bar.css";

// Phone bottom bar shared by every context: public discovery, Your account, Business, and the
// Manage event / Manage listing workspaces. Each context passes its own destinations.

const paths = {
  events: <><rect x="3.5" y="5" width="17" height="15.5" rx="3" /><path d="M3.5 10h17M8 3v4M16 3v4" /></>,
  shop: <><path d="M5 8h14l-1.2 11.2a2 2 0 0 1-2 1.8H8.2a2 2 0 0 1-2-1.8z" /><path d="M9 8V6.5a3 3 0 0 1 6 0V8" /></>,
  services: <><path d="m12 3 1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9z" /><path d="M18.5 16.5 19.3 19l2.2.8-2.2.8-.8 2.4-.8-2.4-2.2-.8 2.2-.8z" /></>,
  hubs: <><circle cx="12" cy="8" r="3.2" /><circle cx="6" cy="16" r="3.2" /><circle cx="18" cy="16" r="3.2" /></>,
  account: <><circle cx="12" cy="8.5" r="4" /><path d="M4.5 20.5c1.4-3.6 4.2-5.4 7.5-5.4s6.1 1.8 7.5 5.4" /></>,
  home: <><path d="M4 11 12 4l8 7v8.5a1.5 1.5 0 0 1-1.5 1.5H15v-6H9v6H5.5A1.5 1.5 0 0 1 4 19.5z" /></>,
  ticket: <><path d="M4 7.5A1.5 1.5 0 0 1 5.5 6h13A1.5 1.5 0 0 1 20 7.5V10a2 2 0 0 0 0 4v2.5a1.5 1.5 0 0 1-1.5 1.5h-13A1.5 1.5 0 0 1 4 16.5V14a2 2 0 0 0 0-4z" /><path d="M14 6v12" strokeDasharray="2 2" /></>,
  appointments: <><rect x="3.5" y="5" width="17" height="15.5" rx="3" /><path d="M3.5 10h17M8 3v4M16 3v4M9 15l2 2 4-4" /></>,
  messages: <><path d="M5 5h14a1.5 1.5 0 0 1 1.5 1.5v9A1.5 1.5 0 0 1 19 17h-8l-4.5 3.5V17H5a1.5 1.5 0 0 1-1.5-1.5v-9A1.5 1.5 0 0 1 5 5z" /></>,
  business: <><rect x="3.5" y="7.5" width="17" height="12.5" rx="2.5" /><path d="M9 7.5V6a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v1.5M3.5 13h17" /></>,
  listings: <><rect x="3.5" y="4" width="7" height="7" rx="2" /><rect x="13.5" y="4" width="7" height="7" rx="2" /><rect x="3.5" y="13.5" width="7" height="7" rx="2" /><rect x="13.5" y="13.5" width="7" height="7" rx="2" /></>,
  create: <><path d="M12 5v14M5 12h14" /></>,
  requests: <><path d="M4 13.5 6.5 5h11L20 13.5V19a1.5 1.5 0 0 1-1.5 1.5h-13A1.5 1.5 0 0 1 4 19z" /><path d="M4 13.5h4.5a3.5 3.5 0 0 0 7 0H20" /></>,
  more: <><circle cx="5.5" cy="12" r="1.3" /><circle cx="12" cy="12" r="1.3" /><circle cx="18.5" cy="12" r="1.3" /></>,
  details: <><path d="M15.5 4.5 19.5 8.5 8.5 19.5H4.5v-4z" /><path d="m13 7 4 4" /></>,
  photos: <><rect x="3.5" y="4.5" width="17" height="15" rx="3" /><circle cx="9" cy="10" r="1.8" /><path d="m20.5 16-5-5-8.5 8.5" /></>,
  orders: <><path d="M6 3.5h12V21l-2-1.4-2 1.4-2-1.4-2 1.4-2-1.4L6 21z" /><path d="M9 8h6M9 12h6" /></>,
  checkin: <><rect x="4" y="4" width="16" height="16" rx="4" /><path d="m8.5 12 2.5 2.5 4.5-5" /></>,
  customers: <><circle cx="9" cy="8.5" r="3.5" /><path d="M2.8 20c1-3.2 3.3-4.8 6.2-4.8s5.2 1.6 6.2 4.8M15.5 5.2a3.5 3.5 0 0 1 0 6.6M17.5 15.5c1.8.6 3 2 3.7 4.5" /></>,
  availability: <><circle cx="12" cy="12" r="8.5" /><path d="M12 7.5V12l3 2" /></>,
  share: <><circle cx="17.5" cy="5.5" r="2.5" /><circle cx="6.5" cy="12" r="2.5" /><circle cx="17.5" cy="18.5" r="2.5" /><path d="m8.7 10.8 6.6-4M8.7 13.2l6.6 4" /></>,
  groups: <><circle cx="8" cy="9" r="3" /><circle cx="16" cy="9" r="3" /><path d="M2.5 19c.8-2.8 2.8-4.2 5.5-4.2s4.7 1.4 5.5 4.2M13 15c.9-.2 1.9-.2 3-.2 2.7 0 4.7 1.4 5.5 4.2" /></>,
  payouts: <><rect x="3" y="6" width="18" height="13" rx="2.5" /><path d="M3 10.5h18M7 15h3" /></>,
  back: <><path d="M15 5 8 12l7 7" /></>,
  explore: <><circle cx="12" cy="12" r="8.5" /><path d="m15.5 8.5-2 5-5 2 2-5z" /></>,
} satisfies Record<string, ReactNode>;
export type BarIconName = keyof typeof paths;

export function BarIcon({ name }: { name: BarIconName }) {
  return <svg className="bar-icon" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">{paths[name]}</svg>;
}

export type BarItem = {
  key: string; label: string; icon: BarIconName; current?: boolean; badge?: number;
  href?: string; onClick?: () => void; expanded?: boolean; accent?: boolean;
};

export function BottomBar({ label, items }: { label: string; items: BarItem[] }) {
  return (
    <nav className="app-bottom-bar" aria-label={label}>
      {items.map((item) => {
        const body = <>
          <span className={`app-bottom-bar-icon${item.accent ? " is-accent" : ""}`}><BarIcon name={item.icon} />{item.badge ? <i aria-hidden="true">{item.badge > 9 ? "9+" : item.badge}</i> : null}</span>
          <span className="app-bottom-bar-label">{item.label}</span>
          {item.badge ? <span className="app-bottom-bar-sr">, {item.badge} need attention</span> : null}
        </>;
        return item.href
          ? <Link key={item.key} href={item.href} aria-current={item.current ? "page" : undefined}>{body}</Link>
          : <button key={item.key} type="button" aria-current={item.current ? "page" : undefined} aria-expanded={item.expanded} onClick={item.onClick}>{body}</button>;
      })}
    </nav>
  );
}

export type SheetItem = { key: string; label: string; hint?: string; icon: BarIconName; href?: string; onClick?: () => void; current?: boolean; badge?: number };

/** Slide-up list for "More" and "Create": tap outside, Escape or pick an item to close. */
export function BottomSheet({ open, title, items, onClose }: { open: boolean; title: string; items: SheetItem[]; onClose: () => void }) {
  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => { if (event.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);
  if (!open) return null;
  return (
    <>
      <div className="app-bottom-sheet-backdrop" onClick={onClose} />
      <div className="app-bottom-sheet" role="dialog" aria-modal="true" aria-label={title}>
        <span className="app-bottom-sheet-grip" aria-hidden="true" />
        <p className="app-bottom-sheet-title">{title}</p>
        <div className="app-bottom-sheet-group">
          {items.map((item) => {
            const body = <>
              <span className="app-bottom-sheet-icon"><BarIcon name={item.icon} /></span>
              <span className="app-bottom-sheet-copy"><strong>{item.label}</strong>{item.hint ? <small>{item.hint}</small> : null}</span>
              {item.badge ? <span className="app-bottom-sheet-badge">{item.badge}</span> : <span className="app-bottom-sheet-chevron" aria-hidden="true">›</span>}
            </>;
            return item.href
              ? <Link key={item.key} href={item.href} aria-current={item.current ? "page" : undefined} onClick={onClose}>{body}</Link>
              : <button key={item.key} type="button" aria-current={item.current ? "page" : undefined} onClick={() => { onClose(); item.onClick?.(); }}>{body}</button>;
          })}
        </div>
      </div>
    </>
  );
}
