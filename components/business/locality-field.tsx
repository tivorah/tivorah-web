"use client";
import { useEffect, useRef, useState } from "react";
import { api } from "../../lib/api/client";
import { SelectField } from "../ui/select-field";
import { browserCountry, countryFlag, usePlaceCountries, usePlaceCountry, usePlaceLocalities, usePlaceRegions, type PlaceCountry } from "../../lib/api/places";

/**
 * A place anywhere in the world, sent as suburb/state/postcode + countryCode (the API's shape).
 * Outside Australia, suburb is the city, town or LGA, state is the state or region, and postcode is empty.
 */
export type Locality = { suburb: string; state: string; postcode: string; countryCode?: string };

/** Same as the mobile PlacePicker: Australia searches suburbs, Nigeria picks a state then LGA, elsewhere types a city. */
export function LocalityField({
  onChange,
  onCountryChange,
  defaultCountry,
  required = true,
}: {
  required?: boolean;
  onChange: (value: Locality | null) => void;
  /** Called with the chosen country (and on first load), e.g. to show whether Tivorah ticketing works there. */
  onCountryChange?: (country: PlaceCountry) => void;
  /** The record's current country when editing; new records start on the browser's region. */
  defaultCountry?: string | null;
}) {
  const [country, setCountry] = useState((defaultCountry || "AU").toUpperCase());
  const { countries } = usePlaceCountries();
  const config = usePlaceCountry(country);
  // New records: start on the browser's region once mounted (the server can't know it).
  const guessed = useRef(Boolean(defaultCountry));
  useEffect(() => {
    if (guessed.current) return;
    guessed.current = true;
    setCountry(browserCountry());
  }, []);
  const notify = useRef(onCountryChange);
  useEffect(() => { notify.current = onCountryChange; });
  // Keyed on the values, not the object: the fallback details are a new object every render.
  const configRef = useRef(config);
  useEffect(() => { configRef.current = config; });
  useEffect(() => { notify.current?.(configRef.current); }, [config.code, config.payments, config.name]);
  const chooseCountry = (code: string) => {
    if (!code || code === country) return;
    setCountry(code);
    onChange(null);
  };
  return (
    <div className="locality-field">
      <label>
        Country
        <SelectField label="Country" value={country} onChange={chooseCountry} searchable
          options={(countries ?? [config]).map((item) => ({ value: item.code, label: `${countryFlag(item.code)} ${item.name}` }))} />
      </label>
      {country === "AU"
        ? <AustralianSuburb key="AU" required={required} onChange={onChange} />
        : <PlaceElsewhere key={country} country={config} required={required} onChange={onChange} />}
    </div>
  );
}

function AustralianSuburb({ required, onChange }: { required: boolean; onChange: (value: Locality | null) => void }) {
  const [query, setQuery] = useState("");
  const [items, setItems] = useState<Locality[]>([]);
  const [selected, setSelected] = useState<Locality | null>(null);
  const [error, setError] = useState("");
  useEffect(() => {
    if (query.length < 2 || selected) return;
    const controller = new AbortController();
    const timer = setTimeout(() => {
      api<{ localities: Locality[] }>(
        `/public/discovery/locations?query=${encodeURIComponent(query)}`,
        { signal: controller.signal },
      )
        .then((result) => {
          if (!controller.signal.aborted) {
            setItems(result.localities);
            setError("");
          }
        })
        .catch(() => {
          if (!controller.signal.aborted)
            setError(
              "Location search is unavailable. Try another search in a moment.",
            );
        });
    }, 300);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [query, selected]);
  return (
    <div>
      <label>
        Suburb or postcode
        <input
          value={query}
          maxLength={80}
          onChange={(e) => {
            setQuery(e.target.value);
            setSelected(null);
            onChange(null);
            setItems([]);
          }}
          placeholder="Search Australian suburbs"
          autoComplete="off"
          required={required}
        />
      </label>
      {error ? <p role="alert">{error}</p> : null}
      {!selected && items.length ? (
        <div className="locality-options" aria-label="Matching suburbs">
          {items.map((item) => (
            <button
              className="product-secondary"
              type="button"
              key={`${item.suburb}-${item.postcode}`}
              onClick={() => {
                const chosen = { suburb: item.suburb, state: item.state, postcode: item.postcode, countryCode: "AU" };
                setSelected(chosen);
                setQuery(`${item.suburb}, ${item.state} ${item.postcode}`);
                onChange(chosen);
                setItems([]);
              }}
            >
              {item.suburb}, {item.state} {item.postcode}
            </button>
          ))}
        </div>
      ) : null}
      {selected ? (
        <p role="status">
          Selected: {selected.suburb}, {selected.state} {selected.postcode}
        </p>
      ) : null}
    </div>
  );
}

/** Nigeria: state (required) then LGA from the list or typed. Elsewhere: optional region, typed city or town. */
function PlaceElsewhere({ country, required, onChange }: { country: PlaceCountry; required: boolean; onChange: (value: Locality | null) => void }) {
  const nigeria = country.code === "NG";
  const regions = usePlaceRegions(country.code);
  const [region, setRegion] = useState("");
  const [city, setCity] = useState("");
  const lgas = usePlaceLocalities(country.code, region);
  const emit = (nextRegion: string, nextCity: string) => {
    const locality = nextCity.trim();
    onChange(locality.length >= 2 && (!nigeria || nextRegion) ? { suburb: locality, state: nextRegion.trim(), postcode: "", countryCode: country.code } : null);
  };
  const needle = city.trim().toLowerCase();
  const matches = nigeria && needle && !lgas.some((lga) => lga.toLowerCase() === needle)
    ? lgas.filter((lga) => lga.toLowerCase().includes(needle)).slice(0, 12)
    : [];
  return (
    <div className="shop-row">
      <label>
        <span className="shop-label">{country.regionLabel}{nigeria ? null : <> <span className="shop-optional">Optional</span></>}</span>
        {regions.length
          ? <SelectField label={country.regionLabel} value={region} required={required && nigeria} searchable placeholder={`Choose a ${country.regionLabel.toLowerCase()}`}
              options={regions.map((item) => ({ value: item, label: item }))}
              onChange={(value) => { setRegion(value); if (nigeria) setCity(""); emit(value, nigeria ? "" : city); }} />
          : <input value={region} maxLength={100} placeholder={country.regionLabel} onChange={(e) => { setRegion(e.target.value); emit(e.target.value, city); }} />}
      </label>
      <div>
        <label>
          {country.localityLabel}
          <input value={city} maxLength={100} required={required} autoComplete="off" disabled={nigeria && !region}
            placeholder={nigeria ? (region ? `Your LGA in ${region}` : "Choose a state first") : country.localityLabel}
            onChange={(e) => { setCity(e.target.value); emit(region, e.target.value); }} />
        </label>
        {matches.length ? (
          <div className="locality-options" aria-label="Matching LGAs">
            {matches.map((lga) => <button key={lga} type="button" className="product-secondary" onClick={() => { setCity(lga); emit(region, lga); }}>{lga}</button>)}
          </div>
        ) : null}
      </div>
    </div>
  );
}
