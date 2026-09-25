"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";

type SubmitState = "idle" | "loading" | "success" | "error";

export function ContactForm() {
  const [state, setState] = useState<SubmitState>("idle");
  const [message, setMessage] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setState("loading");
    setMessage("");

    const form = event.currentTarget;
    const data = new FormData(form);
    const apiUrl = process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "");
    const body = {
      name: String(data.get("name") ?? "").trim(),
      email: String(data.get("email") ?? "").trim(),
      topic: String(data.get("topic") ?? ""),
      subject: String(data.get("subject") ?? "").trim(),
      message: String(data.get("message") ?? "").trim(),
      website: String(data.get("website") ?? ""),
    };

    try {
      if (!apiUrl) throw new Error("Contact unavailable");
      const response = await fetch(`${apiUrl}/api/v1/public/contact`, {
        method: "POST",
        signal: AbortSignal.timeout(15000),
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!response.ok) {
        if (response.status === 422) {
          const result = await response.json();
          const fields = Object.keys(result.fields ?? {}).filter(field => field !== "website");
          setState("error");
          setMessage(`Please check ${fields.join(", ") || "your details"} and try again.`);
          return;
        }
        if (response.status === 429) {
          setState("error");
          setMessage("Too many attempts. Please wait before trying again or email support@tivorah.com.");
          return;
        }
        throw new Error("Contact unavailable");
      }
      setState("success");
      setMessage("Thanks — your message has been sent to Tivorah.");
      form.reset();
    } catch {
      setState("error");
      setMessage("We could not send your message. Please try again or email support@tivorah.com.");
    }
  }

  return (
    <form
      className="contact-form"
      name="tivorah-contact"
      method="POST"
      onSubmit={submit}
      aria-busy={state === "loading"}
    >
      <input type="hidden" name="form-name" value="tivorah-contact" />
      <input type="hidden" name="source" value="website-contact" />
      <input name="website" tabIndex={-1} autoComplete="off" className="honey" aria-hidden="true" />

      <div className="contact-form-row">
        <label htmlFor="contact-name">Your name<input id="contact-name" name="name" autoComplete="name" required minLength={2} maxLength={120} /></label>
        <label htmlFor="contact-email">Email address<input id="contact-email" name="email" type="email" autoComplete="email" required /></label>
      </div>

      <label htmlFor="contact-topic">What can we help with?
        <select id="contact-topic" name="topic" defaultValue="" required>
          <option value="" disabled>Select a topic</option>
          <option value="general">General enquiry</option>
          <option value="support">Account or app support</option>
          <option value="events">Events and ticketing</option>
          <option value="providers">Service provider or partnership</option>
          <option value="privacy">Privacy request</option>
          <option value="safety">Safety report</option>
          <option value="complaint">Complaint</option>
        </select>
      </label>

      <label htmlFor="contact-subject">Subject<input id="contact-subject" name="subject" required minLength={3} maxLength={140} /></label>
      <label htmlFor="contact-message">Message<textarea id="contact-message" name="message" rows={7} required minLength={10} maxLength={5000} placeholder="Tell us what happened and what you need help with." /></label>

      <p className="contact-form-privacy">Do not include passwords, verification codes or full payment-card details. See our <Link href="/privacy">Privacy Policy</Link>.</p>
      <button type="submit" disabled={state === "loading"}>{state === "loading" ? "Sending…" : "Send message"}</button>
      {message ? <p className={state} role="status">{message}</p> : null}
    </form>
  );
}
