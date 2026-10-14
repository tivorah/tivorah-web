// When the Tivorah app opens a web page (signed in through /auth/handoff), the page offers a way
// straight back. The app opens these pages in the phone's browser; APP_RETURN_URL reopens the app,
// which steps back to exactly where people were (tivorah-mobile app/web-return.tsx).
export const APP_RETURN_URL = process.env.NEXT_PUBLIC_APP_RETURN_URL || "tivorah://web-return";
const KEY = "tivorah-opened-from-app";

export function rememberOpenedFromApp() {
  try { sessionStorage.setItem(KEY, "1"); } catch { /* Storage is optional; the browser's Done button still works. */ }
}

export function openedFromApp() {
  try { return sessionStorage.getItem(KEY) === "1"; } catch { return false; }
}

export function forgetOpenedFromApp() {
  try { sessionStorage.removeItem(KEY); } catch { /* nothing to forget */ }
}
