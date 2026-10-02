// Server-side input for the /auth/* pages, so the social sign-in buttons are
// in the first HTML. Cached, so the pages stay static and links can prefetch them.
export type SocialProviders = Record<"google" | "apple", { enabled: boolean }>;

// Short timeout: if the API is slow, the browser checks the providers itself.
export async function loadSocialProviders(): Promise<SocialProviders | null> {
  const base = (process.env.API_INTERNAL_URL || process.env.NEXT_PUBLIC_API_URL || "").replace(/\/$/, "");
  if (!base) return null;
  try {
    const response = await fetch(`${base}/api/v1/public/auth/providers`, {
      next: { revalidate: 60 },
      signal: AbortSignal.timeout(2000),
    });
    if (!response.ok) return null;
    const body = await response.json();
    const data = body?.data;
    return data?.google && data?.apple ? (data as SocialProviders) : null;
  } catch {
    return null;
  }
}
