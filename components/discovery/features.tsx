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

type Config = { features: Record<string, { enabled: boolean }> };
const Features = createContext<{
  config: Config | null;
  loading: boolean;
  error: boolean;
  retry: () => void;
}>({ config: null, loading: true, error: false, retry: () => {} });
const keys: Record<DiscoveryKind, string[]> = {
  events: ["events"],
  items: ["marketplace"],
  services: ["marketplace", "services"],
  hubs: ["communities"],
};

export function DiscoveryFeatures({ children }: { children: ReactNode }) {
  const [config, setConfig] = useState<Config | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [attempt, setAttempt] = useState(0);
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
        }
      } catch {
        if (!controller.signal.aborted) {
          setConfig(null);
          setError(true);
        }
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }
    void refresh();
    const onFocus = () => {
      if (document.visibilityState === "visible") void refresh();
    };
    document.addEventListener("visibilitychange", onFocus);
    return () => {
      controller.abort();
      document.removeEventListener("visibilitychange", onFocus);
    };
  }, [attempt]);
  return (
    <Features.Provider
      value={{
        config,
        loading,
        error,
        retry: () => {
          setLoading(true);
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
  const { enabled } = useDiscoveryFeatures();
  return (
    <>
      {(Object.keys(sections) as DiscoveryKind[])
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
