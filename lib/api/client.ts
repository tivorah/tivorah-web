import type { BookingSetupIssue } from '../../components/business/booking-setup-notice';
import { adminApiBase } from "../../app/admin/api-base";
import { fetchWithRetry } from "./retry-policy";
import { askContentReview, CONFIRM_CONTENT_HEADER, CONTENT_REVIEW_CODES } from "../content-review";

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public retryAfter = 0,
    public setupIssues: BookingSetupIssue[] = [],
    /** The API's machine-readable errorCode (e.g. ORDER_CLOSED), when it sent one. */
    public code?: string,
  ) {
    super(message);
  }
}
export async function api<T>(path: string, init: RequestInit & { timeoutMs?: number } = {}): Promise<T> {
  const base = adminApiBase();
  if (!base)
    throw new ApiError(
      "Tivorah is temporarily unavailable. Please try again later.",
      503,
    );
  const { timeoutMs, ...requestInit } = init;
  // Each attempt gets its own timeout; retries follow lib/api/retry-policy.ts.
  const attemptSignal = () => {
    const timeout = AbortSignal.timeout(timeoutMs ?? (init.body instanceof FormData ? 120000 : 15000));
    return init.signal ? AbortSignal.any([init.signal, timeout]) : timeout;
  };
  const response = await fetchWithRetry(`${base}/api/v1${path}`, {
    ...requestInit,
    credentials: "include",
    cache: "no-store",
    headers: {
      ...(!init.body || init.body instanceof FormData
        ? {}
        : { "Content-Type": "application/json" }),
      ...init.headers,
    },
  }, attemptSignal);
  const body = await response.json().catch(() => null);
  // "Consider editing your post": ask, then send it again confirmed, or fail quietly so the form
  // keeps the text (an empty message shows no error banner).
  if (response.status === 422 && CONTENT_REVIEW_CODES.has(body?.errorCode) && !new Headers(init.headers).has(CONFIRM_CONTENT_HEADER)) {
    const kind = body.errorCode === "CONTENT_BLOCKED" ? "block" : "nudge";
    const choice = await askContentReview(kind, String(body.message ?? ""));
    if (kind === "nudge" && choice === "post") {
      return api<T>(path, { ...init, headers: { ...Object.fromEntries(new Headers(init.headers)), [CONFIRM_CONTENT_HEADER]: "nudge" } });
    }
    throw Object.assign(new ApiError("", 422, 0, [], body.errorCode), { contentReviewed: true });
  }
  // The API never sends an error with a 2xx; treat one as the failure it is.
  if (!response.ok || body?.status === false) {
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
      Array.isArray(body?.setupIssues) ? body.setupIssues : [],
      typeof body?.errorCode === "string" ? body.errorCode : undefined,
    );
  }
  if (typeof window !== "undefined" && !/^\/chat\/.*\/read$/.test(path) && init.method && !["GET", "HEAD"].includes(init.method.toUpperCase())) {
    window.dispatchEvent(new CustomEvent("tivorah:mutation", { detail: path }));
  }
  return body?.data as T;
}
