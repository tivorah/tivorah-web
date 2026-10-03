"use client";

import { useId, useState } from "react";
import { Sheet } from "../../ui/sheet";
import { DateField } from "../../ui/date-field";
import { SelectField } from "../../ui/select-field";

// Ticket "pricing packages" (ticket types): General admission, Early bird, Student, Group…
// Each package has its own price, quantity, per-person limit and optional sales window.
// A group package admits several people per purchase (each gets their own ticket) at a
// per-person price, optionally showing the saving against the usual price. A package can
// also go on sale automatically when another sells out, or be hidden behind an access code.
export type PackageDraft = {
  key: string;
  name: string;
  description: string;
  /** Price per ticket, or per person for a group package. */
  price: string;
  currency?: string;
  quantity: string;
  maxPerBuyer: string;
  salesStartAt: string;
  salesEndAt: string;
  kind: "standard" | "group";
  groupSize: string;
  /** Usual price per person, to show a group saving. */
  regularPrice: string;
  hidden: boolean;
  accessCode: string;
  /** "key:<draft key>" while creating, or "id:<ticket type id>" when editing. */
  releaseAfter: string;
};

export const MAX_PACKAGES = 10;
export const PACKAGE_PRESETS: { name: string; description?: string; kind?: "group"; hidden?: boolean; icon: string; blurb: string }[] = [
  { name: "General admission", icon: "🎟️", blurb: "The standard ticket" },
  { name: "Early bird", icon: "🐦", blurb: "Cheaper for the keen ones", description: "Limited early pricing — ends when sold out or when the sale window closes." },
  { name: "Student / concession", icon: "🎓", blurb: "ID checked at the door", description: "A valid student or concession card must be shown at entry." },
  { name: "Group", icon: "👯", blurb: "One booking, whole crew", kind: "group", description: "One booking for your whole group. Everyone gets their own ticket." },
  { name: "VIP", icon: "⭐", blurb: "Treat your favourites", description: "Includes priority entry. Describe any extras included." },
  { name: "Second release", icon: "🔁", blurb: "Opens when the first sells out" },
  { name: "Final release", icon: "⏳", blurb: "Last chance pricing" },
  { name: "Presale", icon: "🔒", blurb: "Code required to unlock", hidden: true, description: "Only available with an access code." },
  { name: "Free entry", icon: "🎁", blurb: "On the house" },
];

let counter = 0;
export const newPackage = (preset: Partial<PackageDraft> = {}): PackageDraft => ({
  key: `pkg-${Date.now()}-${counter++}`,
  name: "", description: "", price: "0", currency: "AUD", quantity: "50", maxPerBuyer: "4", salesStartAt: "", salesEndAt: "",
  kind: "standard", groupSize: "6", regularPrice: "", hidden: false, accessCode: "", releaseAfter: "",
  ...preset,
});
export const presetPackage = (preset: (typeof PACKAGE_PRESETS)[number], price = "0") => newPackage({
  name: preset.name, description: preset.description ?? "", price: preset.name === "Free entry" ? "0" : price,
  kind: preset.kind ?? "standard", hidden: !!preset.hidden, maxPerBuyer: preset.kind === "group" ? "2" : "4", quantity: preset.kind === "group" ? "10" : "50",
});

const dollars = (value: number, currency = "AUD") => new Intl.NumberFormat("en-AU", { style: "currency", currency, currencyDisplay: "code", maximumFractionDigits: 2 }).format(value);
/** Group summary like "Group of 6 · $120 total ($20 each) · save 20%". */
export function groupSummary(draft: Pick<PackageDraft, "kind" | "groupSize" | "price" | "regularPrice" | "currency">) {
  if (draft.kind !== "group") return null;
  const size = Number(draft.groupSize) || 0;
  const each = Number(draft.price) || 0;
  const usual = Number(draft.regularPrice) || 0;
  const saving = usual > each && usual > 0 ? Math.round((1 - each / usual) * 100) : 0;
  return `Group of ${size} · ${each ? `${dollars(each * size, draft.currency)} total (${dollars(each, draft.currency)} each)` : "Free"}${saving ? ` · save ${saving}%` : ""}`;
}

