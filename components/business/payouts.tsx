"use client";
import { LoadingState } from "../ui/loading-state";
import { useState } from "react";
import { AccountGate } from "../account/gate";
import { usePrivateResource } from "../../hooks/use-private-resource";
import { api } from "../../lib/api/client";
type Payouts = {
  connected: boolean;
  chargesEnabled: boolean;
  payoutsEnabled: boolean;
  currentPartnerAgreementVersion: string;
  partnerAgreementVersion: string | null;
};
function PayoutSettings() {
  const { data, loading, error, retry } = usePrivateResource<Payouts>(
    "/payments/connect/account",
  );
  const [accepted, setAccepted] = useState(false);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");
  async function open(dashboard: boolean) {
    if (!data || busy) return;
    setBusy(true);
    setNotice("");
    try {
      const result = await api<{ url: string }>(
        `/payments/connect/${dashboard ? "dashboard" : "onboarding"}`,
        {
          method: "POST",
          body: JSON.stringify(
            dashboard
              ? {}
              : { agreementVersion: data.currentPartnerAgreementVersion },
          ),
        },
      );
      const url = new URL(result.url);
      if (
        url.protocol !== "https:" ||
        !["connect.stripe.com", "dashboard.stripe.com"].includes(url.hostname)
      )
        throw new Error("Could not verify the payout link.");
      window.location.assign(url.href);
    } catch (cause) {
      setNotice(cause instanceof Error ? cause.message : "Please try again.");
      setBusy(false);
    }
  }
  return (
    <section className="product-form">
      <h1>Payout settings</h1>
      {loading ? <LoadingState label="Checking your payout account…" refreshing={!!data} /> : null}
      {error ? (
        <div role="alert">
          <p>{error}</p>
          <button className="product-secondary" onClick={retry}>
            Try again
          </button>
        </div>
      ) : null}
      {data ? (
        <>
          <p>Payments: {data.chargesEnabled ? "Enabled" : "Setup required"}</p>
          <p>Payouts: {data.payoutsEnabled ? "Enabled" : "Setup required"}</p>
          <label className="product-checkbox">
            <input
              type="checkbox"
              checked={accepted}
              onChange={(e) => setAccepted(e.target.checked)}
            />
            <span>
              I accept the{" "}
              <a href="/marketplace-partner-agreement" target="_blank">
                Marketplace Partner Agreement
              </a>{" "}
              (version {data.currentPartnerAgreementVersion}).
            </span>
          </label>
          <div className="account-actions">
            <button
              className="product-primary"
              disabled={busy || !accepted}
              onClick={() => open(false)}
            >
              Set up or update payouts
            </button>
            {data.connected ? (
              <button
                className="product-secondary"
                disabled={busy}
                onClick={() => open(true)}
              >
                Open Stripe dashboard
              </button>
            ) : null}
          </div>
        </>
      ) : null}
      {notice ? <p role="alert">{notice}</p> : null}
    </section>
  );
}
export function BusinessPayouts() {
  return <AccountGate>{() => <PayoutSettings />}</AccountGate>;
}
