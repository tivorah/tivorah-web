"use client";

import { useEffect, useState } from "react";
import { generateStrongPassword, passwordHint, passwordMeetsRules, passwordRules } from "../../lib/password-policy";

export { passwordMeetsRules };

// Web counterpart of the mobile meter (tivorah-mobile/components/auth/SignupSecurityStep.tsx):
// same rules, one-line hint, Suggest button and zxcvbn-based strength bands. zxcvbn is loaded
// only once the person starts typing, so it never weighs on the first page load.
const bands = [
  { label: "Too weak", tone: "weakest" },
  { label: "Weak", tone: "weak" },
  { label: "Good", tone: "good" },
  { label: "Strong", tone: "strong" },
];

type Scorer = (password: string) => { score: number };

export const suggestPassword = () =>
  generateStrongPassword((count) => crypto.getRandomValues(new Uint8Array(count)));

export function PasswordStrength({ password, id, onSuggest }: { password: string; id: string; onSuggest?: (password: string) => void }) {
  const [scorer, setScorer] = useState<Scorer | null>(null);
  useEffect(() => {
    if (!password || scorer) return;
    let active = true;
    void import("zxcvbn").then((module) => { if (active) setScorer(() => module.default); });
    return () => { active = false; };
  }, [password, scorer]);

  const hint = passwordHint(password);
  const metCount = passwordRules.filter((rule) => rule.test(password)).length;
  // Until zxcvbn arrives, estimate from the rules so the meter still responds.
  const score = !password ? 0 : Math.min(scorer ? scorer(password).score : metCount - 1, 3);
  const band = bands[Math.max(score, 0)];

  return <div id={id} className="password-strength">
    <div className="password-meter" aria-hidden="true">
      <span className="password-meter-bars">
        {[0, 1, 2, 3].map((index) => <span key={index} className={password && index <= score ? `is-${band.tone}` : ""} />)}
      </span>
      <span className={`password-meter-label${password ? ` is-${band.tone}` : ""}`}>{password ? band.label : "Strength"}</span>
    </div>
    <div className="password-hint-row">
      <p className={`password-hint${hint.met ? " is-met" : ""}`} aria-live="polite">
        <svg aria-hidden="true" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
          {hint.met ? <path d="m6 12.5 4 4L18 8.5" /> : <><circle cx="12" cy="12" r="8.5" /><path d="M12 11v5M12 8h0" /></>}
        </svg>
        <span>{hint.text}</span>
        {password ? <span className="sr-only"> Password strength: {band.label}.</span> : null}
      </p>
      {onSuggest ? <button type="button" className="username-action" onClick={() => onSuggest(suggestPassword())} aria-label="Suggest a strong password">
        <svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="8" cy="15" r="4" /><path d="m11 12 9-9M17 6l3 3M14 9l2 2" /></svg>
        Suggest
      </button> : null}
    </div>
  </div>;
}
