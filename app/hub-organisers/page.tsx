import { pageMetadata } from "../../lib/site";
import Link from "next/link";
import { LegalNavigation } from "../legal-navigation";

export const metadata = pageMetadata("Hub Organiser Rules", "Rules and legal responsibilities for Tivorah Hub creators, administrators, moderators and event organisers.", "/hub-organisers");

export default function HubOrganisers() {
  return <article className="content">
    <span className="eyebrow">Organisers &amp; Hub admins</span><h1>Lead the community. Do not misuse its trust.</h1>
    <p className="legal-meta"><strong>Last updated:</strong> 7 October 2026</p>
    <div className="legal-alert"><strong>Your responsibility</strong><p>A Tivorah role is not legal authority, employment by Tivorah or approval of an event. Organisers remain responsible for their content, decisions, events, permissions, safety and compliance with applicable law.</p></div>
    <h2>Rules for every organiser</h2>
    <ul><li>Publish clear Hub rules and apply them fairly. Do not discriminate, harass, threaten, exploit or retaliate against members.</li><li>Act promptly on safety reports and escalate serious or repeated risks to Tivorah.</li><li>Do not publish accusations, private disputes or claims about a person that you cannot responsibly substantiate. South Australian defamation law can apply to online publication.</li><li>Do not collect, export or reuse member information outside the purpose for which it was provided. Keep moderator records confidential and access-limited.</li><li>Do not imply that Tivorah sponsors, verifies or guarantees your Hub, event, fundraiser, advice or opportunity unless confirmed in writing.</li><li>Never request passwords, verification codes, unnecessary identity documents or payment-card details.</li></ul>
    <h2>Events and in-person activity</h2>
    <p>Before publishing an event, confirm venue permission, capacity, accessibility, emergency arrangements, cancellation and refund information, and any council, liquor, food, music, fundraising or other permit that applies. Consider public-liability and event insurance appropriate to the activity. Paid events and promotional claims must comply with the Australian Consumer Law.</p>
    <p>If you sell paid tickets or connect Stripe, the <Link href="/marketplace-partner-agreement">Marketplace Partner Agreement</Link> also applies.</p>
    <h2>Event payments: Australia only</h2>
    <p>Receiving customer payments for events through Tivorah is currently available only to organisers whose seller business is established in Australia and who meet Tivorah’s onboarding requirements and Stripe’s account requirements. Members outside Australia may create and participate in supported Hubs, publish event listings and use free-ticket or other non-payment features. This restriction is based on the organiser’s business country, not the attendee’s location. Creating a Hub or publishing an event does not authorise online payment collection.</p>
    <h2>Marketing and invitations</h2>
    <p>Do not scrape member contact details or send unsolicited commercial messages. Australian spam rules generally require consent, accurate sender details and a working unsubscribe facility. Ordinary Hub participation does not automatically grant permission for off-platform marketing.</p>
    <h2>Moderation boundaries</h2>
    <p>Remove or escalate credible threats, scams, sexual exploitation, doxxing and illegal content. Preserve relevant in-app records, but do not download or redistribute suspected child sexual abuse material. For immediate danger call 000. See the <Link href="/child-safety">Child Safety Standards</Link>.</p>
    <h2>Official references</h2>
    <ul><li><a href="https://www.esafety.gov.au/report">eSafety Commissioner reporting</a></li><li><a href="https://www.oaic.gov.au/privacy/australian-privacy-principles">OAIC Australian Privacy Principles</a></li><li><a href="https://www.acma.gov.au/dealing-with-spam">ACMA spam guidance</a></li><li><a href="https://www.legislation.sa.gov.au/lz?path=%2FC%2FA%2FDEFAMATION+ACT+2005">South Australian Defamation Act 2005</a></li></ul>
    <p>This page provides platform rules and general information, not legal advice. Tivorah may restrict or remove organiser privileges, content, events or Hubs where necessary to protect members or enforce its Terms.</p>
    <p>Independent organisers and service providers are responsible for their own seller tax obligations. Tivorah retains its own statutory obligations. Payment processing does not automatically register a seller for GST or file their returns. See <Link href="/seller-tax">Seller taxes and reporting</Link> for shared account settings, fees and reporting information.</p>
      <LegalNavigation />
  </article>;
}
