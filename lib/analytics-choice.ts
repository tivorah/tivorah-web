// The visitor's choice about optional website analytics (consent banner, Cookie Notice and
// account Settings → "Usage analytics"). Analytics is off until the visitor says yes, and it
// never runs when their browser asks sites not to track them (Global Privacy Control or Do Not
// Track). The choice itself is a strictly necessary item in browser storage: it holds only "on" or
// "off" and no account details.
export const ANALYTICS_CHOICE_KEY = "tivorah_analytics_choice";
/** The old "turned off" marker (before analytics asked first): still honoured as a "no". */
export const ANALYTICS_OFF_KEY = "tivorah_analytics_off";

type StorageLike = Pick<Storage, "getItem" | "setItem" | "removeItem">;
type NavigatorLike = { globalPrivacyControl?: boolean; doNotTrack?: string | null };
export type AnalyticsChoice = "on" | "off" | null;

const storage = (): StorageLike | null => {
  try { return typeof window === "undefined" ? null : window.localStorage; } catch { return null; }
};

/** The browser asks not to be tracked (Global Privacy Control, or Do Not Track). */
export function browserAsksNotToTrack(nav: NavigatorLike | undefined = typeof navigator === "undefined" ? undefined : navigator as NavigatorLike) {
  return nav?.globalPrivacyControl === true || nav?.doNotTrack === "1";
}

/** "on", "off", or null when the visitor hasn't chosen yet. */
export function analyticsChoice(store: StorageLike | null = storage()): AnalyticsChoice {
  try {
    const value = store?.getItem(ANALYTICS_CHOICE_KEY);
    if (value === "on" || value === "off") return value;
    return store?.getItem(ANALYTICS_OFF_KEY) === "1" ? "off" : null;
  } catch { return null; }
}

export function analyticsTurnedOff(store: StorageLike | null = storage()) {
  return analyticsChoice(store) !== "on";
}

export function rememberAnalyticsChoice(enabled: boolean, store: StorageLike | null = storage()) {
  try {
    store?.setItem(ANALYTICS_CHOICE_KEY, enabled ? "on" : "off");
    store?.removeItem(ANALYTICS_OFF_KEY);
  } catch { /* storage blocked: the choice lasts for this page only */ }
}

/** Whether optional analytics may run for this visitor right now: only after they said yes. */
export function analyticsAllowed(configured: boolean, store: StorageLike | null = storage(), nav?: NavigatorLike) {
  return configured && analyticsChoice(store) === "on" && !browserAsksNotToTrack(nav ?? (typeof navigator === "undefined" ? undefined : navigator as NavigatorLike));
}

/** Whether to ask: set up, not yet chosen, and the browser hasn't already said no. */
export function shouldAskForAnalytics(configured: boolean, store: StorageLike | null = storage(), nav?: NavigatorLike) {
  return configured && analyticsChoice(store) === null && !browserAsksNotToTrack(nav ?? (typeof navigator === "undefined" ? undefined : navigator as NavigatorLike));
}
