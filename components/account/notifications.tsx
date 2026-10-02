"use client";
import { LoadingState } from "../ui/loading-state";
import { AccountSurfaceLoading } from "./surface-loading";
import Link from "next/link";
import { useState } from "react";
import { AccountGate } from "./gate";
import { usePrivateResource } from "../../hooks/use-private-resource";
import { useMutation } from "../../hooks/use-mutation";
import { PAGE_SIZE, Pagination } from "../ui/pagination";
function Notices() {
  const [page, setPage] = useState(1);
  const skip = (page - 1) * PAGE_SIZE;
  const { data, loading, error, retry } = usePrivateResource<{
    items: {
      id: number;
      title: string;
      body: string;
      category: string;
      read: boolean;
      createdAt: string;
    }[];
    nextSkip: number | null;
  }>(`/web/account/notifications?skip=${skip}&take=${PAGE_SIZE}`);
  const mutation = useMutation(retry);
  if (loading && !data) return <AccountSurfaceLoading embedded />;
  return (
    <>
      <Link href="/account" className="product-secondary">
        ← Your account
      </Link>
      <h1>Booking & business updates</h1>
      {loading ? <LoadingState label="Loading updates…" refreshing={!!data} /> : null}
      {error ? (
        <p role="alert">
          {error} <button onClick={retry}>Try again</button>
        </p>
      ) : null}
      <div className="account-grid">
        {data?.items.map((item) => (
          <article className="account-panel" key={item.id}>
            <p className="product-eyebrow">
              {item.read ? "READ" : "UNREAD"} ·{" "}
              {new Date(item.createdAt).toLocaleDateString("en-AU")}
            </p>
            <h2>{item.title}</h2>
            <p>{item.body}</p>
            <div className="account-actions">
              <Link
                href={
                  item.category === "events"
                    ? "/account/tickets"
                    : item.category === "marketplace"
                      ? "/account/bookings"
                      : "/contact"
                }
              >
                {item.category === "events"
                  ? "View tickets"
                  : item.category === "marketplace"
                    ? "View appointments"
                    : "Get support"}
              </Link>
              {!item.read ? (
                <button
                  className="product-secondary"
                  disabled={mutation.busy}
                  onClick={() =>
                    mutation.run(`/web/account/notifications/${item.id}/read`)
                  }
                >
                  Mark read
                </button>
              ) : null}
            </div>
          </article>
        ))}
      </div>
      {!loading && !error && !data?.items.length ? (
        <p>No updates yet.</p>
      ) : null}
      {mutation.error ? <p role="alert">{mutation.error}</p> : null}
      <Pagination page={page} hasNext={data?.nextSkip != null} busy={loading} label="Update" onChange={(next) => { setPage(next); window.scrollTo({ top: 0, behavior: "smooth" }); }} />
    </>
  );
}
export function AccountNotifications() {
  return <AccountGate>{() => <Notices />}</AccountGate>;
}
