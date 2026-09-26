"use client";

import { FormEvent, useState } from "react";

export function UnsubscribeForm({ defaultEmail = "" }: { defaultEmail?: string }) {
  const [state, setState] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setState("loading");
    setMessage("");
    const form = event.currentTarget;
    const data = new FormData(form);
    const email = String(data.get("email") ?? "").trim().toLowerCase();
    const website = String(data.get("tv_hp_check") ?? "");
    const apiUrl = process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "");

    try {
      if (!apiUrl) throw new Error("Unsubscribe unavailable");
      const response = await fetch(`${apiUrl}/api/v1/public/waitlist/unsubscribe`, {
        method: "POST",
        signal: AbortSignal.timeout(15000),
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email, website }),
      });
      if (!response.ok) throw new Error("Unsubscribe failed");
      setState("success");
      setMessage("Your unsubscribe request has been recorded.");
      form.reset();
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
      aria-busy={state === "loading"}
      onSubmit={submit}
    >
      <input type="hidden" name="form-name" value="tivorah-unsubscribe" />
      <label className="honey" aria-hidden="true">
        Leave this field empty <input name="tv_hp_check" tabIndex={-1} autoComplete="off" />
      </label>
      <label htmlFor="unsubscribe-email">
        Email address
        <input id="unsubscribe-email" name="email" type="email" autoComplete="email" required defaultValue={defaultEmail} />
      </label>
      <button disabled={state === "loading"}>
        {state === "loading" ? "Submitting…" : "Unsubscribe"}
      </button>
      {message && <p role="status" className={state}>{message}</p>}
    </form>
  );
}
