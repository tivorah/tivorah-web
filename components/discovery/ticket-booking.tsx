"use client";
import { LoadingState } from "../ui/loading-state";
import Link from "next/link";
import { FormEvent, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useAccount } from "../../hooks/use-account";
import { api } from "../../lib/api/client";
import { BookingTermsConsent } from "./booking-terms-consent";
import { SelectField } from "../ui/select-field";
import { AnimatedMoney } from "../ui/animated-money";
import { feeRateFromQuote, ticketTotals, type FeeRate } from "../../lib/ticket-pricing";
import {
  BookingQuote,
  eventApi,
  PublicEvent,
  ticketMoney,
} from "../../app/events/api";

export function TicketBooking({ event }: { event: PublicEvent }) {
  // Packages can change after an access code unlocks hidden ones.
  const [packages, setPackages] = useState(event.ticketTypes);
  const [accessCode, setAccessCode] = useState("");
  const [codeInput, setCodeInput] = useState("");
  const [codeState, setCodeState] = useState<"idle" | "checking" | "ok" | "error">("idle");
  const groupAllowed = !!event.allowGroupBookings;
  const [mode, setMode] = useState<"individual" | "group">("individual");
  async function applyCode(e: FormEvent) {
    e.preventDefault();
    const code = codeInput.trim().toUpperCase();
    if (!code) return;
    setCodeState("checking");
    try {
      const next = await eventApi<PublicEvent>(`/${event.id}?code=${encodeURIComponent(code)}`);
      if (!next.accessCodeAccepted) { setCodeState("error"); return; }
      setPackages(next.ticketTypes); setAccessCode(code); setCodeState("ok");
      const unlocked = next.ticketTypes.find((item) => item.hidden && item.available);
      if (unlocked) { setTicketId(unlocked.id); setQuantity(1); setMode(unlocked.kind === "group" ? "group" : "individual"); }
    } catch { setCodeState("error"); }
  }

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
      packages.find(
        (ticket) =>
          ticket.id === Number(params.get("ticket")) && ticket.available,
      )?.id ??
      packages.find((ticket) => ticket.available)?.id ??
      0,
  );
  const [quantity, setQuantity] = useState(() =>
    Math.max(1, Math.min(20, Number(params.get("quantity")) || 1)),
  );
  // Fee rate for the selected ticket type, from one server quote. Quantity changes never refetch.
  const [rate, setRate] = useState<{ key: string; value: FeeRate } | null>(null);
  const [quoteError, setQuoteError] = useState("");
  const [attempt, setAttempt] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [guestName, setGuestName] = useState("");
  const [guestEmail, setGuestEmail] = useState("");
  const [adultConfirmed, setAdultConfirmed] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const submitting = useRef(false);
  const requestKey = useRef<{ fingerprint: string; value: string } | null>(
    null,
  );
  const selection = `${ticketId}:${quantity}`;
  const ticket = packages.find((item) => item.id === ticketId);
  const rateKey = `${ticketId}:${accessCode}`;
  const paid = (ticket?.priceCents ?? 0) > 0;
  const currentQuote = ticket ? ticketTotals(ticket.priceCents, quantity, rate?.key === rateKey ? rate.value : null) : null;
  const returnTo = `/events/${event.id}?ticket=${ticketId}&quantity=${quantity}#tickets`;
  useEffect(() => {
    if (!ticketId || !paid) return;
    const controller = new AbortController();
    setQuoteError("");
    eventApi<BookingQuote>(`/${event.id}/quote`, {
      method: "POST",
      body: JSON.stringify({ ticketTypeId: ticketId, quantity: 1, ...(accessCode ? { accessCode } : {}) }),
      signal: controller.signal,
    })
      .then((value) => {
        if (!controller.signal.aborted) setRate({ key: rateKey, value: feeRateFromQuote(value) });
      })
      .catch((cause) => {
        if (!controller.signal.aborted) {
          setRate(null);
          setQuoteError(
            cause instanceof Error
              ? cause.message
              : "Could not load your total.",
          );
        }
      });
    return () => controller.abort();
  }, [ticketId, paid, event.id, rateKey, attempt, accessCode]);
  async function submit(e: FormEvent) {
    e.preventDefault();
    const guest = signedOut && event.guestBookingAvailable;
    if (submitting.current || !termsAccepted || (!account && !guest) || !currentQuote || !ticket?.available || (guest && (!guestName.trim() || !guestEmail.trim() || !adultConfirmed)))
      return;
    submitting.current = true;
    setBusy(true);
    setError("");
    const fingerprint = guest ? `${event.id}:${selection}:${guestName.trim()}:${guestEmail.trim().toLowerCase()}` : `${account!.id}:${event.id}:${selection}`;
    const storageKey = `tivorah-web-booking:${account?.id}:${event.id}`;
    try {
      if (requestKey.current?.fingerprint !== fingerprint) {
        let saved: { fingerprint: string; value: string } | null = null;
        if (!guest) try {
          saved = JSON.parse(sessionStorage.getItem(storageKey) || "null");
        } catch {
          /* Optional storage; in-memory retries still work. */
        }
        requestKey.current =
          saved?.fingerprint === fingerprint
            ? saved
            : { fingerprint, value: crypto.randomUUID() };
        if (!guest) try {
          sessionStorage.setItem(
            storageKey,
            JSON.stringify(requestKey.current),
          );
        } catch {
          /* Optional storage. */
        }
      }
      const result = guest ? await eventApi<{
        order: { id: number; status: string };
        checkoutUrl: string | null;
        ticketUrl: string;
      }>(`/${event.id}/guest-orders`, {
        method: "POST",
        body: JSON.stringify({ ticketTypeId: ticketId, quantity, idempotencyKey: requestKey.current!.value, name: guestName.trim(), email: guestEmail.trim(), adultConfirmed, termsAccepted, ...(accessCode ? { accessCode } : {}) }),
      }) : await api<{
        order: { id: number; status: string };
        checkoutUrl: string | null;
        ticketUrl?: string;
      }>(`/web/account/events/${event.id}/orders`, {
        method: "POST",
        body: JSON.stringify({
          ticketTypeId: ticketId,
          quantity,
          idempotencyKey: requestKey.current!.value,
          termsAccepted,
          ...(accessCode ? { accessCode } : {}),
        }),
      });
      if (result.checkoutUrl) {
        const url = new URL(result.checkoutUrl);
        if (url.protocol !== "https:" || url.hostname !== "checkout.stripe.com")
          throw new Error("The payment link could not be verified.");
        window.location.assign(url.href);
      } else {
        if (!guest && result.order.status !== "pending_payment") {
          try {
            sessionStorage.removeItem(storageKey);
          } catch {}
        }
        if (guest) {
          if (!result.ticketUrl) throw new Error("The private ticket link is unavailable. Check your email or contact Tivorah with your booking number.");
          const ticketUrl = new URL(result.ticketUrl);
          if (ticketUrl.pathname !== `/event-orders/${result.order.id}` || !/^#access=[A-Za-z0-9_-]{43}$/.test(ticketUrl.hash)) throw new Error("The private ticket link could not be verified.");
          window.location.assign(`${window.location.origin}${ticketUrl.pathname}${ticketUrl.hash}`);
        } else window.location.assign(`/account/orders/${result.order.id}`);
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
  if (!packages.some((item) => item.available) && !groupAllowed && !event.hasAccessCodePackages)
    return (
      <p role="status">
        Tickets are unavailable right now. They may be sold out or outside the
        sale period.
      </p>
    );
  const modePackages = packages.filter((item) => !groupAllowed || (mode === "group") === (item.kind === "group"));
  const ticketChoices = modePackages.map((item) => {
    const notYet = item.salesStartAt && new Date(item.salesStartAt).getTime() > Date.now();
    const ended = item.salesEndAt && new Date(item.salesEndAt).getTime() <= Date.now();
    const state = item.releaseAfterName ? `On sale when ${item.releaseAfterName} sells out` : item.remaining <= 0 ? "Sold out" : notYet ? `On sale ${new Date(item.salesStartAt!).toLocaleString("en-AU", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" })}` : ended ? "Sale ended" : !item.available ? "Unavailable" : item.remaining <= 10 ? `Only ${item.remaining} left` : "";
    return { item, state, label: `${item.name} · ${item.priceCents ? ticketMoney(item.priceCents, item.currency) : "Free"}${state ? ` · ${state}` : ""}` };
  });
  const chosenTicket = ticketChoices.find((choice) => choice.item.id === ticketId);
  const extras = <>
    {event.hasAccessCodePackages && codeState !== "ok" ? <form className="booking-code" onSubmit={applyCode}>
      <label htmlFor="booking-code">Have an access code?</label>
      <div><input id="booking-code" value={codeInput} onChange={(e) => { setCodeInput(e.target.value.toUpperCase()); setCodeState("idle"); }} autoCapitalize="characters" autoComplete="off" maxLength={40} placeholder="Enter code" aria-invalid={codeState === "error"} />
        <button type="submit" className="event-secondary" disabled={!codeInput.trim() || codeState === "checking"}>{codeState === "checking" ? "Checking…" : "Apply"}</button></div>
      {codeState === "error" ? <p className="event-error" role="alert">That code didn’t unlock any tickets. Check it and try again.</p> : null}
    </form> : null}
    {codeState === "ok" ? <p className="booking-code-ok" role="status">Code applied — your special tickets are now shown.</p> : null}
    {groupAllowed && mode === "group" ? <GroupRequest eventId={event.id} packages={packages} /> : null}
  </>;
  if (groupAllowed && mode === "group" && !modePackages.some((item) => item.available)) return <>
    <div className="booking-mode" role="tablist" aria-label="How are you booking?">
      {(["individual", "group"] as const).map((value) => <button key={value} type="button" role="tab" aria-selected={mode === value} className={mode === value ? "is-selected" : ""} onClick={() => setMode(value)}>
        <strong>{value === "individual" ? "Individual" : "Group"}</strong><span>{value === "individual" ? "Tickets for you and friends" : "One booking for your whole group"}</span>
      </button>)}
    </div>
    {extras}
  </>;
  return (
    <>
    <form onSubmit={submit}>
      <fieldset disabled={busy}>
        <legend className="event-sr">Choose tickets</legend>
        {groupAllowed ? <div className="booking-mode" role="tablist" aria-label="How are you booking?">
          {(["individual", "group"] as const).map((value) => <button key={value} type="button" role="tab" aria-selected={mode === value} className={mode === value ? "is-selected" : ""}
            onClick={() => { setMode(value); const first = packages.find((item) => item.available && (value === "group") === (item.kind === "group")); if (first) { setTicketId(first.id); setQuantity(1); } }}>
            <strong>{value === "individual" ? "Individual" : "Group"}</strong><span>{value === "individual" ? "Tickets for you and friends" : "One booking for your whole group"}</span>
          </button>)}
        </div> : null}
        <label htmlFor="event-ticket-type">Ticket type</label>
        <SelectField id="event-ticket-type" label="Ticket type" value={String(ticketId ?? "")} onChange={(value) => { setTicketId(Number(value)); setQuantity(1); }}
          options={ticketChoices.map(({ item, label }) => ({ value: String(item.id), label, disabled: !item.available }))} />
        {chosenTicket ? <p className="event-help" role="status">
          {chosenTicket.item.kind === "group" ? `${chosenTicket.item.groupSize} people per booking${chosenTicket.item.priceCents ? ` · ${ticketMoney(Math.round(chosenTicket.item.priceCents / Math.max(1, chosenTicket.item.groupSize ?? 1)), chosenTicket.item.currency)} each` : ""}. ` : ""}
          {chosenTicket.item.description ? `${chosenTicket.item.description} ` : ""}
          {chosenTicket.state ? chosenTicket.state : ""}
        </p> : null}
        <label htmlFor="event-quantity">Quantity</label>
        <SelectField
          id="event-quantity"
          label="Quantity"
          value={String(quantity)}
          onChange={(value) => setQuantity(Number(value))}
          options={Array.from(
            { length: Math.min(20, ticket?.remaining || 1, ticket?.maxTicketsPerBuyer || 1) },
            (_, i) => ({ value: String(i + 1), label: String(i + 1) }),
          )}
        />
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
                <AnimatedMoney cents={currentQuote.subtotalCents} format={(cents) => ticketMoney(cents, chosenTicket?.item.currency)} />
              </div>
              {currentQuote.chargedTo === "buyer" &&
              currentQuote.platformFeeCents > 0 ? (
                <div>
                  <span>Booking fee</span>
                  <AnimatedMoney cents={currentQuote.platformFeeCents} format={(cents) => ticketMoney(cents, chosenTicket?.item.currency)} />
                </div>
              ) : null}
              <div>
                <strong>Total</strong>
                <strong>
                  {currentQuote.buyerTotalCents
                    ? <AnimatedMoney cents={currentQuote.buyerTotalCents} format={(cents) => ticketMoney(cents, chosenTicket?.item.currency)} />
                    : "Free"}
                </strong>
              </div>
            </>
          ) : (
            quoteError ? <p role="alert">{quoteError}</p> : <div aria-busy="true"><span>Total</span><span className="event-total-pending tivorah-shimmer" aria-label="Loading price" /></div>
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
          event.guestBookingAvailable ? <div className="event-guest-fields">
            <h3>Book as a guest</h3>
            <p className="event-help">We’ll email your tickets and a private link to manage them. No account needed.</p>
            <label htmlFor="guest-full-name">Full name</label>
            <input id="guest-full-name" name="guestName" autoComplete="name" minLength={2} maxLength={100} required value={guestName} onChange={(e) => setGuestName(e.target.value)} />
            <label htmlFor="guest-email">Email address</label>
            <input id="guest-email" name="guestEmail" type="email" autoComplete="email" maxLength={254} required value={guestEmail} onChange={(e) => setGuestEmail(e.target.value)} />
            <BookingTermsConsent confirmAge checked={adultConfirmed && termsAccepted} onChange={(value) => { setAdultConfirmed(value); setTermsAccepted(value); }} />
            <button className="event-primary" disabled={busy || !currentQuote || !!quoteError || !adultConfirmed || !termsAccepted} type="submit">{busy ? "Opening your booking…" : currentQuote?.buyerTotalCents ? "Continue as guest to payment" : "Get free tickets as guest"}</button>
            <p className="event-signin-option">Want tickets in your account? <Link href={`/auth/signin?returnTo=${encodeURIComponent(returnTo)}`}>Sign in instead</Link></p>
          </div> : <><p>Guest booking is temporarily unavailable. Sign in to keep your tickets in your account.</p><Link className="event-primary" href={`/auth/signin?returnTo=${encodeURIComponent(returnTo)}`}>Sign in to book</Link></>
        ) : account ? (
          <>
            <p>
              Booking as{" "}
              <strong>{account.firstName || account.username}</strong>.
            </p>
            <BookingTermsConsent checked={termsAccepted} onChange={setTermsAccepted} />
            <button
              className="event-primary"
              disabled={busy || !currentQuote || !!quoteError || !termsAccepted}
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
    {extras}
    </>
  );
}

// "Book as a group": ask the organiser for a large block of tickets (more than 20).
function GroupRequest({ eventId, packages }: { eventId: number; packages: PublicEvent["ticketTypes"] }) {
  const [open, setOpen] = useState(false);
  const [state, setState] = useState<"idle" | "sending" | "sent">("idle");
  const [error, setError] = useState("");
  async function send(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    setState("sending"); setError("");
    try {
      await eventApi(`/${eventId}/group-requests`, { method: "POST", body: JSON.stringify({
        name: String(form.get("name") || "").trim(), email: String(form.get("email") || "").trim(),
        organisation: String(form.get("organisation") || "").trim() || undefined, quantity: Number(form.get("quantity")),
        ticketTypeId: Number(form.get("ticket")) || undefined, message: String(form.get("message") || "").trim() || undefined,
      }) });
      setState("sent");
    } catch (cause) { setState("idle"); setError(cause instanceof Error ? cause.message : "Your request couldn’t be sent."); }
  }
  if (state === "sent") return <div className="group-request-sent" role="status"><strong>Request sent</strong><p>The organiser will email you a private link to pay for your group’s tickets.</p></div>;
  return <div className="group-request-box">
    {!open ? <button type="button" className="event-secondary group-request-toggle" onClick={() => setOpen(true)}>Booking for more than 20 people? <span>Request a group booking →</span></button> : <form onSubmit={send} className="group-request-form">
      <h3>Request a group booking</h3>
      <p className="event-help">For schools, companies and clubs. The organiser will reply with a private payment link for the whole group.</p>
      <label>Your name<input name="name" required minLength={2} maxLength={100} autoComplete="name" /></label>
      <label>Email<input name="email" type="email" required maxLength={254} autoComplete="email" inputMode="email" placeholder="name@company.com.au" /></label>
      <label>Organisation (optional)<input name="organisation" maxLength={160} autoComplete="organization" /></label>
      <label>How many people?<input name="quantity" type="number" min={21} max={500} defaultValue={25} required /></label>
      {packages.length > 1 ? <label>Preferred ticket<SelectField name="ticket" label="Preferred ticket" defaultValue={String(packages[0]?.id ?? "")} options={packages.filter((item) => !item.hidden).map((item) => ({ value: String(item.id), label: item.name }))} /></label> : <input type="hidden" name="ticket" value={packages[0]?.id ?? ""} />}
      <label>Message (optional)<textarea name="message" rows={3} maxLength={1000} placeholder="Anything the organiser should know" /></label>
      {error ? <p className="event-error" role="alert">{error}</p> : null}
      <div className="group-request-actions"><button type="button" className="event-secondary" onClick={() => setOpen(false)}>Cancel</button><button className="event-primary" disabled={state === "sending"}>{state === "sending" ? "Sending…" : "Send request"}</button></div>
    </form>}
  </div>;
}
