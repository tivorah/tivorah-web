import type { Metadata } from 'next';
import TicketTransfer from './ticket-transfer';
import '../../events/events.css';

export const metadata: Metadata = { title: 'Accept event ticket | Tivorah', robots: { index: false, follow: false }, referrer: 'no-referrer' };
export default async function TicketTransferPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <TicketTransfer ticketId={id} />;
}
