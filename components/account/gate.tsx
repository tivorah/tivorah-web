"use client";
import { LoadingState } from "../ui/loading-state";
import Link from "next/link";
import { ReactNode } from "react";
import { usePathname } from "next/navigation";
import { Account, useAccount } from "../../hooks/use-account";
export function AccountGate({
  children,
}: {
  children: (account: Account) => ReactNode;
}) {
  const { account, loading, signedOut, error, retry } = useAccount();
  const path = usePathname();
  if (loading)
    return (
      <LoadingState label="Checking your account…" variant="form" />
    );
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
