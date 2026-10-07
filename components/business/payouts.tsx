"use client";
import { CheckoutMethodsChooser, type CheckoutMethod } from "./checkout-methods-chooser";
import { SelectField } from "../ui/select-field";
import countries from "../../lib/country-codes.json";
import { EventTaxSettings } from "./event-tax-settings";
import PayoutStatistics from "./payout-statistics";
import { PayoutsLayout, PayoutsLoading } from "./payouts-layout";
import { useEffect, useState } from "react";
import { AccountGate } from "../account/gate";
import { usePrivateResource } from "../../hooks/use-private-resource";
import { api } from "../../lib/api/client";
type Payouts = {
  paymentCountries?: string[];
  sellerCountry?: string | null;
  countryPaymentsEnabled?: boolean;
  connected: boolean;
  chargesEnabled: boolean;
  payoutsEnabled: boolean;
  currentPartnerAgreementVersion: string;
  partnerAgreementVersion: string | null;
  checkoutMethods: CheckoutMethod[] | null;
  availableCheckoutMethods?: CheckoutMethod[];
  hasCheckoutLogo?: boolean;
};
function PayoutSettings() {
  const { data, loading, error, retry } = usePrivateResource<Payouts>(
    "/payments/connect/account",
  );
  const [section, setSection] = useState<'payouts' | 'payments' | 'settings'>('payouts');
  useEffect(() => {
    const readSection = () => {
      const hash = window.location.hash;
      setSection(hash === '#payments' ? 'payments' : hash === '#settings' || hash === '#event-tax' ? 'settings' : 'payouts');
    };
    readSection();
    window.addEventListener('hashchange', readSection);
    return () => window.removeEventListener('hashchange', readSection);
  }, []);
  function selectSection(value: 'payouts' | 'payments' | 'settings') {
    setSection(value);
    window.history.replaceState(null, '', `#${value}`);
  }
  const [country, setCountry] = useState("");
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
    if (!data?.connected && !data?.paymentCountries?.includes(country)) return;
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
              : { agreementVersion: data.currentPartnerAgreementVersion, ...(!data.connected ? { country, checkoutMethods: methods } : {}) },
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
    <nav className="event-manage-tabs payout-workspace-tabs" aria-label="Payout workspace">
      {(['payouts', 'payments', 'settings'] as const).map(value => <button type="button" key={value} aria-pressed={section === value} aria-controls={`payout-view-${value}`} onClick={() => selectSection(value)}>{value[0].toUpperCase() + value.slice(1)}</button>)}
    </nav>
    {error ? <div className="product-notice" role="alert"><p>{error}</p><button className="product-secondary" onClick={retry}>Try again</button></div> : null}
    {loading && data ? <p role="status">Updating payout status…</p> : null}
    {data ? <>
      <div hidden={section === 'settings'}><PayoutStatistics view={section === 'payments' ? 'payments' : 'payouts'} connected={data.connected} /></div>
      <div id="payout-view-settings" hidden={section !== 'settings'}>
      <header className="payout-section-heading"><h2>Payment settings</h2><p>Manage your bank connection, seller tax details and customer checkout.</p></header>
      <div className="payouts-status-grid">
        <section className="payouts-card"><h2>Customer payments</h2><p className="payouts-state"><span aria-hidden="true">{data.chargesEnabled ? "✓" : "○"}</span>{data.chargesEnabled ? "Enabled" : "Setup required"}</p><p>Payments for your paid tickets and service bookings.</p></section>
        <section className="payouts-card"><h2>Bank payouts</h2><p className="payouts-state"><span aria-hidden="true">{data.payoutsEnabled ? "✓" : "○"}</span>{data.payoutsEnabled ? "Enabled" : "Setup required"}</p><p>Transfers from your Stripe balance to your bank account.</p></section>
      </div>
      </div>
      <section hidden={section === 'payments'} className="payouts-card payouts-account-card"><div><h2>{data.connected ? "Your Stripe account" : "Connect your payout account"}</h2><p>{data.connected ? "View payout activity in Stripe or update your account details." : "Complete your account details in Stripe to set up payments and payouts."}</p></div>
        {!agreementCurrent ? <label className="product-checkbox"><input type="checkbox" checked={accepted} onChange={e => setAccepted(e.target.checked)} /><span>I accept the <a href="/marketplace-partner-agreement" target="_blank" rel="noopener noreferrer">Marketplace Partner Agreement</a> (version {data.currentPartnerAgreementVersion}).</span></label> : null}
        <p className="payouts-tab-note">Stripe opens in a new tab.</p>
        {!data.connected ? <label>Country where your seller business is established<SelectField label="Seller business country" value={country} onChange={setCountry} options={countries.map(option => ({ value: option.code, label: option.name }))} /></label> : null}
        {!data.connected ? <div className="payouts-connect-methods"><h3>Payment methods for your buyers</h3><p>You can change this any time in Settings.</p><CheckoutMethodsChooser name="connect-checkout-methods" value={methods} available={data.availableCheckoutMethods ?? ["card"]} onChange={setMethods} disabled={busy !== null} /></div> : null}
        <p>Online seller payments are available in {(data.paymentCountries ?? []).map(code => countries.find(option => option.code === code)?.name ?? code).join(', ') || 'no countries at present'}. Hubs, listings, enquiries and bookings without online payment remain available elsewhere.</p>
        {data.connected && data.countryPaymentsEnabled === false ? <p role="status">New online payments are unavailable for your seller country. Existing payment records and Stripe account access remain available.</p> : null}
        <div className="account-actions">
          {data.connected && data.chargesEnabled && data.payoutsEnabled ? <>
            <button className="product-primary" disabled={busy !== null} onClick={() => open(true)}>{busy === "dashboard" ? "Opening Stripe…" : "Open Stripe dashboard"}</button>
            {section === 'settings' ? <button className="product-secondary" disabled={busy !== null || (!data.connected && !data.paymentCountries?.includes(country)) || (!agreementCurrent && !accepted)} onClick={() => open(false)}>{busy === "onboarding" ? "Opening account details…" : "Update payout details"}</button> : <button className="product-secondary" onClick={() => selectSection('settings')}>Manage settings</button>}
          </> : <>
            <button className="product-primary" disabled={busy !== null || (!data.connected && !data.paymentCountries?.includes(country)) || (!agreementCurrent && !accepted)} onClick={() => open(false)}>{busy === "onboarding" ? "Opening setup…" : data.connected ? "Continue payout setup" : "Set up payouts"}</button>
            {data.connected ? <button className="product-secondary" disabled={busy !== null} onClick={() => open(true)}>{busy === "dashboard" ? "Opening Stripe…" : "Open Stripe dashboard"}</button> : null}
          </>}
        </div>
        {notice ? <p role="alert">{notice}</p> : null}
      </section>
      <div hidden={section !== 'settings'}>
      <div className="payout-settings-grid">
      <EventTaxSettings />
      <div>
      {data.connected ? <section className="payouts-card payouts-checkout-settings" aria-label="Customer checkout settings">
        <h2>Customer checkout</h2>
        <p>Choose what customers can pay with for your tickets and services.</p>
        <CheckoutMethodsChooser name="checkout-method-mode" value={methods} available={data.availableCheckoutMethods ?? ["card"]} onChange={setMethods} disabled={settingsBusy} />
        <button type="button" className="product-primary" disabled={settingsBusy || JSON.stringify(methods) === JSON.stringify(data.checkoutMethods)} onClick={() => void saveMethods()}>{settingsBusy ? "Saving…" : "Save checkout options"}</button>
        <div className="payouts-logo-control"><strong>Checkout logo</strong><p>{data.hasCheckoutLogo ? "A logo is set for your Stripe checkout." : "Add your own logo to Stripe checkout."} PNG, JPEG or WebP, up to 2 MB.</p><input id="checkout-logo" className="payouts-logo-input" type="file" accept="image/png,image/jpeg,image/webp" disabled={settingsBusy} aria-label="Choose checkout logo image" onChange={event => { void uploadLogo(event.target.files?.[0]); event.target.value = ""; }} /><label className="product-secondary payouts-logo-upload" htmlFor="checkout-logo">{data.hasCheckoutLogo ? "Replace logo" : "Upload logo"}</label></div>
        {settingsNotice ? <p role="status">{settingsNotice}</p> : null}
      </section> : null}
      <section className="payouts-card"><h2>Partner agreement</h2><p>{agreementCurrent ? `You’ve accepted the current agreement (version ${data.currentPartnerAgreementVersion}).` : "Accept the current agreement before setting up or updating payouts."}</p><a className="payouts-agreement-link" href="/marketplace-partner-agreement" target="_blank" rel="noopener noreferrer">Read the Marketplace Partner Agreement <span aria-hidden="true">↗</span></a></section>
      </div></div></div>
    </> : null}
  </PayoutsLayout>;
}
export function BusinessPayouts() {
  return <AccountGate>{() => <PayoutSettings />}</AccountGate>;
}
