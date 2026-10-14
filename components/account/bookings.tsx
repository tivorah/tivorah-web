"use client";

import Link from "next/link";
import { BookingHelp } from "./booking-help";
import { FormEvent, useRef, useState } from "react";
import { AccountSurfaceLoading } from "./surface-loading";
import { AccountGate } from "./gate";
import { usePrivateResource } from "../../hooks/use-private-resource";
import { api } from "../../lib/api/client";
import { money } from "../../lib/api/discovery";
import { DetailPane, useCompactLayout } from "./detail-pane";
import { BookingActions, bookingStatusText, type ActionBooking } from "../bookings/booking-actions";
import { QuotesPanel } from "../bookings/quotes-panel";

type Booking = ActionBooking & {
  paymentAvailable: boolean;
  perspective: "customer" | "provider";
  counterparty?: { name: string; username: string } | null;
  idempotencyKey?: string;
  product: { id: number; title: string; priceCents: number };
};
type Role = Booking["perspective"];
export type BookingFocus = { tab?: "quotes"; pay?: number; review?: number; quote?: number; requested?: boolean };

function datePart(value: string, timezone: string, options: Intl.DateTimeFormatOptions) {
  try { return new Intl.DateTimeFormat("en-AU", { ...options, timeZone: timezone }).format(new Date(value)); }
  catch { return new Intl.DateTimeFormat("en-AU", options).format(new Date(value)); }
}
const statusText = (booking: Booking) => bookingStatusText(booking, booking.perspective);
const isHistory = (booking: Booking) => new Date(booking.endsAt) < new Date() || ["cancelled", "refunded", "declined", "expired", "completed"].includes(booking.status);
const isPreview = (booking: Booking) => booking.idempotencyKey?.startsWith("taylor-booking-preview-") ?? false;

