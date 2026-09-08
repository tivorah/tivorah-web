import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Community Guidelines",
  description: "The conduct and safety standards for Tivorah communities.",
};

export default function Guidelines() {
  return (
    <article className="content">
      <span className="eyebrow">Safety</span>
      <h1>Community Guidelines</h1>
      <p className="legal-meta">
        <strong>Last updated:</strong> 8 September 2026
      </p>

      <p>
        Tivorah is for genuine connection, useful participation and communities
        people can trust. These Guidelines apply to profiles, Hubs, Banter,
        messages, media, events, marketplace activity, services, jobs and every
        other part of Tivorah.
      </p>

      <h2>Treat people with dignity</h2>
      <p>
        Harassment, bullying, threats, stalking, intimidation, unwanted sexual
        conduct, doxxing and targeted abuse are prohibited. Hate or
        dehumanising content directed at people because of protected or
        vulnerable characteristics is not allowed. Disagreement is permitted;
        abuse is not.
      </p>

      <h2>Protect privacy and consent</h2>
      <p>
        Do not share another person&apos;s private messages, contact details,
        precise location, identity documents, intimate material or other private
        information without an appropriate lawful basis and permission. Do not
        record or publish people from a private gathering without consent.
        Never share non-consensual intimate content or sexual content involving
        a person under 18.
      </p>

      <h2>Be authentic</h2>
      <p>
        Do not impersonate people or organisations, create deceptive identities,
        coordinate fake engagement, misrepresent qualifications or affiliation,
        or use Tivorah to scam, defraud or manipulate others. Clearly disclose
        relevant commercial relationships and conflicts of interest.
      </p>

      <h2>Keep trade and opportunities honest</h2>
      <p>
        Listings, services, events and jobs must be accurate, lawful and
        genuinely available. Prohibited activity includes stolen, counterfeit,
        recalled or illegal goods; deceptive pricing; advance-fee and payment
        scams; unlawful discrimination; exploitative work; and services that
        require a licence or qualification the provider does not hold. A shared
        Hub is context, not a guarantee—members should still verify important
        claims and use safe meeting and payment practices.
      </p>

      <h2>Do not promote harm or exploitation</h2>
      <p>
        Content or conduct that facilitates violence, sexual exploitation,
        trafficking, self-harm encouragement, dangerous criminal activity,
        extremist violence or the exploitation of vulnerable people is
        prohibited. Credible imminent threats may be referred to emergency
        services or law enforcement.
      </p>

      <h2>Respect each Hub</h2>
      <p>
        Follow the published rules and purpose of every Hub you join. Hub rules
        may be more specific than these Guidelines but cannot permit conduct
        that violates Tivorah policy or law. Creators and moderators must apply
        rules in good faith and must not misuse member information, approvals,
        removals or moderation tools.
      </p>

      <h2>No spam or platform abuse</h2>
      <p>
        Do not send repetitive unsolicited promotions, scrape member data,
        automate activity without permission, evade enforcement, manipulate
        reports, distribute malware, probe security without authorisation or
        interfere with the operation of Tivorah.
      </p>

      <h2>Reporting, blocking and emergencies</h2>
      <p>
        Use the in-app report tools for content or conduct that may breach these
        Guidelines. Blocking can stop direct interaction but does not replace a
        report where someone may be at risk. Reports should be truthful and
        include enough context for review. Do not use Tivorah for emergency
        help; contact the appropriate Australian emergency service directly.
      </p>

      <h2>How enforcement works</h2>
      <p>
        Hub moderators and Tivorah may review relevant content, account history
        and report context. Depending on severity, risk and recurrence, action
        may include a warning, reduced visibility, content removal, loss of Hub
        membership or privileges, feature restrictions, transaction or event
        intervention, temporary suspension, account closure, evidence
        preservation or referral to authorities.
      </p>
      <p>
        Not every report results in the outcome requested. Where appropriate
        and lawful, a person affected by a Tivorah enforcement decision will
        receive notice and an appeal path. Immediate action may be taken to
        protect people, evidence or the service.
      </p>

      <h2>Contact</h2>
      <p>
        For a non-urgent safety or policy question, contact{" "}
        <a href="mailto:support@tivorah.com">
          <strong>support@tivorah.com</strong>
        </a>
        . Include links or screenshots where safe, but do not forward passwords,
        verification codes or unnecessary private information.
      </p>
    </article>
  );
}
