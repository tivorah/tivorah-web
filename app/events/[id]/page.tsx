import type { Metadata } from 'next';
import { pageMetadata, socialImage } from '../../../lib/site';
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
  const title = `${event.title} | Tickets`;
  const description = event.description?.slice(0, 160) || `Book tickets for ${event.title} on Tivorah.`;
  const metadata = pageMetadata(title, description, `/events/${event.id}`);
  const images = event.img ? [{ url: event.img, alt: event.title }] : [socialImage];
  return { ...metadata, openGraph: { ...metadata.openGraph, images }, twitter: { ...metadata.twitter, images } };
}
export default async function EventPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <EventBookingPage event={await getEvent(id)} />;
}
