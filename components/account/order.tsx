"use client";
import { LoadingState } from "../ui/loading-state";
import Link from "next/link";
import { usePrivateResource } from "../../hooks/use-private-resource";
import { money } from "../../lib/api/discovery";
import { AccountGate } from "./gate";
function Order({ id }: { id: string }) {
  const { data, loading, error, retry } = usePrivateResource<{
    order: { id: number; status: string; quantity: number; totalCents: number };
    checkoutUrl: string | null;
  }>(`/events/orders/${encodeURIComponent(id)}`);
  const checkout = data?.checkoutUrl?.startsWith("https://checkout.stripe.com/")
    ? data.checkoutUrl
    : null;
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
          <div className="account-actions">
            {data.order.status === "confirmed" ? (
              <Link className="product-primary" href="/account/tickets">
                View your tickets
              </Link>
            ) : (
              <button
                className="product-secondary"
                onClick={retry}
                disabled={loading}
              >
                Refresh status
              </button>
            )}
            {data.order.status === "pending_payment" && checkout ? (
              <a className="product-primary" href={checkout}>
                Continue payment
              </a>
            ) : null}
          </div>
          <p>
            Payment may take a moment to confirm. Contact support with your
            booking number if you need help.
          </p>
          <Link href="/contact">Get help</Link>
        </section>
      ) : null}
    </>
  );
}
export function AccountOrder({ id }: { id: string }) {
  return <AccountGate>{() => <Order id={id} />}</AccountGate>;
}
