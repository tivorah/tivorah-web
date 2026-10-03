import { after, before, describe, it } from "node:test";
import assert from "node:assert/strict";

let adminApiBase: () => string;
// The module reads NEXT_PUBLIC_API_URL when it loads, so set it first.
before(async () => {
  process.env.NEXT_PUBLIC_API_URL = "http://192.168.0.4:6001/";
  delete process.env.API_INTERNAL_URL;
  ({ adminApiBase } = await import("../../app/admin/api-base"));
});
const setHost = (hostname: string | null) => {
  if (hostname === null) delete (globalThis as { window?: unknown }).window;
  else (globalThis as { window?: unknown }).window = { location: { hostname } };
};
after(() => setHost(null));

describe("adminApiBase", () => {
  it("uses the configured API on the server, without a trailing slash", () => {
    setHost(null);
    assert.equal(adminApiBase(), "http://192.168.0.4:6001");
  });
  it("reaches a local API through the page's own local hostname so session cookies are sent", () => {
    setHost("localhost");
    assert.equal(adminApiBase(), "http://localhost:6001");
  });
  it("leaves the API untouched when the page is on the same host", () => {
    setHost("192.168.0.4");
    assert.equal(adminApiBase(), "http://192.168.0.4:6001");
  });
  it("never rewrites for a public site", () => {
    setHost("tivorah.com");
    assert.equal(adminApiBase(), "http://192.168.0.4:6001");
  });
});
