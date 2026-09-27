"use client";
import { LoadingState } from "../ui/loading-state";

import Link from "next/link";
import { FormEvent, useRef, useState } from "react";
import { useAccount } from "../../hooks/use-account";
import { usePrivateResource } from "../../hooks/use-private-resource";
import { api } from "../../lib/api/client";
import { money } from "../../lib/api/discovery";

type Availability = {
  slots: { startsAt: string; endsAt: string }[];
  timezone: string;
  paymentRequired: boolean;
  quote: {
    subtotalCents: number;
    buyerTotalCents: number;
    platformFeeCents: number;
    chargedTo: string;
  };
};

function AppointmentForm({ id, accountId }: { id: number; accountId: number }) {
  const { data, loading, error, retry } = usePrivateResource<Availability>(
    `/web/account/services/${id}/availability`,
  );
  const [selected, setSelected] = useState("");
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");
  const lock = useRef(false);
  const request = useRef<{ fingerprint: string; key: string } | null>(null);
  const slot = data?.slots.find((item) => item.startsAt === selected);

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!slot || !data || error || lock.current) return;
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
    <section className="product-form">
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
            <label>
              Appointment time
              <select
                value={selected}
                disabled={busy}
                onChange={(event) => setSelected(event.target.value)}
                required
              >
                <option value="">Choose a time</option>
                {data.slots.map((item) => (
                  <option key={item.startsAt} value={item.startsAt}>
                    {new Intl.DateTimeFormat("en-AU", {
                      dateStyle: "medium",
                      timeStyle: "short",
                      timeZone: data.timezone,
                    }).format(new Date(item.startsAt))}
                  </option>
                ))}
              </select>
            </label>
            <p>Times shown in {data.timezone.replaceAll("_", " ")}.</p>
            {data.paymentRequired ? (
              <div>
                <p>Service: {money(data.quote.subtotalCents)}</p>
                {data.quote.chargedTo === "buyer" &&
                data.quote.platformFeeCents > 0 ? (
                  <p>Booking fee: {money(data.quote.platformFeeCents)}</p>
                ) : null}
                <p>
                  <strong>Total: {money(data.quote.buyerTotalCents)}</strong>
                </p>
              </div>
            ) : (
              <p>
                No payment is collected now. Confirm any service charges with
                the provider.
              </p>
            )}
            <button
              className="product-primary"
              disabled={!slot || busy || loading}
            >
              {busy
                ? "Opening your booking…"
                : data.paymentRequired && data.quote.buyerTotalCents > 0
                  ? "Continue to payment"
                  : "Book appointment"}
            </button>
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
      <section className="product-form">
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
