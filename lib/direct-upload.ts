"use client";
import { ApiError, api } from "./api/client";

// Browser → R2 direct uploads (API: tivorah-api/src/routes/v1/uploads.ts). Files go straight to
// storage in 5 MB chunks, several at once, with retries and fresh links when one expires; the API
// only signs URLs and verifies the finished file. The R2 bucket's CORS must allow PUT from the web
// origin and expose the ETag header.

type Part = { partNumber: number; size: number; url: string };
type Started = { id: string; partSize: number; partCount: number; single?: { url: string; headers: Record<string, string> }; parts?: Part[] };
export type DirectUploadPurpose = "shop" | "listing" | "hub";
export type DirectUploadKind = "image" | "video";

const CONCURRENCY = 4;
const ATTEMPTS = 3;

/** True when the direct route can't be used at all, so the caller should use its form upload. */
export function directUploadUnavailable(error: unknown) {
  return (error instanceof ApiError && (error.status === 503 || error.status === 404)) || error instanceof DirectTransportError;
}
class DirectTransportError extends Error {}

export function put(url: string, body: Blob, headers: Record<string, string>, onProgress: (loaded: number) => void, signal?: AbortSignal) {
  return new Promise<string>((resolve, reject) => {
    if (signal?.aborted) { reject(new DOMException("Upload cancelled", "AbortError")); return; }
    const request = new XMLHttpRequest();
    const abort = () => request.abort();
    const cleanup = () => signal?.removeEventListener("abort", abort);
    request.open("PUT", url);
    request.timeout = 120_000;
    for (const [name, value] of Object.entries(headers)) request.setRequestHeader(name, value);
    request.upload.onprogress = (event) => onProgress(event.loaded);
    request.onload = () => {
      cleanup();
      if (request.status >= 200 && request.status < 300) resolve((request.getResponseHeader("ETag") || "").replaceAll('"', ""));
      else reject(Object.assign(new Error(`Upload chunk failed (${request.status}).`), { status: request.status }));
    };
    request.onerror = () => { cleanup(); reject(new DirectTransportError("The connection to storage failed.")); };
    request.ontimeout = () => { cleanup(); reject(new Error("Upload timed out. Please try again.")); };
    request.onabort = () => { cleanup(); reject(new DOMException("Upload cancelled", "AbortError")); };
    signal?.addEventListener("abort", abort, { once: true });
    try { request.send(body); } catch (error) { cleanup(); reject(error); }
  });
}

export async function directUpload<T = Record<string, unknown>>(file: File, options: { purpose: DirectUploadPurpose; kind: DirectUploadKind; durationSeconds?: number; onProgress?: (fraction: number) => void; signal?: AbortSignal }): Promise<T & { id: string }> {
  const started = await api<Started>("/uploads", { method: "POST", body: JSON.stringify({ purpose: options.purpose, kind: options.kind, mimeType: file.type, size: file.size, fileName: file.name || `upload.${options.kind === "video" ? "mp4" : "jpg"}`, ...(options.durationSeconds ? { durationSeconds: Math.ceil(options.durationSeconds) } : {}) }), signal: options.signal });
  const controller = new AbortController();
  const abort = () => controller.abort();
  options.signal?.addEventListener("abort", abort, { once: true });
  if (options.signal?.aborted) controller.abort();
  const signal = controller.signal;
  const loaded = new Map<number, number>();
  const report = () => options.onProgress?.(Math.min(1, [...loaded.values()].reduce((sum, value) => sum + value, 0) / file.size));
  try {
    if (started.single) {
      await put(started.single.url, file, started.single.headers, (bytes) => { loaded.set(1, bytes); report(); }, signal);
      return await api<T & { id: string }>(`/uploads/${started.id}/complete`, { method: "POST", body: JSON.stringify({ parts: [] }), signal, timeoutMs: 60000 });
    }
    const urls = new Map((started.parts ?? []).map((part) => [part.partNumber, part.url]));
    const etags = new Map<number, string>();
    const queue = Array.from({ length: started.partCount }, (_, index) => index + 1);
    async function sendPart(partNumber: number) {
      const chunk = file.slice((partNumber - 1) * started.partSize, Math.min(file.size, partNumber * started.partSize));
      for (let attempt = 1; ; attempt++) {
        try {
          const etag = await put(urls.get(partNumber)!, chunk, {}, (bytes) => { loaded.set(partNumber, bytes); report(); }, signal);
          if (!etag) throw new DirectTransportError("Storage didn’t confirm the upload.");
          etags.set(partNumber, etag);
          return;
        } catch (error) {
          if (signal.aborted || (error instanceof DirectTransportError && !etags.size)) throw error;
          if (attempt >= ATTEMPTS) throw error;
          loaded.set(partNumber, 0);
          // Links last a limited time: ask for a fresh one for this chunk, then retry.
          if ((error as { status?: number }).status === 403) {
            const fresh = await api<{ parts: Part[] }>(`/uploads/${started.id}/parts`, { method: "POST", body: JSON.stringify({ partNumbers: [partNumber] }), signal });
            urls.set(partNumber, fresh.parts[0].url);
          }
          await new Promise((resolve) => setTimeout(resolve, 600 * 2 ** (attempt - 1)));
        }
      }
    }
    let failure: { error: unknown } | undefined;
    const workers = Array.from({ length: Math.min(CONCURRENCY, queue.length) }, async () => {
      try {
        for (let next = queue.shift(); next; next = queue.shift()) await sendPart(next);
      } catch (error) { failure ??= { error }; controller.abort(); throw error; }
    });
    await Promise.allSettled(workers);
    if (failure) throw failure.error;
    return await api<T & { id: string }>(`/uploads/${started.id}/complete`, { method: "POST", body: JSON.stringify({ parts: [...etags].map(([partNumber, etag]) => ({ partNumber, etag })) }), signal, timeoutMs: 60000 });
  } catch (error) {
    void api(`/uploads/${started.id}`, { method: "DELETE" }).catch(() => undefined);
    throw error;
  } finally {
    options.signal?.removeEventListener("abort", abort);
  }
}
