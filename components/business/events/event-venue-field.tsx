"use client";

import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import { ApiError, api } from "../../../lib/api/client";
import type { Locality } from "../locality-field";

// An Australian event's venue, as in the app (tivorah-mobile/components/location/EventVenueSearch.tsx):
// the state or territory is chosen first (AU_STATE_NAMES), then the address search stays inside it —
// the state's name goes with the query and results in another state are dropped — and an address
// entered by hand must be in that state too.

/** Australia's states and territories, for choosing one before searching an address. */
export const AU_STATE_NAMES: Record<string, string> = { NSW: "New South Wales", VIC: "Victoria", QLD: "Queensland", WA: "Western Australia", SA: "South Australia", TAS: "Tasmania", ACT: "Australian Capital Territory", NT: "Northern Territory" };

export type Venue = { address: string; locality: Locality; latitude?: number; longitude?: number };
type Suggestion = { id: string; address: string; formattedAddress: string; countryCode: string; locality: Locality | null; latitude: number; longitude: number; precise: boolean };

/** The search text sent for a state: the query plus the state's name (unless it's already there). */
export function venueSearchText(query: string, state?: string) {
  const name = state ? AU_STATE_NAMES[state] : undefined;
  const text = query.trim();
  return name && !text.toLowerCase().includes(name.toLowerCase()) ? `${text}, ${name}` : text;
}
/** Only addresses inside the chosen state (results without a locality are kept to confirm by hand). */
export function venuesInState<T extends { locality: { state: string } | null }>(found: T[], state?: string) {
  return state ? found.filter((item) => !item.locality || item.locality.state === state) : found;
}

