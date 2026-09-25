import { pageMetadata } from "../../lib/site";
import { LegalNavigation } from "../legal-navigation";

export const metadata = pageMetadata("Accessibility", "Tivorah's accessibility commitment and feedback channel.", "/accessibility");

export default function Accessibility() {
  return (
    <article className="content">
      <span className="eyebrow">Access</span>
      <h1>Accessibility at Tivorah</h1>
      <p className="legal-meta"><strong>Last updated:</strong> 15 September 2026</p>
      <p>
        Tivorah is working toward an experience that people can use with assistive technology,
        keyboard navigation, browser zoom and system text-size settings. Our target for public
        web content is WCAG 2.2 Level AA. This is a commitment and direction, not a claim that
        every current screen has already achieved full conformance.
      </p>

      <h2>What we are working to support</h2>
      <ul>
        <li>keyboard access and visible focus indicators;</li>
        <li>screen-reader names, headings and logical reading order;</li>
        <li>text resizing and responsive layouts without loss of essential content;</li>
        <li>sufficient colour contrast without relying on colour alone; and</li>
        <li>reduced-motion preferences and accessible error recovery.</li>
      </ul>

      <h2>Report a barrier</h2>
      <p>
        Email <a href="mailto:support@tivorah.com?subject=Accessibility%20feedback">support@tivorah.com</a> and
        tell us the page or app screen, what you were trying to do, your device or assistive
        technology if you are comfortable sharing it, and the problem encountered. We aim to
        acknowledge accessibility reports within two business days and will provide an
        alternative way to access important information where reasonably possible.
      </p>
      <LegalNavigation />
    </article>
  );
}
