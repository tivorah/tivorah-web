// When the Tivorah app opens a web page (signed in through /auth/handoff). The app shows these pages
// in its own browser screen with a close button; APP_RETURN_URL (offered when the sign-in handoff
// fails) closes it, or reopens the app from another browser (tivorah-mobile app/web-return.tsx).
export const APP_RETURN_URL = process.env.NEXT_PUBLIC_APP_RETURN_URL || "tivorah://web-return";
export const OPENED_FROM_APP_KEY = "tivorah-opened-from-app";
const KEY = OPENED_FROM_APP_KEY;

export function rememberOpenedFromApp() {
  try { sessionStorage.setItem(KEY, "1"); } catch { /* Storage is optional; the browser's Done button still works. */ }
}

export function openedFromApp() {
  try { return sessionStorage.getItem(KEY) === "1"; } catch { return false; }
}

