"use client";
import { useState, type FormEvent } from "react";
import { usePrivateResource } from "../../hooks/use-private-resource";
import { api } from "../../lib/api/client";
import { LoadingState } from "../ui/loading-state";
import "./bookings.css";
import "../discovery/service-highlights.css";

// Provider tools for /business/appointments: time off (blocks all services) and reviews with replies.

type TimeOff = { id: number; startsAt: string; endsAt: string; reason: string | null };
const range = (start: string, end: string) => `${new Intl.DateTimeFormat("en-AU", { weekday: "short", day: "numeric", month: "short", hour: "numeric", minute: "2-digit" }).format(new Date(start))} – ${new Intl.DateTimeFormat("en-AU", { weekday: "short", day: "numeric", month: "short", hour: "numeric", minute: "2-digit" }).format(new Date(end))}`;
const localInput = (date: Date) => new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 16);

export function TimeOffPanel({ onClashes }: { onClashes?: () => void }) {
  const { data, loading, error, retry } = usePrivateResource<{ timeOff: TimeOff[] }>("/market/provider/time-off");
  const tomorrow = new Date(); tomorrow.setDate(tomorrow.getDate() + 1); tomorrow.setHours(0, 0, 0, 0);
  const tomorrowEnd = new Date(tomorrow); tomorrowEnd.setHours(23, 59, 0, 0);
  const [start, setStart] = useState(localInput(tomorrow));
  const [end, setEnd] = useState(localInput(tomorrowEnd));
  const [allDay, setAllDay] = useState(true);
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");
  const [problem, setProblem] = useState("");
  const startDate = allDay ? new Date(`${start.slice(0, 10)}T00:00`) : new Date(start);
  const endDate = allDay ? new Date(`${end.slice(0, 10)}T23:59:59`) : new Date(end);
  const valid = !Number.isNaN(startDate.getTime()) && !Number.isNaN(endDate.getTime()) && endDate > startDate && endDate > new Date();

  async function add(event: FormEvent) {
    event.preventDefault();
    if (!valid || busy) return;
    setBusy(true); setNotice(""); setProblem("");
    try {
      const result = await api<{ clashingBookingIds: number[] }>("/market/provider/time-off", { method: "POST", body: JSON.stringify({ startsAt: startDate.toISOString(), endsAt: endDate.toISOString(), reason: reason.trim() || undefined }) });
      const clashes = result.clashingBookingIds.length;
      setReason("");
      setNotice(clashes ? `Time off added. ${clashes} existing booking${clashes === 1 ? " is" : "s are"} in this time. Move or cancel ${clashes === 1 ? "it" : "them"} from your schedule.` : "Time off added. No new bookings can be made in this time.");
      if (clashes) onClashes?.();
      retry();
    } catch (cause) { setProblem(cause instanceof Error ? cause.message : "Could not add time off."); }
    finally { setBusy(false); }
  }
  async function remove(id: number) {
    setProblem("");
    try { await api(`/market/provider/time-off/${id}`, { method: "DELETE" }); setNotice("Time off removed. Those times are bookable again."); retry(); }
    catch (cause) { setProblem(cause instanceof Error ? cause.message : "Could not remove time off."); }
  }

  return <section className="provider-panel" aria-label="Time off">
    <form className="booking-actions-panel time-off-form" onSubmit={add}>
      <h2>Add days off, holidays or breaks</h2>
      <p className="booking-actions-note">Blocks new bookings on all your services. Existing bookings stay until you move or cancel them.</p>
      <label className="time-off-allday"><input type="checkbox" checked={allDay} onChange={(event) => setAllDay(event.target.checked)} /> Whole days</label>
      <div className="quote-form-row">
        <label htmlFor="time-off-start">From<input id="time-off-start" type={allDay ? "date" : "datetime-local"} required value={allDay ? start.slice(0, 10) : start} onChange={(event) => setStart(allDay ? `${event.target.value}T00:00` : event.target.value)} /></label>
        <label htmlFor="time-off-end">Until{allDay ? " (inclusive)" : ""}<input id="time-off-end" type={allDay ? "date" : "datetime-local"} required value={allDay ? end.slice(0, 10) : end} onChange={(event) => setEnd(allDay ? `${event.target.value}T23:59` : event.target.value)} /></label>
      </div>
      <label htmlFor="time-off-reason">Note to yourself (optional)<input id="time-off-reason" maxLength={200} value={reason} onChange={(event) => setReason(event.target.value)} placeholder="e.g. Christmas break" /></label>
      {!valid ? <p className="booking-actions-note">The end must be after the start and in the future.</p> : null}
      <div><button className="product-primary" disabled={!valid || busy}>{busy ? "Adding…" : "Add time off"}</button></div>
    </form>
    {notice ? <p role="status" className="product-notice">{notice}</p> : null}
    {problem ? <p role="alert" className="product-error">{problem}</p> : null}
    <h2 className="bookings-subheading">Upcoming time off</h2>
    {loading && !data ? <LoadingState label="Loading time off…" variant="compact" /> : null}
    {error ? <p role="alert">{error} <button type="button" className="product-secondary" onClick={retry}>Try again</button></p> : null}
    {data && !data.timeOff.length ? <p className="booking-actions-note">None planned.</p> : null}
    <ul className="time-off-list">{data?.timeOff.map((row) => <li key={row.id}><div><strong>{range(row.startsAt, row.endsAt)}</strong>{row.reason ? <span>{row.reason}</span> : null}</div><button type="button" className="booking-actions-danger" onClick={() => void remove(row.id)} aria-label={`Remove time off ${range(row.startsAt, row.endsAt)}`}>Remove</button></li>)}</ul>
  </section>;
}

