"use client";
import { useEffect, useRef } from "react";
import { useAccount } from "../../hooks/use-account";
import { identifyAccount, resetAnalytics, startAnalytics } from "../../lib/analytics";

/** Starts PostHog once and keeps the identified account in step with sign-in and sign-out. */
export function Analytics() {
  const { account, signedOut } = useAccount();
  const identified = useRef<number | null>(null);
  useEffect(() => { startAnalytics(); }, []);
  useEffect(() => {
    if (account && identified.current !== account.id) {
      identified.current = account.id;
      identifyAccount(account.id);
    } else if (signedOut && identified.current !== null) {
      identified.current = null;
      resetAnalytics();
    }
  }, [account, signedOut]);
  return null;
}
