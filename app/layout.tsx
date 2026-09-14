import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import "./styles.css";
import "./brand.css";
import "./hero-preview.css";
import "./product-tour.css";
import "./centered-layout.css";
import "./journey-polish.css";
import "./legal.css";
import { ZoomLayoutController } from "./zoom-layout-controller";
import { SiteHeader } from "./site-header";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "https://tivorah.com"),
  title: { default: "Tivorah — Your community, wherever you are in Australia", template: "%s | Tivorah" },
  description:
    "Communities with real rules and members you can place. Buy, sell, find work and turn up for each other alongside people who share your background — across Australia.",
  icons: { icon: "/tivorah-mark.png", apple: "/tivorah-mark.png" },
  openGraph: {
    type: "website",
    siteName: "Tivorah",
    locale: "en_AU",
    title: "Tivorah — Find your people. Build your life in Australia.",
    description:
      "Tivorah connects people new to Australia with communities already here.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <ZoomLayoutController />
        <SiteHeader />
        <main>{children}</main>
        <footer>
          <div className="page-shell footer-inner">
            <div>
              <Image
                className="footer-logo"
                src="/tivorah-logo.png"
                alt="Tivorah"
                width={708}
                height={226}
              />
              <p>Community, opportunity and belonging in one place.</p>
            </div>
            <div className="footer-links">
              <nav aria-label="Tivorah">
                <strong>Company</strong>
                <Link href="/about">About</Link>
                <Link href="/contact">Contact &amp; complaints</Link>
                <Link href="/#updates">Join the waiting list</Link>
              </nav>
              <nav aria-label="Legal and trust">
                <strong>Legal &amp; trust</strong>
                <Link href="/legal">Legal centre</Link>
                <Link href="/privacy">Privacy</Link>
                <Link href="/terms">Terms</Link>
                <Link href="/community-guidelines">Community guidelines</Link>
                <Link href="/safety">Safety centre</Link>
              </nav>
              <nav aria-label="Account and access">
                <strong>Account &amp; access</strong>
                <Link href="/account-deletion">Delete account</Link>
                <Link href="/unsubscribe">Unsubscribe</Link>
                <Link href="/cookies">Cookies</Link>
                <Link href="/accessibility">Accessibility</Link>
                <Link href="/disclaimer">Important disclaimer</Link>
              </nav>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
