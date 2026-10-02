'use client';
import { TicketBooking } from '../../../components/discovery/ticket-booking';
import { EventAppInvite } from '../../../components/discovery/event-app-invite';
import Image from 'next/image';
import { Suspense, useEffect, useRef, useState } from 'react';
import { eventDate, PublicEvent, ticketMoney } from '../api';
import { ShowcaseCard } from "../../../components/business/showcase/showcase-card";
import { BackLink } from "../../../components/ui/back-link";
import Link from "next/link";
import { OpenInApp } from "../../../components/ui/open-in-app";
import { PublicOfferingVideos } from "../../../components/business/offering-videos";

export default function EventBookingPage({ event }: { event: PublicEvent }) {
  const [shared, setShared] = useState('');
  const [shareOpen, setShareOpen] = useState(false);
  const shareArea = useRef<HTMLDivElement>(null);
  const shareButton = useRef<HTMLButtonElement>(null);
  const shareUrl = `https://tivorah.com/events/${event.id}`;
  useEffect(() => {
    if (!shareOpen) return;
    function close(e: PointerEvent) { if (!shareArea.current?.contains(e.target as Node)) setShareOpen(false); }
    function escape(e: KeyboardEvent) { if (e.key === 'Escape') { setShareOpen(false); shareButton.current?.focus(); } }
    document.addEventListener('pointerdown', close); document.addEventListener('keydown', escape);
    return () => { document.removeEventListener('pointerdown', close); document.removeEventListener('keydown', escape); };
  }, [shareOpen]);
  const [ticketsVisible, setTicketsVisible] = useState(false);
  useEffect(() => {
    const section = document.getElementById('tickets');
    if (!section) return;
    const observer = new IntersectionObserver(entries => setTicketsVisible(entries[0].isIntersecting));
    observer.observe(section);
    return () => observer.disconnect();
  }, []);
  async function share() {
    const url = shareUrl;
    try { if (navigator.share) await navigator.share({ title: event.title, url }); else { await navigator.clipboard.writeText(url); setShared('Link copied'); } }
    catch (cause) { if (!(cause instanceof DOMException && cause.name === 'AbortError')) setShared('Copy the page address to share this event.'); }
  }
  const location = [event.venueName, event.address, event.suburb, event.state, event.postcode].filter(Boolean).join(', ') || event.location;
  const photos = [...new Set([event.img, ...event.images].filter((value): value is string => !!value && /^https?:\/\//.test(value) && /\.(png|jpe?g|webp|avif)(\?|$)/i.test(value)))];
  const [selectedPhoto, setSelectedPhoto] = useState(0);
  const image = photos[selectedPhoto] ?? null;
  const minPrice = event.ticketTypes.length ? Math.min(...event.ticketTypes.map(item => item.priceCents)) : null;
  return <article className="page-shell event-page">
    <BackLink className="event-back" fallback="/events" />
    {image ? <div className="event-hero"><Image src={image} alt={`${event.title}, photo ${selectedPhoto + 1}`} fill sizes="(max-width: 760px) 100vw, 1200px" unoptimized style={{ objectFit: 'contain' }} priority /></div> : null}
    {photos.length > 1 ? <div className="event-photo-strip" role="group" aria-label="Event photos">{photos.map((photo, index) => <button key={photo} type="button" aria-label={`Show event photo ${index + 1}`} aria-pressed={selectedPhoto === index} onClick={() => setSelectedPhoto(index)}><Image src={photo} alt="" fill sizes="80px" unoptimized /></button>)}</div> : null}
    <div className="event-tools"><OpenInApp appPath={`events/${event.id}`} /><div className="event-share" ref={shareArea}><button ref={shareButton} type="button" aria-expanded={shareOpen} aria-controls="event-share-options" onClick={() => setShareOpen(value => !value)}>Share event</button>{shareOpen ? <div id="event-share-options" className="event-share-options" role="group" aria-label="Share this event"><p>Invite someone along</p><a href={`https://wa.me/?text=${encodeURIComponent(event.title + ' ' + shareUrl)}`} target="_blank" rel="noopener noreferrer">WhatsApp</a><a href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`} target="_blank" rel="noopener noreferrer">Facebook</a><a href={`mailto:?subject=${encodeURIComponent(event.title)}&body=${encodeURIComponent('Join me at ' + event.title + '\n\n' + shareUrl)}`}>Email</a>{typeof navigator !== 'undefined' && typeof navigator.share === 'function' ? <button type="button" onClick={() => void share()}>More options…</button> : null}<label htmlFor="event-share-url">Event link</label><div className="event-share-link"><input id="event-share-url" readOnly value={shareUrl} onFocus={e => e.target.select()} /><button type="button" aria-label="Copy event link" title="Copy event link" onClick={() => { void navigator.clipboard.writeText(shareUrl).then(() => setShared('Event link copied')).catch(() => setShared('Could not copy the link. Select the event link to copy it manually.')); }}><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true"><rect x="8" y="8" width="12" height="12" rx="2" /><path d="M16 8V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h3" /></svg></button></div></div> : null}</div><span role="status">{shared}</span></div>
    <div className="event-layout"><div className="event-details">
      <p className="event-eyebrow">TIVORAH EVENTS</p><h1>{event.title}</h1><p className="event-organizer">Organised by {event.organizerUsername && event.organizerShopOnline ? <Link href={`/shops/${encodeURIComponent(event.organizerUsername)}`}><strong>{event.organizerName}</strong></Link> : <strong>{event.organizerName}</strong>}</p>
      <dl className="event-facts"><div><dt>When</dt><dd>{eventDate(event.startsAt)}</dd></div><div><dt>Where</dt><dd>{event.locationType === 'online' ? 'Online. Joining details are provided with your ticket.' : location || 'See the organiser for location details.'}</dd></div></dl>
      <section><h2>About this event</h2><p className="event-description">{event.description || 'The organiser has not added a description yet.'}</p></section>
      <PublicOfferingVideos kind="event" id={event.id} />
      {event.locationType !== 'online' && location ? <section className="event-location"><h2>Location</h2><p>{location}</p><div className="event-map"><iframe title={`Map showing ${location}`} src={`https://www.google.com/maps?q=${encodeURIComponent(location)}&output=embed`} loading="lazy" referrerPolicy="no-referrer-when-downgrade" /></div><a className="event-secondary" target="_blank" rel="noopener noreferrer" href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(location)}`}>Get directions</a></section> : null}
      <section><h2>Booking information</h2><p>Book as a guest with your name and email, or sign in to keep tickets in your Tivorah account. Your ticket link will be emailed to you.</p><p>For cancellation or refund questions, <a href={`/contact?eventId=${event.id}`}>contact Tivorah</a> with the event name and booking number.</p></section>
      {event.organizerUsername && event.organizerShopOnline ? <ShowcaseCard username={event.organizerUsername} surface="events" /> : null}
    </div>
    <div className="event-booking-column"><section id="tickets" className="event-booking" aria-labelledby="ticket-heading"><h2 id="ticket-heading">Get tickets</h2>
      <Suspense fallback={<p role="status">Loading tickets…</p>}><TicketBooking event={event} /></Suspense>
    </section></div></div>
    <EventAppInvite />
    {!ticketsVisible ? <div className="event-ticket-dock"><span>{minPrice === null ? 'Event tickets' : minPrice === 0 ? 'Free tickets available' : `From ${ticketMoney(minPrice)}`}</span><a className="event-primary" href="#tickets">Get tickets</a></div> : null}
  </article>;
}
