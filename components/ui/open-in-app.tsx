"use client";

import Link from "next/link";
import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import { BrandedQrCode } from "../../app/branded-qr-code";

// "Open in Tivorah": opens the installed app on the same screen.
// - iPhone: tries the tivorah:// link; if the page is still showing shortly after,
//   the app isn't installed, so we offer the download instead.
// - Android: an intent link, which falls back to the store (or this page) by itself.
// - Computer: shows a QR code to continue on a phone.
const ANDROID_PACKAGE = "com.tivorah.tivorah";
const safe = (url?: string) => (url?.startsWith("https://") ? url : undefined);
const iosStore = safe(process.env.NEXT_PUBLIC_IOS_APP_URL);
const androidStore = safe(process.env.NEXT_PUBLIC_ANDROID_APP_URL);

type Platform = "ios" | "android" | "desktop";
function platform(): Platform {
  const agent = navigator.userAgent;
  if (/android/i.test(agent)) return "android";
  if (/iphone|ipad|ipod/i.test(agent) || (/macintosh/i.test(agent) && navigator.maxTouchPoints > 1)) return "ios";
  return "desktop";
}

export function OpenInApp({ appPath, className, children = "Open in Tivorah" }: { appPath: string; className?: string; children?: ReactNode }) {
  const [state, setState] = useState<"idle" | "opening" | "missing" | "qr">("idle");
  const timer = useRef<number | null>(null);
  const panel = useId();
  const appUrl = `tivorah://${appPath}`;

  useEffect(() => {
    // Leaving for the app hides this page: the app opened, so cancel the fallback.
    const onHide = () => { if (document.hidden && timer.current) { window.clearTimeout(timer.current); timer.current = null; setState("idle"); } };
    document.addEventListener("visibilitychange", onHide);
    window.addEventListener("pagehide", onHide);
    return () => { document.removeEventListener("visibilitychange", onHide); window.removeEventListener("pagehide", onHide); if (timer.current) window.clearTimeout(timer.current); };
  }, []);

  function open(event: React.MouseEvent<HTMLAnchorElement>) {
    const device = platform();
    event.preventDefault();
    if (device === "desktop") { setState((current) => (current === "qr" ? "idle" : "qr")); return; }
    if (device === "android") {
      const [path, query = ""] = appPath.split("?");
      const fallback = androidStore ?? `${window.location.href.split("#")[0]}${window.location.search ? "&" : "?"}app=missing`;
      window.location.href = `intent://${path}${query ? `?${query}` : ""}#Intent;scheme=tivorah;package=${ANDROID_PACKAGE};S.browser_fallback_url=${encodeURIComponent(fallback)};end`;
      return;
    }
    setState("opening");
    timer.current = window.setTimeout(() => { timer.current = null; if (!document.hidden) setState("missing"); }, 1600);
    window.location.href = appUrl;
  }

  // Android fallback lands back here with ?app=missing.
  useEffect(() => {
    if (new URLSearchParams(window.location.search).get("app") === "missing") setState("missing");
  }, []);

  const store = typeof navigator !== "undefined" && platform() === "android" ? androidStore : iosStore;
  return <span className="open-in-app">
    <a href={appUrl} className={className} onClick={open} aria-expanded={state === "qr" || state === "missing" ? true : undefined} aria-controls={panel}>
      {state === "opening" ? "Opening Tivorah…" : children}
    </a>
    {state === "missing" ? <span id={panel} className="open-in-app-panel" role="status">
      <strong>Tivorah isn’t on this phone yet.</strong>
      <span>Get the app, then come back to this page and tap Open in Tivorah again.</span>
      <span className="open-in-app-actions">
        {store ? <a className="product-primary" href={store}>Get Tivorah</a> : <Link className="product-primary" href="/#updates">Get notified when the app launches</Link>}
        <button type="button" className="showcase-link" onClick={() => setState("idle")}>Not now</button>
      </span>
    </span> : null}
    {state === "qr" ? <span id={panel} className="open-in-app-panel is-qr" role="dialog" aria-label="Open this page on your phone">
      <strong>Open this on your phone</strong>
      <span>Scan with your phone’s camera, then tap Open in Tivorah.</span>
      <BrandedQrCode value={typeof window !== "undefined" ? window.location.href.split("#")[0] : ""} size={168} ariaLabel="Scan to open this page on your phone" />
      <button type="button" className="showcase-link" onClick={() => setState("idle")}>Close</button>
    </span> : null}
  </span>;
}
