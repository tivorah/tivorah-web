"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import Link from "next/link";

export function NewsletterForm() {
  const [state, setState] = useState<"idle" | "loading" | "success" | "error">(
    "idle",
  );
  const [message, setMessage] = useState("");
  const [showSuccess, setShowSuccess] = useState(false);
  // Marketing consent must be given before the form can be submitted (Spam Act 2003 / APP 7).
  const [consented, setConsented] = useState(false);
  const dialogRef = useRef<HTMLDivElement>(null);
  const submitRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!showSuccess) return;
    const submitButton = submitRef.current;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const focusable = () => Array.from(dialogRef.current?.querySelectorAll<HTMLElement>('button, a[href]') ?? []);
    focusable()[0]?.focus();
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setShowSuccess(false);
      if (event.key !== "Tab") return;
      const controls = focusable();
      if (!controls.length) return;
      const first = controls[0];
      const last = controls[controls.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", onKeyDown);
      submitButton?.focus();
    };
  }, [showSuccess]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    if (!consented) {
      setState("error");
      setMessage("Tick the consent box to join the waitlist.");
      return;
    }
    setState("loading");
    setMessage("");
    const data = new FormData(form);
    const apiUrl = process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "");

    try {
      if (!apiUrl) throw new Error("The waitlist is temporarily unavailable. Please try again later or email hello@tivorah.com.");
      const response = await fetch(`${apiUrl}/api/v1/public/waitlist`, {
        method: "POST",
        signal: AbortSignal.timeout(15000),
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          name: String(data.get("name") ?? "").trim(),
          email: String(data.get("email") ?? "").trim(),
          consent: consented,
          website: String(data.get("tv_hp_check") ?? ""),
          source: "website-waitlist",
        }),
      });
      if (!response.ok) throw new Error(response.status === 429
        ? "Too many attempts. Please wait before trying again."
        : "We couldn’t join the waitlist. Check your name, email and consent, then try again.");
      setState("success");
      setMessage("You’re on the Tivorah waitlist. We’ve sent a confirmation to your email.");
      setShowSuccess(true);
      form.reset();
      setConsented(false);
    } catch (error) {
      setState("error");
      setMessage(
        error instanceof Error && error.name === "Error" ? error.message : "We couldn’t reach Tivorah. Check your connection and try again.",
      );
    }
  }

  return (
    <form
      onSubmit={submit}
      className="form waitlist-form"
      name="tivorah-waitlist"
      method="POST"
      aria-busy={state === "loading"}
    >
      <input type="hidden" name="form-name" value="tivorah-waitlist" />
      <input type="hidden" name="source" value="website-waitlist" />
      {/* Spam trap. Named so browser autofill won't recognise it and fill it for real people. */}
      <input
        name="tv_hp_check"
        tabIndex={-1}
        autoComplete="off"
        className="honey"
        aria-hidden="true"
      />
      <div className="waitlist-fields">
        <label htmlFor="newsletter-name">
          Your name
          <input
            id="newsletter-name"
            name="name"
            type="text"
            autoComplete="name"
            required
            minLength={2}
            maxLength={120}
            placeholder="How should we address you?"
          />
        </label>
        <label htmlFor="newsletter-email">
          Email address
          <input
            id="newsletter-email"
            name="email"
            type="email"
            autoComplete="email"
            required
            placeholder="you@example.com"
          />
        </label>
      </div>
      <label className="consent">
        <input name="consent" type="checkbox" required checked={consented} onChange={(event) => setConsented(event.target.checked)} aria-describedby="waitlist-consent-hint" />
        <span>
          I agree to receive Tivorah launch news and app updates. I can unsubscribe
          anytime. See our <Link href="/privacy">Privacy Policy</Link>.
        </span>
      </label>
      <button ref={submitRef} className="waitlist-submit" disabled={state === "loading" || !consented} aria-disabled={state === "loading" || !consented}>
        {state === "loading" ? <><span className="waitlist-spinner" aria-hidden="true"/>Joining…</> : "Join the waitlist"}
      </button>
      {!consented ? <p id="waitlist-consent-hint" className="form-fine-print">Tick the box above to join the waitlist.</p> : null}
      <p className="form-fine-print">
        Already subscribed? <Link href="/unsubscribe">Unsubscribe here</Link>.
      </p>
      {message && (
        <p role="status" className={state}>
          {message}
        </p>
      )}
      {showSuccess ? (
        <div className="waitlist-success-backdrop" onMouseDown={() => setShowSuccess(false)}>
          <div ref={dialogRef} className="waitlist-success-dialog" role="dialog" aria-modal="true" aria-labelledby="waitlist-success-title" onMouseDown={(event) => event.stopPropagation()}>
            <div className="success-signal" aria-hidden="true"><i /><i /><i /><span>✓</span></div>
            <button className="success-close" type="button" aria-label="Close confirmation" onClick={() => setShowSuccess(false)}>×</button>
            <div className="success-copy">
              <span className="success-kicker">Your place is saved</span>
              <h3 id="waitlist-success-title">You&apos;re on the list.</h3>
              <p>We&apos;ll let you know when Tivorah is ready. Until then, take a closer look at the Hubs, people and local plans we&apos;re bringing together.</p>
            </div>
            <a className="success-action" href="#preview" onClick={() => setShowSuccess(false)}>Explore Tivorah <span aria-hidden="true">↓</span></a>
          </div>
        </div>
      ) : null}
    </form>
  );
}
