"use client";
import { LoadingState } from "../ui/loading-state";

import Link from "next/link";
import { FormEvent, useRef, useState } from "react";
import { useAccount } from "../../hooks/use-account";
import { usePrivateResource } from "../../hooks/use-private-resource";
import { api } from "../../lib/api/client";
import { money } from "../../lib/api/discovery";
import { SelectField } from "../ui/select-field";

type Availability = {
  slots: { startsAt: string; endsAt: string }[];
  timezone: string;
  currency?: string;
  paymentRequired: boolean;
  paymentAvailable: boolean;
  quote: {
    subtotalCents: number;
    buyerTotalCents: number;
    platformFeeCents: number;
    chargedTo: string;
  };
};

const AU_TIMEZONES = [
  ["Australia/Perth", "Perth"], ["Australia/Darwin", "Darwin"],
  ["Australia/Adelaide", "Adelaide"], ["Australia/Brisbane", "Brisbane"],
  ["Australia/Sydney", "Sydney"], ["Australia/Melbourne", "Melbourne"],
  ["Australia/Hobart", "Hobart"], ["Australia/Lord_Howe", "Lord Howe Island"],
] as const;

function dateKey(value: Date, timeZone: string) {
  const parts = new Intl.DateTimeFormat("en-AU", { timeZone, year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(value);
  const part = (type: string) => parts.find((item) => item.type === type)?.value ?? "";
  return `${part("year")}-${part("month")}-${part("day")}`;
}

function monthKey(key: string) { return key.slice(0, 7); }
function shiftMonth(key: string, amount: number) {
  const [year, month] = key.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1 + amount, 1)).toISOString().slice(0, 7);
}

function CalendarPicker({ slots, timeZone, selectedDate, selected, onSelectDate, onSelect }: { slots: Availability["slots"]; timeZone: string; selectedDate: string; selected: string; onSelectDate: (value: string) => void; onSelect: (value: string) => void }) {
  const byDate = new Map<string, Availability["slots"]>();
  for (const slot of slots) {
    const key = dateKey(new Date(slot.startsAt), timeZone);
    byDate.set(key, [...(byDate.get(key) ?? []), slot]);
  }
  const first = [...byDate.keys()].sort()[0];
  const last = [...byDate.keys()].sort().at(-1);
  const [month, setMonth] = useState(() => monthKey(first));
  const activeMonth = month < monthKey(first) ? monthKey(first) : month > monthKey(last!) ? monthKey(last!) : month;
  const activeDate = selectedDate && byDate.has(selectedDate) ? selectedDate : "";
  const [year, monthNumber] = activeMonth.split("-").map(Number);
  const firstWeekday = (new Date(Date.UTC(year, monthNumber - 1, 1)).getUTCDay() + 6) % 7;
  const days = new Date(Date.UTC(year, monthNumber, 0)).getUTCDate();
  const monthLabel = new Intl.DateTimeFormat("en-AU", { month: "long", year: "numeric", timeZone: "UTC" }).format(new Date(Date.UTC(year, monthNumber - 1, 1)));
  const times = activeDate ? byDate.get(activeDate) ?? [] : [];
  return <div className="appointment-picker">
    <div className="appointment-month-nav">
      <h3>{monthLabel}</h3>
      <div><button type="button" aria-label="Previous month" disabled={activeMonth <= monthKey(first)} onClick={() => setMonth(shiftMonth(activeMonth, -1))}>‹</button><button type="button" aria-label="Next month" disabled={activeMonth >= monthKey(last!)} onClick={() => setMonth(shiftMonth(activeMonth, 1))}>›</button></div>
    </div>
    <div className="appointment-calendar" role="group" aria-label={`Available dates in ${monthLabel}`}>
      {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day) => <span className="appointment-weekday" key={day}>{day}</span>)}
      {Array.from({ length: firstWeekday }, (_, index) => <span key={`gap-${index}`} />)}
      {Array.from({ length: days }, (_, index) => {
        const key = `${activeMonth}-${String(index + 1).padStart(2, "0")}`;
        const count = byDate.get(key)?.length ?? 0;
        return <button key={key} type="button" className={key === activeDate ? "selected" : ""} disabled={!count} aria-pressed={key === activeDate} aria-label={`${new Intl.DateTimeFormat("en-AU", { dateStyle: "full", timeZone: "UTC" }).format(new Date(`${key}T12:00:00Z`))}${count ? `, ${count} available ${count === 1 ? "time" : "times"}` : ", unavailable"}`} onClick={() => onSelectDate(key)}><span>{index + 1}</span>{count ? <i aria-hidden="true" /> : null}</button>;
      })}
    </div>
    <div className="appointment-times" aria-live="polite">
      <h3>{activeDate ? new Intl.DateTimeFormat("en-AU", { weekday: "long", day: "numeric", month: "long", timeZone }).format(new Date(times[0].startsAt)) : "Choose an available day"}</h3>
      {activeDate ? <div className="appointment-time-grid">{times.map((item) => <button type="button" key={item.startsAt} className={selected === item.startsAt ? "selected" : ""} aria-pressed={selected === item.startsAt} onClick={() => onSelect(item.startsAt)}>{new Intl.DateTimeFormat("en-AU", { timeStyle: "short", timeZone }).format(new Date(item.startsAt))}</button>)}</div> : <p>Days with a dot have available appointments.</p>}
    </div>
  </div>;
}

