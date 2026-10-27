// A Hub's cover colour: the gradient behind a Hub with no photo. The API picks one at random when the
// Hub is created (tivorah-api services/hubCoverColor.ts); the app draws the same gradients
// (tivorah-mobile utils/hubCoverColor.ts). Keep the order in step: older Hubs use their id to pick one.
const GRADIENTS = {
  violet: ["#8256D0", "#51347A", "#211627"],
  ocean: ["#2F7FC1", "#1D4E7E", "#0F2238"],
  teal: ["#2A9D8F", "#1C6B62", "#0E2E2B"],
  forest: ["#4E9A5B", "#2F6338", "#132917"],
  sunset: ["#E07A4F", "#A8492E", "#3E1B12"],
  rose: ["#D45C8A", "#93355A", "#3A1424"],
  amber: ["#D49A2E", "#8F611A", "#36240A"],
  midnight: ["#4B5EAA", "#2E3A6E", "#141A33"],
} as const;
type Key = keyof typeof GRADIENTS;
const KEYS = Object.keys(GRADIENTS) as Key[];

/** CSS background for a Hub's cover when it has no photo (the same gradient as in the app). */
export function hubCoverBackground(id: number | string | null | undefined, stored?: string | null) {
  const key = KEYS.includes(stored as Key) ? stored as Key : KEYS[Math.abs(Math.trunc(Number(id) || 0)) % KEYS.length];
  const [from, middle, to] = GRADIENTS[key];
  return `linear-gradient(160deg, ${from}, ${middle} 55%, ${to})`;
}
