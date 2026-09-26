import { createAuthClient } from "better-auth/react";
import { twoFactorClient, usernameClient } from "better-auth/client/plugins";
import { adminApiBase } from "./api-base";

export const adminAuthClient = createAuthClient({
  baseURL: adminApiBase() || undefined,
  basePath: "/api/auth",
  fetchOptions: { credentials: "include" },
  plugins: [usernameClient(), twoFactorClient()],
});
