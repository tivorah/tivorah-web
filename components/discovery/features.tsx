"use client";
import {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useState,
} from "react";
import Link from "next/link";
import { api } from "../../lib/api/client";
import { DiscoveryKind, sections } from "../../lib/api/discovery";

export type FeatureConfig = { features: Record<string, { enabled: boolean }> };
type Config = FeatureConfig;
const Features = createContext<{
  config: Config | null;
  loading: boolean;
  error: boolean;
  retry: () => void;
}>({ config: null, loading: true, error: false, retry: () => {} });
// A failed first load retries on its own so a brief API outage does not leave
// navigation empty until the visitor switches tabs.
const retryDelaysMs = [1000, 3000, 8000, 15000];
const keys: Record<DiscoveryKind, string[]> = {
  events: ["events"],
  items: ["marketplace"],
  services: ["marketplace", "services"],
  hubs: ["communities"],
};

export function DiscoveryFeatures({
  children,
  initialConfig = null,
}: {
  children: ReactNode;
  // Flags fetched during server rendering, so navigation is in the first HTML
  // instead of appearing after the browser's own request.
  initialConfig?: Config | null;
}) {
  const [config, setConfig] = useState<Config | null>(initialConfig);
  const [loading, setLoading] = useState(!initialConfig);
  const [error, setError] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const [autoRetries, setAutoRetries] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    async function refresh() {
      try {
        const value = await api<Config>("/config/bootstrap?platform=web", {
          signal: controller.signal,
        });
        if (!controller.signal.aborted) {
          setConfig(value);
          setError(false);
          setAutoRetries(0);
        }
      } catch {
        // Keep the last good configuration during a failed background refresh.
        if (!controller.signal.aborted) setError(true);
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }
    void refresh();
    const onFocus = () => {
      if (document.visibilityState === "visible") void refresh();
    };
    const onOnline = () => void refresh();
    document.addEventListener("visibilitychange", onFocus);
    window.addEventListener("online", onOnline);
    return () => {
      controller.abort();
      document.removeEventListener("visibilitychange", onFocus);
      window.removeEventListener("online", onOnline);
    };
  }, [attempt]);
  const retrying = error && !config && autoRetries < retryDelaysMs.length;
  useEffect(() => {
    if (!retrying) return;
    const timer = window.setTimeout(() => {
      setAutoRetries((value) => value + 1);
      setAttempt((value) => value + 1);
    }, retryDelaysMs[autoRetries]);
    return () => window.clearTimeout(timer);
  }, [retrying, autoRetries]);
  return (
    <Features.Provider
      value={{
        config,
        loading: loading || retrying,
        error: error && !retrying,
        retry: () => {
          setLoading(true);
          setAutoRetries(0);
          setAttempt((value) => value + 1);
        },
      }}
    >
      {children}
    </Features.Provider>
  );
}

export function useDiscoveryFeatures() {
  const state = useContext(Features);
  return {
    ...state,
    enabled: (kind: DiscoveryKind) =>
      keys[kind].every((key) => state.config?.features[key]?.enabled === true),
  };
}

export function DiscoveryLinks({
  active,
  onClick,
}: {
  active?: DiscoveryKind;
  onClick?: () => void;
}) {
  const { config, loading, enabled } = useDiscoveryFeatures();
  const kinds = Object.keys(sections) as DiscoveryKind[];
  // Reserve the links' space while flags load so the header does not jump;
  // hidden features still never receive a usable link.
  if (!config && loading)
    return (
      <>
        {kinds.map((kind) => (
          <a key={kind} className="nav-placeholder" aria-hidden="true">
            {sections[kind].label}
          </a>
        ))}
      </>
    );
  return (
    <>
      {kinds
        .filter(enabled)
        .map((kind) => (
          <Link
            key={kind}
            href={sections[kind].path}
            onClick={onClick}
            aria-current={active === kind ? "page" : undefined}
          >
            {sections[kind].label}
          </Link>
        ))}
    </>
  );
}
