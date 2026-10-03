import { afterEach, before, describe, it, mock } from "node:test";
import assert from "node:assert/strict";

type Client = typeof import("../api/client");
let client: Client;
before(async () => {
  process.env.NEXT_PUBLIC_API_URL = "https://api.example";
  client = await import("../api/client");
});
afterEach(() => mock.restoreAll());

const respond = (status: number, body: unknown, headers: Record<string, string> = {}) =>
  mock.method(globalThis, "fetch", async () => new Response(JSON.stringify(body), { status, headers }));

describe("api client", () => {
  it("returns the data payload and sends credentials to the versioned API", async () => {
    const fetchMock = respond(200, { status: true, data: { id: 7 } });
    assert.deepEqual(await client.api("/web/account"), { id: 7 });
    const [url, init] = fetchMock.mock.calls[0].arguments as [string, RequestInit];
    assert.equal(url, "https://api.example/api/v1/web/account");
    assert.equal(init.credentials, "include");
  });

  it("passes through safe validation messages from the API", async () => {
    respond(400, { status: false, message: "Choose a ticket" });
    await assert.rejects(client.api("/x"), (error: InstanceType<Client["ApiError"]>) => error.status === 400 && error.message === "Choose a ticket");
  });

  it("never exposes server error details", async () => {
    respond(500, { status: false, message: "relation \"users\" does not exist" });
    await assert.rejects(client.api("/x"), (error: Error) => error.message === "Tivorah could not complete this request. Please try again.");
  });

  it("reports rate limits with the Retry-After delay", async () => {
    respond(429, {}, { "Retry-After": "12" });
    await assert.rejects(client.api("/x"), (error: InstanceType<Client["ApiError"]>) => error.status === 429 && error.retryAfter === 12 && /Too many requests/.test(error.message));
  });
});
