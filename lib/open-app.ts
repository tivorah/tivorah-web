// Opening the Tivorah app on the same screen from a web page (components/ui/open-in-app.tsx and
// components/ui/app-open-prompt.tsx).
// - iPhone: tries the tivorah:// link; if the page is still showing shortly after, the app isn't
//   installed, so the page offers the download instead.
// - Android: an intent link, which falls back to the store (or this page with ?app=missing) by itself.
export const ANDROID_PACKAGE = "com.tivorah.tivorah";
const safe = (url?: string) => (url?.startsWith("https://") ? url : undefined);
export const iosStore = safe(process.env.NEXT_PUBLIC_IOS_APP_URL);
export const androidStore = safe(process.env.NEXT_PUBLIC_ANDROID_APP_URL);

export type AppPlatform = "ios" | "android" | "desktop";
export function appPlatform(agent = navigator.userAgent, touchPoints = navigator.maxTouchPoints): AppPlatform {
  if (/android/i.test(agent)) return "android";
  if (/iphone|ipad|ipod/i.test(agent) || (/macintosh/i.test(agent) && touchPoints > 1)) return "ios";
  return "desktop";
}

/** The store for this phone, when it's set. */
export const storeFor = (platform: AppPlatform) => (platform === "android" ? androidStore : iosStore);

/**
 * Leaves for the app. On iPhone, `onMissing` runs when the page is still showing after a moment
 * (the app isn't installed); the returned function cancels that check.
 */
export function launchApp(appPath: string, onMissing: () => void): () => void {
  if (appPlatform() === "android") {
    const [path, query = ""] = appPath.split("?");
    const fallback = androidStore ?? `${window.location.href.split("#")[0]}${window.location.search ? "&" : "?"}app=missing`;
    window.location.href = `intent://${path}${query ? `?${query}` : ""}#Intent;scheme=tivorah;package=${ANDROID_PACKAGE};S.browser_fallback_url=${encodeURIComponent(fallback)};end`;
    return () => undefined;
  }
  let timer: number | null = window.setTimeout(() => { timer = null; cleanup(); if (!document.hidden) onMissing(); }, 1600);
  // Leaving for the app hides this page: the app opened, so the fallback is cancelled.
  const onHide = () => { if (document.hidden) cancel(); };
  function cleanup() { document.removeEventListener("visibilitychange", onHide); window.removeEventListener("pagehide", onHide); }
  function cancel() { if (timer) window.clearTimeout(timer); timer = null; cleanup(); }
  document.addEventListener("visibilitychange", onHide);
  window.addEventListener("pagehide", onHide);
  window.location.href = `tivorah://${appPath}`;
  return cancel;
}

/** A page someone was sent a link to, which the app also shows: the app's path and what to say. */
export type AppLinkPage = { appPath: string; title: string; body: string };

/**
 * The app screen for a web page opened from a shared link: a profile, an event or a Hub (the web
 * Hub page opens the app's invite screen, like its own Open in Tivorah button). Null for any other page.
 */
export function appLinkFor(pathname: string): AppLinkPage | null {
  const parts = pathname.split("/").filter(Boolean).map((part) => { try { return decodeURIComponent(part); } catch { return part; } });
  const safePart = (part: string | undefined) => (part && /^[\w.-]+$/.test(part) ? part : null);
  if (parts[0] === "u" && parts.length === 2 && safePart(parts[1])) {
    return { appPath: `u/${parts[1]}`, title: `Connect with @${parts[1]} on Tivorah`, body: "Follow people, chat and see what’s on near you in the app." };
  }
  if (parts[0] === "events" && parts.length === 2 && safePart(parts[1])) {
    return { appPath: `events/${parts[1]}`, title: "See this event on Tivorah", body: "Book, keep your tickets and get updates about this event in the app." };
  }
  const hub = parts[0] === "hubs" ? (parts[1] === "invite" && parts.length === 3 ? parts[2] : parts.length === 2 && parts[1] !== "invite" ? parts[1] : null) : null;
  if (safePart(hub ?? undefined)) {
    return { appPath: `hubs/invite/${hub}`, title: "Join this Hub on Tivorah", body: "Chat with the Hub, see its posts and get its events in the app." };
  }
  return null;
}
