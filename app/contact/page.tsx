import type { Metadata } from "next";
import Link from "next/link";
import { LegalNavigation } from "../legal-navigation";
import { ContactForm } from "./contact-form";

export const metadata: Metadata = {
  title: "Contact & Complaints",
  description: "Contact Tivorah support, privacy and safety teams or make a complaint.",
  alternates: { canonical: "/contact" },
};

export default function Contact() {
  return (
    <article className="content">
      <span className="eyebrow">Contact Tivorah</span>
      <h1>Start with the right team.</h1>
      <p>Choose a topic and send your message here. Tivorah will reply to the email address you provide.</p>
      <p><strong>TIVORAH PTY LTD</strong><br />ABN 94 702 094 844<br />Adelaide, South Australia, Australia<br /><a href="mailto:hello@tivorah.com">hello@tivorah.com</a></p>

      <ContactForm />

      <div className="contact-list">
        <section>
          <h2>General enquiries</h2>
          <p>Questions about Tivorah, partnerships, events or listing your services.</p>
          <p>Use the form and select <strong>General enquiry</strong>, <strong>Events and ticketing</strong>, or <strong>Service provider or partnership</strong>.</p>
        </section>
        <section>
          <h2>General support</h2>
          <p>Account access, features, events, listings and ordinary questions.</p>
          <p>Use the form and select <strong>Account or app support</strong>.</p>
        </section>
        <section>
          <h2>Privacy</h2>
          <p>Access, correction, deletion and privacy complaints.</p>
          <p>Use the form and select <strong>Privacy request</strong>.</p>
        </section>
        <section>
          <h2>Safety</h2>
          <p>Use in-app reporting where possible. Anyone can also make an external report.</p>
          <p>Use the form and select <strong>Safety report</strong>. Call emergency services on 000 if someone is in immediate danger.</p>
        </section>
      </div>

      <p className="contact-email-fallback">If the form is unavailable, email <a href="mailto:hello@tivorah.com">hello@tivorah.com</a> for general enquiries or <a href="mailto:support@tivorah.com">support@tivorah.com</a> for support.</p>

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
