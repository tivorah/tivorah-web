"use client";
import { AccountSurfaceLoading } from "./surface-loading";
import Link from "next/link";
import { useRef, useState } from "react";
import { usePrivateResource } from "../../hooks/use-private-resource";
import { TicketPass, AccountTicket } from "./ticket-pass";
import { AccountGate } from "./gate";
import { useAccountSocketEvent } from "../../hooks/use-account-socket";
import { DetailPane, useCompactLayout } from "./detail-pane";
function TicketList() {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [pastPage, setPastPage] = useState(1);
  const preview = useRef<HTMLElement>(null);
  // Phones/tablets open the chosen ticket in a bottom sheet.
  const compact = useCompactLayout();
  const [sheetOpen, setSheetOpen] = useState(false);
  const { data, loading, error, retry } = usePrivateResource<{
    tickets: AccountTicket[];
  }>("/events/tickets/me");
  const tickets = data?.tickets ?? [];
  const [transferNotice, setTransferNotice] = useState<string | null>(null);
  // When a friend accepts a ticket this account sent, the API pushes it here live:
  // refresh so the ticket leaves the list, and say who accepted it.
  useAccountSocketEvent<{ publicId: string; eventTitle: string; acceptedBy: string }>("ticket:transferred", (transfer) => {
    setTransferNotice(`${transfer.acceptedBy} accepted your ticket for ${transfer.eventTitle}. It has moved to their account, and your old entry code no longer works. We’ve emailed you a confirmation.`);
    if (selectedId === transfer.publicId) { setSelectedId(null); setSheetOpen(false); }
    retry();
  });
  const isPast = (ticket: AccountTicket) => {
    const starts = new Date(ticket.event.startsAt).getTime();
    const ends = ticket.event.endsAt ? new Date(ticket.event.endsAt).getTime() : starts + 24 * 60 * 60 * 1000;
    return Number.isFinite(ends) && ends < Date.now();
  };
  const current = tickets.filter((ticket) => !isPast(ticket)).sort((a, b) => new Date(a.event.startsAt).getTime() - new Date(b.event.startsAt).getTime());
  const past = tickets.filter(isPast).sort((a, b) => new Date(b.event.startsAt).getTime() - new Date(a.event.startsAt).getTime());
  const pageCount = Math.max(1, Math.ceil(current.length / 10));
  const activePage = Math.min(page, pageCount);
  const visibleCurrent = current.slice((activePage - 1) * 10, activePage * 10);
  const pastPageCount = Math.max(1, Math.ceil(past.length / 10));
  const activePastPage = Math.min(pastPage, pastPageCount);
  const visiblePast = past.slice((activePastPage - 1) * 10, activePastPage * 10);
  const selected = tickets.find((ticket) => ticket.publicId === selectedId) ?? current[0] ?? past[0];
  const ticketButton = (ticket: AccountTicket) => <button key={ticket.publicId} type="button" className={`account-ticket-row${selected?.publicId === ticket.publicId && (!compact || sheetOpen) ? " selected" : ""}`} aria-current={selected?.publicId === ticket.publicId && (!compact || sheetOpen) ? "true" : undefined} onClick={() => { setSelectedId(ticket.publicId); if (compact) setSheetOpen(true); else requestAnimationFrame(() => { preview.current?.scrollIntoView({ block: "nearest" }); preview.current?.focus({ preventScroll: true }); }); }}><span className="account-ticket-row-date"><strong>{new Intl.DateTimeFormat("en-AU", { day: "numeric" }).format(new Date(ticket.event.startsAt))}</strong><span>{new Intl.DateTimeFormat("en-AU", { month: "short" }).format(new Date(ticket.event.startsAt))}</span></span><span className="account-ticket-row-main"><strong>{ticket.event.title}</strong><span>{ticket.ticketType.name} · {ticket.attendeeName || "Your ticket"}</span><span>{ticket.event.location || "Location in event details"}</span></span><span className="account-ticket-row-status" data-tone={ticket.checkedInAt ? "done" : isPast(ticket) ? "muted" : ticket.pendingTransfer ? "pending" : ticket.status === "valid" ? "ready" : "muted"}>{ticket.checkedInAt ? isPast(ticket) ? "Attended" : "Checked in" : isPast(ticket) ? "Ended" : ticket.pendingTransfer ? "Transfer pending" : ticket.status === "valid" ? "Ready" : "Unavailable"}</span></button>;
  if (loading && !data) return <AccountSurfaceLoading embedded route="/account/tickets" />;
  return (
    <>
      <nav className="account-ticket-breadcrumb" aria-label="Breadcrumb"><Link href="/account">Your account</Link><span aria-hidden="true">›</span><span aria-current="page">Tickets</span></nav>
      <div className="account-ticket-heading"><div><span className="event-eyebrow">YOUR TIVORAH</span><h1>Your tickets</h1><p>Choose a ticket to see its entry code and details.</p></div></div>
      {transferNotice ? <div role="status" className="account-ticket-transfer-notice"><svg aria-hidden="true" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="9" /><path d="m8 12.5 2.8 2.8L16.5 9.5" /></svg><div><strong>Ticket transfer accepted</strong><p>{transferNotice}</p></div><button type="button" aria-label="Dismiss" onClick={() => setTransferNotice(null)}>×</button></div> : null}
      {loading && data ? <p role="status" className="account-refresh-status">Updating tickets…</p> : null}
      {error ? (
        <div role="alert" className="product-notice">
          <p>{error}</p>
          <button onClick={retry} className="product-secondary">
            Try again
          </button>
        </div>
      ) : null}
      {tickets.length && !error ? <div className="account-ticket-layout"><section className="account-ticket-list" aria-label="Your event tickets">{current.length ? <><h2>Upcoming <span>{current.length}</span></h2>{visibleCurrent.map(ticketButton)}{pageCount > 1 ? <nav className="account-ticket-pagination" aria-label="Upcoming ticket pages"><button type="button" disabled={activePage === 1} onClick={() => { setPage(activePage - 1); setSelectedId(current[(activePage - 2) * 10]?.publicId ?? null); }}>Previous</button><span>Page {activePage} of {pageCount}</span><button type="button" disabled={activePage === pageCount} onClick={() => { setPage(activePage + 1); setSelectedId(current[activePage * 10]?.publicId ?? null); }}>Next</button></nav> : null}</> : <p className="account-ticket-empty-current">No upcoming tickets.</p>}{past.length ? <details className="account-past-tickets" open={!!selected && isPast(selected)}><summary>Past tickets <span>{past.length}</span></summary><p>Past tickets are automatically deleted from your account seven days after the event ends.</p>{visiblePast.map(ticketButton)}{pastPageCount > 1 ? <nav className="account-ticket-pagination" aria-label="Past ticket pages"><button type="button" disabled={activePastPage === 1} onClick={() => { setPastPage(activePastPage - 1); setSelectedId(past[(activePastPage - 2) * 10]?.publicId ?? null); }}>Previous</button><span>Page {activePastPage} of {pastPageCount}</span><button type="button" disabled={activePastPage === pastPageCount} onClick={() => { setPastPage(activePastPage + 1); setSelectedId(past[activePastPage * 10]?.publicId ?? null); }}>Next</button></nav> : null}</details> : null}</section><DetailPane compact={compact} open={sheetOpen} onClose={() => setSheetOpen(false)} label="Selected ticket" className="account-ticket-preview" paneRef={preview}><div className="account-ticket-preview-heading"><span className="event-eyebrow">TICKET PREVIEW</span><span>{tickets.findIndex((ticket) => ticket.publicId === selected.publicId) + 1} of {tickets.length}</span></div><TicketPass key={selected.publicId} ticket={selected} refresh={retry} disabled={loading || !!error} past={isPast(selected)} /></DetailPane></div> : null}
      {!loading && !error && data?.tickets.length === 0 ? (
        <div className="product-empty">
          <h2>Your next experience is waiting.</h2>
          <p>Tickets issued to your account will appear here.</p>
          <Link className="product-primary" href="/events">
            Explore events
          </Link>
        </div>
      ) : null}
    </>
  );
}
export function AccountTickets() {
  return <AccountGate>{() => <TicketList />}</AccountGate>;
}
