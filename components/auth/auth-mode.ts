import type { AuthMode } from "./auth-form";

// Maps /auth/<segment> to the form mode, defaulting to sign-in.
export function authModeForPath(path: string): AuthMode {
  const segment = path.split("/")[2];
  return segment === "signup" || segment === "recover" || segment === "verify" || segment === "two-factor" ? segment : "signin";
}
