import { pageMetadata } from "../../lib/site";
import Link from "next/link";
import { LegalNavigation } from "../legal-navigation";

export const metadata = pageMetadata("Safety Centre", "Report harm, block an account and find urgent safety support on Tivorah.", "/safety");

export default function SafetyCentre() {
  return (
    <article className="content">
      <span className="eyebrow">Safety centre</span>
      <h1>Help when something goes wrong.</h1>
      <p className="legal-meta"><strong>Last updated:</strong> 15 September 2026</p>

      <div className="legal-alert">
        <strong>Immediate danger</strong>
        <p>
          Tivorah is not an emergency service. In Australia, call <a href="tel:000">000</a>
          for immediate danger or a life-threatening emergency. If it is unsafe to speak,
          follow the operator&apos;s instructions. For urgent mental-health support, contact
          Lifeline on <a href="tel:131114">13 11 14</a>.
        </p>
      </div>

      <h2>Report something in Tivorah</h2>
      <ol>
        <li>Open the profile, post, Banter, message, listing, event or Hub concerned.</li>
        <li>Open its overflow menu and select <strong>Report</strong>.</li>
        <li>Choose the closest reason and add useful context without including unrelated private information.</li>
        <li>Submit the report. Preserve evidence outside Tivorah if you may need to contact police or another authority.</li>
      </ol>
      <p>
        If you cannot access the item or do not have an account, email <a href="mailto:support@tivorah.com?subject=Safety%20report"><strong>support@tivorah.com</strong></a> with
        the subject “Safety report”. Include the relevant username, link or approximate time.
        Do not send passwords, verification codes, identity documents or intimate images.
      </p>

      <h2>What to report</h2>
      <ul>
        <li>credible threats, stalking, harassment, hate or targeted abuse;</li>
        <li>child sexual exploitation, grooming or any sexual content involving a person under 18;</li>
        <li>non-consensual intimate images, sexual extortion or image-based abuse;</li>
        <li>terrorism, extreme violence, trafficking, exploitation or encouragement of self-harm;</li>
        <li>scams, impersonation, fraudulent jobs, migration scams or unsafe transactions; and</li>
        <li>illegal or restricted goods, services or content.</li>
      </ul>

      <h2>Block and protect your information</h2>
      <p>
        Blocking limits direct interaction, but it does not replace reporting where another
        person may be at risk. Do not share verification codes, banking credentials, identity
        documents or your precise home address. Tivorah staff will never ask for your password
        or one-time verification code.
      </p>

      <h2>What happens after a report</h2>
      <p>
        Tivorah triages reports according to urgency and potential harm. We aim to acknowledge
        ordinary email reports within two business days; urgent reports are prioritised. A
        review may result in no action, a warning, reduced distribution, content removal,
        feature restriction, suspension, account closure, evidence preservation or referral
        to an appropriate authority. Privacy and safety may prevent us from sharing every detail.
      </p>

      <h2>Appeal a Tivorah decision</h2>
      <p>
        If a Tivorah notice says a decision is eligible for appeal, reply through the stated
        channel or email <a href="mailto:support@tivorah.com?subject=Moderation%20appeal">support@tivorah.com</a>.
        Identify the decision and explain what context or mistake should be reconsidered. A
        person not involved in the original decision should review the appeal where practicable.
      </p>

      <h2>External help in Australia</h2>
      <ul>
        <li><a href="https://www.esafety.gov.au/report">eSafety Commissioner</a> for eligible online abuse or illegal and restricted content.</li>
        <li><a href="https://www.scamwatch.gov.au/report-a-scam">Scamwatch</a> for scams.</li>
        <li><a href="https://www.police.sa.gov.au/your-safety/scams-and-cybercrime">Police assistance</a> where a crime or immediate risk may be involved.</li>
      </ul>

      <p>
        Our <Link href="/community-guidelines">Community Guidelines</Link> explain the
        standards we enforce. Our dedicated <Link href="/child-safety">Child Safety
        Standards</Link> explain Tivorah&apos;s response to child sexual abuse and exploitation.
      </p>
      <LegalNavigation />
    </article>
  );
}
