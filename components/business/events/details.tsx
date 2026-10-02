"use client";
import { FormEvent, useState } from "react";
import { useMutation } from "../../../hooks/use-mutation";
import { Locality, LocalityField } from "../locality-field";
import { ManagedEvent, localDate } from "./types";
import { DateField } from "../../ui/date-field";
import { HubShareField } from "../hub-share-field";
export function EventDetails({
  event,
  refresh,
}: {
  event: ManagedEvent;
  refresh: () => void;
}) {
  const mutation = useMutation(refresh);
  const [locality, setLocality] = useState<Locality | null>(null);
  const [hubIds, setHubIds] = useState<number[]>(event.communityIds ?? []);
  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const start = new Date(String(form.get("startsAt")));
    const end = new Date(String(form.get("endsAt")));
    if (end <= start) {
      const endInput = e.currentTarget.querySelector<HTMLInputElement>("[name=endsAt]");
      endInput?.setCustomValidity("Choose an end after the start.");
      endInput?.reportValidity();
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
        communityIds: hubIds,
        allowGroupBookings: form.get("allowGroupBookings") === "on",
      },
      "Event updated.",
    );
  }
  const publicUrl = typeof window !== "undefined" ? `${window.location.origin}/events/${event.id}` : `/events/${event.id}`;
  return (
    <div className="event-details-layout">
    <form className="showcase-form event-details-form" onSubmit={submit} aria-busy={mutation.busy}>
      <fieldset disabled={mutation.busy} className="event-details-fieldset">
        <section className="showcase-step">
          <h2>Basics</h2>
          <p className="showcase-hint">Keep the name and description up to date for your guests.</p>
          <label>Event name<input name="title" defaultValue={event.title} required minLength={3} maxLength={160} /></label>
          <label>Description<textarea name="description" defaultValue={event.description || ""} rows={6} maxLength={10000} placeholder="What can people expect?" /></label>
          <label><span className="showcase-label">Category <span className="showcase-optional">Optional</span></span><input name="category" defaultValue={event.category || ""} maxLength={100} /></label>
        </section>

        <section className="showcase-step">
          <h2>Date</h2>
          <div className="showcase-row">
            <label>Starts (your local time)<DateField kind="datetime" name="startsAt" label="Starts at" defaultValue={localDate(event.startsAt)} required /></label>
            {/* DateField clears any custom validity message when the value changes. */}
            <label>Ends (your local time)<DateField kind="datetime" name="endsAt" label="Ends at" defaultValue={localDate(event.endsAt)} required /></label>
          </div>
        </section>

        <section className="showcase-step">
          <h2>{event.locationType === "online" ? "Online event" : "Location"}</h2>
          {event.locationType === "online" ? (
            <label>Joining link<input type="url" name="onlineUrl" defaultValue={event.onlineUrl || ""} required placeholder="https://" /></label>
          ) : <>
            <p className="event-current-locality"><span>Suburb</span><strong>{[event.suburb, event.state, event.postcode].filter(Boolean).join(", ") || "Not set"}</strong></p>
            <details className="showcase-more event-change-locality">
              <summary>Change suburb</summary>
              <LocalityField required={false} onChange={setLocality} />
            </details>
            <div className="showcase-row">
              <label>Venue name<input name="venueName" defaultValue={event.venueName || ""} maxLength={160} /></label>
              <label>Venue address<input name="address" defaultValue={event.address || ""} maxLength={300} /></label>
            </div>
          </>}
        </section>

        <section className="showcase-step">
          <h2>Group bookings</h2>
          <label className="showcase-switch">
            <input type="checkbox" role="switch" name="allowGroupBookings" defaultChecked={!!event.allowGroupBookings} />
            <span className="showcase-switch-track" aria-hidden="true" />
            <span><strong>Allow group bookings</strong><small>Shows “Book as a group” on your event page, with your group packages and a request form for large groups.</small></span>
          </label>
        </section>

        <section className="showcase-step"><HubShareField kind="event" value={hubIds} onChange={setHubIds} disabled={mutation.busy} /></section>
      </fieldset>
      {mutation.error ? <p className="product-error" role="alert">{mutation.error}</p> : null}
      {mutation.notice ? <p className="product-notice" role="status">{mutation.notice}</p> : null}
      <div className="showcase-actions">
        <span className="showcase-hint">Changes show on your event page straight away.</span>
        <span><button className="product-primary press-fx" disabled={mutation.busy}>{mutation.busy ? "Saving…" : "Save changes"}</button></span>
      </div>
    </form>
    <aside className="event-glance" aria-label="Event at a glance">
      <div className="event-glance-card">
        <span className="event-glance-label">Your event page</span>
        {event.status === "published" ? <>
          <a className="event-glance-link" href={`/events/${event.id}`} target="_blank" rel="noopener noreferrer">{publicUrl.replace(/^https?:\/\//, "")} <span aria-hidden="true">↗</span></a>
          <button type="button" className="product-secondary press-fx" onClick={() => void navigator.clipboard?.writeText(publicUrl)}>Copy link</button>
        </> : <p>Publish your event to get a shareable page.</p>}
      </div>
      <div className="event-glance-card">
        <span className="event-glance-label">When &amp; where</span>
        <p><strong>{new Date(event.startsAt).toLocaleString("en-AU", { weekday: "long", day: "numeric", month: "long", hour: "numeric", minute: "2-digit" })}</strong></p>
        <p>{event.locationType === "online" ? "Online event" : [event.venueName, event.address, [event.suburb, event.state].filter(Boolean).join(" ")].filter(Boolean).join(", ") || "Location to be confirmed"}</p>
      </div>
      <div className="event-glance-card">
        <span className="event-glance-label">Ticket packages</span>
        {event.ticketTypes.length ? <ul className="event-glance-packages">{event.ticketTypes.map((ticket) => <li key={ticket.id}>
          <span><strong>{ticket.name}</strong><small>{ticket.sold} of {ticket.quantity} sold{ticket.active === false ? " · paused" : ""}</small></span>
          <span>{ticket.priceCents ? `$${(ticket.priceCents / 100).toFixed(2)}` : "Free"}</span>
        </li>)}</ul> : <p>No packages yet.</p>}
      </div>
    </aside>
    </div>
  );
}
