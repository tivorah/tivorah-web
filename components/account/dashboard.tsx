"use client";
import Link from "next/link";
import { useState } from "react";
import { AccountGate } from "./gate";
import { signOutToSignIn } from "../../lib/auth/sign-out";
function CreateIcon({ kind }: { kind: "event" | "service" | "item" }) {
  return <span className={`account-create-icon account-create-icon-${kind}`} aria-hidden="true"><svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">{kind === "event" ? <><rect x="3" y="5" width="18" height="16" rx="3" /><path d="M7 3v4m10-4v4M3 11h18m-13 5h3" /></> : kind === "service" ? <><rect x="3" y="7" width="18" height="14" rx="3" /><path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M3 12a21 21 0 0 0 18 0M12 11v4" /></> : <><path d="M5 7h14l2 14H3L5 7Z" /><path d="M8 9V6a4 4 0 0 1 8 0v3" /></>}</svg></span>;
}
export function AccountDashboard() {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  async function signOut() {
    if (busy) return;
    setBusy(true);
    setError("");
    // Stays busy until the sign-in page loads; only a failure re-enables the button.
    const failure = await signOutToSignIn();
    if (failure) { setError(failure); setBusy(false); }
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
              aria-busy={busy || undefined}
              onClick={signOut}
            >
              {busy ? <><span className="button-progress" aria-hidden="true" />Signing out…</> : "Sign out"}
            </button>
          </header>
          {error ? <p role="alert">{error}</p> : null}
          <section className="account-create-panel account-panel" aria-labelledby="account-create-title">
            <div className="account-create-heading">
              <div>
                <h2 id="account-create-title">Create on Tivorah</h2>
              </div>
              <Link href="/business" className="account-create-manage">Manage your business <span aria-hidden="true">↗</span></Link>
            </div>
            <div className="account-create-options">
              <Link href="/business/create?type=event"><CreateIcon kind="event" /><strong>Create an event</strong><span>Bring people together</span><span className="account-create-arrow" aria-hidden="true">›</span></Link>
              <Link href="/business/create?type=service"><CreateIcon kind="service" /><strong>Offer a service</strong><span>Share your skills</span><span className="account-create-arrow" aria-hidden="true">›</span></Link>
              <Link href="/business/create?type=item"><CreateIcon kind="item" /><strong>Sell an item</strong><span>List it in Shop</span><span className="account-create-arrow" aria-hidden="true">›</span></Link>
            </div>
          </section>
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
              <h2>Messages</h2>
              <p>Continue conversations with sellers, providers and event organisers.</p>
              <Link className="product-secondary" href="/account/messages">View messages</Link>
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
