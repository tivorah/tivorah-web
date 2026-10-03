// Mobile counterpart: tivorah-mobile/utils/passwordPolicy.ts. Keep the rules, wording and generator in step.

export const PASSWORD_MIN_LENGTH = 10;

export const passwordRules = [
  { key: "length", missing: (value: string) => `${PASSWORD_MIN_LENGTH - value.length} more character${PASSWORD_MIN_LENGTH - value.length === 1 ? "" : "s"}`, test: (value: string) => value.length >= PASSWORD_MIN_LENGTH },
  { key: "case", missing: () => "upper & lower case", test: (value: string) => /[a-z]/.test(value) && /[A-Z]/.test(value) },
  { key: "number", missing: () => "a number", test: (value: string) => /\d/.test(value) },
  { key: "symbol", missing: () => "a symbol", test: (value: string) => /[^A-Za-z0-9\s]/.test(value) },
] as const;

export const passwordMeetsRules = (value: string) => passwordRules.every((rule) => rule.test(value));

const joinNatural = (parts: string[]) =>
  parts.length <= 1 ? parts.join("") : `${parts.slice(0, -1).join(", ")} and ${parts[parts.length - 1]}`;

/** One short line instead of a checklist: what the password still needs, or that it's ready. */
export function passwordHint(value: string): { met: boolean; text: string } {
  if (!value) return { met: false, text: `Use ${PASSWORD_MIN_LENGTH}+ characters with upper & lower case, a number and a symbol.` };
  const missing = passwordRules.filter((rule) => !rule.test(value)).map((rule) => rule.missing(value));
  if (!missing.length) return { met: true, text: "Meets all requirements" };
  const text = `Add ${joinNatural(missing)}`;
  return { met: false, text };
}

// Ambiguous characters (0/O, 1/l/I) are left out so a suggested password is easy to read back.
const LOWER = "abcdefghijkmnopqrstuvwxyz";
const UPPER = "ABCDEFGHJKLMNPQRSTUVWXYZ";
const DIGITS = "23456789";
const SYMBOLS = "!@#$%^&*-_=+?";
const ALL = LOWER + UPPER + DIGITS + SYMBOLS;

export const SUGGESTED_PASSWORD_LENGTH = 16;

/** Fills `count` random bytes. Must be a cryptographically secure source. */
export type RandomBytes = (count: number) => Uint8Array;

/** Unbiased integer in [0, max) using rejection sampling over secure random bytes. */
function randomIndex(max: number, randomBytes: RandomBytes): number {
  const limit = 256 - (256 % max);
  for (;;) {
    const [byte] = randomBytes(1);
    if (byte < limit) return byte % max;
  }
}

/** A strong password that always satisfies every rule above. */
export function generateStrongPassword(randomBytes: RandomBytes, length = SUGGESTED_PASSWORD_LENGTH): string {
  const pick = (set: string) => set[randomIndex(set.length, randomBytes)];
  const chars = [pick(LOWER), pick(UPPER), pick(DIGITS), pick(SYMBOLS)];
  while (chars.length < Math.max(length, PASSWORD_MIN_LENGTH)) chars.push(pick(ALL));
  // Fisher–Yates, so the guaranteed characters are not always at the start.
  for (let index = chars.length - 1; index > 0; index -= 1) {
    const swap = randomIndex(index + 1, randomBytes);
    [chars[index], chars[swap]] = [chars[swap], chars[index]];
  }
  return chars.join("");
}
