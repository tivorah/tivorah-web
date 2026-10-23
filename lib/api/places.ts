"use client";
import { useEffect, useState } from "react";
import { api } from "./client";

/**
 * Places anywhere in the world, the same model as the mobile app (api/requests/places.ts):
 * Australia: suburb + state + postcode from the official list. Nigeria: state + LGA.
 * Elsewhere: an optional state/region + a typed city or town.
 */
export type PlaceMode = "search" | "list" | "free";
/** payments: whether Tivorah payments and ticketing work in this country (an admin setting). */
export type PlaceCountry = { code: string; name: string; regionLabel: string; localityLabel: string; mode: PlaceMode; postcode: boolean; payments: boolean };

/** Sensible details for a country while the list loads (Australia has payments by default). */
export function fallbackCountry(code: string): PlaceCountry {
  const upper = code.toUpperCase();
  return {
    code: upper, name: upper === "AU" ? "Australia" : upper === "NG" ? "Nigeria" : upper,
    regionLabel: upper === "AU" || upper === "NG" ? "State" : "State or region",
    localityLabel: upper === "AU" ? "Suburb" : upper === "NG" ? "LGA" : "City or town",
    mode: upper === "AU" ? "search" : upper === "NG" ? "list" : "free", postcode: upper === "AU", payments: upper === "AU",
  };
}

/** A country's flag emoji from its ISO code ("NG" → 🇳🇬); empty for anything that isn't a code. */
export function countryFlag(code: string | null | undefined): string {
  if (!code || !/^[A-Za-z]{2}$/.test(code)) return "";
  return String.fromCodePoint(...code.toUpperCase().split("").map((letter) => 0x1f1e6 + letter.charCodeAt(0) - 65));
}

/** The browser's region from its language (e.g. en-NG → NG), falling back to Australia. */
export function browserCountry(languages: readonly string[] = typeof navigator === "undefined" ? [] : navigator.languages ?? [navigator.language]): string {
  for (const language of languages) {
    const region = /^[a-z]{2,3}[-_]([A-Za-z]{2})\b/i.exec(language ?? "")?.[1];
    if (region) return region.toUpperCase();
  }
  return "AU";
}

/** Australia/Nigeria/elsewhere outside Australia: the Australian suburb, postcode and map filters don't apply. */
export const isAbroad = (country: string | null | undefined) => Boolean(country && country.toUpperCase() !== "AU");

// One fetch per page load; every picker on the page shares it.
let countriesRequest: Promise<PlaceCountry[]> | null = null;
function loadCountries() {
  countriesRequest ??= api<{ countries: PlaceCountry[] }>("/public/discovery/places/countries")
    .then((data) => data.countries)
    .catch((cause) => { countriesRequest = null; throw cause; });
  return countriesRequest;
}

export function usePlaceCountries() {
  const [countries, setCountries] = useState<PlaceCountry[] | null>(null);
  const [error, setError] = useState("");
  useEffect(() => {
    let live = true;
    loadCountries().then((list) => { if (live) setCountries(list); }).catch(() => { if (live) setError("Could not load countries."); });
    return () => { live = false; };
  }, []);
  return { countries, error };
}

export function usePlaceCountry(code: string): PlaceCountry {
  const { countries } = usePlaceCountries();
  return countries?.find((country) => country.code === code.toUpperCase()) ?? fallbackCountry(code || "AU");
}

/** A country's states/regions to choose from (empty for Australia, which uses suburb search). */
export function usePlaceRegions(country: string) {
  const [regions, setRegions] = useState<string[]>([]);
  useEffect(() => {
    if (!/^[A-Z]{2}$/.test(country) || country === "AU") { setRegions([]); return; }
    const controller = new AbortController();
    api<{ regions: string[] }>(`/public/discovery/places/regions?country=${country}`, { signal: controller.signal })
      .then((data) => { if (!controller.signal.aborted) setRegions(data.regions); })
      .catch(() => { if (!controller.signal.aborted) setRegions([]); });
    return () => controller.abort();
  }, [country]);
  return regions;
}

/** Nigerian LGAs for a state (other countries type their own city or town). */
export function usePlaceLocalities(country: string, region: string) {
  const [places, setPlaces] = useState<string[]>([]);
  useEffect(() => {
    if (country !== "NG" || !region) { setPlaces([]); return; }
    const controller = new AbortController();
    api<{ places: { locality: string }[] }>(`/public/discovery/places/search?${new URLSearchParams({ country, region, query: "" })}`, { signal: controller.signal })
      .then((data) => { if (!controller.signal.aborted) setPlaces(data.places.map((place) => place.locality)); })
      .catch(() => { if (!controller.signal.aborted) setPlaces([]); });
    return () => controller.abort();
  }, [country, region]);
  return places;
}
