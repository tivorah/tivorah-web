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

export type FeatureConfig = { features: Record<string, { enabled: boolean; config?: { hideFromNav?: boolean } }> };
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
    // A switch turned off in Admin → Features also reaches a tab left open.
    const interval = window.setInterval(() => {
      if (document.visibilityState === "visible") void refresh();
    }, 2 * 60 * 1000);
    document.addEventListener("visibilitychange", onFocus);
    window.addEventListener("online", onOnline);
    return () => {
      controller.abort();
      window.clearInterval(interval);
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
      keys[kind].every((key) => state.config?.features?.[key]?.enabled === true),
    // Admin → Features → "Show in bottom nav" off: the section still works (links, search), it
    // just leaves the main navigation, like the app's bottom bar.
    inNavigation: (kind: DiscoveryKind) =>
      keys[kind].every((key) => state.config?.features?.[key]?.enabled === true && state.config?.features?.[key]?.config?.hideFromNav !== true),
  };
}

export function DiscoveryLinks({
  active,
  onClick,
}: {
  active?: DiscoveryKind;
  onClick?: () => void;
}) {
  const { config, loading, inNavigation } = useDiscoveryFeatures();
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
        .filter(inNavigation)
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

/**
 * One switch from Admin → Features, as the app reads it. While the first load is pending a switch
 * counts as on, so nothing flickers out; the API refuses anything that is really off.
 */
export function useFeature() {
  const { config } = useContext(Features);
  return (key: string) => !config || config.features?.[key]?.enabled === true;
}

// Pages that need a feature, like the app's route guard (tivorah-mobile FeatureRouteGuard).
// Each rule needs all of its switches; the first matching prefix wins.
const routeFeatures: [string, string[]][] = [
  ["/account/tickets", ["events"]],
  ["/account/bookings", ["services", "service_bookings"]],
  ["/account/item-orders", ["marketplace"]],
  ["/account/orders", ["marketplace"]],
  ["/account/messages", ["chat"]],
  ["/business/events", ["events"]],
  ["/business/appointments", ["services", "service_bookings"]],
  ["/business/orders", ["marketplace"]],
  ["/business/hubs", ["communities"]],
  ["/business/shop", ["marketplace"]],
  ["/event-tickets", ["events"]],
  ["/event-orders", ["events"]],
  ["/event-groups", ["events"]],
  ["/event-refund", ["events"]],
  ["/event-ticket-transfer", ["events"]],
  ["/events", ["events"]],
  ["/shop", ["marketplace"]],
  ["/services", ["marketplace", "services"]],
  ["/hubs", ["communities"]],
];

// Create links say what they create: /business/create?type=event needs Events, and so on.
const createFeatures: Record<string, string[]> = { event: ["events"], service: ["marketplace", "services"], item: ["marketplace"] };

/** The switches a page (or a link to one, with its query) needs ([] = none). */
export function featuresForPath(href: string): string[] {
  const [path, query = ""] = href.split("#")[0].split("?");
  if (path === "/business/create") return createFeatures[new URLSearchParams(query).get("type") ?? ""] ?? [];
  if (path === "/business" && new URLSearchParams(query).get("view") === "events") return ["events"];
  if (path === "/business" && new URLSearchParams(query).get("view") === "listings") return ["marketplace"];
  return routeFeatures.find(([prefix]) => path === prefix || path.startsWith(`${prefix}/`))?.[1] ?? [];
}
