"use client";
import { FormEvent } from "react";
import { useMutation } from "../../../hooks/use-mutation";
export function EventCheckIn({
  id,
  published,
}: {
  id: number;
  published: boolean;
}) {
  const mutation = useMutation();
  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const code = String(new FormData(form).get("code") || "").trim();
    const body = /^\d{6}$/.test(code)
      ? { shortCode: code }
      : { qrPayload: code };
    if (
      await mutation.run(
        `/events/${id}/check-ins`,
        "POST",
        body,
        "Ticket checked in. The guest can enter.",
      )
    )
      form.reset();
  }
  return (
    <section className="product-form">
      <h2>Check in a ticket</h2>
      <p>
        Enter the six-digit code from the guest’s ticket, or scan its QR with a
        connected scanner.
      </p>
      {published ? (
        <form onSubmit={submit}>
          <label>
            Ticket code
            <input
              name="code"
              required
              maxLength={4000}
              autoComplete="off"
              autoCapitalize="none"
            />
          </label>
          <button className="product-primary" disabled={mutation.busy}>
            {mutation.busy ? "Checking ticket…" : "Check in"}
          </button>
        </form>
      ) : (
        <p>Check-in is available for published events.</p>
      )}
      {mutation.error ? <p role="alert">{mutation.error}</p> : null}
      {mutation.notice ? <p role="status">{mutation.notice}</p> : null}
    </section>
  );
}
