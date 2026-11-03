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
 *
 * Someone could send a link with a token for THEIR account, to sign a victim into it unnoticed. So:
 * a browser signed in to a different account is never switched without asking, and a signed-out
 * browser outside the app's own screen is shown who it is now signed in as before it continues.
 */
const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
type SessionUser = { id?: string | number; name?: string | null; username?: string | null };
const insideAppBrowser = () => typeof window !== "undefined" && Boolean((window as Window & { ReactNativeWebView?: unknown }).ReactNativeWebView);
async function currentSessionUser(): Promise<SessionUser | null> {
  try {
    const response = await fetch(`${adminApiBase()}/api/auth/get-session`, { credentials: "include" });
    if (!response.ok) return null;
    const body = await response.json() as { user?: SessionUser | null } | null;
    return body?.user?.id != null ? body.user : null;
  } catch { return null; }
}
const describe = (user: SessionUser | null) => user ? [user.name?.trim(), user.username ? `@${user.username}` : ""].filter(Boolean).join(" ") || "this account" : "this account";
export function SessionHandoff() {
  const params = useSearchParams();
  const returnTo = safeReturnPath(params.get("returnTo"));
  const [failed, setFailed] = useState(false);
  const [signedIn, setSignedIn] = useState(false);
  const [fromApp, setFromApp] = useState(false);
  // A decision only the person can make: switch accounts, or confirm who they're now signed in as.
  const [question, setQuestion] = useState<null | { kind: "switch"; current: SessionUser; exchange: () => void } | { kind: "confirm"; user: SessionUser; go: () => void }>(null);
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
    const fail = () => {
      setFailed(true);
      // Inside the app's own browser screen: tell it, so it lifts its preloader and shows this message.
      (window as Window & { ReactNativeWebView?: { postMessage: (message: string) => void } }).ReactNativeWebView?.postMessage("handoff-failed");
    };
    const exchange = async () => {
      for (let attempt = 0; attempt < 3; attempt += 1) {
        try {
          const response = await fetch(`${adminApiBase()}/api/auth/one-time-token/verify`, {
            method: "POST",
            credentials: "include",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ token }),
          });
          if (!response.ok) return false; // The API answered: the token is used or expired.
          return true;
        } catch {
          await wait(700 * (attempt + 1)); // Didn't reach the API: the token is still unused.
        }
      }
      return false;
    };
    const exchangeAndContinue = async () => {
      if (await exchange()) {
        // Signed out before: outside the app, show who this is now, so a link carrying someone else's
        // account can't sign this browser in to it unnoticed. Inside the app's screen it's the app's own.
        const user = insideAppBrowser() ? null : await currentSessionUser();
        if (user) { setQuestion({ kind: "confirm", user, go }); return; }
        return go(); // A full navigation so every part of the site picks up the new session.
      }
      const user = await currentSessionUser();
      if (continuesWithSession(user ? { user } : null, account)) return go();
      fail();
    };
    void (async () => {
      const current = await currentSessionUser();
      // Already signed in here to the account the app is using: nothing to exchange.
      if (current && continuesWithSession({ user: current }, account)) return go();
      if (!token) return fail();
      // Signed in to a different account: never replace it without asking.
      if (current) { setQuestion({ kind: "switch", current, exchange: () => { setQuestion(null); void exchangeAndContinue(); } }); return; }
      await exchangeAndContinue();
    })();
  }, [params, returnTo]);

  if (question?.kind === "switch") {
    return <section className="product-form auth-form" role="alert">
      <h1>Switch accounts?</h1>
      <p>This browser is signed in as {describe(question.current)}. The link you opened is for a different Tivorah account.</p>
      <div className="handoff-actions">
        <button type="button" className="product-primary" onClick={question.exchange}>Switch accounts</button>
        <button type="button" className="product-secondary" onClick={() => window.location.replace(returnTo)}>Keep {describe(question.current)}</button>
      </div>
    </section>;
  }
  if (question?.kind === "confirm") {
    const signOut = async () => {
      await fetch(`${adminApiBase()}/api/auth/sign-out`, { method: "POST", credentials: "include", headers: { "Content-Type": "application/json" }, body: "{}" }).catch(() => undefined);
      window.location.replace(`/auth/signin?returnTo=${encodeURIComponent(returnTo)}`);
    };
    return <section className="product-form auth-form" role="alert">
      <h1>You’re signed in as {describe(question.user)}</h1>
      <p>If this isn’t your account, sign out now. Don’t enter payment or personal details.</p>
      <div className="handoff-actions">
        <button type="button" className="product-primary" onClick={question.go}>Continue</button>
        <button type="button" className="product-secondary" onClick={() => void signOut()}>This isn’t me</button>
      </div>
    </section>;
  }
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
