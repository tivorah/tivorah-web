import type { Metadata } from "next";
import Link from "next/link";
import { LegalNavigation } from "../legal-navigation";

export const metadata: Metadata = {
  title: "Contact & Complaints",
  description: "Contact Tivorah support, privacy and safety teams or make a complaint.",
};

export default function Contact() {
  return (
    <article className="content">
      <span className="eyebrow">Contact Tivorah</span>
      <h1>Start with the right team.</h1>
      <p>
        Include enough information to identify the issue, but never email your password,
        one-time verification code, full payment-card details or unnecessary identity documents.
      </p>

      <div className="contact-list">
        <section>
          <h2>General support</h2>
          <p>Account access, features, events, listings and ordinary questions.</p>
          <a href="mailto:support@tivorah.com">support@tivorah.com</a>
        </section>
        <section>
          <h2>Privacy</h2>
          <p>Access, correction, deletion and privacy complaints.</p>
          <a href="mailto:privacy@tivorah.com">privacy@tivorah.com</a>
        </section>
        <section>
          <h2>Safety</h2>
          <p>Use in-app reporting where possible. Anyone can also make an external report.</p>
          <a href="mailto:support@tivorah.com?subject=Safety%20report">Send a safety report</a>
        </section>
        <section>
          <h2>Copyright or intellectual property</h2>
          <p>Identify the protected work, the Tivorah material concerned and your authority to act.</p>
          <a href="mailto:support@tivorah.com?subject=Intellectual%20property%20notice">Send an IP notice</a>
        </section>
      </div>

      <h2>How complaints are handled</h2>
      <p>
        We aim to acknowledge complaints within two business days. We may ask for clarification,
        investigate relevant records and provide an outcome or progress update within a reasonable
        period. Complex safety, privacy, fraud or legal matters may take longer. If a complaint is
        about privacy, you may also contact the <a href="https://www.oaic.gov.au/privacy/privacy-complaints">OAIC</a>.
        Eligible online-safety matters may be reported to the <a href="https://www.esafety.gov.au/report">eSafety Commissioner</a>.
      </p>

      <p>
        Account deletion has a separate <Link href="/account-deletion">step-by-step page</Link>.
      </p>
      <LegalNavigation />
    </article>
  );
}
