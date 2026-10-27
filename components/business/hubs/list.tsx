"use client";
import Link from "next/link";
import { useMemo, useRef, useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { AccountGate } from "../../account/gate";
import { DetailPane, useCompactLayout } from "../../account/detail-pane";
import { useFeature } from "../../discovery/features";
import { usePrivateResource } from "../../../hooks/use-private-resource";
import { SelectField } from "../../ui/select-field";
import { BusinessOverview } from "../overview";
import { canManage, mediaUrl, roleLabel, type JoinRequest, type ManagedHub } from "./shared";
import "./hubs.css";

// "Your Hubs" in the business workspace, laid out like Your events and Your listings: the business
// overview on top, then the Hubs (search, filters) with the chosen Hub's numbers beside them.
type HubSummaryData = { members: number; newMembers: number; pendingRequests: number; posts: number; upcomingEvents: number };

function HubMark({ hub }: { hub: ManagedHub }) {
  const avatar = mediaUrl(hub.avatar);
  // eslint-disable-next-line @next/next/no-img-element -- Hub photos come from the API's media host.
  return avatar ? <img className="business-list-mark hub-list-mark" src={avatar} alt="" /> : <span className="business-list-mark" aria-hidden="true">{hub.name.slice(0, 1).toUpperCase()}</span>;
}

function HubSummary({ id }: { id: number }) {
  const on = useFeature();
  const { data, loading, error, retry } = usePrivateResource<HubSummaryData>(`/community/${id}/business-summary`);
  const cells = on("events") ? 5 : 4;
  if (loading && !data) return <div className="business-event-summary-loading" role="status" aria-label="Loading Hub activity">{Array.from({ length: cells }, (_, index) => <span className="tivorah-shimmer" key={index} />)}</div>;
  if (error && !data) return <div className="business-event-summary-error" role="alert"><span>Hub activity is unavailable.</span><button type="button" onClick={retry}>Retry</button></div>;
  if (!data) return null;
  return <div className="business-event-summary hub-summary" aria-label="Hub activity">
    <div><strong>{data.members}</strong><span>Members</span></div>
    <div><strong>{data.newMembers}</strong><span>Joined in the last 30 days</span></div>
    <div><strong>{data.pendingRequests}</strong><span>Join requests waiting</span></div>
    <div><strong>{data.posts}</strong><span>Posts in the last 30 days</span></div>
    {on("events") ? <div><strong>{data.upcomingEvents}</strong><span>Upcoming events</span></div> : null}
  </div>;
}

function HubsContent() {
  const created = useSearchParams().get("created") === "1";
  const hubs = usePrivateResource<{ allCommunity: ManagedHub[] }>("/community/fetch/user/communities?take=100");
  // One request for every pending join request across the Hubs this person moderates.
  const requests = usePrivateResource<{ communityRequestsList: JoinRequest[] }>("/community/request-list");
  const [searchText, setSearchText] = useState("");
  const [role, setRole] = useState("");
  const [visibility, setVisibility] = useState("");
  const [sort, setSort] = useState("newest");
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const compact = useCompactLayout();
  const [sheetOpen, setSheetOpen] = useState(false);
  const filterRef = useRef<HTMLDetailsElement>(null);
  useEffect(() => {
    const outside = (event: PointerEvent) => { if (filterRef.current?.open && !filterRef.current.contains(event.target as Node)) filterRef.current.open = false; };
    const escape = (event: KeyboardEvent) => { if (event.key === "Escape" && filterRef.current?.open) { filterRef.current.open = false; filterRef.current.querySelector("summary")?.focus(); } };
    document.addEventListener("pointerdown", outside);
    document.addEventListener("keydown", escape);
    return () => { document.removeEventListener("pointerdown", outside); document.removeEventListener("keydown", escape); };
  }, []);

  const managed = useMemo(() => (hubs.data?.allCommunity ?? []).filter(canManage), [hubs.data]);
  const pendingByHub = new Map<number, number>();
  for (const row of requests.data?.communityRequestsList ?? []) pendingByHub.set(row.community.id, (pendingByHub.get(row.community.id) ?? 0) + 1);
  const members = (hub: ManagedHub) => Number(hub.memberCount ?? 0);
  const query = searchText.trim().toLowerCase();
  const filtered = managed
    .filter((hub) => !query || hub.name.toLowerCase().includes(query) || (hub.username ?? "").toLowerCase().includes(query))
    .filter((hub) => !role || (role === "owner" ? roleLabel(hub) === "Owner" : roleLabel(hub) !== "Owner"))
    .filter((hub) => !visibility || (visibility === "private") === hub.isPrivate)
    .sort((a, b) => sort === "name" ? a.name.localeCompare(b.name) : sort === "members" ? members(b) - members(a) : sort === "oldest" ? a.id - b.id : b.id - a.id);
  const selected = filtered.find((hub) => hub.id === selectedId) ?? filtered[0];
  const filtering = Boolean(query || role || visibility);
  const choose = (id: number) => { setSelectedId(id); if (compact) setSheetOpen(true); };

  return (
    <section className="business-section" aria-labelledby="hubs-title">
      <div className="business-section-heading">
        <div><p className="product-eyebrow">HUBS</p><h2 id="hubs-title">Your Hubs</h2></div>
        {managed.length ? <Link className="product-secondary" href="/business/hubs/new">Create a Hub</Link> : null}
      </div>
      {created ? <p className="hub-admin-success" role="status">Your Hub is live. It may take a moment to appear below.</p> : null}

      {managed.length ? <div className="business-list-controls">
        <div className="business-list-search" role="search">
          <label className="sr-only" htmlFor="business-hubs-search">Search Hubs</label>
          <input id="business-hubs-search" type="search" value={searchText} onChange={(event) => setSearchText(event.target.value)} placeholder="Search your Hubs" />
          <span className="business-list-search-icon" aria-hidden="true"><svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="11" cy="11" r="7" /><path d="m16 16 5 5" /></svg></span>
        </div>
        <details ref={filterRef} className="business-list-filter-menu">
          <summary>Filters{role || visibility || sort !== "newest" ? <><span className="business-filter-active" aria-hidden="true" /><span className="sr-only"> (active)</span></> : null}</summary>
          <div className="business-list-filter-panel">
            <label>Your role<SelectField label="Your role" value={role} onChange={setRole} options={[{ value: "", label: "Owner or moderator" }, { value: "owner", label: "Owner" }, { value: "moderator", label: "Moderator" }]} /></label>
            <label>Visibility<SelectField label="Visibility" value={visibility} onChange={setVisibility} options={[{ value: "", label: "Public and private" }, { value: "public", label: "Public" }, { value: "private", label: "Private" }]} /></label>
            <label>Sort by<SelectField label="Sort by" value={sort} onChange={setSort} options={[{ value: "newest", label: "Newest first" }, { value: "oldest", label: "Oldest first" }, { value: "name", label: "Name A–Z" }, { value: "members", label: "Most members" }]} /></label>
          </div>
        </details>
        {hubs.loading && hubs.data ? <span className="business-list-refresh" role="status">Updating…</span> : null}
      </div> : null}

      {hubs.loading && !hubs.data ? (
        <div className="business-board business-list-loading" role="status" aria-busy="true" aria-label="Loading your Hubs"><div className="business-list" aria-hidden="true">{[0, 1, 2].map((row) => <div className="business-list-row" key={row}><span className="business-loading-avatar tivorah-shimmer" /><span className="business-loading-lines"><span className="tivorah-shimmer" /><span className="tivorah-shimmer" /></span><span className="business-loading-status tivorah-shimmer" /></div>)}</div></div>
      ) : hubs.error && !hubs.data ? (
        <div className="product-notice" role="alert">
          <p>{hubs.error}</p>
          <button type="button" className="product-secondary" onClick={hubs.retry}>Try again</button>
        </div>
      ) : managed.length === 0 ? (
        <div className="product-empty hub-admin-empty">
          <h2>You don’t manage a Hub yet</h2>
          <p>Bring people together around a place, a culture or an interest. You choose the rules and who joins.</p>
          <Link className="product-primary" href="/business/hubs/new">Create your first Hub</Link>
        </div>
      ) : !filtered.length ? (
        <div className="product-empty"><p>No Hubs match {filtering ? "these filters" : "your search"}. Change a filter or search again.</p></div>
      ) : (
        <div className="business-board">
          <div className="business-list" role="list" aria-label="Your Hubs">
            {filtered.map((hub) => {
              const pending = pendingByHub.get(hub.id) ?? 0;
              return <div role="listitem" key={hub.id}><button type="button" className="business-list-row" aria-pressed={selected?.id === hub.id && (!compact || sheetOpen)} onClick={() => choose(hub.id)}>
                <HubMark hub={hub} />
                <span className="business-list-copy"><strong>{hub.name}{hub.isVerified ? <span className="hub-verified" aria-label="Verified"> ✓</span> : null}</strong><small>{members(hub)} {members(hub) === 1 ? "member" : "members"} · {hub.isPrivate ? "Private" : "Public"}</small></span>
                {pending ? <span className="hub-row-badge">{pending} {pending === 1 ? "request" : "requests"}</span> : <span className="business-list-status">{roleLabel(hub)}</span>}
              </button></div>;
            })}
          </div>
          {selected ? <DetailPane compact={compact} open={sheetOpen} onClose={() => setSheetOpen(false)} label="Hub details" className="business-preview-wrap"><p className="business-preview-label">HUB DETAILS</p><aside tabIndex={-1} className="business-preview" aria-label={`${selected.name} details`}>
            <div className="business-preview-head"><span>TIVORAH HUB</span><span>{selected.isPrivate ? "Private" : "Public"}</span></div>
            <div className="business-preview-body"><h3>{selected.name}</h3><p>{selected.slogan || selected.description || "Members, join requests and activity at a glance."}</p></div>
            <HubSummary key={selected.id} id={selected.id} />
            <div className="business-preview-actions">
              <Link className="product-primary press-fx" href={`/business/hubs/${selected.id}`}>Manage Hub</Link>
              <nav className="preview-action-list" aria-label="More for this Hub">
                <Link href={`/business/hubs/${selected.id}?tab=requests`}><span>{pendingByHub.get(selected.id) ? `Join requests (${pendingByHub.get(selected.id)})` : "Join requests"}</span><span aria-hidden="true">→</span></Link>
                <Link href={`/business/hubs/${selected.id}?tab=members`}><span>Members</span><span aria-hidden="true">→</span></Link>
                <Link href={`/hubs/${selected.id}`}><span>View Hub page</span><span aria-hidden="true">↗</span></Link>
              </nav>
            </div>
          </aside></DetailPane> : null}
        </div>
      )}
    </section>
  );
}

export function BusinessHubs() {
  return <AccountGate>{(account) => <>
    <BusinessOverview firstName={account.firstName || account.username} />
    <HubsContent />
  </>}</AccountGate>;
}
