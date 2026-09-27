"use client";
import { FormEvent } from "react";
import { useMutation } from "../../../hooks/use-mutation";
import { money } from "../../../lib/api/discovery";
import { ManagedEvent } from "./types";
export function EventTicketTypes({
  event,
  refresh,
}: {
  event: ManagedEvent;
  refresh: () => void;
}) {
  const mutation = useMutation(refresh);
  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const data = new FormData(form);
    const saved = await mutation.run(
      `/events/${event.id}/ticket-types`,
      "POST",
      {
        name: data.get("name"),
        description: data.get("description"),
        priceCents: Math.round(Number(data.get("price")) * 100),
        quantity: Number(data.get("quantity")),
        maxTicketsPerBuyer: Number(data.get("max")),
      },
      "Ticket type added.",
    );
    if (saved) form.reset();
  }
  return (
    <section>
      <h2>Ticket types</h2>
      <div className="account-grid">
        {event.ticketTypes.map((ticket) => (
          <article className="account-panel" key={ticket.id}>
            <h3>{ticket.name}</h3>
            <p>
              {money(ticket.priceCents)} · {ticket.sold} of {ticket.quantity}{" "}
              reserved or sold
            </p>
            <p>Maximum {ticket.maxTicketsPerBuyer} per buyer</p>
          </article>
        ))}
      </div>
      <details className="product-form business-create">
        <summary>Add a ticket type</summary>
        <form onSubmit={submit}>
          <label>
            Name
            <input name="name" required maxLength={100} />
          </label>
          <label>
            Description
            <textarea name="description" maxLength={1000} />
          </label>
          <label>
            Price (AUD, 0 for free)
            <input
              name="price"
              type="number"
              min={0}
              max={1000000}
              step="0.01"
              required
            />
          </label>
          <label>
            Quantity
            <input
              name="quantity"
              type="number"
              min={1}
              max={1000000}
              required
            />
          </label>
          <label>
            Maximum per buyer
            <input
              name="max"
              type="number"
              min={1}
              max={20}
              defaultValue={4}
              required
            />
          </label>
          <button className="product-primary" disabled={mutation.busy}>
            {mutation.busy ? "Adding…" : "Add ticket type"}
          </button>
        </form>
      </details>
      {mutation.error ? <p role="alert">{mutation.error}</p> : null}
      {mutation.notice ? <p role="status">{mutation.notice}</p> : null}
    </section>
  );
}