function AppointmentForm({ id, accountId }: { id: number; accountId: number }) {
  const { data, loading, error, retry } = usePrivateResource<Availability>(
    `/web/account/services/${id}/availability`,
  );
  const [selected, setSelected] = useState("");
  const [selectedDate, setSelectedDate] = useState("");
  const [timeZone, setTimeZone] = useState(() => Intl.DateTimeFormat().resolvedOptions().timeZone || "Australia/Sydney");
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");
  const lock = useRef(false);
  const request = useRef<{ fingerprint: string; key: string } | null>(null);
  const slot = data?.slots.find((item) => item.startsAt === selected);

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!slot || !data || error || !data.paymentAvailable || lock.current) return;
    lock.current = true;
    setBusy(true);
    setNotice("");
    const fingerprint = `${accountId}:${id}:${slot.startsAt}`;
    const storageKey = `tivorah-service-booking:${accountId}:${id}`;
    try {
      if (request.current?.fingerprint !== fingerprint) {
        let saved: typeof request.current = null;
        try {
          saved = JSON.parse(sessionStorage.getItem(storageKey) || "null");
        } catch {
          /* Storage is optional. */
        }
        request.current =
          saved?.fingerprint === fingerprint
            ? saved
            : { fingerprint, key: crypto.randomUUID() };
        try {
          sessionStorage.setItem(storageKey, JSON.stringify(request.current));
        } catch {
          /* Retry key remains in memory. */
        }
      }
      const result = await api<{
        booking: { id: number; status: string };
        checkoutUrl: string | null;
      }>(`/market/products/${id}/bookings`, {
        method: "POST",
        body: JSON.stringify({
          startsAt: slot.startsAt,
          idempotencyKey: request.current!.key,
          checkoutPlatform: "web",
        }),
      });
      if (result.checkoutUrl) {
        const target = new URL(result.checkoutUrl);
        if (
          target.protocol !== "https:" ||
          target.hostname !== "checkout.stripe.com"
        )
          throw new Error("The payment link could not be verified.");
        window.location.assign(target.href);
      } else {
        if (result.booking.status !== "pending_payment") {
          try {
            sessionStorage.removeItem(storageKey);
          } catch {}
        }
        window.location.assign("/account/bookings");
      }
    } catch (cause) {
      setNotice(
        cause instanceof Error
          ? cause.message
          : "Could not book. Retry to check this appointment.",
      );
    } finally {
      lock.current = false;
      setBusy(false);
    }
  }

  return (
    <section className="product-form product-detail-booking">
      <h2>Book an appointment</h2>
      {loading ? <LoadingState label="Loading available times…" variant="compact" refreshing={!!data} /> : null}
      {error ? (
        <div role="alert">
          <p>{error}</p>
          <button className="product-secondary" onClick={retry}>
            Retry availability
          </button>
        </div>
      ) : null}
      {data && !error ? (
        data.slots.length ? (
          <form onSubmit={submit}>
            <div className="appointment-zone-row"><div><h3>Choose a date and time</h3><p>Provider time zone: {data.timezone.replaceAll("_", " ")}</p></div><label htmlFor="appointment-timezone">Show times in<SelectField id="appointment-timezone" label="Show times in" value={timeZone} disabled={busy} onChange={(zone) => { setTimeZone(zone); setSelectedDate(""); setSelected(""); }} options={[{ value: data.timezone, label: `Provider time (${data.timezone.replace("Australia/", "")})` }, ...(timeZone !== data.timezone && !AU_TIMEZONES.some(([zone]) => zone === timeZone) ? [{ value: timeZone, label: `My time zone (${timeZone})` }] : []), ...AU_TIMEZONES.filter(([zone]) => zone !== data.timezone).map(([zone, city]) => ({ value: zone, label: city }))]} /></label></div>
            <fieldset disabled={busy} className="appointment-picker-fieldset"><legend className="product-sr-only">Available appointment dates and times</legend><CalendarPicker slots={data.slots} timeZone={timeZone} selectedDate={selectedDate} selected={selected} onSelectDate={(date) => { setSelectedDate(date); setSelected(""); }} onSelect={setSelected} /></fieldset>
            {slot ? <p className="appointment-selection" role="status">Selected: <strong>{new Intl.DateTimeFormat("en-AU", { dateStyle: "full", timeStyle: "short", timeZone }).format(new Date(slot.startsAt))}</strong> ({timeZone.replaceAll("_", " ")})</p> : null}
            {data.paymentRequired ? (
              <div>
                <p>Service: {money(data.quote.subtotalCents, data.currency || "AUD")}</p>
                {data.quote.chargedTo === "buyer" &&
                data.quote.platformFeeCents > 0 ? (
                  <p>Tivorah booking fee: {money(data.quote.platformFeeCents, data.currency || "AUD")}</p>
                ) : null}
                <p>
                  <strong>Total: {money(data.quote.buyerTotalCents, data.currency || "AUD")}</strong>
                </p>
              </div>
            ) : (
              <p>
                No payment is collected now. Confirm any service charges with
                the provider.
              </p>
            )}
            {data.paymentRequired && !data.paymentAvailable ? (
              <p role="status">The provider is finishing payment setup. You can enquire about this service while online booking is unavailable.</p>
            ) : <button
              className="product-primary"
              disabled={!slot || busy || loading}
            >
              {busy
                ? "Opening your booking…"
                : data.paymentRequired && data.quote.buyerTotalCents > 0
                  ? "Continue to payment"
                  : "Book appointment"}
            </button>}
          </form>
        ) : (
          <>
            <p>No appointments are available in the next 30 days.</p>
            <button className="product-secondary" onClick={retry}>
              Refresh times
            </button>
          </>
        )
      ) : null}
      {notice ? (
        <p className="product-error" role="alert">
          {notice}
        </p>
      ) : null}
    </section>
  );
}

export function ServiceBooking({ id }: { id: number }) {
  const { account, loading, signedOut, error, retry } = useAccount();
  if (loading) return <LoadingState label="Checking your account…" variant="compact" />;
  if (signedOut)
    return (
      <section className="product-form product-detail-booking">
        <h2>Book an appointment</h2>
        <p>
          Sign in to see available times and keep your booking in your account.
        </p>
        <Link
          className="product-primary"
          href={`/auth/signin?returnTo=${encodeURIComponent(`/services/${id}`)}`}
        >
          Sign in to book
        </Link>
      </section>
    );
  if (!account)
    return (
      <section role="alert">
        <p>{error}</p>
        <button className="product-secondary" onClick={retry}>
          Retry account
        </button>
      </section>
    );
  return <AppointmentForm key={account.id} id={id} accountId={account.id} />;
}
