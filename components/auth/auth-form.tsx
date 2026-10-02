"use client";
import Link from "next/link";
import Image from "next/image";
import { FormEvent, useMemo, useState, useSyncExternalStore } from "react";
import type { ChangeEvent } from "react";
import { memberAuth } from "../../lib/auth/client";
import type { SocialProviders } from "../../lib/auth/auth-page";
import { safeReturnPath } from "../../lib/auth/return-path";
import { SocialSignIn } from "./social-signin";
import { PasswordInput } from "../ui/password-input";
import { DateField } from "../ui/date-field";
import { birthDateProps } from "./birth-date";
import { PasswordStrength, passwordMeetsRules } from "./password-strength";
import { UsernameField } from "./username-field";
export type AuthMode =
  "signin" | "signup" | "verify" | "recover" | "two-factor";
const titles: Record<AuthMode, string> = {
  signin: "Welcome back.",
  signup: "Your Tivorah starts here.",
  verify: "Check your inbox.",
  recover: "Let’s get you back in.",
  "two-factor": "One more security check.",
};
// Read the query string without useSearchParams: that hook needs a Suspense
// fallback, which put a loading placeholder in the page's HTML. The server
// snapshot is empty and the real values apply right after hydration, keeping
// /auth/* static so links can prefetch them.
const noSubscription = () => () => {};
function useQueryString() {
  return useSyncExternalStore(noSubscription, () => window.location.search, () => "");
}

