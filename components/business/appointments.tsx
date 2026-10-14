"use client";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { usePrivateResource } from "../../hooks/use-private-resource";
import { money } from "../../lib/api/discovery";
import { LoadingState } from "../ui/loading-state";
import { BookingActions, bookingStatusText, isLiveBooking, when, type ActionBooking } from "../bookings/booking-actions";
import { QuotesPanel } from "../bookings/quotes-panel";
import { ReviewsPanel, TimeOffPanel } from "../bookings/provider-panels";
import "../bookings/bookings.css";

// Provider booking workspace: one calendar across all services, requests to approve, quotes,
// time off and reviews. Emails link here (API services/serviceEmails.ts providerBookingsUrl).

type Appointment = ActionBooking & { title: string; serviceMode: string | null; customer: { name: string } };
type TimeOff = { id: number; startsAt: string; endsAt: string; reason: string | null };
type Schedule = { appointments: Appointment[]; timeOff: TimeOff[]; pendingRequests: number };
type Tab = "schedule" | "requests" | "quotes" | "time-off" | "reviews";
const TABS: { id: Tab; label: string }[] = [
  { id: "schedule", label: "Schedule" }, { id: "requests", label: "Requests" }, { id: "quotes", label: "Quotes" },
  { id: "time-off", label: "Time off" }, { id: "reviews", label: "Reviews" },
];
const DAY = 86400000;

function startOfWeek(date: Date) {
  const value = new Date(date); value.setHours(0, 0, 0, 0);
  value.setDate(value.getDate() - ((value.getDay() + 6) % 7));
  return value;
}
const dayKey = (value: string, timezone: string) => when(value, timezone, { year: "numeric", month: "2-digit", day: "2-digit" });
const localDayKey = (date: Date) => new Intl.DateTimeFormat("en-AU", { year: "numeric", month: "2-digit", day: "2-digit" }).format(date);

