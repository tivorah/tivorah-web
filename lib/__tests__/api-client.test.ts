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

  it("sends one Idempotency-Key per change and reuses it when retrying", async () => {
    let calls = 0;
    const fetchMock = mock.method(globalThis, "fetch", async () => ++calls === 1
      ? new Response(JSON.stringify({ status: false }), { status: 503, headers: { "Retry-After": "0" } })
      : new Response(JSON.stringify({ status: true, data: { ok: 1 } }), { status: 201 }));
    assert.deepEqual(await client.api("/events", { method: "POST", body: JSON.stringify({ a: 1 }) }), { ok: 1 });
    const keys = fetchMock.mock.calls.map((call) => new Headers((call.arguments[1] as RequestInit).headers).get("Idempotency-Key"));
    assert.equal(keys.length, 2);
    assert.ok(keys[0] && keys[0] === keys[1]);
  });

  it("does not retry answers a retry can't fix", async () => {
    const fetchMock = respond(404, { status: false, message: "Not here" });
    await assert.rejects(client.api("/x"));
    assert.equal(fetchMock.mock.callCount(), 1);
  });

  it("treats an error body with a 2xx as a failure", async () => {
    respond(200, { status: false, message: "Choose a ticket" });
    await assert.rejects(client.api("/x"), (error: InstanceType<Client["ApiError"]>) => error.message === "Choose a ticket");
  });

  it("with no review dialog on the page, a nudged post fails quietly (nothing posted unconfirmed)", async () => {
    const fetchMock = respond(422, { status: false, errorCode: "CONTENT_NUDGE", message: "Consider editing" });
    await assert.rejects(client.api("/x", { method: "POST", body: "{}" }), (error: InstanceType<Client["ApiError"]> & { contentReviewed?: boolean }) => error.contentReviewed === true && error.message === "" && error.code === "CONTENT_NUDGE");
    assert.equal(fetchMock.mock.callCount(), 1);
  });

  it("sends a nudged post again, confirmed, when the person chooses Post anyway", async () => {
    const { onContentReview } = await import("../content-review");
    const stop = onContentReview((request) => request?.resolve("post"));
    let calls = 0;
    const fetchMock = mock.method(globalThis, "fetch", async () => ++calls === 1
      ? new Response(JSON.stringify({ status: false, errorCode: "CONTENT_NUDGE", message: "Consider editing" }), { status: 422 })
      : new Response(JSON.stringify({ status: true, data: { id: 9 } }), { status: 201 }));
    assert.deepEqual(await client.api("/x", { method: "POST", body: "{}" }), { id: 9 });
    const second = new Headers((fetchMock.mock.calls[1].arguments[1] as RequestInit).headers);
    assert.equal(second.get("X-Tivorah-Confirm-Content"), "nudge");
    stop();
  });
});
