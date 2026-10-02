"use client";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
export function SiteFooter() {
  const path = usePathname();
  if (/^\/(events|services|shop|shops|hubs|account|business|admin|auth|connect|event-groups|event-orders|event-tickets|event-ticket-transfer)(\/|$)/.test(path)) return null;
  return (
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
                  <Link href="/why-tivorah">Why Tivorah</Link>
                  <Link href="/#features">Features</Link>
                  <Link href="/hub-organisers">Hub organisers</Link>
                  <Link href="/service-providers">Service providers</Link>
                  <Link href="/contact">Contact us</Link>
                  <Link href="/#updates">Subscribe to updates</Link>
                </nav>
                <nav aria-label="Legal and trust">
                  <strong>Legal &amp; trust</strong>
                  <Link href="/legal">Legal centre</Link>
                  <Link href="/privacy">Privacy</Link>
                  <Link href="/terms">Terms</Link>
                  <Link href="/community-guidelines">Community guidelines</Link>
                  <Link href="/safety">Safety centre</Link>
                  <Link href="/child-safety">Child safety</Link>
                  <Link href="/hub-organisers">Organiser rules</Link>
                  <Link href="/service-providers">Provider rules</Link>
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
            <div className="page-shell footer-bottom">
              <div className="footer-business">
                <strong>TIVORAH PTY LTD</strong>
                <span>ABN 94 702 094 844</span>
                <span>ACN 702 094 844</span>
                <span>Adelaide, South Australia, Australia</span>
              </div>
              <div className="footer-hometown">
                <span>Proudly built in Adelaide, South Australia.</span>
                <span>Made for belonging across Australia.</span>
              </div>
            </div>
          </footer>
  );
}
