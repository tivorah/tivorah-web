"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { randomId } from "../../../lib/random-id";
import { AccountGate } from "../../account/gate";
import { usePrivateResource } from "../../../hooks/use-private-resource";
import { api, ApiError } from "../../../lib/api/client";
import { LocalityField, type Locality } from "../locality-field";
import { RuleChooser } from "./rule-chooser";
import { CoverSlidesField } from "../cover-slides-field";
import { coverUploadOrder, type CoverSlide } from "../../../lib/cover-slides";
import { HUB_USERNAME_PATTERN, HUB_WELCOME_MAX, MAX_HUB_RULES, newHubErrors, newHubFormData, suggestHubUsername, type HubRule } from "./shared";
import { Sheet } from "../../ui/sheet";
import "./hubs.css";

type Interest = { id: number; name: string };

const IMAGE_TYPES = "image/jpeg,image/png,image/webp";

/** The camera button on the cover and the photo, like the shop editor's cover & logo step. */
function PhotoPick({ id, kind, label, has, onPick, describedBy, invalid }: { id: string; kind: "cover" | "logo"; label: string; has: boolean; onPick: (file: File | null) => void; describedBy?: string; invalid?: boolean }) {
  return (
    <label className={`shop-brand-pick is-${kind}`}>
      <svg aria-hidden="true" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 8.5A2.5 2.5 0 0 1 6.5 6h1.7l1.3-2h5l1.3 2h1.7A2.5 2.5 0 0 1 20 8.5v8a2.5 2.5 0 0 1-2.5 2.5h-11A2.5 2.5 0 0 1 4 16.5z" /><circle cx="12" cy="12.5" r="3.2" /></svg>
      {kind === "cover" ? <span>{has ? "Change cover" : "Add cover"}</span> : null}
      <input id={id} type="file" accept={IMAGE_TYPES} aria-label={has ? `Change ${label}` : `Add ${label}`} aria-describedby={describedBy} aria-invalid={invalid ? true : undefined}
        onChange={(event) => { const file = event.currentTarget.files?.[0]; if (file) onPick(file); event.currentTarget.value = ""; }} />
    </label>
  );
}

