"use client";
import { PayoutsLayout, PayoutsLoading } from "./payouts-layout";
import { useEffect, useState } from "react";
import { AccountGate } from "../account/gate";
import { usePrivateResource } from "../../hooks/use-private-resource";
import { api } from "../../lib/api/client";
type Payouts = {
  connected: boolean;
  chargesEnabled: boolean;
  payoutsEnabled: boolean;
  currentPartnerAgreementVersion: string;
  partnerAgreementVersion: string | null;
  checkoutMethods: ("card" | "afterpay_clearpay" | "klarna" | "zip")[] | null;
  availableCheckoutMethods?: ("card" | "afterpay_clearpay" | "klarna" | "zip")[];
  hasCheckoutLogo?: boolean;
};
const optionalMethods = [{ id: "afterpay_clearpay", label: "Afterpay" }, { id: "klarna", label: "Klarna" }, { id: "zip", label: "Zip" }] as const;
function PayoutSettings() {
  const { data, loading, error, retry } = usePrivateResource<Payouts>(
    "/payments/connect/account",
  );
  const [accepted, setAccepted] = useState(false);
  const [busy, setBusy] = useState<"dashboard" | "onboarding" | null>(null);
  const agreementCurrent = !!data && data.partnerAgreementVersion === data.currentPartnerAgreementVersion;
  const [notice, setNotice] = useState("");
  const [methods, setMethods] = useState<Payouts["checkoutMethods"]>(null);
  const [settingsBusy, setSettingsBusy] = useState(false);
  const [settingsNotice, setSettingsNotice] = useState("");
  useEffect(() => { if (data) setMethods(data.checkoutMethods); }, [data]);
  async function saveMethods() {
    if (!data?.connected || settingsBusy) return;
    setSettingsBusy(true); setSettingsNotice("");
    try {
      const saved = await api<{ methods: Payouts["checkoutMethods"] }>("/payments/connect/checkout-methods", { method: "PATCH", body: JSON.stringify({ methods }) });
      setMethods(saved.methods); setSettingsNotice("Checkout choices saved for new payments."); retry();
    } catch (cause) { setSettingsNotice(cause instanceof Error ? cause.message : "Could not save. Try again."); }
    finally { setSettingsBusy(false); }
  }
  async function uploadLogo(file: File | undefined) {
    if (!file || !data?.connected || settingsBusy) return;
    if (file.size > 2 * 1024 * 1024) { setSettingsNotice("Choose a logo under 2 MB."); return; }
    setSettingsBusy(true); setSettingsNotice("Uploading logo…");
    try {
      const body = new FormData(); body.set("logo", file);
      await api("/payments/connect/checkout-logo", { method: "POST", body });
      setSettingsNotice("Logo saved to your Stripe checkout branding."); retry();
    } catch (cause) { setSettingsNotice(cause instanceof Error ? cause.message : "Could not upload the logo. Try again."); }
    finally { setSettingsBusy(false); }
  }
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
      {data.connected ? <section className="payouts-card payouts-checkout-settings" aria-label="Customer checkout settings">
        <h2>Customer checkout</h2>
        <p>Choose which methods customers can see. Stripe may hide a method when the currency or purchase is ineligible.</p>
        <div className="payouts-checkout-choice"><label className="product-checkbox"><input type="radio" name="checkout-method-mode" checked={methods === null} onChange={() => setMethods(null)} /><span>Let Stripe choose</span></label><label className="product-checkbox"><input type="radio" name="checkout-method-mode" checked={methods !== null} onChange={() => setMethods(["card"])} /><span>Choose methods</span></label></div>
        {methods ? <div className="payouts-method-options"><p>Card payments stay available.</p>{optionalMethods.map(option => { const available = data.availableCheckoutMethods?.includes(option.id); return <label className="product-checkbox" key={option.id}><input type="checkbox" checked={methods.includes(option.id)} disabled={!available && !methods.includes(option.id)} onChange={event => setMethods(current => current ? event.target.checked ? [...current, option.id] : current.filter(method => method !== option.id) : ["card"])} /><span>{option.label}{!available ? " · Unavailable in Stripe" : ""}</span></label>; })}</div> : null}
        <button type="button" className="product-primary" disabled={settingsBusy || JSON.stringify(methods) === JSON.stringify(data.checkoutMethods)} onClick={() => void saveMethods()}>{settingsBusy ? "Saving…" : "Save checkout options"}</button>
        <div className="payouts-logo-control"><strong>Checkout logo</strong><p>{data.hasCheckoutLogo ? "A logo is set for your Stripe checkout." : "Add your own logo to Stripe checkout."} PNG, JPEG or WebP, up to 2 MB.</p><input id="checkout-logo" className="payouts-logo-input" type="file" accept="image/png,image/jpeg,image/webp" disabled={settingsBusy} aria-label="Choose checkout logo image" onChange={event => { void uploadLogo(event.target.files?.[0]); event.target.value = ""; }} /><label className="product-secondary payouts-logo-upload" htmlFor="checkout-logo">{data.hasCheckoutLogo ? "Replace logo" : "Upload logo"}</label></div>
        {settingsNotice ? <p role="status">{settingsNotice}</p> : null}
      </section> : null}
      <section className="payouts-card"><h2>Partner agreement</h2><p>{agreementCurrent ? `You’ve accepted the current agreement (version ${data.currentPartnerAgreementVersion}).` : "Accept the current agreement before setting up or updating payouts."}</p><a className="payouts-agreement-link" href="/marketplace-partner-agreement" target="_blank" rel="noopener noreferrer">Read the Marketplace Partner Agreement <span aria-hidden="true">↗</span></a></section>
    </> : null}
  </PayoutsLayout>;
}
export function BusinessPayouts() {
  return <AccountGate>{() => <PayoutSettings />}</AccountGate>;
}
