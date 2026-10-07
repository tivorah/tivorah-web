"use client";
import Link from "next/link";
import { FormEvent, useState } from "react";
import { usePrivateResource } from "../../hooks/use-private-resource";
import { api } from "../../lib/api/client";
import { SelectField } from "../ui/select-field";

type Profile = { legalName: string; abn: string | null; gstRegistered: boolean; declaredAt: string };
export function EventTaxSettings() {
  const resource = usePrivateResource<{ profile: Profile | null; suggestedLegalName?: string | null; prefillUnavailable?: boolean }>("/payments/event-tax-profile");
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy || !resource.data) return;
    const form = new FormData(event.currentTarget);
    setBusy(true); setNotice(""); setError("");
    try {
      await api("/payments/event-tax-profile", { method: "PUT", body: JSON.stringify({ legalName: form.get("legalName"), abn: String(form.get("abn") || "").trim() || null, gstRegistered: form.get("gstRegistered") === "yes", declarationAccepted: form.get("declaration") === "on", declarationVersion: "1.1" }) });
      setNotice("Tax details saved for new bookings. Existing receipts keep their original details.");
      resource.retry();
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Could not save tax details. Try again."); }
    finally { setBusy(false); }
  }
  return <section id="event-tax" className="payouts-card showcase-form" aria-label="Seller tax settings">
    <h2>Seller tax details</h2>
    <p>Complete once for your seller account, shared by events and services. Ticket prices must include any applicable GST. Registered sellers must also choose each event’s GST treatment in its event workspace before AUD tickets can be booked.</p>
    {resource.error ? <div role="alert"><p>{resource.error}</p><button type="button" className="product-secondary" onClick={resource.retry}>Retry tax details</button></div> : null}
    {!resource.data ? resource.loading ? <p role="status">Loading tax details…</p> : null : <form key={resource.data.profile?.declaredAt || "new"} onSubmit={submit}>
      <fieldset disabled={busy || !!resource.error} className="showcase-step event-details-fieldset event-tax-fields" style={{ padding: 0, border: 0, background: "transparent" }}>
        {!resource.data.profile && resource.data.suggestedLegalName ? <p className="showcase-hint">Legal name filled from Stripe. Review before confirming.</p> : null}
        <label>Seller’s legal name<input name="legalName" defaultValue={resource.data.profile?.legalName || resource.data.suggestedLegalName || ""} required minLength={2} maxLength={160} autoComplete="organization" /></label>
        <label>ABN<input name="abn" defaultValue={resource.data.profile?.abn || ""} inputMode="numeric" maxLength={20} aria-describedby="abn-help" /></label>
        <p id="abn-help" className="showcase-hint">Required if registered for Australian GST. Enter the seller’s ABN, not Tivorah’s.</p>
        <label>Registered for Australian GST<SelectField name="gstRegistered" label="Registered for Australian GST" defaultValue={resource.data.profile ? resource.data.profile.gstRegistered ? "yes" : "no" : ""} required options={[{ value: "no", label: "No" }, { value: "yes", label: "Yes" }]} /></label>
        <p>You supply the event or service and handle your income tax and any GST you owe. Tivorah handles tax on its own fees. Stripe payment setup does not register you for GST or file your tax returns. <Link href="/seller-tax">How seller taxes and reporting work</Link>.</p>
        <label className="product-checkbox"><input type="checkbox" name="declaration" required /><span>I confirm these details reflect my current registration and authorise Tivorah to include them on my booking receipts. I will update them if they change. I am responsible for my seller tax obligations.</span></label>
        <p className="showcase-hint">This is your declaration. Tivorah does not verify GST registration from an ABN checksum. GST is shown only for AUD tickets with a declared tax treatment.</p>
        <button className="product-primary" disabled={busy}>{busy ? "Saving…" : "Save tax details"}</button>
      </fieldset>
    </form>}
    {notice ? <p role="status">{notice}</p> : null}{error ? <p role="alert">{error}</p> : null}
  </section>;
}
