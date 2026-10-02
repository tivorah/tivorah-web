"use client";
import { useState } from "react";
import Link from "next/link";
import { SelectField } from "../../ui/select-field";
import { useMutation } from "../../../hooks/use-mutation";
import { money } from "../../../lib/api/discovery";
import { ManagedEvent, TicketType } from "./types";
import { PackageDraft, PackageFields, PACKAGE_PRESETS, MAX_PACKAGES, newPackage, packagesPayload, presetPackage } from "./packages-editor";

// Ticket packages for an event: what's on sale, how much has sold, and the tools to
// edit, pause or add packages (e.g. switch from Early bird to General admission).
const localInput = (value?: string | null) => {
  if (!value) return "";
  const date = new Date(value);
  return new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
};
const toDraft = (ticket: TicketType): PackageDraft => newPackage({
  name: ticket.name, description: ticket.description ?? "",
  kind: ticket.kind ?? "standard", groupSize: String(ticket.groupSize ?? 1),
  price: (ticket.priceCents / Math.max(1, ticket.groupSize ?? 1) / 100).toFixed(2),
  regularPrice: ticket.regularPriceCents != null ? (ticket.regularPriceCents / 100).toFixed(2) : "",
  hidden: !!ticket.hidden, accessCode: "", releaseAfter: ticket.releaseAfterTicketTypeId ? `id:${ticket.releaseAfterTicketTypeId}` : "",
  quantity: String(ticket.quantity), maxPerBuyer: String(ticket.maxTicketsPerBuyer),
  salesStartAt: localInput(ticket.salesStartAt), salesEndAt: localInput(ticket.salesEndAt),
});
function status(ticket: TicketType): [string, string] {
  const now = Date.now();
  if (ticket.active === false) return ["Paused", "is-paused"];
  if (ticket.sold >= ticket.quantity) return ["Sold out", "is-ended"];
  if (ticket.salesStartAt && new Date(ticket.salesStartAt).getTime() > now) return [`Starts ${new Date(ticket.salesStartAt).toLocaleDateString("en-AU", { day: "numeric", month: "short" })}`, "is-scheduled"];
  if (ticket.salesEndAt && new Date(ticket.salesEndAt).getTime() <= now) return ["Sale ended", "is-ended"];
  return ["On sale", "is-live"];
}

