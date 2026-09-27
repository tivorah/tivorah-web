"use client";
import { FormEvent, useState } from "react";
import { useMutation } from "../../../hooks/use-mutation";
import { Locality, LocalityField } from "../locality-field";
import { ManagedEvent, localDate } from "./types";
export function EventDetails({
  event,
  refresh,
}: {
  event: ManagedEvent;
  refresh: () => void;
}) {
  const mutation = useMutation(refresh);
  const [locality, setLocality] = useState<Locality | null>(null);
  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const start = new Date(String(form.get("startsAt")));
    const end = new Date(String(form.get("endsAt")));
    if (end <= start) {
      e.currentTarget
        .querySelector<HTMLInputElement>("[name=endsAt]")
        ?.setCustomValidity("Choose an end after the start.");
      return;
    }
    await mutation.run(
      `/events/${event.id}`,
      "PATCH",
      {
        title: form.get("title"),
        description: form.get("description"),
        category: form.get("category"),
        startsAt: start.toISOString(),
        endsAt: end.toISOString(),
        venueName: form.get("venueName"),
        address: form.get("address"),
        ...(event.locationType === "online"
          ? { onlineUrl: form.get("onlineUrl") }
          : {}),
        ...(locality || {}),
      },
      "Event updated.",
    );
  }
  return (
    <section className="product-form business-create">
      <h2>Event details</h2>
      <form onSubmit={submit}>
        <fieldset disabled={mutation.busy}>
          <label>
            Title
            <input
              name="title"
              defaultValue={event.title}
              required
              minLength={3}
              maxLength={160}
            />
          </label>
          <label>
            Description
            <textarea
              name="description"
              defaultValue={event.description || ""}
              rows={6}
              maxLength={10000}
            />
          </label>
          <label>
            Category
            <input
              name="category"
              defaultValue={event.category || ""}
              maxLength={100}
            />
          </label>
          <label>
            Starts at (your local time)
            <input
              type="datetime-local"
              name="startsAt"
              defaultValue={localDate(event.startsAt)}
              required
            />
          </label>
          <label>
            Ends at (your local time)
            <input
              type="datetime-local"
              name="endsAt"
              defaultValue={localDate(event.endsAt)}
              onChange={(e) => e.currentTarget.setCustomValidity("")}
              required
            />
          </label>
          {event.locationType === "online" ? (
            <label>
              Joining URL
              <input
                type="url"
                name="onlineUrl"
                defaultValue={event.onlineUrl || ""}
                required
              />
            </label>
          ) : (
            <>
              <p>
                Current locality:{" "}
                {[event.suburb, event.state, event.postcode]
                  .filter(Boolean)
                  .join(", ")}
              </p>
              <details>
                <summary>Change locality</summary>
                <LocalityField required={false} onChange={setLocality} />
              </details>
              <label>
                Venue
                <input
                  name="venueName"
                  defaultValue={event.venueName || ""}
                  maxLength={160}
                />
              </label>
              <label>
                Venue address
                <input
                  name="address"
                  defaultValue={event.address || ""}
                  maxLength={300}
                />
              </label>
            </>
          )}
          <button className="product-primary">
            {mutation.busy ? "Saving…" : "Save changes"}
          </button>
        </fieldset>
      </form>
      {mutation.error ? <p role="alert">{mutation.error}</p> : null}
      {mutation.notice ? <p role="status">{mutation.notice}</p> : null}
    </section>
  );
}
