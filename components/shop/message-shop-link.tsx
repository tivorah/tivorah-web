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

  if (loading) return <span className="shop-message-placeholder" aria-label="Checking messaging availability" />;
  if (account && ownerUsername && account.username.toLowerCase() === ownerUsername.toLowerCase()) return null;
  if (signedOut) return <Link className="shop-message-link" href={`/auth/signin?returnTo=${encodeURIComponent(`/shops/${slug}`)}`}>{label} <span aria-hidden="true">→</span></Link>;
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

  return <span className="shop-message-action"><button type="button" className="shop-message-link" onClick={openEnquiry} disabled={busy} aria-label={busy ? "Opening shop enquiry" : label}>{busy ? "Opening enquiry…" : label} <span aria-hidden="true">→</span></button>{notice ? <span className="shop-message-error" role="alert">{notice}</span> : null}</span>;
}
