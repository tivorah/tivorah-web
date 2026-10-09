export type EventTicketType = { id: number; name: string; description: string | null; priceCents: number; buyerPriceCents?: number; currency: string; remaining: number; maxTicketsPerBuyer: number; available: boolean; salesStartAt: string | null; salesEndAt: string | null; kind?: 'standard' | 'group'; groupSize?: number; regularPriceCents?: number | null; hidden?: boolean; releaseAfterName?: string | null };
export type PublicEvent = { information?: { arrival?: string; accessibility?: string; agePolicy?: string; refundPolicy?: string; faqs?: {question: string; answer: string}[] } | null; guestBookingAvailable: boolean; id: number; title: string; description: string | null; img: string | null; images: string[]; startsAt: string | null; endsAt: string | null; locationType: string; location: string | null; venueName: string | null; address: string | null; suburb: string | null; state: string | null; postcode: string | null; organizerName: string; organizerUsername?: string | null; organizerShopOnline?: boolean; externalTicketUrl: string | null; ticketTypes: EventTicketType[]; allowGroupBookings?: boolean; refundPolicy?: string | null; hasAccessCodePackages?: boolean; accessCodeAccepted?: boolean };
export type BookingQuote = { subtotalCents: number; platformFeeCents: number; buyerTotalCents: number; chargedTo: string; percentageBps?: number; fixedFeeCents?: number; tax?: { treatment: string; ticketGstCents: number | null } };
import { adminApiBase } from '../admin/api-base';
export class EventApiError extends Error { constructor(message: string, public status: number, public code?: string) { super(message); } }
export async function eventApi<T>(path: string, init?: RequestInit): Promise<T> {
  const base = adminApiBase();
  if (!base) throw new EventApiError('Event booking is temporarily unavailable. Please try again later.', 503);
  const response = await fetch(`${base}/api/v1/public/events${path}`, { ...init, credentials: 'include', cache: 'no-store', signal: init?.signal ?? AbortSignal.timeout(15000), headers: { 'Content-Type': 'application/json', ...init?.headers } });
  const payload = await response.json();
  if (!response.ok || !payload.status) throw new EventApiError(payload.message || 'This request could not be completed. Please try again.', response.status, payload.errorCode);
  return payload.data as T;
}
export const ticketMoney = (cents: number, currency = 'AUD') => new Intl.NumberFormat('en-AU', { style: 'currency', currency, currencyDisplay: 'code' }).format(cents / 100);
export function eventDate(value: string | null) {
  return value ? new Date(value).toLocaleString('en-AU', { dateStyle: 'full', timeStyle: 'short', timeZone: 'Australia/Adelaide' }) + ' (Adelaide time)' : 'Date to be confirmed';
}

/** A paid checkout the signed-in buyer left unpaid; its tickets stay held until `expiresAt`. */
export type ActiveCheckout = { orderId: number; checkoutUrl: string; startedAt?: string; expiresAt: string; ticketSummary: string | null; totalCents: number; currency: string };
/** The signed-in buyer's own state for an event: tickets already held per type, and any held checkout. */
export type MyEventBooking = { heldByYou: Record<string, number>; activeCheckout: ActiveCheckout | null };
