// The buyer's newest order for an item that's still going (waiting, accepted or ready), so the
// page can let them know before they order again.
// Mobile counterpart: existingItemOrder in tivorah-mobile/api/requests/itemOrders.ts.
type OrderLike = { id: number; productId: number | null; status: string };
export function existingItemOrder<T extends OrderLike>(orders: T[] | undefined, productId: number): { order: T } | null {
  const order = (orders ?? []).find((entry) => entry.productId === productId && (entry.status === "requested" || entry.status === "accepted" || entry.status === "ready"));
  return order ? { order } : null;
}

/** What the "already ordered" notice says about the earlier order. */
export function existingOrderMessage(status: string) {
  const state = status === "ready" ? "is ready" : status === "accepted" ? "was accepted" : "is waiting for the seller";
  return `Your earlier order ${state}. You can still place another order.`;
}

/**
 * The seller's note is filled in with a friendly default so they needn't type. If they decline
 * without changing it, a decline message is sent instead of the thank-you.
 */
export const defaultSellerNote = (firstName: string) => `Thanks for your order, ${firstName}! I’ll let you know when it’s ready.`;
export function sellerNoteFor(action: "accept" | "decline", note: string, firstName: string) {
  const text = note.trim();
  if (action === "decline" && text === defaultSellerNote(firstName)) return `Sorry, ${firstName}, I can’t take this order right now.`;
  return text || undefined;
}
