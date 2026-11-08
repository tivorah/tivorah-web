"use client";

import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import { api } from "../../../lib/api/client";
import type { Locality } from "../locality-field";

// An Australian event's venue, as in the app (tivorah-mobile/components/location/EventVenueSearch.tsx):
// the address search covers Australia, or only the state or territory when one is chosen (AU_STATE_NAMES):
// its name goes with the query and results in another state are dropped. An address entered by hand is
// taken as written; only its suburb is picked from a list (in that state, if any), so it always matches.

/** Australia's states and territories, for choosing one before searching an address. */
export const AU_STATE_NAMES: Record<string, string> = { NSW: "New South Wales", VIC: "Victoria", QLD: "Queensland", WA: "Western Australia", SA: "South Australia", TAS: "Tasmania", ACT: "Australian Capital Territory", NT: "Northern Territory" };

/** venueName: a searched place's name (a hall, a park), to fill an empty venue name. */
export type Venue = { address: string; locality: Locality; latitude?: number; longitude?: number; venueName?: string | null };
type Suggestion = { id: string; address: string; venueName?: string | null; formattedAddress: string; countryCode: string; locality: Locality | null; latitude: number; longitude: number; precise: boolean };

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

/** A named place's full address without its name in front (the name is shown first, in bold). */
export function placeDetails(formattedAddress: string, venueName: string) {
  return formattedAddress.startsWith(`${venueName}, `) ? formattedAddress.slice(venueName.length + 2) : formattedAddress;
}