type ProviderReview = { review: { id: number; rating: number; comment: string | null; providerReply: string | null; createdAt: string }; title: string; customerName: string | null };

export function ReviewsPanel() {
  const { data, loading, error, retry } = usePrivateResource<{ reviews: ProviderReview[] }>("/market/provider/reviews");
  const [replying, setReplying] = useState<number | null>(null);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [problem, setProblem] = useState("");
  const rows = data?.reviews ?? [];
  const average = rows.length ? rows.reduce((sum, row) => sum + row.review.rating, 0) / rows.length : 0;
  async function reply(event: FormEvent, id: number) {
    event.preventDefault();
    if (!text.trim() || busy) return;
    setBusy(true); setProblem("");
    try { await api(`/market/reviews/${id}/reply`, { method: "POST", body: JSON.stringify({ reply: text.trim() }) }); setReplying(null); setText(""); retry(); }
    catch (cause) { setProblem(cause instanceof Error ? cause.message : "Could not post your reply."); }
    finally { setBusy(false); }
  }
  if (loading && !data) return <LoadingState label="Loading reviews…" variant="compact" />;
  if (error) return <p role="alert">{error} <button type="button" className="product-secondary" onClick={retry}>Try again</button></p>;
  if (!rows.length) return <div className="product-empty"><h2>No reviews yet</h2><p>After each completed appointment we ask the customer for a review. They appear here and on your service pages.</p></div>;
  return <section className="provider-panel" aria-label="Reviews">
    <p className="reviews-summary"><span aria-hidden="true">★</span> <strong>{average.toFixed(1)}</strong> from {rows.length} review{rows.length === 1 ? "" : "s"}</p>
    <ul className="provider-reviews">{rows.map(({ review, title, customerName }) => <li key={review.id}>
      <header><strong>{title}</strong><span aria-label={`${review.rating} out of 5 stars`}>{"★".repeat(review.rating)}{"☆".repeat(5 - review.rating)}</span></header>
      <p className="booking-actions-note">{(customerName || "Customer").split(" ")[0]} · {new Intl.DateTimeFormat("en-AU", { day: "numeric", month: "short", year: "numeric" }).format(new Date(review.createdAt))}</p>
      {review.comment ? <p>{review.comment}</p> : null}
      {review.providerReply ? <div className="service-review-reply"><span>Your reply</span><p>{review.providerReply}</p></div>
        : replying === review.id ? <form className="booking-actions-panel" onSubmit={(event) => void reply(event, review.id)}><label htmlFor={`reply-${review.id}`}>Public reply (you can reply once)<textarea id={`reply-${review.id}`} rows={3} maxLength={1000} value={text} onChange={(event) => setText(event.target.value)} /></label>{problem ? <p role="alert" className="product-error">{problem}</p> : null}<div><button className="product-primary" disabled={busy || !text.trim()}>{busy ? "Posting…" : "Post reply"}</button><button type="button" className="product-secondary" onClick={() => setReplying(null)}>Cancel</button></div></form>
        : <button type="button" className="booking-actions-link" onClick={() => { setReplying(review.id); setText(""); setProblem(""); }}>Reply publicly</button>}
    </li>)}</ul>
  </section>;
}