/** Turns the drafts into the API's `tickets` array, or throws a friendly message. */
export function packagesPayload(drafts: PackageDraft[]) {
  if (!drafts.length) throw new Error("Add at least one ticket package.");
  if (new Set(drafts.map(draft => draft.currency || "AUD")).size > 1) throw new Error("Use one currency for all ticket packages in this event.");
  const names = new Set<string>();
  return drafts.map((draft, index) => {
    const label = draft.name.trim() || `Package ${index + 1}`;
    const name = draft.name.trim();
    if (!name) throw new Error(`Give package ${index + 1} a name, like “General admission”.`);
    if (names.has(name.toLowerCase())) throw new Error(`Two packages are called “${name}”. Give each a different name.`);
    names.add(name.toLowerCase());
    const group = draft.kind === "group";
    const groupSize = group ? Number(draft.groupSize) : 1;
    if (group && (!Number.isInteger(groupSize) || groupSize < 2 || groupSize > 50)) throw new Error(`Set between 2 and 50 people per group for ${label}.`);
    const each = Math.round(Number(draft.price || 0) * 100);
    if (!Number.isFinite(each) || each < 0) throw new Error(`Enter a valid price for ${label}.`);
    const priceCents = each * groupSize;
    if (priceCents > 0 && priceCents < 50) throw new Error(`Paid tickets must cost at least $0.50 (${label}).`);
    const regular = draft.regularPrice.trim() ? Math.round(Number(draft.regularPrice) * 100) : null;
    if (regular != null && (!Number.isFinite(regular) || regular < 0)) throw new Error(`Enter a valid usual price for ${label}.`);
    const quantity = Number(draft.quantity);
    if (!Number.isInteger(quantity) || quantity < 1) throw new Error(`Enter how many ${label} ${group ? "groups" : "tickets"} are available.`);
    const maxTicketsPerBuyer = Number(draft.maxPerBuyer);
    if (!Number.isInteger(maxTicketsPerBuyer) || maxTicketsPerBuyer < 1 || maxTicketsPerBuyer > 20) throw new Error(`Set a per-booking limit between 1 and 20 for ${label}.`);
    const start = draft.salesStartAt ? new Date(draft.salesStartAt) : null;
    const end = draft.salesEndAt ? new Date(draft.salesEndAt) : null;
    if (start && end && end <= start) throw new Error(`Sales for ${label} must end after they start.`);
    const code = draft.accessCode.trim();
    if (draft.hidden && code && !/^[A-Za-z0-9-]{3,40}$/.test(code)) throw new Error(`The access code for ${label} must be 3–40 letters, numbers or dashes.`);
    const releaseIndex = draft.releaseAfter.startsWith("key:") ? drafts.findIndex((item) => `key:${item.key}` === draft.releaseAfter) : -1;
    return {
      name, priceCents, currency: draft.currency || "AUD", quantity, maxTicketsPerBuyer,
      kind: draft.kind, groupSize,
      regularPriceCents: group ? regular : null,
      description: draft.description.trim() || undefined,
      salesStartAt: start ? start.toISOString() : undefined,
      salesEndAt: end ? end.toISOString() : undefined,
      hidden: draft.hidden,
      ...(draft.hidden && code ? { accessCode: code } : {}),
      ...(releaseIndex >= 0 && releaseIndex !== index ? { releaseAfterIndex: releaseIndex } : {}),
      ...(draft.releaseAfter.startsWith("id:") ? { releaseAfterTicketTypeId: Number(draft.releaseAfter.slice(3)) } : {}),
    };
  });
}

