"use client";
import { LoadingState } from "../ui/loading-state";
import { useState } from "react";
import { AccountGate } from "./gate";
import { usePrivateResource } from "../../hooks/use-private-resource";
import { api } from "../../lib/api/client";
import { money } from "../../lib/api/discovery";
type Booking = {
  id: number;
  startsAt: string;
  status: string;
  totalCents: number;
  perspective: string;
  product: { title: string };
};
function BookingList() {
  const { data, loading, error, retry } = usePrivateResource<{
    bookings: Booking[];
  }>("/market/bookings/me");
  const [pending, setPending] = useState<number | null>(null);
  const [notice, setNotice] = useState("");
  const [confirm, setConfirm] = useState<number | null>(null);
  async function resumePayment(id: number) {
    if (pending) return;
    setPending(id);
    setNotice("");
    try {
      const result = await api<{ checkoutUrl: string | null }>(
        `/web/account/bookings/${id}/payment`,
        { method: "POST" },
      );
      if (result.checkoutUrl) {
        const target = new URL(result.checkoutUrl);
        if (
          target.protocol !== "https:" ||
          target.hostname !== "checkout.stripe.com"
        )
          throw new Error("The payment link could not be verified.");
        window.location.assign(target.href);
      } else {
        setNotice(
          "Payment status is updating. Refresh your appointments shortly.",
        );
        retry();
      }
    } catch (cause) {
      setNotice(
        cause instanceof Error
          ? cause.message
          : "Could not check payment. Please try again.",
      );
    } finally {
      setPending(null);
    }
  }
  async function cancel(id: number) {
    if (pending) return;
    setPending(id);
    setNotice("");
    try {
      await api(`/market/bookings/${id}/cancel`, { method: "POST" });
      setNotice("Booking cancelled. Any applicable refund has been submitted.");
      setConfirm(null);
      retry();
    } catch (cause) {
      setNotice(
        cause instanceof Error
          ? cause.message
          : "Could not cancel. Please try again.",
      );
    } finally {
      setPending(null);
    }
  }
  return (
    <>
      <h1>Service appointments</h1>
      <p>Your bookings and appointments customers have made with you.</p>
      {loading ? <LoadingState label="Loading appointments…" refreshing={!!data} /> : null}
      {error ? (
        <div className="product-notice" role="alert">
          <p>{error}</p>
          <button className="product-secondary" onClick={retry}>
            Try again
          </button>
        </div>
      ) : null}
      {notice ? (
        <p role="status" className="product-notice">
          {notice}
        </p>
      ) : null}
      <div className="account-grid">
        {data?.bookings.map((booking) => (
          <article className="account-panel" key={booking.id}>
            <p className="product-eyebrow">
              {booking.perspective === "provider"
                ? "CUSTOMER BOOKING"
                : "YOUR BOOKING"}
            </p>
            <h2>{booking.product.title}</h2>
            {booking.status === "pending_payment" &&
            booking.perspective === "customer" ? (
              <button
                className="product-primary"
                disabled={pending !== null}
                onClick={() => resumePayment(booking.id)}
              >
                {pending === booking.id
                  ? "Checking payment…"
                  : "Continue payment"}
              </button>
            ) : null}
            <p>{new Date(booking.startsAt).toLocaleString("en-AU")}</p>
            <p>
              Status: {booking.status.replaceAll("_", " ")} ·{" "}
              {money(booking.totalCents)}
            </p>
            {booking.status === "confirmed" &&
            new Date(booking.startsAt) > new Date() ? (
              confirm === booking.id ? (
                <>
                  <p>Cancel this appointment?</p>
                  <div className="account-actions">
                    <button
                      className="product-secondary"
                      disabled={pending !== null}
                      onClick={() => cancel(booking.id)}
                    >
                      {pending === booking.id
                        ? "Cancelling…"
                        : "Confirm cancellation"}
                    </button>
                    <button
                      className="product-secondary"
                      onClick={() => setConfirm(null)}
                    >
                      Keep appointment
                    </button>
                  </div>
                </>
              ) : (
                <button
                  className="product-secondary"
                  onClick={() => setConfirm(booking.id)}
                >
                  Cancel appointment
                </button>
              )
            ) : null}
          </article>
        ))}
      </div>
      {!loading && !error && !data?.bookings.length ? (
        <p className="product-empty">Your appointments will appear here.</p>
      ) : null}
    </>
  );
}
export function AccountBookings() {
  return <AccountGate>{() => <BookingList />}</AccountGate>;
}