export function BusinessAppointments() {
  const params = useSearchParams();
  const router = useRouter();
  const initial = (params.get("tab") as Tab) || (params.get("quote") ? "quotes" : params.get("booking") ? "requests" : "schedule");
  const [tab, setTab] = useState<Tab>(TABS.some((item) => item.id === initial) ? initial : "schedule");
  const [weekStart, setWeekStart] = useState(() => startOfWeek(new Date()));
  const [showClosed, setShowClosed] = useState(false);
  const [notice, setNotice] = useState("");
  const weekEnd = new Date(weekStart.getTime() + 7 * DAY);
  const week = usePrivateResource<Schedule>(`/market/provider/appointments?${new URLSearchParams({ from: weekStart.toISOString(), to: weekEnd.toISOString() })}`);
  const overview = usePrivateResource<Schedule>("/market/provider/appointments");
  const quotes = usePrivateResource<{ quotes: { perspective: string; status: string }[] }>("/market/quotes");
  const refresh = (message: string) => { setNotice(message); week.retry(); overview.retry(); };
  const requests = (overview.data?.appointments ?? []).filter((booking) => booking.status === "requested" && new Date(booking.startsAt) > new Date());
  const invoices = (overview.data?.appointments ?? []).filter((booking) => booking.status === "pending_payment" && booking.paymentDueAt);
  const openQuotes = (quotes.data?.quotes ?? []).filter((quote) => quote.perspective === "provider" && quote.status === "requested").length;
  const upcoming = (overview.data?.appointments ?? []).filter((booking) => booking.status === "confirmed" && new Date(booking.startsAt) > new Date());
  const heldCents = (overview.data?.appointments ?? []).filter((booking) => booking.payoutStatus === "held").reduce((sum, booking) => sum + booking.totalCents - (booking.refundedCents ?? 0) - (booking.applicationFeeCents ?? 0), 0);
  const counts: Partial<Record<Tab, number>> = { requests: requests.length, quotes: openQuotes };

  function choose(next: Tab) {
    setTab(next); setNotice("");
    const search = new URLSearchParams(params.toString()); search.set("tab", next); search.delete("quote"); search.delete("booking");
    router.replace(`/business/appointments?${search}`, { scroll: false });
  }

  return <div className="business-appointments">
    <header className="account-ticket-heading"><div><p className="product-eyebrow">BUSINESS</p><h1>Appointments</h1><p>One calendar for all your services. Requests, quotes, time off and reviews in one place.</p></div></header>
    <div className="appointments-stats" aria-label="Summary">
      <button type="button" onClick={() => choose("requests")}><strong>{requests.length}</strong><span>Waiting for your approval</span></button>
      <button type="button" onClick={() => choose("quotes")}><strong>{openQuotes}</strong><span>Quotes to send</span></button>
      <button type="button" onClick={() => choose("schedule")}><strong>{upcoming.length}</strong><span>Confirmed coming up</span></button>
      <Link href="/business/payouts"><strong>{money(heldCents, "AUD")}</strong><span>Held until appointments finish</span></Link>
    </div>
    <div className="account-booking-tabs appointments-tabs" role="tablist" aria-label="Appointment tools">
      {TABS.map((item) => <button key={item.id} type="button" role="tab" aria-selected={tab === item.id} className={tab === item.id ? "selected" : ""} onClick={() => choose(item.id)}>{item.label}{counts[item.id] ? <span>{counts[item.id]}</span> : null}</button>)}
    </div>
    {notice ? <p role="status" className="product-notice">{notice}</p> : null}

    {tab === "schedule" ? <section aria-label="Schedule">
      <div className="appointments-week-nav">
        <button type="button" className="product-secondary" aria-label="Previous week" onClick={() => setWeekStart(new Date(weekStart.getTime() - 7 * DAY))}>‹</button>
        <h2>{new Intl.DateTimeFormat("en-AU", { day: "numeric", month: "short" }).format(weekStart)} – {new Intl.DateTimeFormat("en-AU", { day: "numeric", month: "short", year: "numeric" }).format(new Date(weekEnd.getTime() - DAY))}</h2>
        <button type="button" className="product-secondary" aria-label="Next week" onClick={() => setWeekStart(new Date(weekStart.getTime() + 7 * DAY))}>›</button>
        <button type="button" className="product-secondary" onClick={() => setWeekStart(startOfWeek(new Date()))}>This week</button>
        <label className="appointments-toggle"><input type="checkbox" checked={showClosed} onChange={(event) => setShowClosed(event.target.checked)} /> Show cancelled &amp; declined</label>
      </div>
      {week.loading && !week.data ? <LoadingState label="Loading your week…" variant="compact" /> : null}
      {week.error ? <div role="alert" className="product-notice"><p>{week.error}</p><button type="button" className="product-secondary" onClick={week.retry}>Try again</button></div> : null}
      {week.data ? <WeekAgenda weekStart={weekStart} data={week.data} showClosed={showClosed} onChanged={refresh} /> : null}
    </section> : null}

    {tab === "requests" ? <section aria-label="Requests">
      {overview.loading && !overview.data ? <LoadingState label="Loading requests…" variant="compact" /> : null}
      {overview.error ? <div role="alert" className="product-notice"><p>{overview.error}</p><button type="button" className="product-secondary" onClick={overview.retry}>Try again</button></div> : null}
      {overview.data && !requests.length && !invoices.length ? <div className="product-empty"><h2>No requests waiting</h2><p>Services set to “I approve each one” send requests here. You have 48 hours to respond.</p></div> : null}
      {requests.length ? <h2 className="bookings-subheading">Needs your approval <span>{requests.length}</span></h2> : null}
      {requests.map((booking) => <AppointmentCard key={booking.id} booking={booking} onChanged={refresh} initiallyOpen focused={Number(params.get("booking")) === booking.id} />)}
      {invoices.length ? <h2 className="bookings-subheading">Approved, waiting for payment <span>{invoices.length}</span></h2> : null}
      {invoices.map((booking) => <AppointmentCard key={booking.id} booking={booking} onChanged={refresh} />)}
    </section> : null}

    {tab === "quotes" ? <QuotesPanel perspective="provider" focusId={Number(params.get("quote")) || null} /> : null}
    {tab === "time-off" ? <TimeOffPanel onClashes={() => week.retry()} /> : null}
    {tab === "reviews" ? <ReviewsPanel /> : null}
  </div>;
}

