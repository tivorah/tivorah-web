"use client";
import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { memberAuth } from "../../lib/auth/client";
import { api } from "../../lib/api/client";
import { LoadingState } from "../ui/loading-state";
type Provider = "google" | "apple";
type Providers = Record<Provider, { enabled: boolean }>;
export function SocialSignIn({
  returnTo,
  disabled,
  onBusy,
}: {
  returnTo: string;
  disabled: boolean;
  onBusy: (busy: boolean) => void;
}) {
  const [providers, setProviders] = useState<Providers | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState<Provider | null>(null);
  const [attempt, setAttempt] = useState(0);
  const lock = useRef(false);
  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    api<Providers>("/public/auth/providers", { signal: controller.signal })
      .then((value) => {
        if (!controller.signal.aborted) {
          setProviders(value);
          setError("");
        }
      })
      .catch(() => {
        if (!controller.signal.aborted)
          setError(
            "Could not check social sign-in. Try again or use your email above.",
          );
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [attempt]);
  async function signIn(provider: Provider) {
    if (disabled || lock.current || !providers?.[provider].enabled) return;
    lock.current = true;
    setBusy(provider);
    onBusy(true);
    setError("");
    const callback = new URL("/auth/complete", window.location.origin);
    callback.searchParams.set("returnTo", returnTo);
    const failure = new URL("/auth/signin", window.location.origin);
    failure.searchParams.set("returnTo", returnTo);
    failure.searchParams.set("socialError", "1");
    try {
      const result = await memberAuth.signIn.social({
        provider,
        callbackURL: callback.href,
        newUserCallbackURL: callback.href,
        errorCallbackURL: failure.href,
      });
      if (result.error)
        throw new Error(
          "Could not start sign-in. Try again or use your email above.",
        );
    } catch {
      setError("Could not start sign-in. Try again or use your email above.");
    } finally {
      lock.current = false;
      setBusy(null);
      onBusy(false);
    }
  }

  return (
    <>
      <p className="auth-divider">or</p>
      <div className="auth-social">
        {loading ? (
          <LoadingState label="Checking sign-in options…" variant="compact" />
        ) : (
          (["google", "apple"] as const).map((provider) => (
            <button
              type="button"
              data-provider={provider}
              aria-label={`Continue with ${provider === "google" ? "Google" : "Apple"}`}
              title={!providers?.[provider].enabled ? "Not available yet" : undefined}
              key={provider}
              disabled={disabled || !!busy || !providers?.[provider].enabled}
              onClick={() => void signIn(provider)}
            >
              <span aria-hidden="true">
                {provider === "google" ? (
                  <Image src="/google-signin.png" alt="" width={20} height={20} />
                ) : (
                  <svg
                    width="20"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                  >
                    <path d="M17 12.4c0-2.1 1.7-3.2 1.8-3.3-1-1.5-2.6-1.7-3.2-1.7-1.4-.1-2.7.8-3.4.8-.7 0-1.8-.8-2.9-.8-1.5 0-2.9.9-3.7 2.2-1.6 2.7-.4 6.8 1.2 9 .8 1.1 1.6 2.2 2.8 2.1 1.1 0 1.5-.7 2.9-.7 1.4 0 1.8.7 3 .7 1.2 0 2-1 2.7-2.1.9-1.2 1.3-2.4 1.3-2.5-.1 0-2.5-.9-2.5-3.7ZM14.8 5.9c.6-.8 1.1-1.9 1-3-.9 0-2.1.6-2.7 1.4-.6.7-1.2 1.9-1 3 1 .1 2.1-.5 2.7-1.4Z" />
                  </svg>
                )}
              </span>
              {busy === provider
                ? "Connecting…"
                : provider === "google" ? "Google" : "Apple"}
            </button>
          ))
        )}
        {!loading && providers && (!providers.google.enabled || !providers.apple.enabled) && (
          <p className="auth-social-help">{!providers.google.enabled && !providers.apple.enabled ? "Google and Apple sign-in are not available yet." : `${!providers.google.enabled ? "Google" : "Apple"} sign-in is not available yet.`}</p>
        )}
        {error && (
          <p role="alert" className="auth-social-help">
            {error}{" "}
            <button
              type="button"
              onClick={() => setAttempt((value) => value + 1)}
              disabled={loading || disabled}
            >
              Retry sign-in options
            </button>
          </p>
        )}
      </div>
    </>
  );
}
