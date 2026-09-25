import { pageMetadata } from "../../lib/site";
import { LegalNavigation } from "../legal-navigation";

export const metadata = pageMetadata("Important Disclaimer", "Important limits on information and member activity on Tivorah.", "/disclaimer");

export default function Disclaimer() {
  return (
    <article className="content">
      <span className="eyebrow">Important information</span>
      <h1>Community knowledge is not professional advice.</h1>
      <p className="legal-meta"><strong>Last updated:</strong> 15 September 2026</p>
      <p>
        Tivorah helps people share experiences, opportunities and local information. Unless we
        expressly say otherwise, member content is created by independent users and is not
        verified, endorsed or adopted by Tivorah.
      </p>

      <h2>Migration, legal, financial and health information</h2>
      <p>
        A member&apos;s experience is not migration assistance, legal advice, financial advice,
        medical advice or government guidance. Rules and personal circumstances change. Check
        official Australian Government information and use an appropriately registered or
        qualified professional before acting on information that could affect your visa,
        employment, finances, health or legal rights. Tivorah is not affiliated with or endorsed
        by the Australian Government.
      </p>

      <h2>Jobs and services</h2>
      <p>
        A profile, Hub membership, badge or account status is not a background, identity,
        licence, qualification, right-to-work or employer check unless the screen clearly states
        exactly what Tivorah verified. Confirm registrations, pay, conditions, insurance and
        legal requirements independently. Never pay an unexpected fee to obtain a job.
      </p>

      <h2>Listings, events and people</h2>
      <p>
        Tivorah does not guarantee a member, organiser, listing, item, service, venue or event.
        Inspect items, use traceable payments, meet safely, tell someone your plans and follow
        venue and public-safety instructions. Rights that cannot be excluded under the Australian
        Consumer Law remain unaffected.
      </p>

      <h2>Emergencies</h2>
      <p>
        Do not rely on Tivorah for emergency communications. In Australia, call <a href="tel:000">000</a>
        for immediate danger or a life-threatening emergency.
      </p>
      <LegalNavigation />
    </article>
  );
}
