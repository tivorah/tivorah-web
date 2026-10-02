import type { AuthMode } from "./auth-form";
import Image from "next/image";
import Link from "next/link";

// Shown while an /auth/* page loads: the real logo, card and home link with
// shimmering placeholders shaped like that screen's form, so the form drops
// into place without a layout jump. Uses the shared `tivorah-shimmer` style.
const layout: Record<AuthMode, { lines: number; fields: number; checkbox?: boolean; social?: boolean; label: string }> = {
  signin: { lines: 1, fields: 2, social: true, label: "Loading sign-in" },
  signup: { lines: 2, fields: 5, checkbox: true, label: "Loading sign-up" },
  recover: { lines: 1, fields: 2, label: "Loading account recovery" },
  verify: { lines: 1, fields: 2, label: "Loading email verification" },
  "two-factor": { lines: 1, fields: 1, checkbox: true, label: "Loading security check" },
};

export function AuthFormLoading({ mode }: { mode: AuthMode }) {
  const { lines, fields, checkbox, social, label } = layout[mode];
  return <div className={`auth-layout auth-skeleton${mode === "signup" ? " auth-layout-signup" : ""}`}>
    <div className="auth-brand"><Image src="/tivorah-logo.png" alt="Tivorah" width={708} height={226} priority /></div>
    <section className="product-form auth-form" role="status" aria-busy="true" aria-label={label}>
      <div aria-hidden="true">
        <span className="auth-skeleton-eyebrow tivorah-shimmer" />
        <span className="auth-skeleton-title tivorah-shimmer" />
        {Array.from({ length: lines }, (_, index) => (
          <span key={index} className={`auth-skeleton-text tivorah-shimmer${index === lines - 1 ? " auth-skeleton-text-short" : ""}`} />
        ))}
        <div className="auth-skeleton-fields">
          {Array.from({ length: fields }, (_, index) => (
            <div key={index}>
              <span className="auth-skeleton-label tivorah-shimmer" />
              <span className="auth-skeleton-input tivorah-shimmer" />
            </div>
          ))}
          {checkbox && <span className="auth-skeleton-check tivorah-shimmer" />}
          <span className="auth-skeleton-button tivorah-shimmer" />
        </div>
        {social && <>
          <div className="auth-skeleton-divider"><span className="tivorah-shimmer" /></div>
          <div className="auth-skeleton-social">
            <span className="tivorah-shimmer" />
            <span className="tivorah-shimmer" />
          </div>
          <span className="auth-skeleton-help tivorah-shimmer" />
        </>}
        <div className="auth-skeleton-links">
          <span className="tivorah-shimmer" />
          <span className="tivorah-shimmer" />
        </div>
      </div>
    </section>
    <Link className="auth-home-link" href="/">Return to Tivorah home</Link>
  </div>;
}
