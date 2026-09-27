"use client";
import { LoadingState } from "../ui/loading-state";
import Link from "next/link";
import { usePrivateResource } from "../../hooks/use-private-resource";
import { TicketPass, AccountTicket } from "./ticket-pass";
import { AccountGate } from "./gate";
function TicketList() {
  const { data, loading, error, retry } = usePrivateResource<{
    tickets: AccountTicket[];
  }>("/events/tickets/me");
  return (
    <>
      <h1>Your tickets</h1>
      {loading ? <LoadingState label="Loading tickets…" variant="cards" refreshing={!!data} /> : null}
      {error ? (
        <div role="alert" className="product-notice">
          <p>{error}</p>
          <button onClick={retry} className="product-secondary">
            Try again
          </button>
        </div>
      ) : null}
      <div className="account-grid">
        {data?.tickets.map((ticket) => (
          <TicketPass key={ticket.publicId} ticket={ticket} refresh={retry} disabled={loading || !!error} />
        ))}
      </div>
      {!loading && !error && data?.tickets.length === 0 ? (
        <div className="product-empty">
          <h2>Your next experience is waiting.</h2>
          <p>Tickets issued to your account will appear here.</p>
          <Link className="product-primary" href="/events">
            Explore events
          </Link>
        </div>
      ) : null}
    </>
  );
}
export function AccountTickets() {
  return <AccountGate>{() => <TicketList />}</AccountGate>;
}
