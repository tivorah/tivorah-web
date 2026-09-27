"use client";
import { LoadingState } from "../ui/loading-state";
import Link from "next/link";
import { FormEvent, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useAccount } from "../../hooks/use-account";
import { api } from "../../lib/api/client";
import {
  BookingQuote,
  eventApi,
  PublicEvent,
  ticketMoney,
} from "../../app/events/api";

export function TicketBooking({ event }: { event: PublicEvent }) {
  const params = useSearchParams();
  const {
    account,
    loading,
    signedOut,
    error: accountError,
    retry,
  } = useAccount();
  const [ticketId, setTicketId] = useState(
    () =>
      event.ticketTypes.find(
        (ticket) =>
          ticket.id === Number(params.get("ticket")) && ticket.available,
      )?.id ??
      event.ticketTypes.find((ticket) => ticket.available)?.id ??
      0,
  );
  const [quantity, setQuantity] = useState(() =>
    Math.max(1, Math.min(20, Number(params.get("quantity")) || 1)),
  );
  const [quote, setQuote] = useState<{
    key: string;
    value: BookingQuote;
  } | null>(null);
  const [quoteError, setQuoteError] = useState("");
  const [attempt, setAttempt] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const submitting = useRef(false);
  const requestKey = useRef<{ fingerprint: string; value: string } | null>(
    null,
  );
  const selection = `${ticketId}:${quantity}`;
  const currentQuote = quote?.key === selection ? quote.value : null;
  const ticket = event.ticketTypes.find((item) => item.id === ticketId);
  const returnTo = `/events/${event.id}?ticket=${ticketId}&quantity=${quantity}#tickets`;
  useEffect(() => {
    if (!ticketId) return;
    const controller = new AbortController();
    setQuoteError("");
    eventApi<BookingQuote>(`/${event.id}/quote`, {
      method: "POST",
      body: JSON.stringify({ ticketTypeId: ticketId, quantity }),
      signal: controller.signal,
    })
      .then((value) => {
        if (!controller.signal.aborted) setQuote({ key: selection, value });
      })
      .catch((cause) => {
        if (!controller.signal.aborted) {
          setQuote(null);
          setQuoteError(
            cause instanceof Error
              ? cause.message
              : "Could not load your total.",
          );
        }
      });
    return () => controller.abort();
  }, [ticketId, quantity, event.id, selection, attempt]);
  async function submit(e: FormEvent) {
    e.preventDefault();
    if (submitting.current || !account || !currentQuote || !ticket?.available)
      return;
    submitting.current = true;
    setBusy(true);
    setError("");
    const fingerprint = `${account.id}:${event.id}:${selection}`;
    const storageKey = `tivorah-web-booking:${account.id}:${event.id}`;
    try {
      if (requestKey.current?.fingerprint !== fingerprint) {
        let saved: { fingerprint: string; value: string } | null = null;
        try {
          saved = JSON.parse(sessionStorage.getItem(storageKey) || "null");
        } catch {
          /* Optional storage; in-memory retries still work. */
        }
        requestKey.current =
          saved?.fingerprint === fingerprint
            ? saved
            : { fingerprint, value: crypto.randomUUID() };
        try {
          sessionStorage.setItem(
            storageKey,
            JSON.stringify(requestKey.current),
          );
        } catch {
          /* Optional storage. */
        }
      }
      const result = await api<{
        order: { id: number; status: string };
        checkoutUrl: string | null;
      }>(`/web/account/events/${event.id}/orders`, {
        method: "POST",
        body: JSON.stringify({
          ticketTypeId: ticketId,
          quantity,
          idempotencyKey: requestKey.current!.value,
        }),
      });
      if (result.checkoutUrl) {
        const url = new URL(result.checkoutUrl);
        if (url.protocol !== "https:" || url.hostname !== "checkout.stripe.com")
          throw new Error("The payment link could not be verified.");
        window.location.assign(url.href);
      } else {
        if (result.order.status !== "pending_payment") {
          try {
            sessionStorage.removeItem(storageKey);
          } catch {}
        }
        window.location.assign(`/account/orders/${result.order.id}`);
      }
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "Could not open checkout. Retry to check this booking.",
      );
    } finally {
      submitting.current = false;
      setBusy(false);
    }
  }
  if (event.externalTicketUrl)
    return (
      <>
        <p>The organiser sells tickets through another website.</p>
        <a
          className="event-primary"
          href={event.externalTicketUrl}
          rel="noopener noreferrer"
        >
          Continue to ticket website
        </a>
      </>
    );
  if (!event.ticketTypes.some((item) => item.available))
    return (
      <p role="status">
        Tickets are unavailable right now. They may be sold out or outside the
        sale period.
      </p>
    );
  return (
    <form onSubmit={submit}>
      <fieldset disabled={busy}>
        <legend className="event-sr">Choose tickets</legend>
        <label htmlFor="event-ticket">Ticket type</label>
        <select
          id="event-ticket"
          value={ticketId}
          onChange={(e) => {
            setTicketId(Number(e.target.value));
            setQuantity(1);
          }}
        >
          {event.ticketTypes.map((item) => (
            <option key={item.id} value={item.id} disabled={!item.available}>
              {item.name} ·{" "}
              {item.priceCents ? ticketMoney(item.priceCents) : "Free"}
              {!item.available ? " · Unavailable" : ""}
            </option>
          ))}
        </select>
        <label htmlFor="event-quantity">Quantity</label>
        <select
          id="event-quantity"
          value={quantity}
          onChange={(e) => setQuantity(Number(e.target.value))}
        >
          {Array.from(
            {
              length: Math.min(
                20,
                ticket?.remaining || 1,
                ticket?.maxTicketsPerBuyer || 1,
              ),
            },
            (_, i) => (
              <option key={i} value={i + 1}>
                {i + 1}
              </option>
            ),
          )}
        </select>
        {ticket ? (
          <p className="event-help">
            Up to {ticket.maxTicketsPerBuyer} tickets per buyer for this ticket
            type.
          </p>
        ) : null}
        <div className="event-total" aria-live="polite">
          {currentQuote ? (
            <>
              <div>
                <span>Tickets</span>
                <span>{ticketMoney(currentQuote.subtotalCents)}</span>
              </div>
              {currentQuote.chargedTo === "buyer" &&
              currentQuote.platformFeeCents > 0 ? (
                <div>
                  <span>Booking fee</span>
                  <span>{ticketMoney(currentQuote.platformFeeCents)}</span>
                </div>
              ) : null}
              <div>
                <strong>Total</strong>
                <strong>
                  {currentQuote.buyerTotalCents
                    ? ticketMoney(currentQuote.buyerTotalCents)
                    : "Free"}
                </strong>
              </div>
            </>
          ) : (
            quoteError ? <p role="alert">{quoteError}</p> : <LoadingState label="Calculating total…" variant="compact" />
          )}
        </div>
        {quoteError ? (
          <button
            type="button"
            className="event-secondary"
            onClick={() => setAttempt((value) => value + 1)}
          >
            Retry total
          </button>
        ) : null}
        {loading ? (
          <LoadingState label="Checking your account…" variant="compact" />
        ) : signedOut ? (
          <>
            <p>Sign in to keep your tickets in your Tivorah account.</p>
            <Link
              className="event-primary"
              href={`/auth/signin?returnTo=${encodeURIComponent(returnTo)}`}
            >
              Sign in to book
            </Link>
          </>
        ) : account ? (
          <>
            <p>
              Booking as{" "}
              <strong>{account.firstName || account.username}</strong>.
            </p>
            <button
              className="event-primary"
              disabled={busy || !currentQuote || !!quoteError}
              type="submit"
            >
              {busy
                ? "Opening your booking…"
                : currentQuote?.buyerTotalCents
                  ? "Continue to payment"
                  : "Get free tickets"}
            </button>
          </>
        ) : (
          <>
            <p role="alert">{accountError}</p>
            <button type="button" className="event-secondary" onClick={retry}>
              Retry account
            </button>
          </>
        )}
      </fieldset>
      {error ? (
        <p role="alert" className="event-error">
          {error}
        </p>
      ) : null}
      <p className="event-help">
        Your booking is confirmed only after Tivorah receives confirmation. No
        app download is needed.
      </p>
    </form>
  );
}
