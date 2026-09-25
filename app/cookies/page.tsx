import { pageMetadata } from "../../lib/site";
import { LegalNavigation } from "../legal-navigation";

export const metadata = pageMetadata("Cookie Notice", "How Tivorah uses cookies and similar browser storage.", "/cookies");

export default function Cookies() {
  return (
    <article className="content">
      <span className="eyebrow">Privacy</span>
      <h1>Cookie Notice</h1>
      <p className="legal-meta"><strong>Last updated:</strong> 15 September 2026</p>
      <p>
        This notice explains browser cookies and similar storage used on tivorah.com.
        The Tivorah mobile app uses device storage and secure storage rather than browser
        cookies for many equivalent functions; those practices are described in our Privacy Policy.
      </p>

      <h2>What we currently use</h2>
      <p>
        The public website does not currently use advertising cookies or non-essential
        behavioural analytics cookies. The restricted Tivorah administration portal uses
        strictly necessary authentication and security cookies to keep authorised staff signed
        in, protect the session and prevent abuse. Netlify and our infrastructure providers may
        also process essential request, security and delivery information when serving a page.
      </p>

      <h2>Strictly necessary storage</h2>
      <p>
        Necessary cookies cannot be disabled through a Tivorah preference control because the
        protected feature would not function without them. You can block or clear them in your
        browser, but doing so may sign you out or prevent the protected portal from working.
      </p>

      <h2>If our use changes</h2>
      <p>
        We will update this notice before adding advertising, cross-site tracking or optional
        website analytics. Where consent is required, those technologies will remain off until
        a visitor makes a choice. We will not describe optional tracking as “necessary”.
      </p>

      <h2>Contact</h2>
      <p>
        Send cookie or privacy questions to <a href="mailto:privacy@tivorah.com">privacy@tivorah.com</a>.
      </p>
      <LegalNavigation />
    </article>
  );
}
