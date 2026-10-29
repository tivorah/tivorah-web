"use client";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { adminApiBase } from "../../app/admin/api-base";
import { safeReturnPath } from "../../lib/auth/return-path";
import { APP_RETURN_URL, openedFromApp, rememberOpenedFromApp } from "../../lib/app-return";
import { accountHint, continuesWithSession } from "../../lib/auth/handoff-session";
import { destinationLabel } from "../../lib/auth/handoff-destination";

/**
 * Signs the browser in from the Tivorah app. The app opens tivorah.com in a browser that has no
 * session ("Manage shop"), passing a single-use, 5-minute token for its own session; this page
 * exchanges it for a session cookie and continues to the requested page.
 *
 * It must not fail on a working sign-in: a verify request that doesn't reach the API is retried
 * (the token is still unused), and when the token is missing (the page was reloaded or restored)
 * or already used, it carries on if this browser is already signed in to the same account the app
 * passed (`account`). Only then does it ask people to go back to the app or sign in.
 */
const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
export function SessionHandoff() {
  const params = useSearchParams();
  const returnTo = safeReturnPath(params.get("returnTo"));
  const [failed, setFailed] = useState(false);
  const [signedIn, setSignedIn] = useState(false);
  const [fromApp, setFromApp] = useState(false);
  const destination = destinationLabel(returnTo);
  const started = useRef(false);

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    const token = params.get("token") ?? "";
    const account = accountHint(params.get("account"));
    // Opened from the app: remember it for this tab (the failure message below offers a way back).
    if (params.get("fromApp") === "1") rememberOpenedFromApp();
    setFromApp(openedFromApp());
    // Drop the token from the address bar and history straight away (a reload keeps the account).
    window.history.replaceState(null, "", `/auth/handoff?returnTo=${encodeURIComponent(returnTo)}${account ? `&account=${account}` : ""}`);
    const go = () => { setSignedIn(true); window.location.replace(returnTo); };
    void (async () => {
      if (token) {
        for (let attempt = 0; attempt < 3; attempt += 1) {
          try {
            const response = await fetch(`${adminApiBase()}/api/auth/one-time-token/verify`, {
              method: "POST",
              credentials: "include",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ token }),
            });
            // A full navigation so every part of the site picks up the new session.
            if (response.ok) return go();
            break; // The API answered: the token is used or expired; check for a session below.
          } catch {
            await wait(700 * (attempt + 1)); // Didn't reach the API: the token is still unused.
          }
        }
      }
      try {
        const response = await fetch(`${adminApiBase()}/api/auth/get-session`, { credentials: "include" });
        if (response.ok && continuesWithSession(await response.json(), account)) return go();
      } catch { /* fall through to the message */ }
      setFailed(true);
      // Inside the app's own browser screen: tell it, so it lifts its preloader and shows this message.
      (window as Window & { ReactNativeWebView?: { postMessage: (message: string) => void } }).ReactNativeWebView?.postMessage("handoff-failed");
    })();
  }, [params, returnTo]);

  if (failed) {
    return <section className="product-form auth-form" role="alert">
      <h1>Let’s try that again</h1>
      <p>We couldn’t carry your sign-in over from the app this time. Go back to the app and tap again, or sign in here and you’ll go straight there.</p>
      <div className="handoff-actions">
        {fromApp ? <a className="product-primary" href={APP_RETURN_URL}>Back to the app</a> : null}
        <Link className={fromApp ? "product-secondary" : "product-primary"} href={`/auth/signin?returnTo=${encodeURIComponent(returnTo)}`}>Sign in</Link>
      </div>
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
