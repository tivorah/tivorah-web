"use client";
import { createAuthClient } from "better-auth/react";
import {
  emailOTPClient,
  twoFactorClient,
  usernameClient,
  inferAdditionalFields,
} from "better-auth/client/plugins";
import { adminApiBase } from "../../app/admin/api-base";

export const memberAuth = createAuthClient({
  baseURL: adminApiBase() || undefined,
  basePath: "/api/auth",
  fetchOptions: { credentials: "include" },
  plugins: [
    usernameClient(),
    emailOTPClient(),
    twoFactorClient(),
    inferAdditionalFields({
      user: {
        dateOfBirth: { type: "string" },
        adultConfirmed: { type: "boolean" },
        termAndCondition: { type: "boolean" },
        privacyTerm: { type: "boolean" },
      },
    }),
  ],
});
