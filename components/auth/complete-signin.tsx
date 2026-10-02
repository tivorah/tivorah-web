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
  useEffect(() => {
    if (!isPending && !sessionError && data?.user.adultConfirmed)
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
  if (isPending || (data?.user.adultConfirmed && !sessionError))
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
      <h1>One last step.</h1>
      <p>
        Tivorah is for adults aged 18 and over. Confirm your age to continue.
        Your date of birth is not shown publicly.
      </p>
      <form onSubmit={confirm}>
        <label>
          Date of birth
          <DateField name="dateOfBirth" required disabled={busy} {...birthDateProps()} />
        </label>
        <label className="product-checkbox">
          <input type="checkbox" required disabled={busy} />I confirm I am at
          least 18 years old.
        </label>
        <button className="product-primary" disabled={busy}>
          {busy ? "Checking…" : "Continue"}
        </button>
        {error && <p role="alert">{error}</p>}
      </form>
    </section>
  );
}
