"use client";

import { FormEvent, useState } from "react";

async function submitNetlify(email: string, website: string) {
  const body = new URLSearchParams({
    "form-name": "tivorah-unsubscribe",
    email,
    website,
  });
  const response = await fetch("/forms.html", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: body.toString(),
  });
  if (!response.ok) throw new Error("The unsubscribe request could not be submitted.");
}

export function UnsubscribeForm() {
  const [state, setState] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setState("loading");
    setMessage("");
    const data = new FormData(event.currentTarget);
    const email = String(data.get("email") ?? "").trim().toLowerCase();
    const website = String(data.get("website") ?? "");
    const apiUrl = process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "");

    try {
      if (apiUrl) {
        try {
          const response = await fetch(`${apiUrl}/api/v1/public/waitlist/unsubscribe`, {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({ email, website }),
          });
          if (!response.ok) throw new Error("API unsubscribe failed");
        } catch {
          await submitNetlify(email, website);
        }
      } else {
        await submitNetlify(email, website);
      }
      setState("success");
      setMessage("Your unsubscribe request has been recorded.");
      event.currentTarget.reset();
    } catch {
      setState("error");
      setMessage("We could not submit this request. Email privacy@tivorah.com and we will help.");
    }
  }

  return (
    <form
      className="form standalone-form"
      name="tivorah-unsubscribe"
      method="POST"
      data-netlify="true"
      data-netlify-honeypot="website"
      onSubmit={submit}
    >
      <input type="hidden" name="form-name" value="tivorah-unsubscribe" />
      <label className="honey" aria-hidden="true">
        Leave this field empty <input name="website" tabIndex={-1} autoComplete="off" />
      </label>
      <label htmlFor="unsubscribe-email">
        Email address
        <input id="unsubscribe-email" name="email" type="email" autoComplete="email" required />
      </label>
      <button disabled={state === "loading"}>
        {state === "loading" ? "Submitting…" : "Unsubscribe"}
      </button>
      {message && <p role="status" className={state}>{message}</p>}
    </form>
  );
}
