/**
 * Money is whole minor units (cents) everywhere: stored, sent to the API and calculated. Typed
 * prices are parsed straight from the text into cents with string arithmetic, never through a
 * float ("1.005" * 100 is 100.49999…, which rounds to the wrong cent). Mobile counterpart:
 * tivorah-mobile/utils/money.ts.
 *
 * Accepts "26", "26.4", "26.42", ".5", "1,299.50" and "$26.42"; returns null for anything else
 * (more than two decimal places, exponents, signs, letters, or an empty string).
 */
export function parseMoneyToCents(input: string | number | null | undefined): number | null {
  const text = String(input ?? "").trim().replace(/^\$/, "").replace(/,(?=\d{3}(\D|$))/g, "");
  const match = /^(\d{0,9})(?:\.(\d{0,2}))?$/.exec(text);
  if (!match || (!match[1] && !match[2])) return null;
  const whole = Number(match[1] || "0");
  const fraction = Number((match[2] ?? "").padEnd(2, "0"));
  return whole * 100 + fraction;
}

/** Whole cents from a typed price, or a clear error to show the person (never NaN to the API). */
export function centsOrThrow(input: unknown, message = "Enter a valid price, for example 26.50.") {
  const cents = parseMoneyToCents(input == null ? "" : String(input));
  if (cents === null) throw new Error(message);
  return cents;
}
