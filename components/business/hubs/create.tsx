"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";
import { AccountGate } from "../../account/gate";
import { usePrivateResource } from "../../../hooks/use-private-resource";
import { api, ApiError } from "../../../lib/api/client";
import { LocalityField, type Locality } from "../locality-field";
import { newHubErrors, newHubFormData, suggestHubUsername, type HubRule } from "./shared";
import "./hubs.css";

type Interest = { id: number; name: string };

function ImagePicker({ label, hint, file, onChange, error, id }: { label: string; hint: string; file: File | null; onChange: (file: File | null) => void; error?: string; id: string }) {
  const [preview, setPreview] = useState<string | null>(null);
  useEffect(() => {
    if (!file) { setPreview(null); return; }
    const url = URL.createObjectURL(file);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);
  return (
    <div className="hub-field">
      <label htmlFor={id}>{label}</label>
      <p className="hub-field-hint" id={`${id}-hint`}>{hint}</p>
      <div className="hub-image-picker">
        {/* eslint-disable-next-line @next/next/no-img-element -- local preview of a picked file */}
        {preview ? <img src={preview} alt="" className="hub-image-preview" /> : <span className="hub-image-preview" aria-hidden="true" />}
        <input id={id} type="file" accept="image/jpeg,image/png,image/webp" aria-describedby={`${id}-hint${error ? ` ${id}-error` : ""}`} aria-invalid={error ? true : undefined}
          onChange={(event) => onChange(event.currentTarget.files?.[0] ?? null)} />
      </div>
      {error ? <p className="hub-field-error" id={`${id}-error`}>{error}</p> : null}
    </div>
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
  const [banner, setBanner] = useState<File | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [busy, setBusy] = useState(false);
  const [failure, setFailure] = useState("");

  const draft = { name, username, slogan, bio, isPrivate, interestIds, ruleKeys, customRule, locality, countryCode: country.code, avatar, banner };
  const errors = submitted ? newHubErrors(draft) : {};

  const toggle = (list: number[] | string[], value: number | string) =>
    (list as (number | string)[]).includes(value) ? (list as (number | string)[]).filter((item) => item !== value) : [...list, value];

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
    setBusy(true);
    try {
      await api("/community/create", { method: "POST", body: newHubFormData(draft) });
      router.push("/business/hubs?created=1");
    } catch (cause) {
      // Keep everything they entered; only the message changes.
      setFailure(cause instanceof ApiError ? cause.message : "Your Hub could not be created. Please try again.");
      setBusy(false);
    }
  }

  return (
    <section className="hub-admin" aria-labelledby="create-hub-title">
      <header className="hub-admin-heading">
        <div>
          <p className="product-eyebrow">HUBS</p>
          <h1 id="create-hub-title">Create a Hub</h1>
          <p>A home for people who share a place, a culture or an interest. You can change everything except the username later.</p>
        </div>
        <Link className="product-secondary" href="/business/hubs">Cancel</Link>
      </header>

      <form className="hub-form" onSubmit={submit} noValidate>
        <ImagePicker id="hub-avatar" label="Hub photo" hint="Square works best. JPG, PNG or WebP." file={avatar} onChange={setAvatar} error={errors.avatar} />

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
          <input id="hub-slogan" value={slogan} maxLength={120} onChange={(event) => setSlogan(event.currentTarget.value)} />
        </div>

        <div className="hub-field">
          <label htmlFor="hub-bio">About this Hub <span className="hub-optional">(optional)</span></label>
          <textarea id="hub-bio" value={bio} maxLength={1000} rows={4} onChange={(event) => setBio(event.currentTarget.value)} />
        </div>

        <fieldset className="hub-field hub-choice">
          <legend>Who can join</legend>
          <label><input type="radio" name="privacy" checked={!isPrivate} onChange={() => setIsPrivate(false)} /> <span><strong>Public</strong> Anyone can join straight away.</span></label>
          <label><input type="radio" name="privacy" checked={isPrivate} onChange={() => setIsPrivate(true)} /> <span><strong>Private</strong> You approve each request to join.</span></label>
        </fieldset>

        <fieldset className="hub-field" id="hub-interests" tabIndex={-1} aria-describedby={errors.interests ? "hub-interests-error" : "hub-interests-hint"}>
          <legend>Interests</legend>
          <p className="hub-field-hint" id="hub-interests-hint">Choose 1 to 6 so the right people find your Hub. {interestIds.length ? `${interestIds.length} chosen.` : ""}</p>
          {interests.loading && !interests.data ? <p role="status">Loading interests…</p>
            : interests.error && !interests.data ? <p role="alert">Interests couldn’t load. <button type="button" className="hub-link-button" onClick={interests.retry}>Try again</button></p>
            : <div className="hub-chips">{(interests.data?.interests ?? []).map((interest) => (
              <label key={interest.id} className="hub-chip">
                <input type="checkbox" checked={interestIds.includes(interest.id)} disabled={!interestIds.includes(interest.id) && interestIds.length >= 6}
                  onChange={() => setInterestIds(toggle(interestIds, interest.id) as number[])} />
                <span>{interest.name}</span>
              </label>
            ))}</div>}
          {errors.interests ? <p className="hub-field-error" id="hub-interests-error">{errors.interests}</p> : null}
        </fieldset>

        <div className="hub-field">
          <p className="hub-field-label">Location <span className="hub-optional">(optional)</span></p>
          <p className="hub-field-hint">Choose a place for a local Hub, or leave it empty for a Hub across {country.name}.</p>
          <LocalityField required={false} onChange={setLocality} onCountryChange={setCountry} />
        </div>

        <fieldset className="hub-field">
          <legend>Hub rules</legend>
          <p className="hub-field-hint">Every Hub follows Tivorah’s basics. Add any of these, or write your own.</p>
          {catalogue.data?.baseRules?.length ? <ul className="hub-base-rules">{catalogue.data.baseRules.map((rule) => <li key={rule.key}>{rule.text}</li>)}</ul> : null}
          <div className="hub-rule-options">{(catalogue.data?.presets ?? []).map((rule) => (
            <label key={rule.key}><input type="checkbox" checked={ruleKeys.includes(rule.key)} onChange={() => setRuleKeys(toggle(ruleKeys, rule.key) as string[])} /> <span>{rule.text}</span></label>
          ))}</div>
          <label className="hub-custom-rule" htmlFor="hub-custom-rule">Your own rule <span className="hub-optional">(optional)</span></label>
          <input id="hub-custom-rule" value={customRule} maxLength={200} onChange={(event) => setCustomRule(event.currentTarget.value)} />
        </fieldset>

        <ImagePicker id="hub-banner" label="Cover image (optional)" hint="Shown at the top of your Hub. Wide images work best." file={banner} onChange={setBanner} />

        {failure ? <p className="hub-admin-error-text" role="alert">{failure}</p> : null}
        <button type="submit" className="product-primary hub-submit" disabled={busy} aria-busy={busy || undefined}>
          {busy ? <><span className="button-progress" aria-hidden="true" />Creating your Hub…</> : "Create Hub"}
        </button>
      </form>
    </section>
  );
}

export function CreateHub() {
  return <AccountGate>{() => <CreateHubForm />}</AccountGate>;
}
