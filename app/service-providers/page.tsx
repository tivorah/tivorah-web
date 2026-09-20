import type { Metadata } from "next";
import Link from "next/link";
import { LegalNavigation } from "../legal-navigation";

export const metadata: Metadata = { title: "Service Provider Listing Rules", description: "Rules and legal responsibilities for businesses and service providers listing on Tivorah." };

export default function ServiceProviders() {
  return <article className="content">
    <span className="eyebrow">Service providers</span><h1>List honestly. Deliver professionally.</h1>
    <p className="legal-meta"><strong>Last updated:</strong> 19 September 2026</p>
    <div className="legal-alert"><strong>Tivorah is a platform</strong><p>A listing is not a Tivorah endorsement, licence check, employment relationship or guarantee. The provider—not Tivorah—is responsible for the advertised service, legal compliance, customer agreement, work and remedies.</p></div>
    <h2>Before listing</h2>
    <ul><li>Use your genuine identity or registered business identity and current contact information.</li><li>Hold every registration, qualification, occupational licence, permit and insurance required for the service and location.</li><li>Describe the service, availability, service area, exclusions and total pricing clearly. Identify whether prices include GST where relevant.</li><li>Use only photos, trademarks and text you own or are authorised to publish.</li><li>Do not list illegal, unsafe, exploitative, discriminatory, deceptive or prohibited services.</li></ul>
    <h2>Australian Consumer Law</h2>
    <p>Claims must be truthful, accurate and supported by reasonable grounds. Providers must not mislead people about price, qualifications, experience, availability, results, reviews or consumer rights. Consumer guarantees may require services to be supplied with due care and skill, fit for an agreed purpose and within a reasonable time. Providers cannot remove statutory rights with a “no refunds” statement or private terms.</p>
    <h2>South Australian licences and insurance</h2>
    <p>Some work—including building, plumbing, electrical, gas fitting, property, security and labour hire—requires a current licence. Providers should check their obligations and members can verify relevant licences using the <a href="https://www.cbs.sa.gov.au/find-a-licence-holder">Consumer and Business Services register</a>. Appropriate business, professional, public-liability, workers compensation or vehicle insurance may also be required or prudent.</p>
    <h2>Bookings, communication and privacy</h2>
    <ul><li>Confirm scope, price, timing, cancellation terms and material changes before beginning work.</li><li>Do not pressure members to move off-platform or pay through an unsafe method.</li><li>Use customer details only to answer the enquiry or provide the agreed service unless separate marketing consent exists.</li><li>Commercial email and SMS generally require consent, sender identification and a functional unsubscribe.</li><li>Keep invoices, agreements, licences and evidence supporting advertised claims.</li></ul>
    <p>If you activate paid bookings or connect Stripe, the <Link href="/marketplace-partner-agreement">Marketplace Partner Agreement</Link> also applies.</p>
    <h2>Official references</h2>
    <ul><li><a href="https://www.accc.gov.au/consumers/buying-products-and-services/consumer-rights-and-guarantees">ACCC consumer rights and guarantees</a></li><li><a href="https://www.accc.gov.au/business/advertising-and-promotions/false-or-misleading-claims">ACCC misleading claims guidance</a></li><li><a href="https://www.cbs.sa.gov.au/find-a-licence-holder">South Australian licence register</a></li><li><a href="https://business.sa.gov.au/information/starting-my-business/business-registration">Business SA registration and insurance guidance</a></li></ul>
    <p>This page is general information and platform policy, not legal or tax advice. Tivorah may request evidence, hide a listing, suspend provider access or refer serious conduct to an appropriate authority. See the <Link href="/terms">Terms of Use</Link> and <Link href="/community-guidelines">Community Guidelines</Link>.</p>
    <LegalNavigation />
  </article>;
}