export function EventVenueField({ state = "", value, onChange, disabled }: { state?: string; value: Venue | null; onChange: (venue: Venue | null) => void; disabled?: boolean }) {
  const [query, setQuery] = useState("");
  const [typed, setTyped] = useState(false);
  const [manual, setManual] = useState(false);
  const [draft, setDraft] = useState<{ address: string; locality: Locality | null; venueName: string | null }>({ address: "", locality: null, venueName: null });
  const [suburbQuery, setSuburbQuery] = useState("");
  const [suburbs, setSuburbs] = useState<Locality[]>([]);
  const [suburbStatus, setSuburbStatus] = useState<"idle" | "loading" | "error">("idle");
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [error, setError] = useState("");
  const request = useRef<AbortController | null>(null);
  const stop = () => { request.current?.abort(); request.current = null; };
  useEffect(() => stop, []);

  // Search 400ms after typing stops (three characters or more), inside the chosen state if any.
  const where = state ? `in ${state}` : "in Australia";
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
          if (!matches.length) setError(`No matching address ${where}. Try adding the suburb, or enter the address manually.`);
        })
        .catch(() => { if (!controller.signal.aborted) setError("Address search is unavailable. Try again or enter the address manually."); })
        .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    }, 400);
    return () => { window.clearTimeout(timer); stop(); };
  }, [query, typed, manual, value, state, where]);

  // The suburb list for a typed address, 250ms after typing stops, inside the chosen state.
  useEffect(() => {
    if (!manual || draft.locality || suburbQuery.trim().length < 2) { setSuburbs([]); setSuburbStatus("idle"); return; }
    const controller = new AbortController();
    setSuburbStatus("loading");
    const timer = window.setTimeout(() => {
      api<{ localities: Locality[] }>(`/public/discovery/locations?query=${encodeURIComponent(suburbQuery.trim())}${state ? `&state=${encodeURIComponent(state)}` : ""}`, { signal: controller.signal })
        .then((data) => { if (!controller.signal.aborted) { setSuburbs((data?.localities ?? []).slice(0, 8)); setSuburbStatus("idle"); } })
        .catch(() => { if (!controller.signal.aborted) setSuburbStatus("error"); });
    }, 250);
    return () => { window.clearTimeout(timer); controller.abort(); };
  }, [manual, draft.locality, suburbQuery, state]);

  const enterManual = (item?: Suggestion) => {
    stop(); setLoading(false); setError(""); setSuggestions([]);
    setDraft({ address: item?.address ?? query.trim(), locality: item?.locality && (!state || item.locality.state === state) ? { ...item.locality, countryCode: "AU" } : null, venueName: item?.venueName ?? null });
    setSuburbQuery(""); setManual(true);
  };
  const choose = (item: Suggestion) => {
    if (item.countryCode !== "AU") { setError("Event publishing currently supports Australian addresses. International event publishing is not available yet."); return; }
    if (item.locality && item.precise) {
      onChange({ address: item.address, locality: { ...item.locality, countryCode: "AU" }, latitude: item.latitude, longitude: item.longitude, venueName: item.venueName ?? null });
      setSuggestions([]); setQuery(""); setTyped(false);
    } else enterManual(item);
  };
  const saveManual = () => {
    if (!draft.address.trim()) { setError("Enter the address the way guests should see it."); return; }
    if (!draft.locality) { setError(`Choose the suburb ${where} from the list, so people nearby can find the event.`); return; }
    onChange({ address: draft.address.trim(), locality: draft.locality, venueName: draft.venueName });
    setManual(false);
  };
  const clear = () => {
    stop(); setLoading(false); setError(""); setSuggestions([]); setQuery(""); setTyped(false); setManual(false);
    onChange(null);
  };

  // Enter in these fields mustn't submit the create form around them.
  const keepEnter = (event: KeyboardEvent) => {
    if (event.key !== "Enter" || (event.target as HTMLElement).tagName !== "INPUT") return;
    event.preventDefault();
    if (manual) saveManual();
  };

  if (value) return <div className="event-venue">
    <span className="shop-label">Event address</span>
    <div className="event-venue-chosen" role="status">
      <span className="event-venue-chosen-text"><strong>{value.address}</strong><small>{value.locality.suburb}, {value.locality.state} {value.locality.postcode} · Australia{value.latitude == null ? " · entered manually" : ""}</small></span>
      <button type="button" className="ticket-list-edit" onClick={clear} disabled={disabled} aria-label={`Change event address, ${value.address}`}>Change</button>
    </div>
  </div>;

  if (manual) return <div className="event-venue" onKeyDown={keepEnter}>
    <p className="create-question">Enter the address yourself</p>
    <label>Address<input value={draft.address} maxLength={300} disabled={disabled} placeholder="e.g. Rear hall, 12 King William St" autoComplete="street-address" onChange={(event) => { setError(""); setDraft((current) => ({ ...current, address: event.target.value })); }} /></label>
    {draft.locality ? <div className="event-venue-chosen" role="status">
      <span className="event-venue-chosen-text"><strong>{draft.locality.suburb}</strong><small>{draft.locality.state} {draft.locality.postcode} · Australia</small></span>
      <button type="button" className="ticket-list-edit" disabled={disabled} onClick={() => { setError(""); setSuburbQuery(""); setDraft((current) => ({ ...current, locality: null })); }} aria-label={`Change suburb, ${draft.locality.suburb}`}>Change</button>
    </div> : <>
      <label>Suburb<input type="search" value={suburbQuery} maxLength={80} disabled={disabled} autoComplete="off" aria-busy={suburbStatus === "loading"} placeholder={`Search a suburb or postcode ${where}`}
        onChange={(event) => { setError(""); setSuburbQuery(event.target.value); }} /></label>
      {suburbs.length ? <ul className="event-venue-results" aria-label="Matching suburbs">
        {suburbs.map((item) => <li key={`${item.suburb}-${item.postcode}`}>
          <button type="button" onClick={() => { setError(""); setSuburbQuery(""); setDraft((current) => ({ ...current, locality: { suburb: item.suburb, state: item.state, postcode: item.postcode, countryCode: "AU" } })); }}>
            <span>{item.suburb}</span><small>{item.state} · {item.postcode}</small>
          </button>
        </li>)}
      </ul> : suburbStatus === "loading" ? <p className="shop-hint" role="status">Finding suburbs…</p>
        : suburbStatus === "error" ? <p className="field-error" role="alert">Couldn’t search suburbs. Check your connection and try again.</p>
        : suburbQuery.trim().length >= 2 ? <p className="shop-hint">No matching suburb {where}. Try the postcode.</p> : null}
    </>}
    <p className="shop-hint">Write the address however guests will find it. A typed address has no map pin, so guests see the address only.</p>
    {error ? <p className="field-error" role="alert">{error}</p> : null}
    <div className="event-venue-actions">
      <button type="button" className="product-primary press-fx" disabled={disabled} onClick={saveManual}>Use this address</button>
      <button type="button" className="event-venue-link" onClick={() => { stop(); setError(""); setQuery(draft.address); setTyped(false); setManual(false); }}>Search for an address instead</button>
    </div>
  </div>;

  return <div className="event-venue" onKeyDown={keepEnter}>
    <label>Event address
      <input type="search" value={query} maxLength={300} disabled={disabled} autoComplete="off" aria-busy={loading}
        placeholder={state ? `Search a venue or street in ${state}` : "Search a venue or street address"}
        onChange={(event) => { stop(); setLoading(false); setSuggestions([]); setError(""); setTyped(true); setQuery(event.target.value); }} />
    </label>
    {typed && query.trim().length >= 3 && loading ? <p className="shop-hint" role="status">Finding addresses…</p> : !typed || query.trim().length < 3 ? <p className="shop-hint">Enter at least three characters to find your address.</p> : null}
    {suggestions.length ? <ul className="event-venue-results" aria-label="Matching addresses">
      {suggestions.map((item) => <li key={item.id}>
        <button type="button" onClick={() => choose(item)}>
          <span>{item.venueName ? <><strong>{item.venueName}</strong> · {placeDetails(item.formattedAddress, item.venueName)}</> : item.formattedAddress}</span>
          {item.countryCode !== "AU" ? <small>International event publishing is not available yet</small> : !item.precise || !item.locality ? <small>Confirm the address manually</small> : null}
        </button>
      </li>)}
    </ul> : null}
    {suggestions.length ? <p className="event-venue-attribution"><a href="https://www.geoapify.com/" target="_blank" rel="noreferrer">Powered by Geoapify</a> · <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">© OpenStreetMap contributors</a></p> : null}
    {error ? <p className="field-error" role="alert">{error}</p> : null}
    <button type="button" className="event-venue-link" disabled={disabled} onClick={() => enterManual()}>Can’t find your venue? Enter address manually</button>
  </div>;
}