export function AuthForm({
  initialMode,
  initialProviders = null,
}: {
  initialMode: AuthMode;
  initialProviders?: SocialProviders | null;
}) {
  const query = useQueryString();
  const params = useMemo(() => new URLSearchParams(query), [query]);
  const returnTo = safeReturnPath(params.get("returnTo"));
  const socialError = !!params.get("socialError");
  const createDestination = new URL(returnTo, "https://tivorah.com");
  const createType = createDestination.pathname === "/business/create" ? createDestination.searchParams.get("type") : null;
  const createLabel = createType === "event" ? "an event" : createType === "service" ? "a service" : createType === "item" ? "a shop listing" : null;
  const [mode, setMode] = useState(initialMode);
  const [email, setEmail] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [busy, setBusy] = useState(false);
  // Sign-up gating, matching mobile: an adult date of birth and accepted terms
  // are required before Create account is enabled.
  const [newPassword, setNewPassword] = useState("");
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [birthDate, setBirthDate] = useState("");
  const birthRules = useMemo(() => birthDateProps(), []);
  const underage = !!birthDate && birthRules.validate(birthDate) !== "";
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [codeSent, setCodeSent] = useState(false);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    setBusy(true);
    setError("");
    setNotice("");
    const form = new FormData(event.currentTarget);
    const password = String(form.get("password") || "");
    const otp = String(form.get("otp") || "").trim();
    try {
      if (mode === "signin") {
        const identity = email.trim().toLowerCase();
        const result = identity.includes("@")
          ? await memberAuth.signIn.email({ email: identity, password })
          : await memberAuth.signIn.username({ username: identity, password });
        if (result.error)
          throw new Error(
            result.error.status === 429
              ? "Too many attempts. Please wait before trying again."
              : result.error.message || "Check your sign-in details.",
          );
        if (
          "twoFactorRedirect" in (result.data || {}) &&
          (result.data as { twoFactorRedirect?: boolean }).twoFactorRedirect
        ) {
          setMode("two-factor");
          return;
        }
        window.location.assign(returnTo);
      } else if (mode === "signup") {
        const result = await memberAuth.signUp.email({
          // Same shape as the mobile app: the API splits this into first and last name.
          name: `${firstName.trim()} ${lastName.trim()}`.trim(),
          username: String(form.get("username")).trim().toLowerCase(),
          email: email.trim().toLowerCase(),
          password,
          dateOfBirth: String(form.get("birthDate")),
          adultConfirmed: form.get("terms") === "on",
          termAndCondition: form.get("terms") === "on",
          privacyTerm: form.get("terms") === "on",
        });
        if (result.error)
          throw new Error(
            result.error.message || "Could not create your account.",
          );
        setMode("verify");
        setNotice("Enter the verification code sent to your email.");
      } else if (mode === "verify") {
        const result = await memberAuth.emailOtp.verifyEmail({
          email: email.trim().toLowerCase(),
          otp,
        });
        if (result.error)
          throw new Error(
            result.error.message || "Check your code and try again.",
          );
        window.location.assign(returnTo);
      } else if (mode === "two-factor") {
        const result =
          form.get("recovery") === "on"
            ? await memberAuth.twoFactor.verifyBackupCode({ code: otp })
            : await memberAuth.twoFactor.verifyTotp({ code: otp });
        if (result.error)
          throw new Error("The code could not be verified. Please try again.");
        window.location.assign(returnTo);
      } else if (!codeSent) {
        const result = await memberAuth.emailOtp.sendVerificationOtp({
          email: email.trim().toLowerCase(),
          type: "forget-password",
        });
        if (result.error)
          throw new Error(
            result.error.message || "Could not send a recovery code.",
          );
        setCodeSent(true);
        setNotice("If this account can be recovered, a code has been sent.");
      } else {
        const result = await memberAuth.emailOtp.resetPassword({
          email: email.trim().toLowerCase(),
          otp,
          password,
        });
        if (result.error)
          throw new Error(
            result.error.message || "Could not reset your password.",
          );
        setMode("signin");
        setNotice("Password updated. Sign in with your new password.");
      }
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "Could not connect. Please try again.",
      );
    } finally {
      setBusy(false);
    }
  }
  async function resend() {
    if (busy) return;
    setBusy(true);
    setError("");
    try {
      const result = await memberAuth.emailOtp.sendVerificationOtp({
        email: email.trim().toLowerCase(),
        type: "email-verification",
      });
      if (result.error)
        throw new Error(result.error.message || "Could not send a code.");
      setNotice("If verification is needed, a new code has been sent.");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Please try again.");
    } finally {
      setBusy(false);
    }
  }
  const needsPassword =
    mode === "signin" || mode === "signup" || (mode === "recover" && codeSent);
  const needsCode =
    mode === "verify" ||
    mode === "two-factor" ||
    (mode === "recover" && codeSent);
  return (
    <div className={`auth-layout${mode === "signup" ? " auth-layout-signup" : ""}`}>
    <div className="auth-brand"><Image src="/tivorah-logo.png" alt="Tivorah" width={708} height={226} priority /></div>
    <section className="product-form auth-form">
      <p className="product-eyebrow">{mode === "signup" ? "JOIN TIVORAH" : "YOUR TIVORAH"}</p>
      <h1>{createLabel && (mode === "signin" || mode === "signup") ? mode === "signin" ? `Sign in to create ${createLabel}.` : `Create your account to get started.` : titles[mode]}</h1>
      <p>
        {createLabel && (mode === "signin" || mode === "signup") ? `You’ll return to your ${createType === "item" ? "listing" : createType} form after ${mode === "signin" ? "signing in" : "creating your account"}.` : mode === "signup" ? "Create your account to book events and services, and discover more nearby." : mode === "verify" ? "Enter the code sent to your email to confirm your account." : "Sign in to pick up where you left off."}
      </p>
      {mode === "signin" && (
        <>
          {socialError && (
            <p className="product-notice" role="alert">
              Social sign-in was not completed. Try again, or sign in with your
              email. If you do not have an account yet, create one below.
            </p>
          )}
        </>
      )}
      <form onSubmit={submit} key={mode}>
        {mode === "signup" ? (
          <>
            {/* Same fields as the mobile sign-up: first and last name, then a
                username generated from them and checked live. */}
            <div className="auth-name-row">
              <label>
                First name
                <input
                  name="firstName"
                  required
                  autoComplete="given-name"
                  minLength={2}
                  maxLength={50}
                  value={firstName}
                  onChange={(event) => setFirstName(event.target.value)}
                />
              </label>
              <label>
                Last name
                <input
                  name="lastName"
                  required
                  autoComplete="family-name"
                  minLength={2}
                  maxLength={50}
                  value={lastName}
                  onChange={(event) => setLastName(event.target.value)}
                />
              </label>
            </div>
            <UsernameField firstName={firstName.trim()} lastName={lastName.trim()} disabled={busy} />
          </>
        ) : null}
        {mode !== "two-factor" ? (
          <label>
            {mode === "signin" ? "Email or username" : "Email address"}
            <input
              name="email"
              type={mode === "signin" ? "text" : "email"}
              required
              autoComplete={mode === "signin" ? "username" : "email"}
              maxLength={254}
              value={email}
              onChange={(event) => setEmail(event.target.value)}
            />
          </label>
        ) : null}
        {needsCode ? (
          <label>
            {mode === "two-factor"
              ? "Authenticator or recovery code"
              : "Email verification code"}
            <input
              name="otp"
              required
              autoComplete="one-time-code"
              maxLength={64}
            />
          </label>
        ) : null}
        {mode === "verify" ? (
          <button
            type="button"
            className="auth-resend-link"
            onClick={resend}
            disabled={busy || !email}
          >
            Send another code
          </button>
        ) : null}
        {mode === "two-factor" ? (
          <label className="product-checkbox">
            <input name="recovery" type="checkbox" />
            Use a recovery code
          </label>
        ) : null}
        {needsPassword ? (
          <div className="auth-password-field">
            <label htmlFor="auth-password">{mode === "recover" ? "New password" : "Password"}</label>
            <PasswordInput
              id="auth-password"
              fieldLabel={mode === "recover" ? "New password" : "Password"}
              name="password"
              required
              minLength={mode === "signin" ? 1 : 10}
              maxLength={100}
              autoComplete={
                mode === "signin" ? "current-password" : "new-password"
              }
              {...(mode === "signin" ? {} : {
                value: newPassword,
                "aria-describedby": "auth-password-strength",
                onChange: (event: ChangeEvent<HTMLInputElement>) => {
                  setNewPassword(event.target.value);
                  event.target.setCustomValidity(passwordMeetsRules(event.target.value) ? "" : "Your password needs everything listed below.");
                },
              })}
            />
            {mode !== "signin" && <PasswordStrength id="auth-password-strength" password={newPassword} />}
          </div>
        ) : null}
        {mode === "signup" ? (
          <>
            <label>
              Date of birth
              <DateField name="birthDate" required {...birthRules} onChange={(value) => { setBirthDate(value); if (value && birthRules.validate(value)) setTermsAccepted(false); }} />
            </label>
            <label className={`product-checkbox${underage ? " is-disabled" : ""}`}>
              <input name="terms" type="checkbox" required checked={termsAccepted && !underage} disabled={underage || busy} onChange={(event) => setTermsAccepted(event.target.checked)} />
              <span>
                I am at least 18 and agree to the{" "}
                <Link href="/terms" target="_blank">
                  Terms
                </Link>{" "}
                and{" "}
                <Link href="/privacy" target="_blank">
                  Privacy Policy
                </Link>
                .
              </span>
            </label>
          </>
        ) : null}
        {error ? (
          <div className="product-error" role="alert">
            <p>{error}</p>
            {mode === "signin" && /verif/i.test(error) ? <Link href={`/auth/verify?returnTo=${encodeURIComponent(returnTo)}`}>Verify your email</Link> : null}
          </div>
        ) : null}
        {notice ? <p role="status">{notice}</p> : null}
        <button type="submit" className="product-primary" disabled={busy || (mode === "signup" && (!termsAccepted || underage))}>
          {busy
            ? "Please wait…"
            : mode === "signup"
              ? "Create account"
              : mode === "signin"
                ? "Sign in"
                : mode === "recover" && !codeSent
                  ? "Send recovery code"
                  : "Continue"}
        </button>
      </form>
      {mode === "signin" && <SocialSignIn returnTo={returnTo} disabled={busy} onBusy={setBusy} initialProviders={initialProviders} />}
      <div className="product-form-links">
        <Link
          href={`/auth/${mode === "signin" ? "signup" : "signin"}?returnTo=${encodeURIComponent(returnTo)}`}
        >
          {mode === "signin" ? "Create an account" : "Back to sign in"}
        </Link>
        <Link href={`/auth/recover?returnTo=${encodeURIComponent(returnTo)}`}>
          Forgot password?
        </Link>
      </div>
    </section>
    <Link className="auth-home-link" href="/">Return to Tivorah home</Link>
    </div>
  );
}
