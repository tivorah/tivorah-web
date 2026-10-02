"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { api } from "../../lib/api/client";

// Web counterpart of the mobile UsernameField (tivorah-mobile/components/auth/UsernameField.tsx):
// a username generated live from the person's name (name + 4-digit code), Shuffle, and a
// quiet availability check against the API's Bloom-filtered endpoint. Keep the two in step.

// Mirrors the API rule: 3–30 characters, letters/numbers with single dots or underscores between them.
const validFormat = (value: string) => value.length >= 3 && value.length <= 30 && /^[a-z0-9](?:[a-z0-9]|[._](?=[a-z0-9]))*$/.test(value);
const namePart = (value: string) => value.toLowerCase().normalize("NFKD").replace(/[^a-z0-9]/g, "").slice(0, 14);
const makeCode = () => String(1000 + (Date.now() % 9000));
const generate = (firstName: string, lastName: string, code: string) => {
  const base = `${namePart(firstName)}${namePart(lastName)}`;
  return base.length >= 2 ? `${base}${code}`.slice(0, 30) : "";
};

type Mode = "auto" | "custom";
type Status = "idle" | "checking" | "available" | "taken" | "invalid" | "offline";
type Check = { username: string; status: Exclude<Status, "idle" | "checking"> } | null;
type Availability = { username: string; valid?: boolean; available: boolean; suggestions: string[] };

export function UsernameField({ firstName, lastName, disabled }: { firstName: string; lastName: string; disabled?: boolean }) {
  const [mode, setMode] = useState<Mode>("auto");
  const [custom, setCustom] = useState("");
  const [code, setCode] = useState(makeCode);
  const [check, setCheck] = useState<Check>(null);
  const [verified, setVerified] = useState<ReadonlySet<string>>(() => new Set());
  const [spinKey, setSpinKey] = useState(0);
  const input = useRef<HTMLInputElement>(null);
  const markVerified = useCallback((name: string) => setVerified((previous) => new Set([...previous, name])), []);

  const generated = generate(firstName, lastName, code);
  const username = mode === "auto" ? generated : custom;
  const clean = username.trim();
  const status: Status = !clean ? "idle"
    : !validFormat(clean) ? "invalid"
    : verified.has(clean) ? "available"
    : check?.username === clean ? check.status
    : "checking";

  // Block form submission (with a clear message) while the name is invalid or taken.
  useEffect(() => {
    input.current?.setCustomValidity(
      status === "taken" ? "That username is already taken. Try another or Shuffle."
        : status === "invalid" ? "Use 3–30 letters or numbers, with single dots or underscores between them."
        : "",
    );
  }, [status]);

  const needsServer = status === "checking";
  useEffect(() => {
    if (!needsServer) return;
    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      try {
        const query = new URLSearchParams({ username: clean, firstName, lastName });
        const result = await api<Availability>(`/public/auth/username-availability?${query}`, { signal: controller.signal });
        if (result.available) markVerified(clean);
        // A generated name that happens to be taken silently gets a new code.
        if (!result.available && mode === "auto" && result.valid !== false) { setCode(makeCode()); return; }
        setCheck({ username: clean, status: result.valid === false ? "invalid" : result.available ? "available" : "taken" });
      } catch {
        if (!controller.signal.aborted) setCheck({ username: clean, status: "offline" });
      }
    }, mode === "auto" ? 250 : 420);
    return () => { controller.abort(); window.clearTimeout(timer); };
  }, [needsServer, clean, mode, firstName, lastName, markVerified]);

  const shuffle = () => {
    setCode((previous) => { let next = makeCode(); while (next === previous) next = String(1000 + ((Number(next) - 999) % 9000)); return next; });
    setMode("auto");
    setSpinKey((value) => value + 1);
  };

  const message = status === "checking" ? { tone: "muted", text: mode === "auto" ? "Making your username…" : "Checking…" }
    : status === "available" ? { tone: mode === "auto" ? "accent" : "good", text: mode === "auto" ? "Made for you — it’s yours" : "Nice, it’s available" }
    : status === "taken" ? { tone: "bad", text: "Already taken — try another or Shuffle" }
    : status === "invalid" ? { tone: "warn", text: clean.length < 3 ? "At least 3 characters" : "Letters, numbers and single dots or underscores only" }
    : status === "offline" ? { tone: "muted", text: "Couldn’t check. We’ll verify when you create your account." }
    : !generated ? { tone: "muted", text: "Add your name and we’ll suggest one, or type your own." }
    : null;

  return <div className="username-field">
    <label htmlFor="signup-username">Username</label>
    <span className="username-input">
      <span aria-hidden="true">@</span>
      <input
        ref={input}
        id="signup-username"
        name="username"
        required
        disabled={disabled}
        autoComplete="username"
        autoCapitalize="none"
        spellCheck={false}
        placeholder="Pick a username"
        value={username}
        aria-describedby="signup-username-status"
        onChange={(event) => { setMode("custom"); setCustom(event.target.value.toLowerCase().replace(/[^a-z0-9._]/g, "").slice(0, 30)); }}
      />
    </span>
    <div id="signup-username-status" className="username-status" aria-live="polite">
      {message && <span key={`${status}-${clean}`} className={`username-message is-${message.tone}`}>
        {status === "checking" ? <span className="username-spinner" aria-hidden="true" /> : status === "idle" ? null : <StatusIcon status={status} auto={mode === "auto"} />}
        {message.text}
      </span>}
      {status === "offline"
        ? <button type="button" className="username-action" onClick={() => setCheck(null)}>Retry</button>
        : generated ? <button type="button" className="username-action" onClick={shuffle} disabled={disabled} aria-label="Make a different username">
          <svg key={spinKey} className="username-shuffle-icon" aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 3h5v5M4 20 21 3M21 16v5h-5M15 15l6 6M4 4l5 5" /></svg>
          Shuffle
        </button> : null}
    </div>
  </div>;
}

function StatusIcon({ status, auto }: { status: Status; auto: boolean }) {
  const path = status === "available" ? (auto ? "M12 3l1.9 4.6L18.5 9.5l-4.6 1.9L12 16l-1.9-4.6L5.5 9.5l4.6-1.9z" : "M5 12.5l4.5 4.5L19 7.5")
    : status === "taken" ? "M7 7l10 10M17 7 7 17"
    : status === "offline" ? "M3 3l18 18M8.5 16.5a5 5 0 0 1 7 0M5 13a10 10 0 0 1 5-2.7M12 20h0"
    : "M12 8v5M12 16.5h0";
  return <svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d={path} /></svg>;
}
