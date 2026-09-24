import { createAuthClient } from "better-auth/react";
import { twoFactorClient, usernameClient } from "better-auth/client/plugins";

// Always uses NEXT_PUBLIC_API_URL as configured in .env — no implicit
// rewriting based on where the browser thinks it's running. To point the
// admin panel at a local tivorah-api during development, set
// NEXT_PUBLIC_API_URL=http://localhost:6001 in .env directly.
const authBaseURL = process.env.NEXT_PUBLIC_API_URL;

export const adminAuthClient = createAuthClient({
  baseURL: authBaseURL || undefined,
  basePath: "/api/auth",
  fetchOptions: { credentials: "include" },
  plugins: [usernameClient(), twoFactorClient()],
});
