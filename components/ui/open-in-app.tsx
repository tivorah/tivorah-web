"use client";

import Link from "next/link";
import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import { BrandedQrCode } from "../../app/branded-qr-code";
import { appPlatform as platform, launchApp, storeFor } from "../../lib/open-app";

// "Open in Tivorah": opens the installed app on the same screen (lib/open-app.ts); if it isn't
// installed, offers the download. On a computer it shows a QR code to continue on a phone.
export function OpenInApp({ appPath, className, children = "Open in Tivorah" }: { appPath: string; className?: string; children?: ReactNode }) {
  const [state, setState] = useState<"idle" | "opening" | "missing" | "qr">("idle");
  const panel = useId();
  const appUrl = `tivorah://${appPath}`;

  const cancel = useRef<(() => void) | null>(null);
  useEffect(() => () => cancel.current?.(), []);

  function open(event: React.MouseEvent<HTMLAnchorElement>) {
    const device = platform();
    event.preventDefault();
    if (device === "desktop") { setState((current) => (current === "qr" ? "idle" : "qr")); return; }
    if (device === "ios") setState("opening");
    cancel.current?.();
    cancel.current = launchApp(appPath, () => setState("missing"));
    // The app opened (or Android took over): the button reads normally again when they come back.
    if (device === "ios") window.setTimeout(() => setState((current) => (current === "opening" ? "idle" : current)), 2000);
  }

  // Panels close with Escape as well as Close / tapping outside.
  const panelOpen = state === "qr" || state === "missing";
  useEffect(() => {
    if (!panelOpen) return;
    const onKey = (event: KeyboardEvent) => { if (event.key === "Escape") setState("idle"); };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [panelOpen]);

  // Android fallback lands back here with ?app=missing.
  useEffect(() => {
    if (new URLSearchParams(window.location.search).get("app") === "missing") setState("missing");
  }, []);

  const store = typeof navigator !== "undefined" ? storeFor(platform()) : undefined;
  return <span className="open-in-app">
    <a href={appUrl} className={className} onClick={open} aria-expanded={state === "qr" || state === "missing" ? true : undefined} aria-controls={panel}>
      {state === "opening" ? "Opening Tivorah…" : children}
    </a>
    {/* Tapping outside closes the panel; on phones it also dims the page behind the bottom sheet. */}
    {panelOpen ? <span className="open-in-app-backdrop" aria-hidden="true" onClick={() => setState("idle")} /> : null}
    {state === "missing" ? <span id={panel} className="open-in-app-panel" role="status">
      <strong>Tivorah isn’t on this phone yet.</strong>
      <span>Get the app, then come back to this page and tap Open in Tivorah again.</span>
      <span className="open-in-app-actions">
        {store ? <a className="product-primary" href={store}>Get Tivorah</a> : <Link className="product-primary" href="/#updates">Get notified when the app launches</Link>}
        <button type="button" className="shop-link" onClick={() => setState("idle")}>Not now</button>
      </span>
    </span> : null}
    {state === "qr" ? <span id={panel} className="open-in-app-panel is-qr" role="dialog" aria-label="Open this page on your phone">
      <strong>Open this on your phone</strong>
      <span>Scan with your phone’s camera, then tap Open in Tivorah.</span>
      <BrandedQrCode value={typeof window !== "undefined" ? window.location.href.split("#")[0] : ""} size={168} ariaLabel="Scan to open this page on your phone" />
      <button type="button" className="shop-link open-in-app-close" onClick={() => setState("idle")}>Close</button>
    </span> : null}
  </span>;
}
