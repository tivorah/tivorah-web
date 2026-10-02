"use client";
import { createContext, createElement, useContext, useEffect, useState, type ReactNode } from "react";
import { PrivateResourceProvider } from "./use-private-resource";
import { ApiError, api } from "../lib/api/client";
import { memberAuth } from "../lib/auth/client";
export type Account = {
  id: number;
  username: string;
  email: string;
  firstName: string;
  lastName: string | null;
};
function useAccountSource() {
  const {
    data: session,
    isPending,
    error: sessionError,
    refetch,
  } = memberAuth.useSession();
  const userId = session?.user.id;
  const sessionKey = session ? `${session.user.id}:${session.session.id}` : "signed-out";
  const [result, setResult] = useState<{
    forUser: string;
    account?: Account;
    error?: string;
  } | null>(null);
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    const refreshProfile = (event: Event) => {
      const path = (event as CustomEvent<string>).detail;
      if (path === "/web/account/profile") setAttempt(value => value + 1);
    };
    window.addEventListener("tivorah:mutation", refreshProfile);
    return () => window.removeEventListener("tivorah:mutation", refreshProfile);
  }, []);
  useEffect(() => {
    if (!userId) return;
    const controller = new AbortController();
    api<Account>("/web/account", { signal: controller.signal })
      .then((account) => {
        if (!controller.signal.aborted) {
          if (String(account.id) !== String(userId))
            throw new Error("Your session changed. Please sign in again.");
          setResult({ forUser: sessionKey, account });
        }
      })
      .catch((cause) => {
        if (!controller.signal.aborted)
          setResult({
            forUser: sessionKey,
            error:
              cause instanceof ApiError
                ? cause.message
                : "Could not load your account. Please try again.",
          });
      });
    return () => controller.abort();
  }, [userId, sessionKey, attempt]);
  // Never return a previous user's data during account switches or session revalidation.
  const current =
    !isPending && userId && result?.forUser === sessionKey ? result : null;
  return {
    sessionKey,
    account: current?.account ?? null,
    loading: isPending || (!!userId && !current),
    signedOut: !isPending && !session && !sessionError,
    error: sessionError
      ? "Could not verify your session. Please try again."
      : current?.error,
    retry: () => {
      void refetch();
      setAttempt((value) => value + 1);
    },
  };
}

const AccountContext = createContext<ReturnType<typeof useAccountSource> | null>(null);
export function AccountProvider({ children }: { children: ReactNode }) {
  const value = useAccountSource();
  return createElement(AccountContext.Provider, { value },
    createElement(PrivateResourceProvider, { scope: value.sessionKey }, children));
}
export function useAccount() {
  const value = useContext(AccountContext);
  if (!value) throw new Error("useAccount requires AccountProvider");
  return value;
}
