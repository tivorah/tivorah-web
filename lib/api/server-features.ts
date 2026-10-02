import type { FeatureConfig } from "../../components/discovery/features";

// Server-side read of the public web feature flags for the first render.
// Short timeout and cache: a slow or unavailable API must never hold up pages;
// the browser still refreshes the flags after hydration.
export async function loadInitialFeatures(): Promise<FeatureConfig | null> {
  const base = (process.env.API_INTERNAL_URL || process.env.NEXT_PUBLIC_API_URL || "").replace(/\/$/, "");
  if (!base) return null;
  try {
    const response = await fetch(`${base}/api/v1/config/bootstrap?platform=web`, {
      next: { revalidate: 30 },
      signal: AbortSignal.timeout(2000),
    });
    if (!response.ok) return null;
    const body = await response.json();
    return body?.data?.features ? (body.data as FeatureConfig) : null;
  } catch {
    return null;
  }
}
