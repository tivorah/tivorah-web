"use client";
import { BookingSetupNotice } from "../booking-setup-notice";
import { refundPolicyOptions } from "../../../lib/refund-policy";
import { SelectField } from "../../ui/select-field";
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
        information: {
          arrival: String(form.get('arrival') || ''), accessibility: String(form.get('accessibility') || ''),
          agePolicy: String(form.get('agePolicy') || ''), refundPolicy: String(form.get('refundPolicy') || ''),
          faqs: Array.from({length: 8}, (_, index) => ({ question: String(form.get(`faq-question-${index}`) || '').trim(), answer: String(form.get(`faq-answer-${index}`) || '').trim() })).filter(row => row.question || row.answer),
        },
        category: form.get("category"),
        gstTreatment: form.get("gstTreatment"),
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
        refundPolicy: String(form.get("refundPolicyPreset") || "") || null,
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
          <h2>Plan your visit</h2>
          <p className="showcase-hint">Optional details help people decide and arrive prepared. Only completed answers appear on your event page.</p>
          <label>Refund policy<SelectField name="refundPolicyPreset" label="Refund policy" defaultValue={event.refundPolicy || ""} placeholder="Choose a refund policy" options={[...refundPolicyOptions]} /></label>
          {(['agePolicy', 'arrival', 'accessibility', 'refundPolicy'] as const).map(key => <label key={key}>{({agePolicy: 'Age and ID requirements', arrival: 'Arrival, parking and doors', accessibility: 'Accessibility', refundPolicy: 'Refund details'})[key]}<textarea name={key} defaultValue={event.information?.[key] || ''} rows={key === 'agePolicy' ? 2 : 3} maxLength={key === 'agePolicy' ? 200 : 1200} /></label>)}
          <p className="showcase-hint">Your policy cannot remove applicable consumer rights. Keep cancellation and refund instructions clear.</p>
          <details className="showcase-more"><summary>Frequently asked questions</summary>{Array.from({length: 8}, (_, index) => <div className="showcase-step" key={index}><label>Question {index + 1}<input name={`faq-question-${index}`} defaultValue={event.information?.faqs?.[index]?.question || ''} maxLength={200} minLength={3} /></label><label>Answer {index + 1}<textarea name={`faq-answer-${index}`} defaultValue={event.information?.faqs?.[index]?.answer || ''} maxLength={1600} minLength={2} rows={3} /></label></div>)}</details>
        </section>
        <section className="showcase-step">
          <h2 id="event-gst">Ticket GST</h2>
          <p className="showcase-hint">AUD ticket sales require a seller declaration. Registered sellers must also choose this event’s GST treatment before customers can book.</p>
          <p className="showcase-hint">Set your <a href="/business/payouts#event-tax">seller tax details</a> first. Your entered ticket prices include GST when applicable. This affects new bookings only.</p>
          <label>Australian GST treatment<SelectField label="Australian GST treatment" name="gstTreatment" defaultValue={event.gstTreatment || "unspecified"} options={[{value:"unspecified", label:"Not specified"}, {value:"taxable", label:"Taxable · 10% GST included"}, {value:"gst_free",label:"GST-free"}, {value:"input_taxed",label:"Input taxed"}]} /></label>
          <p className="showcase-hint">If you are not GST registered, no GST is charged on your tickets. For a registered seller, select the treatment that applies to this event; ask your accountant if unsure.</p>
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
      <BookingSetupNotice issues={mutation.setupIssues} />
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
          <span>{ticket.priceCents ? new Intl.NumberFormat('en-AU', { style: 'currency', currency: ticket.currency || 'AUD', currencyDisplay: 'code' }).format(ticket.priceCents / 100) : "Free"}</span>
        </li>)}</ul> : <p>No packages yet.</p>}
      </div>
    </aside>
    </div>
  );
}
