"use client";
import { createActionKey } from "../../lib/action-key";
import { FormEvent, useRef, useState } from "react";
import Link from "next/link";
import type { DiscoveryItem } from "../../lib/api/discovery";
import { useAccount } from "../../hooks/use-account";
import { api, ApiError } from "../../lib/api/client";
import { LoadingState } from "../ui/loading-state";
import { Sheet } from "../ui/sheet";
import { existingItemOrder, existingOrderMessage } from "../orders/existing-order";
import "./service-highlights.css";

// Item page sections shared with mobile (components/marketplace/ItemHighlights.tsx): the essentials
// at a glance, and the order request form when the seller takes order requests (stage 1: payment
// is arranged with the seller; nothing is paid on Tivorah).

const money = (cents: number, currency = "AUD") => new Intl.NumberFormat("en-AU", { style: "currency", currency }).format(cents / 100);
export function readyInLabel(minutes: number | null | undefined) {
  if (!minutes) return null;
  if (minutes >= 1440) return minutes === 1440 ? "Next day" : `${Math.round(minutes / 1440)} days`;
  if (minutes >= 60) return `${minutes / 60 === Math.floor(minutes / 60) ? minutes / 60 : (minutes / 60).toFixed(1)} hour${minutes === 60 ? "" : "s"}`;
  return `${minutes} minutes`;
}

export function ItemGlance({ item }: { item: DiscoveryItem }) {
  const place = [item.locality, item.state].filter(Boolean).join(", ");
  const ways = [item.offersPickup !== false ? `Pickup${place ? ` in ${place}` : ""}` : null, item.offersDelivery ? `Delivery${item.deliveryAreaKm ? ` within ${item.deliveryAreaKm} km` : ""}${item.deliveryFeeCents ? ` · ${money(item.deliveryFeeCents, item.currency)}` : " · free"}` : null].filter(Boolean).join(" · ");
  const rows = [
    readyInLabel(item.readyInMinutes) ? ["Ready in", readyInLabel(item.readyInMinutes)] : null,
    ways ? ["Getting it", ways] : null,
    item.pickupNotes ? ["Pickup details", item.pickupNotes] : null,
    item.inventory && item.inventory > 1 ? ["Available", `${item.inventory} available`] : null,
    item.createdAt ? ["Listed", new Intl.DateTimeFormat("en-AU", { day: "numeric", month: "long", year: "numeric" }).format(new Date(item.createdAt))] : null,
  ].filter((row): row is [string, string] => !!row && !!row[1]);
  return <section className="service-glance" aria-label="At a glance"><h2>At a glance</h2><dl>{rows.map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}</dl></section>;
}

