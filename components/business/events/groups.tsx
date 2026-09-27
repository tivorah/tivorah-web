"use client";
import { LoadingState } from "../../ui/loading-state";
import { FormEvent } from "react";
import { usePrivateResource } from "../../../hooks/use-private-resource";
import { useMutation } from "../../../hooks/use-mutation";
import { ManagedEvent } from "./types";
type Group = {
  id: number;
  buyerEmail: string;
  quantity: number;
  status: string;
  expiresAt: string;
};
export function EventGroups({ event }: { event: ManagedEvent }) {
  const { data, loading, error, retry } = usePrivateResource<{
    allocations: Group[];
  }>(`/events/${event.id}/group-allocations`);
  const mutation = useMutation(retry);
  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    await mutation.run(
      `/events/${event.id}/group-allocations`,
      "POST",
      {
        ticketTypeId: Number(f.get("ticket")),
        buyerEmail: f.get("email"),
        quantity: Number(f.get("quantity")),
        expiresInHours: Number(f.get("hours")),
      },
      "Group reservation created and invitation sent.",
    );
  }
  return (
    <section>
      <h2>Group reservations</h2>
      <p>
        Reserve 21–120 tickets for one buyer. They receive a private invitation
        and must sign in with the invited email.
      </p>
      {loading ? <LoadingState label="Loading reservations…" refreshing={!!data} /> : null}
      {error ? (
        <p role="alert">
          {error} <button onClick={retry}>Try again</button>
        </p>
      ) : null}
      {data && !error ? (
        <>
          <div className="account-grid">
            {data.allocations.map((group) => (
              <article key={group.id} className="account-panel">
                <h3>{group.buyerEmail}</h3>
                <p>
                  {group.quantity} tickets · {group.status}
                </p>
                <p>
                  Expires {new Date(group.expiresAt).toLocaleString("en-AU")}
                </p>
                {group.status === "held" ? (
                  <div className="account-actions">
                    <button
                      className="product-secondary"
                      disabled={mutation.busy}
                      onClick={() =>
                        mutation.run(
                          `/events/${event.id}/group-allocations/${group.id}/resend`,
                          "POST",
                          undefined,
                          "Invitation resent.",
                        )
                      }
                    >
                      Resend invitation
                    </button>
                    <details>
                      <summary>Cancel reservation</summary>
                      <p>Release this group’s held tickets?</p>
                      <button
                        className="product-secondary"
                        disabled={mutation.busy}
                        onClick={() =>
                          mutation.run(
                            `/events/${event.id}/group-allocations/${group.id}/cancel`,
                            "POST",
                            undefined,
                            "Reservation cancelled.",
                          )
                        }
                      >
                        Confirm cancellation
                      </button>
                    </details>
                  </div>
                ) : null}
              </article>
            ))}
          </div>
          {!data.allocations.length ? <p>No group reservations yet.</p> : null}
          <details className="product-form business-create">
            <summary>Create a group reservation</summary>
            <form onSubmit={submit}>
              <label>
                Ticket type
                <select name="ticket" required>
                  {event.ticketTypes.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Buyer email
                <input type="email" name="email" required maxLength={254} />
              </label>
              <label>
                Tickets
                <input
                  type="number"
                  name="quantity"
                  min={21}
                  max={120}
                  defaultValue={21}
                  required
                />
              </label>
              <label>
                Hold for (hours)
                <input
                  type="number"
                  name="hours"
                  min={1}
                  max={48}
                  defaultValue={24}
                  required
                />
              </label>
              <button
                className="product-primary"
                disabled={mutation.busy || !event.ticketTypes.length}
              >
                {mutation.busy ? "Creating…" : "Send invitation"}
              </button>
            </form>
          </details>
        </>
      ) : null}
      {mutation.error ? <p role="alert">{mutation.error}</p> : null}
      {mutation.notice ? <p role="status">{mutation.notice}</p> : null}
    </section>
  );
}
