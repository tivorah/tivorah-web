"use client";
import Link from "next/link";
import { AuthIntroduction } from "./introduction";
import { FormEvent, useState } from "react";
import { useSearchParams } from "next/navigation";
import { memberAuth } from "../../lib/auth/client";
import { safeReturnPath } from "../../lib/auth/return-path";
import { SocialSignIn } from "./social-signin";
export type AuthMode =
  "signin" | "signup" | "verify" | "recover" | "two-factor";
const titles: Record<AuthMode, string> = {
  signin: "Welcome back.",
  signup: "Your Tivorah starts here.",
  verify: "Check your inbox.",
  recover: "Let’s get you back in.",
  "two-factor": "One more security check.",
};
export function AuthForm({ initialMode }: { initialMode: AuthMode }) {
  const params = useSearchParams();
  const returnTo = safeReturnPath(params.get("returnTo"));
  const [mode, setMode] = useState(initialMode);
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
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
          name: String(form.get("name")).trim(),
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
    <div className="auth-layout">
      <AuthIntroduction />
    <section className="product-form auth-form">
      <p className="product-eyebrow">{mode === "signup" ? "JOIN TIVORAH" : "YOUR TIVORAH"}</p>
      <h1>{titles[mode]}</h1>
      <p>
        {mode === "signup" ? "Create your account to book events and services, and discover more nearby." : mode === "verify" ? "Enter the code sent to your email to confirm your account." : "Sign in to pick up where you left off."}
      </p>
      {mode === "signin" && (
        <>
          {params.get("socialError") && (
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
            <label>
              Full name
              <input
                name="name"
                required
                autoComplete="name"
                minLength={2}
                maxLength={100}
              />
            </label>
            <label>
              Username
              <input
                name="username"
                required
                autoComplete="username"
                minLength={3}
                maxLength={40}
                pattern="[a-zA-Z0-9._-]+"
              />
            </label>
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
          <label>
            {mode === "recover" ? "New password" : "Password"}
            <input
              name="password"
              type="password"
              required
              minLength={mode === "signin" ? 1 : 10}
              maxLength={100}
              autoComplete={
                mode === "signin" ? "current-password" : "new-password"
              }
            />
          </label>
        ) : null}
        {mode === "signup" ? (
          <>
            <label>
              Date of birth
              <input name="birthDate" type="date" required />
            </label>
            <label className="product-checkbox">
              <input name="terms" type="checkbox" required />
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
          <p className="product-error" role="alert">
            {error}
          </p>
        ) : null}
        {notice ? <p role="status">{notice}</p> : null}
        <button type="submit" className="product-primary" disabled={busy}>
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
      {mode === "signin" && <SocialSignIn returnTo={returnTo} disabled={busy} onBusy={setBusy} />}
      <div className="product-form-links">
        <Link
          href={`/auth/${mode === "signin" ? "signup" : "signin"}?returnTo=${encodeURIComponent(returnTo)}`}
        >
          {mode === "signin" ? "Create an account" : "Back to sign in"}
        </Link>
        <Link href={`/auth/recover?returnTo=${encodeURIComponent(returnTo)}`}>
          Forgot password?
        </Link>
        {mode === "signin" ? (
          <Link href={`/auth/verify?returnTo=${encodeURIComponent(returnTo)}`}>
            Verify email
          </Link>
        ) : null}
      </div>
    </section>
    </div>
  );
}
