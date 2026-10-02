"use client";
import Image from "next/image";

function StoreIcon({ store }: { store: "ios" | "android" }) {
  return store === "ios" ? <svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor" aria-hidden="true"><path d="M17 12.4c0-2.1 1.7-3.2 1.8-3.3-1-1.5-2.6-1.7-3.2-1.7-1.4-.1-2.7.8-3.4.8-.7 0-1.8-.8-2.9-.8-1.5 0-2.9.9-3.7 2.2-1.6 2.7-.4 6.8 1.2 9 .8 1.1 1.6 2.2 2.8 2.1 1.1 0 1.5-.7 2.9-.7 1.4 0 1.8.7 3 .7 1.2 0 2-1 2.7-2.1.9-1.2 1.3-2.4 1.3-2.5-.1 0-2.5-.9-2.5-3.7ZM14.8 5.9c.6-.8 1.1-1.9 1-3-.9 0-2.1.6-2.7 1.4-.6.7-1.2 1.9-1 3 1 .1 2.1-.5 2.7-1.4Z" /></svg> : <svg viewBox="0 0 24 24" width="22" height="22" fill="none" aria-hidden="true"><path d="M4 2.8v18.4L14.7 12 4 2.8Z" fill="#34A853"/><path d="m4 2.8 10.7 9.2 3.4-3L6.2 2.3c-.8-.5-1.5-.2-2.2.5Z" fill="#4285F4"/><path d="m4 21.2 10.7-9.2 3.4 3-11.9 6.7c-.8.5-1.5.2-2.2-.5Z" fill="#EA4335"/><path d="m14.7 12 3.4-3 2.5 1.4c1.3.7 1.3 2.5 0 3.2L18.1 15l-3.4-3Z" fill="#FBBC04"/></svg>;
}

export function EventAppInvite() {
  const ios = process.env.NEXT_PUBLIC_IOS_APP_URL;
  const android = process.env.NEXT_PUBLIC_ANDROID_APP_URL;
  const storeUrl = (url: string | undefined, store: "ios" | "android") => {
    if (!url) return null;
    try {
      const parsed = new URL(url);
      if (parsed.protocol !== "https:") return null;
      if (store === "ios") return parsed.hostname === "apps.apple.com" && /\/id\d+(?:\/)?$/.test(parsed.pathname) ? parsed.href : null;
      return parsed.hostname === "play.google.com" && parsed.pathname === "/store/apps/details" && /^[a-zA-Z][a-zA-Z0-9_.]+$/.test(parsed.searchParams.get("id") || "") ? parsed.href : null;
    } catch { return null; }
  };
  const iosListing = storeUrl(ios, "ios");
  const androidListing = storeUrl(android, "android");
  // Temporary store homepages; replace with the Tivorah listing URLs in web env.
  const iosUrl = iosListing || "https://apps.apple.com/au/";
  const androidUrl = androidListing || "https://play.google.com/store/apps";
  return <aside className="event-app-invite" aria-label="Explore Tivorah mobile app">
    <Image className="event-app-mark" src="/tivorah-mark.png" alt="" width={48} height={48} />
    <div className="event-app-copy"><h2>Take Tivorah with you</h2>
    <p>Explore local Hubs and keep the conversation going in the app.</p></div>
    <div className="event-app-links">
      <a className="event-store-badge" href={iosUrl} aria-label={iosListing ? "Download Tivorah from the Apple App Store" : "Open the Apple App Store"}><StoreIcon store="ios" /> App Store</a>
      <a className="event-store-badge" href={androidUrl} aria-label={androidListing ? "Download Tivorah from Google Play" : "Open Google Play"}><StoreIcon store="android" /> Google Play</a>
    </div>
  </aside>;
}
