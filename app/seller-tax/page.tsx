import Link from "next/link";
import { pageMetadata } from "../../lib/site";
import { LegalNavigation } from "../legal-navigation";

export const metadata = pageMetadata("Seller taxes and reporting", "Understand seller GST, Tivorah fees and payment reporting for events and services.", "/seller-tax");

export default function SellerTax() {
  return <article className="content">
    <span className="eyebrow">Events and services</span>
    <h1>Seller taxes and reporting</h1>
    <p className="legal-meta">Last updated: 7 October 2026</p>
    <div className="legal-callout"><strong>Your business, your seller taxes</strong><p>For an independent seller’s event or service, the seller supplies the customer. Tivorah provides booking and payment-facilitation tools. Receiving money through Stripe does not make Tivorah responsible for paying the seller’s income tax or automatically filing the seller’s GST returns.</p></div>
    <h2>Members and seller payments</h2>
    <p>Tivorah currently permits only event organisers and service providers whose seller business is established in Australia to receive customer payments through its online payment features. Sellers must also meet Tivorah’s onboarding requirements and Stripe’s account requirements. Eligibility is based on the seller’s business country, not the customer’s location, nationality or payment currency. Check <Link href="/business/payouts">Payouts</Link> to complete your setup.</p>
    <p>Members outside Australia may use supported Hub, listing, enquiry and booking features that do not involve receiving payment through Tivorah. Creating an account or publishing a listing does not grant access to online seller payments. Payment availability in additional countries will be announced separately.</p>
    <h2>Who handles what?</h2>
    <ul>
      <li><strong>The organiser or service provider:</strong> determines their registration obligations, the tax treatment of their offering, and reports and pays taxes they legally owe. Keep registration details current and arrange required invoices and records.</li>
      <li><strong>Tivorah:</strong> handles its own fees and taxes and any collection, reporting or other obligations that the law places on Tivorah. Seller responsibilities do not remove Tivorah’s statutory obligations.</li>
      <li><strong>Stripe:</strong> processes payments and payouts. Identity verification, tax registration, tax calculation and tax-return filing are separate processes.</li>
    </ul>
    <h2>One seller profile for events and services</h2>
    <p>Confirm your legal name, ABN where required, and Australian GST registration in <Link href="/business/payouts#event-tax">Seller tax settings</Link>. These details are shared across your events and services. A suggested name from Stripe still needs your review. Saving this declaration does not register you for GST or verify your registration with the ATO.</p>
    <p>GST-registered organisers must also select each event’s GST treatment. Registration alone does not mean every offering is taxable. Non-registered sellers must not represent an amount as GST charged by them. If you are unsure, check your registration and seek advice before confirming a declaration.</p>
    <h2>Prices, fees and GST</h2>
    <p>Mandatory charges and applicable taxes belong in the total shown to customers. The order summary separates the original ticket or service amount from any customer-paid Tivorah booking fee. A seller-paid fee is deducted from seller proceeds instead.</p>
    <p>Where included ticket GST is shown, it is part of the ticket price, not another amount added to the total. Tivorah’s fee is a separate supply: its GST treatment must not be inferred from the seller’s registration. An unknown tax amount is not the same as zero GST.</p>
    <p>Current Australian ticket GST displays use the organiser’s declaration. Tivorah does not currently provide automatic seller tax-return filing or remittance. Do not assume that a service payment receipt is a tax invoice or that service GST has been calculated unless the document expressly provides the required tax details. Contact the supplier for an appropriate tax invoice where required.</p>
    <h2>Your payouts are not your tax return</h2>
    <p>Bank payouts can combine events and services and include fees, refunds or other adjustments. Keep booking-level records and reconcile them with Stripe. A net bank payout is not necessarily your taxable income, GST turnover or tax payable.</p>
    <h2>Required reporting and privacy</h2>
    <p>Where the Sharing Economy Reporting Regime or another law applies, Tivorah may need to collect and report seller identity and transaction information to the ATO. Reporting does not mean Tivorah pays the seller’s tax. We will explain information we request, its purpose and any effect of not providing required details. See the <Link href="/privacy">Privacy Policy</Link>. Do not send tax file numbers or identity documents through chat.</p>
    <h2>Get the right help</h2>
    <p>This page explains the product and is general information, not personal tax advice. See the <a href="https://www.ato.gov.au/businesses-and-organisations/gst-excise-and-indirect-taxes/gst/registering-for-gst">ATO’s GST registration guidance</a>, the <Link href="/marketplace-partner-agreement">Partner Agreement</Link>, or contact <a href="mailto:support@tivorah.com">support@tivorah.com</a> about your account. A registered tax agent can advise on your own obligations.</p>
    <LegalNavigation />
  </article>;
}
