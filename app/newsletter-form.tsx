"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";

export function NewsletterForm() {
  const [state, setState] = useState<"idle" | "loading" | "success" | "error">(
    "idle",
  );
  const [message, setMessage] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    setState("loading");
    setMessage("");
    const data = new FormData(form);
    const apiUrl = process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "");

    const submitToNetlify = async () => {
      const body = new URLSearchParams({
        "form-name": "tivorah-waitlist",
        name: String(data.get("name") ?? ""),
        email: String(data.get("email") ?? ""),
        consent: data.get("consent") === "on" ? "yes" : "no",
        source: "website-waitlist",
        website: String(data.get("website") ?? ""),
      });
      const response = await fetch("/forms.html", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: body.toString(),
      });
      if (!response.ok) throw new Error("The waiting-list request could not be submitted.");
    };

    try {
      if (apiUrl) {
        try {
          const response = await fetch(`${apiUrl}/api/v1/public/waitlist`, {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({
              name: data.get("name"),
              email: data.get("email"),
              consent: data.get("consent") === "on",
              website: data.get("website"),
              source: "website-waitlist",
            }),
          });
          const result = await response.json();
          if (!response.ok) throw new Error(result.message || "Please check your details.");
        } catch {
          await submitToNetlify();
        }
      } else {
        await submitToNetlify();
      }
      setState("success");
      setMessage("You’re on the Tivorah waitlist. We’ll email you with launch news.");
      form.reset();
    } catch (error) {
      setState("error");
      setMessage(
        error instanceof Error ? error.message : "Something went wrong.",
      );
    }
  }

  return (
    <form
      onSubmit={submit}
      className="form waitlist-form"
      name="tivorah-waitlist"
      method="POST"
      data-netlify="true"
      data-netlify-honeypot="website"
    >
      <input type="hidden" name="form-name" value="tivorah-waitlist" />
      <input type="hidden" name="source" value="website-waitlist" />
      <input
        name="website"
        tabIndex={-1}
        autoComplete="off"
        className="honey"
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
      <button className="waitlist-submit" disabled={state === "loading"}>
        {state === "loading" ? <><span className="waitlist-spinner" aria-hidden="true"/>Joining…</> : "Join the waitlist"}
      </button>
      <label className="consent">
        <input name="consent" type="checkbox" required />
        <span>
          I agree to receive Tivorah launch news and app updates. I can unsubscribe
          anytime. See our <Link href="/privacy">Privacy Policy</Link>.
        </span>
      </label>
      <p className="form-fine-print">
        Already subscribed? <Link href="/unsubscribe">Unsubscribe here</Link>.
      </p>
      {message && (
        <p role="status" className={state}>
          {message}
        </p>
      )}
    </form>
  );
}