export function EventTicketTypes({ event, refresh }: { event: ManagedEvent; refresh: () => void }) {
  const mutation = useMutation(refresh);
  const [editing, setEditing] = useState<{ id: number; draft: PackageDraft } | null>(null);
  const [adding, setAdding] = useState<PackageDraft | null>(null);
  const [formError, setFormError] = useState("");
  const used = new Set(event.ticketTypes.map((ticket) => ticket.name.toLowerCase()));
  const releaseOptions = (exclude?: number) => event.ticketTypes.filter((ticket) => ticket.id !== exclude).map((ticket) => ({ value: `id:${ticket.id}`, label: ticket.name }));

  async function saveEdit(ticket: TicketType) {
    if (!editing) return;
    setFormError("");
    try {
      const [payload] = packagesPayload([editing.draft]);
      const sold = ticket.sold > 0;
      const body = {
        ...payload,
        description: payload.description ?? null, salesStartAt: payload.salesStartAt ?? null, salesEndAt: payload.salesEndAt ?? null,
        releaseAfterTicketTypeId: payload.releaseAfterTicketTypeId ?? null,
        // Price and group size are fixed once tickets have sold.
        ...(sold ? { priceCents: undefined, groupSize: undefined, kind: undefined } : {}),
      };
      if (await mutation.run(`/events/${event.id}/ticket-types/${ticket.id}`, "PATCH", body, `${payload.name} updated.`)) setEditing(null);
    } catch (cause) { setFormError(cause instanceof Error ? cause.message : "Check the package details."); }
  }
  async function saveNew() {
    if (!adding) return;
    setFormError("");
    try {
      const [payload] = packagesPayload([adding]);
      if (await mutation.run(`/events/${event.id}/ticket-types`, "POST", payload, `${payload.name} added.`)) setAdding(null);
    } catch (cause) { setFormError(cause instanceof Error ? cause.message : "Check the package details."); }
  }

  return <section className="event-packages">
    <header className="event-tab-head">
      <div>
        <h2>Ticket packages</h2>
        <p>Offer different prices, like Early bird, General admission or Student. Change them any time — tickets already sold keep their price.</p>
      </div>
      {!adding && event.ticketTypes.length < MAX_PACKAGES ? <button type="button" className="product-primary press-fx" onClick={() => { setAdding(newPackage()); setEditing(null); }}>Add a package</button> : null}
    </header>

    {mutation.error || formError ? <p className="product-error" role="alert">{formError || mutation.error}</p> : null}
    {mutation.notice ? <p className="product-notice" role="status">{mutation.notice}</p> : null}

    {adding ? <div className="showcase-step event-package-editor">
      <h3>New package</h3>
      <label className="event-package-preset">Start with a ticket type
        <SelectField label="Start with a ticket type" value={PACKAGE_PRESETS.some((preset) => preset.name === adding.name) ? adding.name : ""} onChange={(name) => {
          const preset = PACKAGE_PRESETS.find((item) => item.name === name);
          if (preset) setAdding({ ...presetPackage(preset, adding.price), key: adding.key });
        }} options={[{ value: "", label: "Custom package" }, ...PACKAGE_PRESETS.filter((preset) => !used.has(preset.name.toLowerCase())).map((preset) => ({ value: preset.name, label: `${preset.name} · ${preset.blurb}` }))]} />
      </label>
      <PackageFields draft={adding} index={event.ticketTypes.length} onChange={setAdding} releaseOptions={releaseOptions()} />
      <div className="event-group-form-actions">
        <button type="button" className="showcase-link" onClick={() => { setAdding(null); setFormError(""); }}>Cancel</button>
        <button type="button" className="product-primary press-fx" disabled={mutation.busy} onClick={() => void saveNew()}>{mutation.busy ? "Adding…" : "Add package"}</button>
      </div>
    </div> : null}

    {event.ticketTypes.length ? <ul className="event-package-list">
      {event.ticketTypes.map((ticket) => {
        const [label, tone] = status(ticket);
        const percent = Math.min(100, Math.round((ticket.sold / Math.max(1, ticket.quantity)) * 100));
        if (editing?.id === ticket.id) return <li key={ticket.id} className="is-editing">
          <PackageFields draft={editing.draft} index={0} onChange={(draft) => setEditing({ id: ticket.id, draft })} lockPrice={ticket.sold > 0} releaseOptions={releaseOptions(ticket.id)} codeSaved={!!ticket.hasAccessCode} />
          <div className="event-group-form-actions">
            <button type="button" className="showcase-link" onClick={() => { setEditing(null); setFormError(""); }}>Cancel</button>
            <button type="button" className="product-primary press-fx" disabled={mutation.busy} onClick={() => void saveEdit(ticket)}>{mutation.busy ? "Saving…" : "Save package"}</button>
          </div>
        </li>;
        return <li key={ticket.id}>
          <div className="event-package-main">
            <div className="event-package-title"><strong>{ticket.name}</strong><span className={`event-package-status ${tone}`}>{label}</span>
              {ticket.kind === "group" ? <span className="package-tag">Group of {ticket.groupSize}</span> : null}
              {ticket.hidden ? <span className="package-tag">Code only</span> : null}
              {ticket.releaseAfterTicketTypeId ? <span className="package-tag">After {event.ticketTypes.find((item) => item.id === ticket.releaseAfterTicketTypeId)?.name ?? "another package"}</span> : null}
            </div>
            {ticket.description ? <p>{ticket.description}</p> : null}
            <div className="event-package-meter" aria-label={`${ticket.sold} of ${ticket.quantity} sold`}><span style={{ width: `${percent}%` }} /></div>
            <span className="event-package-meta">{ticket.sold} of {ticket.quantity} sold · up to {ticket.maxTicketsPerBuyer} per person{ticket.salesEndAt ? ` · sale ends ${new Date(ticket.salesEndAt).toLocaleDateString("en-AU", { day: "numeric", month: "short" })}` : ""}</span>
          </div>
          <strong className="event-package-price">{ticket.priceCents ? money(ticket.priceCents) : "Free"}{ticket.kind === "group" && ticket.priceCents ? <small>{money(Math.round(ticket.priceCents / Math.max(1, ticket.groupSize ?? 1)))} each</small> : null}</strong>
          <div className="event-package-actions">
            <button type="button" className="showcase-link" onClick={() => { setEditing({ id: ticket.id, draft: toDraft(ticket) }); setAdding(null); setFormError(""); }}>Edit</button>
            <button type="button" className="showcase-link" disabled={mutation.busy} onClick={() => void mutation.run(`/events/${event.id}/ticket-types/${ticket.id}`, "PATCH", { active: ticket.active === false }, ticket.active === false ? `${ticket.name} is on sale again.` : `${ticket.name} is paused. Nobody can buy it until you resume.`)}>{ticket.active === false ? "Resume sales" : "Pause sales"}</button>
          </div>
        </li>;
      })}
    </ul> : <div className="event-empty"><strong>No ticket packages yet</strong><p>Add a package so people can book this event.</p></div>}
    <p className="showcase-hint">Paid packages need <Link href="/business/payouts">payout setup</Link>.</p>
  </section>;
}
