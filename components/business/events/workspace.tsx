"use client";
import { LoadingState } from "../../ui/loading-state";
import Link from "next/link";
import { useState } from "react";
import { AccountGate } from "../../account/gate";
import { usePrivateResource } from "../../../hooks/use-private-resource";
import { useMutation } from "../../../hooks/use-mutation";
import { ManagedEvent } from "./types";
import { EventDetails } from "./details";
import { EventTicketTypes } from "./tickets";
import { EventRecords } from "./records";
import { EventGroups } from "./groups";
import { EventCheckIn } from "./check-in";
const tabs = [
  "Details",
  "Tickets",
  "Orders & attendees",
  "Groups",
  "Check-in",
] as const;
function Workspace({ id, accountId }: { id: string; accountId: number }) {
  const { data, loading, error, retry } = usePrivateResource<ManagedEvent>(
    `/events/${id}`,
  );
  const [tab, setTab] = useState<(typeof tabs)[number]>("Details");
  const mutation = useMutation(retry);
  if (loading && !data) return <LoadingState label="Loading your event…" variant="form" />;
  if (error || !data)
    return (
      <div role="alert">
        <p>{error || "Event unavailable."}</p>
        <button className="product-secondary" onClick={retry}>
          Try again
        </button>
      </div>
    );
  if (data.organizerId !== accountId)
    return <p>You can manage only your own events.</p>;
  return (
    <>
      <Link href="/business" className="product-secondary">
        ← Your business
      </Link>
      <header className="account-heading">
        <div>
          <p className="product-eyebrow">{data.status}</p>
          <h1>{data.title}</h1>
        </div>
        {data.status === "published" ? (
          <Link href={`/events/${id}`}>View public event</Link>
        ) : null}
      </header>
      <nav className="business-tabs" aria-label="Manage event">
        {tabs.map((value) => (
          <button
            className="product-secondary"
            key={value}
            aria-pressed={tab === value}
            onClick={() => setTab(value)}
          >
            {value}
          </button>
        ))}
      </nav>
      {tab === "Details" ? (
        <EventDetails
          key={`${id}:${data.startsAt}`}
          event={data}
          refresh={retry}
        />
      ) : tab === "Tickets" ? (
        <EventTicketTypes event={data} refresh={retry} />
      ) : tab === "Orders & attendees" ? (
        <EventRecords id={data.id} />
      ) : tab === "Groups" ? (
        <EventGroups event={data} />
      ) : (
        <EventCheckIn id={data.id} published={data.status === "published"} />
      )}
      <section className="account-panel">
        <h2>Publishing</h2>
        <div className="account-actions">
          {["draft", "published"].includes(data.status) ? (
            <button
              className="product-secondary"
              disabled={mutation.busy}
              onClick={() =>
                mutation.run(
                  `/events/${id}/${data.status === "draft" ? "publish" : "unpublish"}`,
                  "POST",
                  undefined,
                  "Event status updated.",
                )
              }
            >
              {mutation.busy
                ? "Updating…"
                : data.status === "draft"
                  ? "Publish event"
                  : "Unpublish event"}
            </button>
          ) : null}
          {data.status !== "deleted" && data.status !== "cancelled" ? (
            <details>
              <summary>Cancel event</summary>
              <p>
                Cancel this event and submit applicable refunds? This affects
                all ticket holders.
              </p>
              <button
                className="product-secondary"
                disabled={mutation.busy}
                onClick={() =>
                  mutation.run(
                    `/events/${id}/cancel`,
                    "POST",
                    undefined,
                    "Event cancelled and applicable refunds submitted.",
                  )
                }
              >
                Confirm event cancellation
              </button>
            </details>
          ) : null}
        </div>
        {mutation.error ? <p role="alert">{mutation.error}</p> : null}
        {mutation.notice ? <p role="status">{mutation.notice}</p> : null}
      </section>
    </>
  );
}
export function EventWorkspace({ id }: { id: string }) {
  return (
    <AccountGate>
      {(account) => <Workspace id={id} accountId={account.id} />}
    </AccountGate>
  );
}