export function PackageFields({ draft, onChange, index, onRemove, lockPrice = false, releaseOptions = [], codeSaved = false }: {
  draft: PackageDraft; onChange: (draft: PackageDraft) => void; index: number; onRemove?: () => void; lockPrice?: boolean;
  /** Other packages this one can follow ("goes on sale when … sells out"). */
  releaseOptions?: { value: string; label: string }[];
  /** Editing a hidden package whose code is already set (leave blank to keep it). */
  codeSaved?: boolean;
}) {
  const id = useId();
  const set = (patch: Partial<PackageDraft>) => onChange({ ...draft, ...patch });
  const group = draft.kind === "group";
  const each = Number(draft.price || 0);
  const summary = groupSummary(draft);
  return <fieldset className="package-card">
    <legend className="sr-only">Ticket package {index + 1}</legend>
    <div className="package-card-head">
      <span className="package-card-index">{index + 1}</span>
      <strong>{draft.name.trim() || "New package"}</strong>
      {draft.hidden ? <span className="package-tag">Code only</span> : null}
      <span className={`package-card-price${each === 0 ? " is-free" : ""}`}>{each === 0 ? "Free" : group ? `${dollars(each, draft.currency)} each` : dollars(each, draft.currency)}</span>
      {onRemove ? <button type="button" className="package-card-remove" onClick={onRemove} aria-label={`Remove ${draft.name.trim() || `package ${index + 1}`}`}>×</button> : null}
    </div>

    <div className="showcase-row">
      <label>Package name
        <input value={draft.name} onChange={(event) => set({ name: event.target.value })} required maxLength={100} placeholder={group ? "e.g. Group of 6" : "e.g. Early bird"} />
      </label>
      <label>Currency<select value={draft.currency || "AUD"} onChange={(event) => set({ currency: event.target.value })} disabled={lockPrice}>{["AUD", "NZD", "USD", "CAD", "GBP", "EUR", "SGD"].map((currency) => <option key={currency} value={currency}>{currency}</option>)}</select></label>
      {group ? <label>People per group
        <input type="number" min={2} max={50} value={draft.groupSize} onChange={(event) => set({ groupSize: event.target.value })} required disabled={lockPrice} />
      </label> : <label>Price per ticket
        <input type="number" min={0} max={1000000} step="0.01" value={draft.price} onChange={(event) => set({ price: event.target.value })} required disabled={lockPrice} aria-describedby={lockPrice ? `${id}-locked` : undefined} />
      </label>}
    </div>
    {group ? <div className="showcase-row">
      <label>Price per person
        <input type="number" min={0} max={1000000} step="0.01" value={draft.price} onChange={(event) => set({ price: event.target.value })} required disabled={lockPrice} />
      </label>
      <label>{group ? "Groups available" : "Tickets available"}<input type="number" min={1} max={1000000} value={draft.quantity} onChange={(event) => set({ quantity: event.target.value })} required /></label>
    </div> : null}
    {summary ? <p className="package-summary">{summary}</p> : null}
    {lockPrice ? <span id={`${id}-locked`} className="showcase-hint">Tickets have sold, so the price and group size are fixed.</span> : null}

    {!group ? <label className="package-quantity">Tickets available<input type="number" min={1} max={1000000} value={draft.quantity} onChange={(event) => set({ quantity: event.target.value })} required /></label> : null}

    <details className="package-card-more" open={draft.hidden || undefined}>
      <summary>More options <span>{draft.description || draft.salesStartAt || draft.salesEndAt || draft.regularPrice || draft.releaseAfter || draft.hidden ? "Options saved" : "Booking limit, dates, access"}</span></summary>
      <label className="package-kind-select">Admission type
        <SelectField label="Admission type" value={draft.kind} onChange={(value) => set({ kind: value as PackageDraft["kind"] })} disabled={lockPrice}
          options={[{ value: "standard", label: "Single ticket · one person" }, { value: "group", label: "Group ticket · one booking for everyone" }]} />
      </label>
      <div className="showcase-row">
        <label>{group ? "Groups per booking" : "Limit per person"}<input type="number" min={1} max={20} value={draft.maxPerBuyer} onChange={(event) => set({ maxPerBuyer: event.target.value })} required /></label>
        {group ? <label><span className="showcase-label">Usual price per person <span className="showcase-optional">Optional</span></span>
          <input type="number" min={0} max={1000000} step="0.01" value={draft.regularPrice} onChange={(event) => set({ regularPrice: event.target.value })} placeholder="Shows the saving" />
        </label> : null}
      </div>
      <label>What’s included or required
        <textarea rows={2} maxLength={1000} value={draft.description} onChange={(event) => set({ description: event.target.value })} placeholder="e.g. Includes a welcome drink. Student ID required at entry." />
      </label>
      <div className="showcase-row">
        <label>Sales start<DateField name={`${draft.key}-sales-start`} label="Sales start" kind="datetime" value={draft.salesStartAt} onChange={(value: string) => set({ salesStartAt: value })} /></label>
        <label>Sales end<DateField name={`${draft.key}-sales-end`} label="Sales end" kind="datetime" value={draft.salesEndAt} onChange={(value: string) => set({ salesEndAt: value })} /></label>
      </div>
      {releaseOptions.length ? <label>Goes on sale when this sells out
        <SelectField label="Goes on sale when this sells out" value={draft.releaseAfter} onChange={(value) => set({ releaseAfter: value })}
          options={[{ value: "", label: "Not linked — use the sale dates above" }, ...releaseOptions]} />
        <span className="showcase-hint">Great for releases: Second release opens automatically when Early bird sells out.</span>
      </label> : null}
      <label className="showcase-switch package-hidden-switch">
        <input type="checkbox" role="switch" checked={draft.hidden} onChange={(event) => set({ hidden: event.target.checked })} />
        <span className="showcase-switch-track" aria-hidden="true" />
        <span><strong>Only with an access code</strong><small>Hidden from the event page until someone enters the code — for presales, VIPs or guest lists.</small></span>
      </label>
      {draft.hidden ? <label>Access code
        <input value={draft.accessCode} onChange={(event) => set({ accessCode: event.target.value.toUpperCase().replace(/[^A-Z0-9-]/g, "") })} maxLength={40} placeholder={codeSaved ? "Leave blank to keep the current code" : "e.g. VIP2026"} autoCapitalize="characters" required={!codeSaved} />
      </label> : null}
    </details>
  </fieldset>;
}

