// Item ordering settings shared by the create/edit forms (item-ordering-fields.tsx) and their
// payloads. Plain TypeScript (no React) so the payload builders stay testable.

export const READY_IN_OPTIONS = [
  { value: "", label: "Not stated" }, { value: "15", label: "15 minutes" }, { value: "30", label: "30 minutes" }, { value: "45", label: "45 minutes" },
  { value: "60", label: "1 hour" }, { value: "90", label: "1½ hours" }, { value: "120", label: "2 hours" }, { value: "180", label: "3 hours" }, { value: "1440", label: "Next day" },
];

/** The ordering fields from a create/edit form, as the API expects them. */
export type ItemOrderingPayload = {
  orderMode: "message" | "request"; offersPickup: boolean; offersDelivery: boolean; deliveryFeeCents: number | null;
  deliveryAreaKm: number | null; readyInMinutes: number | null; inventory?: number | null;
};
export function itemOrderingPayload(form: FormData): ItemOrderingPayload {
  const text = (name: string) => String(form.get(name) ?? "").trim();
  const delivery = form.get("offersDelivery") === "on";
  const fee = text("deliveryFee");
  return {
    orderMode: (text("orderMode") || "message") as "message" | "request",
    offersPickup: form.get("offersPickup") === "on",
    offersDelivery: delivery,
    deliveryFeeCents: delivery && fee ? Math.round(Number(fee) * 100) : null,
    deliveryAreaKm: delivery && text("deliveryAreaKm") ? Number(text("deliveryAreaKm")) : null,
    readyInMinutes: text("readyInMinutes") ? Number(text("readyInMinutes")) : null,
    // "No limit" sends null (the API treats it as always available).
    ...(form.get("inventoryUnlimited") === "on" ? { inventory: null } : text("inventory") ? { inventory: Number(text("inventory")) } : {}),
  };
}
