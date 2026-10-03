import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { webEnvErrors } from "../env-validation";

describe("webEnvErrors", () => {
  it("accepts HTTP and HTTPS origins", () => {
    assert.deepEqual(webEnvErrors({ NEXT_PUBLIC_API_URL: "http://192.168.0.4:6001", NEXT_PUBLIC_SITE_URL: "https://tivorah.com" }), []);
  });
  it("reports every missing value at once", () => {
    assert.deepEqual(webEnvErrors({}).sort(), ["NEXT_PUBLIC_API_URL is required", "NEXT_PUBLIC_SITE_URL is required"]);
  });
  it("rejects non-web protocols and malformed URLs", () => {
    assert.deepEqual(webEnvErrors({ NEXT_PUBLIC_API_URL: "ftp://api", NEXT_PUBLIC_SITE_URL: "tivorah.com" }).sort(), [
      "NEXT_PUBLIC_API_URL must be an HTTP or HTTPS URL",
      "NEXT_PUBLIC_SITE_URL must be an HTTP or HTTPS URL",
    ]);
  });
});
