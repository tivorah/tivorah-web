import Link from 'next/link';
export type BookingSetupIssue = { code: string; message: string; label: string; mobilePath: string; webPath: string };
export function BookingSetupNotice({ issues }: { issues?: BookingSetupIssue[] }) {
  if (!issues?.length) return null;
  return <section className="product-notice" aria-label="Booking setup"><h2>Before you can accept bookings</h2>{issues.map(issue => <div key={issue.code}><p>{issue.message}</p><Link className="product-secondary" href={issue.webPath}>{issue.label}</Link></div>)}</section>;
}
