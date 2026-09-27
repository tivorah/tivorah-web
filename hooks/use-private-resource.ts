"use client";
import { useEffect, useState } from "react";
import { api } from "../lib/api/client";
// Mount inside AccountGate. The gate remounts all private state on account changes.
export function usePrivateResource<T>(path: string) {
  const [result, setResult] = useState<{ path: string; data: T } | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError("");
    api<T>(path, { signal: controller.signal })
      .then((data) => {
        if (!controller.signal.aborted) setResult({ path, data });
      })
      .catch((cause) => {
        if (!controller.signal.aborted)
          setError(
            cause instanceof Error
              ? cause.message
              : "Could not load your information.",
          );
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [path, attempt]);
  return {
    data: result?.path === path ? result.data : null,
    error,
    loading,
    retry: () => setAttempt((value) => value + 1),
  };
}
