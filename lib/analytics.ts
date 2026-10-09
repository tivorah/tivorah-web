import posthog, { type CaptureResult } from "posthog-js";

// PostHog analytics and error monitoring for the website. Same rules as the mobile app
// (TIVORAH_ANALYTICS_PLAN.md): no autocapture of what people type or click, no session replay,
// and no private tokens from ticket, refund or transfer links.
const key = process.env.NEXT_PUBLIC_POSTHOG_KEY?.trim() ?? "";
const host = process.env.NEXT_PUBLIC_POSTHOG_HOST?.trim() || "https://us.i.posthog.com";
export const analyticsConfigured = key.length > 0;

// Random tokens and UUIDs; route words (lowercase letters and hyphens only) are kept.
const TOKEN_SEGMENT = /^(?:(?![a-z-]+$)[A-Za-z0-9_-]{16,}|[0-9a-f]{8}-[0-9a-f-]{27,})$/i;

/** Drops query strings and fragments, and replaces token-like path segments. */
export function sanitizeUrl(value: unknown): unknown {
  if (typeof value !== "string" || !value) return value;
  try {
    const url = new URL(value, "https://tivorah.com");
    const path = url.pathname.split("/").map((part) => (TOKEN_SEGMENT.test(part) ? ":token" : part)).join("/");
    return /^https?:\/\//.test(value) ? `${url.origin}${path}` : path;
  } catch {
    return null;
  }
}

const URL_PROPERTIES = ["$current_url", "$pathname", "$referrer", "$initial_referrer", "$prev_pageview_pathname", "$prev_pageview_url"];

function scrub(event: CaptureResult | null): CaptureResult | null {
  if (!event) return event;
  for (const bag of [event.properties, event.$set, event.$set_once] as (Record<string, unknown> | undefined)[]) {
    if (!bag) continue;
    for (const name of URL_PROPERTIES) if (name in bag) bag[name] = sanitizeUrl(bag[name]);
  }
  return event;
}

let started = false;
export function startAnalytics() {
  if (!analyticsConfigured || started || typeof window === "undefined") return;
  started = true;
  posthog.init(key, {
    api_host: host,
    capture_pageview: "history_change",
    capture_pageleave: true,
    autocapture: false,
    disable_session_recording: true,
    mask_all_text: true,
    mask_all_element_attributes: true,
    respect_dnt: true,
    person_profiles: "identified_only",
    capture_exceptions: { capture_unhandled_errors: true, capture_unhandled_rejections: true, capture_console_errors: false },
    before_send: scrub,
  });
}

export function identifyAccount(id: number) {
  if (started) posthog.identify(String(id));
}

export function resetAnalytics() {
  if (started) posthog.reset();
}

/** Report a handled error, e.g. from a Next.js error boundary. */
export function captureError(error: unknown, context: Record<string, string | number | boolean> = {}) {
  if (started) posthog.captureException(error, context);
}
