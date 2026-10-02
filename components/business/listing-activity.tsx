"use client";
import Link from "next/link";
import { useState } from "react";
import { usePrivateResource } from "../../hooks/use-private-resource";
import { LoadingState } from "../ui/loading-state";

type Activity = { rows: Array<{ id: number; name: string; startsAt?: string; timezone?: string; status?: string; totalCents?: number; note?: string | null; lastMessageAt?: string }>; hasMore: boolean };
const date = (value: string, timezone?: string) => new Intl.DateTimeFormat("en-AU", { day: "numeric", month: "short", year: "numeric", hour: "numeric", minute: "2-digit", ...(timezone ? { timeZone: timezone } : {}) }).format(new Date(value));

export function ListingActivity({ id, kind }: { id: number; kind: "bookings" | "enquiries" }) {
  const [page, setPage] = useState(1);
  const { data, loading, error, retry } = usePrivateResource<Activity>(`/market/products/${id}/manage-activity?kind=${kind}&skip=${(page - 1) * 20}&take=20`);
  const bookings = kind === "bookings";
  return <section className="listing-activity" aria-label={bookings ? "Service customers" : "Listing enquiries"}>
    <header><h2>{bookings ? "Customers" : "Enquiries"}</h2><p>{bookings ? "Appointments booked for this service." : "Conversations about this listing."}</p></header>
    {loading ? <LoadingState label={bookings ? "Loading customers…" : "Loading enquiries…"} refreshing={!!data} /> : null}
    {error ? <p role="alert">{error} <button type="button" className="product-secondary" onClick={retry}>Try again</button></p> : null}
    {data ? data.rows.length ? <div className="listing-activity-ledger">
      <div className="listing-activity-columns" aria-hidden="true"><span>{bookings ? "Customer" : "From"}</span><span>{bookings ? "Appointment" : "Last message"}</span><span>{bookings ? "Status" : ""}</span></div>
      {data.rows.map(row => <div className="listing-activity-row" key={row.id}>
        <span className="listing-activity-person"><strong>{row.name}</strong><small>{bookings ? `Booking #${row.id}${row.totalCents ? ` · A$${(row.totalCents / 100).toFixed(2)}` : " · Free"}` : `Enquiry #${row.id}`}</small>{bookings && row.note ? <small className="listing-activity-note">{row.note}</small> : null}</span>
        <span>{date(bookings ? row.startsAt! : row.lastMessageAt!, row.timezone)}</span>
        {bookings ? <span className="listing-activity-actions"><span className="listing-activity-status">{row.status?.replaceAll("_", " ")}</span><Link href="/account/bookings">View bookings <span aria-hidden="true">→</span></Link></span> : <Link href={`/account/messages/${row.id}`}>Open conversation <span aria-hidden="true">→</span></Link>}
      </div>)}
    </div> : <div className="product-empty"><strong>{bookings ? "No customers yet" : "No enquiries yet"}</strong><p>{bookings ? "When someone books this service, their appointment will appear here." : "Messages about this listing will appear here."}</p></div> : null}
    {data && (page > 1 || data.hasMore) ? <nav className="business-pagination" aria-label={`${bookings ? "Customer" : "Enquiry"} pages`}><button className="product-secondary" type="button" disabled={page === 1 || loading} onClick={() => setPage(page - 1)}>Previous</button><span>Page {page}</span><button className="product-secondary" type="button" disabled={!data.hasMore || loading} onClick={() => setPage(page + 1)}>Next</button></nav> : null}
  </section>;
}