export function PackagesEditor({ value, onChange }: { value: PackageDraft[]; onChange: (value: PackageDraft[]) => void }) {
  const used = new Set(value.map((draft) => draft.name.trim().toLowerCase()));
  const add = (preset?: (typeof PACKAGE_PRESETS)[number]) => onChange([...value, preset ? presetPackage(preset, value[value.length - 1]?.price ?? "0") : newPackage()]);
  return <div className="packages-editor">
    {value.map((draft, index) => <PackageFields key={draft.key} draft={draft} index={index}
      releaseOptions={value.filter((item) => item.key !== draft.key).map((item) => ({ value: `key:${item.key}`, label: item.name.trim() || "Unnamed package" }))}
      onChange={(next) => onChange(value.map((item) => item.key === draft.key ? next : item))}
      onRemove={value.length > 1 ? () => onChange(value.filter((item) => item.key !== draft.key).map((item) => item.releaseAfter === `key:${draft.key}` ? { ...item, releaseAfter: "" } : item)) : undefined} />)}
    {value.length < MAX_PACKAGES ? <div className="packages-add">
      <label className="event-package-preset">Add a ticket type
        <SelectField label="Add a ticket type" value="" onChange={(name) => {
          const preset = PACKAGE_PRESETS.find((item) => item.name === name);
          if (preset) add(preset);
          else if (name === "custom") add();
        }} options={[{ value: "", label: "Choose a ticket type" }, ...PACKAGE_PRESETS.filter((preset) => !used.has(preset.name.toLowerCase())).map((preset) => ({ value: preset.name, label: `${preset.icon} ${preset.name} · ${preset.blurb}` })), { value: "custom", label: "Custom package" }]} />
      </label>
    </div> : <p className="showcase-hint">You can have up to {MAX_PACKAGES} packages.</p>}
  </div>;
}

/** "Free", "$25" or "$20 each · group of 6". */
export function packagePriceLabel(draft: Pick<PackageDraft, "kind" | "groupSize" | "price">) {
  const each = Number(draft.price || 0);
  if (!each) return "Free";
  return draft.kind === "group" ? `${dollars(each)} each · group of ${draft.groupSize}` : dollars(each);
}

