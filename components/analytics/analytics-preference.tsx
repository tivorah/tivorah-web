"use client";
import { useEffect, useState } from "react";
import { analyticsConfigured, setWebAnalyticsEnabled } from "../../lib/analytics";
import { analyticsChoice, browserAsksNotToTrack } from "../../lib/analytics-choice";

/** The website's "Usage analytics" switch (Cookie Notice and account Settings). Off until turned on. */
export function AnalyticsPreference() {
  const [ready, setReady] = useState(false);
  const [enabled, setEnabled] = useState(false);
  const [blockedByBrowser, setBlockedByBrowser] = useState(false);
  useEffect(() => {
    setBlockedByBrowser(browserAsksNotToTrack());
    setEnabled(analyticsChoice() === "on");
    setReady(true);
    // The consent banner on the same page can change it too.
    const sync = () => setEnabled(analyticsChoice() === "on");
    window.addEventListener("tivorah:analytics-choice", sync);
    return () => window.removeEventListener("tivorah:analytics-choice", sync);
  }, []);
  if (!analyticsConfigured) return <p className="hub-field-hint">Usage analytics is off on this website.</p>;
  if (blockedByBrowser) return <p className="hub-field-hint">Your browser asks websites not to track you, so usage analytics stays off.</p>;
  return (
    <label className="shop-switch">
      <input type="checkbox" role="switch" checked={ready && enabled} disabled={!ready}
        onChange={(event) => { const next = event.currentTarget.checked; setEnabled(next); setWebAnalyticsEnabled(next); }} />
      <span className="shop-switch-track" aria-hidden="true" />
      <span><strong>Usage analytics</strong><small>Off unless you turn it on. Shares how pages are used and errors that happen (never what you type, your messages or your payments) to help improve Tivorah. No cookies are used.</small></span>
    </label>
  );
}