export function EventVenueField({ state, value, onChange, disabled }: { state: string; value: Venue | null; onChange: (venue: Venue | null) => void; disabled?: boolean }) {
  const [query, setQuery] = useState("");
  const [typed, setTyped] = useState(false);
  const [manual, setManual] = useState(false);
  const [draft, setDraft] = useState({ address: "", suburb: "", postcode: "" });
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [error, setError] = useState("");
  const request = useRef<AbortController | null>(null);
  const stop = () => { request.current?.abort(); request.current = null; };
  useEffect(() => stop, []);

  // Search 400ms after typing stops (three characters or more), inside the chosen state.
  useEffect(() => {
    if (!typed || manual || value || query.trim().length < 3) return;
    const timer = window.setTimeout(() => {
      stop();
      const controller = new AbortController();
      request.current = controller;
      setLoading(true); setError("");
      const params = new URLSearchParams({ query: venueSearchText(query, state), country: "au" });
      api<{ suggestions: Suggestion[] }>(`/utility/locations/autocomplete?${params}`, { signal: controller.signal })
        .then((data) => {
          if (controller.signal.aborted) return;
          const matches = venuesInState(data?.suggestions ?? [], state);
          setSuggestions(matches);
          if (!matches.length) setError(`No matching address in ${state}. Try adding the suburb, or enter the address manually.`);
        })
        .catch(() => { if (!controller.signal.aborted) setError("Address search is unavailable. Try again or enter the address manually."); })
        .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    }, 400);
    return () => { window.clearTimeout(timer); stop(); };
  }, [query, typed, manual, value, state]);

  const enterManual = (item?: Suggestion) => {
    stop(); setLoading(false); setError(""); setSuggestions([]);
    setDraft({ address: item?.address ?? query.trim(), suburb: item?.locality?.suburb ?? "", postcode: item?.locality?.postcode ?? "" });
    setManual(true);
  };
  const choose = (item: Suggestion) => {
    if (item.countryCode !== "AU") { setError("Event publishing currently supports Australian addresses. International event publishing is not available yet."); return; }
    if (item.locality && item.precise) {
      onChange({ address: item.address, locality: { ...item.locality, countryCode: "AU" }, latitude: item.latitude, longitude: item.longitude });
      setSuggestions([]); setQuery(""); setTyped(false);
    } else enterManual(item);
  };
  const saveManual = async () => {
    if (!draft.address.trim() || !draft.suburb.trim() || !/^\d{4}$/.test(draft.postcode.trim())) { setError(`Enter a street address, a suburb or city in ${state} and a four-digit postcode.`); return; }
    stop();
    const controller = new AbortController();
    request.current = controller;
    setLoading(true); setError("");
    try {
      const params = new URLSearchParams({ suburb: draft.suburb.trim(), state, postcode: draft.postcode.trim() });
      const data = await api<{ locality?: Locality }>(`/utility/locations/resolve?${params}`, { signal: controller.signal });
      if (controller.signal.aborted) return;
      const match = data?.locality;
      if (!match) { setError("The suburb, state and postcode do not match. Check those fields and try again."); return; }
      if (match.state !== state) { setError(`This address isn’t in ${state}. Change the state above, or enter an address in ${state}.`); return; }
      onChange({ address: draft.address.trim(), locality: { suburb: match.suburb, state: match.state, postcode: match.postcode, countryCode: "AU" } });
      setManual(false);
    } catch (cause) {
      if (controller.signal.aborted) return;
      setError(cause instanceof ApiError && cause.status === 422 ? "The suburb, state and postcode do not match. Check those fields and try again." : "Could not confirm the suburb. Your entries are kept; check your connection and try again.");
    } finally { if (!controller.signal.aborted) setLoading(false); }
  };
  const clear = () => {
    stop(); setLoading(false); setError(""); setSuggestions([]); setQuery(""); setTyped(false); setManual(false);
    onChange(null);
  };

  // Enter in these fields mustn't submit the create form around them.
  const keepEnter = (event: KeyboardEvent) => {
    if (event.key !== "Enter" || (event.target as HTMLElement).tagName !== "INPUT") return;
    event.preventDefault();
    if (manual) void saveManual();
  };

  if (value) return <div className="event-venue">
    <span className="shop-label">Event address</span>
    <div className="event-venue-chosen" role="status">
      <span className="event-venue-chosen-text"><strong>{value.address}</strong><small>{value.locality.suburb}, {value.locality.state} {value.locality.postcode} · Australia{value.latitude == null ? " · entered manually" : ""}</small></span>
      <button type="button" className="ticket-list-edit" onClick={clear} disabled={disabled} aria-label={`Change event address, ${value.address}`}>Change</button>
    </div>
  </div>;

  if (manual) return <div className="event-venue" onKeyDown={keepEnter}>
    <p className="create-question">Enter the address manually</p>
    <label>Street address<input value={draft.address} maxLength={300} disabled={loading || disabled} placeholder="Street number and street name" autoComplete="street-address" onChange={(event) => { setError(""); setDraft((current) => ({ ...current, address: event.target.value })); }} /></label>
    <div className="shop-row">
      <label>Suburb or city<input value={draft.suburb} maxLength={100} disabled={loading || disabled} placeholder="e.g. Adelaide" onChange={(event) => { setError(""); setDraft((current) => ({ ...current, suburb: event.target.value })); }} /></label>
      <label>Postcode<input value={draft.postcode} inputMode="numeric" maxLength={4} disabled={loading || disabled} placeholder="e.g. 5000" onChange={(event) => { setError(""); setDraft((current) => ({ ...current, postcode: event.target.value.replace(/\D/g, "") })); }} /></label>
    </div>
    <p className="shop-hint">State or territory: {AU_STATE_NAMES[state]}. A manually entered address has no confirmed map pin.</p>
    {error ? <p className="field-error" role="alert">{error}</p> : null}
    <div className="event-venue-actions">
      <button type="button" className="product-primary press-fx" disabled={loading || disabled} onClick={() => void saveManual()}>{loading ? "Checking address…" : "Use this address"}</button>
      <button type="button" className="event-venue-link" disabled={loading} onClick={() => { stop(); setError(""); setQuery(draft.address); setTyped(false); setManual(false); }}>Search for an address instead</button>
    </div>
  </div>;

  return <div className="event-venue" onKeyDown={keepEnter}>
    <label>Event address
      <input type="search" value={query} maxLength={300} disabled={disabled} autoComplete="off" aria-busy={loading}
        placeholder={`Search a venue or street in ${state}`}
        onChange={(event) => { stop(); setLoading(false); setSuggestions([]); setError(""); setTyped(true); setQuery(event.target.value); }} />
    </label>
    {typed && query.trim().length >= 3 && loading ? <p className="shop-hint" role="status">Finding addresses…</p> : !typed || query.trim().length < 3 ? <p className="shop-hint">Enter at least three characters to find your address.</p> : null}
    {suggestions.length ? <ul className="event-venue-results" aria-label="Matching addresses">
      {suggestions.map((item) => <li key={item.id}>
        <button type="button" onClick={() => choose(item)}>
          <span>{item.formattedAddress}</span>
          {item.countryCode !== "AU" ? <small>International event publishing is not available yet</small> : !item.precise || !item.locality ? <small>Confirm the address manually</small> : null}
        </button>
      </li>)}
    </ul> : null}
    {suggestions.length ? <p className="event-venue-attribution"><a href="https://www.geoapify.com/" target="_blank" rel="noreferrer">Powered by Geoapify</a> · <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">© OpenStreetMap contributors</a></p> : null}
    {error ? <p className="field-error" role="alert">{error}</p> : null}
    <button type="button" className="event-venue-link" disabled={disabled} onClick={() => enterManual()}>Can’t find your venue? Enter address manually</button>
  </div>;
}
