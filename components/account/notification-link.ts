// Where a web notification's action goes. Item order notifications carry the mobile deep link
// (/market/orders?role=seller|buyer); everything else is routed by category.
export function notificationLink(item: { category: string; deepLink?: string | null }): { href: string; label: string } {
  if (item.deepLink?.startsWith("/market/orders")) {
    const query = new URLSearchParams(item.deepLink.split("?")[1] ?? "");
    const order = /^\d+$/.test(query.get("orderId") ?? "") ? `?order=${query.get("orderId")}` : "";
    return query.get("role") === "seller"
      ? { href: `/business/orders${order}`, label: "View order" }
      : { href: `/account/item-orders${order}`, label: "View order" };
  }
  if (item.category === "events") return { href: "/account/tickets", label: "View tickets" };
  if (item.category === "marketplace") return { href: "/account/bookings", label: "View appointments" };
  return { href: "/contact", label: "Get support" };
}
