"use client";
import { LoadingState } from "../ui/loading-state";
import Link from "next/link";
import { ServiceSettings, defaultServiceSettings } from "./service-settings";
import { FormEvent, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { AccountGate } from "../account/gate";
import { usePrivateResource } from "../../hooks/use-private-resource";
import { api } from "../../lib/api/client";
import { creationPayload, CreationKind } from "./create-payload";
import { Locality, LocalityField } from "./locality-field";
import { MediaField } from "./media-field";
function CreationForm() {
  const [settings, setSettings] = useState(defaultServiceSettings);
  const params = useSearchParams();
  const initial = params.get("type");
  const [kind, setKind] = useState<CreationKind>(
    initial === "event" || initial === "service" ? initial : "item",
  );
  const [mode, setMode] = useState("venue");
  const [locality, setLocality] = useState<Locality | null>(null);
  const [images, setImages] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [created, setCreated] = useState(false);
  const [accepted, setAccepted] = useState(false);
  const key = useRef<string | null>(null);
  const {
    data: terms,
    loading: termsLoading,
    error: termsError,
    retry,
  } = usePrivateResource<{ version: string; agreements: { kind: string }[] }>(
    "/user/participant-agreements",
  );
  const agreementKind = kind === "event" ? "organizer" : "service_provider";
  const agreed =
    kind === "item" ||
    terms?.agreements.some((item) => item.kind === agreementKind);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy || uploading || (!agreed && !accepted)) return;
    setBusy(true);
    setError("");
    try {
      key.current ??= crypto.randomUUID();
      const payload = creationPayload(
        new FormData(event.currentTarget),
        kind,
        locality,
        images,
        key.current,
      );
      if (!agreed) {
        if (!terms)
          throw new Error("Load the participation rules before continuing.");
        await api("/user/participant-agreements", {
          method: "POST",
          body: JSON.stringify({
            kind: agreementKind,
            version: terms.version,
            accepted: true,
          }),
        });
      }
      await api(kind === "event" ? "/events" : "/market/products", {
        method: "POST",
        body: JSON.stringify({
          ...payload,
          ...(kind === "service" ? settings : {}),
        }),
      });
      setCreated(true);
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "Could not save. Please try again.",
      );
    } finally {
      setBusy(false);
    }
  }
  if (created)
    return (
      <section className="product-form">
        <h1>
          {kind === "event"
            ? "Your event draft is ready."
            : "Your listing is published."}
        </h1>
        <p>
          {kind === "event"
            ? "You can review it and publish from your business workspace."
            : "Your offering is now available to discover."}
        </p>
        <Link className="product-primary" href="/business">
          Back to your business
        </Link>
      </section>
    );
  return (
    <section className="product-form business-create">
      <p className="product-eyebrow">SHARE WHAT YOU OFFER</p>
      <h1>
        Create{" "}
        {kind === "event"
          ? "an event"
          : kind === "service"
            ? "a service"
            : "a listing"}
        .
      </h1>
      <form onSubmit={submit}>
        <label>
          What are you creating?
          <select
            value={kind}
            onChange={(e) => {
              setKind(e.target.value as CreationKind);
              setAccepted(false);
              key.current = null;
            }}
            disabled={busy || uploading}
          >
            <option value="item">Item</option>
            <option value="service">Service</option>
            <option value="event">Event</option>
          </select>
        </label>
        <label>
          Title
          <input name="title" required minLength={3} maxLength={160} />
        </label>
        <label>
          Business or display name (optional)
          <input name="businessName" maxLength={100} />
        </label>
        <label>
          Description
          <textarea
            name="description"
            required
            minLength={10}
            maxLength={10000}
            rows={5}
          />
        </label>
        <label>
          Category
          <input name="category" required minLength={2} maxLength={100} />
        </label>
        {kind === "item" ? (
          <label>
            Condition
            <select name="condition">
              <option value="new">New</option>
              <option value="like_new">Like new</option>
              <option value="used_good">Used — good</option>
              <option value="used_fair">Used — fair</option>
            </select>
          </label>
        ) : (
          <label>
            Location type
            <select
              name="mode"
              value={mode}
              onChange={(e) => setMode(e.target.value)}
            >
              <option value="venue">In person</option>
              <option value="online">Online</option>
            </select>
          </label>
        )}
        <LocalityField
          required={kind === "item" || mode !== "online"}
          onChange={setLocality}
        />
        <MediaField context={kind} onChange={setImages} onBusy={setUploading} />
        {kind === "event" ? (
          <>
            <label>
              Venue name
              <input name="venueName" maxLength={160} />
            </label>
            <label>
              Venue address
              <input name="address" maxLength={300} />
            </label>
            <label>
              Online joining URL (online events only)
              <input name="onlineUrl" type="url" />
            </label>
            <label>
              Starts at (your local time)
              <input name="startsAt" type="datetime-local" required />
            </label>
            <label>
              Ends at (your local time)
              <input name="endsAt" type="datetime-local" required />
            </label>
            <label>
              Ticket name
              <input
                name="ticketName"
                defaultValue="General admission"
                required
                maxLength={100}
              />
            </label>
            <label>
              Number of tickets
              <input
                name="quantity"
                type="number"
                min={1}
                max={1000000}
                defaultValue={20}
                required
              />
            </label>
          </>
        ) : null}
        <label>
          {kind === "event" ? "Ticket price (AUD, 0 for free)" : "Price (AUD)"}
          <input
            name="price"
            type="number"
            min={0}
            max={1000000}
            step="0.01"
            required
            defaultValue={0}
          />
        </label>
        {kind === "service" ? (
          <>
            <label>
              Pricing
              <select name="priceType">
                <option value="fixed">Fixed price</option>
                <option value="from">Starting from</option>
                <option value="hourly">Per hour</option>
                <option value="quote">Quote required</option>
              </select>
            </label>
            <p>Customers can discuss custom quotes in the app.</p>
          </>
        ) : null}
        {kind === "service" ? (
          <ServiceSettings value={settings} onChange={setSettings} />
        ) : null}
        {kind !== "item" && !agreed ? (
          <>
            {termsLoading ? (
              <LoadingState label="Loading participation rules…" variant="compact" />
            ) : termsError ? (
              <>
                <p role="alert">{termsError}</p>
                <button type="button" onClick={retry}>
                  Retry rules
                </button>
              </>
            ) : (
              <label className="product-checkbox">
                <input
                  type="checkbox"
                  checked={accepted}
                  onChange={(e) => setAccepted(e.target.checked)}
                  required
                />
                <span>
                  I accept the{" "}
                  <Link
                    href={
                      kind === "event"
                        ? "/hub-organisers"
                        : "/service-providers"
                    }
                    target="_blank"
                  >
                    {kind === "event" ? "organiser" : "service provider"} rules
                  </Link>
                  .
                </span>
              </label>
            )}
          </>
        ) : null}
        {kind === "event" ? (
          <p>
            Paid tickets require completed{" "}
            <Link href="/business/payouts">payout setup</Link>.
          </p>
        ) : null}
        {error ? (
          <p className="product-error" role="alert">
            {error}
          </p>
        ) : null}
        <button
          className="product-primary"
          disabled={busy || uploading || (!agreed && (!accepted || !terms))}
        >
          {busy
            ? "Saving…"
            : uploading
              ? "Photos are uploading…"
              : kind === "event"
                ? "Create draft"
                : "Publish listing"}
        </button>
      </form>
    </section>
  );
}
export function BusinessCreate() {
  return <AccountGate>{() => <CreationForm />}</AccountGate>;
}
