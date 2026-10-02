"use client";
import { PayoutsLayout, PayoutsLoading } from "./payouts-layout";
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
  const [busy, setBusy] = useState<"dashboard" | "onboarding" | null>(null);
  const agreementCurrent = !!data && data.partnerAgreementVersion === data.currentPartnerAgreementVersion;
  const [notice, setNotice] = useState("");
  async function open(dashboard: boolean) {
    if (!data || busy || (!dashboard && !agreementCurrent && !accepted)) return;
    const stripeTab = window.open("about:blank", "_blank");
    if (!stripeTab) {
      setNotice("Your browser blocked the new tab. Allow pop-ups for Tivorah and try again.");
      return;
    }
    stripeTab.opener = null;
    stripeTab.document.title = "Opening Stripe…";
    stripeTab.document.body.textContent = "Opening Stripe securely…";
    setBusy(dashboard ? "dashboard" : "onboarding");
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
      if (stripeTab.closed) throw new Error("The Stripe tab was closed. Try again to reopen it.");
      stripeTab.location.replace(url.href);
    } catch (cause) {
      stripeTab.close();
      setNotice(cause instanceof Error ? cause.message : "Please try again.");
    } finally {
      setBusy(null);
    }
  }
  if (loading && !data) return <PayoutsLoading />;
  return <PayoutsLayout>
    {error ? <div className="product-notice" role="alert"><p>{error}</p><button className="product-secondary" onClick={retry}>Try again</button></div> : null}
    {loading && data ? <p role="status">Updating payout status…</p> : null}
    {data ? <>
      <div className="payouts-status-grid">
        <section className="payouts-card"><h2>Customer payments</h2><p className="payouts-state"><span aria-hidden="true">{data.chargesEnabled ? "✓" : "○"}</span>{data.chargesEnabled ? "Enabled" : "Setup required"}</p><p>Payments for your paid tickets and service bookings.</p></section>
        <section className="payouts-card"><h2>Bank payouts</h2><p className="payouts-state"><span aria-hidden="true">{data.payoutsEnabled ? "✓" : "○"}</span>{data.payoutsEnabled ? "Enabled" : "Setup required"}</p><p>Transfers from your Stripe balance to your bank account.</p></section>
      </div>
      <section className="payouts-card payouts-account-card"><div><h2>{data.connected ? "Your Stripe account" : "Connect your payout account"}</h2><p>{data.connected ? "View payout activity in Stripe or update your account details." : "Complete your account details in Stripe to set up payments and payouts."}</p></div>
        {!agreementCurrent ? <label className="product-checkbox"><input type="checkbox" checked={accepted} onChange={e => setAccepted(e.target.checked)} /><span>I accept the <a href="/marketplace-partner-agreement" target="_blank" rel="noopener noreferrer">Marketplace Partner Agreement</a> (version {data.currentPartnerAgreementVersion}).</span></label> : null}
        <p className="payouts-tab-note">Stripe opens in a new tab.</p>
        <div className="account-actions">
          {data.connected && data.chargesEnabled && data.payoutsEnabled ? <>
            <button className="product-primary" disabled={busy !== null} onClick={() => open(true)}>{busy === "dashboard" ? "Opening Stripe…" : "Open Stripe dashboard"}</button>
            <button className="product-secondary" disabled={busy !== null || (!agreementCurrent && !accepted)} onClick={() => open(false)}>{busy === "onboarding" ? "Opening account details…" : "Update payout details"}</button>
          </> : <>
            <button className="product-primary" disabled={busy !== null || (!agreementCurrent && !accepted)} onClick={() => open(false)}>{busy === "onboarding" ? "Opening setup…" : data.connected ? "Continue payout setup" : "Set up payouts"}</button>
            {data.connected ? <button className="product-secondary" disabled={busy !== null} onClick={() => open(true)}>{busy === "dashboard" ? "Opening Stripe…" : "Open Stripe dashboard"}</button> : null}
          </>}
        </div>
        {notice ? <p role="alert">{notice}</p> : null}
      </section>
      <section className="payouts-card"><h2>Partner agreement</h2><p>{agreementCurrent ? `You’ve accepted the current agreement (version ${data.currentPartnerAgreementVersion}).` : "Accept the current agreement before setting up or updating payouts."}</p><a className="payouts-agreement-link" href="/marketplace-partner-agreement" target="_blank" rel="noopener noreferrer">Read the Marketplace Partner Agreement <span aria-hidden="true">↗</span></a></section>
    </> : null}
  </PayoutsLayout>;
}
export function BusinessPayouts() {
  return <AccountGate>{() => <PayoutSettings />}</AccountGate>;
}
