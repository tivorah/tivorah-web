// Sign-in handoff from the app (components/auth/session-handoff.tsx): when the one-time token is
// missing (the page was reloaded) or already used, carry on if this browser is already signed in to
// the same account the app is using. A sign-in for a different account never counts.
export function continuesWithSession(session: { user?: { id?: string | number } | null } | null | undefined, expectedAccount: string | null) {
  const id = session?.user?.id;
  if (id === undefined || id === null || id === "") return false;
  return !expectedAccount || String(id) === expectedAccount;
}

/** Keeps only an account id the app passed (digits), for the reload-safe address. */
export function accountHint(value: string | null) {
  return value && /^\d{1,12}$/.test(value) ? value : null;
}
