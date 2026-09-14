import { createAuthClient } from "better-auth/react";
import { twoFactorClient, usernameClient } from "better-auth/client/plugins";

const configuredBaseURL = process.env.NEXT_PUBLIC_API_URL;
const authBaseURL = (() => {
  if (!configuredBaseURL || typeof window === "undefined") return configuredBaseURL;
  if (!['localhost', '127.0.0.1'].includes(window.location.hostname)) return configuredBaseURL;
  const url = new URL(configuredBaseURL);
  url.hostname = window.location.hostname;
  return url.origin;
})();

export const adminAuthClient = createAuthClient({
  baseURL: authBaseURL || undefined,
  basePath: "/api/auth",
  fetchOptions: { credentials: "include" },
  plugins: [usernameClient(), twoFactorClient()],
});
