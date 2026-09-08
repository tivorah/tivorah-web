import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Delete Your Account",
  description: "How to request deletion of a Tivorah account and data.",
};

export default function AccountDeletion() {
  return (
    <article className="content">
      <span className="eyebrow">Account controls</span>
      <h1>Delete your Tivorah account</h1>
      <p className="legal-meta">
        <strong>Last updated:</strong> 8 September 2026
      </p>

      <h2>Delete in the mobile app</h2>
      <ol>
        <li>Sign in to Tivorah.</li>
        <li>
          Open <strong>Profile</strong>, then <strong>Settings &amp; privacy</strong>.
        </li>
        <li>
          Select <strong>Delete my account</strong>.
        </li>
        <li>
          Enter your password and confirm <strong>Permanently delete</strong>.
        </li>
      </ol>
      <p>
        This action cannot be undone through the app. Active sessions are
        revoked and core account and profile identifiers are removed or
        anonymised.
      </p>

      <h2>If you cannot access the app</h2>
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

      <h2>What may be retained</h2>
      <p>
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
    </article>
  );
}
