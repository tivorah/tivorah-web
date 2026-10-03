import countries from "./country-codes.json";

export type Country = { code: string; name: string; emoji: string; dial: string };
export const COUNTRIES = countries as Country[];
export const DEFAULT_COUNTRY = "AU";

/**
 * Optional sign-up phone number, shaped exactly like the mobile app sends it: national digits
 * without the trunk 0, the country as "AU_+61", and the full international number.
 */
export function signupPhone(countryCode: string, raw: string): { error: string } | { phone: string; phoneCountryCode: string; fullPhoneNumber: string } | null {
  const digits = raw.replace(/\D/g, "").replace(/^0+/, "");
  if (!digits) return null;
  if (digits.length < 6 || digits.length > 15) return { error: "Check the phone number, or leave it blank" };
  const country = COUNTRIES.find((item) => item.code === countryCode) ?? COUNTRIES.find((item) => item.code === DEFAULT_COUNTRY)!;
  return { phone: digits, phoneCountryCode: `${country.code}_${country.dial}`, fullPhoneNumber: `${country.dial}${digits}` };
}
