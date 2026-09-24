export type EventTicketType = { id: number; name: string; description: string | null; priceCents: number; currency: string; remaining: number; maxTicketsPerBuyer: number; available: boolean; salesStartAt: string | null; salesEndAt: string | null };
export type PublicEvent = { guestBookingAvailable: boolean; id: number; title: string; description: string | null; img: string | null; images: string[]; startsAt: string | null; endsAt: string | null; locationType: string; location: string | null; venueName: string | null; address: string | null; suburb: string | null; state: string | null; postcode: string | null; organizerName: string; externalTicketUrl: string | null; ticketTypes: EventTicketType[] };
export type BookingQuote = { subtotalCents: number; platformFeeCents: number; buyerTotalCents: number; chargedTo: string };
export class EventApiError extends Error { constructor(message: string, public status: number, public code?: string) { super(message); } }
export async function eventApi<T>(path: string, init?: RequestInit): Promise<T> {
  const base = process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, '');
  if (!base) throw new EventApiError('Event booking is temporarily unavailable. Please try again later.', 503);
  const response = await fetch(`${base}/api/v1/public/events${path}`, { ...init, cache: 'no-store', signal: init?.signal ?? AbortSignal.timeout(15000), headers: { 'Content-Type': 'application/json', ...init?.headers } });
  const payload = await response.json();
  if (!response.ok || !payload.status) throw new EventApiError(payload.message || 'This request could not be completed. Please try again.', response.status, payload.errorCode);
  return payload.data as T;
}
export const ticketMoney = (cents: number, currency = 'AUD') => new Intl.NumberFormat('en-AU', { style: 'currency', currency }).format(cents / 100);
export function eventDate(value: string | null) {
  return value ? new Date(value).toLocaleString('en-AU', { dateStyle: 'full', timeStyle: 'short', timeZone: 'Australia/Adelaide' }) + ' (Adelaide time)' : 'Date to be confirmed';
}
