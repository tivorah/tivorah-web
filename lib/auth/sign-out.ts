"use client";

import { useSyncExternalStore } from "react";
import { memberAuth } from "./client";

// Member sign-out that goes straight to the sign-in screen. While it runs, the
// session becomes empty before the browser navigates; AccountGate reads this flag
// and keeps showing the current page (with the button's progress state) instead
// of flashing its "signed out" card.
let signingOut = false;
const listeners = new Set<() => void>();
const notify = () => listeners.forEach((listener) => listener());

export function useSigningOut() {
  return useSyncExternalStore(
    (listener) => { listeners.add(listener); return () => listeners.delete(listener); },
    () => signingOut,
    () => false,
  );
}

/** Signs out and replaces the page with /auth/signin. Resolves with an error message on failure. */
export async function signOutToSignIn(): Promise<string | null> {
  if (signingOut) return null;
  signingOut = true;
  notify();
  try {
    const result = await memberAuth.signOut();
    if (result.error) throw new Error("Could not sign out. Please try again.");
    window.location.replace("/auth/signin");
    return null;
  } catch (cause) {
    signingOut = false;
    notify();
    return cause instanceof Error ? cause.message : "Could not sign out. Please try again.";
  }
}
