"use client";
/* Signed, private chat photo URLs must load directly; Next image optimization cannot cache them. */
/* eslint-disable @next/next/no-img-element */

import Link from "next/link";
import { ChangeEvent, FormEvent, useCallback, useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";
import { adminApiBase } from "../../app/admin/api-base";
import { api } from "../../lib/api/client";
import { usePrivateResource } from "../../hooks/use-private-resource";
import { PAGE_SIZE, Pagination } from "../ui/pagination";
import { AccountSurfaceLoading } from "./surface-loading";
import { AccountGate } from "./gate";

type Participant = { id: number; username: string; firstName: string | null };
type Source = { kind: string; sourceId: number; title: string };
type Conversation = { id: number; category: string; context: { source?: Source } | null; participants: Participant[]; unreadCount?: number; lastMessage?: { content: string; createdAt?: string } | null; e2eeRequired?: boolean };
type Attachment = { url?: string; originalName?: string; mimeType?: string; type?: string };
type Message = { id: number; conversationId: number; senderId: number; content: string | null; createdAt: string; sender?: Participant; attachments?: Attachment[] };
const kindLabel = (kind?: string) => kind === "marketplace_service" ? "Service" : kind === "event" ? "Event" : "Shop";
const initials = (name: string) => name.trim().slice(0, 1).toUpperCase() || "T";
const formatTime = (value?: string) => value ? new Intl.DateTimeFormat("en-AU", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" }).format(new Date(value)) : "";

function useConversationSocket(ids: number[], onMessage: (message: Message) => void) {
  const [live, setLive] = useState(false);
  const onMessageRef = useRef(onMessage);
  onMessageRef.current = onMessage;
  const key = ids.join(",");
  useEffect(() => {
    const base = adminApiBase();
    if (!base || !ids.length) return;
    const socket = io(base, { withCredentials: true, transports: ["websocket"], reconnectionAttempts: 8 });
    socket.on("connect", () => { setLive(true); ids.forEach((conversationId) => socket.emit("chat:join", { conversationId })); });
    socket.on("disconnect", () => setLive(false));
    socket.on("connect_error", () => setLive(false));
    socket.on("chat:message", (message: Message) => { if (ids.includes(message.conversationId)) onMessageRef.current(message); });
    return () => { socket.disconnect(); setLive(false); };
  // The joined conversation set changes only when its IDs change.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);
  return live;
}

function Inbox({ accountId }: { accountId: number }) {
  const [items, setItems] = useState<Conversation[]>([]);
  // 10 conversations per page (shared web list size).
  const [page, setPage] = useState(1);
  const skip = (page - 1) * PAGE_SIZE;
  const [more, setMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [attempt, setAttempt] = useState(0);
  const refresh = useCallback(() => setAttempt((value) => value + 1), []);
  const live = useConversationSocket(items.map((item) => item.id), refresh);
  useEffect(() => {
    const controller = new AbortController();
    if (!items.length) setLoading(true);
    setError("");
    api<{ conversations: Conversation[]; pagination: { isMoreData: boolean } }>(`/chat/conversations?kind=enquiry&skip=${skip}&take=${PAGE_SIZE}`, { signal: controller.signal })
      .then((result) => { if (!controller.signal.aborted) { setItems(result.conversations); setMore(result.pagination.isMoreData); } })
      .catch((cause) => { if (!controller.signal.aborted) setError(cause instanceof Error ? cause.message : "Could not load messages."); })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  // Keep loaded conversations visible during a quiet refresh.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [skip, attempt]);
  useEffect(() => { const timer = window.setInterval(() => { if (document.visibilityState === "visible") refresh(); }, live ? 30000 : 6000); return () => window.clearInterval(timer); }, [live, refresh]);
  if (loading && !items.length) return <AccountSurfaceLoading embedded route="/account/messages" />;
  return <>
    <header className="account-heading message-page-heading"><div><nav className="account-ticket-breadcrumb" aria-label="Breadcrumb"><Link href="/account">Your account</Link><span aria-hidden="true">›</span><span aria-current="page">Messages</span></nav><p className="product-eyebrow">YOUR TIVORAH</p><h1>Messages</h1><p>Conversations about listings, services and events.</p></div><span className="message-live-label" role="status"><span aria-hidden="true" />{live ? "Live updates" : "Checking for new messages"}</span></header>
    {error ? <div className="product-notice" role="alert"><p>{error}</p><button className="product-secondary" onClick={refresh}>Try again</button></div> : null}
    {items.length ? <div className="message-inbox-list" aria-busy={loading || undefined}>{items.map((item) => { const other = item.participants.find((person) => person.id !== accountId); const name = other?.firstName || (other ? `@${other.username}` : "Tivorah member"); return <Link className="message-inbox-row" href={`/account/messages/${item.id}`} key={item.id}><span className="message-avatar" aria-hidden="true">{initials(name)}</span><span className="message-inbox-copy"><span className="message-inbox-top"><strong>{name}</strong><time>{formatTime(item.lastMessage?.createdAt)}</time></span><span className="message-inbox-title">{item.context?.source?.title || "Conversation"}</span><span className="message-inbox-snippet">{item.lastMessage?.content || "Open conversation"}</span></span><span className="message-inbox-meta"><small>{kindLabel(item.context?.source?.kind)}</small>{item.unreadCount ? <strong aria-label={`${item.unreadCount} unread messages`}>{item.unreadCount}</strong> : null}</span></Link>; })}</div> : null}
    {!loading && !error && !items.length ? <div className="product-empty"><h2>No enquiries yet</h2><p>Ask a seller or provider a question to start a conversation.</p><Link className="product-primary" href="/shop">Explore Shop</Link></div> : null}
    <Pagination page={page} hasNext={more} busy={loading} label="Conversation" onChange={(next) => { setPage(next); window.scrollTo({ top: 0, behavior: "smooth" }); }} />
  </>;
}

function Thread({ id, accountId }: { id: number; accountId: number }) {
  const conversation = usePrivateResource<{ conversation: Conversation }>(`/chat/conversations/${id}`);
  const messages = usePrivateResource<{ messages: Message[]; pagination: { isMoreData: boolean } }>(`/chat/conversations/${id}/messages?take=50`);
  const [draft, setDraft] = useState("");
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const photoInput = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");
  const [older, setOlder] = useState<Message[]>([]);
  const [olderSkip, setOlderSkip] = useState(50);
  const [olderMore, setOlderMore] = useState<boolean | null>(null);
  const [olderBusy, setOlderBusy] = useState(false);
  const messageId = useRef(crypto.randomUUID());
  const bottom = useRef<HTMLDivElement>(null);
  const current = conversation.data?.conversation;
  const latestMessages = messages.data;
  const retryMessages = messages.retry;
  const live = useConversationSocket(current?.category === "enquiry" && !current.e2eeRequired ? [id] : [], retryMessages);
  function chooseAttachment(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    const photo = ["image/jpeg", "image/png", "image/webp", "image/gif", "image/avif", "image/heic", "image/heif"].includes(file.type);
    if (!photo) { setNotice("Choose a photo."); return; }
    if (file.size > 20 * 1024 * 1024) { setNotice("Photos must be 20 MB or smaller."); return; }
    setPendingFile(file); setNotice(""); messageId.current = crypto.randomUUID();
  }
  useEffect(() => {
    if (current?.category !== "enquiry" || !latestMessages) return;
    const messageId = Math.max(0, ...latestMessages.messages.filter(message => message.senderId !== accountId).map(message => message.id));
    if (!messageId) return;
    void api(`/chat/conversations/${id}/delivered`, { method: "PUT", body: JSON.stringify({ messageId }) }).catch(() => {});
    const acknowledge = () => {
      if (document.visibilityState === "visible" && document.hasFocus())
        void api(`/chat/conversations/${id}/read`, { method: "PUT", body: JSON.stringify({ messageId }) }).catch(() => {});
    };
    acknowledge();
    document.addEventListener("visibilitychange", acknowledge);
    window.addEventListener("focus", acknowledge);
    return () => { document.removeEventListener("visibilitychange", acknowledge); window.removeEventListener("focus", acknowledge); };
  }, [current?.category, id, latestMessages, accountId]);
  useEffect(() => { const timer = window.setInterval(() => { if (document.visibilityState === "visible") retryMessages(); }, live ? 30000 : 6000); return () => window.clearInterval(timer); }, [live, retryMessages]);
  useEffect(() => { if (latestMessages) bottom.current?.scrollIntoView({ block: "nearest" }); }, [latestMessages]);
  async function send(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy || (!draft.trim() && !pendingFile) || current?.category !== "enquiry" || current.e2eeRequired) return;
    setBusy(true); setNotice("");
    try {
      if (pendingFile) {
        const body = new FormData(); body.append("files", pendingFile); body.append("content", draft.trim()); body.append("clientMessageId", messageId.current);
        await api(`/chat/conversations/${id}/messages/media`, { method: "POST", body });
      } else await api(`/chat/conversations/${id}/messages`, { method: "POST", body: JSON.stringify({ content: draft.trim(), clientMessageId: messageId.current }) });
      setDraft(""); setPendingFile(null); messageId.current = crypto.randomUUID(); messages.retry();
    } catch (cause) { setNotice(cause instanceof Error ? cause.message : "Could not send your message. Try again."); }
    finally { setBusy(false); }
  }
  async function loadOlder() {
    if (olderBusy) return;
    setOlderBusy(true); setNotice("");
    try {
      const result = await api<{ messages: Message[]; pagination: { isMoreData: boolean } }>(`/chat/conversations/${id}/messages?skip=${olderSkip}&take=50`);
      setOlder((current) => [...current, ...result.messages.filter((item) => !current.some((old) => old.id === item.id))]);
      setOlderSkip((value) => value + result.messages.length);
      setOlderMore(result.pagination.isMoreData);
    } catch (cause) { setNotice(cause instanceof Error ? cause.message : "Could not load older messages."); }
    finally { setOlderBusy(false); }
  }
  if ((conversation.loading && !current) || (messages.loading && !messages.data && !messages.error)) return <AccountSurfaceLoading embedded route="/account/messages/thread" />;
  if (conversation.error || !current) return <div className="product-notice" role="alert"><p>{conversation.error || "Conversation unavailable."}</p><button className="product-secondary" onClick={conversation.retry}>Try again</button></div>;
  if (current.category !== "enquiry" || current.e2eeRequired) return <div className="product-notice"><p>This conversation is available in the Tivorah app.</p><Link href="/account/messages">Back to messages</Link></div>;
  const other = current.participants.find((person) => person.id !== accountId);
  const name = other?.firstName || (other ? `@${other.username}` : "Tivorah member");
  const shown = [...(messages.data?.messages || []), ...older].filter((item, index, all) => all.findIndex((candidate) => candidate.id === item.id) === index).reverse();
  return <section className="message-conversation"><nav className="account-ticket-breadcrumb" aria-label="Breadcrumb"><Link href="/account">Your account</Link><span aria-hidden="true">›</span><Link href="/account/messages">Messages</Link><span aria-hidden="true">›</span><span aria-current="page">Conversation</span></nav><header className="message-thread-heading"><span className="message-avatar" aria-hidden="true">{initials(name)}</span><div><p className="product-eyebrow">CONVERSATION WITH</p><h1>{name}</h1></div><span className="message-live-label" role="status"><span aria-hidden="true" />{live ? "Live updates" : "Checking for new messages"}</span></header><div className="message-topic"><span>{kindLabel(current.context?.source?.kind)} enquiry</span><strong>{current.context?.source?.title || "Conversation"}</strong></div>
    {messages.loading && messages.data ? <p className="account-refresh-status" role="status">Updating conversation…</p> : null}
    {messages.error ? <div role="alert" className="product-notice"><p>{messages.error}</p><button className="product-secondary" onClick={messages.retry}>Try again</button></div> : null}
    {(olderMore ?? messages.data?.pagination.isMoreData) ? <button className="product-secondary message-older" disabled={olderBusy} onClick={loadOlder}>{olderBusy ? "Loading…" : "Earlier messages"}</button> : null}
    <div className="message-thread" aria-label="Conversation messages" role="log" aria-live="polite" aria-relevant="additions text">{shown.map((item) => <article className={`message-bubble ${item.senderId === accountId ? "mine" : ""}`} key={item.id}>{item.content ? <p>{item.content}</p> : null}{item.attachments?.map((attachment, index) => { const url = attachment.url?.startsWith("https://") ? attachment.url : null; if (!url) return null; const photo = attachment.mimeType?.startsWith("image/") || attachment.type === "image"; const audio = attachment.mimeType?.startsWith("audio/") || attachment.type === "audio"; return photo ? <a key={index} href={url} target="_blank" rel="noopener noreferrer" aria-label={`Open ${attachment.originalName || "photo"}`}><img className="message-attachment-photo" src={url} alt={attachment.originalName || "Shared photo"} /></a> : audio ? <audio key={index} controls preload="none" src={url} aria-label={attachment.originalName || "Audio message"} /> : null; })}{!item.content && !item.attachments?.length ? <p>Attachment</p> : null}<time>{formatTime(item.createdAt)}</time></article>)}<div ref={bottom} /></div>
    <form className="message-compose" onSubmit={send}><label htmlFor="reply-message">Reply to {name}</label>{pendingFile ? <div className="message-attachment-draft"><span>Photo: {pendingFile.name}</span><button type="button" onClick={() => setPendingFile(null)} disabled={busy} aria-label="Remove attachment">Remove</button></div> : null}<div className="message-compose-row"><input ref={photoInput} className="message-file-input" type="file" accept="image/jpeg,image/png,image/webp,image/gif,image/avif,image/heic,image/heif" onChange={chooseAttachment} aria-label="Choose a photo" /><button type="button" className="message-attach-button" onClick={() => photoInput.current?.click()} disabled={busy || !!messages.error || !messages.data} aria-label="Attach photo" title="Photo">＋</button><textarea id="reply-message" rows={2} maxLength={10000} value={draft} onChange={(event) => { setDraft(event.target.value); messageId.current = crypto.randomUUID(); }} onKeyDown={(event) => { if (event.key === "Enter" && !event.shiftKey && !event.nativeEvent.isComposing) { event.preventDefault(); event.currentTarget.form?.requestSubmit(); } }} placeholder="Write a message" /><button className="product-primary" disabled={(!draft.trim() && !pendingFile) || busy || !!messages.error || !messages.data}>{busy ? "Sending…" : "Send"}</button></div><span className="message-compose-hint">Add a photo · Enter to send</span></form>{notice ? <p className="product-error" role="alert">{notice}</p> : null}
  </section>;
}

export function AccountMessages({ id }: { id?: string }) {
  return <AccountGate>{(account) => id ? /^[1-9]\d*$/.test(id) ? <Thread id={Number(id)} accountId={account.id} /> : <p role="alert">Conversation unavailable.</p> : <Inbox accountId={account.id} />}</AccountGate>;
}
