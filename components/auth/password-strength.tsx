"use client";

import { useEffect, useState } from "react";

// Web counterpart of the mobile meter (tivorah-mobile/components/auth/SignupSecurityStep.tsx):
// same four rules, same zxcvbn-based strength bands. zxcvbn is loaded only once the
// person starts typing, so it never weighs on the first page load.
export const passwordRules = [
  { key: "length", label: "10+ characters", test: (value: string) => value.length >= 10 },
  { key: "case", label: "Upper & lower case", test: (value: string) => /[a-z]/.test(value) && /[A-Z]/.test(value) },
  { key: "number", label: "A number", test: (value: string) => /\d/.test(value) },
  { key: "symbol", label: "A symbol", test: (value: string) => /[^A-Za-z0-9\s]/.test(value) },
];
export const passwordMeetsRules = (value: string) => passwordRules.every((rule) => rule.test(value));

const bands = [
  { label: "Too weak", tone: "weakest" },
  { label: "Weak", tone: "weak" },
  { label: "Good", tone: "good" },
  { label: "Strong", tone: "strong" },
];

type Scorer = (password: string) => { score: number };

export function PasswordStrength({ password, id }: { password: string; id: string }) {
  const [scorer, setScorer] = useState<Scorer | null>(null);
  useEffect(() => {
    if (!password || scorer) return;
    let active = true;
    void import("zxcvbn").then((module) => { if (active) setScorer(() => module.default); });
    return () => { active = false; };
  }, [password, scorer]);

  const passed = passwordRules.map((rule) => rule.test(password));
  // Until zxcvbn arrives, estimate from the rules so the meter still responds.
  const score = !password ? 0 : Math.min(scorer ? scorer(password).score : passed.filter(Boolean).length - 1, 3);
  const band = bands[Math.max(score, 0)];

  return <div id={id} className="password-strength">
    <div className="password-meter" aria-hidden="true">
      <span className="password-meter-bars">
        {[0, 1, 2, 3].map((index) => <span key={index} className={password && index <= score ? `is-${band.tone}` : ""} />)}
      </span>
      <span className={`password-meter-label${password ? ` is-${band.tone}` : ""}`}>{password ? band.label : "Strength"}</span>
    </div>
    <p className="sr-only" aria-live="polite">{password ? `Password strength: ${band.label}.` : ""}</p>
    <ul className="password-rules" aria-label="Password requirements">
      {passwordRules.map((rule, index) => (
        <li key={rule.key} className={passed[index] ? "is-met" : ""}>
          <svg aria-hidden="true" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
            {passed[index] ? <path d="m6 12.5 4 4L18 8.5" /> : <circle cx="12" cy="12" r="7.5" />}
          </svg>
          {rule.label}<span className="sr-only">{passed[index] ? " (met)" : " (not met)"}</span>
        </li>
      ))}
    </ul>
  </div>;
}
