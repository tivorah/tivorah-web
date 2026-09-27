"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { createDiscoveryCache } from "../lib/api/discovery-cache";
import { api, ApiError } from "../lib/api/client";
import { DiscoveryKind, DiscoveryPage } from "../lib/api/discovery";

export function useDiscovery(
  kind: DiscoveryKind,
  query: string,
  locality: string,
  filters = "",
) {
  const [data, setData] = useState<DiscoveryPage | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [attempt, setAttempt] = useState(0);
  const [cache] = useState(createDiscoveryCache);
  const blockedUntil = useRef(0);
  const [cooldown, setCooldown] = useState(0);
  useEffect(() => {
    if (!cooldown) return;
    const timer = window.setInterval(() => setCooldown(Math.max(0, Math.ceil((blockedUntil.current - Date.now()) / 1000))), 1000);
    return () => window.clearInterval(timer);
  }, [cooldown]);
  const request = useRef<AbortController | null>(null);
  const fetchPage = useCallback(
    async (skip: number) => {
      request.current?.abort();
      const controller = new AbortController();
      request.current = controller;
      setLoading(true);
      setError("");
      const search = new URLSearchParams(filters);
      search.delete("when");
      search.set("query", query); search.set("locality", locality); search.set("skip", String(skip));
      const key = JSON.stringify([kind, query, locality, filters, skip]);
      try {
        const cached = cache.get(key);
        if (!cached && blockedUntil.current > Date.now()) {
          setError("Search is paused briefly. Please wait before trying again.");
          return;
        }
        const result = cached ?? await api<DiscoveryPage>(
          `/public/discovery/${kind}?${search}`,
          { signal: controller.signal },
        );
        if (!controller.signal.aborted) {
          if (!cached) cache.set(key, result);
          setData((previous) => ({
            ...result,
            items: skip
              ? [...(previous?.items || []), ...result.items]
              : result.items,
          }));
        }
      } catch (cause) {
        if (!controller.signal.aborted) {
          if (cause instanceof ApiError && (cause.status === 429 || cause.status === 503)) {
            const seconds = Number.isFinite(cause.retryAfter) && cause.retryAfter > 0 ? cause.retryAfter : 30;
            blockedUntil.current = Date.now() + seconds * 1000;
            setCooldown(Math.ceil(seconds));
          }
          setError(
            cause instanceof Error
              ? cause.message
              : "Could not load this section.",
          );
        }
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    },
    [kind, query, locality, filters, cache],
  );
  const activeSearch = useRef("");
  useEffect(() => {
    const key = JSON.stringify([kind, query, locality, filters]);
    if (activeSearch.current !== key) setData(null);
    activeSearch.current = key;
    void fetchPage(0);
    return () => request.current?.abort();
  }, [fetchPage, attempt, kind, query, locality, filters]);
  const retry = useCallback(() => { cache.clear(); setAttempt((value) => value + 1); }, [cache]);
  return {
    data,
    loading,
    error,
    cooldown,
    retry,
    loadMore: () => {
      if (!loading && data?.nextSkip != null) void fetchPage(data.nextSkip);
    },
  };
}
