"use client";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState, type FormEvent } from "react";
import { AccountGate } from "../../account/gate";
import { usePrivateResource } from "../../../hooks/use-private-resource";
import { api, ApiError } from "../../../lib/api/client";
import { RuleChooser } from "./rule-chooser";
import { canManage, MAX_HUB_RULES, mediaUrl, personName, roleLabel, SETTING_COPY, type HubMember, type HubRule, type HubSettings, type JoinRequest, type ManagedHub } from "./shared";
import "./hubs.css";

type Tab = "details" | "members" | "requests" | "settings";
const message = (cause: unknown, fallback: string) => (cause instanceof ApiError ? cause.message : fallback);

/** Status line under an action: "Saved", or what went wrong. Polite, so it never interrupts. */
function Feedback({ text, error }: { text: string; error?: boolean }) {
  if (!text) return null;
  return <p className={error ? "hub-feedback hub-feedback-error" : "hub-feedback"} role={error ? "alert" : "status"}>{text}</p>;
}

function DetailsTab({ hub, isOwner, onSaved }: { hub: ManagedHub; isOwner: boolean; onSaved: () => void }) {
  const router = useRouter();
  const catalogue = usePrivateResource<{ presets: HubRule[] }>("/community/rules/catalogue");
  const [name, setName] = useState(hub.name);
  const [slogan, setSlogan] = useState(hub.slogan ?? "");
  const [bio, setBio] = useState(hub.description ?? "");
  const [isPrivate, setIsPrivate] = useState(hub.isPrivate);
  const presetKeys = new Set((catalogue.data?.presets ?? []).map((rule) => rule.key));
  const [ruleKeys, setRuleKeys] = useState<string[]>((hub.guidelines ?? []).filter((rule) => rule.key !== "custom").map((rule) => rule.key));
  const [customRules, setCustomRules] = useState((hub.guidelines ?? []).filter((rule) => rule.key === "custom").map((rule) => rule.text).join("\n"));
  const [busy, setBusy] = useState(false);
  const [feedback, setFeedback] = useState({ text: "", error: false });
  const [imageBusy, setImageBusy] = useState<"" | "avatar" | "banner">("");
  const [imageFeedback, setImageFeedback] = useState({ text: "", error: false });
  const [confirmName, setConfirmName] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  async function save(event: FormEvent) {
    event.preventDefault();
    if (name.trim().length < 3) { setFeedback({ text: "Give your Hub a name of at least 3 characters.", error: true }); return; }
    setBusy(true);
    setFeedback({ text: "", error: false });
    const guidelines: HubRule[] = [
      ...ruleKeys.filter((key) => presetKeys.has(key) || key.startsWith("base:")).map((key) => ({ key, text: "" })),
      ...customRules.split("\n").map((text) => text.trim()).filter(Boolean).map((text) => ({ key: "custom", text })),
    ];
    try {
      await api("/community/update", { method: "POST", body: JSON.stringify({ id: String(hub.id), name: name.trim(), slogan: slogan.trim(), bio: bio.trim(), isPrivate, guidelines }) });
      setFeedback({ text: "Changes saved.", error: false });
      onSaved();
    } catch (cause) {
      setFeedback({ text: message(cause, "Your changes couldn’t be saved. Please try again."), error: true });
    } finally {
      setBusy(false);
    }
  }

  async function upload(kind: "avatar" | "banner", file: File | undefined) {
    if (!file) return;
    setImageBusy(kind);
    setImageFeedback({ text: "", error: false });
    const form = new FormData();
    form.set(kind, file);
    try {
      await api(`/community/upload/${kind}/${hub.id}`, { method: "POST", body: form });
      setImageFeedback({ text: kind === "avatar" ? "Hub photo updated." : "Cover image updated.", error: false });
      onSaved();
    } catch (cause) {
      setImageFeedback({ text: message(cause, "That image couldn’t be uploaded. Please try again."), error: true });
    } finally {
      setImageBusy("");
    }
  }

  async function remove() {
    setDeleting(true);
    setDeleteError("");
    try {
      await api("/community/delete", { method: "POST", body: JSON.stringify({ id: String(hub.id) }) });
      router.push("/business/hubs");
    } catch (cause) {
      setDeleteError(message(cause, "This Hub couldn’t be deleted. Please try again."));
      setDeleting(false);
    }
  }

  if (!isOwner) {
    return (
      <div className="hub-panel">
        <h2>Details</h2>
        <p className="hub-field-hint">Only the Hub owner can change these. As a moderator you can manage members and join requests.</p>
        <dl className="hub-facts">
          <div><dt>Name</dt><dd>{hub.name}</dd></div>
          <div><dt>Slogan</dt><dd>{hub.slogan || "—"}</dd></div>
          <div><dt>About</dt><dd>{hub.description || "—"}</dd></div>
          <div><dt>Joining</dt><dd>{hub.isPrivate ? "Private — requests need approval" : "Public — anyone can join"}</dd></div>
        </dl>
      </div>
    );
  }

  const avatar = mediaUrl(hub.avatar);
  const banner = mediaUrl(hub.banner);
  return (
    <>
      <form className="hub-panel hub-form" onSubmit={save} noValidate>
        <h2>Details</h2>
        <div className="hub-field"><label htmlFor="edit-name">Hub name</label><input id="edit-name" value={name} maxLength={80} onChange={(event) => setName(event.currentTarget.value)} /></div>
        <div className="hub-field"><label htmlFor="edit-slogan">Slogan</label><input id="edit-slogan" value={slogan} maxLength={120} onChange={(event) => setSlogan(event.currentTarget.value)} /></div>
        <div className="hub-field"><label htmlFor="edit-bio">About this Hub</label><textarea id="edit-bio" rows={4} maxLength={1000} value={bio} onChange={(event) => setBio(event.currentTarget.value)} /></div>
        <fieldset className="hub-field hub-choice">
          <legend>Who can join</legend>
          <label><input type="radio" name="edit-privacy" checked={!isPrivate} onChange={() => setIsPrivate(false)} /> <span><strong>Public</strong> Anyone can join straight away.</span></label>
          <label><input type="radio" name="edit-privacy" checked={isPrivate} onChange={() => setIsPrivate(true)} /> <span><strong>Private</strong> You approve each request to join.</span></label>
        </fieldset>
        <fieldset className="hub-field">
          <legend>Hub rules</legend>
          <RuleChooser presets={catalogue.data?.presets ?? []} value={ruleKeys} onChange={setRuleKeys} max={Math.max(ruleKeys.length, MAX_HUB_RULES - customRules.split("\n").filter((line) => line.trim()).length)} />
          <label className="hub-custom-rule" htmlFor="edit-custom-rules">Your own rules, one per line</label>
          <textarea id="edit-custom-rules" rows={3} value={customRules} onChange={(event) => setCustomRules(event.currentTarget.value)} />
        </fieldset>
        <Feedback {...feedback} />
        <button type="submit" className="product-primary hub-submit" disabled={busy} aria-busy={busy || undefined}>{busy ? "Saving…" : "Save changes"}</button>
      </form>

      <section className="hub-panel" aria-labelledby="hub-images-title">
        <h2 id="hub-images-title">Images</h2>
        <div className="hub-images">
          <div className="hub-field">
            <label htmlFor="edit-avatar">Hub photo</label>
            {/* eslint-disable-next-line @next/next/no-img-element -- Hub media is served by the API host */}
            {avatar ? <img className="hub-image-preview" src={avatar} alt="Current Hub photo" /> : <span className="hub-image-preview" aria-hidden="true" />}
            <input id="edit-avatar" type="file" accept="image/jpeg,image/png,image/webp" disabled={!!imageBusy} onChange={(event) => void upload("avatar", event.currentTarget.files?.[0])} />
          </div>
          <div className="hub-field">
            <label htmlFor="edit-banner">Cover image</label>
            {/* eslint-disable-next-line @next/next/no-img-element -- Hub media is served by the API host */}
            {banner ? <img className="hub-image-preview hub-image-wide" src={banner} alt="Current cover image" /> : <span className="hub-image-preview hub-image-wide" aria-hidden="true" />}
            <input id="edit-banner" type="file" accept="image/jpeg,image/png,image/webp" disabled={!!imageBusy} onChange={(event) => void upload("banner", event.currentTarget.files?.[0])} />
          </div>
        </div>
        {imageBusy ? <p className="hub-feedback" role="status">Uploading…</p> : <Feedback {...imageFeedback} />}
      </section>

      <section className="hub-panel hub-danger" aria-labelledby="hub-delete-title">
        <h2 id="hub-delete-title">Delete this Hub</h2>
        <p>This removes the Hub, its conversations and memberships for everyone. It can’t be undone.</p>
        <label htmlFor="confirm-delete">Type <strong>{hub.name}</strong> to confirm</label>
        <input id="confirm-delete" value={confirmName} onChange={(event) => setConfirmName(event.currentTarget.value)} autoComplete="off" />
        <Feedback text={deleteError} error />
        <button type="button" className="hub-danger-button" disabled={confirmName.trim() !== hub.name || deleting} aria-busy={deleting || undefined} onClick={() => void remove()}>
          {deleting ? "Deleting…" : "Delete Hub"}
        </button>
      </section>
    </>
  );
}