function WeekAgenda({ weekStart, data, showClosed, onChanged }: { weekStart: Date; data: Schedule; showClosed: boolean; onChanged: (message: string) => void }) {
  const days = Array.from({ length: 7 }, (_, index) => new Date(weekStart.getTime() + index * DAY));
  const visible = data.appointments.filter((booking) => showClosed || !["cancelled", "refunded", "declined", "expired"].includes(booking.status));
  const today = localDayKey(new Date());
  return <ol className="appointments-agenda">{days.map((date) => {
    const key = localDayKey(date);
    const items = visible.filter((booking) => dayKey(booking.startsAt, booking.timezone) === key);
    const dayStart = date.getTime(), dayEnd = dayStart + DAY;
    const off = data.timeOff.filter((row) => new Date(row.startsAt).getTime() < dayEnd && new Date(row.endsAt).getTime() > dayStart);
    return <li key={key} className={key === today ? "today" : ""}>
      <h3><span>{new Intl.DateTimeFormat("en-AU", { weekday: "long" }).format(date)}</span> {new Intl.DateTimeFormat("en-AU", { day: "numeric", month: "long" }).format(date)}{key === today ? <em>Today</em> : null}</h3>
      {off.map((row) => <p key={row.id} className="appointments-off">Time off{row.reason ? ` · ${row.reason}` : ""} · {when(row.startsAt, Intl.DateTimeFormat().resolvedOptions().timeZone, { hour: "numeric", minute: "2-digit", day: "numeric", month: "short" })} – {when(row.endsAt, Intl.DateTimeFormat().resolvedOptions().timeZone, { hour: "numeric", minute: "2-digit", day: "numeric", month: "short" })}</p>)}
      {items.length ? items.map((booking) => <AppointmentCard key={booking.id} booking={booking} onChanged={onChanged} />) : off.length ? null : <p className="appointments-empty-day">No appointments</p>}
    </li>;
  })}</ol>;
}

function AppointmentCard({ booking, onChanged, initiallyOpen = false, focused = false }: { booking: Appointment; onChanged: (message: string) => void; initiallyOpen?: boolean; focused?: boolean }) {
  const [open, setOpen] = useState(initiallyOpen || focused);
  const closed = !isLiveBooking(booking) && booking.status !== "completed" && booking.status !== "confirmed";
  return <article className={`appointment-card status-${booking.status}${closed ? " closed" : ""}${focused ? " focused" : ""}`}>
    <button type="button" className="appointment-card-head" aria-expanded={open} onClick={() => setOpen(!open)}>
      <span className="appointment-card-time"><strong>{when(booking.startsAt, booking.timezone, { hour: "numeric", minute: "2-digit" })}</strong><span>{when(booking.endsAt, booking.timezone, { hour: "numeric", minute: "2-digit" })}</span></span>
      <span className="appointment-card-main"><strong>{booking.title}</strong><span>{booking.customer.name}{booking.serviceAddress ? ` · ${booking.serviceAddress.suburb}` : booking.serviceMode === "online" ? " · Online" : ""}{booking.totalCents ? ` · ${money(booking.totalCents, booking.currency || "AUD")}` : ""}</span><span className="appointment-card-date">{when(booking.startsAt, booking.timezone, { weekday: "short", day: "numeric", month: "short" })}</span></span>
      <span className="booking-chip">{bookingStatusText(booking, "provider")}</span>
    </button>
    {open ? <div className="appointment-card-body">
      {booking.customerNote ? <p className="appointment-note"><strong>Customer note:</strong> {booking.customerNote}</p> : null}
      <BookingActions booking={booking} role="provider" onChanged={onChanged} />
    </div> : null}
  </article>;
}
