"use client";
import { FormEvent, useRef, useState } from "react";
import Link from "next/link";
import { useAccount } from "../../hooks/use-account";
import { api } from "../../lib/api/client";
import { LoadingState } from "../ui/loading-state";

export function Enquiry({ id, kind, primary = kind === "items" }: { id: number; kind: "items" | "services"; primary?: boolean }) {
  const { account, loading, signedOut, error, retry } = useAccount();
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");
  const messageId = useRef(crypto.randomUUID());
  const path = kind === "items" ? `/shop/items/${id}` : `/services/${id}`;
  if (loading) return <LoadingState label="Checking your account…" variant="compact" />;
  if (signedOut) return <section className="product-form product-detail-enquiry"><h2>{kind === "items" ? "Ask the seller" : "Ask the provider"}</h2><p>Have a question? Sign in to message {kind === "items" ? "the seller" : "the provider"} on Tivorah.</p><Link className={primary ? "product-primary" : "product-secondary"} href={`/auth/signin?returnTo=${encodeURIComponent(path)}`}>Sign in to enquire</Link></section>;
  if (!account) return <section className="product-notice" role="alert"><p>{error}</p><button className="product-secondary" onClick={retry}>Try again</button></section>;
  async function send(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy || !message.trim()) return;
    setBusy(true);
    setNotice("");
    try {
      const result = await api<{ conversationId: number }>(`/market/products/${id}/contact`, { method: "POST", body: JSON.stringify({ message: message.trim(), clientMessageId: messageId.current }) });
      window.location.assign(`/account/messages/${result.conversationId}`);
    } catch (cause) {
      setNotice(cause instanceof Error ? cause.message : "Could not send your enquiry. Try again.");
      setBusy(false);
    }
  }
  return <section className="product-form product-detail-enquiry"><h2>{kind === "items" ? "Ask the seller" : "Ask the provider"}</h2><p>Your enquiry starts a conversation in your Tivorah account.</p><form onSubmit={send}><label htmlFor={`enquiry-${id}`}>Message</label><textarea id={`enquiry-${id}`} value={message} onChange={(event) => { setMessage(event.target.value); messageId.current = crypto.randomUUID(); }} maxLength={500} rows={3} placeholder="Write your question" required /><button className={primary ? "product-primary" : "product-secondary"} disabled={busy || !message.trim()}>{busy ? "Sending…" : "Send enquiry"}</button></form>{notice ? <p className="product-error" role="alert">{notice}</p> : null}</section>;
}
