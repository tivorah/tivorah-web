import type { Locality } from "./locality-field";
import { centsOrThrow } from "../../lib/money";
import { itemOrderingPayload } from "./item-ordering";
export type CreationKind = "item" | "service" | "event";
export function creationPayload(
  form: FormData,
  kind: CreationKind,
  locality: Locality | null,
  images: string[],
  idempotencyKey: string,
  tickets?: { name: string; priceCents: number; quantity: number; maxTicketsPerBuyer: number }[],
  /** Where Tivorah ticketing isn't available: how people get tickets instead (no Tivorah tickets). */
  outsideTicketing?: { contact: "link" | "message" | "both" },
  /** Events: the "Limit capacity" total (omitted: no event capacity) and a searched venue's map pin.
   * Without it, the capacity is the total of every ticket type (older callers). */
  eventExtras?: { capacity?: number; latitude?: number; longitude?: number },
) {
  const text = (name: string) => String(form.get(name) || "").trim();
  const online = text("mode") === "online";
  if (!online && !locality)
    throw new Error("Choose where it is: a suburb from the results, or your city or town.");
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
    const contact = outsideTicketing?.contact;
    const ticketUrl = text("externalTicketUrl");
    if (contact && contact !== "message" && !/^https:\/\/\S+\.\S+/.test(ticketUrl))
      throw new Error("Add the link where people can get tickets (starting with https://).");
    if (!contact && !tickets?.length) throw new Error("Add at least one ticket package.");
    // Capacity: the organiser's total, or (older callers) the total of every package.
    const quantity = contact ? undefined : eventExtras ? eventExtras.capacity : tickets!.reduce((sum, ticket) => sum + ticket.quantity, 0);
    const pin = !online && eventExtras?.latitude != null && eventExtras.longitude != null ? { latitude: eventExtras.latitude, longitude: eventExtras.longitude } : {};
    return {
      ...common,
      information: { ...information, ...(contact ? { ticketContact: contact } : {}) },
      ...(contact && contact !== "message" ? { externalTicketUrl: ticketUrl } : {}),
      img: images[0],
      displayName: text("businessName"),
      startsAt: start.toISOString(),
      endsAt: end.toISOString(),
      locationType: online ? "online" : "venue",
      venueName: text("venueName"),
      address: text("address"),
      ...pin,
      ...(online && text("onlineUrl") ? { onlineUrl: text("onlineUrl") } : {}),
      status: "draft",
      ...(quantity === undefined ? {} : { capacity: quantity }),
      messagePrompts: [text("prompt1"), text("prompt2"), text("prompt3")].filter(Boolean),
      tickets: contact ? [] : tickets,
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
    ...(kind === "item" ? itemOrderingPayload(form) : {}),
    ...(kind === "service"
      ? {
          serviceMode: text("mode") || "at_provider",
          availableOnline: online || text("mode") === "flexible",
          ...(text("serviceAreaKm") ? { serviceAreaKm: Number(text("serviceAreaKm")) } : {}),
        }
      : {}),
  };
}
