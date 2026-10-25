"use client";
import { useEffect, useState } from "react";
import { analyticsConfigured, setWebAnalyticsEnabled } from "../../lib/analytics";
import { analyticsTurnedOff, browserAsksNotToTrack } from "../../lib/analytics-choice";

/** The website's "Usage analytics" switch (Cookie Notice and account Settings). */
export function AnalyticsPreference() {
  const [ready, setReady] = useState(false);
  const [enabled, setEnabled] = useState(false);
  const [blockedByBrowser, setBlockedByBrowser] = useState(false);
  useEffect(() => {
    setBlockedByBrowser(browserAsksNotToTrack());
    setEnabled(!analyticsTurnedOff());
    setReady(true);
  }, []);
  if (!analyticsConfigured) return <p className="hub-field-hint">Usage analytics is off on this website.</p>;
  if (blockedByBrowser) return <p className="hub-field-hint">Your browser asks websites not to track you, so usage analytics stays off.</p>;
  return (
    <label className="product-checkbox">
      <input type="checkbox" checked={ready && enabled} disabled={!ready}
        onChange={(event) => { const next = event.currentTarget.checked; setEnabled(next); setWebAnalyticsEnabled(next); }} />
      <span><strong>Usage analytics</strong><br />Share how pages are used (never what you type, your messages or your payments) to help improve Tivorah. No cookies are used.</span>
    </label>
  );
}