/** Order request: quantity, pickup or delivery (with address), and a note for the seller. */
export function ItemOrderRequest({ item }: { item: DiscoveryItem }) {
  const { account, loading, signedOut } = useAccount();
  // No stock limit (null): up to 50 per order, as the API allows.
  const max = item.inventory === null ? 50 : Math.max(1, Math.min(50, item.inventory ?? 1));
  const [quantity, setQuantity] = useState(1);
  const [fulfilment, setFulfilment] = useState<"pickup" | "delivery">(item.offersPickup === false ? "delivery" : "pickup");
  const [address, setAddress] = useState("");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);
  // The buyer's order for this item that's still going: let them know before they order again.
  const [existing, setExisting] = useState<string | null>(null);
  // One key per order (kept while the same order is resent): a double click, a network retry or a
  // resend after a lost answer can't create two orders. Changing the order starts a new key.
  const key = useRef(createActionKey()).current;
  // Held from the click until the order is answered (busy is reset between the check and the send).
  const lock = useRef(false);
  if (item.orderMode !== "request") return null;
  const unit = item.priceCents ?? 0;
  const fee = fulfilment === "delivery" ? item.deliveryFeeCents ?? 0 : 0;
  const total = unit * quantity + fee;

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (busy || lock.current) return;
    lock.current = true;
    setBusy(true); setError("");
    try {
      try {
        const { orders } = await api<{ orders: { id: number; productId: number | null; status: string }[] }>("/market/item-orders?role=buyer");
        const found = existingItemOrder(orders, Number(item.id));
        if (found) { setExisting(found.order.status); setBusy(false); return; }
      } catch { /* Couldn't check earlier orders; send this one anyway. */ }
      await placeOrder();
    } finally { lock.current = false; }
  }

  async function send() {
    if (lock.current) return;
    lock.current = true;
    try { await placeOrder(); } finally { lock.current = false; }
  }

  async function placeOrder() {
    setExisting(null);
    setBusy(true); setError("");
    try {
      const input = { quantity, fulfilment, deliveryAddress: fulfilment === "delivery" ? address : undefined, note: note.trim() || undefined };
      const idempotencyKey = key.for(JSON.stringify(input));
      await api(`/market/products/${item.id}/orders`, { method: "POST", headers: { "Idempotency-Key": idempotencyKey }, body: JSON.stringify({ ...input, idempotencyKey }) });
      setSent(true);
      key.done();
    } catch (cause) {
      // Refused (4xx): the next try is a new order. A lost answer or a server error keeps the key.
      if (cause instanceof ApiError && cause.status >= 400 && cause.status < 500) key.done();
      setError(cause instanceof Error ? cause.message : "Your order couldn’t be sent. Please try again.");
    } finally { setBusy(false); }
  }

  if (loading) return <LoadingState label="Loading…" variant="compact" />;
  if (signedOut) return <section className="item-order"><h2>Order this item</h2><p className="service-section-note">The seller accepts or declines each order.</p><Link className="product-primary" href={`/auth/signin?returnTo=${encodeURIComponent(`/shop/items/${item.id}`)}`}>Sign in to order</Link></section>;
  if (account?.username && account.username === item.sellerUsername) return <section className="item-order"><h2>Order requests</h2><p className="service-section-note">Buyers can send you order requests for this item. See them in <Link href="/business/orders">your orders</Link>.</p></section>;
  if (sent) return <section className="item-order" role="status"><h2>Order sent</h2><p>The seller will accept or decline it. We’ll let you know, and you can follow it in Your orders.</p><div className="item-order-done"><Link className="product-primary" href="/account/item-orders">View your orders</Link><button type="button" className="product-secondary" onClick={() => { setSent(false); setNote(""); }}>Done</button></div></section>;

  return <><form className="item-order" onSubmit={submit} aria-busy={busy}>
    <h2>Order this item</h2>
    <label>Quantity<input type="number" min={1} max={max} value={quantity} onChange={(event) => setQuantity(Math.max(1, Math.min(max, Number(event.target.value) || 1)))} /></label>
    {item.offersPickup !== false && item.offersDelivery ? <fieldset className="item-order-ways"><legend>How do you want it?</legend>
      <label className="product-checkbox"><input type="radio" name="fulfilment" checked={fulfilment === "pickup"} onChange={() => setFulfilment("pickup")} /><span>Pickup</span></label>
      <label className="product-checkbox"><input type="radio" name="fulfilment" checked={fulfilment === "delivery"} onChange={() => setFulfilment("delivery")} /><span>Delivery{item.deliveryFeeCents ? ` (${money(item.deliveryFeeCents, item.currency)})` : ""}</span></label>
    </fieldset> : <p className="service-section-note">{fulfilment === "delivery" ? `Delivery${item.deliveryFeeCents ? `, ${money(item.deliveryFeeCents, item.currency)}` : ""}` : "Pickup"}</p>}
    {fulfilment === "delivery" ? <label>Delivery address<input value={address} onChange={(event) => setAddress(event.target.value)} maxLength={300} required placeholder="Street, suburb" autoComplete="street-address" /></label> : null}
    <label><span className="shop-label">Note for the seller <span className="shop-optional">Optional</span></span><textarea value={note} onChange={(event) => setNote(event.target.value)} maxLength={500} rows={2} placeholder="e.g. Medium spice, or a pickup time" /></label>
    <p className="item-order-total"><span>Total</span><strong>{money(total, item.currency)}</strong></p>
    <p className="service-section-note">Payment is arranged with the seller. They accept or decline each order.</p>
    {error ? <p className="product-error" role="alert">{error}</p> : null}
    <button className="product-primary press-fx" disabled={busy || (fulfilment === "delivery" && !address.trim())}>{busy ? "Sending…" : "Send order request"}</button>
  </form>
  <Sheet open={!!existing} onClose={() => setExisting(null)} title="You’ve already ordered this"
    description={existing ? existingOrderMessage(existing) : undefined}
    footer={<div className="item-order-done">
      <Link className="product-secondary" href="/account/item-orders">View your order</Link>
      <button type="button" className="product-primary" onClick={() => void send()}>Continue with the order</button>
    </div>}>
    <p className="service-section-note">Each order is accepted or declined by the seller, and payment is arranged with them.</p>
  </Sheet></>;
}
