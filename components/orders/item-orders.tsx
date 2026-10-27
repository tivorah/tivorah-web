"use client";
import { FormEvent, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { AccountGate } from "../account/gate";
import { usePrivateResource } from "../../hooks/use-private-resource";
import { api } from "../../lib/api/client";
import { LoadingState } from "../ui/loading-state";
import { defaultSellerNote, sellerNoteFor } from "./existing-order";
import "./item-orders.css";

/**
 * Item order requests (stage 1, payment arranged with the seller). Buyers follow their orders,
 * cancel before they're ready and review completed ones; sellers accept or decline, mark ready
 * and complete. API: /market/item-orders. Mobile counterpart: app/market/orders.tsx.
 */
export type ItemOrder = {
  id: number; productId: number | null; productTitle: string; image: string | null; quantity: number; fulfilment: "pickup" | "delivery";
  deliveryAddress: string | null; note: string | null; unitPriceCents: number; deliveryFeeCents: number; totalCents: number; currency: string;
  status: "requested" | "accepted" | "declined" | "cancelled" | "ready" | "completed"; responseNote: string | null; cancelledBy: "buyer" | "seller" | null;
  createdAt: string; reviewed: boolean; counterparty: { username: string; firstName: string };
};
type Role = "buyer" | "seller";
type Action = "accept" | "decline" | "ready" | "complete" | "cancel";

const money = (cents: number, currency = "AUD") => new Intl.NumberFormat("en-AU", { style: "currency", currency }).format(cents / 100);
const when = (value: string) => new Intl.DateTimeFormat("en-AU", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" }).format(new Date(value));
export const statusLabel: Record<ItemOrder["status"], string> = { requested: "Waiting for the seller", accepted: "Accepted", ready: "Ready", completed: "Completed", declined: "Declined", cancelled: "Cancelled" };
const sellerLabel: Partial<Record<ItemOrder["status"], string>> = { requested: "New request" };
const tabs: { key: string; label: string; statuses: ItemOrder["status"][] }[] = [
  { key: "new", label: "New", statuses: ["requested"] },
  { key: "active", label: "In progress", statuses: ["accepted", "ready"] },
  { key: "done", label: "Done", statuses: ["completed", "declined", "cancelled"] },
];

export function ItemOrders({ role }: { role: Role }) {
  return <AccountGate>{() => <OrdersList initialRole={role} />}</AccountGate>;
}

function OrdersList({ initialRole }: { initialRole: Role }) {
  const [role, setRole] = useState<Role>(initialRole);
  // ?product=ID: one item's orders. ?order=ID: the order a notification is about (opened and highlighted).
  const search = useSearchParams();
  const product = /^\d+$/.test(search.get("product") ?? "") ? search.get("product") : null;
  const focusId = Number(search.get("order")) || null;
  const { data, loading, error, retry } = usePrivateResource<{ orders: ItemOrder[] }>(`/market/item-orders?role=${role}${product ? `&productId=${product}` : ""}`);
  const [tab, setTab] = useState(role === "seller" ? "new" : "all");
  const target = focusId ? data?.orders.find((order) => order.id === focusId) : undefined;
  const [tabFor, setTabFor] = useState<number | null>(null);
  if (target && tabFor !== target.id) {
    setTabFor(target.id);
    setTab(target.status === "requested" ? (role === "seller" ? "new" : "all") : target.status === "accepted" || target.status === "ready" ? "active" : "done");
  }
  const orders = data?.orders ?? [];
  const shown = tab === "all" ? orders : orders.filter((order) => tabs.find((item) => item.key === tab)?.statuses.includes(order.status));
  function switchRole(next: Role) {
    if (next === role) return;
    setRole(next);
    setTab(next === "seller" ? "new" : "all");
    setTabFor(null);
  }
  return <section className="item-orders" aria-labelledby="item-orders-title">
    <header className="account-heading">
      <p className="product-eyebrow">YOUR TIVORAH</p>
      <h1 id="item-orders-title">Your orders</h1>
      <p>Items you ordered and orders customers sent for your items. Payment is arranged directly with the buyer or seller.</p>
    </header>
    {!product ? <div className="item-orders-role-tabs" role="group" aria-label="Order type">
      <button type="button" aria-pressed={role === "buyer"} onClick={() => switchRole("buyer")}>Orders I sent</button>
      <button type="button" aria-pressed={role === "seller"} onClick={() => switchRole("seller")}>Orders I received</button>
    </div> : null}
    {product ? <p className="item-orders-filter">Orders for {data?.orders[0]?.productTitle ?? "this item"} <a href={role === "seller" ? "/business/orders" : "/account/item-orders"}>Show all</a></p> : null}
    <nav className="item-orders-tabs" aria-label="Order status">
      {(role === "buyer" ? [{ key: "all", label: "All", statuses: [] as ItemOrder["status"][] }, ...tabs] : tabs).map((item) => {
        const count = item.key === "all" ? orders.length : orders.filter((order) => item.statuses.includes(order.status)).length;
        return <button key={item.key} type="button" aria-pressed={tab === item.key} onClick={() => setTab(item.key)}>{item.label}<span>{count}</span></button>;
      })}
    </nav>
    {loading && !data ? <LoadingState label="Loading orders…" variant="compact" />
      : error && !data ? <p role="alert">{error} <button type="button" className="product-secondary" onClick={retry}>Try again</button></p>
      : !shown.length ? <div className="product-empty"><h2>{orders.length ? "Nothing here" : "No orders yet"}</h2><p>{role === "seller" ? "Turn on “Take order requests” on an item, and orders will appear here." : "When you order an item, you can follow it here."}</p>{role === "buyer" ? <Link className="product-primary" href="/shop">Explore Shop</Link> : <Link className="product-secondary" href="/business?view=listings">Your listings</Link>}</div>
      : <ul className="item-orders-list">{shown.map((order) => <OrderCard key={order.id} order={order} role={role} onChanged={retry} highlighted={order.id === focusId} />)}</ul>}
  </section>;
}

function OrderCard({ order, role, onChanged, highlighted = false }: { order: ItemOrder; role: Role; onChanged: () => void; highlighted?: boolean }) {
  const card = useRef<HTMLLIElement>(null);
  useEffect(() => { if (highlighted) card.current?.scrollIntoView({ block: "center", behavior: "smooth" }); }, [highlighted]);
  const [busy, setBusy] = useState<Action | "review" | "chat" | null>(null);
  const [problem, setProblem] = useState("");
  const [note, setNote] = useState(() => defaultSellerNote(order.counterparty.firstName));
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  async function act(action: Action) {
    if (busy) return;
    if ((action === "cancel" || action === "decline") && !window.confirm(action === "decline" ? "Decline this order?" : "Cancel this order?")) return;
    setBusy(action); setProblem("");
    const sent = action === "accept" || action === "decline" ? sellerNoteFor(action, note, order.counterparty.firstName) : undefined;
    try { await api(`/market/item-orders/${order.id}/${action}`, { method: "POST", body: JSON.stringify(sent ? { note: sent } : {}) }); setNote(""); onChanged(); }
    catch (cause) { setProblem(cause instanceof Error ? cause.message : "That didn’t work. Please try again."); }
    finally { setBusy(null); }
  }
  async function review(event: FormEvent) {
    event.preventDefault();
    if (!rating || busy) return;
    setBusy("review"); setProblem("");
    try { await api(`/market/item-orders/${order.id}/review`, { method: "POST", body: JSON.stringify({ rating, comment: comment.trim() || undefined }) }); onChanged(); }
    catch (cause) { setProblem(cause instanceof Error ? cause.message : "Your review couldn’t be posted."); }
    finally { setBusy(null); }
  }
  // The same enquiry chat as their order notes (created if needed), so the conversation carries on there.
  async function openChat() {
    if (busy) return;
    setBusy("chat"); setProblem("");
    try {
      const { conversationId } = await api<{ conversationId: number }>(`/market/item-orders/${order.id}/chat`, { method: "POST" });
      window.location.assign(`/account/messages/${conversationId}`);
    } catch (cause) { setProblem(cause instanceof Error ? cause.message : "The chat didn’t open. Please try again."); setBusy(null); }
  }
  const awaitingSeller = role === "seller" && order.status === "requested";
  const sellerInProgress = role === "seller" && (order.status === "accepted" || order.status === "ready");
  const other = role === "seller" ? order.counterparty.firstName : `@${order.counterparty.username}`;
  const status = (role === "seller" && sellerLabel[order.status]) || statusLabel[order.status];
  const buyerCancels = role === "buyer" && (order.status === "requested" || order.status === "accepted");
  const cancellable = sellerInProgress || buyerCancels;
  return <li ref={card} className={`item-order-card is-${order.status}${highlighted ? " is-highlighted" : ""}`} aria-current={highlighted ? "true" : undefined}>
    <div className="item-order-card-head">
      {order.image ? <span className="item-order-thumb" style={{ backgroundImage: `url(${JSON.stringify(order.image)})` }} aria-hidden="true" /> : <span className="item-order-thumb" aria-hidden="true">🛍️</span>}
      <div>
        <strong>{order.quantity} × {order.productId ? <Link href={`/shop/items/${order.productId}`}>{order.productTitle}</Link> : order.productTitle}</strong>
        <span>{role === "seller" ? `From ${order.counterparty.firstName}` : `From @${order.counterparty.username}`} · {when(order.createdAt)}</span>
      </div>
      <span className={`item-order-status is-${order.status}`}>{status}</span>
    </div>
    <dl className="item-order-facts">
      <div><dt>{order.fulfilment === "delivery" ? "Delivery" : "Pickup"}</dt><dd>{order.fulfilment === "delivery" ? order.deliveryAddress : "Collect from the seller"}</dd></div>
      <div><dt>Total</dt><dd>{money(order.totalCents, order.currency)}{order.deliveryFeeCents ? ` (incl. ${money(order.deliveryFeeCents, order.currency)} delivery)` : ""}</dd></div>
      {order.note ? <div><dt>{role === "seller" ? "Buyer’s note" : "Your note"}</dt><dd>{order.note}</dd></div> : null}
      {order.responseNote ? <div><dt>{role === "seller" ? "Your note" : "Seller’s note"}</dt><dd>{order.responseNote}</dd></div> : null}
      {order.status === "cancelled" && order.cancelledBy ? <div><dt>Cancelled by</dt><dd>{order.cancelledBy === role ? "You" : role === "seller" ? "The buyer" : "The seller"}</dd></div> : null}
    </dl>
    {problem ? <p className="product-error" role="alert">{problem}</p> : null}
    {role === "buyer" && order.status === "completed" && !order.reviewed && order.productId ? <form className="item-order-review" onSubmit={review}>
      <fieldset><legend>How was it?</legend>
        <div className="item-order-stars">{[1, 2, 3, 4, 5].map((value) => <button key={value} type="button" aria-pressed={rating === value} aria-label={`${value} star${value === 1 ? "" : "s"}`} className={value <= rating ? "is-on" : ""} onClick={() => setRating(value)}>★</button>)}</div>
      </fieldset>
      <label><span className="shop-label">Your review <span className="shop-optional">Optional</span></span><textarea value={comment} onChange={(event) => setComment(event.target.value)} maxLength={1000} rows={2} placeholder="What did you like?" /></label>
      <button className="product-primary item-order-button" disabled={!rating || !!busy}>{busy === "review" ? "Posting…" : "Post review"}</button>
    </form> : null}
    {role === "buyer" && order.reviewed ? <p className="service-section-note">Thanks for your review.</p> : null}
    {role === "seller" && order.status === "requested" ? <label className="item-order-note"><span className="shop-label">Note to the buyer <span className="shop-optional">Optional</span></span><textarea value={note} onChange={(event) => setNote(event.target.value)} maxLength={500} rows={3} placeholder="e.g. Ready at 6pm" /></label> : null}
    {/* Bottom of the card: this step's buttons (right-aligned), then a quiet link to their enquiry
        chat on the left and "Cancel order" as a text link on the right. */}
    <div className="item-order-footer">
      {role === "seller" && order.status === "requested" ? <div className="item-order-actions">
        <button type="button" className="product-secondary item-order-button" disabled={!!busy} onClick={() => void act("decline")}>{busy === "decline" ? "Declining…" : "Decline"}</button>
        <button type="button" className="product-primary item-order-button" disabled={!!busy} onClick={() => void act("accept")}>{busy === "accept" ? "Accepting…" : "Accept"}</button>
      </div> : null}
      {sellerInProgress ? <div className="item-order-actions">
        <button type="button" className={`${order.status === "ready" ? "product-primary" : "product-secondary"} item-order-button`} disabled={!!busy} onClick={() => void act("complete")}>{busy === "complete" ? "Saving…" : "Complete"}</button>
        {order.status === "accepted" ? <button type="button" className="product-primary item-order-button" disabled={!!busy} onClick={() => void act("ready")}>{busy === "ready" ? "Saving…" : "Mark ready"}</button> : null}
      </div> : null}
      {!awaitingSeller || cancellable ? <div className="item-order-footer-row">
          {/* Not while the seller still has to accept or decline: those buttons come first. */}
          {!awaitingSeller ? <button type="button" className="item-order-chat" aria-label={`Message ${other} about this order`} aria-busy={busy === "chat"} disabled={!!busy} onClick={() => void openChat()}>
            <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12a8 8 0 0 1-11.6 7.1L4 20.5l1.4-4.6A8 8 0 1 1 21 12Z" /></svg>
            <span>{busy === "chat" ? "Opening…" : "Message"}</span>
          </button> : <span />}
          {cancellable ? <button type="button" className="item-order-cancel" disabled={!!busy} onClick={() => void act("cancel")}>{busy === "cancel" ? "Cancelling…" : "Cancel order"}</button> : null}
      </div> : null}
    </div>
  </li>;
}