function BookingList({ initialRole = "customer", focus = {} }: { initialRole?: Role; focus?: BookingFocus }) {
  const { data, loading, error, retry } = usePrivateResource<{ bookings: Booking[] }>("/market/bookings/me");
  const [role, setRole] = useState<Role>(initialRole);
  const [quotesOpen, setQuotesOpen] = useState(focus.tab === "quotes" || !!focus.quote);
  const [selectedId, setSelectedId] = useState<number | null>(focus.pay ?? focus.review ?? null);
  const [page, setPage] = useState(1);
  const [historyPage, setHistoryPage] = useState(1);
  const [notice, setNotice] = useState(focus.requested ? "Request sent. The provider has 48 hours to approve it, and you won’t be charged unless they do. We’ll email you either way." : "");
  const [chatOpen, setChatOpen] = useState(false);
  const [messageDraft, setMessageDraft] = useState("");
  const [messageBusy, setMessageBusy] = useState(false);
  const messageId = useRef(crypto.randomUUID());
  const preview = useRef<HTMLElement>(null);
  // Phones/tablets show the appointment in a bottom sheet instead of beside the list.
  const compact = useCompactLayout();
  const [sheetOpen, setSheetOpen] = useState(false);
  const bookings = data?.bookings ?? [];
  const mine = bookings.filter((booking) => booking.perspective === "customer");
  const received = bookings.filter((booking) => booking.perspective === "provider");
  const group = role === "customer" ? mine : received;
  const upcoming = group.filter((booking) => !isHistory(booking)).sort((a, b) => new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime());
  const history = group.filter(isHistory).sort((a, b) => new Date(b.startsAt).getTime() - new Date(a.startsAt).getTime());
  const pageCount = Math.max(1, Math.ceil(upcoming.length / 10));
  const activePage = Math.min(page, pageCount);
  const historyPageCount = Math.max(1, Math.ceil(history.length / 10));
  const activeHistoryPage = Math.min(historyPage, historyPageCount);
  const selected = group.find((booking) => booking.id === selectedId) ?? upcoming[0] ?? history[0];

  function select(booking: Booking) {
    setSelectedId(booking.id);
    setChatOpen(false);
    setMessageDraft("");
    setNotice("");
    if (compact) setSheetOpen(true);
  }
  function switchRole(next: Role) { setQuotesOpen(false); setSheetOpen(false); setRole(next); setSelectedId(null); setPage(1); setHistoryPage(1); setChatOpen(false); setMessageDraft(""); setNotice(""); }
  async function sendMessage(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (messageBusy || role !== "customer" || !selected || !messageDraft.trim()) return;
    setMessageBusy(true); setNotice("");
    try {
      const result = await api<{ conversationId: number }>(`/market/bookings/${selected.id}/contact`, { method: "POST", body: JSON.stringify({ message: messageDraft.trim(), clientMessageId: messageId.current }) });
      window.location.assign(`/account/messages/${result.conversationId}`);
    } catch (cause) { setNotice(cause instanceof Error ? cause.message : "Could not message the provider. Please try again."); setMessageBusy(false); }
  }
  const row = (booking: Booking) => <button key={booking.id} type="button" className={`account-ticket-row account-booking-row${selected?.id === booking.id && (!compact || sheetOpen) ? " selected" : ""}`} aria-current={selected?.id === booking.id && (!compact || sheetOpen) ? "true" : undefined} onClick={() => select(booking)}><span className="account-ticket-row-date"><strong>{datePart(booking.startsAt, booking.timezone, { day: "numeric" })}</strong><span>{datePart(booking.startsAt, booking.timezone, { month: "short" })}</span></span><span className="account-ticket-row-main"><strong>{booking.product.title}</strong><span>{datePart(booking.startsAt, booking.timezone, { weekday: "short", hour: "numeric", minute: "2-digit" })}{booking.counterparty ? ` · ${role === "provider" ? "Booked by" : "With"} ${booking.counterparty.name}` : ""}</span></span><span className="account-ticket-row-status">{statusText(booking)}</span></button>;
  const pagination = (count: number, current: number, setCurrent: (page: number) => void, label: string, items: Booking[], size: number) => {
    const changePage = (next: number) => { setCurrent(next); setSelectedId(items[(next - 1) * size]?.id ?? null); };
    return count > 1 ? <nav className="account-ticket-pagination" aria-label={`${label} pages`}><button type="button" disabled={current === 1} onClick={() => changePage(current - 1)}>Previous</button><span>Page {current} of {count}</span><button type="button" disabled={current === count} onClick={() => changePage(current + 1)}>Next</button></nav> : null;
  };

  if (loading && !data) return <AccountSurfaceLoading embedded />;
  return <>
    <nav className="account-ticket-breadcrumb" aria-label="Breadcrumb"><Link href="/account">Your account</Link><span aria-hidden="true">›</span><span aria-current="page">Appointments</span></nav>
    <header className="account-ticket-heading"><div><p className="product-eyebrow">YOUR TIVORAH</p><h1>Service appointments</h1><p>Manage the services you booked and appointments customers made with you.</p></div></header>
    {loading && data ? <p role="status" className="account-refresh-status">Updating appointments…</p> : null}
    {error ? <div className="product-notice" role="alert"><p>{error}</p><button className="product-secondary" onClick={retry}>Try again</button></div> : null}
    {notice && (!compact || !sheetOpen) ? <p role="status" className="product-notice">{notice}</p> : null}
    {data ? <>
      <div className="account-booking-tabs" role="group" aria-label="Appointment type"><button type="button" className={role === "customer" ? "selected" : ""} aria-pressed={role === "customer"} onClick={() => switchRole("customer")}>My bookings <span>{mine.length}</span></button><button type="button" className={role === "provider" ? "selected" : ""} aria-pressed={role === "provider"} onClick={() => switchRole("provider")}>Customer bookings <span>{received.length}</span></button><button type="button" className={quotesOpen ? "selected" : ""} aria-pressed={quotesOpen} onClick={() => { setQuotesOpen(true); setSheetOpen(false); setNotice(""); }}>Quotes</button></div>
      {quotesOpen ? <QuotesPanel perspective="customer" focusId={focus.quote ?? null} /> : <>
      {role === "provider" ? <p className="product-notice">Approve requests, send quotes, add time off and see your whole week in <Link href="/business/appointments">your appointments workspace</Link>.</p> : null}
      {selected ? <div className="account-ticket-layout account-booking-layout"><section className="account-ticket-list" aria-label={role === "customer" ? "Services you booked" : "Bookings for your services"}><h2>Upcoming <span>{upcoming.length}</span></h2>{upcoming.length ? upcoming.slice((activePage - 1) * 10, activePage * 10).map(row) : <p className="account-ticket-empty-current">No upcoming appointments.</p>}{pagination(pageCount, activePage, setPage, "Upcoming appointment", upcoming, 10)}{history.length ? <details className="account-past-tickets" open={selected && isHistory(selected) ? true : undefined}><summary>Past &amp; cancelled <span>{history.length}</span></summary>{history.slice((activeHistoryPage - 1) * 10, activeHistoryPage * 10).map(row)}{pagination(historyPageCount, activeHistoryPage, setHistoryPage, "Past appointment", history, 10)}</details> : null}</section><DetailPane compact={compact} open={sheetOpen} onClose={() => setSheetOpen(false)} label="Selected appointment" className="account-ticket-preview account-booking-preview" paneRef={preview}><div className="account-ticket-preview-heading"><span className="product-eyebrow">APPOINTMENT DETAILS</span><span>{group.findIndex((booking) => booking.id === selected.id) + 1} of {group.length}</span></div><div className="account-booking-pass"><div className="account-booking-pass-top"><span>{role === "customer" ? "YOUR BOOKING" : "CUSTOMER BOOKING"}</span><strong>{statusText(selected)}</strong></div><div className="account-booking-pass-body"><h2>{selected.product.title}</h2><p className="account-booking-date">{datePart(selected.startsAt, selected.timezone, { weekday: "long", day: "numeric", month: "long", year: "numeric" })}</p><p className="account-booking-time">{datePart(selected.startsAt, selected.timezone, { hour: "numeric", minute: "2-digit" })} – {datePart(selected.endsAt, selected.timezone, { hour: "numeric", minute: "2-digit" })}</p><p className="account-booking-zone">Times shown in {selected.timezone.replaceAll("_", " ")}</p><dl><div><dt>{role === "customer" ? "Provider" : "Customer"}</dt><dd>{role === "customer" && selected.counterparty?.username ? <Link className="account-booking-provider-link" href={`/showcase/${encodeURIComponent(selected.counterparty.username)}`} aria-label={`View ${selected.counterparty.name || selected.counterparty.username}'s showcase`}><strong>{selected.counterparty.name}</strong><span>View showcase ↗</span></Link> : selected.counterparty?.name || "Tivorah member"}</dd></div><div><dt>Booking total</dt><dd>{isPreview(selected) ? "Preview booking · no payment collected" : selected.totalCents ? money(selected.totalCents, selected.currency || "AUD") : "No payment collected"}</dd></div></dl>{selected.customerNote ? <p><strong>Note for provider:</strong> {selected.customerNote}</p> : null}{role === "customer" && selected.totalCents > 0 && !isPreview(selected) && ["confirmed", "refunded", "completed", "disputed"].includes(selected.status) ? <BookingHelp key={selected.id} subjectType="service_booking" id={selected.id} /> : null}</div><div className="account-booking-pass-actions">{notice && compact && sheetOpen ? <p role="status" className="product-notice">{notice}</p> : null}{role === "customer" ? chatOpen ? <form className="account-booking-chat-form" onSubmit={sendMessage}><label htmlFor="booking-provider-message">Message {selected.counterparty?.name || "the provider"}</label><textarea id="booking-provider-message" value={messageDraft} onChange={(event) => { setMessageDraft(event.target.value); messageId.current = crypto.randomUUID(); }} maxLength={500} rows={3} placeholder="Ask about this appointment" required /><div><button className="product-primary" disabled={messageBusy || !messageDraft.trim() || !!error}>{messageBusy ? "Sending…" : "Send message"}</button><button type="button" className="product-secondary" disabled={messageBusy} onClick={() => setChatOpen(false)}>Close</button></div></form> : <button className={selected.status === "pending_payment" ? "product-secondary" : "product-primary"} onClick={() => setChatOpen(true)}>Message provider</button> : null}<BookingActions key={selected.id} booking={selected} role={role} autoOpen={focus.review === selected.id ? "review" : focus.pay === selected.id ? "pay" : null} onChanged={(message) => { setNotice(message); retry(); }} /></div></div></DetailPane></div> : <div className="product-empty"><h2>{role === "customer" ? "No services booked yet" : "No customer appointments yet"}</h2><p>{role === "customer" ? "Find a service and choose a time that works for you." : "Bookings for your services will appear here."}</p>{role === "customer" ? <Link className="product-primary" href="/services">Explore services</Link> : <Link className="product-secondary" href="/business">Your business</Link>}</div>}
      </>}
    </> : null}
  </>;
}
export function AccountBookings({ initialRole = "customer", focus }: { initialRole?: Role; focus?: BookingFocus }) { return <AccountGate>{() => <BookingList initialRole={initialRole} focus={focus} />}</AccountGate>; }
