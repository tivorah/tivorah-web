"use client";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { AccountGate } from "../../account/gate";
import { usePrivateResource } from "../../../hooks/use-private-resource";
import { canManage, mediaUrl, roleLabel, type JoinRequest, type ManagedHub } from "./shared";
import "./hubs.css";

function HubMark({ hub }: { hub: ManagedHub }) {
  const avatar = mediaUrl(hub.avatar);
  // eslint-disable-next-line @next/next/no-img-element -- Hub photos come from the API's media host.
  return avatar ? <img className="hub-mark" src={avatar} alt="" /> : <span className="hub-mark" aria-hidden="true">{hub.name.slice(0, 1).toUpperCase()}</span>;
}

function HubsContent() {
  const created = useSearchParams().get("created") === "1";
  const hubs = usePrivateResource<{ allCommunity: ManagedHub[] }>("/community/fetch/user/communities?take=100");
  // One request for every pending join request across the Hubs this person moderates.
  const requests = usePrivateResource<{ communityRequestsList: JoinRequest[] }>("/community/request-list");
  const managed = (hubs.data?.allCommunity ?? []).filter(canManage);
  const pendingByHub = new Map<number, number>();
  for (const row of requests.data?.communityRequestsList ?? []) pendingByHub.set(row.community.id, (pendingByHub.get(row.community.id) ?? 0) + 1);

  return (
    <section className="hub-admin" aria-labelledby="hubs-title">
      <header className="hub-admin-heading">
        <div>
          <p className="product-eyebrow">HUBS</p>
          <h1 id="hubs-title">Your Hubs</h1>
          <p>Hubs you own or moderate. Manage details, members, join requests and settings.</p>
        </div>
        <Link className="product-primary" href="/business/hubs/new">Create a Hub</Link>
      </header>

      {created ? <p className="hub-admin-success" role="status">Your Hub is live. It may take a moment to appear below.</p> : null}

      {hubs.loading && !hubs.data ? (
        <div className="hub-list" role="status" aria-label="Loading your Hubs">
          {[0, 1, 2].map((row) => <div className="hub-row hub-row-loading" key={row}><span className="tivorah-shimmer hub-mark" /><span className="tivorah-shimmer hub-row-line" /></div>)}
        </div>
      ) : hubs.error && !hubs.data ? (
        <div className="hub-admin-error" role="alert">
          <p>{hubs.error}</p>
          <button type="button" className="product-secondary" onClick={hubs.retry}>Try again</button>
        </div>
      ) : managed.length === 0 ? (
        <div className="hub-admin-empty">
          <h2>You don’t manage a Hub yet</h2>
          <p>Bring people together around a place, a culture or an interest. You choose the rules and who joins.</p>
          <Link className="product-primary" href="/business/hubs/new">Create your first Hub</Link>
        </div>
      ) : (
        <ul className="hub-list">
          {managed.map((hub) => {
            const pending = pendingByHub.get(hub.id) ?? 0;
            const members = Number(hub.memberCount ?? 0);
            return (
              <li key={hub.id}>
                <Link className="hub-row" href={`/business/hubs/${hub.id}`}>
                  <HubMark hub={hub} />
                  <span className="hub-row-copy">
                    <strong>{hub.name}{hub.isVerified ? <span className="hub-verified" aria-label="Verified"> ✓</span> : null}</strong>
                    <small>{members} {members === 1 ? "member" : "members"} · {hub.isPrivate ? "Private" : "Public"} · {roleLabel(hub)}</small>
                  </span>
                  {pending ? <span className="hub-row-badge">{pending} {pending === 1 ? "request" : "requests"}</span> : null}
                  <span className="hub-row-arrow" aria-hidden="true">›</span>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

export function BusinessHubs() {
  return <AccountGate>{() => <HubsContent />}</AccountGate>;
}
