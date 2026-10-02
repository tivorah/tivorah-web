import Link from "next/link";
import { pageMetadata } from "../../lib/site";
import { LegalNavigation } from "../legal-navigation";

export const metadata = pageMetadata("Cookie Notice", "How Tivorah uses cookies and similar browser storage.", "/cookies");

const storage = [
  ["Sign-in session", "Cookie (secure, HTTP-only)", "Keeps you signed in, protects your session and helps prevent fraud and abuse.", "Until you sign out or the session expires"],
  ["Signed-in hint", "Browser storage", "A simple yes/no flag so the menu shows the right links straight away. It contains no account details.", "Until you sign out"],
  ["Checkout and booking progress", "Browser storage (this tab only)", "Remembers an in-progress ticket or appointment checkout so a refresh or retry does not charge you twice.", "Until the tab is closed or checkout ends"],
  ["Ticket access", "Browser storage (this tab only)", "Lets you view tickets you just bought without an account.", "Until the tab is closed"],
  ["Dismissed messages", "Browser storage (this tab only)", "Stops the same tip appearing again after you close it.", "Until the tab is closed"],
] as const;

export default function Cookies() {
  return (
    <article className="content">
      <span className="eyebrow">Privacy</span>
      <h1>Cookie Notice</h1>
      <p className="legal-meta"><strong>Last updated:</strong> 2 October 2026</p>
      <p>
        This notice explains the cookies and similar browser storage used on tivorah.com. The
        Tivorah mobile app uses device storage and secure storage instead of browser cookies;
        those practices are described in our <Link href="/privacy">Privacy Policy</Link>.
      </p>

      <div className="legal-callout">
        <strong>The short version</strong>
        <p>
          We only use what is needed to make the website work and keep your account safe. We do
          not use advertising cookies, cross-site tracking or behavioural analytics on the
          website.
        </p>
      </div>

      <h2>What we use</h2>
      <div className="legal-table-wrap">
        <table className="legal-table">
          <thead><tr><th scope="col">Purpose</th><th scope="col">Type</th><th scope="col">Why</th><th scope="col">How long</th></tr></thead>
          <tbody>{storage.map(([purpose, type, why, length]) => <tr key={purpose}><th scope="row">{purpose}</th><td>{type}</td><td>{why}</td><td>{length}</td></tr>)}</tbody>
        </table>
      </div>
      <p>
        All of the above are strictly necessary for a feature you ask for, so they do not have an
        on/off setting. You can block or clear them in your browser, but you may be signed out or
        a checkout may not work.
      </p>

      <h2>Other services on our pages</h2>
      <p>
        Some pages include services run by other companies, which may set their own cookies or
        receive your IP address and browser details under their own privacy terms:
      </p>
      <ul>
        <li><strong>Google Maps</strong> — the map shown on an event page is provided by Google.</li>
        <li><strong>Stripe</strong> — when you pay, you complete checkout on Stripe&apos;s secure payment page.</li>
        <li><strong>Google and Apple sign-in</strong> — if you choose to sign in with them.</li>
      </ul>
      <p>
        Our hosting and security providers, such as Netlify and Cloudflare, also process
        essential request, security and delivery information when serving a page.
      </p>

      <h2>If our use changes</h2>
      <p>
        We will update this notice before adding advertising, cross-site tracking or optional
        website analytics. Where consent is required, those technologies will stay off until you
        make a choice, and we will never describe optional tracking as “necessary”.
      </p>

      <h2>Contact</h2>
      <p>
        Send cookie or privacy questions to{" "}
        <a href="mailto:privacy@tivorah.com"><strong>privacy@tivorah.com</strong></a>.
      </p>
      <LegalNavigation />
    </article>
  );
}
