"use client";
import { BookingSetupNotice } from "../booking-setup-notice";
import { AccountSurfaceLoading } from "../../account/surface-loading";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { AccountGate } from "../../account/gate";
import { usePrivateResource } from "../../../hooks/use-private-resource";
import { useMutation } from "../../../hooks/use-mutation";
import { ManagedEvent } from "./types";
import { EventDetails } from "./details";
import { EventPhotos } from "./photos";
import { EventTicketTypes } from "./tickets";
import { EventRecords } from "./records";
import { EventGroups } from "./groups";
import { EventCheckIn } from "./check-in";
import { CancelEventDialog, RefundProgress } from "./cancellation";
import { money } from "../../../lib/api/discovery";

type Summary = { ticketsBooked: number; bookings: number; checkedIn?: number; groupBookings?: number; groupTickets?: number; remaining?: number; collectedCents?: number; attendees?: number; newGroupRequests?: number };

// Key numbers at the top of every tab.
function EventStats({ id, version }: { id: number; version: number }) {
  const { data, retry } = usePrivateResource<Summary>(`/events/${id}/business-summary`);
  useEffect(() => { if (version) retry(); }, [version]); // eslint-disable-line react-hooks/exhaustive-deps
  const stats: [string, string | number | undefined, string?][] = [
    ["Attendees", data?.attendees, data ? `${data.bookings} ${data.bookings === 1 ? "order" : "orders"}` : undefined],
    ["Places left", data?.remaining],
    ["Checked in", data?.checkedIn, data?.attendees ? `${Math.round(((data.checkedIn ?? 0) / data.attendees) * 100)}% of attendees` : undefined],
    ["Collected", data ? money(data.collectedCents ?? 0) : undefined, "After refunds"],
    ["Group bookings", data?.groupBookings, data?.newGroupRequests ? `${data.newGroupRequests} new ${data.newGroupRequests === 1 ? "request" : "requests"}` : undefined],
  ];
  return <dl className="event-stats" aria-busy={!data || undefined}>
    {stats.map(([label, value, note]) => <div key={label}><dt>{label}</dt><dd>{value === undefined ? <span className="event-stat-skel tivorah-shimmer" aria-hidden="true" /> : value}</dd>{note ? <span className="event-stat-note">{note}</span> : null}</div>)}
  </dl>;
}

// "More" menu: a real menu button with clear rows instead of nested disclosures.
function MoreMenu({ published, busy, onUnpublish, onCancel }: { published: boolean; busy: boolean; onUnpublish: () => void; onCancel: () => void }) {
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const close = (event: MouseEvent | KeyboardEvent) => { if (event instanceof KeyboardEvent ? event.key === "Escape" : !root.current?.contains(event.target as Node)) setOpen(false); };
    document.addEventListener("mousedown", close); document.addEventListener("keydown", close);
    return () => { document.removeEventListener("mousedown", close); document.removeEventListener("keydown", close); };
  }, [open]);
  return <div className="event-more" ref={root}>
    <button type="button" className="event-more-trigger" aria-haspopup="menu" aria-expanded={open} onClick={() => setOpen((value) => !value)} aria-label="More event options">
      <svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><circle cx="5" cy="12" r="2" /><circle cx="12" cy="12" r="2" /><circle cx="19" cy="12" r="2" /></svg>
    </button>
    {open ? <div className="event-more-menu" role="menu">
      {published ? <button type="button" role="menuitem" disabled={busy} onClick={() => { setOpen(false); onUnpublish(); }}>
        <strong>Unpublish</strong><span>Hide the event and stop new bookings. Existing tickets stay valid.</span>
      </button> : null}
      <button type="button" role="menuitem" className="is-danger" disabled={busy} onClick={() => { setOpen(false); onCancel(); }}>
        <strong>Cancel event</strong><span>Tell ticket holders it’s cancelled and refund them.</span>
      </button>
    </div> : null}
  </div>;
}


