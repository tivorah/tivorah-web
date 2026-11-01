import currencyList from "./pricing-currencies.json";
import { countryFlag } from "./api/places";

/**
 * Every currency an event can be priced in, with the country whose flag shows beside it (the euro
 * shows the EU's). Mirrors the API's list (tivorah-api/src/data/pricing-currencies.json) and the app's.
 */
export type WorldCurrency = { code: string; name: string; country: string };
export const worldCurrencies = currencyList as WorldCurrency[];

/** Options for a currency menu: "🇦🇺 AUD · Australian dollar", searchable by code or name. */
export const currencyOptions = () => worldCurrencies.map((currency) => ({ value: currency.code, label: `${countryFlag(currency.country)} ${currency.code} · ${currency.name}`.trim() }));
