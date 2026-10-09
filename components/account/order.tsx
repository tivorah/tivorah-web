"use client";
import { LoadingState } from "../ui/loading-state";
import { AccountSurfaceLoading } from "./surface-loading";
import Link from "next/link";
import { usePrivateResource } from "../../hooks/use-private-resource";
import { money } from "../../lib/api/discovery";
import { AccountGate } from "./gate";
import { api } from "../../lib/api/client";
import { adminApiBase } from "../../app/admin/api-base";
import { useState } from "react";
import { CheckoutHoldBanner } from "../discovery/checkout-hold-banner";
import { holdRemainingMs } from "../../lib/checkout-hold";
import { BookingHelp } from "./booking-help";
function Order({ id }: { id: string }) {
  const { data, loading, error, retry } = usePrivateResource<{
    order: { id: number; status: string; receiptLines?: string[]; quantity: number; totalCents: number; currency?: string; createdAt?: string };
    checkoutUrl: string | null;
    holdExpiresAt?: string | null;
  }>(`/events/orders/${encodeURIComponent(id)}`);
  const checkout = data?.checkoutUrl?.startsWith("https://checkout.stripe.com/")
    ? data.checkoutUrl
    : null;
  // Coming back from Stripe without paying lands here: show the same held-tickets countdown.
  const held = data?.order.status === "pending_payment" && checkout && holdRemainingMs(data.holdExpiresAt) > 0
    ? { orderId: data.order.id, checkoutUrl: checkout, startedAt: data.order.createdAt, expiresAt: data.holdExpiresAt!, ticketSummary: `${data.order.quantity} ${data.order.quantity === 1 ? "ticket" : "tickets"}`, totalCents: data.order.totalCents, currency: data.order.currency ?? "AUD" }
    : null;
  const [checking, setChecking] = useState(false);
  const [checkNotice, setCheckNotice] = useState("");
  // "Get my tickets": ask Stripe directly instead of waiting for the payment webhook.
  async function getMyTickets() {
    if (!data || checking) return;
    setChecking(true); setCheckNotice("");
    try {
      const result = await api<{ outcome: string; status: string }>(`/web/account/events/orders/${data.order.id}/sync-payment`, { method: "POST" });
      setCheckNotice(result.status === "confirmed" ? "Payment confirmed. Your tickets are ready." : result.outcome === "closed" ? "Stripe didn’t receive a payment, so the tickets were released." : "Stripe hasn’t received the payment yet. Finish paying, or try again in a moment.");
      retry();
    } catch (cause) { setCheckNotice(cause instanceof Error ? cause.message : "Couldn’t check with Stripe. Try again."); }
    finally { setChecking(false); }
  }
  const paid = data && ["confirmed", "refunded", "disputed"].includes(data.order.status);
  const receiptHref = paid ? `${adminApiBase()}/api/v1/web/account/events/orders/${data.order.id}/receipt` : null;
  if (loading && !data) return <AccountSurfaceLoading embedded />;
  return (
    <>
      <h1>Your event booking</h1>
      {loading ? <LoadingState label="Checking your booking…" refreshing={!!data} /> : null}
      {error ? (
        <div role="alert" className="product-notice">
          <p>{error}</p>
          <button className="product-secondary" onClick={retry}>
            Try again
          </button>
        </div>
      ) : null}
      {data ? (
        <section className="account-panel">
          <p className="product-eyebrow">BOOKING #{data.order.id}</p>
          <h2>
            {data.order.status === "confirmed"
              ? "You’re going."
              : data.order.status === "pending_payment"
                ? "Your booking is awaiting payment confirmation."
                : data.order.status.replaceAll("_", " ")}
          </h2>
          <p>
            {data.order.quantity} tickets · {money(data.order.totalCents)}
          </p>
          {held ? <CheckoutHoldBanner key={held.orderId} checkout={held} onExpire={retry} onCancel={async () => {
            await api(`/web/account/events/orders/${held.orderId}/cancel-checkout`, { method: "POST" });
            retry();
          }} /> : null}
          {data.order.receiptLines?.length ? <details className="showcase-more"><summary>Booking receipt</summary>{data.order.receiptLines.map((line, index) => <p key={index}>{line}</p>)}</details> : null}
          <div className="account-actions">
            {data.order.status === "confirmed" ? (
              <Link className="product-primary" href="/account/tickets">
                View your tickets
              </Link>
            ) : (
              <button
                className="product-secondary"
                onClick={() => void (data.order.status === "pending_payment" ? getMyTickets() : retry())}
                disabled={loading || checking}
              >
                {data.order.status === "pending_payment" ? (checking ? "Checking with Stripe…" : "Get my tickets") : "Refresh status"}
              </button>
            )}
            {data.order.status === "pending_payment" && checkout && !held ? (
              <a className="product-primary" href={checkout}>
                Continue payment
              </a>
            ) : null}
          </div>
          {receiptHref ? <p><a href={receiptHref} download>Download receipt (PDF)</a> · your booking receipt from Tivorah</p> : null}
          {checkNotice ? <p role="status">{checkNotice}</p> : null}
          {paid ? <BookingHelp subjectType="event_order" id={data.order.id} /> : <>
            <p>
              Payment may take a moment to confirm. Contact support with your
              booking number if you need help.
            </p>
            <Link href="/contact">Get help</Link>
          </>}
        </section>
      ) : null}
    </>
  );
}
export function AccountOrder({ id }: { id: string }) {
  return <AccountGate>{() => <Order id={id} />}</AccountGate>;
}
