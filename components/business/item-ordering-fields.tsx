"use client";
import { useState } from "react";
import { SelectField } from "../ui/select-field";
import { CONSUMABLE_CATEGORIES } from "./listing-kinds";
import { READY_IN_OPTIONS } from "./item-ordering";

/**
 * How buyers get an item: message the seller, or send an order request the seller accepts
 * (stage 1, no payment on Tivorah). Pickup and/or delivery with the seller's fee and distance,
 * how many are available, and for food how long it takes to be ready. Used by the create and edit
 * forms; read back with itemOrderingPayload() (item-ordering.ts). Mobile: components/creation/ItemOrderingFields.tsx.
 */
export type ItemOrderingDefaults = { orderMode?: "message" | "request"; offersPickup?: boolean; offersDelivery?: boolean; deliveryFeeCents?: number | null; deliveryAreaKm?: number | null; readyInMinutes?: number | null; inventory?: number | null };


export function ItemOrderingFields({ category, defaults = {} }: { category: string; defaults?: ItemOrderingDefaults }) {
  const food = CONSUMABLE_CATEGORIES.includes(category);
  const [mode, setMode] = useState<"message" | "request">(defaults.orderMode ?? "message");
  const [pickup, setPickup] = useState(defaults.offersPickup ?? true);
  const [delivery, setDelivery] = useState(defaults.offersDelivery ?? false);
  // No limit: the seller doesn't track stock (made to order, always available).
  const [unlimited, setUnlimited] = useState(defaults.inventory === null);
  return <div className="item-ordering">
    {/* Buyers can always message the seller; this adds order requests on top. */}
    <label className="product-checkbox item-ordering-requests"><input type="checkbox" checked={mode === "request"} onChange={(event) => setMode(event.target.checked ? "request" : "message")} /><span><strong>Take order requests</strong><small>Buyers can always message you. With this on, they can also send an order (quantity, pickup or delivery) for you to accept or decline. Payment is arranged with you.</small></span></label>
    <input type="hidden" name="orderMode" value={mode} />

    <fieldset className="item-ordering-ways">
      <legend>How buyers get it</legend>
      <label className="product-checkbox"><input type="checkbox" name="offersPickup" checked={pickup} onChange={(event) => setPickup(event.target.checked)} /><span>Pickup</span></label>
      <label className="product-checkbox"><input type="checkbox" name="offersDelivery" checked={delivery} onChange={(event) => setDelivery(event.target.checked)} /><span>I deliver</span></label>
      {mode === "request" && !pickup && !delivery ? <p className="product-error" role="alert">Choose pickup, delivery or both.</p> : null}
    </fieldset>
    {delivery ? <div className="shop-row">
      <label><span className="shop-label">Delivery fee ($) <span className="shop-optional">Optional</span></span><input name="deliveryFee" type="number" min={0} max={1000} step="0.01" placeholder="0.00" defaultValue={defaults.deliveryFeeCents != null ? (defaults.deliveryFeeCents / 100).toFixed(2) : ""} /></label>
      <label><span className="shop-label">Delivers within (km) <span className="shop-optional">Optional</span></span><input name="deliveryAreaKm" type="number" min={1} max={200} placeholder="e.g. 10" defaultValue={defaults.deliveryAreaKm ?? ""} /></label>
    </div> : null}

    <div className="shop-row">
      {food ? <label>Ready in<SelectField name="readyInMinutes" label="Ready in" defaultValue={defaults.readyInMinutes != null ? String(defaults.readyInMinutes) : ""} options={READY_IN_OPTIONS} /></label> : null}
      <div className="item-ordering-stock"><label><span className="shop-label">How many are available</span><input name="inventory" type="number" min={1} max={10000} defaultValue={defaults.inventory ?? (food ? 20 : 1)} disabled={unlimited} aria-describedby="item-stock-hint" /></label>
        <label className="product-checkbox"><input type="checkbox" name="inventoryUnlimited" checked={unlimited} onChange={(event) => setUnlimited(event.target.checked)} /><span>No limit (always available)</span></label>
        <span className="shop-hint" id="item-stock-hint">{unlimited ? "Buyers can order up to 50 at once." : "Buyers can order up to this many at once."}</span></div>
    </div>
  </div>;
}
