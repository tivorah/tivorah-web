"use client";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { adminApiBase } from "../../app/admin/api-base";
import { safeReturnPath } from "../../lib/auth/return-path";
import { rememberOpenedFromApp } from "../../lib/app-return";
import { destinationLabel } from "../../lib/auth/handoff-destination";

/**
 * Signs the browser in from the Tivorah app. The app opens tivorah.com in a browser that has no
 * session ("Manage showcase"), passing a single-use, 2-minute token for its own session; this page
 * exchanges it for a session cookie and continues to the requested page.
 */
export function SessionHandoff() {
  const params = useSearchParams();
  const returnTo = safeReturnPath(params.get("returnTo"));
  const [failed, setFailed] = useState(false);
  const [signedIn, setSignedIn] = useState(false);
  const destination = destinationLabel(returnTo);
  const started = useRef(false);

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    const token = params.get("token") ?? "";
    // Opened from the app: remember it for this tab so every page offers a way back (AppReturnBar).
    if (params.get("fromApp") === "1") rememberOpenedFromApp();
    // Drop the token from the address bar and history straight away.
    window.history.replaceState(null, "", `/auth/handoff?returnTo=${encodeURIComponent(returnTo)}`);
    if (!token) { setFailed(true); return; }
    fetch(`${adminApiBase()}/api/auth/one-time-token/verify`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token }),
    })
      .then((response) => {
        if (!response.ok) throw new Error("Handoff rejected");
        setSignedIn(true);
        // A full navigation so every part of the site picks up the new session.
        window.location.replace(returnTo);
      })
      .catch(() => setFailed(true));
  }, [params, returnTo]);

  if (failed) {
    return <section className="product-form auth-form" role="alert">
      <h1>Sign in to continue</h1>
      <p>This link from the app has expired or was already used. Sign in once and you’ll go straight there.</p>
      <Link className="product-primary" href={`/auth/signin?returnTo=${encodeURIComponent(returnTo)}`}>Sign in</Link>
    </section>;
  }
  return <section className="handoff-loader" role="status" aria-live="polite" aria-label={`Opening ${destination}`}>
    <div className="handoff-mark" aria-hidden="true">
      <span className="handoff-ring" />
      <span className="handoff-glow" />
      <Image src="/tivorah-mark.png" alt="" width={56} height={54} priority />
    </div>
    <h1>Opening {destination}</h1>
    <p>Carrying your sign-in over from the app.</p>
    <ol className="handoff-steps">
      <li className={signedIn ? "is-done" : "is-active"}><span aria-hidden="true" />{signedIn ? "Signed in" : "Signing you in"}</li>
      <li className={signedIn ? "is-active" : ""}><span aria-hidden="true" />Opening {destination}</li>
    </ol>
    <span className="handoff-progress" aria-hidden="true"><i /></span>
  </section>;
}

/** Shown for the split second before the page reads its address: the same loader, nothing ticked. */
export function HandoffFallback() {
  return <section className="handoff-loader" role="status" aria-label="Opening Tivorah">
    <div className="handoff-mark" aria-hidden="true"><span className="handoff-ring" /><span className="handoff-glow" /><Image src="/tivorah-mark.png" alt="" width={56} height={54} priority /></div>
    <h1>Opening Tivorah</h1>
    <p>Carrying your sign-in over from the app.</p>
    <span className="handoff-progress" aria-hidden="true"><i /></span>
  </section>;
}
