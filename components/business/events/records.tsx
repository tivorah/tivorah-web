"use client";
import { LoadingState } from "../../ui/loading-state";
import { useState } from "react";
import { usePrivateResource } from "../../../hooks/use-private-resource";
import { money } from "../../../lib/api/discovery";
type Orders = {
  summary: {
    ticketsSold: number;
    remaining: number;
    grossCents: number;
    checkedIn: number;
  };
  orders: {
    id: number;
    buyerName: string;
    ticketName: string;
    quantity: number;
    totalCents: number;
    status: string;
    checkedIn: number;
  }[];
};
export function EventRecords({ id }: { id: number }) {
  const { data, loading, error, retry } = usePrivateResource<Orders>(
    `/events/${id}/orders`,
  );
  const [skip, setSkip] = useState(0);
  const attendees = usePrivateResource<{
    attendees: {
      id: number;
      username: string;
      firstName: string;
      lastName: string | null;
    }[];
    pagination: { isMoreData: boolean };
  }>(`/events/${id}/attendees?skip=${skip}&take=40`);
  return (
    <section>
      <h2>Orders & attendees</h2>
      {loading ? <LoadingState label="Loading orders…" refreshing={!!data} /> : null}
      {error ? (
        <p role="alert">
          {error} <button onClick={retry}>Retry orders</button>
        </p>
      ) : null}
      {data ? (
        <>
          <div className="account-panel">
            <p>
              {data.summary.ticketsSold} tickets · {data.summary.checkedIn}{" "}
              checked in · {data.summary.remaining} remaining
            </p>
            <p>Total collected: {money(data.summary.grossCents)}</p>
          </div>
          <div className="account-grid">
            {data.orders.map((order) => (
              <article key={order.id} className="account-panel">
                <h3>{order.buyerName}</h3>
                <p>
                  Order #{order.id} · {order.ticketName}
                </p>
                <p>
                  {order.quantity} tickets · {money(order.totalCents)} ·{" "}
                  {order.status}
                </p>
                <p>{order.checkedIn} checked in</p>
              </article>
            ))}
          </div>
          {!data.orders.length ? <p>No completed orders yet.</p> : null}
        </>
      ) : null}
      <h3>Account ticket holders</h3>
      {attendees.loading ? <LoadingState label="Loading attendees…" refreshing={!!attendees.data} /> : null}
      {attendees.error ? (
        <p role="alert">
          {attendees.error}{" "}
          <button onClick={attendees.retry}>Retry attendees</button>
        </p>
      ) : null}
      <ul>
        {attendees.data?.attendees.map((person) => (
          <li key={person.id}>
            {[person.firstName, person.lastName].filter(Boolean).join(" ") ||
              person.username}
          </li>
        ))}
      </ul>
      <div className="account-actions">
        {skip > 0 ? (
          <button
            className="product-secondary"
            onClick={() => setSkip(Math.max(0, skip - 40))}
          >
            Previous
          </button>
        ) : null}
        {attendees.data?.pagination.isMoreData ? (
          <button
            className="product-secondary"
            onClick={() => setSkip(skip + 40)}
          >
            Next
          </button>
        ) : null}
      </div>
    </section>
  );
}
