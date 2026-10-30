"use client";

import { useEffect, useId, useRef, useState } from "react";
import Link from "next/link";
import { api } from "../../lib/api/client";
import { useAccount } from "../../hooks/use-account";

// "Share with your hubs" for listings and events. Web counterpart of the mobile picker in
// tivorah-mobile/components/creation/CreateListingForm.tsx: up to 3 hubs the person created or joined, sent
// as `communityIds`. New listings, services and events need at least one (`required`), since
// they reach people through Hubs. The API re-checks membership and each
// hub's listing permissions, so this is a convenience, not the authority.

type Hub = { id: number; name: string; username?: string | null; avatar?: { url?: string } | string | null; isOwner?: boolean; isPrivate?: boolean; currentUserRole?: string | null; userId?: number | string | null };
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

/** The three Hubs listed inline: chosen ones first, then Hubs the person owns, then ones they joined
 * (the API's order within each), as in the app's HubSharePicker. */
export function quickHubs<T extends { id: number }>(hubs: T[], chosen: number[], owns: (hub: T) => boolean) {
  return [...hubs]
    .sort((a, b) => Number(chosen.includes(b.id)) - Number(chosen.includes(a.id)) || Number(owns(b)) - Number(owns(a)))
    .slice(0, Math.max(MAX_HUBS, chosen.length));
}

/** `quickPick` (Create event): "Tag this event to your Hubs" with three Hubs to tap right here, a
 * counter, and "Add more Hubs" opening the full search. Other forms keep the Choose button. */
