"use client";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { adminApiBase } from "../../app/admin/api-base";
import { safeReturnPath } from "../../lib/auth/return-path";

/**
 * Signs the browser in from the Tivorah app. The app opens tivorah.com in a browser that has no
 * session ("Manage shop"), passing a single-use, 2-minute token for its own session; this page
 * exchanges it for a session cookie and continues to the requested page.
 */
export function SessionHandoff() {
  const params = useSearchParams();
  const returnTo = safeReturnPath(params.get("returnTo"));
  const [failed, setFailed] = useState(false);
  const started = useRef(false);

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    const token = params.get("token") ?? "";
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
  return <section className="product-form auth-form" role="status" aria-live="polite">
    <h1>Opening Tivorah…</h1>
    <p>Signing you in from the app.</p>
  </section>;
}
