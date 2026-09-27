"use client";
import { LoadingState } from "../ui/loading-state";
import Link from "next/link";
import { useState } from "react";
import { AccountGate } from "../account/gate";
import { usePrivateResource } from "../../hooks/use-private-resource";
import { api } from "../../lib/api/client";
type Entry = {
  id: number;
  title: string;
  status: string;
  listingType?: string;
};
function BusinessList({ kind }: { kind: "events" | "products" }) {
  const [skip, setSkip] = useState(0);
  const path =
    kind === "events"
      ? `/events/mine?take=20&skip=${skip}`
      : `/market/products/mine?take=20&skip=${skip}`;
  const { data, loading, error, retry } = usePrivateResource<{
    events?: Entry[];
    products?: Entry[];
    pagination: { isMoreData: boolean };
  }>(path);
  const [pending, setPending] = useState<number | null>(null);
  const [notice, setNotice] = useState("");
  async function update(item: Entry, action: string) {
    setPending(item.id);
    setNotice("");
    try {
      await api(
        kind === "events"
          ? `/events/${item.id}/${action}`
          : `/market/products/${item.id}/status`,
        {
          method: kind === "events" ? "POST" : "PATCH",
          ...(kind === "products"
            ? { body: JSON.stringify({ status: action }) }
            : {}),
        },
      );
      retry();
    } catch (cause) {
      setNotice(cause instanceof Error ? cause.message : "Could not save.");
    } finally {
      setPending(null);
    }
  }
  const items = kind === "events" ? data?.events : data?.products;
  return (
    <section>
      <div className="account-heading">
        <h2>{kind === "events" ? "Your events" : "Your items & services"}</h2>
        <Link
          className="product-primary"
          href={`/business/create?type=${kind === "events" ? "event" : "item"}`}
        >
          Create {kind === "events" ? "event" : "listing"}
        </Link>
      </div>
      {loading ? <LoadingState label="Loading your business…" variant="cards" refreshing={!!data} /> : null}
      {error ? (
        <div className="product-notice" role="alert">
          <p>{error}</p>
          <button onClick={retry} className="product-secondary">
            Try again
          </button>
        </div>
      ) : null}
      {notice ? <p role="alert">{notice}</p> : null}
      <div className="account-grid">
        {items?.map((item) => (
          <article className="account-panel" key={item.id}>
            <p className="product-eyebrow">{item.status}</p>
            <h3>{item.title}</h3>
            <div className="account-actions">
              {kind === "events" ? (
                <>
                  <Link
                    className="product-secondary"
                    href={`/business/events/${item.id}`}
                  >
                    Manage event
                  </Link>
                  {item.status === "published" ? (
                    <Link href={`/events/${item.id}`}>Public page</Link>
                  ) : null}
                  {["draft", "published"].includes(item.status) ? (
                    <button
                      className="product-secondary"
                      disabled={pending !== null}
                      onClick={() =>
                        update(
                          item,
                          item.status === "draft" ? "publish" : "unpublish",
                        )
                      }
                    >
                      {pending === item.id
                        ? "Updating…"
                        : item.status === "draft"
                          ? "Publish"
                          : "Unpublish"}
                    </button>
                  ) : null}
                </>
              ) : (
                <>
                  <Link
                    className="product-secondary"
                    href={`/business/listings/${item.id}`}
                  >
                    Edit listing
                  </Link>
                  <Link
                    href={
                      item.listingType === "service"
                        ? `/services/${item.id}`
                        : `/shop/items/${item.id}`
                    }
                  >
                    Public page
                  </Link>
                  {["active", "reserved", "sold"].map((status) => (
                    <button
                      key={status}
                      className="product-secondary"
                      disabled={pending !== null || item.status === status}
                      onClick={() => update(item, status)}
                    >
                      {status === "active"
                        ? "Available"
                        : status === "reserved"
                          ? "Reserved"
                          : "Sold"}
                    </button>
                  ))}
                </>
              )}
            </div>
          </article>
        ))}
      </div>
      {!loading && !error && !items?.length ? (
        <p className="product-empty">You haven’t added anything here yet.</p>
      ) : null}
      <div className="account-actions">
        {skip > 0 ? (
          <button
            className="product-secondary"
            disabled={loading}
            onClick={() => setSkip(Math.max(0, skip - 20))}
          >
            Previous
          </button>
        ) : null}
        {data?.pagination.isMoreData ? (
          <button
            className="product-secondary"
            disabled={loading}
            onClick={() => setSkip(skip + 20)}
          >
            Next
          </button>
        ) : null}
      </div>
    </section>
  );
}
export function BusinessDashboard() {
  return (
    <AccountGate>
      {() => (
        <>
          <header className="account-heading">
            <div>
              <p className="product-eyebrow">MADE BY YOU</p>
              <h1>Your business on Tivorah.</h1>
            </div>
            <Link className="product-secondary" href="/business/payouts">
              Payout settings
            </Link>
          </header>
          <div className="account-actions">
            <Link className="product-secondary" href="/business/showcase">Manage seller showcase</Link>
            <Link href="/account/bookings">Customer appointments</Link>
            <Link href="/business/create?type=service">Create a service</Link>
          </div>
          <BusinessList kind="products" />
          <BusinessList kind="events" />
        </>
      )}
    </AccountGate>
  );
}
