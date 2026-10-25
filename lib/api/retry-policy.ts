import { randomId } from "../random-id";
/**
 * When the website retries a failed API request, and how long it waits (docs/api-conventions.md).
 * Kept identical to the mobile app's api/retryPolicy.ts.
 *
 * - Reads (GET/HEAD) may always be retried.
 * - Changes (POST/PUT/PATCH/DELETE) are retried only when they carry an Idempotency-Key and a JSON
 *   body: the API then returns the first attempt's result instead of doing it twice. Uploads
 *   (multipart) are never retried automatically.
 * - Only temporary failures are retried: no connection, timeouts, 408/429/502/503/504, or "still
 *   processing" (409 IDEMPOTENCY_REQUEST_IN_PROGRESS). Never 4xx answers like 400/403/404/422,
 *   and never 500, which is a bug that a retry won't fix.
 */
export const MAX_RETRIES = 2;

const RETRYABLE_STATUSES = new Set([408, 429, 502, 503, 504]);
const SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);

export type RetryableFailure = {
  method?: string;
  hasIdempotencyKey: boolean;
  isMultipart: boolean;
  /** No response at all (offline, DNS, timeout, connection reset). */
  network: boolean;
  status?: number;
  errorCode?: string;
  /** Seconds the API asked us to wait (Retry-After). Longer than 10s is shown to the person instead. */
  retryAfter?: number | null;
  attempt: number;
};

export function shouldRetry(failure: RetryableFailure): boolean {
  if (failure.attempt >= MAX_RETRIES) return false;
  const method = (failure.method ?? "GET").toUpperCase();
  const repeatable = SAFE_METHODS.has(method) || (failure.hasIdempotencyKey && !failure.isMultipart);
  if (!repeatable) return false;
  if (failure.network) return true;
  if (failure.retryAfter != null && failure.retryAfter > 10) return false;
  if (failure.status === 409) return failure.errorCode === "IDEMPOTENCY_REQUEST_IN_PROGRESS";
  return failure.status !== undefined && RETRYABLE_STATUSES.has(failure.status);
}

/** Seconds from a Retry-After header (number or HTTP date); null when absent or invalid. */
export function retryAfterSeconds(header: unknown, now = Date.now()): number | null {
  if (typeof header !== "string" || !header.trim()) return null;
  const seconds = Number(header);
  if (Number.isFinite(seconds)) return Math.max(0, seconds);
  const date = Date.parse(header);
  return Number.isFinite(date) ? Math.max(0, Math.ceil((date - now) / 1000)) : null;
}

/** Retry-After when the API sent one (capped at 10s), else 0.5s, 1s… with jitter, capped at 8s. */
export function retryDelayMs(attempt: number, retryAfterHeader?: unknown, random = Math.random): number {
  const retryAfter = retryAfterSeconds(retryAfterHeader);
  if (retryAfter !== null) return Math.min(retryAfter, 10) * 1000;
  const base = Math.min(500 * 2 ** attempt, 8000);
  return Math.round(base / 2 + random() * (base / 2));
}

const MUTATING = new Set(["POST", "PUT", "PATCH", "DELETE"]);
const sleep = (ms: number, signal?: AbortSignal | null) => new Promise<void>((resolve, reject) => {
  if (signal?.aborted) return reject(signal.reason);
  const timer = setTimeout(resolve, ms);
  signal?.addEventListener("abort", () => { clearTimeout(timer); reject(signal.reason); }, { once: true });
});

/**
 * fetch with Tivorah's retry rules: changes get one Idempotency-Key reused on every retry, and
 * temporary failures are retried with backoff (same rules as the app's api/retryPolicy.ts).
 * `makeSignal` gives each attempt its own timeout.
 */
export async function fetchWithRetry(url: string, init: RequestInit, makeSignal: () => AbortSignal): Promise<Response> {
  const method = (init.method ?? "GET").toUpperCase();
  const headers = new Headers(init.headers);
  if (MUTATING.has(method) && !headers.has("Idempotency-Key")) headers.set("Idempotency-Key", randomId());
  const isMultipart = typeof FormData !== "undefined" && init.body instanceof FormData;
  for (let attempt = 0; ; attempt += 1) {
    const signal = makeSignal();
    let response: Response;
    try {
      response = await fetch(url, { ...init, headers, signal });
    } catch (error) {
      // The caller cancelled (not a timeout): stop at once.
      if (init.signal?.aborted) throw error;
      if (!shouldRetry({ method, hasIdempotencyKey: headers.has("Idempotency-Key"), isMultipart, network: true, attempt })) throw error;
      await sleep(retryDelayMs(attempt), init.signal);
      continue;
    }
    if (response.ok) return response;
    const errorCode = response.status === 409 ? await response.clone().json().then((body) => body?.errorCode).catch(() => undefined) : undefined;
    if (!shouldRetry({ method, hasIdempotencyKey: headers.has("Idempotency-Key"), isMultipart, network: false, status: response.status, errorCode, retryAfter: retryAfterSeconds(response.headers.get("Retry-After")), attempt })) return response;
    await sleep(retryDelayMs(attempt, response.headers.get("Retry-After")), init.signal);
  }
}
