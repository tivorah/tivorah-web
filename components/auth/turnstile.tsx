"use client";
import { useEffect, useRef } from "react";

// Cloudflare Turnstile, shown only when the API asks for it (sign-in "attack mode" for devices that
// haven't signed in before; tivorah-api/src/services/loginProtection.ts). Usually it passes without
// any clicks. Each token works once, so a new widget is rendered for every attempt.

type TurnstileApi = {
  render: (element: HTMLElement, options: Record<string, unknown>) => string;
  remove: (widgetId: string) => void;
};
declare global { interface Window { turnstile?: TurnstileApi } }

const SCRIPT_URL = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
let loading: Promise<TurnstileApi> | null = null;
function loadTurnstile(): Promise<TurnstileApi> {
  if (window.turnstile) return Promise.resolve(window.turnstile);
  loading ??= new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = SCRIPT_URL;
    script.async = true;
    script.onload = () => (window.turnstile ? resolve(window.turnstile) : reject(new Error("Turnstile unavailable")));
    script.onerror = () => { loading = null; reject(new Error("Turnstile unavailable")); };
    document.head.appendChild(script);
  });
  return loading;
}

export function Turnstile({ siteKey, onToken, onError }: { siteKey: string; onToken: (token: string) => void; onError?: () => void }) {
  const box = useRef<HTMLDivElement>(null);
  const callbacks = useRef({ onToken, onError });
  useEffect(() => { callbacks.current = { onToken, onError }; });
  useEffect(() => {
    let widgetId: string | null = null;
    let cancelled = false;
    void loadTurnstile().then((turnstile) => {
      if (cancelled || !box.current) return;
      widgetId = turnstile.render(box.current, {
        sitekey: siteKey,
        theme: "light",
        appearance: "interaction-only",
        callback: (token: string) => callbacks.current.onToken(token),
        "error-callback": () => callbacks.current.onError?.(),
        "expired-callback": () => callbacks.current.onError?.(),
      });
    }).catch(() => callbacks.current.onError?.());
    return () => { cancelled = true; if (widgetId) window.turnstile?.remove(widgetId); };
  }, [siteKey]);
  return <div ref={box} className="auth-turnstile" aria-label="Security check" />;
}