const tabs = [
  "Details",
  "Photos",
  "Tickets",
  "Orders & attendees",
  "Groups",
  "Check-in",
] as const;
function Workspace({ id, accountId }: { id: string; accountId: number }) {
  const { data, loading, error, retry } = usePrivateResource<ManagedEvent>(
    `/events/${id}`,
  );
  const [tab, setTab] = useState<(typeof tabs)[number]>("Details");
  const [version, setVersion] = useState(0);
  const [cancelOpen, setCancelOpen] = useState(false);
  const mutation = useMutation(() => { retry(); setVersion((value) => value + 1); });
  if (loading && !data) return <AccountSurfaceLoading embedded route={`/business/events/${id}`} />;
  if (error || !data)
    return (
      <div role="alert">
        <p>{error || "Event unavailable."}</p>
        <button className="product-secondary" onClick={retry}>
          Try again
        </button>
      </div>
    );
  if (data.organizerId !== accountId)
    return <p>You can manage only your own events.</p>;
  return (
    <div className="event-manage">
      <nav className="account-ticket-breadcrumb" aria-label="Breadcrumb"><Link href="/business?view=events">Your events</Link><span aria-hidden="true">›</span><span aria-current="page">Manage event</span></nav>
      <header className="event-manage-header">
        <div><p className="product-eyebrow">EVENT WORKSPACE <span className="event-manage-status">{data.status}</span></p><h1>{data.title}</h1><p className="event-manage-meta">{new Date(data.startsAt).toLocaleDateString("en-AU", { weekday: "short", day: "numeric", month: "long", year: "numeric" })} · {data.locationType === "online" ? "Online event" : [data.venueName, data.suburb, data.state].filter(Boolean).join(", ") || "Location to be confirmed"}</p></div>
        <div className="event-manage-actions">
          {data.status === "draft" ? <button className="product-primary" disabled={mutation.busy} onClick={() => mutation.run(`/events/${id}/publish`, "POST", undefined, "Your event is published.")}>{mutation.busy ? "Publishing…" : "Publish event"}</button> : null}
          {data.status === "published" ? <Link className="product-secondary press-fx" href={`/events/${id}`}>View public event <span aria-hidden="true">↗</span></Link> : null}
          {!["deleted", "cancelled"].includes(data.status) ? <MoreMenu published={data.status === "published"} busy={mutation.busy}
            onUnpublish={() => void mutation.run(`/events/${id}/unpublish`, "POST", undefined, "Your event is unpublished. Existing tickets are still valid.")}
            onCancel={() => setCancelOpen(true)} /> : null}
        </div>
      </header>
      <CancelEventDialog eventId={data.id} title={data.title} open={cancelOpen} onClose={() => setCancelOpen(false)} onCancelled={() => { retry(); setVersion((value) => value + 1); }} />
      {["cancelling", "cancelled"].includes(data.status) ? <RefundProgress eventId={data.id} /> : null}
      <EventStats id={data.id} version={version} />
      <BookingSetupNotice issues={mutation.setupIssues.length ? mutation.setupIssues : data.setupIssues} />
      {mutation.error ? <p className="product-notice" role="alert">{mutation.error}</p> : null}
      {mutation.notice ? <p className="product-notice" role="status">{mutation.notice}</p> : null}
      <nav className="event-manage-tabs" aria-label="Manage event">
        {tabs.map(value => <button key={value} type="button" aria-pressed={tab === value} onClick={() => setTab(value)}>{value}</button>)}
      </nav>
      <div className="event-manage-content">
        {tab === "Details" ? <EventDetails key={`${id}:${data.startsAt}`} event={data} refresh={retry} />
          : tab === "Photos" ? <EventPhotos key={data.id} event={data} refresh={retry} />
          : tab === "Tickets" ? <EventTicketTypes event={data} refresh={retry} />
          : tab === "Orders & attendees" ? <EventRecords id={data.id} />
          : tab === "Groups" ? <EventGroups event={data} />
          : <EventCheckIn id={data.id} published={data.status === "published"} />}
      </div>
    </div>
  );
}

export function EventWorkspace({ id }: { id: string }) {
  return (
    <AccountGate>
      {(account) => <Workspace id={id} accountId={account.id} />}
    </AccountGate>
  );
}
