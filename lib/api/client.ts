import { adminApiBase } from "../../app/admin/api-base";

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public retryAfter = 0,
  ) {
    super(message);
  }
}
export async function api<T>(path: string, init: RequestInit = {}): Promise<T> {
  const base = adminApiBase();
  if (!base)
    throw new ApiError(
      "Tivorah is temporarily unavailable. Please try again later.",
      503,
    );
  const timeout = AbortSignal.timeout(init.body instanceof FormData ? 120000 : 15000);
  const response = await fetch(`${base}/api/v1${path}`, {
    ...init,
    credentials: "include",
    cache: "no-store",
    signal: init.signal
      ? AbortSignal.any([init.signal, timeout])
      : timeout,
    headers: {
      ...(init.body instanceof FormData
        ? {}
        : { "Content-Type": "application/json" }),
      ...init.headers,
    },
  });
  const body = await response.json().catch(() => null);
  if (!response.ok) {
    const message =
      response.status === 429
        ? "Too many requests. Please wait before trying again."
        : response.status >= 500
          ? "Tivorah could not complete this request. Please try again."
          : body?.message || "This request could not be completed.";
    throw new ApiError(
      message,
      response.status,
      (() => {
        const header = response.headers.get("Retry-After");
        if (!header) return 0;
        const seconds = Number(header);
        return Number.isFinite(seconds) ? Math.max(0, seconds) : Math.max(0, Math.ceil((Date.parse(header) - Date.now()) / 1000)) || 0;
      })(),
    );
  }
  return body?.data as T;
}
