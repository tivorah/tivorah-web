import type { Metadata } from 'next';
import GroupBooking from './group-booking';
import '../../events/events.css';

export const metadata: Metadata = { title: 'Group event tickets | Tivorah', robots: { index: false, follow: false }, referrer: 'no-referrer' };
export default async function GroupBookingPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <GroupBooking groupId={id} />;
}