// Compact ticket list for the create screen: one calm row per package. Adding and
// editing happen in a side sheet so the page itself stays short and scannable.
export function TicketPackageList({ value, onChange }: { value: PackageDraft[]; onChange: (value: PackageDraft[]) => void }) {
  const [editing, setEditing] = useState<{ draft: PackageDraft; isNew: boolean } | null>(null);
  const [picking, setPicking] = useState(false);
  const [error, setError] = useState("");
  const used = new Set(value.map((draft) => draft.name.trim().toLowerCase()));
  const close = () => { setEditing(null); setPicking(false); setError(""); };
  const start = (preset?: (typeof PACKAGE_PRESETS)[number]) => {
    setPicking(false); setError("");
    setEditing({ draft: preset ? presetPackage(preset, value[value.length - 1]?.price ?? "0") : newPackage(), isNew: true });
  };
  function save() {
    if (!editing) return;
    const others = value.filter((item) => item.key !== editing.draft.key);
    try {
      packagesPayload([editing.draft]);
      if (others.some((item) => item.name.trim().toLowerCase() === editing.draft.name.trim().toLowerCase())) throw new Error(`Another ticket type is already called “${editing.draft.name.trim()}”.`);
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Check this ticket type."); return; }
    onChange(editing.isNew ? [...value, editing.draft] : value.map((item) => item.key === editing.draft.key ? editing.draft : item));
    close();
  }
  function remove() {
    if (!editing) return;
    onChange(value.filter((item) => item.key !== editing.draft.key).map((item) => item.releaseAfter === `key:${editing.draft.key}` ? { ...item, releaseAfter: "" } : item));
    close();
  }

  return <div className="ticket-list">
    {value.length ? <ul className="ticket-list-rows">
      {value.map((draft) => {
        const preset = PACKAGE_PRESETS.find((item) => item.name === draft.name);
        const quantity = Number(draft.quantity) || 0;
        return <li key={draft.key}>
          <span className="ticket-list-icon" aria-hidden="true">{preset?.icon ?? (draft.kind === "group" ? "👯" : "🎟️")}</span>
          <span className="ticket-list-text">
            <strong>{draft.name.trim() || "Untitled ticket"}</strong>
            <small>{packagePriceLabel(draft)} · {quantity} {draft.kind === "group" ? (quantity === 1 ? "group" : "groups") : "available"}{draft.hidden ? " · code only" : ""}{draft.salesEndAt ? " · sale ends" : ""}</small>
          </span>
          <button type="button" className="ticket-list-edit" onClick={() => { setError(""); setEditing({ draft: { ...draft }, isNew: false }); }} aria-label={`Edit ${draft.name.trim() || "ticket"}`}>Edit</button>
        </li>;
      })}
    </ul> : <p className="ticket-list-empty">Add at least one ticket type so people can book.</p>}
    {value.length < MAX_PACKAGES ? <button type="button" className="ticket-list-add press-fx" onClick={() => { setError(""); setPicking(true); }}>
      <span aria-hidden="true">+</span> Add a ticket type
    </button> : <p className="showcase-hint">You can have up to {MAX_PACKAGES} ticket types.</p>}

    <Sheet open={picking} onClose={close} title="Add a ticket type" description="Start from a common type — you can rename and adjust everything.">
      <div className="ticket-presets" role="list">
        {PACKAGE_PRESETS.filter((preset) => !used.has(preset.name.toLowerCase())).map((preset) => <button key={preset.name} type="button" role="listitem" className="ticket-preset" onClick={() => start(preset)}>
          <span className="ticket-preset-icon" aria-hidden="true">{preset.icon}</span>
          <span><strong>{preset.name}</strong><small>{preset.blurb}</small></span>
        </button>)}
        <button type="button" role="listitem" className="ticket-preset is-custom" onClick={() => start()}>
          <span className="ticket-preset-icon" aria-hidden="true">✏️</span>
          <span><strong>Custom</strong><small>Name it yourself</small></span>
        </button>
      </div>
    </Sheet>

    <Sheet open={!!editing} onClose={close} wide title={editing?.isNew ? "New ticket type" : "Edit ticket type"} description="Set the price, how many are available and any extra rules."
      footer={<>
        {editing && !editing.isNew && value.length > 1 ? <button type="button" className="tv-sheet-danger" onClick={remove}>Remove</button> : <span />}
        <span className="tv-sheet-foot-actions">
          <button type="button" className="product-secondary" onClick={close}>Cancel</button>
          <button type="button" className="product-primary press-fx" onClick={save}>{editing?.isNew ? "Add ticket type" : "Save"}</button>
        </span>
      </>}>
      {editing ? <>
        <PackageFields draft={editing.draft} index={editing.isNew ? value.length : value.findIndex((item) => item.key === editing.draft.key)}
          onChange={(draft) => setEditing({ ...editing, draft })}
          releaseOptions={value.filter((item) => item.key !== editing.draft.key).map((item) => ({ value: `key:${item.key}`, label: item.name.trim() || "Untitled ticket" }))} />
        {error ? <p className="field-error" role="alert">{error}</p> : null}
      </> : null}
    </Sheet>
  </div>;
}
