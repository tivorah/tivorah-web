// Mobile counterpart: tivorah-mobile/utils/maskEmail.ts. Keep the two in step.

/** Big providers stay readable so people recognise which inbox to open. */
const KNOWN_PROVIDERS = new Set([
  "gmail.com", "googlemail.com", "outlook.com", "hotmail.com", "live.com", "msn.com", "yahoo.com", "yahoo.com.au",
  "icloud.com", "me.com", "mac.com", "proton.me", "protonmail.com", "aol.com", "bigpond.com", "optusnet.com.au", "gmx.com", "zoho.com",
]);
// Endings kept as-is ("com.au", "co.uk"), so "tivorah.com.au" becomes "ti•••.com.au".
const SECOND_LEVEL = new Set(["com", "net", "org", "edu", "gov", "co", "ac", "id", "asn"]);
const DOT = "•";

/**
 * Keeps enough to recognise, hides the middle with at most three dots:
 * "godwin.obi" → "god•••bi", "okechukwu" → "oke•••wu", "alice" → "al•••", "ada" → "a••".
 */
const maskName = (word: string) => {
  const length = word.length;
  if (length <= 1) return word;
  const start = length <= 3 ? 1 : length <= 5 ? 2 : 3;
  const end = length >= 9 ? 2 : length >= 6 ? 1 : 0;
  const hidden = Math.max(1, Math.min(3, length - start - end));
  return word.slice(0, start) + DOT.repeat(hidden) + (end ? word.slice(length - end) : "");
};

/** A domain name we don't recognise: its first two letters, then dots ("tivorah" → "ti•••"). */
const maskDomainName = (word: string) => (word.length <= 2 ? word[0] + DOT : word.slice(0, 2) + DOT.repeat(3));

/**
 * An email shown on screen as a hint, not in full: "godwin.obi@gmail.com" → "god•••bi@gmail.com",
 * "ada@tivorah.com.au" → "a••@ti•••.com.au". Anything that isn't an email is masked like a name.
 */
export function maskEmail(value: string): string {
  const email = value.trim();
  const at = email.lastIndexOf("@");
  if (at <= 0 || at === email.length - 1) return email ? maskName(email) : "";
  const local = email.slice(0, at);
  const domain = email.slice(at + 1).toLowerCase();
  const maskedLocal = maskName(local);
  if (KNOWN_PROVIDERS.has(domain)) return `${maskedLocal}@${domain}`;
  const parts = domain.split(".");
  if (parts.length < 2) return `${maskedLocal}@${maskDomainName(domain)}`;
  // Keep the ending: one label ("com"), or two for "com.au"-style endings.
  const endingLength = parts.length > 2 && SECOND_LEVEL.has(parts[parts.length - 2]!) ? 2 : 1;
  const name = parts.slice(0, parts.length - endingLength).join(".");
  const ending = parts.slice(parts.length - endingLength).join(".");
  return `${maskedLocal}@${maskDomainName(name)}.${ending}`;
}
