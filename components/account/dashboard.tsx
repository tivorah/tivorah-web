"use client";
import Link from "next/link";
import { useState } from "react";
import { AccountGate } from "./gate";
import { memberAuth } from "../../lib/auth/client";
export function AccountDashboard() {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  async function signOut() {
    if (busy) return;
    setBusy(true);
    setError("");
    try {
      const result = await memberAuth.signOut();
      if (result.error)
        throw new Error("Could not sign out. Please try again.");
      window.location.replace("/auth/signin");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Please try again.");
      setBusy(false);
    }
  }
  return (
    <AccountGate>
      {(account) => (
        <>
          <header className="account-heading">
            <div>
              <p className="product-eyebrow">YOUR TIVORAH</p>
              <h1>Hello, {account.firstName || account.username}.</h1>
              <p>Your bookings, plans and next possibilities.</p>
            </div>
            <button
              className="product-secondary"
              disabled={busy}
              onClick={signOut}
            >
              {busy ? "Signing out…" : "Sign out"}
            </button>
          </header>
          {error ? <p role="alert">{error}</p> : null}
          <div className="account-grid">
            <section className="account-panel">
              <h2>Your tickets</h2>
              <p>
                Keep your next experience close. Access the event tickets issued
                to your account.
              </p>
              <Link className="product-primary" href="/account/tickets">
                View tickets
              </Link>
            </section>
            <section className="account-panel">
              <h2>Appointments</h2>
              <p>
                Check the services you have booked and manage your appointments.
              </p>
              <Link className="product-secondary" href="/account/bookings">
                View bookings
              </Link>
            </section>
            <section className="account-panel">
              <h2>Your business</h2>
              <p>Find your listings, services and events in one place.</p>
              <Link className="product-secondary" href="/business">
                Manage business
              </Link>
            </section>
            <section className="account-panel">
              <h2>Account & help</h2>
              <p>{account.email}</p>
              <div className="account-actions">
                <Link href="/account/settings">Profile & security</Link>
                <Link href="/account/notifications">Booking & business updates</Link>
                <Link href="/contact">Get support</Link>
                <Link href="/account-deletion">Account deletion</Link>
              </div>
            </section>
          </div>
        </>
      )}
    </AccountGate>
  );
}
