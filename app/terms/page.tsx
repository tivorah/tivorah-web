import { pageMetadata } from "../../lib/site";
import Link from "next/link";
import { LegalNavigation } from "../legal-navigation";

export const metadata = pageMetadata("Terms of Use", "The terms that apply when using Tivorah.", "/terms");

export default function Terms() {
  return (
    <article className="content">
      <span className="eyebrow">Legal</span>
      <h1>Terms of Use</h1>
      <p className="legal-meta">
        <strong>Last updated:</strong> 26 September 2026
      </p>

      <div className="legal-callout">
        <strong>Important</strong>
        <p>
          Tivorah provides the platform. Members generally provide their own
          posts, advice, listings, services, jobs and events. A profile, badge
          or Hub membership is not a background, identity or qualification
          check unless a screen clearly states exactly what Tivorah verified.
        </p>
      </div>

      <p>
        These Terms of Use govern your access to the Tivorah mobile application,
        website and related services. By creating an account or using Tivorah,
        you agree to these Terms, our Privacy Policy, Community Guidelines and
        the rules of each Hub you join. If you do not agree, do not use Tivorah.
      </p>

      <h2>Eligibility and accounts</h2>
      <p>
        You must be at least 18 years old and legally able to enter this
        agreement. You must provide accurate account information, keep your
        credentials secure and promptly tell us about suspected unauthorised
        use. You are responsible for activity through your account unless it
        results from a failure for which Tivorah is legally responsible.
      </p>
      <p>
        We may use proportionate age-assurance measures, request an age
        declaration, restrict an account or require further review where we
        reasonably believe the eligibility requirement is not met. Attempts to
        circumvent an age or account restriction are prohibited. A mistaken
        restriction may be appealed through our support channel.
      </p>
      <p>
        You may not impersonate another person, create an account for someone
        without authority, evade a suspension, sell or transfer your account, or
        use automated account creation. One person should use one genuine member
        identity unless Tivorah expressly permits another account type.
      </p>

      <h2>What Tivorah provides</h2>
      <p>
        Tivorah provides tools for community discovery, Hubs, Banter, messaging,
        media, events and ticketing, local listings and services, jobs and
        applications,
        notifications and related interactions. Features may vary by device,
        location, account, rollout stage or feature availability. We may improve,
        add, limit or retire features, while giving reasonable notice where a
        change materially affects users and notice is practicable.
      </p>

      <h2>Hubs and community responsibility</h2>
      <p>
        A Hub is a member-created or Tivorah-created community with its own
        purpose, audience, rules and moderators. Hub rules supplement these
        Terms but cannot authorise unlawful conduct or override Tivorah policy.
        Private or approval-based membership limits access; it does not
        guarantee confidentiality, suitability or safety.
      </p>
      <p>
        Hub creators and moderators must apply rules responsibly, avoid
        misleading claims about Tivorah endorsement, protect member information
        available to them and use moderation powers only for legitimate
        community purposes. Tivorah may intervene where needed to enforce these
        Terms, protect people or comply with law.
      </p>
      <p>
        If you create, administer or moderate a Hub or publish an event, the{" "}
        <Link href="/hub-organisers">Hub Organiser Rules</Link> form part of
        these Terms and apply in addition to the rules above.
      </p>

      <h2>Your content and permissions</h2>
      <p>
        You retain ownership of content you create. You give Tivorah a
        non-exclusive, worldwide, royalty-free licence to host, store, reproduce,
        format, transmit, display and otherwise use that content only as needed
        to operate, secure, moderate, improve and promote the Tivorah service in
        accordance with your settings and our Privacy Policy. This licence ends
        when the content is deleted from our active systems, except where copies
        reasonably remain in backups, reports, shared conversations or records
        we are required or permitted to retain.
      </p>

      <h2>Messaging and encryption</h2>
      <p>
        Only an eligible personal one-to-one chat that Tivorah expressly marks
        as end-to-end encrypted has that protection. Banter, posts, threads,
        Hub messages, announcements, group conversations and conversations
        associated with listings, marketplace items, services, events, tickets,
        jobs or other transactions are not end-to-end encrypted and may be
        stored, processed and reviewed as described in our Privacy Policy.
        Private membership, an audience restriction or the word
        &quot;private&quot; does not by itself mean that content is end-to-end
        encrypted.
      </p>
      <p>
        End-to-end encryption does not prevent another participant from saving,
        copying, forwarding, photographing or reporting a message. A participant
        who reports an encrypted conversation may choose to provide readable
        copies of selected messages to Tivorah Safety. You must not attempt to
        bypass encryption notices, compromise another device or misuse Tivorah
        to conceal unlawful conduct. We may restrict messaging where device
        keys, membership, security checks or required service data are not ready.
      </p>
      <p>
        You must have the rights and permissions needed to upload your content.
        You are accountable for its accuracy and legality and for ensuring it
        does not infringe privacy, confidentiality, intellectual-property or
        other rights. Do not upload another person&apos;s image, private
        information or work without an appropriate basis or permission.
      </p>

      <h2>Marketplace and services</h2>
      <p>
        Members may list, discover and discuss items or services. Unless a
        listing expressly says Tivorah is the seller, the buyer and seller or
        service provider deal with each other and are responsible for the
        description, condition, legality, qualifications, price, taxes,
        delivery, pickup, performance, cancellation and resolution of their
        transaction. A shared Hub or profile provides context but is not a
        guarantee, background check or endorsement.
      </p>
      <p>
        Tivorah is not normally the seller, employer, event organiser or service
        provider and does not take responsibility for an independent member&apos;s
        legal obligations. This does not limit any responsibility Tivorah itself
        has for the platform service or a product Tivorah directly supplies.
      </p>
      <p>
        Listings must be accurate and must not involve illegal, stolen,
        dangerous, recalled, counterfeit or prohibited items or services. Use
        safe meeting and payment practices, verify claims that matter and report
        suspected scams. Rights and remedies that apply under the Australian
        Consumer Law or other law continue to apply between the relevant
        parties.
      </p>
      <p>
        If you advertise or provide a service through Tivorah, the{" "}
        <Link href="/service-providers">Service Provider Listing Rules</Link>{" "}
        form part of these Terms and apply to each listing and enquiry.
      </p>

      <h2>In-app marketplace payments and payouts</h2>
      <p>
        Where Tivorah enables an in-app payment for an item, service or event,
        the seller, provider or organiser is the supplier and seller of that
        underlying offering unless the checkout expressly identifies Tivorah as
        the supplier. Tivorah provides booking, ticketing and payment-facilitation
        tools. Stripe processes payments and onboards payout recipients through
        Stripe Connect Express.
      </p>
      <p>
        Tivorah may charge different percentage or fixed platform fees for
        items, services and events. A fee may be added to the customer total or
        deducted from provider proceeds, as disclosed for the transaction.
        Completed orders retain the fee configuration that applied when the
        order was created. Stripe processing, dispute or payout fees may also
        apply under Stripe&apos;s terms.
      </p>
      <p>
        A person who connects Stripe or uses Tivorah&apos;s paid transaction tools
        also agrees to the <Link href="/marketplace-partner-agreement">Marketplace
        Partner Agreement</Link>. That agreement explains payout timing,
        refunds, chargebacks, customer-data restrictions, taxes and the
        responsibilities of organisers, providers and sellers.
      </p>

      <h2>Events, tickets and payments</h2>
      <p>
        Event organisers are responsible for event descriptions, accessibility,
        permissions, safety, delivery, cancellations and compliance with law.
        Attendees must follow venue, organiser and lawful safety requirements.
        Tivorah may provide booking, QR check-in and payment tools but does not
        control every event.
      </p>
      <p>
        Organisers can see an attendee list and check-in status for their own
        events, as described in our <Link href="/privacy">Privacy Policy</Link>, and may use it
        only to run and support that event. An organiser can publish an event,
        move it back to draft, cancel it or delete it. An event that people
        already hold tickets for cannot be moved to draft or deleted; it must be
        cancelled, which notifies ticket holders and starts any refunds that
        apply.
      </p>
      <p>
        Where paid tickets are enabled, the total customer price, any customer-paid Tivorah fee,
        organiser terms and material cancellation information are shown before
        payment. Payments are processed by Stripe and net funds may be directed
        to an organiser&apos;s connected account. Tivorah does not store full card
        numbers. A purchase completed through an external link is governed by
        the organiser or external provider&apos;s checkout terms, privacy practices,
        fees and refund process. Rights that cannot be excluded under Australian
        law continue to apply.
      </p>
      <p>
        The organiser is responsible for supplying the event and providing
        refunds required by its policy or applicable law. Tivorah may facilitate
        a refund through Stripe and may reverse connected-account transfers and
        platform fees where configured or legally required. An organiser&apos;s
        “no refund” statement cannot remove rights that apply under the
        Australian Consumer Law. Contact the organiser first and contact Tivorah
        support if an in-app payment or platform process did not work as described.
      </p>

      <h2>Jobs and opportunities</h2>
      <p>
        Members may publish job and opportunity posts and, where enabled,
        receive responses through an external HTTPS application link, a
        contextual Tivorah direct message, a native application or a combination.
        Posters are responsible for lawful,
        accurate and non-discriminatory opportunities and for the security and
        privacy practices of any external application service they select.
        Members should review the external provider&apos;s terms and privacy policy
        before submitting information outside Tivorah.
      </p>
      <p>
        Unless Tivorah expressly identifies itself as the recruiter or employer,
        Tivorah provides communication and application tools only. It does not
        guarantee a role, poster, applicant, qualification, right to work or
        employment outcome. Never pay an unexpected fee to obtain a job and
        independently verify claims that affect your safety, visa or finances.
      </p>

      <h2>Information is not professional advice</h2>
      <p>
        Member posts and discussions are not migration assistance, legal,
        medical or financial advice, and are not official government guidance.
        Tivorah is not affiliated with or endorsed by the Australian Government.
        Check authoritative sources and consult an appropriately registered or
        qualified professional before acting on information that could materially
        affect your rights, health, visa, employment or finances. See our
        <Link href="/disclaimer"> Important Disclaimer</Link>.
      </p>

      <h2>Acceptable use</h2>
      <p>You must not use Tivorah to:</p>
      <ul>
        <li>
          harass, threaten, exploit, stalk, discriminate against or endanger
          another person;
        </li>
        <li>
          post hate, sexual exploitation, non-consensual intimate material,
          scams, impersonation, deceptive listings or unlawful content;
        </li>
        <li>
          sell prohibited goods, facilitate crime or encourage unsafe or
          fraudulent transactions;
        </li>
        <li>
          scrape, harvest, spam, manipulate engagement, reverse engineer,
          interfere with security or access systems without authorisation;
        </li>
        <li>
          misuse reports, moderation, invitations, payment disputes or personal
          information; or
        </li>
        <li>
          use Tivorah in a way that infringes rights, breaches law or materially
          disrupts other users or the service.
        </li>
      </ul>

      <h2>Moderation and enforcement</h2>
      <p>
        Members can report content and block users. Hub moderators and Tivorah
        may review reports and, where appropriate, limit distribution, remove
        content, cancel access to a Hub, restrict a feature, preserve evidence,
        suspend or close an account, or refer a matter to authorities. We
        consider the context, severity, risk and available evidence, but cannot
        guarantee that every report will lead to the outcome requested.
      </p>
      <p>
        Anyone, including a person without an account, may submit an external
        safety report using the process in our <Link href="/safety">Safety Centre</Link>.
        Knowingly false, retaliatory or manipulative reports may themselves lead
        to action, but a good-faith report will not be penalised merely because
        Tivorah reaches a different conclusion.
      </p>
      <p>
        Where appropriate and lawful, we will provide notice and an opportunity
        to appeal an eligible decision. Immediate action may be taken where
        reasonably necessary to protect people, evidence or the service.
      </p>

      <h2>Tivorah intellectual property</h2>
      <p>
        Tivorah and its licensors own the application, website, software,
        branding, design and content we provide, excluding user content. We give
        you a personal, limited, revocable, non-exclusive and non-transferable
        right to use the service in accordance with these Terms. No other rights
        are granted.
      </p>

      <h2>Third-party services and links</h2>
      <p>
        Tivorah may link to or integrate with app stores, maps, websites,
        payment providers and other third-party services. Their terms and
        privacy practices apply to their services. Tivorah is not responsible
        for independent third-party content or conduct, subject to any
        responsibility that cannot lawfully be excluded.
      </p>

      <h2>Availability and safety</h2>
      <p>
        We work to keep Tivorah useful and available, but internet and mobile
        services can experience interruptions, delay, data loss or errors. Do
        not rely on Tivorah for emergency communications. In an emergency,
        contact the appropriate Australian emergency service directly.
      </p>

      <h2>Consumer guarantees and liability</h2>
      <p>
        Nothing in these Terms excludes, restricts or modifies a consumer
        guarantee, right or remedy that cannot lawfully be excluded, including
        under the Australian Consumer Law. Subject to those non-excludable
        rights, Tivorah is provided on an &quot;as available&quot; basis and we
        do not promise that all content, members, listings, events, jobs or
        outcomes will be accurate, suitable, available or free from risk.
      </p>
      <p>
        To the extent permitted by law, Tivorah is not liable for indirect or
        consequential loss, or for loss caused by independent users,
        organisers, employers, sellers, buyers, providers or third-party
        services. Any limitation will apply only to the extent it is fair and
        lawful in the circumstances. Where the law permits us to limit a remedy
        for a service failure, we may elect to resupply the service or pay the
        reasonable cost of resupply.
      </p>

      <h2>Suspension, deletion and ending use</h2>
      <p>
        You may stop using Tivorah and request account deletion at any time.
        Deletion consequences are explained in our Privacy Policy and
        account-deletion page. Tivorah may suspend or end access where these
        Terms are breached, continued access creates material risk, or we are
        legally required to act. Provisions that by nature need to continue,
        including ownership, retained records, disputes and lawful limitations,
        survive account closure.
      </p>

      <h2>Changes to these Terms</h2>
      <p>
        We may update these Terms for product, safety, operational or legal
        reasons. We will publish the updated date and give reasonable additional
        notice of material changes where required. If you do not agree to a
        material change, you may stop using Tivorah and delete your account.
      </p>

      <h2>Complaints and disputes</h2>
      <p>
        Please contact us first so we can try to resolve a concern promptly.
        Nothing in these Terms prevents either party from seeking urgent court
        relief or using a regulator, tribunal or dispute process available by
        law. We do not require confidential arbitration or prevent a person from
        participating in a lawful class action.
      </p>

      <h2>Governing law and contact</h2>
      <p>
        These Terms are between you and TIVORAH PTY LTD (ABN 94 702 094 844),
        based in Adelaide, South Australia. They are governed by the laws of South Australia and applicable
        Commonwealth laws. Courts with jurisdiction may hear disputes, subject
        to any rights you have to bring a claim elsewhere under applicable
        consumer law.
      </p>
      <p>
        Questions about these Terms can be sent to{" "}
        <a href="mailto:support@tivorah.com">
          <strong>support@tivorah.com</strong>
        </a>
        . Privacy requests should be sent to{" "}
        <a href="mailto:privacy@tivorah.com">
          <strong>privacy@tivorah.com</strong>
        </a>
        .
      </p>
      <LegalNavigation />
    </article>
  );
}
