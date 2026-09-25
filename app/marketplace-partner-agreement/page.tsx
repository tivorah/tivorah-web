import { pageMetadata } from "../../lib/site";
import Link from "next/link";
import { LegalNavigation } from "../legal-navigation";

export const metadata = pageMetadata("Marketplace Partner Agreement", "Payment, payout and customer obligations for Tivorah organisers, providers and sellers.", "/marketplace-partner-agreement");

export default function MarketplacePartnerAgreement() {
  return <article className="content">
    <span className="eyebrow">Organisers, providers &amp; sellers</span>
    <h1>Marketplace Partner Agreement</h1>
    <p className="legal-meta"><strong>Version 1.0 · Effective:</strong> 19 September 2026</p>
    <div className="legal-callout"><strong>The short version</strong><p>When you accept an in-app payment for your item, service or event, you supply it directly to the customer. Tivorah provides listing, booking, ticketing and payment-facilitation tools and charges the platform fee disclosed at checkout. Stripe Connect Express processes payments and payouts.</p></div>

    <p>This Marketplace Partner Agreement is between TIVORAH PTY LTD (ABN 94 702 094 844) and each organiser, service provider or seller using Tivorah&apos;s paid transaction features (a <strong>Partner</strong>). It forms part of the <Link href="/terms">Terms of Use</Link>. For a paid transaction, this Agreement prevails over inconsistent general wording in the Terms.</p>

    <h2>1. Acceptance and authority</h2>
    <p>You accept this Agreement when you connect Stripe Connect Express, activate an in-app paid feature, or submit a paid event, service or item for sale. If you act for a business, association or other entity, you confirm you have authority to bind it. You must be at least 18 and legally able to enter this Agreement.</p>

    <h2>2. Our role and your role</h2>
    <p>Tivorah provides technology for discovery, listings, bookings, digital tickets, QR validation, communications and payment facilitation. Unless a checkout expressly identifies Tivorah as the supplier, the Partner is the seller and supplier of the item, service or event and the customer&apos;s contract for that supply is with the Partner.</p>
    <p>Tivorah configures supported Stripe Connect payments to identify the connected Partner as the settlement merchant using Stripe&apos;s <code>on_behalf_of</code> functionality. This does not transfer every platform, refund, dispute, tax or regulatory obligation to Stripe, and Stripe may still debit Tivorah or a connected account under its rules. Nothing creates employment, partnership, franchise, fiduciary duty or agency between Tivorah and the Partner.</p>

    <h2>3. Stripe onboarding and payouts</h2>
    <ul><li>You must complete and maintain Stripe Connect Express onboarding and give Stripe accurate identity, ownership, business, tax and bank information.</li><li>Stripe performs its own verification and may delay, restrict or stop charges or payouts. Tivorah may disable paid features when required information, capabilities or risk checks are incomplete.</li><li>Stripe directs the applicable net amount to your connected balance and pays it to your nominated bank account under the payout schedule and any reserve, delay or restriction shown by Stripe or Tivorah.</li><li>Tivorah does not receive your full card number or online-banking credentials. Manage bank details and verification through Stripe.</li></ul>

    <h2>4. Prices and platform fees</h2>
    <p>You set the underlying listing price. Tivorah may set different percentage and fixed platform fees for items, services and events and may configure the fee to be paid by the customer or deducted from Partner proceeds. The applicable fee, payer and total must be shown before the customer confirms payment. Each completed checkout keeps its original fee snapshot even if Tivorah later changes pricing.</p>
    <p>Stripe processing, dispute, currency-conversion or payout fees may also apply under Stripe&apos;s terms. Where practicable, Tivorah will give reasonable advance notice of a material pricing change affecting future transactions. A new fee does not retrospectively change a completed order.</p>

    <h2>5. Partner obligations</h2>
    <ul><li>Describe price, availability, condition, inclusions, exclusions, location, dates, accessibility and material risks accurately.</li><li>Hold every licence, permit, registration, qualification, venue approval and insurance required for your supply.</li><li>Deliver each valid paid booking or ticket and do not oversell, substitute or materially change it without lawful notice and remedies.</li><li>Comply with the Australian Consumer Law, tax law, safety, privacy, anti-discrimination, intellectual-property and industry-specific requirements.</li><li>Do not use paid features for illegal, unsafe, deceptive, counterfeit, stolen, sanctioned or prohibited activity.</li><li>Keep evidence of fulfilment, attendance, delivery, communications, policies and refunds for disputes and legal compliance.</li></ul>

    <h2>6. Cancellations, refunds and chargebacks</h2>
    <p>You must publish and honour a clear cancellation and refund policy that does not exclude non-excludable rights. If you cancel, fail to supply, or materially change an event or service, you must promptly notify affected customers and provide every refund or other remedy required by law.</p>
    <p>You authorise Tivorah to facilitate refunds through Stripe where you request them or where Tivorah reasonably considers a refund necessary to comply with law, protect a customer, remedy non-supply or manage platform risk. Refunds may reverse transfers and platform fees where configured or legally required. You remain responsible for liabilities arising from your supply, including refunds, chargebacks, dispute fees and negative balances, to the extent permitted by law.</p>
    <p>You authorise Tivorah and Stripe to use and share relevant listing, booking, ticket, check-in, communication, refund and fulfilment records to prevent fraud and respond to a payment dispute. Excessive disputes, unresolved refunds or suspected fraud may result in delayed payouts, listing removal or suspension.</p>

    <h2>7. Customer and attendee information</h2>
    <p>Use customer information only to provide, support, verify or refund the relevant transaction unless the person gives separate valid marketing consent. Keep it secure, limit staff access, do not scrape or sell it, delete it when no longer lawfully needed, and notify Tivorah promptly of a suspected breach. A ticket QR or booking credential must not be copied, published or used for tracking unrelated activity.</p>

    <h2>8. Tax and records</h2>
    <p>You are responsible for determining and meeting your GST, income-tax, invoicing and other tax obligations. Tivorah may collect, retain and report identity and transaction information where required under the Sharing Economy Reporting Regime or another law. Amounts shown in Tivorah or Stripe are not tax advice.</p>

    <h2>9. Suspension and risk controls</h2>
    <p>Tivorah may restrict a listing, payment, payout or Partner account where reasonably necessary for safety, fraud prevention, sanctions compliance, an investigation, a Stripe restriction, excessive disputes, breach of this Agreement or legal compliance. Where lawful and practical, Tivorah will explain the action and provide a review path. Existing customer obligations survive suspension.</p>

    <h2>10. Indemnity and liability</h2>
    <p>To the extent permitted by law, you indemnify Tivorah against losses, claims and reasonable costs arising from your item, service or event; your breach of law or this Agreement; injury, property damage or non-supply; required refunds or chargebacks; infringement by your content; or your misuse of customer information. This does not apply to the extent a loss was caused by Tivorah&apos;s negligence, unlawful conduct or breach.</p>
    <p>Nothing excludes a guarantee, right or remedy that cannot lawfully be excluded. Subject to those rights, Tivorah is not liable for indirect or consequential loss caused by an independent Partner or third-party service. Any lawful aggregate liability of Tivorah to a Partner relating to paid marketplace facilitation is limited to the greater of the platform fees paid by that Partner during the preceding 12 months and A$100.</p>

    <h2>11. Changes, termination and contact</h2>
    <p>Tivorah may update this Agreement for product, risk, legal or operational reasons and will give reasonable notice of material changes where required. You may stop offering new paid transactions before a change takes effect, but existing customer, refund, tax, privacy and dispute obligations continue.</p>
    <p>This Agreement is governed by South Australian and applicable Commonwealth law. Questions can be sent to <a href="mailto:support@tivorah.com">support@tivorah.com</a>.</p>
    <LegalNavigation />
  </article>;
}
