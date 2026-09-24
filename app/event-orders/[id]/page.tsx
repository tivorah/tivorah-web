import type { Metadata } from 'next';
import OrderTickets from './order-tickets';
import '../../events/events.css';
export const metadata: Metadata = { title: 'Your event tickets | Tivorah', robots: { index: false, follow: false }, referrer: 'no-referrer' };
export default async function OrderPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <OrderTickets orderId={id} />;
}
