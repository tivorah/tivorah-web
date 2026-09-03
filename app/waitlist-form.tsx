"use client";
import { FormEvent, useState } from "react";

export function WaitlistForm() {
  const [state, setState] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState("");
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setState("loading");
    setMessage("");
    const data = new FormData(event.currentTarget);
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/public/waitlist`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          name: data.get("name"),
          email: data.get("email"),
          consent: data.get("consent") === "on",
          website: data.get("website"),
          source: "website",
        }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.message || "Please check your details.");
      setState("success");
      setMessage(result.message);
      event.currentTarget.reset();
    } catch (error) {
      setState("error");
      setMessage(error instanceof Error ? error.message : "Something went wrong.");
    }
  }

  return (
    <form onSubmit={submit} className="form waitlist-form">
      <input name="website" tabIndex={-1} autoComplete="off" className="honey" />
      <div className="waitlist-fields">
        <label htmlFor="waitlist-name">
          Your name
          <input
            id="waitlist-name"
            name="name"
            type="text"
            autoComplete="name"
            required
            minLength={2}
            maxLength={120}
            placeholder="How should we address you?"
          />
        </label>
        <label htmlFor="waitlist-email">
          Email address
          <input
            id="waitlist-email"
            name="email"
            type="email"
            autoComplete="email"
            required
            placeholder="you@example.com"
          />
        </label>
      </div>
      <button className="waitlist-submit" disabled={state === "loading"}>
        {state === "loading" ? "Joining…" : "Join the waitlist"}
      </button>
      <label className="consent">
        <input name="consent" type="checkbox" required />
        <span>I agree to receive Tivorah launch updates. I can unsubscribe anytime.</span>
      </label>
      {message && <p role="status" className={state}>{message}</p>}
    </form>
  );
}