function CreateHubForm() {
  const router = useRouter();
  const interests = usePrivateResource<{ interests: Interest[] }>("/utility/interests");
  const catalogue = usePrivateResource<{ baseRules: HubRule[]; presets: HubRule[] }>("/community/rules/catalogue");
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [usernameEdited, setUsernameEdited] = useState(false);
  const [slogan, setSlogan] = useState("");
  const [bio, setBio] = useState("");
  const [isPrivate, setIsPrivate] = useState(false);
  const [interestIds, setInterestIds] = useState<number[]>([]);
  const [ruleKeys, setRuleKeys] = useState<string[]>([]);
  const [customRule, setCustomRule] = useState("");
  const [locality, setLocality] = useState<Locality | null>(null);
  const [country, setCountry] = useState<{ code: string; name: string }>({ code: "AU", name: "Australia" });
  const [avatar, setAvatar] = useState<File | null>(null);
  // The cover: up to four slides, photos and one short video (cover-slides-field.tsx).
  const [covers, setCovers] = useState<CoverSlide[]>([]);
  const [readingVideo, setReadingVideo] = useState(false);
  const createKey = useRef<string | undefined>(undefined);
  const creating = useRef(false);
  const [submitted, setSubmitted] = useState(false);
  const [busy, setBusy] = useState(false);
  const [failure, setFailure] = useState("");

  // The welcome post: suggested from the name and interests until the creator writes their own.
  const [welcomeEnabled, setWelcomeEnabled] = useState(true);
  const [welcomeMessage, setWelcomeMessage] = useState("");
  const [welcomeEdited, setWelcomeEdited] = useState(false);
  const [suggestedWelcome, setSuggestedWelcome] = useState("");
  const interestKey = interestIds.join(",");
  useEffect(() => {
    if (!welcomeEnabled || welcomeEdited) return;
    let live = true;
    const timer = window.setTimeout(() => {
      const query = new URLSearchParams({ name: name.trim(), interestIds: interestKey });
      api<{ message: string }>(`/community/welcome-suggestion?${query}`)
        .then((data) => { if (live && data?.message) { setSuggestedWelcome(data.message); setWelcomeMessage(data.message); } })
        .catch(() => undefined);
    }, 400);
    return () => { live = false; window.clearTimeout(timer); };
  }, [name, interestKey, welcomeEnabled, welcomeEdited]);

  const draft = { name, username, slogan, bio, isPrivate, interestIds, ruleKeys, customRule, locality, countryCode: country.code, avatar, covers: [], welcome: { enabled: welcomeEnabled, message: welcomeMessage } };
  const errors = submitted ? newHubErrors(draft) : {};

  async function submit(event: FormEvent) {
    event.preventDefault();
    setSubmitted(true);
    setFailure("");
    const problems = newHubErrors(draft);
    const first = Object.keys(problems)[0];
    if (first) {
      document.getElementById(`hub-${first}`)?.focus();
      return;
    }
    // A ref, not busy: a second click before the re-render would start a second Hub.
    if (creating.current) return;
    creating.current = true;
    setBusy(true);
    try {
      // One photo per slide (the video's first frame on its slide); the video has been uploading.
      const cover = coverUploadOrder(covers);
      const coverVideoUploadId = cover.videoUpload ? await cover.videoUpload.catch(() => { throw new Error("Your cover video didn’t upload. Remove it, or choose it again."); }) : undefined;
      createKey.current ??= randomId();
      await api("/community/create", { method: "POST", body: newHubFormData({ ...draft, idempotencyKey: createKey.current, covers: cover.photos, coverVideoUploadId, coverVideoPosition: cover.videoPosition }) });
      router.push("/business/hubs?created=1");
    } catch (cause) {
      // Keep everything they entered; only the message changes.
      // Not a server failure (e.g. a name already taken): the next try is a new create.
      if (cause instanceof ApiError && cause.status < 500) createKey.current = undefined;
      setFailure(cause instanceof ApiError || cause instanceof Error ? cause.message : "Your Hub could not be created. Please try again.");
      setBusy(false);
      creating.current = false;
    }
  }

  const checklist = [
    { id: "avatar", label: "Hub photo", section: "hub-step-look", done: !!avatar },
    { id: "name", label: "Hub name", section: "hub-step-basics", done: name.trim().length >= 3 },
    { id: "username", label: "Hub username", section: "hub-step-basics", done: HUB_USERNAME_PATTERN.test(username) },
    { id: "interests", label: "1 to 6 interests", section: "hub-step-interests", done: interestIds.length >= 1 && interestIds.length <= 6 },
  ];
  const doneCount = checklist.filter((item) => item.done).length;
  const stages = [["hub-step-look", "Photos"], ["hub-step-basics", "Basics"], ["hub-step-access", "Who can join"], ["hub-step-interests", "Interests"], ["hub-step-place", "Location"], ["hub-step-rules", "Rules"], ["hub-step-welcome", "Welcome"]] as const;
  const jump = (id: string) => {
    const section = document.getElementById(id);
    section?.scrollIntoView({ behavior: "smooth", block: "start" });
    window.setTimeout(() => section?.querySelector<HTMLElement>("input:not([type=hidden]), textarea, button")?.focus({ preventScroll: true }), 350);
  };
  const step = (n: number) => <span className="create-step-no" aria-hidden="true">{n}</span>;
  const chosen = (interests.data?.interests ?? []).filter((interest) => interestIds.includes(interest.id));
  const avatarUrl = useObjectUrl(avatar);

  return (
    <div className="shop-editor-page business-create-page create-hub">
      <header className="shop-editor-head">
        <div>
          <Link className="shop-editor-back" href="/business/hubs">← Your Hubs</Link>
          <h1 id="create-hub-title">Create a Hub</h1>
          <p>A home for people who share a place, a culture or an interest. You can change everything except the username later.</p>
        </div>
      </header>
      <nav className="create-stages" aria-label="Steps">
        <ol>{stages.map(([id, label], index) => { const items = checklist.filter((item) => item.section === id); const isDone = items.length > 0 && items.every((item) => item.done); return <li key={id} className={isDone ? "is-done" : ""}>
          <button type="button" onClick={() => jump(id)}>
            <span className="create-stage-dot" aria-hidden="true">{isDone ? "✓" : index + 1}</span>
            <span>{label}</span>
          </button>
        </li>; })}</ol>
      </nav>

      <form className="create-shell hub-form" onSubmit={submit} noValidate aria-labelledby="create-hub-title">
        <div className="create-main">
          <section id="hub-step-look" className="shop-step create-section shop-brand-step">
            <h2>{step(1)}Photos</h2>
            <CoverSlidesField id="hub-banner" purpose="hub-cover" slides={covers} onChange={setCovers} onBusy={setReadingVideo}>
            <div className="shop-brand-row">
              <div className={`shop-brand-logo hub-brand-photo${errors.avatar ? " is-invalid" : ""}`}>
                {/* eslint-disable-next-line @next/next/no-img-element -- local preview of a picked file */}
                {avatarUrl ? <img src={avatarUrl} alt="Your Hub photo" /> : <span aria-hidden="true">{name.trim().charAt(0).toUpperCase() || "+"}</span>}
                <PhotoPick id="hub-avatar" kind="logo" label="Hub photo" has={!!avatar} onPick={setAvatar} describedBy={errors.avatar ? "hub-avatar-error" : "hub-look-hint"} invalid={!!errors.avatar} />
              </div>
              <div className="shop-brand-remove">
                {avatar ? <button type="button" className="shop-link-button" onClick={() => setAvatar(null)}>Remove photo</button> : null}
              </div>
            </div>
            </CoverSlidesField>
            {errors.avatar ? <p className="hub-field-error hub-look-error" id="hub-avatar-error">{errors.avatar}</p> : null}
            <p className="shop-hint" id="hub-look-hint">A Hub photo is required. The cover is optional: up to 4 photos and a short video (30 seconds, reviewed before it shows). No cover? Your Hub gets one of Tivorah’s colours.</p>
          </section>

          <section id="hub-step-basics" className="shop-step create-section">
            <h2>{step(2)}Basics</h2>
            <div className="hub-field">
              <label htmlFor="hub-name">Hub name</label>
              <input id="hub-name" value={name} maxLength={80} aria-invalid={errors.name ? true : undefined} aria-describedby={errors.name ? "hub-name-error" : undefined}
                onChange={(event) => { const value = event.currentTarget.value; setName(value); if (!usernameEdited) setUsername(suggestHubUsername(value)); }} />
              {errors.name ? <p className="hub-field-error" id="hub-name-error">{errors.name}</p> : null}
            </div>
            <div className="hub-field">
              <label htmlFor="hub-username">Hub username</label>
              <p className="hub-field-hint" id="hub-username-hint">People can find your Hub with @{username || "username"}. This can’t be changed later.</p>
              <input id="hub-username" value={username} maxLength={40} autoCapitalize="none" spellCheck={false} aria-invalid={errors.username ? true : undefined}
                aria-describedby={`hub-username-hint${errors.username ? " hub-username-error" : ""}`}
                onChange={(event) => { setUsernameEdited(true); setUsername(event.currentTarget.value.toLowerCase().replace(/\s+/g, "-")); }} />
              {errors.username ? <p className="hub-field-error" id="hub-username-error">{errors.username}</p> : null}
            </div>
            <div className="hub-field">
              <label htmlFor="hub-slogan">Slogan <span className="hub-optional">(optional)</span></label>
              <input id="hub-slogan" value={slogan} maxLength={120} placeholder="A line that sums up your Hub" onChange={(event) => setSlogan(event.currentTarget.value)} />
            </div>
            <div className="hub-field">
              <label htmlFor="hub-bio">About this Hub <span className="hub-optional">(optional)</span></label>
              <textarea id="hub-bio" value={bio} maxLength={1000} rows={4} placeholder="Who it’s for and what members do together" onChange={(event) => setBio(event.currentTarget.value)} />
            </div>
          </section>

          <section id="hub-step-access" className="shop-step create-section">
            <h2>{step(3)}Who can join</h2>
            <fieldset className="hub-field hub-choice hub-choice-cards">
              <legend className="sr-only">Who can join</legend>
              <label className={!isPrivate ? "is-selected" : ""}><input type="radio" name="privacy" checked={!isPrivate} onChange={() => setIsPrivate(false)} /> <span><strong>Public</strong> Anyone can join straight away.</span></label>
              <label className={isPrivate ? "is-selected" : ""}><input type="radio" name="privacy" checked={isPrivate} onChange={() => setIsPrivate(true)} /> <span><strong>Private</strong> You approve each request to join.</span></label>
            </fieldset>
          </section>

          <section id="hub-step-interests" className="shop-step create-section">
            <h2>{step(4)}Interests</h2>
            <InterestPicker interests={interests.data?.interests ?? []} loading={interests.loading && !interests.data} failed={!!interests.error && !interests.data} retry={interests.retry}
              value={interestIds} onChange={setInterestIds} error={errors.interests} />
          </section>

          <section id="hub-step-place" className="shop-step create-section">
            <h2>{step(5)}Location <span className="hub-optional">(optional)</span></h2>
            <p className="hub-field-hint">Choose a place for a local Hub, or leave it empty for a Hub across {country.name}.</p>
            <LocalityField required={false} onChange={setLocality} onCountryChange={setCountry} />
          </section>

          <section id="hub-step-rules" className="shop-step create-section">
            <h2>{step(6)}Hub rules</h2>
            <p className="hub-field-hint">Every Hub follows Tivorah’s basics. Add any of these, or write your own.</p>
            {catalogue.data?.baseRules?.length ? <ul className="hub-base-rules">{catalogue.data.baseRules.map((rule) => <li key={rule.key}>{rule.text}</li>)}</ul> : null}
            <RuleChooser presets={catalogue.data?.presets ?? []} value={ruleKeys} onChange={setRuleKeys} max={MAX_HUB_RULES - (customRule.trim() ? 1 : 0)} />
            <label className="hub-custom-rule" htmlFor="hub-custom-rule">Your own rule <span className="hub-optional">(optional)</span></label>
            <input id="hub-custom-rule" value={customRule} maxLength={200} onChange={(event) => setCustomRule(event.currentTarget.value)} />
          </section>

          <section id="hub-step-welcome" className="shop-step create-section">
            <h2>{step(7)}Welcome post</h2>
            <label className="product-checkbox hub-welcome-toggle">
              <input type="checkbox" checked={welcomeEnabled} onChange={(event) => setWelcomeEnabled(event.currentTarget.checked)} />
              <span>Your Hub opens with this post from you, so the first people to join have something to reply to.</span>
            </label>
            {welcomeEnabled ? <div className="hub-field">
              <label htmlFor="hub-welcome">Welcome message</label>
              <textarea id="hub-welcome" value={welcomeMessage} maxLength={HUB_WELCOME_MAX} rows={5} aria-describedby="hub-welcome-hint"
                placeholder="Say hello and ask people to introduce themselves"
                onChange={(event) => { setWelcomeMessage(event.currentTarget.value); setWelcomeEdited(true); }} />
              <p className="hub-field-hint hub-welcome-hint" id="hub-welcome-hint">
                {welcomeEdited && suggestedWelcome
                  ? <button type="button" className="hub-welcome-reset" onClick={() => { setWelcomeMessage(suggestedWelcome); setWelcomeEdited(false); }}>Use the suggestion</button>
                  : <span>Edit it however you like.</span>}
                <span>{welcomeMessage.length}/{HUB_WELCOME_MAX}</span>
              </p>
            </div> : <p className="hub-field-hint">No welcome post. You can post one in Banter any time.</p>}
          </section>
          {failure ? <p className="hub-admin-error-text create-error-mobile" role="alert">{failure}</p> : null}
        </div>

        <aside className="create-summary" aria-label="Summary">
          <div className="create-preview hub-summary-preview">
            <div className="create-preview-media">
              {/* eslint-disable-next-line @next/next/no-img-element -- local preview of a picked file */}
              {covers[0] ? <img src={covers[0].kind === "photo" ? covers[0].preview : covers[0].framePreview} alt="" /> : <span aria-hidden="true">👥</span>}
            </div>
            <div className="create-preview-body">
              <span className="create-preview-kind">{isPrivate ? "Private Hub" : "Public Hub"}{locality ? ` · ${[locality.suburb, locality.state].filter(Boolean).join(", ")}` : ""}</span>
              <span className="hub-summary-identity">
                {/* eslint-disable-next-line @next/next/no-img-element -- local preview of a picked file */}
                <span className="hub-summary-avatar" aria-hidden="true">{avatarUrl ? <img src={avatarUrl} alt="" /> : name.trim().charAt(0).toUpperCase() || "+"}</span>
                <span><strong>{name.trim() || "Your Hub name"}</strong><small>@{username || "username"}</small></span>
              </span>
              {chosen.length ? <span className="hub-summary-interests">{chosen.map((interest) => interest.name).join(" · ")}</span> : <span>Choose interests so people find it</span>}
            </div>
          </div>
          <div className="create-progress">
            <div className="create-progress-head">
              <strong>{doneCount === checklist.length ? "Ready to create" : `${doneCount} of ${checklist.length} done`}</strong>
              <span className="create-progress-bar" aria-hidden="true"><span style={{ width: `${(doneCount / checklist.length) * 100}%` }} /></span>
            </div>
            <ul className="create-checklist">
              {checklist.map((item) => <li key={item.id} className={item.done ? "is-done" : ""}>
                <button type="button" onClick={() => jump(item.section)}>
                  <span className="create-check" aria-hidden="true">{item.done ? "✓" : ""}</span>
                  <span>{item.label}</span>
                  <span className="sr-only">{item.done ? "(done)" : "(to do)"}</span>
                </button>
              </li>)}
            </ul>
          </div>
          {failure ? <p className="hub-admin-error-text" role="alert">{failure}</p> : null}
          <button type="submit" className="product-primary press-fx create-submit hub-submit" disabled={busy || readingVideo} aria-busy={busy || undefined}>
            {busy ? <><span className="button-progress" aria-hidden="true" />Creating your Hub…</> : "Create Hub"}
          </button>
        </aside>
        {/* Below desktop: the summary's button is hidden, so this bar carries progress and Create Hub. */}
        <div className="create-mobile-bar" data-sticky-save="">
          <span className="create-mobile-progress"><strong>{doneCount}/{checklist.length}</strong> done</span>
          <button type="submit" className="product-primary press-fx" disabled={busy || readingVideo} aria-busy={busy || undefined}>{busy ? "Creating…" : "Create Hub"}</button>
        </div>
      </form>
    </div>
  );
}

