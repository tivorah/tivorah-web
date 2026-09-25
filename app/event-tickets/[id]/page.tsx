import type { Metadata } from 'next';
import HolderTicket from './holder-ticket';
import '../../events/events.css';

export const metadata: Metadata = { title: 'Your event ticket | Tivorah', robots: { index: false, follow: false }, referrer: 'no-referrer' };
export default async function HolderTicketPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <HolderTicket ticketId={id} />;
}
