"use client";
import { useEffect, useState } from "react";
import { ApiError, api } from "../lib/api/client";
import { memberAuth } from "../lib/auth/client";
export type Account = {
  id: number;
  username: string;
  email: string;
  firstName: string;
  lastName: string | null;
};
export function useAccount() {
  const {
    data: session,
    isPending,
    error: sessionError,
    refetch,
  } = memberAuth.useSession();
  const userId = session?.user.id;
  const [result, setResult] = useState<{
    forUser: string;
    account?: Account;
    error?: string;
  } | null>(null);
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    if (!userId) return;
    const controller = new AbortController();
    api<Account>("/web/account", { signal: controller.signal })
      .then((account) => {
        if (!controller.signal.aborted) {
          if (String(account.id) !== String(userId))
            throw new Error("Your session changed. Please sign in again.");
          setResult({ forUser: userId, account });
        }
      })
      .catch((cause) => {
        if (!controller.signal.aborted)
          setResult({
            forUser: userId,
            error:
              cause instanceof ApiError
                ? cause.message
                : "Could not load your account. Please try again.",
          });
      });
    return () => controller.abort();
  }, [userId, attempt]);
  // Never return a previous user's data during account switches or session revalidation.
  const current =
    !isPending && userId && result?.forUser === userId ? result : null;
  return {
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
