"use client";
import { LoadingState } from "../ui/loading-state";
import { AccountSurfaceLoading } from "./surface-loading";
import Link from "next/link";
import { PasswordInput } from "../ui/password-input";
import { FormEvent, useState } from "react";
import { AccountGate } from "./gate";
import { usePrivateResource } from "../../hooks/use-private-resource";
import { useMutation } from "../../hooks/use-mutation";
import { memberAuth } from "../../lib/auth/client";
import { api } from "../../lib/api/client";
function Settings() {
  const { data, loading, error, retry } = usePrivateResource<{
    firstName: string;
    lastName: string | null;
    bio: string | null;
  }>("/web/account/profile");
  const profile = useMutation();
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");
  async function save(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    await profile.run(
      "/web/account/profile",
      "PATCH",
      {
        firstName: f.get("firstName"),
        lastName: f.get("lastName"),
        bio: f.get("bio"),
      },
      "Profile saved.",
    );
  }
  async function password(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const f = new FormData(form);
    setBusy(true);
    setNotice("");
    try {
      const result = await memberAuth.changePassword({
        currentPassword: String(f.get("current")),
        newPassword: String(f.get("password")),
        revokeOtherSessions: true,
      });
      if (result.error)
        throw new Error(
          result.error.message || "Could not update your password.",
        );
      setNotice("Password changed. Your other sessions have been signed out.");
      form.reset();
    } catch (cause) {
      setNotice(
        cause instanceof Error
          ? cause.message
          : "Could not update your password.",
      );
    } finally {
      setBusy(false);
    }
  }
  async function remove(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setNotice("");
    try {
      await api("/user/me", {
        method: "DELETE",
        body: JSON.stringify({
          password: String(new FormData(e.currentTarget).get("password")),
        }),
      });
      window.location.replace("/account-deletion?deleted=1");
    } catch (cause) {
      setNotice(
        cause instanceof Error
          ? cause.message
          : "Could not delete your account.",
      );
      setBusy(false);
    }
  }
  if (loading && !data) return <AccountSurfaceLoading embedded />;
  return (
    <>
      <Link className="product-secondary" href="/account">
        ← Your account
      </Link>
      <h1>Account settings</h1>
      {loading ? <LoadingState label="Loading profile…" variant="form" refreshing={!!data} /> : null}
      {error ? (
        <p role="alert">
          {error} <button onClick={retry}>Try again</button>
        </p>
      ) : null}
      {data && !error ? (
        <section className="product-form business-create">
          <h2>Your profile</h2>
          <form onSubmit={save}>
            <label>
              First name
              <input
                name="firstName"
                defaultValue={data.firstName}
                minLength={2}
                maxLength={80}
                required
              />
            </label>
            <label>
              Last name
              <input
                name="lastName"
                defaultValue={data.lastName || ""}
                maxLength={80}
              />
            </label>
            <label>
              About you
              <textarea
                name="bio"
                defaultValue={data.bio || ""}
                maxLength={500}
              />
            </label>
            <button className="product-primary" disabled={profile.busy}>
              {profile.busy ? "Saving…" : "Save profile"}
            </button>
          </form>
          {profile.error ? <p role="alert">{profile.error}</p> : null}
          {profile.notice ? <p role="status">{profile.notice}</p> : null}
        </section>
      ) : null}
      <section className="product-form business-create">
        <h2>Password & access</h2>
        <form onSubmit={password}>
          <div className="account-password-field">
            <label htmlFor="account-current-password">Current password</label>
            <PasswordInput
              id="account-current-password"
              fieldLabel="Current password"
              name="current"
              autoComplete="current-password"
              required
            />
          </div>
          <div className="account-password-field">
            <label htmlFor="account-new-password">New password</label>
            <PasswordInput
              id="account-new-password"
              fieldLabel="New password"
              name="password"
              autoComplete="new-password"
              minLength={8}
              maxLength={128}
              required
            />
          </div>
          <button className="product-primary" disabled={busy}>
            {busy ? "Updating…" : "Change password"}
          </button>
        </form>
        <p>
          <Link href="/auth/recover">Forgot your password?</Link>
        </p>
      </section>
      <section className="product-form business-create">
        <h2>Delete account</h2>
        <p>
          Deletion removes your access and public profile. Transaction records
          may be retained as described in our{" "}
          <Link href="/privacy">privacy policy</Link>. Resolve outstanding
          bookings and orders first.
        </p>
        <details>
          <summary>Continue to account deletion</summary>
          <form onSubmit={remove}>
            <div className="account-password-field">
              <label htmlFor="account-delete-password">Confirm your password</label>
              <PasswordInput
                id="account-delete-password"
                fieldLabel="Confirm your password"
                name="password"
                autoComplete="current-password"
                required
              />
            </div>
            <label className="product-checkbox">
              <input type="checkbox" required />
              <span>I understand this permanently closes my account.</span>
            </label>
            <button className="product-secondary" disabled={busy}>
              Permanently delete my account
            </button>
          </form>
        </details>
      </section>
      {notice ? (
        <p role="status" className="product-notice">
          {notice}
        </p>
      ) : null}
    </>
  );
}
export function AccountSettings() {
  return <AccountGate>{() => <Settings />}</AccountGate>;
}
