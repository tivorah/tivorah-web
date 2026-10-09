import type { Locality } from "./locality-field";
import { centsOrThrow } from "../../lib/money";
export type CreationKind = "item" | "service" | "event";
export function creationPayload(
  form: FormData,
  kind: CreationKind,
  locality: Locality | null,
  images: string[],
  idempotencyKey: string,
  tickets?: { name: string; priceCents: number; quantity: number; maxTicketsPerBuyer: number }[],
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
    const information = {
      agePolicy: text('agePolicy'), arrival: text('arrival'), accessibility: text('accessibility'), refundPolicy: text('refundPolicy'),
      faqs: Array.from({length: 3}, (_, index) => ({question: text(`faq-question-${index}`), answer: text(`faq-answer-${index}`)})).filter(row => row.question || row.answer),
    };
    if (!images.length) throw new Error("Add an event cover photo.");
    const start = new Date(text("startsAt"));
    const end = new Date(text("endsAt"));
    if (
      !Number.isFinite(start.getTime()) ||
      !Number.isFinite(end.getTime()) ||
      end <= start
    )
      throw new Error("Choose an end time after the event starts.");
    if (!tickets?.length) throw new Error("Add at least one ticket package.");
    // Capacity is the total of every package.
    const quantity = tickets.reduce((sum, ticket) => sum + ticket.quantity, 0);
    return {
      ...common,
      information,
      img: images[0],
      displayName: text("businessName"),
      startsAt: start.toISOString(),
      endsAt: end.toISOString(),
      locationType: online ? "online" : "venue",
      venueName: text("venueName"),
      address: text("address"),
      ...(online && text("onlineUrl") ? { onlineUrl: text("onlineUrl") } : {}),
      status: "draft",
      capacity: quantity,
      messagePrompts: [text("prompt1"), text("prompt2"), text("prompt3")].filter(Boolean),
      tickets,
      allowGroupBookings: form.get("allowGroupBookings") === "on",
      refundPolicy: text("refundPolicyPreset") || null,
    };
  }
  if (!images.length)
    throw new Error("Upload at least one photo for your listing.");
  return {
    ...common,
    idempotencyKey,
    listingType: kind,
    businessName: text("businessName"),
    priceCents: centsOrThrow(text("price")),
    currency: text("currency") || "AUD",
    priceType: text("priceType") || "fixed",
    condition: text("condition") || "used_good",
    messagePrompts: [text("prompt1"), text("prompt2"), text("prompt3")].filter(Boolean),
    ...(text("pickupNotes") ? { pickupNotes: text("pickupNotes") } : {}),
    ...(kind === "service"
      ? {
          serviceMode: text("mode") || "at_provider",
          availableOnline: online || text("mode") === "flexible",
          ...(text("serviceAreaKm") ? { serviceAreaKm: Number(text("serviceAreaKm")) } : {}),
        }
      : {}),
  };
}
