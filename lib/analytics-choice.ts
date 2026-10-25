// The visitor's choice about optional website analytics (Cookie Notice, "Usage analytics").
// Analytics never runs when they turned it off, or when their browser asks sites not to track
// them (Global Privacy Control or Do Not Track). The choice itself is a strictly necessary item in
// browser storage: it holds only "off" and no account details.
export const ANALYTICS_OFF_KEY = "tivorah_analytics_off";

type StorageLike = Pick<Storage, "getItem" | "setItem" | "removeItem">;
type NavigatorLike = { globalPrivacyControl?: boolean; doNotTrack?: string | null };

const storage = (): StorageLike | null => {
  try { return typeof window === "undefined" ? null : window.localStorage; } catch { return null; }
};

/** The browser asks not to be tracked (Global Privacy Control, or Do Not Track). */
export function browserAsksNotToTrack(nav: NavigatorLike | undefined = typeof navigator === "undefined" ? undefined : navigator as NavigatorLike) {
  return nav?.globalPrivacyControl === true || nav?.doNotTrack === "1";
}

export function analyticsTurnedOff(store: StorageLike | null = storage()) {
  try { return store?.getItem(ANALYTICS_OFF_KEY) === "1"; } catch { return false; }
}

export function rememberAnalyticsChoice(enabled: boolean, store: StorageLike | null = storage()) {
  try {
    if (enabled) store?.removeItem(ANALYTICS_OFF_KEY);
    else store?.setItem(ANALYTICS_OFF_KEY, "1");
  } catch { /* storage blocked: the choice lasts for this page only */ }
}

/** Whether optional analytics may run for this visitor right now. */
export function analyticsAllowed(configured: boolean, store: StorageLike | null = storage(), nav?: NavigatorLike) {
  return configured && !analyticsTurnedOff(store) && !browserAsksNotToTrack(nav ?? (typeof navigator === "undefined" ? undefined : navigator as NavigatorLike));
}