/** A picked file's preview URL, released when it changes. */
function useObjectUrl(file: File | null) {
  const [url, setUrl] = useState<string | null>(null);
  useEffect(() => {
    if (!file) { setUrl(null); return; }
    const next = URL.createObjectURL(file);
    setUrl(next);
    return () => URL.revokeObjectURL(next);
  }, [file]);
  return url;
}

/**
 * Interests, like the app: the form shows your picks (tap ✕ to remove) and "Choose interests";
 * searching and picking happen in a sheet, with a counter that says when you've reached six.
 */
function InterestPicker({ interests, loading, failed, retry, value, onChange, error }: {
  interests: Interest[]; loading: boolean; failed: boolean; retry: () => void; value: number[]; onChange: (next: number[]) => void; error?: string;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const full = value.length >= 6;
  const picked = interests.filter((interest) => value.includes(interest.id));
  const search = query.trim().toLowerCase();
  const shown = interests.filter((interest) => !search || interest.name.toLowerCase().includes(search));
  const toggle = (id: number) => onChange(value.includes(id) ? value.filter((item) => item !== id) : full ? value : [...value, id]);

  return <div className="hub-field hub-interests" id="hub-interests" tabIndex={-1} role="group" aria-labelledby="hub-interests-label" aria-describedby={error ? "hub-interests-error" : "hub-interests-hint"}>
    <div className="hub-interests-head">
      <p className="hub-field-label" id="hub-interests-label">Pick what your Hub is about</p>
      <span className={`hub-interests-count${full ? " is-full" : ""}`}>{value.length} of 6</span>
    </div>
    <p className="hub-field-hint" id="hub-interests-hint">Choose 1 to 6 so the right people find your Hub.</p>
    {picked.length ? <ul className="hub-interest-picked" aria-label="Chosen interests">
      {picked.map((interest) => <li key={interest.id}><button type="button" onClick={() => toggle(interest.id)} aria-label={`Remove ${interest.name}`}>{interest.name}<span aria-hidden="true">✕</span></button></li>)}
    </ul> : null}
    <button type="button" className="product-secondary hub-interest-open" onClick={() => setOpen(true)}>{picked.length ? "Change interests" : "Choose interests"}</button>
    {error ? <p className="hub-field-error" id="hub-interests-error">{error}</p> : null}

    <Sheet open={open} onClose={() => setOpen(false)} title="Interests" description="Choose 1 to 6 so the right people find your Hub."
      footer={<button type="button" className="product-primary" onClick={() => setOpen(false)}>Done · {value.length} of 6</button>}>
      {loading ? <p role="status">Loading interests…</p>
        : failed ? <p role="alert">Interests couldn’t load. <button type="button" className="hub-link-button" onClick={retry}>Try again</button></p>
        : <div className="hub-interest-sheet">
          <input type="search" className="hub-interest-search" value={query} onChange={(event) => setQuery(event.currentTarget.value)} placeholder="Search interests, e.g. football, Igbo, cooking" aria-label="Search interests" />
          <p className="hub-field-hint" aria-live="polite">{full ? "You’ve picked six. Remove one to choose another." : `${value.length} of 6 chosen`}</p>
          <div className="hub-interest-options">
            {shown.map((interest) => { const on = value.includes(interest.id); return <button key={interest.id} type="button" className={`hub-interest-option${on ? " is-on" : ""}`} disabled={!on && full} aria-pressed={on} onClick={() => toggle(interest.id)}><span aria-hidden="true">{on ? "✓" : "+"}</span>{interest.name}</button>; })}
            {!shown.length ? <p className="hub-field-hint">No interests match “{query.trim()}”.</p> : null}
          </div>
        </div>}
    </Sheet>
  </div>;
}

export function CreateHub() {
  return <AccountGate>{() => <CreateHubForm />}</AccountGate>;
}
