import { pageMetadata } from "../../lib/site";
import { LegalNavigation } from "../legal-navigation";

export const metadata = pageMetadata("Delete Your Account", "How to request deletion of a Tivorah account and data.", "/account-deletion");

export default function AccountDeletion() {
  return (
    <article className="content">
      <span className="eyebrow">Account controls</span>
      <h1>Delete your Tivorah account</h1>
      <p className="legal-meta">
        <strong>Last updated:</strong> 23 October 2026
      </p>

      <h2>Delete in the mobile app</h2>
      <ol>
        <li>Sign in to Tivorah.</li>
        <li>
          Open <strong>Profile</strong>, then <strong>Settings &amp; privacy</strong>.
        </li>
        <li>
          Select <strong>Delete account</strong>.
        </li>
        <li>
          For a password account, enter your password. For an Apple account,
          sign in with Apple again if prompted. Confirm <strong>Permanently delete account</strong>.
        </li>
      </ol>
      <p>
        This action cannot be undone through the app. Active sessions are
        revoked and core account and profile identifiers are removed or
        anonymised.
      </p>

      <h2>Delete on the website</h2>
      <ol>
        <li>Sign in at tivorah.com.</li>
        <li>Open <strong>Your account</strong>, then <strong>Profile &amp; security</strong>.</li>
        <li>Under <strong>Delete account</strong>, confirm your password and select <strong>Permanently delete my account</strong>.</li>
      </ol>
      <p>
        Deleting your account also removes your shop page. If you have upcoming events with
        bookings, or upcoming appointments (as a provider or a customer), cancel them or let them
        finish first, so anyone who paid is refunded under the refund policy and the Australian
        Consumer Law. Orders for your items that are still in progress need to be completed,
        declined or cancelled first. Orders you&apos;re buying don&apos;t hold you up: they&apos;re
        cancelled when you delete, and the seller is told. You&apos;ll be reminded if you try to
        delete before then. Records we must keep
        for refunds, tax and disputes are kept as explained below.
      </p>

      <h2>If you cannot access the app or website</h2>
      <p>
        Email{" "}
        <a href="mailto:privacy@tivorah.com?subject=Tivorah%20account%20deletion%20request">
          <strong>privacy@tivorah.com</strong>
        </a>{" "}
        from the address associated with your account and use the subject
        &quot;Tivorah account deletion request&quot;. Include your username, but
        never send your password or verification code. We will need to verify
        that you control the account before acting on the request.
      </p>

      <h2>What happens next</h2>
      <p>
        In-app deletion begins immediately by revoking active sessions and
        de-identifying the core account. Email requests are acknowledged after
        identity verification and completed within a reasonable period, subject
        to any lawful reason to retain limited information. We will tell you if
        we need more information or cannot delete a particular record.
      </p>

      <h2>What is removed</h2>
      <p>
        Deleting your account signs you out everywhere and removes or
        de-identifies your email, username, phone, name, bio, photo (including
        the stored file), address, date of birth, gender, country, home
        location and interests; your devices and notification settings; your
        connections and friend requests; your Hub memberships and join
        requests; and your shop and employer profile. Your active listings
        and upcoming events without bookings are taken down, and your open jobs
        are closed. A Hub you created stays for its members.
      </p>

      <h2>What may be retained</h2>
      <p>
        Your posts and messages may remain, shown as &ldquo;Deleted User&rdquo;.
        Some contributions or limited records may remain in anonymised or
        restricted form where reasonably needed to preserve conversations and
        transaction integrity, comply with legal or tax obligations, process
        refunds, prevent fraud, enforce safety decisions, maintain security
        audits or resolve disputes. Backups may retain protected copies until
        they are overwritten through the ordinary backup cycle.
      </p>
      <p>
        Read the <a href="/privacy">Privacy Policy</a> for more information
        about retention, access and correction requests.
      </p>
      <LegalNavigation />
    </article>
  );
}
