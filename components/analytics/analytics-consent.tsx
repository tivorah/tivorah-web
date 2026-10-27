"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { analyticsConfigured, setWebAnalyticsEnabled } from "../../lib/analytics";
import { shouldAskForAnalytics } from "../../lib/analytics-choice";
import "./analytics-consent.css";

// Asks once whether the website may use optional usage analytics. Nothing is sent until the visitor
// chooses Allow; "No thanks" is just as easy, and the choice can be changed later in the Cookie
// Notice or account Settings. Not shown when the browser already asks not to be tracked.
export function AnalyticsConsent() {
  const path = usePathname();
  const [open, setOpen] = useState(false);
  useEffect(() => { setOpen(shouldAskForAnalytics(analyticsConfigured)); }, []);
  if (!open || path.startsWith("/admin")) return null;
  const choose = (enabled: boolean) => {
    setWebAnalyticsEnabled(enabled);
    window.dispatchEvent(new Event("tivorah:analytics-choice"));
    setOpen(false);
  };
  return <section className="analytics-consent" role="region" aria-label="Usage analytics choice">
    <div className="analytics-consent-copy">
      <strong>Help us improve Tivorah?</strong>
      <p>With your OK, we use PostHog (in the United States) to see whether pages load and work, and to catch errors. No cookies, no ads, never what you type or your messages. <Link href="/cookies">Cookie Notice</Link></p>
    </div>
    <div className="analytics-consent-actions">
      <button type="button" className="analytics-consent-button" onClick={() => choose(false)}>No thanks</button>
      <button type="button" className="analytics-consent-button" onClick={() => choose(true)}>Allow</button>
    </div>
  </section>;
}
