"use client";
import Link from "next/link";
import { ReactNode } from "react";
import { usePathname } from "next/navigation";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useRef } from "react";
import { Account, useAccount } from "../../hooks/use-account";
import { useSigningOut } from "../../lib/auth/sign-out";
import { AccountSurfaceLoading } from "./surface-loading";
export function AccountGate({
  children,
  redirectOnSignedOut = false,
}: {
  children: (account: Account) => ReactNode;
  redirectOnSignedOut?: boolean;
}) {
  const { account, loading, signedOut, error, retry } = useAccount();
  // During sign-out the session empties before the redirect; keep the current page
  // (and the button's "Signing out…" state) on screen instead of the signed-out card.
  const signingOut = useSigningOut();
  const lastAccount = useRef<Account | null>(null);
  if (account) lastAccount.current = account;
  const path = usePathname();
  const router = useRouter();
  useEffect(() => {
    if (!signedOut || !redirectOnSignedOut) return;
    const destination = `${window.location.pathname}${window.location.search}`;
    router.replace(`/auth/signin?returnTo=${encodeURIComponent(destination)}`);
  }, [redirectOnSignedOut, router, signedOut]);
  if (signingOut && lastAccount.current) return <div key={lastAccount.current.id}>{children(lastAccount.current)}</div>;
  if (loading) return <AccountSurfaceLoading embedded />;
  if (signedOut && redirectOnSignedOut) return <AccountSurfaceLoading embedded />;
  if (signedOut)
    return (
      <section className="product-form">
        <p className="product-eyebrow">YOUR TIVORAH</p>
        <h1>Make yourself at home.</h1>
        <p>Sign in to find your bookings, tickets and business tools.</p>
        <Link
          className="product-primary"
          href={`/auth/signin?returnTo=${encodeURIComponent(path)}`}
        >
          Sign in
        </Link>
        <div className="product-form-links">
          <Link href={`/auth/signup?returnTo=${encodeURIComponent(path)}`}>
            Create an account
          </Link>
        </div>
      </section>
    );
  if (error || !account)
    return (
      <div className="product-notice" role="alert">
        <p>{error || "Your account could not be loaded."}</p>
        <button className="product-secondary" onClick={retry}>
          Try again
        </button>
      </div>
    );
  return <div key={account.id}>{children(account)}</div>;
}
