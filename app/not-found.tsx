import Link from "next/link";
import type { Metadata } from "next";
export const metadata: Metadata = { title: "Page not found", robots: { index: false, follow: true } };

export default function NotFound() {
  return <section className="content recovery-state">
    <span className="eyebrow">Tivorah</span>
    <h1>We couldn’t find that page.</h1>
    <p>The link may be out of date, or the page may have moved.</p>
    <Link className="button" href="/">Go to Tivorah</Link>
    <p>Need help? <Link href="/contact">Contact us</Link>.</p>
  </section>;
}
