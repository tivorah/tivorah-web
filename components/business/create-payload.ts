import type { Locality } from "./locality-field";
export type CreationKind = "item" | "service" | "event";
export function creationPayload(
  form: FormData,
  kind: CreationKind,
  locality: Locality | null,
  images: string[],
  idempotencyKey: string,
) {
  const text = (name: string) => String(form.get(name) || "").trim();
  const online = text("mode") === "online";
  if (!online && !locality)
    throw new Error("Choose a suburb from the location results.");
  const common = {
    title: text("title"),
    description: text("description"),
    category: text("category"),
    images,
    ...(locality || {}),
  };
  if (kind === "event") {
    const start = new Date(text("startsAt"));
    const end = new Date(text("endsAt"));
    if (
      !Number.isFinite(start.getTime()) ||
      !Number.isFinite(end.getTime()) ||
      end <= start
    )
      throw new Error("Choose an end time after the event starts.");
    return {
      ...common,
      img: images[0],
      displayName: text("businessName"),
      startsAt: start.toISOString(),
      endsAt: end.toISOString(),
      locationType: online ? "online" : "venue",
      venueName: text("venueName"),
      address: text("address"),
      ...(online && text("onlineUrl") ? { onlineUrl: text("onlineUrl") } : {}),
      status: "draft",
      ticket: {
        name: text("ticketName") || "General admission",
        priceCents: Math.round(Number(text("price")) * 100),
        quantity: Number(text("quantity")),
        maxTicketsPerBuyer: 4,
      },
    };
  }
  if (!images.length)
    throw new Error("Upload at least one photo for your listing.");
  return {
    ...common,
    idempotencyKey,
    listingType: kind,
    businessName: text("businessName"),
    priceCents: Math.round(Number(text("price")) * 100),
    priceType: text("priceType") || "fixed",
    condition: text("condition") || "used_good",
    ...(kind === "service"
      ? {
          serviceMode: online ? "online" : "at_provider",
          availableOnline: online,
          bookingEnabled: false,
        }
      : {}),
  };
}
