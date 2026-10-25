"use client";
import Link from "next/link";
import { useEffect, useState, type FormEvent } from "react";
import { useSearchParams } from "next/navigation";
import { memberAuth } from "../../lib/auth/client";
import { safeReturnPath } from "../../lib/auth/return-path";
import { api } from "../../lib/api/client";
import { LoadingState } from "../ui/loading-state";
import { DateField } from "../ui/date-field";
import { birthDateProps } from "./birth-date";
import { AgeRestricted } from "./age-restricted";
import { blockUnderage, isUnderage } from "../../lib/age-gate";
export function CompleteSignIn() {
  const params = useSearchParams();
  const returnTo = safeReturnPath(params.get("returnTo"));
  const {
    data,
    isPending,
    error: sessionError,
    refetch,
  } = memberAuth.useSession();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [ageBlocked, setAgeBlocked] = useState(false);
  useEffect(() => {
    if (!isPending && !sessionError && data?.user.adultConfirmed && data.user.dateOfBirth && data.user.termAndCondition && data.user.privacyTerm)
      window.location.replace(returnTo);
  }, [data, isPending, sessionError, returnTo]);
  async function confirm(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    setBusy(true);
    setError("");
    try {
      await api("/user/confirm-age", {
        method: "POST",
        body: JSON.stringify({
          dateOfBirth: String(
            new FormData(event.currentTarget).get("dateOfBirth"),
          ),
          adultConfirmed: true,
          termsAccepted: true,
          username: String(new FormData(event.currentTarget).get("username") || "").trim().toLowerCase(),
        }),
      });
      window.location.replace(returnTo);
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "Could not complete your account. Try again.",
      );
      setBusy(false);
    }
  }
  // 18+ only: an under-18 birth date ends this sign-up (this browser and this email are refused
  // until they turn 18) and signs the unfinished account out.
  async function refuseUnderage(birthDate: string) {
    setAgeBlocked(true);
    await blockUnderage(birthDate, data?.user.email);
    await memberAuth.signOut().catch(() => undefined);
  }
  if (ageBlocked) return <section className="product-form auth-form"><AgeRestricted /></section>;
  if (isPending || (data?.user.adultConfirmed && data.user.dateOfBirth && data.user.termAndCondition && data.user.privacyTerm && !sessionError))
    return <LoadingState label="Completing sign-in…" variant="form" />;
  if (sessionError)
    return (
      <div className="product-notice" role="alert">
        <p>Could not verify your sign-in.</p>
        <button className="product-secondary" onClick={() => void refetch()}>
          Try again
        </button>
      </div>
    );
  if (!data)
    return (
      <section className="product-form">
        <h1>Finish signing in</h1>
        <p>Your sign-in was not completed.</p>
        <Link
          className="product-primary"
          href={`/auth/signin?returnTo=${encodeURIComponent(returnTo)}`}
        >
          Return to sign in
        </Link>
      </section>
    );
  return (
    <section className="product-form auth-form">
      <h1>Finish your account.</h1>
      <p>
        Choose how people find you and confirm you’re 18 or older. Your date of birth stays private.
      </p>
      <form onSubmit={confirm}>
        <label>
          Username
          <input name="username" required minLength={3} maxLength={30} pattern="[a-z0-9](?:[a-z0-9]|[._](?=[a-z0-9]))*" autoComplete="username" autoCapitalize="none" defaultValue={data.user.username ?? ""} disabled={busy} />
        </label>
        <label>
          Date of birth
          <DateField name="dateOfBirth" required disabled={busy} {...birthDateProps()} onChange={(value) => { if (isUnderage(value)) void refuseUnderage(value); }} />
        </label>
        <label className="product-checkbox">
          <input type="checkbox" required disabled={busy} />
          <span>I’m 18 or older and agree to the <Link href="/terms" target="_blank">Terms of Use</Link> and <Link href="/privacy" target="_blank">Privacy Policy</Link>.</span>
        </label>
        <button className="product-primary" disabled={busy}>
          {busy ? "Checking…" : "Continue"}
        </button>
        {error && <p role="alert">{error}</p>}
      </form>
    </section>
  );
}
