"use client";

import Link from "next/link";
import { useState } from "react";
import { useAccount } from "../../hooks/use-account";
import { api } from "../../lib/api/client";

export function MessageShopLink({ slug, ownerUsername }: { slug: string; ownerUsername?: string }) {
  const { account, loading, signedOut, error, retry } = useAccount();
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");
  const label = "Message shop";
  // The shop's main action, filled like the app's (dark on light, purple on dark).
  const icon = <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"><path d="M5 5h14a1.5 1.5 0 0 1 1.5 1.5v9A1.5 1.5 0 0 1 19 17h-8l-4.5 3.5V17H5a1.5 1.5 0 0 1-1.5-1.5v-9A1.5 1.5 0 0 1 5 5z" /></svg>;

  if (loading) return <span className="shop-message-placeholder tivorah-shimmer" role="status" aria-label="Checking messaging availability" />;
  // The owner's main action is managing their shop (as in the app), filled the same way.
  if (account && ownerUsername && account.username.toLowerCase() === ownerUsername.toLowerCase()) return <Link className="product-primary shop-message-button" href="/business/shop"><svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9" /><path d="M16.5 3.5a2.1 2.1 0 1 1 3 3L7 19l-4 1 1-4Z" /></svg>Manage shop</Link>;
  if (signedOut) return <Link className="product-primary shop-message-button" href={`/auth/signin?returnTo=${encodeURIComponent(`/shops/${slug}`)}`} aria-label={`${label} (sign in first)`}>{icon}Message</Link>;
  if (!account) return <span className="shop-message-error" role="alert">{error || "Messaging is unavailable."} <button type="button" className="shop-message-link" onClick={retry}>Try again</button></span>;

  async function openEnquiry() {
    if (busy) return;
    setBusy(true);
    setNotice("");
    try {
      const result = await api<{ conversationId: number }>(`/market/shops/${encodeURIComponent(slug)}/contact`, { method: "POST", body: JSON.stringify({}) });
      window.location.assign(`/account/messages/${result.conversationId}`);
    } catch (cause) {
      setNotice(cause instanceof Error ? cause.message : "Could not open the enquiry. Try again.");
      setBusy(false);
    }
  }

  return <><button type="button" className="product-primary shop-message-button" onClick={openEnquiry} disabled={busy} aria-busy={busy || undefined} aria-label={busy ? "Opening shop enquiry" : label}>{busy ? <span className="button-progress" aria-hidden="true" /> : icon}{busy ? "Opening…" : "Message"}</button>{notice ? <span className="shop-message-error" role="alert">{notice}</span> : null}</>;
}