function MembersTab({ hub, isOwner, viewerId }: { hub: ManagedHub; isOwner: boolean; viewerId: number }) {
  const [members, setMembers] = useState<HubMember[]>([]);
  const [next, setNext] = useState<number | null>(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [busyId, setBusyId] = useState<number | null>(null);
  const [feedback, setFeedback] = useState({ text: "", error: false });

  const load = useCallback(async (skip: number, replace: boolean) => {
    setLoading(true);
    setError("");
    try {
      const data = await api<{ communityMembers: HubMember[]; pagination: { nextSkip: number; isMoreData: boolean } }>(`/community/fetch/members/${hub.id}?skip=${skip}&take=50`);
      setMembers((current) => (replace ? data.communityMembers : [...current, ...data.communityMembers]));
      setNext(data.pagination.isMoreData ? data.pagination.nextSkip : null);
    } catch (cause) {
      setError(message(cause, "Members couldn’t load."));
    } finally {
      setLoading(false);
    }
  }, [hub.id]);
  useEffect(() => { void load(0, true); }, [load]);

  async function act(member: HubMember, path: string, body: Record<string, unknown>, done: string, confirmText?: string) {
    if (confirmText && !window.confirm(confirmText)) return;
    setBusyId(member.id);
    setFeedback({ text: "", error: false });
    try {
      await api(path, { method: "POST", body: JSON.stringify({ communityId: hub.id, memberId: member.id, ...body }) });
      setFeedback({ text: done, error: false });
      await load(0, true);
    } catch (cause) {
      setFeedback({ text: message(cause, "That change couldn’t be saved. Please try again."), error: true });
    } finally {
      setBusyId(null);
    }
  }

  const visible = members.filter((member) => !query.trim() || `${personName(member)} ${member.username}`.toLowerCase().includes(query.trim().toLowerCase()));
  return (
    <section className="hub-panel" aria-labelledby="members-title">
      <div className="hub-panel-heading">
        <h2 id="members-title">Members</h2>
        <span className="hub-count">{hub.memberCount ?? members.length} total</span>
      </div>
      <label className="hub-search" htmlFor="member-search">Search loaded members</label>
      <input id="member-search" type="search" value={query} onChange={(event) => setQuery(event.currentTarget.value)} placeholder="Name or @username" />
      <Feedback {...feedback} />
      {error && !members.length ? <div role="alert" className="hub-admin-error"><p>{error}</p><button type="button" className="product-secondary" onClick={() => void load(0, true)}>Try again</button></div> : null}
      {loading && !members.length ? <p role="status">Loading members…</p> : null}
      <ul className="hub-people">
        {visible.map((member) => {
          const isSelf = member.id === viewerId;
          const isModerator = member.role === "admin";
          // Moderators can't act on the owner, on themselves, or on other moderators.
          const canModerate = !member.isCreator && !isSelf && (isOwner || !isModerator);
          const busy = busyId === member.id;
          return (
            <li key={member.id} className="hub-person">
              <div className="hub-person-copy">
                <strong>{personName(member)}{isSelf ? " (you)" : ""}</strong>
                <small>@{member.username}{member.city ? ` · ${member.city}` : ""}</small>
                <span className="hub-badges">
                  <span className={`hub-role hub-role-${member.role}`}>{member.isCreator ? "Owner" : isModerator ? "Moderator" : "Member"}</span>
                  {member.restriction ? <span className="hub-restriction">{member.restriction.kind === "suspended" ? "Suspended" : "Muted"} until {new Date(member.restriction.until).getFullYear() >= 2999 ? "further notice" : new Date(member.restriction.until).toLocaleString("en-AU", { dateStyle: "medium", timeStyle: "short" })}</span> : null}
                </span>
              </div>
              {canModerate ? (
                <div className="hub-person-actions" aria-busy={busy || undefined}>
                  {isOwner ? (
                    <button type="button" disabled={busy} onClick={() => void act(member, "/community/member-role", { role: isModerator ? "member" : "admin" }, isModerator ? `${personName(member)} is now a member.` : `${personName(member)} is now a moderator.`)}>
                      {isModerator ? "Remove moderator" : "Make moderator"}
                    </button>
                  ) : null}
                  {member.restriction ? (
                    <button type="button" disabled={busy} onClick={() => void act(member, "/community/moderate-member", { action: "lift" }, "Restriction lifted.")}>Lift restriction</button>
                  ) : (
                    <>
                      <button type="button" disabled={busy} onClick={() => void act(member, "/community/moderate-member", { action: "mute", durationMinutes: 24 * 60 }, `${personName(member)} is muted for 24 hours.`)}>Mute 24 hours</button>
                      <button type="button" disabled={busy} onClick={() => void act(member, "/community/moderate-member", { action: "suspend", durationMinutes: 7 * 24 * 60 }, `${personName(member)} is suspended for 7 days.`, `Suspend ${personName(member)} for 7 days? They won't be able to see or post in the Hub.`)}>Suspend 7 days</button>
                    </>
                  )}
                  <button type="button" className="hub-danger-link" disabled={busy} onClick={() => void act(member, "/community/remove-member", {}, `${personName(member)} was removed.`, `Remove ${personName(member)} from ${hub.name}? They can ask to join again.`)}>Remove</button>
                </div>
              ) : null}
            </li>
          );
        })}
      </ul>
      {!loading && !error && !visible.length ? <p className="hub-empty">{query ? "No loaded members match that search." : "No members yet."}</p> : null}
      {next !== null ? <button type="button" className="product-secondary hub-more" disabled={loading} onClick={() => void load(next, false)}>{loading ? "Loading…" : "Load more members"}</button> : null}
    </section>
  );
}

function RequestsTab({ hub, onChanged }: { hub: ManagedHub; onChanged: () => void }) {
  const requests = usePrivateResource<{ communityRequestsList: JoinRequest[] }>(`/community/request-list?communityId=${hub.id}`);
  const [busyId, setBusyId] = useState<number | null>(null);
  const [feedback, setFeedback] = useState({ text: "", error: false });
  const rows = requests.data?.communityRequestsList ?? [];

  async function answer(row: JoinRequest, accept: boolean) {
    setBusyId(row.user.id);
    setFeedback({ text: "", error: false });
    try {
      await api(accept ? "/community/accept-request" : "/community/decline-request", { method: "POST", body: JSON.stringify({ communityId: hub.id, requestUserId: row.user.id }) });
      setFeedback({ text: accept ? `${personName({ ...row.user.profile, username: row.user.username })} joined ${hub.name}.` : "Request declined.", error: false });
      onChanged();
    } catch (cause) {
      setFeedback({ text: message(cause, "That request couldn’t be answered. Please try again."), error: true });
    } finally {
      setBusyId(null);
    }
  }

  return (
    <section className="hub-panel" aria-labelledby="requests-title">
      <div className="hub-panel-heading"><h2 id="requests-title">Join requests</h2>{rows.length ? <span className="hub-count">{rows.length} waiting</span> : null}</div>
      {!hub.isPrivate ? <p className="hub-field-hint">This Hub is public, so people join straight away. Requests only appear for private Hubs.</p> : null}
      <Feedback {...feedback} />
      {requests.loading && !requests.data ? <p role="status">Loading requests…</p>
        : requests.error && !requests.data ? <div role="alert" className="hub-admin-error"><p>{requests.error}</p><button type="button" className="product-secondary" onClick={requests.retry}>Try again</button></div>
        : !rows.length ? <p className="hub-empty">No one is waiting to join.</p>
        : <ul className="hub-people">{rows.map((row) => {
          const person = { ...row.user.profile, username: row.user.username };
          const busy = busyId === row.user.id;
          return (
            <li key={row.request.id} className="hub-person">
              <div className="hub-person-copy">
                <strong>{personName(person)}</strong>
                <small>@{row.user.username}{row.user.profile.city ? ` · ${row.user.profile.city}` : ""} · asked {new Date(row.request.createdAt).toLocaleDateString("en-AU", { day: "numeric", month: "short" })}</small>
                {row.user.profile.bio ? <p className="hub-person-bio">{row.user.profile.bio}</p> : null}
              </div>
              <div className="hub-person-actions" aria-busy={busy || undefined}>
                <button type="button" className="hub-approve" disabled={busy} onClick={() => void answer(row, true)}>Approve</button>
                <button type="button" disabled={busy} onClick={() => void answer(row, false)}>Decline</button>
              </div>
            </li>
          );
        })}</ul>}
    </section>
  );
}

function SettingsTab({ hub }: { hub: ManagedHub }) {
  const loaded = usePrivateResource<{ settings: HubSettings; canEdit: boolean }>(`/community/${hub.id}/settings`);
  const [draft, setDraft] = useState<HubSettings | null>(null);
  const [busy, setBusy] = useState(false);
  const [feedback, setFeedback] = useState({ text: "", error: false });
  const settings = draft ?? loaded.data?.settings ?? null;
  const canEdit = loaded.data?.canEdit === true;

  async function save(event: FormEvent) {
    event.preventDefault();
    if (!settings) return;
    setBusy(true);
    setFeedback({ text: "", error: false });
    try {
      await api("/community/settings", { method: "POST", body: JSON.stringify({ communityId: hub.id, settings }) });
      setFeedback({ text: "Settings saved.", error: false });
      setDraft(null);
    } catch (cause) {
      setFeedback({ text: message(cause, "Settings couldn’t be saved. Please try again."), error: true });
    } finally {
      setBusy(false);
    }
  }

  if (loaded.loading && !loaded.data) return <section className="hub-panel"><h2>Settings</h2><p role="status">Loading settings…</p></section>;
  if (!settings) return <section className="hub-panel"><h2>Settings</h2><div role="alert" className="hub-admin-error"><p>{loaded.error || "Settings couldn’t load."}</p><button type="button" className="product-secondary" onClick={loaded.retry}>Try again</button></div></section>;
  const update = (patch: Partial<HubSettings>) => setDraft({ ...settings, ...patch });
  return (
    <form className="hub-panel hub-form" onSubmit={save}>
      <h2>Settings</h2>
      {!canEdit ? <p className="hub-field-hint">Only the Hub owner can change these.</p> : null}
      <div className="hub-settings">
        {SETTING_COPY.map((setting) => (
          <div className="hub-field" key={setting.key}>
            <label htmlFor={`setting-${setting.key}`}>{setting.label}</label>
            <select id={`setting-${setting.key}`} value={String(settings[setting.key])} disabled={!canEdit} onChange={(event) => update({ [setting.key]: event.currentTarget.value } as Partial<HubSettings>)}>
              {setting.options.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
            </select>
          </div>
        ))}
      </div>
      <label className="hub-toggle"><input type="checkbox" disabled={!canEdit} checked={settings.membersCanSeeMemberList} onChange={(event) => update({ membersCanSeeMemberList: event.currentTarget.checked })} /> Members can see who else is in the Hub</label>
      <label className="hub-toggle"><input type="checkbox" disabled={!canEdit} checked={settings.membersCanInvite} onChange={(event) => update({ membersCanInvite: event.currentTarget.checked })} /> Members can invite people</label>
      <Feedback {...feedback} />
      {canEdit ? <button type="submit" className="product-primary hub-submit" disabled={busy || !draft} aria-busy={busy || undefined}>{busy ? "Saving…" : "Save settings"}</button> : null}
    </form>
  );
}

function ManageHubContent({ id, viewerId }: { id: number; viewerId: number }) {
  const hubs = usePrivateResource<{ allCommunity: ManagedHub[] }>("/community/fetch/user/communities?take=100");
  const requests = usePrivateResource<{ communityRequestsList: JoinRequest[] }>(`/community/request-list?communityId=${id}`);
  // ?tab=members / ?tab=requests opens that tab (links from Your Hubs).
  const linkedTab = useSearchParams().get("tab");
  const [tab, setTab] = useState<Tab>(linkedTab === "members" || linkedTab === "requests" || linkedTab === "settings" ? linkedTab : "details");
  const hub = hubs.data?.allCommunity.find((item) => item.id === id) ?? null;

  if (hubs.loading && !hubs.data) return <section className="hub-admin"><p role="status">Loading your Hub…</p></section>;
  if (hubs.error && !hubs.data) return <section className="hub-admin"><div role="alert" className="hub-admin-error"><p>{hubs.error}</p><button type="button" className="product-secondary" onClick={hubs.retry}>Try again</button></div></section>;
  if (!hub || !canManage(hub)) {
    return (
      <section className="hub-admin hub-admin-empty">
        <h1>You can’t manage this Hub</h1>
        <p>Only its owner and moderators can manage a Hub.</p>
        <Link className="product-secondary" href="/business/hubs">Back to your Hubs</Link>
      </section>
    );
  }
  const isOwner = roleLabel(hub) === "Owner";
  const pending = requests.data?.communityRequestsList.length ?? 0;
  const tabs: { id: Tab; label: string }[] = [
    { id: "details", label: "Details" },
    { id: "members", label: "Members" },
    { id: "requests", label: pending ? `Join requests (${pending})` : "Join requests" },
    { id: "settings", label: "Settings" },
  ];
  return (
    <section className="hub-admin" aria-labelledby="manage-hub-title">
      <Link className="hub-back" href="/business/hubs">← Your Hubs</Link>
      <header className="hub-admin-heading">
        <div>
          <p className="product-eyebrow">{roleLabel(hub).toUpperCase()}</p>
          <h1 id="manage-hub-title">{hub.name}</h1>
          <p>{Number(hub.memberCount ?? 0)} members · {hub.isPrivate ? "Private" : "Public"}{hub.isVerified ? " · Verified" : ""}</p>
        </div>
        <Link className="product-secondary" href={`/hubs/${hub.id}`}>View public page ↗</Link>
      </header>
      <div className="hub-tabs" role="group" aria-label="Manage Hub">
        {tabs.map((item) => <button type="button" key={item.id} aria-pressed={tab === item.id} onClick={() => setTab(item.id)}>{item.label}</button>)}
      </div>
      {tab === "details" ? <DetailsTab key={`${hub.id}-${hub.name}`} hub={hub} isOwner={isOwner} onSaved={hubs.retry} /> : null}
      {tab === "members" ? <MembersTab hub={hub} isOwner={isOwner} viewerId={viewerId} /> : null}
      {tab === "requests" ? <RequestsTab hub={hub} onChanged={() => { requests.retry(); hubs.retry(); }} /> : null}
      {tab === "settings" ? <SettingsTab hub={hub} /> : null}
    </section>
  );
}

export function ManageHub({ id }: { id: number }) {
  return <AccountGate>{(account) => <ManageHubContent id={id} viewerId={account.id} />}</AccountGate>;
}
