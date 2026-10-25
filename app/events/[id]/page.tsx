import type { Metadata } from 'next';
import { pageMetadata, socialImage } from '../../../lib/site';
import { cache } from 'react';
import { notFound } from 'next/navigation';
import { EventApiError, eventApi, PublicEvent } from '../api';
import EventBookingPage from './event-booking';
import '../events.css';
import { JsonLd, absoluteUrl } from '../../../lib/seo';

const getEvent = cache(async (id: string) => {
  if (!/^[1-9]\d*$/.test(id)) notFound();
  try { return await eventApi<PublicEvent>(`/${id}`); }
  catch (error) { if (error instanceof EventApiError && error.status === 404) notFound(); throw error; }
});
export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const event = await getEvent(id);
  const title = `${event.title} | Tickets`;
  const description = event.description?.slice(0, 160) || `Book tickets for ${event.title} on Tivorah.`;
  const metadata = pageMetadata(title, description, `/events/${event.id}`);
  const images = event.img ? [{ url: event.img, alt: event.title }] : [socialImage];
  return { ...metadata, openGraph: { ...metadata.openGraph, images }, twitter: { ...metadata.twitter, images } };
}
export default async function EventPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const event = await getEvent(id);
  const url = absoluteUrl(`/events/${event.id}`);
  const online = event.locationType === 'online';
  const tickets = event.ticketTypes ?? [];
  // Google event results: name, dates, place, organiser and ticket prices.
  const structured = {
    '@context': 'https://schema.org', '@type': 'Event', name: event.title, description: event.description ?? undefined, url,
    image: [event.img, ...(event.images ?? [])].filter((value): value is string => !!value && value.startsWith('https://')),
    startDate: event.startsAt ?? undefined, endDate: event.endsAt ?? undefined,
    eventStatus: 'https://schema.org/EventScheduled',
    eventAttendanceMode: online ? 'https://schema.org/OnlineEventAttendanceMode' : 'https://schema.org/OfflineEventAttendanceMode',
    location: online
      ? { '@type': 'VirtualLocation', url }
      : { '@type': 'Place', name: event.venueName || event.suburb || 'Venue', address: { '@type': 'PostalAddress', streetAddress: event.address ?? undefined, addressLocality: event.suburb ?? undefined, addressRegion: event.state ?? undefined, postalCode: event.postcode ?? undefined, addressCountry: 'AU' } },
    organizer: { '@type': 'Organization', name: event.organizerName, ...(event.organizerUsername && event.organizerShopOnline ? { url: absoluteUrl(`/shops/${encodeURIComponent(event.organizerUsername)}`) } : {}) },
    offers: tickets.map((ticket) => ({ '@type': 'Offer', name: ticket.name, url, price: ((ticket.buyerPriceCents ?? ticket.priceCents) / 100).toFixed(2), priceCurrency: ticket.currency || 'AUD', availability: ticket.available ? 'https://schema.org/InStock' : 'https://schema.org/SoldOut', ...(ticket.salesStartAt ? { validFrom: ticket.salesStartAt } : {}) })),
  };
  return <><JsonLd data={structured} /><EventBookingPage event={event} /></>;
}
