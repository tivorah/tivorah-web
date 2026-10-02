"use client";
import { createContext, createElement, useContext, useMemo, useCallback, useEffect, useState, type ReactNode } from "react";
import { ApiError, api } from "../lib/api/client";

type Entry = { data?: unknown; at: number; pending?: Promise<unknown>; controller?: AbortController };
class ResourceCache {
  constructor(readonly scope: string) {}
  entries = new Map<string, Entry>();
  clear() {
    for (const entry of this.entries.values()) entry.controller?.abort();
    this.entries.clear();
  }
  invalidate() {
    for (const entry of this.entries.values()) {
      entry.controller?.abort();
      entry.controller = undefined;
      entry.pending = undefined;
      entry.at = 0;
    }
  }
  read(path: string, force = false): Promise<unknown> {
    let entry = this.entries.get(path);
    if (entry?.pending) return entry.pending;
    if (!force && entry?.data !== undefined && Date.now() - entry.at < 30000) return Promise.resolve(entry.data);
    entry ??= { at: 0 };
    this.entries.set(path, entry);
    const target = entry;
    const controller = new AbortController();
    target.controller = controller;
    target.pending = api(path, { signal: controller.signal }).then(data => {
      if (!controller.signal.aborted) {
        target.data = data;
        target.at = Date.now();
      }
      return data;
    }).finally(() => {
      if (target.controller === controller) {
        target.pending = undefined;
        target.controller = undefined;
      }
      if (this.entries.size > 40) {
        for (const [key, value] of this.entries) {
          if (key !== path && !value.pending) this.entries.delete(key);
          if (this.entries.size <= 40) break;
        }
      }
    });
    return target.pending;
  }
}
const ResourceContext = createContext<ResourceCache | null>(null);
export function PrivateResourceProvider({ scope, children }: { scope: string; children?: ReactNode }) {
  const cache = useMemo(() => new ResourceCache(scope), [scope]);
  useEffect(() => {
    const invalidate = () => cache.invalidate();
    window.addEventListener("tivorah:mutation", invalidate);
    return () => { window.removeEventListener("tivorah:mutation", invalidate); cache.clear(); };
  }, [cache]);
  return createElement(ResourceContext.Provider, { value: cache }, children);
}

// Memory only, scoped to the authenticated session. Mutations invalidate all reads.
export function usePrivateResource<T>(path: string) {
  const cache = useContext(ResourceContext);
  if (!cache) throw new Error("usePrivateResource requires PrivateResourceProvider");
  const [result, setResult] = useState<{ cache: ResourceCache; path: string; data?: T; error: string; loading: boolean } | null>(null);
  const [attempt, setAttempt] = useState(0);
  const retry = useCallback(() => setAttempt(value => value + 1), []);
  useEffect(() => {
    window.addEventListener("tivorah:mutation", retry);
    return () => window.removeEventListener("tivorah:mutation", retry);
  }, [retry]);
  useEffect(() => {
    let active = true;
    const cached = cache.entries.get(path)?.data as T | undefined;
    setResult({ cache, path, data: cached, error: "", loading: true });
    cache.read(path, attempt > 0).then(data => {
      if (active) setResult({ cache, path, data: data as T, error: "", loading: false });
    }).catch(cause => {
      if (!active) return;
      const denied = cause instanceof ApiError && [401, 403, 404].includes(cause.status);
      if (denied) cache.entries.delete(path);
      setResult({ cache, path, data: denied ? undefined : cached, error: cause instanceof Error ? cause.message : "Could not load your information.", loading: false });
    });
    return () => { active = false; };
  }, [path, attempt, cache]);
  const current = result?.cache === cache && result.path === path ? result : null;
  const cached = cache.entries.get(path);
  return {
    data: current?.data ?? (current ? null : cached?.data as T | undefined) ?? null,
    error: current?.error ?? "",
    loading: current?.loading ?? !(cached?.data !== undefined && Date.now() - cached.at < 30000),
    retry,
  };
}
