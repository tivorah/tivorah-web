import { api } from "./api/client";

// Tivorah is 18+, like the app (tivorah-mobile utils/ageGate.ts). When someone gives a birth date
// under 18, this browser remembers the day they turn 18 (never the birth date) so they can't simply
// try again with an older year, and the API refuses that email too.
export const MINIMUM_AGE = 18;
const KEY = "tivorah_age_gate_until";
const today = () => new Date().toISOString().slice(0, 10);

const parse = (iso: string) => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(iso)) return null;
  const [year, month, day] = iso.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day ? { year, month, day } : null;
};

/** The day someone born on `iso` turns 18 (YYYY-MM-DD), or null for an invalid date. */
export function adultFrom(iso: string) {
  const date = parse(iso);
  return date ? new Date(Date.UTC(date.year + MINIMUM_AGE, date.month - 1, date.day)).toISOString().slice(0, 10) : null;
}

/** A real birth date that is under 18 today (an invalid date is not "under age"). */
export function isUnderage(iso: string, now = new Date()) {
  const until = adultFrom(iso);
  return Boolean(until) && until! > now.toISOString().slice(0, 10);
}

/** When this browser is still blocked from signing up, the date that ends; otherwise null. */
export function activeAgeBlock(): string | null {
  try {
    const until = window.localStorage.getItem(KEY);
    if (until && until > today()) return until;
    if (until) window.localStorage.removeItem(KEY);
  } catch { /* storage unavailable: the API still refuses the email */ }
  return null;
}

/** Records an under-18 birth date in this browser and with the API (best effort). */
export async function blockUnderage(dateOfBirth: string, email?: string | null) {
  const until = adultFrom(dateOfBirth);
  if (!until) return null;
  try { window.localStorage.setItem(KEY, until); } catch { /* still blocked for this page */ }
  const address = email?.trim().toLowerCase();
  await api("/public/auth/age-gate", { method: "POST", body: JSON.stringify({ dateOfBirth, ...(address && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(address) ? { email: address } : {}) }) }).catch(() => undefined);
  return until;
}
