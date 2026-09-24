import type { Metadata } from 'next';
import { cache } from 'react';
import { notFound } from 'next/navigation';
import { EventApiError, eventApi, PublicEvent } from '../api';
import EventBookingPage from './event-booking';
import '../events.css';

const getEvent = cache(async (id: string) => {
  if (!/^[1-9]\d*$/.test(id)) notFound();
  try { return await eventApi<PublicEvent>(`/${id}`); }
  catch (error) { if (error instanceof EventApiError && error.status === 404) notFound(); throw error; }
});
export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const event = await getEvent(id);
  return { title: `${event.title} | Tickets`, description: event.description?.slice(0, 160) || `Book tickets for ${event.title} on Tivorah.`, alternates: { canonical: `/events/${event.id}` }, openGraph: { title: event.title, description: event.description?.slice(0, 160) || 'View event details and book tickets.', url: `https://tivorah.com/events/${event.id}`, images: event.img ? [{ url: event.img }] : [] } };
}
export default async function EventPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <EventBookingPage event={await getEvent(id)} />;
}
