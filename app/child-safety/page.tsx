import { pageMetadata } from "../../lib/site";
import Link from "next/link";
import { LegalNavigation } from "../legal-navigation";

export const metadata = pageMetadata("Child Safety Standards", "Tivorah’s standards against child sexual abuse and exploitation, including how to report a concern.", "/child-safety");

export default function ChildSafetyStandards() {
  return (
    <article className="content">
      <span className="eyebrow">Safety</span>
      <h1>Child Safety Standards</h1>
      <p className="legal-meta">
        <strong>Last updated:</strong> 16 September 2026
      </p>

      <div className="legal-alert">
        <strong>Immediate danger</strong>
        <p>
          If a child is in immediate danger in Australia, call{" "}
          <a href="tel:000">000</a>. Tivorah is not an emergency service. Do
          not download, save, forward or resend suspected child sexual abuse
          material in order to report it.
        </p>
      </div>

      <p>
        Tivorah is an adults-only service for people aged 18 and over. We have
        zero tolerance for child sexual abuse and exploitation (CSAE), child
        sexual abuse material (CSAM), grooming, sextortion, trafficking or any
        conduct that sexually exploits or endangers a person under 18.
      </p>
      <p>
        These standards apply across Tivorah profiles, Hubs, Banter, posts,
        replies, messages, media, events, listings, links and any other member
        content or interaction. They should be read with our{" "}
        <Link href="/terms">Terms of Use</Link>,{" "}
        <Link href="/community-guidelines">Community Guidelines</Link> and{" "}
        <Link href="/privacy">Privacy Policy</Link>.
      </p>

      <h2>What Tivorah prohibits</h2>
      <p>Members must never use Tivorah to:</p>
      <ul>
        <li>
          create, upload, request, possess, offer, link to, distribute or
          promote CSAM, including computer-generated or manipulated material;
        </li>
        <li>
          groom a child, solicit sexual contact or sexual material from a
          child, or move a conversation off-platform for those purposes;
        </li>
        <li>
          threaten to share intimate material to obtain money, further images,
          contact or another benefit;
        </li>
        <li>
          facilitate the sexual exploitation, abuse or trafficking of a child;
        </li>
        <li>
          sexualise a child or normalise, encourage or instruct others in child
          sexual abuse or exploitation; or
        </li>
        <li>
          evade an age restriction, enforcement action or child-safety review.
        </li>
      </ul>

      <h2>Adults-only access</h2>
      <p>
        A person must be at least 18 to create or keep a Tivorah account.
        Registration asks for a date of birth and an explicit confirmation
        that the person is 18 or older. Tivorah also validates the age
        requirement on its server before an account can use protected app
        features. If we reasonably identify an account as belonging to a person
        under 18, we may restrict or remove it and take other protective action.
        Contact us if you believe a child has created an account.
      </p>

      <h2>Safety measures in the app</h2>
      <p>
        Tivorah uses several layers of protection. Images intended for public
        display are checked by automated safety screening before they become
        visible. Automated systems can make mistakes and cannot identify every
        form of harmful or illegal material, so screening supports—but does not
        replace—member reports and human review.
      </p>
      <p>
        Members can report profiles, Hubs, Banter and thread messages, private
        messages, events, jobs, services and listings from the relevant app
        surface. Report evidence is restricted to authorised review rather than
        published as member content.
      </p>

      <h2>How to report a child-safety concern</h2>
      <ol>
        <li>
          Where available, open the relevant profile, post, message, listing,
          event or Hub, use its options menu and select <strong>Report</strong>.
        </li>
        <li>
          Choose the closest reason and provide enough context to identify the
          account or content. Do not attach or forward suspected CSAM.
        </li>
        <li>
          If in-app reporting is unavailable, email{" "}
          <a href="mailto:support@tivorah.com?subject=Urgent%20child%20safety%20report">
            support@tivorah.com
          </a>{" "}
          with the subject “Urgent child safety report”.
        </li>
      </ol>
      <p>
        Include a username, content link, Hub name or approximate time where
        possible. Never send your password, verification code, unnecessary
        identity documents or copies of illegal material. The reporting member
        may also block the relevant account where that control is available.
      </p>

      <h2>How Tivorah responds</h2>
      <p>
        Child-safety reports are treated as high priority. We may restrict
        access while reviewing a report and may remove content, permanently
        close accounts, prevent repeat access, preserve relevant records and
        refer information to an appropriate authority. We will not notify a
        reported person where doing so could increase risk, compromise evidence
        or conflict with law.
      </p>
      <p>
        Tivorah responds to valid legal requests and handles report information
        under our Privacy Policy. We limit access to people who need it for
        safety, legal or operational purposes. We do not promise a particular
        outcome from every report, but a confirmed breach involving CSAE or
        CSAM is grounds for permanent account closure.
      </p>

      <h2>Reporting to Australian authorities</h2>
      <p>
        Where Tivorah obtains actual knowledge of suspected CSAM or related
        criminal conduct, we take action under applicable law and may report to:
      </p>
      <ul>
        <li>
          the{" "}
          <a href="https://www.accce.gov.au/report">
            Australian Centre to Counter Child Exploitation (ACCCE)
          </a>;
        </li>
        <li>
          the <a href="https://www.esafety.gov.au/report">eSafety Commissioner</a>;
          and
        </li>
        <li>Australian police or another competent authority.</li>
      </ul>

      <h2>Designated child-safety contact</h2>
      <p>
        Tivorah&apos;s designated public channel for CSAE and CSAM concerns is
        managed by Tivorah&apos;s responsible child-safety contact at{" "}
        <a href="mailto:support@tivorah.com?subject=Child%20safety">
          <strong>support@tivorah.com</strong>
        </a>
        . Google Play, law enforcement, regulators and safety organisations may
        use this channel for child-safety notifications and enquiries.
      </p>

      <h2>Review of these standards</h2>
      <p>
        We review these standards at least annually and after a material change
        to Tivorah&apos;s safety features or applicable requirements. Our broader{" "}
        <Link href="/safety">Safety Centre</Link> explains reporting, blocking,
        appeals and external support.
      </p>

      <LegalNavigation />
    </article>
  );
}
