import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "How Tivorah collects, uses and protects personal information.",
};

export default function Privacy() {
  return (
    <article className="content">
      <span className="eyebrow">Legal</span>
      <h1>Privacy Policy</h1>
      <p className="legal-meta">
        <strong>Last updated:</strong> 8 September 2026
      </p>

      <p>
        This Privacy Policy explains how Tivorah (&quot;Tivorah&quot;,
        &quot;we&quot;, &quot;us&quot; or &quot;our&quot;) handles personal
        information when you use the Tivorah mobile application, website,
        newsletter and related support and community services. It also explains
        the choices available to you.
      </p>

      <h2>Information we collect</h2>
      <ul>
        <li>
          <strong>Account and verification information:</strong> name,
          username, email address, phone number, country code, encrypted
          password, verification status, account role and acceptance of our
          legal terms.
        </li>
        <li>
          <strong>Profile information:</strong> profile photo, biography,
          gender if supplied, country, suburb or city, postcode, interests and
          other information you choose to add.
        </li>
        <li>
          <strong>Hub and social activity:</strong> Hubs you create, join or
          request to join; membership and moderation status; Banter, threads,
          announcements, comments, reactions, polls and reports.
        </li>
        <li>
          <strong>Messages and calls:</strong> private or group messages, voice
          notes, attachments, delivery information and technical call or
          signalling records. If calling is made available, camera and
          microphone access occurs only with device permission.
        </li>
        <li>
          <strong>Marketplace and services:</strong> listings, images, prices,
          service areas, enquiries, offers, order records, seller information
          and information needed to arrange pickup, delivery or a service.
        </li>
        <li>
          <strong>Events and payments:</strong> events, bookings, ticket types,
          ticket and QR identifiers, attendance/check-in records, order status,
          refunds and payment-provider references. Payment card details are
          entered with our payment provider and are not intended to be stored
          by Tivorah.
        </li>
        <li>
          <strong>Jobs:</strong> job and employer information, applications,
          cover letters, uploaded CVs or other documents, application status
          and access records for protected documents.
        </li>
        <li>
          <strong>Location:</strong> a location you enter, a profile locality,
          or approximate or precise device location when you grant permission
          for nearby discovery. We do not need continuous background location
          access to provide ordinary nearby searches.
        </li>
        <li>
          <strong>Device and technical information:</strong> IP address, device
          and operating-system details, app version, push-notification token,
          session information, security and audit logs, diagnostics and crash
          or delivery information.
        </li>
        <li>
          <strong>Support, feedback and newsletter information:</strong> your
          correspondence with us, feedback rating and category, support
          requests, newsletter name and email, consent record and subscription
          source.
        </li>
      </ul>

      <h2>How we collect information</h2>
      <p>
        We collect information directly from you, automatically from your
        device when you use Tivorah, from other members when they interact with
        or report content, and from providers that help us operate payments,
        communications, security, media and analytics. Event organisers,
        sellers, service providers and employers may also provide information
        needed to complete the activity you request.
      </p>

      <h2>How we use information</h2>
      <p>We use personal information where reasonably necessary to:</p>
      <ul>
        <li>create, verify, secure and support accounts;</li>
        <li>
          operate Hubs, discovery, Banter, messages, media, events, tickets,
          marketplace, services, jobs and notifications;
        </li>
        <li>
          personalise results and show relevant nearby content when location is
          enabled;
        </li>
        <li>
          process payments, organiser payouts, cancellations, refunds and
          transaction support;
        </li>
        <li>
          enforce Hub rules and our policies, investigate reports, prevent
          fraud or abuse and maintain audit and security records;
        </li>
        <li>
          communicate about requested activity, important service or safety
          changes, support enquiries and app updates;
        </li>
        <li>
          measure reliability and product journeys, troubleshoot failures and
          improve Tivorah; and
        </li>
        <li>meet legal, regulatory, tax and dispute-resolution obligations.</li>
      </ul>

      <h2>What other people can see</h2>
      <p>
        Tivorah is a community service. Depending on your settings and the Hub
        involved, your username, profile photo, biography, general locality,
        Hub membership, public posts, reactions, listings, events, jobs and
        other contributions may be visible to other people. Private-Hub content
        is intended for authorised members, but no online audience can be
        guaranteed to keep content confidential. Do not publish precise home
        addresses, financial information or anything you do not want the
        relevant audience to see.
      </p>
      <p>
        Private messages are shown to their participants and may be accessed by
        authorised personnel or providers only where reasonably necessary for
        delivery, support, safety, legal compliance or investigation of a
        report.
      </p>

      <h2>Device permissions</h2>
      <p>
        Tivorah may request location, camera, microphone, photo/media library
        and notification permissions. These support nearby discovery, uploads,
        photos or video, voice messages or calls, saving media and push alerts.
        Permissions are optional and can be withdrawn in iOS or Android
        settings, although the related feature may then be unavailable. Tivorah
        does not access your address book merely because you connect with
        people in the app.
      </p>

      <h2>Product analytics</h2>
      <p>
        Tivorah uses PostHog to understand whether the mobile application is
        reliable and whether people can complete important journeys. Analytics
        may include an internal Tivorah user identifier, app and device details,
        lifecycle events, screens visited, action outcomes and durations, and
        associated technical information such as an IP address.
      </p>
      <p>
        We do not intentionally send PostHog private-message or Banter content,
        passwords, authentication tokens, verification codes, names, usernames,
        email addresses, phone numbers, search terms, form text, uploads,
        precise coordinates, street addresses, or API request and response
        bodies. Session replay and automatic touch capture are disabled.
      </p>
      <p>
        You can stop or resume optional mobile product analytics under
        <strong> Settings → Privacy → Usage analytics</strong>. This does not
        disable essential operational, fraud-prevention, security or transaction
        records.
      </p>

      <h2>Notifications, news and marketing</h2>
      <p>
        You can manage push categories and optional marketing notifications in
        Tivorah settings and device settings. Essential account, transaction,
        policy and safety communications may still be sent where necessary to
        provide or protect the service.
      </p>
      <p>
        Website newsletter subscribers receive Tivorah news and app updates
        based on the consent given with the subscription form. Every marketing
        email will provide an unsubscribe method. You may also ask us to stop
        direct marketing by contacting us. Unsubscribing from marketing does
        not delete a Tivorah account or stop essential service messages.
      </p>

      <h2>When we share information</h2>
      <p>We may share only the information reasonably needed with:</p>
      <ul>
        <li>
          other members and the audience selected for your profile, Hub or
          contribution;
        </li>
        <li>
          event organisers, sellers, buyers, service providers, employers or
          applicants when necessary for an interaction you request;
        </li>
        <li>
          infrastructure, database, media-storage, email, SMS, push,
          customer-support, security and analytics providers, including
          ImageKit, SendGrid, TextMagic, Expo and PostHog;
        </li>
        <li>
          Stripe and related financial providers for paid tickets, organiser
          onboarding, payouts, refunds and fraud prevention;
        </li>
        <li>
          professional advisers, insurers, auditors or a successor involved in
          a genuine financing, restructure or transfer of the service, subject
          to appropriate confidentiality and legal safeguards; and
        </li>
        <li>
          courts, regulators, law enforcement or other parties where required
          or authorised by law, or reasonably necessary to protect rights,
          safety and the integrity of Tivorah.
        </li>
      </ul>
      <p>We do not sell personal information.</p>

      <h2>Overseas processing</h2>
      <p>
        Some providers may store or process information outside Australia,
        including in the United States and other countries in which they or
        their subprocessors operate. The exact location can depend on the
        provider and the hosting region configured for Tivorah. We assess our
        providers and take reasonable steps appropriate to the information and
        service to protect personal information used or disclosed overseas. You
        may contact us for current information about relevant provider
        locations.
      </p>

      <h2>Storage, security and data breaches</h2>
      <p>
        We use safeguards including access controls, password hashing,
        encryption in transit, restricted document access, session revocation
        and operational audit records. No online service can guarantee absolute
        security. If an eligible data breach occurs, we will assess and respond
        to it in accordance with applicable Australian law, including notifying
        affected people and the Office of the Australian Information
        Commissioner where required.
      </p>

      <h2>Retention and account deletion</h2>
      <p>
        We keep information only for as long as it is reasonably needed for the
        purposes described above, including service delivery, legal and tax
        obligations, fraud prevention, safety, backups and dispute resolution.
        Retention periods differ by record type.
      </p>
      <p>
        You can request deletion in the mobile app under
        <strong> Profile → Settings → Delete account</strong>. Deletion revokes
        active sessions and removes or anonymises core account and profile
        identifiers. Some contributions or limited records may remain in
        anonymised or restricted form where needed to preserve conversations or
        transaction integrity, comply with law, process refunds, prevent fraud,
        enforce safety decisions or resolve disputes. Details and an alternative
        request method are available on our account-deletion page.
      </p>

      <h2>Access, correction and privacy complaints</h2>
      <p>
        You can update many profile details and preferences in Tivorah. You may
        also ask us for access to, or correction of, personal information we
        hold about you. We may need to verify your identity and may refuse a
        request where permitted by law, in which case we will explain the reason
        where required.
      </p>
      <p>
        To make a privacy complaint, email us with enough detail to investigate.
        We will acknowledge and respond within a reasonable period. If you are
        not satisfied with our response, you may contact the{" "}
        <a href="https://www.oaic.gov.au/privacy/privacy-complaints">
          Office of the Australian Information Commissioner
        </a>
        .
      </p>

      <h2>Children</h2>
      <p>
        Tivorah is designed for people aged 18 and over. We do not knowingly
        permit children to create accounts. Contact us if you believe a child
        has provided personal information so we can investigate and take
        appropriate action.
      </p>

      <h2>Changes and contact</h2>
      <p>
        We may update this policy to reflect product, provider or legal changes.
        We will publish the revised date and provide additional notice where a
        change materially affects how information is handled.
      </p>
      <p>
        For privacy requests or complaints, contact{" "}
        <a href="mailto:privacy@tivorah.com">
          <strong>privacy@tivorah.com</strong>
        </a>
        . For general support, contact{" "}
        <a href="mailto:support@tivorah.com">
          <strong>support@tivorah.com</strong>
        </a>
        .
      </p>
    </article>
  );
}
