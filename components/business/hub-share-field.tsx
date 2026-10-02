"use client";

import { useEffect, useId, useRef, useState } from "react";
import { api } from "../../lib/api/client";

// "Share with your hubs" for listings and events. Web counterpart of the mobile picker in
// tivorah-mobile/app/market/create-listing.tsx: optional, up to 3 hubs the person
// created or joined, sent as `communityIds`. The API re-checks membership and each
// hub's listing permissions, so this is a convenience, not the authority.

type Hub = { id: number; name: string; username?: string | null; avatar?: { url?: string } | string | null; isOwner?: boolean; isPrivate?: boolean };
export const MAX_HUBS = 3;

const avatarUrl = (hub: Hub) => {
  const value = typeof hub.avatar === "string" ? hub.avatar : hub.avatar?.url;
  return value && value.startsWith("https://") ? value : null;
};

function HubBadge({ hub }: { hub: Hub }) {
  const [broken, setBroken] = useState(false);
  const url = broken ? null : avatarUrl(hub);
  return <span className="hub-share-badge" aria-hidden="true">
    {/* Hub avatars come from user uploads on varied hosts, so next/image is not used. */}
    {/* eslint-disable-next-line @next/next/no-img-element */}
    {url ? <img src={url} alt="" onError={() => setBroken(true)} /> : (hub.name || "H").trim().charAt(0).toUpperCase()}
  </span>;
}

export function HubShareField({ value, onChange, disabled, kind = "listing" }: { value: number[]; onChange: (ids: number[]) => void; disabled?: boolean; kind?: "listing" | "event" }) {
  const [hubs, setHubs] = useState<Hub[] | null>(null);
  const [privateCount, setPrivateCount] = useState(0);
  const [error, setError] = useState("");
  const [attempt, setAttempt] = useState(0);
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<number[]>(value);
  const [query, setQuery] = useState("");
  const dialog = useRef<HTMLDialogElement>(null);
  const opener = useRef<HTMLButtonElement>(null);
  const titleId = useId();

  useEffect(() => {
    const controller = new AbortController();
    setError("");
    api<{ allCommunity: Hub[] }>("/community/fetch/user/communities?skip=0&take=100", { signal: controller.signal })
      .then((data) => {
        const all = (data?.allCommunity ?? []).filter((hub) => Number.isFinite(Number(hub?.id))).map((hub) => ({ ...hub, id: Number(hub.id) }));
        // Private hubs are closed communities, so nothing can be shared into them.
        setPrivateCount(all.filter((hub) => hub.isPrivate).length);
        setHubs(all.filter((hub) => !hub.isPrivate));
      })
      .catch(() => { if (!controller.signal.aborted) setError("Your hubs couldn’t load."); });
    return () => controller.abort();
  }, [attempt]);

  useEffect(() => {
    const element = dialog.current;
    if (!element) return;
    if (open && !element.open) element.showModal();
    if (!open && element.open) element.close();
  }, [open]);

  const selected = (hubs ?? []).filter((hub) => value.includes(hub.id));
  const visible = (hubs ?? []).filter((hub) => `${hub.name} ${hub.username ?? ""}`.toLowerCase().includes(query.trim().toLowerCase()));
  const close = () => { setOpen(false); opener.current?.focus(); };
  const toggle = (id: number) => setDraft((current) => current.includes(id) ? current.filter((item) => item !== id) : current.length >= MAX_HUBS ? current : [...current, id]);

  return <div className="hub-share">
    <div className="hub-share-card">
      <span className="hub-share-icon" aria-hidden="true">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"><circle cx="9" cy="8" r="3.2" /><path d="M3.5 19c.6-3.3 2.8-5 5.5-5s4.9 1.7 5.5 5" /><circle cx="17" cy="9" r="2.4" /><path d="M16 14.2c2.3.2 3.9 1.7 4.5 4.3" /></svg>
      </span>
      <div className="hub-share-copy">
        <strong>Share with your hubs</strong>
        <span>Optional · choose up to {MAX_HUBS}. It will also appear in those hubs.</span>
      </div>
      <button ref={opener} type="button" className="hub-share-choose" disabled={disabled || !hubs || !hubs.length} onClick={() => { setDraft(value); setQuery(""); setOpen(true); }}>
        {selected.length ? "Edit" : "Choose"}
      </button>
    </div>
    {!hubs && !error ? <p className="hub-share-note" role="status">Loading your hubs…</p> : null}
    {error ? <p className="hub-share-note" role="alert">{error} <button type="button" onClick={() => setAttempt((n) => n + 1)}>Try again</button></p> : null}
    {hubs && !hubs.length ? <p className="hub-share-note">{privateCount ? `Your hubs are private, and ${kind === "event" ? "events" : "listings"} can’t be shared to private hubs. Join or create a public hub to share with its members.` : `Join or create a hub to share your ${kind === "event" ? "events" : "listings"} with its members.`}</p> : null}
    {hubs?.length && privateCount ? <p className="hub-share-note">Private hubs aren’t shown, because {kind === "event" ? "events" : "listings"} can’t be shared to private hubs.</p> : null}
    {selected.length ? <ul className="hub-share-selected" aria-label="Selected hubs">
      {selected.map((hub) => <li key={hub.id}>
        <HubBadge hub={hub} /><span>{hub.name}</span>
        <button type="button" aria-label={`Remove ${hub.name}`} disabled={disabled} onClick={() => onChange(value.filter((id) => id !== hub.id))}>×</button>
      </li>)}
    </ul> : null}

    <dialog ref={dialog} className="hub-share-dialog" aria-labelledby={titleId} onCancel={(event) => { event.preventDefault(); close(); }} onClick={(event) => { if (event.target === event.currentTarget) close(); }}>
      <div className="hub-share-dialog-body">
        <header>
          <div>
            <h2 id={titleId}>Share with your hubs</h2>
            <p>{draft.length} of {MAX_HUBS} selected{draft.length >= MAX_HUBS ? " · remove one to choose another" : ""}</p>
            {privateCount ? <p className="hub-share-private-note">Only public hubs are listed. Private hubs can’t receive shared {kind === "event" ? "events" : "listings"}.</p> : null}
          </div>
          <button type="button" aria-label="Close" onClick={close}>×</button>
        </header>
        {(hubs?.length ?? 0) > 6 ? <div className="hub-share-search-wrap"><input className="hub-share-search" type="search" aria-label="Search your hubs" placeholder="Search your hubs" value={query} onChange={(event) => setQuery(event.target.value)} /></div> : null}
        <ul className="hub-share-options">
          {visible.map((hub) => {
            const checked = draft.includes(hub.id);
            const locked = !checked && draft.length >= MAX_HUBS;
            return <li key={hub.id}>
              <label className={`${checked ? "is-checked" : ""}${locked ? " is-locked" : ""}`}>
                <input type="checkbox" checked={checked} disabled={locked} onChange={() => toggle(hub.id)} />
                <HubBadge hub={hub} />
                <span className="hub-share-option-text"><strong>{hub.name}</strong>{hub.username ? <span>@{hub.username}{hub.isOwner ? " · Your hub" : ""}</span> : null}</span>
              </label>
            </li>;
          })}
          {!visible.length ? <li className="hub-share-empty">No hubs match “{query}”.</li> : null}
        </ul>
        <footer>
          <button type="button" className="product-secondary" onClick={close}>Cancel</button>
          <button type="button" className="product-primary" onClick={() => { onChange(draft); close(); }}>Save hubs</button>
        </footer>
      </div>
    </dialog>
  </div>;
}
