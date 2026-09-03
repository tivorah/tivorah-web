import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import "./styles.css";
import "./brand.css";
import "./hero-preview.css";
import "./product-tour.css";
import "./centered-layout.css";
import "./journey-polish.css";
import { ZoomLayoutController } from "./zoom-layout-controller";
import { SiteHeader } from "./site-header";

export const metadata: Metadata = {
  title: { default: "Tivorah — Your community, wherever you are in Australia", template: "%s | Tivorah" },
  description:
    "Communities with real rules and members you can place. Buy, sell, find work and turn up for each other alongside people who share your background — across Australia.",
  icons: { icon: "/tivorah-mark.png", apple: "/tivorah-mark.png" },
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
            <nav>
              <Link href="/#about">About</Link>
              <Link href="/privacy">Privacy</Link>
              <Link href="/terms">Terms</Link>
              <Link href="/community-guidelines">Community guidelines</Link>
              <Link href="/account-deletion">Delete account</Link>
            </nav>
          </div>
        </footer>
      </body>
    </html>
  );
}
