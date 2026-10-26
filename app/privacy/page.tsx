import { pageMetadata } from "../../lib/site";
import Link from "next/link";
import { LegalNavigation } from "../legal-navigation";

export const metadata = pageMetadata("Privacy Policy", "How Tivorah collects, uses and protects personal information.", "/privacy");

export default function Privacy() {
  return (
    <article className="content">
      <span className="eyebrow">Legal</span>
      <h1>Privacy Policy</h1>
      <p className="legal-meta">
        <strong>Last updated:</strong> 26 October 2026
      </p>

      <p>
        This Privacy Policy explains how TIVORAH PTY LTD (ABN 94 702 094 844),
        based in Adelaide, South Australia (&quot;Tivorah&quot;,
        &quot;we&quot;, &quot;us&quot; or &quot;our&quot;) handles personal
        information when you use the Tivorah mobile application, website,
        newsletter and related support and community services. It also explains
        the choices available to you.
      </p>
      <p>
        Tivorah is operated from Australia and can be used around the world.
        Some features, such as Tivorah ticketing and online payments, are only
        available in certain countries; everything else, including Hubs,
        Banter, messages, events, listings and jobs, works wherever you are.
      </p>

      <div className="legal-callout">
        <strong>Privacy at a glance</strong>
        <p>
          We do not sell personal information, and we do not let other
          companies train their AI models on it. Public and Hub activity is not
          the same as a private message. Optional product analytics can be
          disabled in the mobile app. You can request access, correction or
          deletion by contacting <a href="mailto:privacy@tivorah.com">privacy@tivorah.com</a>.
        </p>
      </div>

      <h2>Information we collect</h2>
      <ul>
        <li>
          <strong>Account and verification information:</strong> name,
          username, email address, phone number, country code, encrypted
          password credential, verification and two-factor status, linked
          sign-in provider, session and device information, account role and
          acceptance of our legal terms. We collect date of birth and 18+
          confirmation to enforce Tivorah&apos;s adults-only eligibility rule. If you use Sign in with Apple or Google, that
          provider gives us an account identifier and the name, email address
          (or Apple relay address) and profile photo you choose to share;
          Tivorah does not receive your Apple or Google password.
        </li>
        <li>
          <strong>Profile information:</strong> profile photo, biography,
          gender if supplied, country, suburb or city, postcode, interests and
          other information you choose to add.
        </li>
        <li>
          <strong>Sensitive information you choose to reveal:</strong> a Hub,
          profile, post or interaction may reveal or suggest racial or ethnic
          origin, religion, sexual orientation, health, disability, political
          opinions or another sensitive characteristic. You should only share
          this information when you are comfortable doing so. We process it to
          provide the community feature you deliberately use and seek any
          additional consent required by law.
        </li>
        <li>
          <strong>Hub and social activity:</strong> Hubs you create, join or
          request to join, including their cover photos and an optional short
          cover video (reviewed by Tivorah before it appears publicly);
          membership and moderation status; Banter, threads, announcements,
          comments, reactions, polls and reports.
        </li>
        <li>
          <strong>Messages and calls:</strong> conversation content where the
          conversation is not end-to-end encrypted; encrypted message
          envelopes and attachments for eligible one-to-one private chats;
          reports that a participant chooses to submit; and delivery, device,
          key-management and technical call or signalling records. To connect a
          voice or video call, your device and the other person&apos;s exchange
          network addresses (IP addresses) through a connection service, which
          may be provided by Google or relay the call through our own server.
          Camera and microphone access occurs only with device permission.
        </li>
        <li>
          <strong>Marketplace and services:</strong> listings, images, prices,
          service areas, enquiries, offers, order records, seller information
          and information needed to arrange pickup, delivery or a service. If
          you share a listing to a Hub, members of that Hub can see it. If you
          review a service you booked, your rating, review and first name are
          shown publicly on that service&apos;s page (including to people who
          are not signed in); in the app, signed-in members also see your
          profile photo. The provider can see your name and reply.
        </li>
        <li>
          <strong>Shops and shop media:</strong> your shop name, web
          address, introduction, story, logo, cover image, photos, short videos,
          an optional introduction video with its captions and transcript, and
          optional details such as area, opening hours, service area, delivery
          and booking policies. A published shop is public and can be viewed by
          people who are not signed in, and a shop card can appear on your item,
          service and event pages. Images are screened automatically and videos
          are reviewed by Tivorah before they appear publicly.
        </li>
        <li>
          <strong>Events, tickets and payments:</strong> events, bookings,
          ticket and QR identifiers, attendance and check-in records (including
          the time a ticket is scanned or its entry code is entered), order
          totals, payment status, refunds and Stripe customer, checkout or
          connected-account identifiers where paid features are enabled.
          Stripe may collect identity, beneficial-owner, business, tax and bank
          information directly from organisers, providers and sellers during
          Connect onboarding. Tivorah receives account identifiers, capability,
          verification and payout-status information rather than full identity
          documents, full bank-account details or full payment-card numbers. If you follow an
          external ticket link, the external provider&apos;s privacy practices apply.
          If you buy tickets without an account, we collect the name and email
          address you give at checkout to issue and send the tickets.
        </li>
        <li>
          <strong>Ticket transfers:</strong> when you send a ticket to someone,
          we use the email address you enter to send them an invitation, and we
          record who sent it, who accepted it and when. The name of the person
          who accepts appears on their ticket. Only send a ticket to someone who
          would expect to hear from you.
        </li>
        <li>
          <strong>Jobs and opportunities:</strong> job and employer profiles,
          locality information (any country), saved jobs, application status,
          cover letters, CVs or other documents where native applications are
          enabled, external application links, contextual direct-message
          activity and access records for protected application documents.
        </li>
        <li>
          <strong>Location:</strong> a location you enter (your country and,
          where you choose, a state or region and a suburb, city, town or local
          government area), a profile locality, your device&apos;s region
          setting to suggest a default country, or approximate or precise
          device location when you grant permission
          for nearby discovery. We do not need continuous background location
          access to provide ordinary nearby searches. The country or area you
          choose in search filters (for example, browsing Hubs, events or
          listings in another country) is used only to show those results and
          does not change where your profile says you live. In Discover (Friends
          &amp; people) we suggest people near you first, using the area saved on
          your profile and, only if you have already allowed location access,
          your device&apos;s approximate position rounded to about 1 km. We use that
          position to order the suggestions and do not store it. Other members
          see only the city or town and country on your profile, never your
          distance from them, your postcode or your exact location. You can stop
          being suggested to others under <strong>Profile → Settings &amp; privacy →
          Show me in Discover</strong>.
        </li>
        <li>
          <strong>Device and technical information:</strong> IP address, device
          and operating-system details, app version, push-notification token,
          session information, security and audit logs, diagnostics and crash
          or delivery information.
        </li>
        <li>
          <strong>Support, feedback, waitlist and newsletter information:</strong> your
          correspondence with us, feedback rating and category, support
          requests, and, when you join the waitlist, your name, email address,
          the consent you gave and when you gave it, the form you used, and
          whether and when you unsubscribed. We also process the IP address of
          the request to limit repeated or automated sign-ups.
        </li>
      </ul>

      <h2>How we collect information</h2>
      <p>
        We collect information directly from you, automatically from your
        device when you use Tivorah, from other members when they interact with
        or report content, and from providers that help us operate payments,
        communications, security, media and analytics. Event organisers,
        sellers, service providers and opportunity posters may also provide information
        needed to complete the activity you request.
      </p>

      <h2>When information is required</h2>
      <p>
        Account, authentication and essential service information is required
        to create and protect an account. Other fields, permissions, precise
        location, analytics, marketing and most profile details are optional.
        If required information is not provided, we may be unable to create an
        account or provide the related feature. We do not ask for government
        identity documents merely to join an ordinary Hub.
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
          suggest people you may want to connect with in Discover, nearest
          first, based on the area on your profile (and your approximate device
          position when you have allowed location);
        </li>
        <li>
          issue free tickets, support event attendance and check-in, and manage
          cancellations or related support;
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
          improve Tivorah;
        </li>
        <li>
          create aggregated or de-identified information, and research, develop,
          train, test and improve Tivorah&apos;s features and safety systems,
          including recommendation, search, moderation and other machine-learning
          or artificial intelligence (AI) features, as described in
          &quot;Aggregated data, research and AI&quot; below; and
        </li>
        <li>meet legal, regulatory, tax and dispute-resolution obligations.</li>
      </ul>
      <p>
        <strong>Checking posts before they go live.</strong> When you post or
        send something people can read (for example Banter, replies, listings,
        events, Hub details, enquiries, group messages or your bio), Tivorah
        checks the words automatically, on our own servers, for slurs, threats
        and hurtful language, and may ask you to reconsider or stop it being
        posted. This check doesn&apos;t send your words to another company,
        and we keep only a count of what was flagged, not the words. Private
        one-to-one messages are end-to-end encrypted, so they are never
        checked.
      </p>

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
        <strong>Discover (Friends &amp; people).</strong> Unless you turn off{" "}
        <strong>Show me in Discover</strong> (Profile → Settings &amp; privacy), signed-in
        members may see you suggested as someone to connect with, showing your
        name, username, profile photo, biography, the city or town and country
        on your profile, and up to three of your interests. Discover never shows
        interests that could reveal your religion, sexual orientation, health,
        disability or political views, and never shows your distance, postcode
        or exact location. People you have blocked, or who have blocked you, are
        never suggested.
      </p>
      <p>
        <strong>Mentions, quotes and polls.</strong> When someone @mentions you
        in a Hub, your username is shown in their post and you may be notified.
        Only active members of that Hub can be mentioned, and never across a
        block. If another member quotes your post, the quoted text is shown with
        your name to the audience of their post; if you delete your post, the
        quote shows that it is no longer available. Poll votes are anonymous to
        other members: people see only the totals, never who voted for what. We
        store your vote with your account so it is counted once and cannot be
        changed.
      </p>
      <p>
        <strong>Hub owners and moderators</strong> can see the general location
        on your profile (your suburb, city or town, region and country) when you
        ask to join their Hub and while you are a member, so they can understand
        who is joining their community. This is where you said you live, not
        the country or area you browse in search filters, so it stays the same
        if you look for Hubs elsewhere (for example, Hubs in Australia while you
        live in Nigeria). We never show them your precise device location. You
        can change your location in your profile at any time.
      </p>
      <p>
        <strong>Event organisers</strong> can see an attendee list for their own
        event. For each booking it shows the booking name, ticket type, number
        of tickets, amount paid, booking time, whether the booking was refunded
        or cancelled, and how many tickets have been checked in. The attendee
        list does not show your email address. Organisers use it to manage entry
        and support their event, and must handle it under our{" "}
        <Link href="/marketplace-partner-agreement">Marketplace Partner Agreement</Link>.
      </p>
      <p>
        <strong>Service providers</strong> can see the bookings made for their
        own services, including the appointment time, booking status and
        amount. <strong>Sellers</strong> receive the enquiries you send about
        their items or services.
      </p>
      <h2>Messages and end-to-end encryption</h2>
      <p>
        Tivorah distinguishes personal one-to-one private chats from community
        and transactional conversations. An eligible one-to-one chat is
        end-to-end encrypted only when the conversation screen expressly shows
        that protection. This includes text messages, voice recordings, photos,
        videos and files sent in the chat. In such a chat, content and attachments are
        encrypted on the sender&apos;s device and can ordinarily be decrypted only
        by the participating devices. Tivorah stores encrypted messages, key
        envelopes and encrypted attachments to support delivery and chat history,
        but does not hold the private device keys needed
        to read that content.
      </p>
      <p>
        Photos, videos, voice messages and files sent in an end-to-end encrypted
        chat are encrypted on the sender&apos;s device, each with its own key,
        before they are uploaded. Tivorah stores only the encrypted file and
        cannot open it, see what kind of file it is or what it is called. The
        key travels inside the encrypted message, so only the devices in that
        chat can download, check and decrypt the file. Because Tivorah cannot
        see these files, it cannot automatically screen them; reporting works
        as described below. A decrypted copy is kept in the app&apos;s private
        storage on your device so it opens quickly, and is removed if you
        uninstall the app or the system clears that storage.
      </p>
      <p>
        Banter, posts, threads, Hub messages, announcements, group conversations
        and conversations connected to a listing, marketplace item, service,
        event, ticket, job or other transaction, including customer and seller
        enquiries, are not end-to-end encrypted.
        Tivorah and relevant service providers store and process that content as
        reasonably necessary to deliver the feature, maintain transaction
        records, provide support, investigate reports, moderate content, prevent
        fraud and comply with law. Audience controls or private-Hub membership
        restrict who should receive content but do not make it end-to-end
        encrypted.
      </p>
      <p>
        End-to-end encryption does not hide all communication metadata and does
        not prevent a recipient from copying, forwarding, photographing or
        reporting content. Tivorah may process participant and device
        identifiers, key records containing public keys, delivery and read
        status, dates and times, encrypted-envelope size, IP address, abuse and
        security signals, and device or application information. Read-receipt
        sharing can be controlled in the app&apos;s Privacy settings; disabling it
        does not stop Tivorah from maintaining your own unread counts or
        processing delivery information. If a participant supplies readable
        copies of messages or attachments with a report or support request,
        those supplied copies can be reviewed by authorised safety personnel
        and service providers for that purpose. Reporting does not give Tivorah
        access to the private keys or the rest of the encrypted conversation.
      </p>
      <p>
        Do not assume a conversation is end-to-end encrypted unless Tivorah
        displays an end-to-end encryption notice in that conversation. Feature
        availability may depend on application version, device support and
        successful security setup. Tivorah will not silently downgrade a chat
        that is marked as end-to-end encrypted; if secure messaging is not ready,
        sending will be unavailable or the app will clearly disclose the
        different protection before a message is sent.
      </p>

      <h2>Device permissions</h2>
      <p>
        Tivorah may request location, camera, microphone, photo/media library
        and notification permissions. These support nearby discovery, uploads,
        photos or video, voice messages or calls, saving media and push alerts.
        Event organisers may also use the camera to scan attendees&apos;
        ticket QR codes at check-in. The camera image is processed on the
        organiser&apos;s device to read the code; only the ticket code is sent to
        Tivorah, and the camera image is not stored or uploaded.
        The in-app QR scanner works the same way: the code is read on your
        device, only Tivorah links are opened, and the camera image is not
        stored or uploaded. When you choose &ldquo;Get directions&rdquo; for an
        event, the website may ask your browser for your location to start the
        route; if you allow it, the location is placed in a Google Maps link
        that opens in a new tab and is not sent to Tivorah. In the app,
        directions open in Google Maps, which may use your device location under
        Google&apos;s own terms.
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
        <strong> Profile → Settings &amp; privacy → Usage analytics</strong>. This does not
        disable essential operational, fraud-prevention, security or transaction
        records.
      </p>
      <p>
        <strong>On the website</strong>, optional PostHog usage analytics
        records the pages you view, how long you stay, errors, basic browser
        and device details and your IP address, linked to an internal account
        number when you are signed in. It uses no cookies or browser storage,
        never runs when your browser sends a Global Privacy Control or Do Not
        Track signal, and can be turned off in our{" "}
        <Link href="/cookies">Cookie Notice</Link> or under{" "}
        <strong>Your account → Profile &amp; security → Privacy</strong>.
      </p>
      <p>
        <strong>Error monitoring.</strong> When something fails in the app, on
        the website or on our servers, we send an error report to PostHog so we
        can fix it. A report contains technical details of the error (such as
        the screen or route, the type of request and the error message), your
        app or browser version and, if you are signed in, an internal account
        number. It is not designed to include your messages, posts, passwords or
        payment details.
      </p>

      <h2>Website cookies and mobile storage</h2>
      <p>
        The website does not use advertising cookies or cross-site tracking,
        and its optional usage analytics (described above) uses no cookies.
        When you sign in on the website, we use strictly
        necessary, secure, HTTP-only cookies to keep you signed in and protect
        your session. The website also keeps a few small items in your browser
        (such as an in-progress checkout or a dismissed message) to make
        features work, and event pages may show an embedded Google map that is
        provided by Google under its own privacy terms. The mobile app uses
        local and secure device storage for sessions, settings, encryption keys
        and feature state. To open quickly and work on a weak connection, the
        app also keeps a temporary copy of recently viewed content (such as
        Hubs, posts and listings) on your device for up to a few days. Private
        end-to-end encrypted chats are kept on your device only in their
        encrypted form until opened. This copy is deleted when you sign out. See our <Link href="/cookies">Cookie Notice</Link>.
      </p>

      <h2>Notifications, news and marketing</h2>
      <p>
        You can manage push categories and optional marketing notifications in
        Tivorah settings and device settings. Essential account, transaction,
        policy and safety communications may still be sent where necessary to
        provide or protect the service. If you receive payments through
        Tivorah, we may show an in-app notice that you need to acknowledge when
        we change the availability of a payment feature or a Tivorah platform
        fee that affects you. We record when you acknowledge it.
      </p>
      <p>
        Push notifications for end-to-end encrypted chats never include the
        message: they only say who sent you a message, because Tivorah cannot
        read it. Notifications for enquiries about a listing, service or event,
        which are not end-to-end encrypted, can include the sender&apos;s name,
        what the enquiry is about and the start of the message. Depending on
        your device settings, notification text may appear on your lock screen.
        While you are using the app, new messages may appear as an in-app
        banner; for encrypted chats the text in that banner is decrypted on your
        device. Push notifications are delivered through Expo and Apple or
        Google notification services.
      </p>
      <p>
        You can only join the website waitlist after ticking the consent box.
        When you join, we send one confirmation email to the address you gave.
        After that, waitlist members receive Tivorah launch news and app
        updates based on that consent. Waitlist emails are sent through our
        email provider, Resend. Every marketing email identifies Tivorah and
        includes a link to unsubscribe, and we action opt-outs within five
        working days, in line with the <em>Spam Act 2003</em> (Cth). You can
        also unsubscribe on our <Link href="/unsubscribe">unsubscribe page</Link> or
        ask us to stop by contacting us. Unsubscribing from marketing does not
        delete a Tivorah account or stop essential service messages.
      </p>

      <h2>When we share information</h2>
      <p>We may share only the information reasonably needed with:</p>
      <ul>
        <li>
          other members and the audience selected for your profile, Hub or
          contribution;
        </li>
        <li>
          event organisers, sellers, buyers, service providers or opportunity
          posters when necessary for an interaction you request, including the
          booking, fulfilment, check-in, cancellation or refund of a transaction;
        </li>
        <li>
          infrastructure, database, media-storage, email, push, authentication,
          payment, customer-support, security and analytics providers, including
          Contabo (website, application and database hosting), Redis Cloud and Upstash (caching, rate limiting and live
          updates), Cloudflare and Cloudflare R2 (security, delivery and media
          storage), ImageKit (during storage migration or rollback), Google
          Cloud Vision and Amazon Rekognition (automated image-safety
          screening), Google (sign-in, embedded maps and the connection service
          that helps voice and video calls connect), Apple (sign-in), Resend
          (email), Stripe (payments and payouts), Expo (push notifications),
          PostHog (app and website usage analytics and error monitoring),
          Geoapify (address suggestions when you type an event venue) and
          Grafana (operational logs), when the relevant service is configured;
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

      <h2>Payments, fraud prevention and tax reporting</h2>
      <p>
        Stripe processes payment methods and Connect onboarding under its own
        privacy terms. Tivorah uses payment, connected-account, booking,
        fulfilment, refund and dispute information to calculate disclosed fees,
        issue tickets, route payouts, prevent fraud, provide support, process
        refunds, respond to chargebacks and keep financial records. We may share
        relevant transaction and fulfilment evidence with Stripe, a payment
        network or a customer&apos;s bank when investigating a dispute.
      </p>
      <p>
        Tivorah may collect and report Partner identity and transaction details
        to the Australian Taxation Office or another authority where required,
        including under the Sharing Economy Reporting Regime. Legal and
        financial records may be retained after account deletion where needed
        for tax, refunds, disputes, fraud prevention or another lawful purpose.
      </p>

      <p>Seller tax settings record your legal name, declared ABN and GST registration, and the time and available version of your declaration. We use these details for payment readiness and applicable booking records. Where supported, we may suggest a legal name from your connected Stripe account for you to confirm. This is not independent verification of your tax registration. Required tax reporting is separate from optional marketing consent; we request only information needed for an identified purpose. Do not send tax file numbers through messages or ordinary support email.</p>

      <h2>Automated decisions</h2>
      <p>
        Tivorah uses computer programs to help make some decisions that can
        affect you. Images you upload are screened automatically for nudity,
        violence and other unsafe content, and an image that fails screening
        may be blocked from public display. Before something you write is
        posted (for example Banter, replies, listings, events, Hub details,
        enquiries, group messages or your bio), its words are checked
        automatically: hurtful language prompts you to reconsider, and slurs,
        threats, encouragement of self-harm, revealing where someone lives and
        telling people to &ldquo;go back to their country&rdquo; are blocked.
        End-to-end encrypted private messages are never checked. Automated
        security and rate-limit checks may temporarily block sign-in attempts,
        sign-ups, messages or checkout requests that look abusive or
        fraudulent. When an image is published we keep a one-way fingerprint
        of it (not the image itself) with the account that posted it, so we can
        re-check published images when new known harmful material, such as
        child sexual abuse material, is identified; these fingerprints are kept
        for that safety purpose even after the image is removed. Age and
        eligibility checks use the date of birth and
        confirmation you provide. Payment providers such as Stripe also run
        their own automated fraud and verification checks. You can ask for a
        person at Tivorah to review an automated decision that affects you by
        contacting{" "}
        <a href="mailto:support@tivorah.com">support@tivorah.com</a>.
      </p>

      <h2>Aggregated data, research and AI</h2>
      <p>
        As Tivorah grows, we may use information to understand how the service
        is used and to build better and safer features. We do this within these
        limits:
      </p>
      <ul>
        <li>
          <strong>Aggregated and de-identified information.</strong> We may
          combine or de-identify information so that it no longer identifies
          you or any other person (for example, the number of Hubs in a city or
          popular event categories). We may use and share aggregated or
          de-identified information for any lawful purpose, including research,
          reporting, product development and partnerships. We take reasonable
          steps not to re-identify it and require recipients not to try.
        </li>
        <li>
          <strong>Tivorah&apos;s own features.</strong> We may use personal
          information to develop, train, test and improve features that serve
          Tivorah members, such as recommendations, search, translation,
          spam and fraud detection, content moderation and safety tools,
          relying on our legitimate interests or your consent where the law
          requires it. We prefer de-identified information for this wherever it
          does the job.
        </li>
        <li>
          <strong>Sensitive information needs your consent.</strong> Some
          interests and Hubs can reveal sensitive information, such as your
          religious beliefs, sexual orientation, or health or disability (for
          example, faith, LGBTQIA+ or disability Hubs and interests). We use
          this only to provide the parts of Tivorah you choose, such as showing
          you those Hubs, and we never show these interests to other members in
          Discover. We will never use sensitive information to train AI
          models without your express consent.
        </li>
        <li>
          <strong>Notice and a choice before AI training.</strong> Tivorah does
          not currently train AI models on members&apos; personal information.
          Before we start, we will tell members in advance and give you a
          simple way to opt out in your settings, as well as updating this
          policy. Opting out will not affect your use of Tivorah.
        </li>
        <li>
          <strong>Private messages stay private.</strong> End-to-end encrypted
          messages cannot be read by Tivorah and are never used for research,
          training or AI. We do not use the content of other private messages
          to train AI models.
        </li>
        <li>
          <strong>Providers don&apos;t train on your information.</strong> If we
          use an outside AI or analytics provider, they may process information
          only to provide that service to Tivorah, under a contract that
          prohibits them from using it to train their own models or for their
          own purposes.
        </li>
        <li>
          <strong>No selling, and no surprises.</strong> We do not sell personal
          information or license it to others for their own AI training. Before
          using identifiable personal information for a materially different
          purpose than this policy describes, we will tell you and ask for your
          consent where the law requires it.
        </li>
      </ul>

      <h2>Overseas processing</h2>
      <p>
        Some providers may store, access or process information outside
        Australia. Likely locations include the United States, United Kingdom,
        European Economic Area and Singapore, depending on the provider,
        configured region and content-delivery location. Provider subprocessors
        and locations can change. We assess providers and take reasonable steps
        appropriate to the information and service before an overseas
        disclosure. Contact us for the current provider and location register.
      </p>
      <p>
        If you use Tivorah from outside Australia, your information is
        transferred to and processed in Australia and in the countries where
        our providers operate. Where the law of your country requires it, we
        use appropriate safeguards for these transfers, such as contractual
        protections (including standard contractual clauses) with our
        providers.
      </p>

      <h2>Storage, security and data breaches</h2>
      <p>
        We use safeguards including access controls, password hashing,
        encryption in transit, restricted document access, session revocation
        and operational audit records. Eligible one-to-one private chats also
        use the end-to-end encryption described above.
      </p>
      <p>
        <strong>Protecting sign-in.</strong> To stop people guessing passwords,
        we count failed sign-in attempts for each account (stored as a one-way
        code of the email or username, not the address itself) and may pause
        sign-in for that account for a short time. After you sign in
        successfully, your phone or browser keeps a signed &ldquo;known
        device&rdquo; marker so other people&apos;s failed attempts don&apos;t
        lock you out. During an attack, signing in from an unrecognised device
        may require a quick human check provided by Cloudflare Turnstile, which
        processes technical information such as your IP address and browser or
        device signals under Cloudflare&apos;s own privacy terms. No online service can
        guarantee absolute security, and encryption cannot protect content on a
        compromised or unlocked device. If an eligible data breach occurs, we
        will assess and respond
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
        If you start signing up with an email address but don&apos;t verify it,
        we send up to four reminders over the following week. If it&apos;s still not verified
        7 days after you signed up, we delete the details you entered (your
        name, email, username, date of birth and password), and you can sign up
        again at any time.
      </p>
      <p>
        We keep waitlist details while you remain subscribed and for as long as
        they are needed for launch communications. If you unsubscribe, we keep
        your email address and the date you opted out so we do not email you
        again; you can ask us to delete the rest. When you delete an event or
        listing, it is removed from Tivorah and from your creations, but related
        booking, ticket, payment, refund and audit records are kept for the
        purposes above.
      </p>
      <p>
        For eligible end-to-end encrypted chats, encrypted messages, key envelopes
        and encrypted attachments may remain on our systems to support delivery
        and chat history, subject to the retention purposes above. A delivered
        or read status does not by itself delete the stored encrypted content.
        Decrypted copies are stored on participating devices and may remain on
        another participant&apos;s device after you delete
        your account or your own copy. Non-encrypted community and transactional
        conversations may be retained for moderation, safety, fraud prevention,
        transaction integrity, legal obligations and dispute resolution.
      </p>
      <p>
        You can delete your account in the mobile app under
        <strong> Profile → Settings &amp; privacy → Delete account</strong>, or on the
        website under <strong>Your account → Profile &amp; security → Delete account</strong>.
        Deletion signs you out everywhere and removes or de-identifies your
        personal information: your email, username, phone, name, bio, photo
        (including the stored file), address, date of birth, gender, country,
        home location and interests, your devices and notification settings,
        connections and friend requests, Hub memberships and join requests,
        your business shop and employer profile. Your active listings and
        upcoming events without bookings are taken down, and open jobs are
        closed. If you still have upcoming events with bookings or upcoming
        appointments, you&apos;ll be asked to cancel or finish them first so
        nobody who paid is left without a refund. Some contributions or limited records may remain in
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

      <h2>Using Tivorah outside Australia</h2>
      <p>
        Tivorah is operated from Australia and handles personal information in
        line with the Australian Privacy Principles. When you use Tivorah from
        another country, the privacy laws of that country may also apply, such
        as the EU and UK General Data Protection Regulation, Nigeria&apos;s Data
        Protection Act 2023, Kenya&apos;s Data Protection Act 2019, Ghana&apos;s
        Data Protection Act 2012, South Africa&apos;s Protection of Personal
        Information Act, Canada&apos;s privacy laws and US state privacy laws. We
        aim to meet the requirements that apply to you. If the European Union or
        United Kingdom General Data Protection Regulation applies to you, we rely on these
        legal bases: performing our contract with you (to provide your account
        and the features you use), our legitimate interests (to keep Tivorah
        safe, prevent fraud and improve the service, balanced against your
        rights), legal obligations (such as tax and record-keeping), and your
        consent (for optional analytics, marketing and certain device
        permissions, which you can withdraw at any time).
      </p>
      <p>
        <strong>Features by country.</strong> You can use Tivorah from any
        country and browse Hubs, events and listings in any country. Some
        features, such as Tivorah ticketing and payments, are only available in
        certain countries (currently Australia) while we prepare them
        elsewhere. Where they are not available, organisers and sellers may give
        you their own ticket link or ask you to message them. If you follow a
        link to another website or pay someone outside Tivorah, that website or
        person handles your information and payment under their own terms and
        privacy practices, not this policy.
      </p>
      <p>
        Depending on the law that applies, you may have rights to access,
        correct, delete, restrict or object to the use of your information, to
        receive a copy in a portable format, and to complain to your local data
        protection authority. If you live in a US state with a consumer privacy
        law, you may also have the right to know what we collect and to opt out
        of the sale or sharing of personal information; we do not sell personal
        information or share it for cross-context behavioural advertising, so
        there is nothing to opt out of. To use these rights, email{" "}
        <a href="mailto:privacy@tivorah.com">privacy@tivorah.com</a>. We will
        respond within the time the applicable law requires.
      </p>

      <h2>Children</h2>
      <p>
        Tivorah is designed for people aged 18 and over. We do not knowingly
        permit children to create or keep accounts. We may ask for an age
        declaration and use proportionate age-assurance or anti-circumvention
        signals where required. We do not use age-assurance information for
        advertising. If someone gives a date of birth under 18 when signing
        up, we stop the sign-up and, so they cannot simply try again with an
        older year, we keep a one-way code made from their email address (not
        the address itself) and the date they turn 18; their phone or browser
        also remembers that date. We do not keep the date of birth they
        entered, we use this only to stop under-18 sign-ups, and we delete it
        once they turn 18. On supported phones, the app may also ask Apple or
        Google whether the device belongs to someone under 18 (for example
        where a parent has set this up); the answer stays on the phone, and if
        it says under 18, sign-up is closed on that phone. Members can report an
        account they believe belongs to someone under 18; we may pause it until
        the person shows they are 18 or over. If you entered the wrong date of
        birth by mistake, contact{" "}
        <a href="mailto:support@tivorah.com">support@tivorah.com</a>. Contact us if you believe a child has an account so we can
        investigate, protect any necessary evidence and remove or restrict the
        account as appropriate. Our <Link href="/child-safety">Child Safety
        Standards</Link> explain how to report exploitation or abuse concerns.
      </p>

      <h2>Changes and contact</h2>
      <p>
        We may update this policy to reflect product, provider or legal changes.
        We will publish the revised date and provide additional notice, by
        email, in the app or both, where a change materially affects how
        information is handled. Where the law requires your consent for a new
        use of your information, we will ask for it before that use begins.
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
      <LegalNavigation />
    </article>
  );
}