export function HubShareField({ value, onChange, disabled, kind = "listing", required = false, invalid = false, quickPick = false }: { value: number[]; onChange: (ids: number[]) => void; disabled?: boolean; kind?: "listing" | "service" | "event"; required?: boolean; invalid?: boolean; quickPick?: boolean }) {
  const { account } = useAccount();
  const noun = kind === "event" ? "events" : kind === "service" ? "services" : "listings";
  const one = kind === "event" ? "event" : kind === "service" ? "service" : "listing";
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

  const hintId = useId();
  const owns = (hub: Hub) => hub.isOwner === true || hub.currentUserRole === "creator" || (account?.id != null && hub.userId != null && Number(hub.userId) === Number(account.id));
  const openDialog = () => { setDraft(value); setQuery(""); setOpen(true); };
  const shown = quickPick ? quickHubs(hubs ?? [], value, owns) : [];
  const more = (hubs?.length ?? 0) - shown.length;
  const tap = (id: number) => onChange(value.includes(id) ? value.filter((item) => item !== id) : value.length >= MAX_HUBS ? value : [...value, id]);
  return <div className={`hub-share${required ? " is-required" : ""}${invalid ? " is-invalid" : ""}${quickPick ? " is-quick" : ""}`}>
    {quickPick ? <div className="hub-share-card hub-share-quick" role="group" aria-labelledby={`${hintId}-title`} aria-describedby={hintId}>
      <div className="hub-share-quick-head">
        <span className="hub-share-icon" aria-hidden="true">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"><circle cx="9" cy="8" r="3.2" /><path d="M3.5 19c.6-3.3 2.8-5 5.5-5s4.9 1.7 5.5 5" /><circle cx="17" cy="9" r="2.4" /><path d="M16 14.2c2.3.2 3.9 1.7 4.5 4.3" /></svg>
        </span>
        <div className="hub-share-copy">
          <strong id={`${hintId}-title`}>Tag this {one} to your Hubs</strong>
          <span id={hintId}>Tap up to {MAX_HUBS}. Members of those Hubs see your {one} there.</span>
        </div>
        <span className={`hub-share-count${value.length ? " is-active" : ""}`} aria-label={`${value.length} of ${MAX_HUBS} Hubs chosen`}>{value.length}/{MAX_HUBS}</span>
      </div>
      {shown.length ? <ul className="hub-share-quick-list">
        {shown.map((hub) => {
          const checked = value.includes(hub.id);
          const locked = !checked && value.length >= MAX_HUBS;
          return <li key={hub.id}>
            <label className={`${checked ? "is-checked" : ""}${locked ? " is-locked" : ""}`}>
              <HubBadge hub={hub} />
              <span className="hub-share-option-text"><strong>{hub.name}</strong><span>{owns(hub) ? "You own this Hub" : "Joined"}{hub.username ? ` · @${hub.username}` : ""}</span></span>
              <input type="checkbox" checked={checked} disabled={disabled || locked} onChange={() => tap(hub.id)} aria-label={`${hub.name}${owns(hub) ? ", your Hub" : ""}`} />
            </label>
          </li>;
        })}
      </ul> : null}
      {more > 0 ? <button ref={opener} type="button" className="hub-share-more" disabled={disabled} onClick={openDialog} aria-label={`Add more Hubs, ${more} more to choose from`}>
        <span aria-hidden="true">+</span><span className="hub-share-more-text">Add more Hubs</span><small>{more} more</small>
      </button> : null}
    </div> : <div className="hub-share-card" role="group" aria-labelledby={`${hintId}-title`} aria-describedby={hintId}>
      <span className="hub-share-icon" aria-hidden="true">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"><circle cx="9" cy="8" r="3.2" /><path d="M3.5 19c.6-3.3 2.8-5 5.5-5s4.9 1.7 5.5 5" /><circle cx="17" cy="9" r="2.4" /><path d="M16 14.2c2.3.2 3.9 1.7 4.5 4.3" /></svg>
      </span>
      <div className="hub-share-copy">
        <strong id={`${hintId}-title`}>{required ? "Choose your Hubs" : "Share with your hubs"}</strong>
        <span id={hintId}>{required ? `Required · choose 1 to ${MAX_HUBS}. Your ${one} appears in those Hubs, where members find it.` : `Optional · choose up to ${MAX_HUBS}. It will also appear in those hubs.`}</span>
      </div>
      <button ref={opener} type="button" className="hub-share-choose" disabled={disabled || !hubs || !hubs.length} onClick={openDialog}>
        {selected.length ? "Edit" : "Choose"}
      </button>
    </div>}
    {!hubs && !error ? <p className="hub-share-note" role="status">Loading your hubs…</p> : null}
    {error ? <p className="hub-share-note" role="alert">{error} <button type="button" onClick={() => setAttempt((n) => n + 1)}>Try again</button></p> : null}
    {hubs && !hubs.length ? <p className="hub-share-note">{privateCount ? `Your hubs are private, and ${noun} can’t be shared to private hubs. Join or create a public hub to share with its members.` : `Join or create a hub to share your ${noun} with its members.`}{required ? <> <Link href="/hubs">Find a Hub</Link> · <Link href="/business/hubs/new">Create a Hub</Link></> : null}</p> : null}
    {hubs?.length && privateCount ? <p className="hub-share-note">Private hubs aren’t shown, because {noun} can’t be shared to private hubs.</p> : null}
    {invalid && !value.length ? <p className="hub-share-error" role="alert">Choose at least one Hub to share this {one} with.</p> : null}
    {selected.length && !quickPick ? <ul className="hub-share-selected" aria-label="Selected hubs">
      {selected.map((hub) => <li key={hub.id}>
        <HubBadge hub={hub} /><span>{hub.name}</span>
        <button type="button" aria-label={`Remove ${hub.name}`} disabled={disabled} onClick={() => onChange(value.filter((id) => id !== hub.id))}>×</button>
      </li>)}
    </ul> : null}

    <dialog ref={dialog} className="hub-share-dialog" aria-labelledby={titleId} onCancel={(event) => { event.preventDefault(); close(); }} onClick={(event) => { if (event.target === event.currentTarget) close(); }}>
      <div className="hub-share-dialog-body">
        <header>
          <div>
            <h2 id={titleId}>{quickPick ? "Choose Hubs" : "Share with your hubs"}</h2>
            <p>{draft.length} of {MAX_HUBS} selected{draft.length >= MAX_HUBS ? " · remove one to choose another" : ""}</p>
            {privateCount ? <p className="hub-share-private-note">Only public hubs are listed. Private hubs can’t receive shared {noun}.</p> : null}
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
